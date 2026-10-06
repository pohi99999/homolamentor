// node --test --experimental-strip-types src/lib/chat/__tests__/*.test.ts   (npm run test:chat)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toTurns, redactPersonal, detectLang, answer, uiMessageStream, UI_STREAM_HEADERS, DEFAULT_CHAT_MODEL, CONTACT_EMAIL, fallbackText, generationConfig } from '../chatCore.ts';
// The exact client the site ships: @ai-sdk/react 4 bundles AI SDK 7 (its own nested "ai").
import { DefaultChatTransport, readUIMessageStream } from '../../../../node_modules/@ai-sdk/react/node_modules/ai/dist/index.js';

const ui = (role: string, text: string, id = Math.random().toString(36).slice(2)) => ({ id, role, parts: [{ type: 'text', text }] });

test('UI messages (parts) become Gemini turns; the last one is the user, a leading answer is dropped', () => {
  const turns = toTurns([ui('assistant', 'Üdv!'), ui('user', 'Mi a Clandestino Tópark ára?'), ui('assistant', '24 millió'), ui('user', 'És hány ház?')]);
  assert.deepEqual(turns.map((t) => t.role), ['user', 'model', 'user']);
  assert.equal(turns[0].text, 'Mi a Clandestino Tópark ára?');
  assert.deepEqual(toTurns([{ role: 'user', content: 'régi kliens' }]), [{ role: 'user', text: 'régi kliens' }]);
  assert.deepEqual(toTurns([ui('assistant', 'csak válasz')]), [], 'no user turn -> nothing to ask');
  assert.deepEqual(toTurns('nem tömb'), []);
  assert.equal(toTurns([ui('user', 'x'.repeat(5000))])[0].text.length, 2000);
  assert.equal(toTurns(Array.from({ length: 30 }, (_, i) => ui(i % 2 ? 'assistant' : 'user', `m${i}`))).length <= 12, true);
});

test('e-mail addresses and phone numbers are masked before Gemini; prices stay', () => {
  assert.equal(redactPersonal('Írjon: kiss.anna@example.com vagy +36 30 123 4567'), 'Írjon: [e-mail] vagy [telefonszám]');
  assert.equal(redactPersonal('06-30/123-4567'), '[telefonszám]');
  assert.equal(redactPersonal('Ár: 24.000.000 Ft, 24 000 000 HUF'), 'Ár: 24.000.000 Ft, 24 000 000 HUF');
  assert.equal(redactPersonal('115 ha, 2024-ben épült'), '115 ha, 2024-ben épült');
});

test('language guess for the fallback answer', () => {
  assert.equal(detectLang('Mi a Clandestino Tópark ára?'), 'hu');
  assert.equal(detectLang('What is the price of the Clandestino guesthouses?'), 'en');
  assert.equal(detectLang('Wie ist der Preis bitte?'), 'de');
  assert.equal(detectLang('Bonjour, quel est le prix ?'), 'fr');
});

test('a Gemini answer: flash-lite by default, masked text sent, the key only in the header', async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fetchStub = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'A ház ára 24 millió Ft.' }] } }] }), { status: 200 });
  }) as unknown as typeof fetch;
  const out = await answer([{ role: 'user', text: 'Ár? Hívjon: +36 30 123 4567' }], 'SYS', 'test-key-123', {}, { fetch: fetchStub });
  assert.deepEqual(out, { text: 'A ház ára 24 millió Ft.', source: 'gemini' });
  assert.match(seen!.url, new RegExp(`/models/${DEFAULT_CHAT_MODEL}:generateContent$`));
  assert.equal((seen!.init.headers as Record<string, string>)['x-goog-api-key'], 'test-key-123');
  const sent = String(seen!.init.body);
  assert.ok(!sent.includes('test-key-123') && !sent.includes('123 4567') && sent.includes('[telefonszám]'));
  assert.ok(JSON.parse(sent).system_instruction.parts[0].text === 'SYS');
});

