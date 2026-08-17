/**
 * Homola Mentor Kft. – Kampány Reakció Szinkronizáló Szkript (#3)
 * Dátum: 2026-08-17
 *
 * Cél: a 3. nemzetközi kampányhullámra beérkezett első válasz rögzítése a
 * Master_Vevőlista CRM-ben.
 *
 * A REAKCIÓ
 *   Cureus GmbH — a kiajánló 2026-08-17 09:58-kor ment ki Christian Möhrke
 *   (kontakt@cureus.de) címére; a válasz 50 perccel később, 10:48-kor érkezett
 *   Stefanie Monesitől (smo@cureus.de, Teamassistenz Projektentwicklung).
 *   Udvarias elutasítás két konkrét indokkal, ugyanakkor NEM teljes elzárkózás:
 *   mellékelték az akvizíciós profiljukat és jelezték, hogy a profiljukba illő
 *   projektekre nyitottak.
 *
 * MINTAKÖVETÉS (a korábbi tanulságok szerint)
 *   - `execFileSync` + közvetlen `gws.exe` bináris hívás, tiszta argv-tömbbel
 *     (AGENTS.md 1. tanulság — sosem execSync + cmd.exe shell).
 *   - Sor-azonosítás KIZÁRÓLAG pontos e-mail cím alapján, cégnév-fallback nélkül
 *     (AGENTS.md 8. tanulság — a cégnév-egyezés korábban rossz sort írt felül).
 *   - A Megjegyzés oszlopot HOZZÁFŰZÉSSEL frissíti, nem felülírja
 *     (AGENTS.md 12. tanulság — különben elveszne a cím-verifikációs metaadat).
 *
 * HASZNÁLAT
 *   node scripts/update_crm_responses_3.js --dry-run
 *   node scripts/update_crm_responses_3.js
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DRY_RUN = process.argv.includes("--dry-run");

const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Master_Vevőlista";

// ---------------------------------------------------------------------------
// A rögzítendő reakciók.
//
// `emails`: minden ismert cím, ami ehhez a partnerhez tartozhat a CRM-ben.
//           A CRM-ben a megkeresett cím szerepel (kontakt@), a válasz viszont
//           másik címről jött (smo@) — mindkettőt felsoroljuk, hogy pontos
//           egyezéssel megtaláljuk a sort, cégnév-tippelés nélkül.
// ---------------------------------------------------------------------------
const REACTIONS = [
  {
    label: "Cureus GmbH",
    emails: ["kontakt@cureus.de", "smo@cureus.de"],
    status: "Elutasítva / Archiválva",
    note:
      "2026.08.17: Stefanie Monesi (Teamassistenz Projektentwicklung, smo@cureus.de) " +
      "válaszolt Christian Möhrke helyett, 50 perccel a kiküldés után. Udvarias elutasítás " +
      "két indokkal: (1) kizárólag Németországon belül terjeszkednek, külföldi projektet nem " +
      "visznek; (2) alapvetően nem vesznek át kulcsrakész vagy már nagyrészt kész projektet — " +
      "a Nagycenk 75%-os készültsége így kizáró ok. NEM teljes elzárkózás: csatolták a " +
      "Cureus_Ankaufsprofil_DE_2026.pdf akvizíciós profiljukat, és jelezték, hogy a profiljukba " +
      "illő projektekre bármikor nyitottak. Jövőbeli ajánlatnál: németországi, korai fázisú " +
      "(nem kulcsrakész) fejlesztés lehet releváns.",
  },
];

// ---------------------------------------------------------------------------
// gws CLI runner
// ---------------------------------------------------------------------------
const IS_WIN = process.platform === "win32";

function resolveGwsBinary() {
  if (!IS_WIN) return "gws";
  const candidate = path.join(
    process.env.APPDATA || "",
    "npm", "node_modules", "@googleworkspace", "cli", "bin", "gws.exe"
  );
  return fs.existsSync(candidate) ? candidate : "gws";
}

const GWS_BIN = resolveGwsBinary();

function runGws(argv, { params, json } = {}) {
  const args = [...argv];
  if (params !== undefined) args.push("--params", JSON.stringify(params));
  if (json !== undefined) args.push("--json", JSON.stringify(json));
  const out = execFileSync(GWS_BIN, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const start = out.indexOf("{");
  if (start === -1) throw new Error(`Váratlan gws kimenet: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start));
}

function normalize(t) { return String(t || "").toLowerCase().trim(); }

function findColIndex(header, keywords, fallback) {
  const idx = header.findIndex((h) => keywords.some((kw) => normalize(h).includes(kw)));
  return idx !== -1 ? idx : fallback;
}

function extractEmail(raw) {
  const m = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(String(raw || ""));
  return m ? m[0].toLowerCase().trim() : "";
}

function colLetter(index) {
  let letter = "";
  let i = index;
  while (i >= 0) {
    const rem = i % 26;
    letter = String.fromCharCode(rem + 65) + letter;
    i = Math.floor((i - rem) / 26) - 1;
  }
  return letter;
}

// ---------------------------------------------------------------------------
function main() {
  console.log("==========================================================");
  console.log("  Kampány reakció szinkron (#3) — 2026-08-17");
  console.log(`  ${DRY_RUN ? "DRY RUN — nincs írás" : "ÉLES FUTTATÁS"}`);
  console.log("==========================================================\n");

  const existing = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: { spreadsheetId: SPREADSHEET_ID, range: `'${SHEET_NAME}'!A1:S1000` },
  });

  const allRows = existing.values || [];
  if (allRows.length === 0) throw new Error("A Master_Vevőlista üresnek tűnik — nem folytatom.");

  const header = allRows[0];
  const dataRows = allRows.slice(1);

  const col = {
    company: findColIndex(header, ["cégnév", "cég", "company"], 0),
    contactName: findColIndex(header, ["kapcsolattartó_neve", "kapcsolattartó", "kontakt"], 5),
    email: findColIndex(header, ["email", "e-mail"], 7),
    status: findColIndex(header, ["aktuális_státusz", "státusz", "status"], 13),
    note: findColIndex(header, ["megjegyzés"], header.length - 1),
  };

  let updated = 0;
  let notFound = 0;

  for (const reaction of REACTIONS) {
    const wanted = reaction.emails.map((e) => e.toLowerCase().trim());

    // KIZÁRÓLAG pontos e-mail egyezés. Cégnév-alapú fallback tudatosan nincs.
    const matches = [];
    dataRows.forEach((row, idx) => {
      const email = extractEmail(row[col.email]);
      if (email && wanted.includes(email)) matches.push({ rowNum: idx + 2, row, email });
    });

    if (matches.length === 0) {
      console.error(`[Nem található] ${reaction.label} — egyik cím sem szerepel a CRM-ben: ${wanted.join(", ")}`);
      notFound++;
      continue;
    }

    for (const { rowNum, row, email } of matches) {
      const prevStatus = String(row[col.status] || "").trim();
      const prevNote = String(row[col.note] || "").trim();
      // Hozzáfűzés — a korábbi megjegyzés (benne a cím-verifikációs metaadat) megmarad.
      const newNote = prevNote ? `${prevNote} | ${reaction.note}` : reaction.note;

      console.log(`[Sor ${rowNum}] ${row[col.company]} <${email}>`);
      console.log(`   Kapcsolattartó : ${row[col.contactName]}`);
      console.log(`   Státusz        : "${prevStatus}" -> "${reaction.status}"`);
      console.log(`   Megjegyzés     : ${prevNote.length} -> ${newNote.length} karakter (hozzáfűzés)\n`);

      if (DRY_RUN) continue;

      runGws(["sheets", "spreadsheets", "values", "update"], {
        params: {
          spreadsheetId: SPREADSHEET_ID,
          range: `'${SHEET_NAME}'!${colLetter(col.status)}${rowNum}`,
          valueInputOption: "USER_ENTERED",
        },
        json: { values: [[reaction.status]] },
      });

      runGws(["sheets", "spreadsheets", "values", "update"], {
        params: {
          spreadsheetId: SPREADSHEET_ID,
          range: `'${SHEET_NAME}'!${colLetter(col.note)}${rowNum}`,
          valueInputOption: "USER_ENTERED",
        },
        json: { values: [[newNote]] },
      });

      updated++;
    }
  }

  console.log("----------------------------------------------------------");
  console.log(`  Frissített sor: ${updated} | Nem talált reakció: ${notFound}`);
  if (DRY_RUN) console.log("  --dry-run: nem történt írás.");
  console.log("==========================================================");
}

main();
