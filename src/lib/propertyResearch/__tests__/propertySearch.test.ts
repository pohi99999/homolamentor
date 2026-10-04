// node --test --experimental-strip-types src/lib/propertyResearch/__tests__/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkOrigin, filterByOrigin, isDeniedPortal, normalizeUrl, quoteFoundIn } from '../sourceCheck.ts';
import { WindowLimiter, DailyCap, budapestDay, looksLikeBot } from '../limits.ts';
import { sealCard, openCard, type CardSecret } from '../cardToken.ts';
import { parseGrounded, resolveSourceUrls, extractJson, type GroundedAnswer } from '../gemini.ts';
import { runPreview, type PreviewDeps } from '../preview.ts';

const REAL = 'https://e-arveres.mnv.hu/arveres/12345';
const REAL2 = 'https://www.szeged.hu/palyazat/ipari-telek-2026';

test('origin: a URL that was among the search results passes (normalised)', () => {
  assert.equal(checkOrigin('https://E-ARVERES.mnv.hu/arveres/12345/?utm=x#a', [REAL]), 'ok');
  assert.equal(normalizeUrl('http://www.szeged.hu/palyazat/ipari-telek-2026/'), 'szeged.hu/palyazat/ipari-telek-2026');
});

test('origin: a made-up URL is dropped (negative probe)', () => {
  assert.equal(checkOrigin('https://e-arveres.mnv.hu/arveres/99999', [REAL]), 'not_in_results');
  assert.equal(checkOrigin('https://kitalalt-ipari-park.hu/telek', [REAL, REAL2]), 'not_in_results');
  assert.equal(checkOrigin('nem-url', [REAL]), 'invalid_url');
});

test('portals on the denylist are dropped even when the search returned them', () => {
  const portal = 'https://ingatlan.com/szeged/elado+ipari-terulet/123';
  assert.equal(isDeniedPortal(portal), true);
  assert.equal(isDeniedPortal('https://www.ingatlan.com/x'), true);
  assert.equal(isDeniedPortal('https://nemingatlan.com.hu/x'), false);
  assert.equal(checkOrigin(portal, [portal]), 'denied_portal');
});

test('filterByOrigin keeps only the real ones and names why the others went', () => {
  const r = filterByOrigin([{ sourceUrl: REAL }, { sourceUrl: 'https://fake.hu/a' }, { sourceUrl: 'https://jofogas.hu/b' }], [REAL, 'https://jofogas.hu/b']);
  assert.deepEqual(r.kept.map((k) => k.sourceUrl), [REAL]);
  assert.deepEqual(r.dropped.map((d) => d.verdict), ['not_in_results', 'denied_portal']);
});

test('content check: the quote must really be on the page (accents and spacing normalised)', () => {
  const page = 'Az ingatlan területe   1,52 HEKTÁR, teljes közművel, kikiáltási ár 180 millió Ft.';
  assert.equal(quoteFoundIn(page, 'területe 1,52 hektar, teljes kozmuvel'), true);
  assert.equal(quoteFoundIn(page, 'területe 2,4 hektár, teljes közművel'), false);
  assert.equal(quoteFoundIn(page, 'hektár'), false); // too short to prove anything
});

test('rate limit: 5 per window, then retryAfter; another key is independent', () => {
  let t = 1_000_000;
  const l = new WindowLimiter(5, 3_600_000, () => t);
  for (let i = 0; i < 5; i++) assert.equal(l.take('ip-a').ok, true);
  const sixth = l.take('ip-a');
  assert.equal(sixth.ok, false);
  assert.ok(!sixth.ok && sixth.retryAfter > 0);
  assert.equal(l.take('ip-b').ok, true);
  t += 3_600_001;
  assert.equal(l.take('ip-a').ok, true);
});

test('daily cap: refuses after the cap, resets at Budapest midnight', () => {
  let t = Date.UTC(2026, 9, 4, 21, 0); // 23:00 in Budapest (CEST)
  const cap = new DailyCap(2, () => t);
  assert.equal(cap.take(), true);
  assert.equal(cap.take(), true);
  assert.equal(cap.take(), false);
  t = Date.UTC(2026, 9, 4, 22, 30); // 00:30 next day in Budapest
  assert.equal(budapestDay(t), '2026-10-05');
  assert.equal(cap.take(), true);
});

test('bot check: honeypot or too-fast form = bot; a human fill passes', () => {
  const now = 10_000_000;
  assert.equal(looksLikeBot('http://spam', now - 60_000, now), true);
  assert.equal(looksLikeBot('', now - 500, now), true);
  assert.equal(looksLikeBot('', undefined, now), true);
  assert.equal(looksLikeBot('', now - 30_000, now), false);
});

const SECRET = 'test-secret-for-sealing-0123456789';
const sample: CardSecret = { sourceUrl: REAL, quote: 'q', category: 'Ipari terület', place: 'Szeged', area: '1,5 ha', priceBand: null, verification: 'pending', query: 'szeged ipari', issuedAt: 1 };

