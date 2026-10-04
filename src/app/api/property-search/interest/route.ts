import { NextResponse, after } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { str, validateInterest, type InterestBody } from "@/lib/propertyInterest";
import { openCard, type CardSecret } from "@/lib/propertyResearch/cardToken";
import { findSources } from "@/lib/propertyResearch/preview";
import { buildResearchPrompt, buildTeamEmail, sheetRow, RESEARCH_MAX, type Lead } from "@/lib/propertyResearch/lead";
import { groundedGenerate, resolveSourceUrls, DEFAULT_MODEL } from "@/lib/propertyResearch/gemini";
import { WindowLimiter, DailyCap, envInt, looksLikeBot } from "@/lib/propertyResearch/limits";
import { fetchPageText } from "@/lib/propertyResearch/pageText";
import { handleLegacyInterest, type LegacyInterestBody } from "@/lib/propertyResearch/legacyInterest";

// Stage 2 of the two-stage property search (card f1798734, contract src/lib/propertyPreview.ts):
// the "Érdekel" form. The lead is recorded first (Sheet row, status "queued"), the visitor gets
// { ok: true }, and the detailed, source-checked research runs after the response (next/server
// after()); its result goes to the team e-mail and the row's status becomes "sent" or
// "email_failed". Personal data is never sent to the model.

export const maxDuration = 300;

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID_MASTER || "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";
// Resend's sandbox sender delivers only to the Resend account's own address (measured on
// production 2026-08-23), so the test recipient is that address; office.homlamentor@gmail.com needs
// a verified sending domain first. The recipient is configuration, not code.
const LEAD_TO = process.env.LEAD_TO || "peterpohankapersonal@gmail.com";
const LEAD_FROM = process.env.LEAD_FROM || "HOMLAMENTOR <onboarding@resend.dev>";

const perIp = new WindowLimiter(envInt(process.env.PROPERTY_INTEREST_PER_HOUR, 20, 1), 3_600_000);
const researchCap = new DailyCap(envInt(process.env.PROPERTY_RESEARCH_DAILY_CAP, 10, 0));

function sheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) return null;
  key = key.replace(/\\n/g, "\n");
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

/** Appends the row; returns the A1 address of its status cell (column J), or null. */
async function appendQueued(row: string[]): Promise<string | null> {
  const sheets = sheetsClient();
  if (!sheets) return null;
  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:O1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    const m = res.data.updates?.updatedRange?.match(/![A-Z]+(\d+)/);
    return m ? `'${SHEET_NAME}'!J${m[1]}` : null;
  } catch (err) {
    console.error("Kereslet_Talalatok append:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function setStatus(cell: string | null, status: string) {
  const sheets = sheetsClient();
  if (!sheets || !cell) return;
  try {
    await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: cell, valueInputOption: "RAW", requestBody: { values: [[status]] } });
  } catch (err) {
    console.error("Kereslet_Talalatok status:", err instanceof Error ? err.message : err);
  }
}

function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  let body: InterestBody & { cardId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // The old production UI still posts the first prototype's shape here: keep it working unchanged.
  if (body && typeof body === "object" && "matchedResult" in body) {
    return handleLegacyInterest(body as LegacyInterestBody);
  }

  // Spam: answer like a success so the bot learns nothing, record nothing.
  if (looksLikeBot(body.website, body.startedAt, Date.now())) {
    return NextResponse.json({ ok: true });
  }
  const limited = perIp.take(`ip:${clientIp(request)}`);
  if (!limited.ok) {
    return NextResponse.json({ error: "rate_limited", retryAfter: limited.retryAfter }, { status: 429 });
  }
  const errors = validateInterest(body);
  const query = str(body.query).slice(0, 300);
  if (query.length < 3) errors.query = "Hiányzik a keresés szövege.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const secret = process.env.PROPERTY_SEARCH_SECRET;
  const chosen: CardSecret | null = secret && typeof body.cardId === "string" ? openCard(body.cardId, secret) : null;
  const lead: Lead = {
    name: str(body.name),
    email: str(body.email),
    phone: str(body.phone),
    marketing: body.marketing === true,
    query,
    receivedAt: Date.now(),
  };

  const statusCell = await appendQueued(sheetRow(lead, chosen));
  const resendKey = process.env.RESEND_API_KEY;
  if (!statusCell && !resendKey) {
    // no durable record anywhere: do not tell the visitor it worked
    console.error("property-search/interest: neither the Sheet nor Resend is configured");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  after(async () => {
    let research: Awaited<ReturnType<typeof findSources>>["found"] | null = null;
    let researchError: string | null = null;
    const apiKey = process.env.PROPERTY_SEARCH_GEMINI_API_KEY;
    if (!apiKey) researchError = "nincs Gemini-kulcs beállítva";
    else if (!researchCap.take()) researchError = "a napi ingyenes kutatási keret elfogyott";
    else {
      try {
        const r = await findSources(
          query,
          {
            grounded: (p) => groundedGenerate(p, apiKey, { model: process.env.PROPERTY_SEARCH_MODEL || DEFAULT_MODEL }),
            resolve: (u) => resolveSourceUrls(u),
            pageText: (u) => fetchPageText(u),
            secret: secret ?? "",
            now: Date.now,
          },
          RESEARCH_MAX,
          buildResearchPrompt(query, chosen),
        );
        research = r.found;
        console.info("property-search/interest research audit:", JSON.stringify(r.audit));
      } catch (err) {
        researchError = err instanceof Error ? err.message : String(err);
      }
    }
    const { subject, html } = buildTeamEmail(lead, chosen, research, researchError);
    let sent = false;
    if (resendKey) {
      const res = await new Resend(resendKey).emails.send({ from: LEAD_FROM, to: [LEAD_TO], subject, html });
      sent = !res.error;
      if (res.error) console.error("property-search/interest e-mail:", res.error.message);
    }
    await setStatus(statusCell, sent ? "sent" : "email_failed");
  });

  return NextResponse.json({ ok: true });
}
