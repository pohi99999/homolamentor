import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/requireAdmin";

const SPREADSHEET_ID_MASTER =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SPREADSHEET_ID_CONTACTS =
  process.env.GOOGLE_SPREADSHEET_ID_CONTACTS ||
  "1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM";

export async function GET() {
  // A teljes CRM adatbázist (nevek, e-mailek, telefonszámok, árajánlatok)
  // adja vissza, ezért kizárólag bejelentkezett admin fiók kérheti le.
  const denied = await requireAdmin();
  if (denied) return denied;

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
      range: `'${firstMasterSheetName}'!A1:Z500`,
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
        range: `'${firstContactsSheetName}'!A1:Z500`,
      });
      contactsRows = contactsRes.data.values || [];
    } catch (contactsErr) {
      console.warn("Contacts Sheet read warning:", contactsErr);
    }

    const masterRows = masterRes.data.values || [];
    const firstRowHeader = masterRows.length > 0 ? masterRows[0].map((h) => String(h || "").toLowerCase().trim()) : [];
    
    // Helper to find column index by matching header keywords, with default index fallback
    const findColIndex = (keywords: string[], defaultIdx: number) => {
      const idx = firstRowHeader.findIndex((h) => keywords.some((kw) => h.includes(kw)));
      return idx !== -1 ? idx : defaultIdx;
    };

    const companyIdx = findColIndex(["cégnév", "cég", "company", "vállalkozás", "szervezet"], 0);
    const nameIdx = findColIndex(["kapcsolattartó_neve", "kapcsolattartó", "kontakt", "partner", "ügyfél", "contact name"], 5);
    const phoneIdx = findColIndex(["telefon", "phone", "mobil"], 8);
    const emailIdx = findColIndex(["email", "e-mail", "mail"], 7);
    const statusIdx = findColIndex(["aktuális_státusz", "státusz", "status", "állapot"], 13);
    const valueIdx = findColIndex(["ajánlott_ár", "érték", "value", "összeg", "keret"], 17);
    const dateIdx = findColIndex(["kapcsolatfelvétel_dátuma", "dátum", "date", "időpont"], 11);
    const topicIdx = findColIndex(["kategória", "témá", "téma", "érdeklődés", "projekt", "topic"], 1);
    const lastReactionIdx = findColIndex(["megjegyzés", "reakció", "visszajelzés", "jegyzet", "feedback", "reaction"], 18);
    const websiteIdx = findColIndex(["weboldal", "website", "url"], 10);

    const hasHeader = masterRows.length > 0 && firstRowHeader.some((h) => 
      h.includes("név") || h.includes("cég") || h.includes("státusz") || h.includes("email") || h.includes("dátum")
    );

    const dataRows = hasHeader && masterRows.length > 1 ? masterRows.slice(1) : masterRows;
    const contactDataRows = contactsRows.length > 1 ? contactsRows.slice(1) : [];

    // A Contacts táblázat első munkalapja nem feltétlenül partnerlista (pl. a
    // MASTER_DASHBOARD egy összesítő fül). Csak azokat a sorokat számoljuk
    // leadnek, amelyekben van tényleges e-mail cím — így a "Összes Lead"
    // kártya nem duzzad fel dashboard-sorokkal.
    const contactLeadRows = contactDataRows.filter((row) =>
      row.some((cell) => typeof cell === "string" && /\S+@\S+\.\S+/.test(cell))
    );

    const totalLeads = dataRows.length + contactLeadRows.length;
    let sentOutreach = 0;
    let activeNegotiations = 0;
    let rejected = 0;
    // Se nem megkeresett, se nem tárgyalás, se nem elutasított sorok
    // (jellemzően "Nem megkeresett" / "Feldolgozás alatt") — enélkül a
    // statisztikai kártyák összege kevesebb lenne, mint az összes lead.
    let pending = 0;

    const activities: Array<{
      id: string;
      name: string;
      company: string;
      phone: string;
      email: string;
      status: string;
      statusColor: string;
      value: string;
      date: string;
      topic: string;
      lastReaction: string;
      type: string;
      website: string;
    }> = [];

    dataRows.forEach((row, idx) => {
      // Helper for safe extraction with fallback
      const getVal = (colIdx: number, altIdxes: number[], fallback: string) => {
        if (colIdx >= 0 && row[colIdx] && String(row[colIdx]).trim() !== "") {
          return String(row[colIdx]).trim();
        }
        for (const alt of altIdxes) {
          if (alt >= 0 && row[alt] && String(row[alt]).trim() !== "") {
            return String(row[alt]).trim();
          }
        }
        return fallback;
      };

      const company = getVal(companyIdx, [], `Partner #${idx + 1}`);
      const name = getVal(nameIdx, [], company);
      const phone = getVal(phoneIdx, [], "Nincs megadva");
      const emailStr = getVal(emailIdx, [], "Nincs email");
      const statusRaw = getVal(statusIdx, [], "Folyamatban");
      const statusStr = String(statusRaw).toLowerCase();
      const valueStr = getVal(valueIdx, [4], "N/A");
      const dateStr = getVal(dateIdx, [15], "Nincs adat");
      const topicStr = getVal(topicIdx, [2], "Általános érdeklődés");
      const lastReactionStr = getVal(lastReactionIdx, [16], "Még nincs regisztrált visszajelzés");
      const website = getVal(websiteIdx, [], "");
      const typeStr = topicStr !== "Általános érdeklődés" ? topicStr : "B2B Mentorálás";

      if (
        statusStr.includes("tárgyal") ||
        statusStr.includes("aktív") ||
        statusStr.includes("érdeklődik")
      ) {
        activeNegotiations++;
      } else if (
        statusStr.includes("kiküld") ||
        statusStr.includes("piszkozat") ||
        statusStr.includes("sent") ||
        statusStr.includes("outreach")
      ) {
        sentOutreach++;
      } else if (
        statusStr.includes("elutasít") ||
        statusStr.includes("bounce") ||
        statusStr.includes("hibás") ||
        statusStr.includes("visszadobva")
      ) {
        rejected++;
      } else {
        pending++;
      }

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
        statusStr.includes("hibás") ||
        statusStr.includes("visszadobva")
      ) {
        statusColor = "rose";
      } else if (statusStr.includes("új") || statusStr.includes("kapcsolat")) {
        statusColor = "blue";
      }

      activities.push({
        id: String(idx + 1),
        name,
        company,
        phone,
        email: emailStr,
        status: statusRaw,
        statusColor,
        value: valueStr,
        date: dateStr,
        topic: topicStr,
        website,
        lastReaction: lastReactionStr,
        type: typeStr,
      });
    });

    // Valós havi trend a rögzített kapcsolatfelvételi dátumokból.
    // (Korábban a dashboard egy hardcode-olt, kitalált 7 hónapos görbét
    // rajzolt ki "Google Sheets adatok alapján" felirattal.)
    const HU_MONTHS = [
      "jan.", "febr.", "márc.", "ápr.", "máj.", "jún.",
      "júl.", "aug.", "szept.", "okt.", "nov.", "dec.",
    ];

    const monthlyBuckets = new Map<
      string,
      { leadek: number; megkeresesek: number; konverzio: number }
    >();
    let undatedLeads = 0;

    activities.forEach((act) => {
      const match = /^(\d{4})-(\d{2})/.exec(act.date);
      if (!match) {
        undatedLeads++;
        return;
      }
      const key = `${match[1]}-${match[2]}`;
      const bucket =
        monthlyBuckets.get(key) || { leadek: 0, megkeresesek: 0, konverzio: 0 };

      bucket.leadek++;
      const status = act.status.toLowerCase();
      if (
        status.includes("kiküld") ||
        status.includes("piszkozat") ||
        status.includes("sent") ||
        status.includes("outreach")
      ) {
        bucket.megkeresesek++;
      }
      if (
        status.includes("tárgyal") ||
        status.includes("aktív") ||
        status.includes("érdeklődik")
      ) {
        bucket.konverzio++;
      }

      monthlyBuckets.set(key, bucket);
    });

    // Kumulált görbe: a "Lead Növekedés" a halmozott állományt mutatja.
    let runningLeads = 0;
    let runningOutreach = 0;
    let runningConversion = 0;

    const chartData = Array.from(monthlyBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => {
        runningLeads += bucket.leadek;
        runningOutreach += bucket.megkeresesek;
        runningConversion += bucket.konverzio;

        const [year, month] = key.split("-");
        return {
          month: `${year}. ${HU_MONTHS[Number(month) - 1]}`,
          leadek: runningLeads,
          megkeresesek: runningOutreach,
          konverzio: runningConversion,
          ujLeadek: bucket.leadek,
        };
      });

    return NextResponse.json({
      success: true,
      source: "google_sheets_live",
      sheetNames: {
        master: firstMasterSheetName,
        contacts: firstContactsSheetName,
      },
      counts: {
        master: dataRows.length,
        contacts: contactLeadRows.length,
        undated: undatedLeads,
      },
      stats: {
        totalLeads,
        sentOutreach,
        activeNegotiations,
        rejected,
        pending,
      },
      chartData,
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
