/**
 * Homola Mentor Kft. — "Kereslet_Talalatok" munkalap inicializálása
 *
 * Egyszeri, helyi futtatásra szánt szkript: létrehozza az ingatlan-kereső
 * funkció CRM-lapját (ha még nem létezik) és beírja a fejlécsort.
 *
 * Csak a `gws` CLI-n keresztül fut, execFileSync + valódi gws.exe bináris
 * hívással (AGENTS.md 1. tanulság) — ez helyi, egyszeri szkript, NEM Vercel
 * API route, ezért itt biztonságos a gws CLI-t használni (a gws nem npm
 * függőség, Vercel serverless futtatókörnyezetben nem elérhető — lásd a
 * property-search API route-ok googleapis JWT alapú megoldását).
 *
 * HASZNÁLAT
 *   node scripts/init_demand_sheet.js
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const IS_WIN = process.platform === "win32";
const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";
const HEADER = [
  "Datum",
  "Keresesi_Kifejezes",
  "Kategoria",
  "Lokacio_Hint",
  "Ar_Tartomany",
  "AI_Osszefoglalo",
  "Erdeklodo_Neve",
  "Erdeklodo_Email",
  "Nyelv",
  "Allapot",
];

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

function main() {
  console.log(`"${SHEET_NAME}" munkalap ellenőrzése/létrehozása...\n`);

  try {
    runGws(["sheets", "spreadsheets", "batchUpdate"], {
      params: { spreadsheetId: SPREADSHEET_ID },
      json: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    console.log(`✓ A "${SHEET_NAME}" munkalap létrejött.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      console.log(`ℹ A "${SHEET_NAME}" munkalap már létezik, folytatás a fejléc ellenőrzésével.`);
    } else {
      console.error("❌ Hiba a munkalap létrehozásakor:", message);
      process.exit(1);
    }
  }

  console.log("\nFejlécsor beírása...");
  runGws(["sheets", "spreadsheets", "values", "update"], {
    params: {
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1`,
      valueInputOption: "USER_ENTERED",
    },
    json: { values: [HEADER] },
  });
  console.log("✓ Fejlécsor beírva.");

  console.log("\nEllenőrzés — visszaolvasás...");
  const verify = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: { spreadsheetId: SPREADSHEET_ID, range: `'${SHEET_NAME}'!A1:J1` },
  });
  console.log("Beolvasott fejléc:", JSON.stringify(verify.values));

  console.log("\nKész.");
}

main();
