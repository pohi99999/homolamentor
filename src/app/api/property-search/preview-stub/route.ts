import { NextResponse } from "next/server";
import { QUERY_MAX, QUERY_MIN, type PreviewCard, type PreviewResponse } from "@/lib/propertyPreview";

// STUB of stage 1 (card f1798734): answers in the shape of src/lib/propertyPreview.ts with the
// made-up examples of the content brief (75acc820, ch. 8.2). No model call, no web search, no
// cost. Switched off on the production deployment.

const EXAMPLES: PreviewCard[] = [
  { id: "pelda-1", category: "Ipari terület", place: "Szeged környéke", area: "kb. 1,4-1,6 ha", utilities: "víz, villany, csatorna", priceBand: "egyeztetendő", verification: "verified", example: true },
  { id: "pelda-2", category: "Ipari terület", place: "Szeged környéke", area: "kb. 1,5 ha", utilities: "villany, víz; csatorna tervezett", priceBand: "egyeztetendő", verification: "pending", example: true },
  { id: "pelda-3", category: "Építési telek", place: "Csongrád-Csanád vármegye", area: "kb. 2 ha", utilities: "közmű a telekhatáron", priceBand: "egyeztetendő", verification: "verified", example: true },
];

// The stub "finds" the examples only for queries they plausibly answer, so the empty state shows too.
const MATCH = /szeged|csongr|ipar|telek|hektár|\bha\b|közm/i;

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
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

  await new Promise((r) => setTimeout(r, 1200)); // feels like work, costs nothing
  const res: PreviewResponse = MATCH.test(query) ? { status: "ok", cards: EXAMPLES } : { status: "empty" };
  return NextResponse.json(res);
}
