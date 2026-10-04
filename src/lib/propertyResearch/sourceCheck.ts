// Source checks of the two-stage property search (card f1798734, content 75acc820 ch. 2.5 and 7).
// Pure functions, no I/O: the routes feed them what the search tool returned.
//
// The rule is structural, not a prompt request: a card the model writes survives only if its
// sourceUrl was really among the search tool's results (origin check), and it is not a listing
// portal whose terms forbid automated use (ingatlan.com ÁSZF 9.4.8-9.4.10, ch. 7.1).

// Portals whose terms forbid automated collection or whose terms we have not cleared (ch. 7.1).
// Their pages are dropped even when the search tool returns them.
export const PORTAL_DENYLIST = [
  'ingatlan.com',
  'jofogas.hu',
  'ingatlanbazar.hu',
  'otthonterkep.hu',
  'duna-house.hu',
  'oc.hu',
  'cdc.hu',
  'remax.hu',
  'immobilienscout24.de',
];

// Official sellers (state, enforcement, municipal): the only pages the content check may fetch.
// Every other non-denied source stays "pending" (from the search tool's data, never fetched),
// because its terms of use have not been checked (ch. 7.1).
export const OFFICIAL_SUFFIXES = ['gov.hu', 'mnv.hu', 'mbvk.hu', 'magyarorszag.hu'];

export function isOfficial(raw: string): boolean {
  const host = hostOf(raw);
  if (!host) return false;
  return OFFICIAL_SUFFIXES.some((d) => host === d || host.endsWith(`.${d}`));
}

export type SourceCandidate = {
  sourceUrl: string;
  quote?: string | null;
};

/** Lower-cased host + path without query, fragment and trailing slash; null if not http(s). */
export function normalizeUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const path = u.pathname.replace(/\/+$/, '');
  return `${host}${path}`;
}

export function hostOf(raw: string): string | null {
  try {
    return new URL(raw.trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function isDeniedPortal(raw: string): boolean {
  const host = hostOf(raw);
  if (!host) return true;
  return PORTAL_DENYLIST.some((d) => host === d || host.endsWith(`.${d}`));
}

export type OriginVerdict = 'ok' | 'not_in_results' | 'denied_portal' | 'invalid_url';

/**
 * Was this URL really among the search results? `resultUrls` are the real page URLs of the
 * search tool's results (already resolved from any redirect wrapper by the caller).
 */
export function checkOrigin(sourceUrl: string, resultUrls: Iterable<string>): OriginVerdict {
  const n = normalizeUrl(sourceUrl);
  if (!n) return 'invalid_url';
  if (isDeniedPortal(sourceUrl)) return 'denied_portal';
  const known = new Set<string>();
  for (const r of resultUrls) {
    const k = normalizeUrl(r);
    if (k) known.add(k);
  }
  return known.has(n) ? 'ok' : 'not_in_results';
}

/** Keeps the candidates whose source passes the origin check; reports the dropped ones. */
export function filterByOrigin<T extends SourceCandidate>(
  candidates: T[],
  resultUrls: Iterable<string>,
): { kept: T[]; dropped: { candidate: T; verdict: OriginVerdict }[] } {
  const urls = [...resultUrls];
  const kept: T[] = [];
  const dropped: { candidate: T; verdict: OriginVerdict }[] = [];
  for (const c of candidates) {
    const verdict = typeof c.sourceUrl === 'string' ? checkOrigin(c.sourceUrl, urls) : 'invalid_url';
    if (verdict === 'ok') kept.push(c);
    else dropped.push({ candidate: c, verdict });
  }
  return { kept, dropped };
}

export type ResultSource = { uri: string; url: string | null };
export type MatchVerdict = OriginVerdict | 'unresolved';

/**
 * The model cites the search tool's redirect URIs (it never sees the real URLs), or sometimes the
 * real URL. A card's source matches if it equals either the URI or the resolved URL of a real
 * result; the card then carries the resolved real URL, and the portal rule is checked on that.
 * Anything else was not returned by the search: invented, dropped.
 */
export function matchSource(cardUrl: string, results: ResultSource[]): { verdict: MatchVerdict; url: string | null } {
  const n = normalizeUrl(cardUrl);
  if (!n) return { verdict: 'invalid_url', url: null };
  const hit = results.find((r) => normalizeUrl(r.uri) === n || (r.url !== null && normalizeUrl(r.url) === n));
  if (!hit) return { verdict: 'not_in_results', url: null };
  if (!hit.url) return { verdict: 'unresolved', url: null };
  if (isDeniedPortal(hit.url)) return { verdict: 'denied_portal', url: hit.url };
  return { verdict: 'ok', url: hit.url };
}

/** Lower-case, accents off, whitespace collapsed: for "does the page say this number" checks. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Content check: does the page text contain the quoted sentence (normalised)? Used to promote a
 * card from "pending" to "verified". A short or missing quote never verifies.
 */
export function quoteFoundIn(pageText: string, quote: string | null | undefined): boolean {
  if (!quote) return false;
  const q = normalizeText(quote);
  if (q.length < 12) return false;
  return normalizeText(pageText).includes(q);
}
