/**
 * Homola Mentor Kft. — Hiányzó kapcsolattartók felvétele a Master CRM-be
 *
 * A `scripts/audit_drafts_crm.js` audit derítette ki, hogy 4 kiküldött
 * kiajánló olyan e-mail címre ment, amely meglévő CTP Invest / Panattoni
 * Europe partner új kapcsolattartója, de nincs rögzítve a CRM-ben.
 *
 * Ez a szkript KIZÁRÓLAG a Google Sheets API `values.append` metódusát hívja
 * (a `gws` CLI meglévő OAuth2 bejelentkezésén keresztül) — ez a hivatalos API,
 * nem UI-automatizáció. (Lásd AGENT.md 2026-08-09 incidens-bejegyzés: éles
 * Google Sheets dokumentumon kizárólag a Sheets API-n keresztül szabad írni.)
 * `append` sosem írja felül a meglévő sorokat, csak a táblázat vége után
 * szúr be újakat.
 *
 * IDEMPOTENS: minden futtatás előtt beolvassa a jelenlegi e-mail címeket, és
 * kihagyja azokat a kontaktokat, amelyek már szerepelnek — újrafuttatva nem
 * hoz létre duplikátumot.
 *
 * OSZLOP-EGYEZTETÉS: a fejlécsort futásidőben olvassa be és kulcsszó alapján
 * azonosítja az oszlopokat (ugyanaz a logika, mint a src/app/api/crm-sync és
 * az audit_drafts_crm.js szkriptekben) — nincs kőbe vésett oszlopindex.
 *
 * HASZNÁLAT
 *   node scripts/add_missing_contacts.js            # valós írás
 *   node scripts/add_missing_contacts.js --dry-run  # csak a tervezett sorokat írja ki
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const IS_WIN = process.platform === "win32";
const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Master_Vevőlista";
const DRY_RUN = process.argv.includes("--dry-run");

// A src/app/api/crm-sync/route.ts-ben már bevált CTP Invest / Panattoni
// Europe formátumot követi: ISO dátum (a dashboard grafikonja a
// /^(\d{4})-(\d{2})/ mintával parseolja a kapcsolatfelvétel dátumát — egy
// eltérő formátum "dátum nélkülinek" látszana a trendvonalon).
const NEW_CONTACTS = [
  {
    company: "Panattoni Europe",
    contactName: "Tóth Mariann",
    email: "mtoth@panattoni.com",
    status: "Kiajánló kiküldve",
    date: "2026-08-04",
    category: "Ipari & Logisztikai Fejlesztő",
  },
  {
    company: "CTP Invest",
    contactName: "Kiss András",
    email: "andras.kiss@ctp.eu",
    status: "Kiajánló kiküldve",
    date: "2026-08-04",
    category: "Ipari & Logisztikai Fejlesztő",
  },
  {
    company: "CTP Invest",
    contactName: "Tar Péter",
    email: "peter.tar@ctp.eu",
    status: "Kiajánló kiküldve",
    date: "2026-08-04",
    category: "Ipari & Logisztikai Fejlesztő",
  },
  {
    company: "CTP Invest",
    contactName: "Paróczi Titusz",
    email: "titusz.paroczi@ctp.eu",
    status: "Kiajánló kiküldve",
    date: "2026-08-04",
    category: "Ipari & Logisztikai Fejlesztő",
  },
];

const NOTE =
  "Automatikus CRM audit alapján felvéve (2026-08-10, scripts/audit_drafts_crm.js) — " +
  "meglévő partner új kapcsolattartója, akinek már kiment a kiajánló.";

// ---------------------------------------------------------------------------
// gws CLI runner
// ---------------------------------------------------------------------------

/**
 * A `gws` parancs Windows alatt egy `.ps1`/`.cmd` wrapper, amely a JSON
 * argumentumot egy köztes shellen (cmd.exe / PowerShell natív argv-marshalling)
 * keresztül adja tovább — ez a JSON-ban lévő `&` karaktereket és beágyazott
 * idézőjeleket szétroncsolja (ellenőrizve: mindkét út hibás JSON-t eredményezett).
 *
 * Ehelyett a wrapper mögötti VALÓS bináris futtatható fájlt hívjuk meg
 * közvetlenül, `execFileSync`-kel, tiszta argv-tömbbel — így egyetlen shell
 * sem parseolja újra a parancssort, a JSON tetszőleges tartalommal (`&`,
 * idézőjel, ékezet) biztonságosan átmegy. (A wrapper forrása —
 * `%APPDATA%\npm\gws.ps1` — és a mögötte hívott `run.js` alapján derült ki
 * a bináris pontos elérési útja.)
 */
