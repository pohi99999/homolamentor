import { NextResponse } from "next/server";
import { getOrCreateDemandSessionId } from "@/lib/demandSession";
import { QUERY_MAX, QUERY_MIN, type PreviewResponse } from "@/lib/propertyPreview";
import { runPreview } from "@/lib/propertyResearch/preview";
import { groundedGenerate, resolveSourceUrls, GeminiUnavailableError, DEFAULT_MODEL } from "@/lib/propertyResearch/gemini";
import { WindowLimiter, DailyCap, envInt } from "@/lib/propertyResearch/limits";
import { fetchPageText } from "@/lib/propertyResearch/pageText";

// Stage 1 of the two-stage property search (card f1798734, contract src/lib/propertyPreview.ts).
// Free Gemini tier with Google Search grounding, called directly (no Vercel AI Gateway, no paid
// search tool). Every card is backed by a page the search tool really returned; the visitor never
// sees the source URL (it travels sealed inside the card id).

export const maxDuration = 60;

// Per IP + session, and a daily cap on model calls across all visitors, sized under the free quota.
const perVisitor = new WindowLimiter(envInt(process.env.PROPERTY_SEARCH_PER_HOUR, 5, 1), 3_600_000);
const daily = new DailyCap(envInt(process.env.PROPERTY_SEARCH_DAILY_CAP, 15, 0));

function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  let query = "";
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "query" }, { status: 400 });
  }
  if (query.length < QUERY_MIN || query.length > QUERY_MAX) {
    return NextResponse.json({ error: "query" }, { status: 400 });
  }

  const apiKey = process.env.PROPERTY_SEARCH_GEMINI_API_KEY;
  const secret = process.env.PROPERTY_SEARCH_SECRET;
  if (!apiKey || !secret) {
    console.error("property-search/preview: PROPERTY_SEARCH_GEMINI_API_KEY or PROPERTY_SEARCH_SECRET missing");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const session = await getOrCreateDemandSessionId();
  for (const key of [`ip:${clientIp(request)}`, `s:${session}`]) {
    const r = perVisitor.take(key);
    if (!r.ok) return NextResponse.json({ error: "rate_limited", retryAfter: r.retryAfter }, { status: 429 });
  }
  if (!daily.take()) {
    console.warn("property-search/preview: daily model-call cap reached");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  try {
    const outcome = await runPreview(query, {
      grounded: (prompt) => groundedGenerate(prompt, apiKey, { model: process.env.PROPERTY_SEARCH_MODEL || DEFAULT_MODEL }),
      resolve: (uris) => resolveSourceUrls(uris),
      pageText: (url) => fetchPageText(url),
      secret,
      now: Date.now,
    });
    // what the model proposed and why anything was dropped: server log only, no visitor data
    console.info("property-search/preview audit:", JSON.stringify(outcome.audit));
    const body: PreviewResponse = outcome.response;
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    console.error("property-search/preview:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
