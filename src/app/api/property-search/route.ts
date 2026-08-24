import { NextResponse } from "next/server";
import { gateway, generateText, RetryError } from "ai-gateway-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { getOrCreateDemandSessionId } from "@/lib/demandSession";
import type { TeaserResult, PropertySearchResponse } from "@/lib/propertySearch";

export const maxDuration = 60;

const LOCALE_NAMES: Record<string, string> = {
  hu: "Hungarian",
  en: "English",
  de: "German",
  fr: "French",
};

const MESSAGES: Record<
  string,
  {
    tooShort: string;
    tooLong: string;
    rateLimited: string;
    unavailable: string;
    genericError: string;
    noResults: string;
  }
> = {
  hu: {
    tooShort: "A keresési kifejezés túl rövid.",
    tooLong: "A keresési kifejezés túl hosszú.",
    rateLimited: "Túl sok keresés érkezett rövid idő alatt. Kérjük, próbálja újra néhány perc múlva.",
    unavailable:
      "A keresési szolgáltatás jelenleg nem elérhető. Kérjük, próbálja meg később, vagy vegye fel velünk közvetlenül a kapcsolatot.",
    genericError: "Hiba történt a keresés során. Kérjük, próbálja meg később.",
    noResults: "Jelenleg nem találtunk nyilvános hirdetést erre a keresésre.",
  },
  en: {
    tooShort: "The search term is too short.",
    tooLong: "The search term is too long.",
    rateLimited: "Too many searches in a short time. Please try again in a few minutes.",
    unavailable:
      "The search service is currently unavailable. Please try again later, or contact us directly.",
    genericError: "Something went wrong during the search. Please try again later.",
    noResults: "We couldn't find any public listings for this search right now.",
  },
  de: {
    tooShort: "Der Suchbegriff ist zu kurz.",
    tooLong: "Der Suchbegriff ist zu lang.",
    rateLimited: "Zu viele Suchanfragen in kurzer Zeit. Bitte versuchen Sie es in ein paar Minuten erneut.",
    unavailable:
      "Der Suchdienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.",
    genericError: "Bei der Suche ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
    noResults: "Wir haben derzeit keine öffentlichen Angebote für diese Suche gefunden.",
  },
  fr: {
    tooShort: "Le terme de recherche est trop court.",
    tooLong: "Le terme de recherche est trop long.",
    rateLimited: "Trop de recherches en peu de temps. Veuillez réessayer dans quelques minutes.",
    unavailable:
      "Le service de recherche est actuellement indisponible. Veuillez réessayer plus tard ou nous contacter directement.",
    genericError: "Une erreur s'est produite pendant la recherche. Veuillez réessayer plus tard.",
    noResults: "Nous n'avons trouvé aucune annonce publique pour cette recherche pour le moment.",
  },
};

function getMessages(locale: string) {
  return MESSAGES[locale] || MESSAGES.hu;
}

function buildSystemPrompt(locale: string): string {
  const langName = LOCALE_NAMES[locale] || "Hungarian";
  return `You are a real estate market research assistant for HOMLAMENTOR KFT, a Hungarian real estate intermediary company.

RULES (must always follow):
1. Search the public web for real, currently active property listings matching the user's query.
2. Summarize each match IN YOUR OWN WORDS — never quote listing text verbatim.
3. NEVER include a source URL, advertiser name, phone number, or email address in your summary.
4. NEVER invent or guess a listing that you did not actually find via search — if nothing relevant turns up, say so plainly in "notice" and return an empty "results" array.
5. Respond in ${langName}.
6. Return at most 5 matches, the most relevant first.

Respond ONLY with a JSON object of this exact shape (no markdown code fences, no extra text before or after):
{"results": [{"id": string, "category": string, "locationHint": string, "priceRange": string | null, "summary": string, "features": string[]}], "notice": string | null}

"notice" must contain a short, human-readable message ONLY when results is empty, explaining that nothing relevant was found.`;
}

/**
 * Compliance layer (C1): the system prompt tells the model to never leak a
 * source URL, advertiser name, phone number, or email address, but a
 * web-search-grounded LLM is realistically likely to slip one in anyway.
 * This is enforced a second time here, independent of the prompt, because
 * leaking a competitor's listing contact defeats the entire business premise
 * (and the stated legal constraint) of this feature.
 */
const URL_SOURCE = "https?:\\/\\/\\S+|\\bwww\\.[\\w-]+\\.[a-z]{2,}\\b|\\b[\\w-]+\\.(com|hu|net|org|de|at|co|io)\\b";
const EMAIL_SOURCE = "[\\w.+-]+@[\\w-]+\\.[\\w.-]+";
const PHONE_SOURCE = "\\+?\\d[\\d\\s().-]{6,}\\d";

// Fresh RegExp instances per call — a shared module-level `g` regex would
// carry stale `lastIndex` state across calls to `.test()`/`.replace()`.
function containsLeak(text: string): boolean {
  return (
    new RegExp(URL_SOURCE, "gi").test(text) ||
    new RegExp(EMAIL_SOURCE, "gi").test(text) ||
    new RegExp(PHONE_SOURCE, "g").test(text)
  );
}

