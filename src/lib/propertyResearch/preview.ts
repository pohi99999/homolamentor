// Stage 1 of the property search (card f1798734, contract src/lib/propertyPreview.ts): the
// visitor's text -> at most 3 cards, each backed by a page the search tool really returned.
// Pure orchestration; the route supplies the Gemini call, the page fetcher and the secret.
import { matchSource, isOfficial, quoteFoundIn, PORTAL_DENYLIST, type ResultSource } from './sourceCheck.ts';
import { extractJson, type GroundedAnswer } from './gemini.ts';
import { sealCard, type CardSecret } from './cardToken.ts';

// Same shape as PreviewCard in src/lib/propertyPreview.ts (kept local so this module stays
// importable by node's test runner without the "@/" alias).
export type Card = {
  id: string;
  category: string;
  place: string;
  area: string | null;
  utilities: string | null;
  priceBand: string | null;
  verification: 'verified' | 'pending';
};

export type ModelCard = {
  category?: string;
  place?: string;
  area?: string | null;
  utilities?: string | null;
  priceBand?: string | null;
  sourceUrl?: string;
  quote?: string | null;
};

export type PreviewDeps = {
  grounded: (prompt: string) => Promise<GroundedAnswer>;
  resolve: (uris: string[]) => Promise<ResultSource[]>;
  /** Visible text of an official page (see isOfficial), or null; used for the content check. */
  pageText: (url: string) => Promise<string | null>;
  secret: string;
  now: () => number;
};

export const MAX_CARDS = 3;

export function buildPrompt(query: string): string {
  return [
    'Magyar ingatlan-kutató asszisztens vagy. Keress a weben a következő keresésre:',
    `"${query.replace(/"/g, "'")}"`,
    '',
    'Szabályok:',
    `- NE használd ezeket a portálokat, és ne hivatkozz rájuk: ${PORTAL_DENYLIST.join(', ')}.`,
    '- Előnyben: állami és önkormányzati értékesítés (pl. e-arveres.mnv.hu, arveres.nav.gov.hu, arveres.mbvk.hu, önkormányzati pályázati felhívások), ipari parkok, fejlesztők saját oldalai.',
    '- Csak olyan ingatlant írj, amelyet egy konkrét találati oldal tényleg leír. Ha nincs ilyen, adj üres listát. Semmit ne találj ki.',
    '- Minden találathoz add meg a forrásoldal URL-jét pontosan úgy, ahogy a keresési találatokban kaptad (sourceUrl), és egy szó szerinti, legalább egy mondatos idézetet az oldalról, amely a területet vagy az árat tartalmazza (quote).',
    '- A place mező csak település vagy térség legyen, pontos cím, helyrajzi szám, hirdető, telefon vagy e-mail SOHA.',
    `- Legfeljebb ${MAX_CARDS} találat.`,
    '',
    'Válasz KIZÁRÓLAG ez a JSON, más szöveg nélkül:',
    '{"cards":[{"category":"...","place":"...","area":"... vagy null","utilities":"... vagy null","priceBand":"... vagy null","sourceUrl":"https://...","quote":"..."}]}',
  ].join('\n');
}

const clean = (v: unknown, max = 80): string | null => {
  if (typeof v !== 'string') return null;
  // nothing that looks like a link, an e-mail or a phone number reaches the visitor
  const s = v.replace(/https?:\/\/\S+/gi, '').replace(/\S+@\S+/g, '').replace(/\+?\d[\d\s/-]{7,}\d/g, '').trim();
  return s ? s.slice(0, max) : null;
};

export type Audit = { proposed: number; kept: number; dropped: { sourceUrl: string; verdict: string }[]; resultUrls: number };

export type FoundSource = CardSecret & { utilities: string | null };

/**
 * The shared core of both stages: one grounded search, then only the cards whose source really
 * was among the search results (origin check) and is not a denied portal; a card whose quote is
 * found on the page is "verified", otherwise "pending".
 */
export async function findSources(query: string, deps: PreviewDeps, max: number, prompt = buildPrompt(query)): Promise<{ found: FoundSource[]; audit: Audit }> {
  const answer = await deps.grounded(prompt);
  const parsed = extractJson<{ cards?: ModelCard[] }>(answer.text);
  const proposed = Array.isArray(parsed?.cards) ? parsed!.cards.slice(0, 10) : [];
  const results = await deps.resolve(answer.sourceUris.map((s) => s.uri));
  const dropped: { sourceUrl: string; verdict: string }[] = [];
  const found: FoundSource[] = [];
  for (const c of proposed) {
    if (found.length >= max) break;
    if (typeof c.sourceUrl !== 'string') {
      dropped.push({ sourceUrl: '', verdict: 'invalid_url' });
      continue;
    }
    const m = matchSource(c.sourceUrl, results);
    if (m.verdict !== 'ok' || !m.url) {
      dropped.push({ sourceUrl: (m.url ?? c.sourceUrl).slice(0, 200), verdict: m.verdict });
      continue;
    }
    const category = clean(c.category, 60);
    const place = clean(c.place, 60);
    if (!category || !place) continue;
    // Content check only on official pages; any other source is never fetched (its terms are
    // unchecked) and stays "pending" for the team to open by hand.
    let verification: 'verified' | 'pending' = 'pending';
    if (isOfficial(m.url) && c.quote) {
      const text = await deps.pageText(m.url).catch(() => null);
      if (text && quoteFoundIn(text, c.quote)) verification = 'verified';
    }
    found.push({
      sourceUrl: m.url,
      quote: typeof c.quote === 'string' ? c.quote.slice(0, 500) : null,
      category,
      place,
      area: clean(c.area, 40),
      priceBand: clean(c.priceBand, 40),
      utilities: clean(c.utilities, 60),
      verification,
      query,
      issuedAt: deps.now(),
    });
  }
  return {
    found,
    audit: {
      proposed: proposed.length,
      kept: found.length,
      dropped,
      resultUrls: results.length,
    },
  };
}

export type PreviewOutcome = {
  response: { status: 'ok'; cards: Card[] } | { status: 'empty' };
  /** For the server log and the tests: what the model proposed and why it was dropped. */
  audit: Audit;
};

/** Stage 1: at most 3 visitor cards, no URL, the source sealed inside the opaque id. */
export async function runPreview(query: string, deps: PreviewDeps): Promise<PreviewOutcome> {
  const { found, audit } = await findSources(query, deps, MAX_CARDS);
  const cards: Card[] = found.map(({ utilities, ...secret }) => ({
    id: sealCard(secret, deps.secret),
    category: secret.category,
    place: secret.place,
    area: secret.area,
    utilities,
    priceBand: secret.priceBand,
    verification: secret.verification,
  }));
  return { response: cards.length ? { status: 'ok', cards } : { status: 'empty' }, audit };
}
