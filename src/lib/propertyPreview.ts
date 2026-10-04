// DRAFT API contract of the two-stage property search (card f1798734, content 75acc820 ch. 2.2).
// The UI (Lumen) is built against it with stub endpoints; the real backend (Kenshin) implements it.
// Free Gemini tier only while testing; no paid search, no portal scraping (ch. 7).
//
// Stage 1, visitor preview:  POST /api/property-search/preview   (stub: .../preview-stub)
//   request  PreviewRequest
//   200      PreviewResponse   ("ok" with 1-3 cards, or "empty")
//   400      { error: "query" }                        query shorter than 3 or longer than 300 chars
//   429      { error: "rate_limited", retryAfter: s }  per IP / session limit, cost gate
//   503      { error: "unavailable" }                  model or source down, monthly cost cap hit
// Cards NEVER carry a URL, an exact address or the advertiser: the source link exists only on
// the backend and in the team e-mail (stage 2), where it is checked against the source page.
//
// Stage 2, lead after the "Érdekel" form:  POST /api/property-search/interest  (stub: .../interest-preview)
//   request  InterestRequest (see propertyInterest.ts for the field rules)
//   200      { ok: true }                 the detailed, source-checked research then runs for the team
//   400      { ok: false, errors: { field: message } }
//   429      { error: "rate_limited", retryAfter: s }

export type PreviewRequest = {
  query: string; // 3..300 characters, as typed
};

export type Verification = 'verified' | 'pending'; // "Forrás ellenőrizve" / "Ellenőrzés alatt"

export type PreviewCard = {
  id: string; // opaque, echoed back in the lead so the team sees which card was chosen
  category: string; // e.g. "Ipari terület"
  place: string; // settlement or area, never an exact address
  area: string | null; // e.g. "kb. 1,5 ha"
  utilities: string | null; // e.g. "víz, villany, csatorna"
  priceBand: string | null; // e.g. "egyeztetendő", "150-200 M Ft"
  verification: Verification;
  example?: boolean; // made-up demo data: the UI shows "Példa, nem valós hirdetés"
};

export type PreviewResponse = { status: 'ok'; cards: PreviewCard[] } | { status: 'empty' };

export type InterestRequest = {
  name: string;
  email: string;
  phone: string;
  consent: boolean; // must be true
  marketing: boolean;
  query: string;
  cardId: string | null; // null: "Kérek kézi keresést" from the empty or error state
  website: string; // honeypot, must stay empty
  startedAt: number; // ms timestamp when the form opened; too fast = bot
};

export const QUERY_MIN = 3;
export const QUERY_MAX = 300;