test('no key, 429, 503, network error or empty answer -> the friendly answer, never an exception', async () => {
  const q = [{ role: 'user' as const, text: 'Mi a Clandestino Tópark ára?' }];
  const logged: string[] = []; const orig = console.error; console.error = (...a: unknown[]) => { logged.push(a.join(' ')); };
  try {
    assert.equal((await answer(q, 'S', undefined)).reason, 'no_key');
    for (const status of [429, 503, 500]) {
      const out = await answer(q, 'S', 'k-secret', {}, { fetch: (async () => new Response('{"error":{"message":"quota, key=k-secret"}}', { status })) as unknown as typeof fetch });
      assert.equal(out.source, 'fallback'); assert.equal(out.reason, `gemini_${status}`);
      assert.ok(out.text.includes(CONTACT_EMAIL) && out.text.startsWith('Köszönjük'));
    }
    assert.equal((await answer(q, 'S', 'k', {}, { fetch: (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch })).reason, 'network');
    assert.equal((await answer(q, 'S', 'k', {}, { fetch: (async () => new Response('{"candidates":[]}', { status: 200 })) as unknown as typeof fetch })).reason, 'empty');
  } finally { console.error = orig; }
  assert.ok(logged.every((l) => !l.includes('k-secret')), 'the key and the error body never reach the log');
});

test('the response is read by the site\'s own AI SDK 7 client (DefaultChatTransport + readUIMessageStream)', async () => {
  const body = uiMessageStream('A Clandestino Tópark vendégházainak ára 24 000 000 HUF / ház.');
  const transport = new DefaultChatTransport({ api: '/api/chat', fetch: (async () => new Response(body, { headers: UI_STREAM_HEADERS })) as unknown as typeof fetch });
  const stream = await transport.sendMessages({ chatId: 'c1', messages: [ui('user', 'Mi a Clandestino Tópark ára?')] as never, trigger: 'submit-message', messageId: undefined, abortSignal: undefined });
  let last: { role: string; parts: { type: string; text?: string }[] } | undefined;
  for await (const m of readUIMessageStream({ stream })) last = m as typeof last;
  assert.equal(last!.role, 'assistant');
  assert.equal(last!.parts.filter((p) => p.type === 'text').map((p) => p.text).join(''), 'A Clandestino Tópark vendégházainak ára 24 000 000 HUF / ház.');
});

test('the fallback answers carry the contact e-mail in all four languages', () => {
  for (const l of ['hu', 'en', 'de', 'fr'] as const) assert.ok(fallbackText(l).includes(CONTACT_EMAIL));
});

test('why the chat was dead even with a key: the old plain-text answer is not readable by this client', async () => {
  // the old route returned streamText(...).toTextStreamResponse(): plain text, no UI message stream
  const transport = new DefaultChatTransport({ api: '/api/chat', fetch: (async () => new Response('A ház ára 24 millió Ft.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })) as unknown as typeof fetch });
  const stream = await transport.sendMessages({ chatId: 'c2', messages: [ui('user', 'Ár?')] as never, trigger: 'submit-message', messageId: undefined, abortSignal: undefined });
  let text = ''; let failed = false;
  try {
    for await (const m of readUIMessageStream({ stream })) text = (m as { parts: { type: string; text?: string }[] }).parts.filter((p) => p.type === 'text').map((p) => p.text).join('');
  } catch { failed = true; }
  assert.ok(failed || text === '', `the old format must not render as an answer (got "${text}")`);
});

test('generation config: thinkingBudget only for 2.5 models', () => {
  assert.deepEqual(generationConfig('gemini-2.5-flash').thinkingConfig, { thinkingBudget: 0 });
  assert.equal('thinkingConfig' in generationConfig(DEFAULT_CHAT_MODEL), false);
  assert.equal(DEFAULT_CHAT_MODEL, 'gemini-3.5-flash-lite');
});
