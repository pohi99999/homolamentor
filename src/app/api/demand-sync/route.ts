import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/requireAdmin";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";

export interface DemandRow {
  id: string;
  date: string;
  query: string;
  category: string;
  locationHint: string;
  priceRange: string;
  summary: string;
  interestedName: string;
  interestedEmail: string;
  locale: string;
  status: string;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return NextResponse.json(
      { error: "Hiányzó környezeti változók: GOOGLE_SERVICE_ACCOUNT_EMAIL vagy GOOGLE_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  privateKey = privateKey.replace(/\\n/g, "\n");
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1000`,
    });

    const rows = res.data.values || [];
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    const entries: DemandRow[] = dataRows
      .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
      .map((row, idx) => ({
        id: String(idx + 1),
        date: String(row[0] || "").replace(/^'/, ""),
        query: String(row[1] || ""),
        category: String(row[2] || ""),
        locationHint: String(row[3] || ""),
        priceRange: String(row[4] || ""),
        summary: String(row[5] || ""),
        interestedName: String(row[6] || ""),
        interestedEmail: String(row[7] || ""),
        locale: String(row[8] || ""),
        status: String(row[9] || "Új"),
      }));

    return NextResponse.json({
      success: true,
      source: "google_sheets_live",
      count: entries.length,
      entries,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Kereslet_Talalatok olvasási hiba:", message);

    if (message.includes("Unable to parse range") || message.includes("not found")) {
      return NextResponse.json({
        success: true,
        source: "google_sheets_live",
        count: 0,
        entries: [],
        notice: `A "${SHEET_NAME}" munkalap még nem létezik — futtasd le a scripts/init_demand_sheet.js szkriptet.`,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Google Sheets API olvasási hiba", details: message },
      { status: 500 }
    );
  }
}