test('card token: round-trips, unreadable by the visitor, tamper and wrong secret rejected', () => {
  const tok = sealCard(sample, SECRET);
  assert.deepEqual(openCard(tok, SECRET), sample);
  assert.equal(tok.includes('e-arveres') || Buffer.from(tok, 'base64url').toString('utf8').includes('e-arveres'), false);
  const flipped = tok.slice(0, -2) + (tok.at(-2) === 'A' ? 'B' : 'A') + tok.at(-1);
  assert.equal(openCard(flipped, SECRET), null);
  assert.equal(openCard(tok, 'another-secret'), null);
  assert.equal(openCard('pelda-1', SECRET), null);
});

test('parseGrounded reads text, grounding chunks and search queries', () => {
  const g = parseGrounded({ candidates: [{ content: { parts: [{ text: '{"cards":[]}' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc', title: 'mnv.hu' } }], webSearchQueries: ['szeged ipari terület'] } }] });
  assert.equal(g.text, '{"cards":[]}');
  assert.equal(g.sourceUris.length, 1);
  assert.deepEqual(g.searchQueries, ['szeged ipari terület']);
  assert.deepEqual(parseGrounded({}).sourceUris, []);
});

test('resolveSourceUrls follows only the redirect wrapper, via the Location header', async () => {
  const calls: string[] = [];
  const fakeFetch = (async (u: string) => {
    calls.push(String(u));
    return new Response(null, { status: 302, headers: { location: REAL } });
  }) as unknown as typeof fetch;
  const out = await resolveSourceUrls(['https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc', REAL2], { fetch: fakeFetch });
  assert.deepEqual(out, [REAL, REAL2]);
  assert.equal(calls.length, 1); // the plain URL was not fetched
});

test('extractJson tolerates a fenced block', () => {
  assert.deepEqual(extractJson('```json\n{"cards":[]}\n```'), { cards: [] });
  assert.equal(extractJson('no json here'), null);
});

function deps(modelText: string, resultUrls: string[], pages: Record<string, string> = {}): PreviewDeps {
  const answer: GroundedAnswer = { text: modelText, sourceUris: resultUrls.map((uri) => ({ uri, title: null })), searchQueries: [] };
  return { grounded: async () => answer, resolve: async (u) => u, pageText: async (u) => pages[u] ?? null, secret: SECRET, now: () => 42 };
}

test('stage 1: a real source -> card without URL; a made-up URL never reaches the visitor', async () => {
  const model = JSON.stringify({ cards: [
    { category: 'Ipari terület', place: 'Szeged', area: 'kb. 1,5 ha', utilities: 'víz, villany', priceBand: '180 M Ft', sourceUrl: REAL, quote: 'Az ingatlan területe 1,52 hektár, teljes közművel.' },
    { category: 'Ipari terület', place: 'Szeged', area: '2 ha', utilities: null, priceBand: null, sourceUrl: 'https://kitalalt-hirdetes.hu/telek/1', quote: 'kitalált' },
  ] });
  const out = await runPreview('szegedi iparterület 1,5 ha közműves', deps(model, [REAL], { [REAL]: 'Az ingatlan területe 1,52 hektár, teljes közművel. Kikiáltási ár 180 millió Ft.' }));
  assert.equal(out.response.status, 'ok');
  const cards = out.response.status === 'ok' ? out.response.cards : [];
  assert.equal(cards.length, 1);
  assert.equal(cards[0].verification, 'verified');
  assert.equal(JSON.stringify(cards).includes('http'), false);
  assert.equal(JSON.stringify(cards).includes('kitalalt'), false);
  assert.equal(openCard(cards[0].id, SECRET)?.sourceUrl, REAL);
  assert.deepEqual(out.audit.dropped, [{ sourceUrl: 'https://kitalalt-hirdetes.hu/telek/1', verdict: 'not_in_results' }]);
});

test('stage 1: only made-up sources -> empty, not invented cards', async () => {
  const model = JSON.stringify({ cards: [{ category: 'Telek', place: 'Szeged', sourceUrl: 'https://nincs-ilyen.hu/a', quote: 'x' }] });
  const out = await runPreview('szeged telek', deps(model, [REAL]));
  assert.deepEqual(out.response, { status: 'empty' });
});

test('stage 1: a portal page from the search is dropped; unparseable model text is empty', async () => {
  const portal = 'https://ingatlan.com/szeged/123';
  const out = await runPreview('szeged telek', deps(JSON.stringify({ cards: [{ category: 'Telek', place: 'Szeged', sourceUrl: portal, quote: 'x' }] }), [portal]));
  assert.deepEqual(out.response, { status: 'empty' });
  assert.equal(out.audit.dropped[0].verdict, 'denied_portal');
  assert.deepEqual((await runPreview('szeged telek', deps('sajnos nem találtam', [REAL]))).response, { status: 'empty' });
});

test('stage 1: an unverifiable quote stays "pending"; contact data is scrubbed from the fields', async () => {
  const model = JSON.stringify({ cards: [{ category: 'Ipari terület', place: 'Szeged, hívja: +36 30 123 4567 info@x.hu', area: '1,5 ha', sourceUrl: REAL2, quote: 'Ez a mondat nincs az oldalon sehol.' }] });
  const out = await runPreview('szeged', deps(model, [REAL2], { [REAL2]: 'egészen más szöveg' }));
  const c = out.response.status === 'ok' ? out.response.cards[0] : null;
  assert.equal(c?.verification, 'pending');
  assert.equal(/\d{3}|@/.test(c?.place ?? ''), false);
});
