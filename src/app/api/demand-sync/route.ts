import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/requireAdmin";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";
const STATUS_COLUMN = "J";
const FIRST_DATA_ROW = 2; // row 1 is the header

export const DEMAND_STATUSES = ["Új", "Kapcsolatba lépve", "Lezárva"] as const;
export type DemandStatus = (typeof DEMAND_STATUSES)[number];

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

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) return null;

  privateKey = privateKey.replace(/\\n/g, "\n");
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sheets = getSheetsClient();
  if (!sheets) {
    return NextResponse.json(
      { error: "Hiányzó környezeti változók: GOOGLE_SERVICE_ACCOUNT_EMAIL vagy GOOGLE_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1000`,
    });

    const rows = res.data.values || [];
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    // The row's `id` is the ACTUAL sheet row number (header = row 1, so the
    // first data row is 2), computed BEFORE filtering out blank rows — a PATCH
    // targeting this id must land on the same row the admin saw, even if an
    // earlier row in the sheet happens to be entirely empty.
    const entries: DemandRow[] = dataRows
      .map((row, idx) => ({ row, sheetRow: idx + FIRST_DATA_ROW }))
      .filter(({ row }) => row.some((cell) => String(cell || "").trim() !== ""))
      .map(({ row, sheetRow }) => ({
        id: String(sheetRow),
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

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON törzs." }, { status: 400 });
  }

  const { id, status } = body;
  const rowNumber = Number(id);

  if (!id || !Number.isInteger(rowNumber) || rowNumber < FIRST_DATA_ROW) {
    return NextResponse.json({ error: "Érvénytelen sorazonosító." }, { status: 400 });
  }
  if (!status || !DEMAND_STATUSES.includes(status as DemandStatus)) {
    return NextResponse.json(
      { error: `Az állapot csak a következők egyike lehet: ${DEMAND_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    return NextResponse.json(
      { error: "Hiányzó környezeti változók: GOOGLE_SERVICE_ACCOUNT_EMAIL vagy GOOGLE_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!${STATUS_COLUMN}${rowNumber}:${STATUS_COLUMN}${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[status]] },
    });
    return NextResponse.json({ success: true, id, status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Kereslet_Talalatok írási hiba (PATCH):", message);
    return NextResponse.json(
      { error: "Google Sheets API írási hiba", details: message },
      { status: 500 }
    );
  }
}
