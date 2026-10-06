// The site chatbot on the HM free Gemini key (card 06c41d5e, Péter GO 2026-10-06).
// Pure logic, so it runs under node --test: the route only wires env, limits and the response.
//
// Free tier: "Used to improve our products: Yes" (ai.google.dev pricing, measured 2026-10-04, see
// propertyResearch/gemini.ts). Visitors may type their e-mail or phone number into a chat, so those
// are masked before anything is sent to Gemini.
import { GEMINI_BASE } from '../propertyResearch/gemini.ts';

// A different model from the property search (gemini-2.5-flash): Google lists the free-tier limits
// per model, so the chat should not use up the search's daily requests (from the docs, not measured
// here). The chat's own daily cap in the route is the guard that does not depend on that.
export const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash-lite';
export const MAX_TURNS = 12;
export const MAX_CHARS_PER_TURN = 2000;
export const CONTACT_EMAIL = 'office.homlamentor@gmail.com';

export type Lang = 'hu' | 'en' | 'de' | 'fr';
export type ChatTurn = { role: 'user' | 'model'; text: string };
export type ChatDeps = { fetch: typeof fetch };
export type ChatOutcome = { text: string; source: 'gemini' | 'fallback'; reason?: string };

type IncomingPart = { type?: string; text?: string };
type IncomingMessage = { role?: string; parts?: IncomingPart[]; content?: string };

/** UI messages (AI SDK 7: parts[]; older clients: content) -> the last turns, ending with the user. */
export function toTurns(messages: unknown): ChatTurn[] {
  if (!Array.isArray(messages)) return [];
  const turns: ChatTurn[] = [];
  for (const m of messages as IncomingMessage[]) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = Array.isArray(m.parts)
      ? m.parts.filter((p) => p && p.type === 'text' && typeof p.text === 'string').map((p) => p.text).join('\n')
      : typeof m.content === 'string' ? m.content : '';
    const clean = text.trim().slice(0, MAX_CHARS_PER_TURN);
    if (clean) turns.push({ role: m.role === 'user' ? 'user' : 'model', text: clean });
  }
  const last = turns.slice(-MAX_TURNS);
  while (last.length && last[0].role !== 'user') last.shift(); // Gemini wants the user first
  return last.length && last[last.length - 1].role === 'user' ? last : [];
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 8+ digits, optionally with +, spaces, dashes, dots, slashes or brackets between them
const PHONE_RE = /(?:\+?\d[\s\-./()]*){8,}\d/g;

/** Masks e-mail addresses and phone numbers; prices like "24.000.000" stay (they are not phones). */
export function redactPersonal(text: string): string {
  return text
    .replace(EMAIL_RE, '[e-mail]')
    .replace(PHONE_RE, (m) => (/^\d{1,3}([.\s]\d{3})+$/.test(m.trim()) ? m : '[telefonszám]'));
}

/** Rough language guess for the fallback answer (the model itself answers in the user's language). */
export function detectLang(text: string): Lang {
  const t = ` ${text.toLowerCase()} `;
  if (/[őű]/.test(t) || /\s(mi|mennyi|hogy|van|szeretnék|ingatlan|kérem|és|a|az|ár|ára)\s/.test(t)) return 'hu';
  if (/[ß]/.test(t) || /\s(der|die|das|und|ich|wie|ist|nicht|preis|bitte)\s/.test(t)) return 'de';
  if (/[àâçèêëîïôœùû]/.test(t) || /\s(le|la|les|et|est|je|vous|prix|bonjour|combien)\s/.test(t)) return 'fr';
  return 'en';
}

const FALLBACK: Record<Lang, string> = {
  hu: `Köszönjük az érdeklődést! A chat-asszisztens most nem tud válaszolni (elérte a napi keretét, vagy átmenetileg nem elérhető). Írjon nekünk az ${CONTACT_EMAIL} címre, vagy használja a Kapcsolat oldal űrlapját, és kollégánk hamarosan válaszol.`,
  en: `Thank you for your interest! The chat assistant cannot answer right now (it has reached its daily limit or is temporarily unavailable). Please write to ${CONTACT_EMAIL} or use the form on the Contact page, and a colleague will reply soon.`,
  de: `Vielen Dank für Ihr Interesse! Der Chat-Assistent kann gerade nicht antworten (Tageslimit erreicht oder vorübergehend nicht verfügbar). Bitte schreiben Sie an ${CONTACT_EMAIL} oder nutzen Sie das Formular auf der Kontaktseite, ein Kollege meldet sich in Kürze.`,
  fr: `Merci de votre intérêt ! L'assistant ne peut pas répondre pour le moment (limite quotidienne atteinte ou indisponibilité temporaire). Écrivez-nous à ${CONTACT_EMAIL} ou utilisez le formulaire de la page Contact, un collègue vous répondra rapidement.`,
};
export const fallbackText = (lang: Lang) => FALLBACK[lang];

/** One Gemini call; any failure (no key, 429, 503, network, empty answer) becomes the fallback. */
export async function answer(
  turns: ChatTurn[],
  system: string,
  apiKey: string | undefined,
  opts: { model?: string } = {},
  deps: ChatDeps = { fetch: (...a) => fetch(...a) },
): Promise<ChatOutcome> {
  const lang = detectLang(turns.filter((t) => t.role === 'user').map((t) => t.text).join(' '));
  if (!apiKey) return { text: fallbackText(lang), source: 'fallback', reason: 'no_key' };
  const model = opts.model || DEFAULT_CHAT_MODEL;
  try {
    const res = await deps.fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: redactPersonal(t.text) }] })),
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!res.ok) {
      console.error(`chat: Gemini ${model} HTTP ${res.status}`); // status only: the body can echo request metadata
      return { text: fallbackText(lang), source: 'fallback', reason: `gemini_${res.status}` };
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
    return text ? { text, source: 'gemini' } : { text: fallbackText(lang), source: 'fallback', reason: 'empty' };
  } catch (e) {
    console.error('chat: Gemini call failed:', e instanceof Error ? e.name : 'error');
    return { text: fallbackText(lang), source: 'fallback', reason: 'network' };
  }
}

/** The answer as an AI SDK 7 UI message stream (what useChat's DefaultChatTransport reads). */
export function uiMessageStream(text: string, id = 'txt-0'): string {
  const ev = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
  return ev({ type: 'start' }) + ev({ type: 'text-start', id }) + ev({ type: 'text-delta', id, delta: text })
    + ev({ type: 'text-end', id }) + ev({ type: 'finish', finishReason: 'stop' }) + 'data: [DONE]\n\n';
}

export const UI_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'x-vercel-ai-ui-message-stream': 'v1',
};