function resolveGwsBinary() {
  if (!IS_WIN) return "gws";
  const candidate = path.join(
    process.env.APPDATA || "",
    "npm", "node_modules", "@googleworkspace", "cli", "bin", "gws.exe"
  );
  if (fs.existsSync(candidate)) return candidate;
  // Ismeretlen Windows-telepítésnél essünk vissza a PATH-beli gws-re —
  // ez a régi, shell-en át futó út, de legalább nem omlik el csendben.
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

function gwsRead(argv, params) {
  return runGws(argv, { params });
}

/**
 * Az egyetlen írási művelet, amit ez a szkript ismer: Sheets API `append`.
 * Szándékosan nincs generikus "gwsWrite" helper — ez az explicit, egyetlen
 * hívás korlátozza a lehetséges hibák hatókörét egy éles dokumentumon.
 * `append` sosem írja felül a meglévő sorokat, csak a táblázat vége után
 * szúr be újakat.
 */
function appendRows(rows) {
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
// Oszlop-egyeztetés (ugyanaz a heurisztika, mint crm-sync/route.ts-ben)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Belépési pont
// ---------------------------------------------------------------------------

function main() {
  console.log(`Master CRM olvasása (${DRY_RUN ? "DRY RUN — nincs írás" : "ÉLES ÍRÁS"})...\n`);

  const existing = gwsRead(["sheets", "spreadsheets", "values", "get"], {
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:S1000`,
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

  console.log("Azonosított oszlopok:");
  Object.entries(col).forEach(([key, idx]) => {
    console.log(`   ${key.padEnd(12)} -> "${header[idx]}" (${idx}. oszlop)`);
  });

  const existingEmails = new Set(
    dataRows.map((row) => extractEmail(row[col.email])).filter(Boolean)
  );
  console.log(`\nMeglévő sorok: ${dataRows.length} db, egyedi e-mail cím: ${existingEmails.size} db`);

  const toInsert = [];
  const skipped = [];

  NEW_CONTACTS.forEach((c) => {
    const email = extractEmail(c.email);
    if (existingEmails.has(email)) {
      skipped.push(c);
      return;
    }
    const row = new Array(header.length).fill("");
    row[col.company] = c.company;
    row[col.category] = c.category;
    row[col.contactName] = c.contactName;
    row[col.email] = c.email;
    // Apostróf-előtag: USER_ENTERED mellett kényszeríti a Sheets-et, hogy sima
    // szövegként tárolja a dátumot (ne alakítsa dátum-sorszámmá, pl. 46238) —
    // enélkül az admin dashboard dátumformázása töri a megjelenítést.
    row[col.date] = `'${c.date}`;
    row[col.channel] = "Email";
    row[col.status] = c.status;
    row[col.note] = NOTE;
    toInsert.push({ contact: c, row });
  });

  console.log(`\nFelveendő új sorok: ${toInsert.length} db`);
  console.log(`Kihagyott (már létező e-mail): ${skipped.length} db`);
  skipped.forEach((c) => console.log(`   • ${c.email} — már szerepel a CRM-ben, kihagyva`));

  if (toInsert.length === 0) {
    console.log("\nNincs mit hozzáadni — az összes kontakt már szerepel a CRM-ben. Kilépés.");
    return;
  }

  console.log("\nTervezett sorok:");
  toInsert.forEach(({ contact, row }) => {
    console.log(`   • ${contact.company} — ${contact.contactName} <${contact.email}>`);
    console.log(`     [${row.map((v) => JSON.stringify(v)).join(", ")}]`);
  });

  if (DRY_RUN) {
    console.log("\n--dry-run: nem történt írás. Éles futtatáshoz hagyd el a kapcsolót.");
    return;
  }

  console.log(`\nÍrás a Google Sheets API append metódusával (${SHEET_NAME})...`);
  const result = appendRows(toInsert.map((t) => t.row));

  const updatedRange = result?.updates?.updatedRange || "(ismeretlen)";
  const updatedRows = result?.updates?.updatedRows ?? "?";
  console.log(`\n✓ Sikeres írás. Beszúrt tartomány: ${updatedRange} (${updatedRows} sor)`);

  console.log("\nEllenőrzés — visszaolvasás a beszúrt tartományból...");
  const verify = gwsRead(["sheets", "spreadsheets", "values", "get"], {
    spreadsheetId: SPREADSHEET_ID,
    range: updatedRange,
  });
  (verify.values || []).forEach((row, i) => {
    console.log(
      `   sor ${i + 1}: ${row[col.company]} | ${row[col.contactName]} | ${row[col.email]} | ${row[col.status]}`
    );
  });

  console.log("\nKész. A 4 kontakt hozzáadva a Master CRM-hez (csak append, semmi nem íródott felül).");
}

main();
