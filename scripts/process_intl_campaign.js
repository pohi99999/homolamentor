/**
 * Homola Mentor Kft. – Nemzetközi (DACH) Kampány Feldolgozó Szkript
 *
 * Egyetlen futtatással:
 *   1. Felveszi az új nemzetközi leadeket a Master CRM (Google Sheets) aljára
 *      "Piszkozat bekészítve" státusszal — a `scripts/add_missing_contacts.js`
 *      biztonságos, közvetlen `gws.exe` bináris hívásán alapuló mintáját követve
 *      (Sheets API `values.append`, sosem ír felül, idempotens).
 *   2. Minden leadnek elkészíti a prémium HTML formázású, országa alapján
 *      DE/EN sablonú Gmail piszkozatot az angol portfólió PDF csatolásával —
 *      a `scripts/create_intl_drafts.js` már bevált logikáját újrahasználva
 *      (ugyanazok a függvények, nincs duplikált kód).
 *
 * A leadek listáját lásd lentebb (INTL_LEADS) — valós, nyilvánosan publikált
 * céges Impressum/Team oldalakról ellenőrzött kapcsolattartók (2026-08-11).
 *
 * HASZNÁLAT
 *   node scripts/process_intl_campaign.js            # éles futtatás
 *   node scripts/process_intl_campaign.js --dry-run  # csak terv, nincs írás/piszkozat
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const {
  resolveTemplatePath,
  loadTemplate,
  buildPremiumEmailHtml,
  buildMimeMessage,
  createDraftViaGwsUpload,
} = require("./create_intl_drafts.js");

const DRY_RUN = process.argv.includes("--dry-run");
const TODAY = "2026-08-11";

// ---------------------------------------------------------------------------
// 1. Nemzetközi lead-lista
//
// Forrás: nyilvános céges Impressum / Team oldalak (§5 DDG kötelező adatok),
// böngészős Google X-ray kutatással azonosítva 2026-08-11-én. Minden e-mail
// cím a cég saját weboldalán hivatalos elérhetőségként szerepel.
// ---------------------------------------------------------------------------
const INTL_LEADS = [
  {
    name: "Harald Schüller",
    email: "harald.schueller@investorenvermittlung.de",
    country: "DE",
    project: "Senior Living",
    company: "Harald Schüller Investorenvermittlung",
  },
  {
    name: "Martin Kopp",
    email: "kontakt@kopp-re.de",
    country: "DE",
    project: "Senior Living",
    company: "Kopp Real Estate GmbH",
  },
  {
    name: "Harald Schmidt",
    email: "hs@magna-properties.de",
    country: "DE",
    project: "Senior Living",
    company: "Magna Properties",
  },
  {
    name: "Tamás Tóth",
    email: "tt@magna-properties.de",
    country: "DE",
    project: "Hospitality Resort",
    company: "Magna Properties",
  },
  {
    name: "Holger Ballwanz",
    email: "dialog@ballwanz.immobilien",
    country: "DE",
    project: "Hospitality Resort",
    company: "Holger Ballwanz Immobilien",
  },
  {
    name: "Horst-Christian Meyer",
    email: "info@immocenter-ungarn.de",
    country: "DE",
    project: "Hospitality Resort",
    company: "Hotel Consulting Meyer Kft (Immocenter Ungarn)",
  },
];

const CRM_NOTE =
  "Nemzetközi (DACH) kampány — automata piszkozat generálás " +
  "(scripts/process_intl_campaign.js, 2026-08-11). Forrás: cég saját Impressum/Team oldala.";

// ---------------------------------------------------------------------------
// gws CLI runner — a scripts/add_missing_contacts.js-ben bevált mintát követi:
// a wrapper (.cmd/.ps1) helyett a mögötte lévő VALÓS bináris futtatható fájlt
// hívjuk meg közvetlenül, execFileSync-kel, tiszta argv-tömbbel — így egyetlen
// shell sem parseolja újra a parancssort, tetszőleges tartalom (`&`, idézőjel,
// ékezet) biztonságosan átmegy.
// ---------------------------------------------------------------------------
const IS_WIN = process.platform === "win32";

function resolveGwsBinary() {
  if (!IS_WIN) return "gws";
  const candidate = path.join(
    process.env.APPDATA || "",
    "npm", "node_modules", "@googleworkspace", "cli", "bin", "gws.exe"
  );
  if (fs.existsSync(candidate)) return candidate;
  return "gws";
}

const GWS_BIN = resolveGwsBinary();

function runGws(argv, { params, json } = {}) {
  const args = [...argv];
  if (params !== undefined) args.push("--params", JSON.stringify(params));
  if (json !== undefined) args.push("--json", JSON.stringify(json));

  const out = execFileSync(GWS_BIN, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const start = out.indexOf("{");
  if (start === -1) throw new Error(`Váratlan gws kimenet: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start));
}

// ---------------------------------------------------------------------------
// 2. CRM feltöltés (Google Sheets)
// ---------------------------------------------------------------------------
const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Master_Vevőlista";

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function findColIndex(header, keywords, fallback) {
  const idx = header.findIndex((h) => keywords.some((kw) => normalize(h).includes(kw)));
  return idx !== -1 ? idx : fallback;
}

function extractEmail(raw) {
  const match = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(String(raw || ""));
  return match ? match[0].toLowerCase().trim() : "";
}

function appendCrmRows(rows) {
  const params = {
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A:S`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
  };
  return runGws(["sheets", "spreadsheets", "values", "append"], {
    params,
    json: { values: rows },
  });
}

// ---------------------------------------------------------------------------
// 3. Fő folyamat
// ---------------------------------------------------------------------------
function main() {
  console.log("==========================================================");
  console.log("  Homola Mentor Kft. — Nemzetközi Kampány Feldolgozó");
  console.log(`  ${DRY_RUN ? "DRY RUN — nincs írás/piszkozat" : "ÉLES FUTTATÁS"}`);
  console.log("==========================================================\n");

  console.log("Master CRM olvasása...");
  const existing = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: {
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:S1000`,
    },
  });

  const allRows = existing.values || [];
  if (allRows.length === 0) {
    throw new Error("A Master_Vevőlista üresnek tűnik — nem folytatom.");
  }

  const header = allRows[0];
  const dataRows = allRows.slice(1);

  const col = {
    company: findColIndex(header, ["cégnév", "cég", "company"], 0),
    category: findColIndex(header, ["kategória", "téma"], 1),
    contactName: findColIndex(header, ["kapcsolattartó_neve", "kapcsolattartó", "kontakt"], 5),
    email: findColIndex(header, ["email", "e-mail"], 7),
    date: findColIndex(header, ["első_kapcsolatfelvétel", "kapcsolatfelvétel", "dátum"], 11),
    channel: findColIndex(header, ["csatorna"], 12),
    status: findColIndex(header, ["aktuális_státusz", "státusz", "status"], 13),
    note: findColIndex(header, ["megjegyzés"], header.length - 1),
  };

  const existingEmails = new Set(
    dataRows.map((row) => extractEmail(row[col.email])).filter(Boolean)
  );
  console.log(`Meglévő CRM sorok: ${dataRows.length} db\n`);

  const pdfPath = path.join(__dirname, "..", "public", "Portfolio_EN_v6.pdf");
  console.log(`Angol csatolmány PDF: ${pdfPath}`);
  console.log(`Feldolgozandó nemzetközi leadek: ${INTL_LEADS.length} db`);
  console.log("----------------------------------------------------------\n");

  const crmRowsToAppend = [];
  const successes = [];
  const failures = [];

  for (const lead of INTL_LEADS) {
    const email = extractEmail(lead.email);

    if (existingEmails.has(email)) {
      console.log(`[Kihagyva] ${lead.name} <${email}> — már szerepel a CRM-ben.`);
      continue;
    }

    const templatePath = resolveTemplatePath(lead);
    if (!templatePath || !fs.existsSync(templatePath)) {
      console.error(`[Hiba] Nincs elérhető sablon: project="${lead.project}", country="${lead.country}" (${lead.name}).`);
      failures.push({ lead, reason: "Nincs sablon" });
      continue;
    }

    const { subject, body, lang } = loadTemplate(templatePath, lead);
    const htmlBody = buildPremiumEmailHtml({ subject, bodyText: body, lang });
    const fullMimeRaw = buildMimeMessage(lead, subject, htmlBody, pdfPath);

    if (DRY_RUN) {
      console.log(`[Terv] ${lead.name} <${email}> | ${lead.company} | ${lead.country} | Sablon: ${path.basename(templatePath)}`);
      continue;
    }

    try {
      const gwsRes = createDraftViaGwsUpload(fullMimeRaw);
      const draftId = gwsRes.id || gwsRes.message?.id || "OK";
      console.log(`[Siker] Piszkozat elkészült: ${lead.name} (${lead.company}) | ${lead.country} | Sablon: ${path.basename(templatePath)} | Draft ID: ${draftId}`);

      const row = new Array(header.length).fill("");
      row[col.company] = lead.company;
      row[col.category] = "Ingatlan & Ipari Portfólió (Nemzetközi)";
      row[col.contactName] = lead.name;
      row[col.email] = lead.email;
      // Apostróf-előtag: USER_ENTERED mellett ez kényszeríti ki, hogy a Sheets
      // sima szövegként tárolja a dátumot (ne alakítsa dátum-sorszámmá) —
      // így egyezik a CRM meglévő soraiban használt "YYYY-MM-DD" szöveges
      // formátummal, amit az admin dashboard dátumformázása vár.
      row[col.date] = `'${TODAY}`;
      row[col.channel] = "Email";
      row[col.status] = "Piszkozat bekészítve";
      row[col.note] = CRM_NOTE;
      crmRowsToAppend.push(row);

      successes.push({ lead, draftId });
    } catch (err) {
      const errOutput = err.stderr ? err.stderr.toString() : err.message;
      console.error(`[Hiba] Piszkozat létrehozása sikertelen (${lead.name}): ${errOutput}`);
      failures.push({ lead, reason: errOutput });
    }
  }

  console.log("\n----------------------------------------------------------");

  if (DRY_RUN) {
    console.log("--dry-run: nem történt CRM írás vagy piszkozat-létrehozás.");
    return;
  }

  if (crmRowsToAppend.length === 0) {
    console.log("Nincs új CRM sor felveendő (minden lead már szerepelt, vagy mind hibás volt).");
  } else {
    console.log(`\nÍrás a Google Sheets API append metódusával (${SHEET_NAME})...`);
    const result = appendCrmRows(crmRowsToAppend);
    const updatedRange = result?.updates?.updatedRange || "(ismeretlen)";
    const updatedRows = result?.updates?.updatedRows ?? "?";
    console.log(`✓ Sikeres CRM írás. Beszúrt tartomány: ${updatedRange} (${updatedRows} sor)`);
  }

  console.log("\n==========================================================");
  console.log("  ÖSSZEGZÉS");
  console.log("==========================================================");
  console.log(`  Sikeresen felvett partner + bekészített piszkozat: ${successes.length} db`);
  successes.forEach(({ lead, draftId }) => {
    console.log(`   • ${lead.name} (${lead.company}) <${lead.email}> | ${lead.country} | ${lead.project} | Draft ID: ${draftId}`);
  });
  if (failures.length > 0) {
    console.log(`\n  Hibás/kihagyott: ${failures.length} db`);
    failures.forEach(({ lead, reason }) => {
      console.log(`   • ${lead.name} <${lead.email}> — ${reason}`);
    });
  }
  console.log("==========================================================");
}

main();
