import { NextResponse } from "next/server";

// Card f1798734: the first prototype's paid search (Vercel AI Gateway + Perplexity) is retired,
// production included (Péter, Telegram 5947, 2026-10-04): no paid call can run from here. The site
// uses /api/property-search/preview (free Gemini tier, source-checked). The old code is in git
// history (tag pre-ingatlan-kereso-2026-10-04).
export async function POST() {
  return NextResponse.json({ error: "gone", use: "/api/property-search/preview" }, { status: 410 });
}