function redact(text: string): string {
  return text
    .replace(new RegExp(URL_SOURCE, "gi"), "[redacted]")
    .replace(new RegExp(EMAIL_SOURCE, "gi"), "[redacted]")
    .replace(new RegExp(PHONE_SOURCE, "g"), "[redacted]");
}

/**
 * Returns null when the model's response could not be parsed at all (hard
 * parse failure — e.g. markdown-fenced or truncated output), so the caller
 * can distinguish that from a genuinely empty result set (I3). Presenting a
 * parse failure as "no results found" would misrepresent a technical error
 * as a market fact.
 */
function parseModelJson(text: string): { results: TeaserResult[]; notice: string | null } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return null;
  }
  try {
    const raw = JSON.parse(text.slice(start, end + 1));
    const results: TeaserResult[] = Array.isArray(raw.results)
      ? raw.results
          .filter((r: unknown): r is Record<string, unknown> => typeof r === "object" && r !== null)
          .map((r: Record<string, unknown>, idx: number) => ({
            id: typeof r.id === "string" ? r.id : `result-${idx}`,
            category: typeof r.category === "string" ? r.category : "Ingatlan",
            locationHint: typeof r.locationHint === "string" ? r.locationHint : "",
            priceRange: typeof r.priceRange === "string" ? r.priceRange : undefined,
            summary: typeof r.summary === "string" ? r.summary : "",
            features: Array.isArray(r.features)
              ? r.features.filter((f: unknown): f is string => typeof f === "string")
              : [],
          }))
          .filter((r: TeaserResult) => r.summary.length > 0)
          // C1: drop any result whose summary itself looks like it leaked a
          // source URL/advertiser contact — a summary needing redaction is
          // not trustworthy enough to salvage. Shorter fields (locationHint,
          // category, features[]) are redacted in place instead.
          .filter((r: TeaserResult) => !containsLeak(r.summary))
          .map((r: TeaserResult) => ({
            ...r,
            locationHint: redact(r.locationHint),
            category: redact(r.category),
            features: r.features.map((f) => redact(f)),
          }))
      : [];
    return { results, notice: typeof raw.notice === "string" ? raw.notice : null };
  } catch {
    return null;
  }
}

/**
 * Extracts an HTTP status code from an AI Gateway error, regardless of its
 * concrete class. `generateText()` can throw either a plain provider error
 * (e.g. Anthropic's `APICallError`) or, when retries are exhausted, a
 * `RetryError` wrapping the last attempt. The gateway's own error classes
 * (`GatewayRateLimitError`, `GatewayInternalServerError`, etc.) are NOT
 * instances of the SDK's exported `APICallError` — confirmed empirically —
 * so this checks structurally for a numeric `statusCode` instead of relying
 * on `instanceof`/`isInstance` checks that would silently never match.
 */
function extractStatusCode(error: unknown): number | undefined {
  const unwrapped = RetryError.isInstance(error) ? error.lastError : error;
  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    "statusCode" in unwrapped &&
    typeof (unwrapped as { statusCode: unknown }).statusCode === "number"
  ) {
    return (unwrapped as { statusCode: number }).statusCode;
  }
  return undefined;
}

export async function POST(request: Request) {
  let body: { query?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = (body.query || "").trim();
  const locale = body.locale && LOCALE_NAMES[body.locale] ? body.locale : "hu";
  const messages = getMessages(locale);

  if (query.length < 3) {
    return NextResponse.json({ error: messages.tooShort }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: messages.tooLong }, { status: 400 });
  }

  const sessionId = await getOrCreateDemandSessionId();
  const webSearchTool = anthropic.tools.webSearch_20260209({ maxUses: 3 });

  try {
    const { text } = await generateText({
      model: gateway("anthropic/claude-haiku-4.5"),
      system: buildSystemPrompt(locale),
      prompt: `Ingatlanpiaci keresési kifejezés: "${query}"`,
      tools: { web_search: webSearchTool },
      providerOptions: {
        gateway: {
          user: sessionId,
          tags: ["feature:property-search"],
          order: ["anthropic"],
        },
      },
    });

    const parsed = parseModelJson(text);
    if (parsed === null) {
      // Hard parse failure (I3): the model may well have found real
      // listings — the code just failed to read its output. Reporting
      // "no results" here would misrepresent a technical failure as a
      // market fact, so use the generic error message instead.
      console.error("Property search: unparseable model response:", text);
      return NextResponse.json<PropertySearchResponse>({
        results: [],
        notice: messages.genericError,
      });
    }
    const response: PropertySearchResponse = {
      results: parsed.results.slice(0, 5),
      notice:
        parsed.results.length === 0
          ? parsed.notice || messages.noResults
          : undefined,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 429) {
      return NextResponse.json<PropertySearchResponse>({
        results: [],
        notice: messages.rateLimited,
      });
    }
    if (statusCode === 402 || statusCode === 403) {
      return NextResponse.json<PropertySearchResponse>({
        results: [],
        notice: messages.unavailable,
      });
    }
    console.error("Property search error:", error);
    return NextResponse.json<PropertySearchResponse>({
      results: [],
      notice: messages.genericError,
    });
  }
}
