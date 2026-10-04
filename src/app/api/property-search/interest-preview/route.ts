import { NextResponse } from "next/server";
import { str, validateInterest, type InterestBody } from "@/lib/propertyInterest";

// PREVIEW STUB for the "Érdekel" form (card f1798734). It validates exactly what the real endpoint
// will have to validate, but it sends NOTHING and stores NOTHING: no Google Sheet row, no e-mail,
// no model call, no log line with personal data. The real backend (model choice, office address,
// sending domain) waits for Péter's decision. It is switched off on the production deployment.

const MIN_FILL_MS = 2500; // a human needs longer than this to fill in three fields

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: InterestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Spam: answer like a success so the bot learns nothing, and drop the request.
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (str(body.website) !== "" || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const errors = validateInterest(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mock: true,
    note: "Előnézet: semmit nem küldtünk el és semmit nem tároltunk.",
  });
}
