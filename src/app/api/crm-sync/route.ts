import { NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID_MASTER =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SPREADSHEET_ID_CONTACTS =
  process.env.GOOGLE_SPREADSHEET_ID_CONTACTS ||
  "1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM";

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return NextResponse.json(
      {
        error: "Hiányzó környezeti változók: GOOGLE_SERVICE_ACCOUNT_EMAIL vagy GOOGLE_PRIVATE_KEY nincs beállítva a Vercel/környezeti fájlban.",
      },
      { status: 400 }
    );
  }

  // Handle double escaping & wrapping quotes in environment variables
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

    // 1. Get Master CRM Spreadsheet metadata to identify first sheet name
    const masterMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID_MASTER,
    });

    const masterSheets = masterMeta.data.sheets || [];
    const firstMasterSheetName =
      masterSheets[0]?.properties?.title || "Master_Vevőlista";

    // 2. Fetch Master CRM data dynamically
    const masterRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_MASTER,
      range: `'${firstMasterSheetName}'!A1:S500`,
    });

    // 3. Get Contacts CRM metadata & data (if available)
    let firstContactsSheetName = "CONTACTS";
    let contactsRows: string[][] = [];

    try {
      const contactsMeta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID_CONTACTS,
      });
      firstContactsSheetName =
        contactsMeta.data.sheets?.[0]?.properties?.title || "CONTACTS";

      const contactsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID_CONTACTS,
        range: `'${firstContactsSheetName}'!A1:P500`,
      });
      contactsRows = contactsRes.data.values || [];
    } catch (contactsErr) {
      console.warn("Contacts Sheet read warning:", contactsErr);
    }

    const masterRows = masterRes.data.values || [];

    const dataRows = masterRows.length > 1 ? masterRows.slice(1) : [];
    const contactDataRows =
      contactsRows.length > 1 ? contactsRows.slice(1) : [];

    let totalLeads = dataRows.length + contactDataRows.length;
    let sentOutreach = 0;
    let activeNegotiations = 0;
    let rejected = 0;

    const activities: Array<{
      id: string;
      name: string;
      company: string;
      email: string;
      status: string;
      statusColor: string;
      value: string;
      date: string;
      type: string;
    }> = [];

    dataRows.forEach((row, idx) => {
      const name = row[0] || row[1] || `Lead #${idx + 1}`;
      const company = row[2] || row[3] || "Magánszemély / Partner";
      const emailStr = row[4] || row[5] || "";
      const statusRaw = row[6] || row[7] || "Folyamatban";
      const statusStr = String(statusRaw).toLowerCase();
      const valueStr = row[8] || "N/A";
      const typeStr = row[10] || "B2B Mentorálás";

      if (
        statusStr.includes("tárgyal") ||
        statusStr.includes("aktív") ||
        statusStr.includes("érdeklődik")
      ) {
        activeNegotiations++;
      } else if (
        statusStr.includes("kiküld") ||
        statusStr.includes("piszkozat") ||
        statusStr.includes("sent")
      ) {
        sentOutreach++;
      } else if (
        statusStr.includes("elutasít") ||
        statusStr.includes("bounce") ||
        statusStr.includes("hibás")
      ) {
        rejected++;
      }

      if (idx < 10) {
        let statusColor = "amber";
        if (
          statusStr.includes("tárgyal") ||
          statusStr.includes("aktív") ||
          statusStr.includes("érdeklődik")
        ) {
          statusColor = "emerald";
        } else if (
          statusStr.includes("elutasít") ||
          statusStr.includes("bounce") ||
          statusStr.includes("hibás")
        ) {
          statusColor = "rose";
        } else if (statusStr.includes("új") || statusStr.includes("kapcsolat")) {
          statusColor = "blue";
        }

        activities.push({
          id: String(idx + 1),
          name: String(name),
          company: String(company),
          email: String(emailStr),
          status: String(statusRaw),
          statusColor,
          value: String(valueStr),
          date: row[9] || "Új bejegyzés",
          type: String(typeStr),
        });
      }
    });

    return NextResponse.json({
      success: true,
      source: "google_sheets_live",
      sheetNames: {
        master: firstMasterSheetName,
        contacts: firstContactsSheetName,
      },
      stats: {
        totalLeads,
        sentOutreach,
        activeNegotiations,
        rejected,
      },
      activities,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;

    console.error("Google Sheets API olvasási hiba:", errorMessage);

    return NextResponse.json(
      {
        error: "Google Sheets API olvasási hiba",
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
