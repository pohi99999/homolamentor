// Gemini API (free tier) with Google Search grounding, called directly, not through the Vercel AI
// Gateway (card f1798734: paid paths stay off while testing).
// Measured 2026-10-04 on ai.google.dev/gemini-api/docs/pricing (updated 2026-10-01): for
// gemini-2.5-flash and gemini-2.5-flash-lite, "Grounding with Google Search: Free of charge, up to
// 500 RPD (limit shared ...)"; on the 3.x models it is "Not available" on the free tier. The free
// tier also says "Used to improve our products: Yes": never send personal data (name, e-mail,
// phone) to this API, only the search text and the card.

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_MODEL = 'gemini-2.5-flash';

export type GeminiDeps = { fetch: typeof fetch };

export class GeminiUnavailableError extends Error {
  readonly status: number;
  readonly code: 'gemini_quota' | 'gemini_busy' | 'gemini_error';
  constructor(status: number, code: 'gemini_quota' | 'gemini_busy' | 'gemini_error') {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export type GroundedAnswer = {
  text: string;
  /** Result pages the search tool returned, as given (often a vertexaisearch redirect URI). */
  sourceUris: { uri: string; title: string | null }[];
  searchQueries: string[];
};

/** One grounded call. Throws GeminiUnavailableError on 429/503/other non-2xx; no retry. */
export async function groundedGenerate(
  prompt: string,
  apiKey: string,
  opts: { model?: string; temperature?: number } = {},
  deps: GeminiDeps = { fetch: (...a) => fetch(...a) },
): Promise<GroundedAnswer> {
  const model = opts.model ?? DEFAULT_MODEL;
  const res = await deps.fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: opts.temperature ?? 0.1 },
    }),
  });
  if (!res.ok) {
    // the body goes to the server log only; it can echo request metadata
    console.error(`Gemini ${model} ${res.status}:`, (await res.text()).slice(0, 500));
    throw new GeminiUnavailableError(res.status, res.status === 429 ? 'gemini_quota' : res.status === 503 ? 'gemini_busy' : 'gemini_error');
  }
  return parseGrounded(await res.json());
}

type RawCandidate = {
  content?: { parts?: { text?: string }[] };
  groundingMetadata?: {
    groundingChunks?: { web?: { uri?: string; title?: string } }[];
    webSearchQueries?: string[];
  };
};

export function parseGrounded(json: unknown): GroundedAnswer {
  const c = ((json as { candidates?: RawCandidate[] })?.candidates ?? [])[0] ?? {};
  const text = (c.content?.parts ?? []).map((p) => p.text ?? '').join('');
  const sourceUris = (c.groundingMetadata?.groundingChunks ?? [])
    .map((ch) => ({ uri: ch.web?.uri ?? '', title: ch.web?.title ?? null }))
    .filter((s) => s.uri);
  return { text, sourceUris, searchQueries: c.groundingMetadata?.webSearchQueries ?? [] };
}

const REDIRECT_HOSTS = ['vertexaisearch.cloud.google.com'];

/**
 * Grounding URIs are redirect wrappers; the origin check needs the real page URL. Reads only the
 * Location header (redirect: 'manual'), never the page itself. Unresolvable URIs are left out.
 */
export async function resolveSourceUrls(
  uris: string[],
  deps: GeminiDeps = { fetch: (...a) => fetch(...a) },
  timeoutMs = 4000,
): Promise<string[]> {
  const out = await Promise.all(
    uris.map(async (uri) => {
      let host = '';
      try {
        host = new URL(uri).hostname;
      } catch {
        return null;
      }
      if (!REDIRECT_HOSTS.includes(host)) return uri;
      try {
        const res = await deps.fetch(uri, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
        const loc = res.headers.get('location');
        return loc && /^https?:\/\//.test(loc) ? loc : null;
      } catch {
        return null;
      }
    }),
  );
  return out.filter((u): u is string => !!u);
}

/** The model's answer is asked as JSON; tolerate the fenced block it often wraps it in. */
export function extractJson<T>(text: string): T | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}
