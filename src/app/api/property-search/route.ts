import { NextResponse } from "next/server";
import { gateway, generateText, RetryError } from "ai-gateway-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { getOrCreateDemandSessionId } from "@/lib/demandSession";
import type { TeaserResult, PropertySearchResponse } from "@/lib/propertySearch";

const LOCALE_NAMES: Record<string, string> = {
  hu: "Hungarian",
  en: "English",
  de: "German",
  fr: "French",
};

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

function parseModelJson(text: string): { results: TeaserResult[]; notice: string | null } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { results: [], notice: null };
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
      : [];
    return { results, notice: typeof raw.notice === "string" ? raw.notice : null };
  } catch {
    return { results: [], notice: null };
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

  if (query.length < 3) {
    return NextResponse.json({ error: "A keresési kifejezés túl rövid." }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "A keresési kifejezés túl hosszú." }, { status: 400 });
  }

  const sessionId = await getOrCreateDemandSessionId();
  const webSearchTool = anthropic.tools.webSearch_20260209({ maxUses: 3 });

  try {
    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-5"),
      system: buildSystemPrompt(locale),
      prompt: `Ingatlanpiaci keresési kifejezés: "${query}"`,
      tools: { web_search: webSearchTool },
      providerOptions: {
        gateway: {
          user: sessionId,
          tags: ["feature:property-search"],
        },
      },
    });

    const parsed = parseModelJson(text);
    const response: PropertySearchResponse = {
      results: parsed.results.slice(0, 5),
      notice:
        parsed.results.length === 0
          ? parsed.notice || "Jelenleg nem találtunk nyilvános hirdetést erre a keresésre."
          : undefined,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const statusCode = extractStatusCode(error);
    if (statusCode === 429) {
      return NextResponse.json<PropertySearchResponse>({
        results: [],
        notice: "Túl sok keresés érkezett rövid idő alatt. Kérjük, próbálja újra néhány perc múlva.",
      });
    }
    if (statusCode === 402 || statusCode === 403) {
      return NextResponse.json<PropertySearchResponse>({
        results: [],
        notice:
          "A keresési szolgáltatás jelenleg nem elérhető. Kérjük, próbálja meg később, vagy vegye fel velünk közvetlenül a kapcsolatot.",
      });
    }
    console.error("Property search error:", error);
    return NextResponse.json<PropertySearchResponse>({
      results: [],
      notice: "Hiba történt a keresés során. Kérjük, próbálja meg később.",
    });
  }
}
