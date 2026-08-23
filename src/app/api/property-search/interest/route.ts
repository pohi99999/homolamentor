import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/escapeHtml";
import type { TeaserResult } from "@/lib/propertySearch";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const CONFIRMATION_COPY: Record<string, { subject: string; body: string }> = {
  hu: {
    subject: "Köszönjük az érdeklődését – HOMLAMENTOR KFT",
    body: "Köszönjük, hogy jelezte érdeklődését. Kollégáink hamarosan felveszik Önnel a kapcsolatot.",
  },
  en: {
    subject: "Thank you for your interest – HOMLAMENTOR KFT",
    body: "Thank you for reaching out. Our team will contact you shortly.",
  },
  de: {
    subject: "Vielen Dank für Ihr Interesse – HOMLAMENTOR KFT",
    body: "Vielen Dank für Ihre Anfrage. Unser Team wird sich in Kürze bei Ihnen melden.",
  },
  fr: {
    subject: "Merci de votre intérêt – HOMLAMENTOR KFT",
    body: "Merci de nous avoir contactés. Notre équipe vous répondra sous peu.",
  },
};

async function appendDemandRow(row: string[]): Promise<{ success: boolean; message?: string }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    return { success: false, message: "Hiányzó GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY." };
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message };
  }
}

export async function POST(request: Request) {
  let body: {
    query?: string;
    matchedResult?: TeaserResult;
    name?: string;
    email?: string;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { query, matchedResult, name, email, locale } = body;

  if (!query || !matchedResult || !name || !email) {
    return NextResponse.json(
      { error: "A keresési kifejezés, a találat, a név és az e-mail cím megadása kötelező." },
      { status: 400 }
    );
  }

  const safeLocale = locale && CONFIRMATION_COPY[locale] ? locale : "hu";
  const today = new Date().toISOString().split("T")[0];

  const row = [
    `'${today}`,
    query,
    matchedResult.category || "",
    matchedResult.locationHint || "",
    matchedResult.priceRange || "",
    matchedResult.summary || "",
    name,
    email,
    safeLocale,
    "Új",
  ];

  const teamEmailHtml = `
    <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">Új kereslet-találat érdeklődés</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">Keresési kifejezés:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(query)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Kategória:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(matchedResult.category || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Lokáció:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(matchedResult.locationHint || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Ár-tartomány:</td><td style="padding: 8px 0; color: #34d399;">${escapeHtml(matchedResult.priceRange || "Nincs megadva")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">AI-összefoglaló:</td><td style="padding: 8px 0; color: #ffffff; white-space: pre-wrap;">${escapeHtml(matchedResult.summary || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Érdeklődő:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">E-mail:</td><td style="padding: 8px 0; color: #38bdf8;"><a href="mailto:${escapeHtml(email)}" style="color: #38bdf8;">${escapeHtml(email)}</a></td></tr>
      </table>
    </div>
  `;

  const userEmailHtml = `
    <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">HOMLAMENTOR KFT</h1>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">${escapeHtml(CONFIRMATION_COPY[safeLocale].body)}</p>
    </div>
  `;

  const [sheetResult, teamEmailResult, userEmailResult] = await Promise.allSettled([
    appendDemandRow(row),
    resend
      ? resend.emails.send({
          from: "HOMLAMENTOR <onboarding@resend.dev>",
          to: ["office.homlamentor@gmail.com"],
          subject: `Új kereslet-találat érdeklődés: ${query}`,
          html: teamEmailHtml,
        })
      : Promise.resolve({ skipped: true }),
    resend
      ? resend.emails.send({
          from: "HOMLAMENTOR <onboarding@resend.dev>",
          to: [email],
          subject: CONFIRMATION_COPY[safeLocale].subject,
          html: userEmailHtml,
        })
      : Promise.resolve({ skipped: true }),
  ]);

  const sheetOk = sheetResult.status === "fulfilled" && sheetResult.value.success;
  if (!sheetOk) {
    console.error(
      "Kereslet_Talalatok írási hiba:",
      sheetResult.status === "fulfilled" ? sheetResult.value.message : sheetResult.reason
    );
  }
  if (teamEmailResult.status === "rejected") {
    console.error("Csapat-értesítő e-mail hiba:", teamEmailResult.reason);
  }
  if (userEmailResult.status === "rejected") {
    console.error("Visszaigazoló e-mail hiba:", userEmailResult.reason);
  }

  return NextResponse.json({
    success: true,
    integrations: {
      sheet: sheetOk ? "success" : "failed",
      teamEmail: resend ? (teamEmailResult.status === "fulfilled" ? "sent" : "failed") : "mocked",
      userEmail: resend ? (userEmailResult.status === "fulfilled" ? "sent" : "failed") : "mocked",
    },
  });
}
