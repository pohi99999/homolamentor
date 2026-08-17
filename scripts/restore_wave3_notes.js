/**
 * Homola Mentor Kft. – 3. hullám: CRM Megjegyzés-helyreállító (egyszeri javítás)
 *
 * MIÉRT: a `sync_intl_campaign_delivery.js` 2026-08-17-i futtatása a Megjegyzés
 * oszlopot FELÜLÍRTA a kiküldés tényével, így elveszett a lead felvételekor oda
 * írt cím-verifikációs metaadat (`Cím-verifikáció: ... Forrás: ...`) — épp az az
 * információ, ami egy későbbi bounce kivizsgálásakor a legértékesebb lenne.
 *
 * A szinkron szkript azóta javítva (hozzáfűz, nem ír felül). Ez a szkript a már
 * megtörtént adatvesztést állítja helyre: a `process_new_leads.js` lead-listájából
 * rekonstruálja az eredeti megjegyzést, és összefűzi a kiküldési bejegyzéssel.
 *
 * Sor-azonosítás KIZÁRÓLAG pontos e-mail cím alapján (AGENTS.md 8. tanulság).
 *
 * HASZNÁLAT
 *   node scripts/restore_wave3_notes.js --dry-run
 *   node scripts/restore_wave3_notes.js
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DRY_RUN = process.argv.includes("--dry-run");
const TODAY = "2026-08-17";

const CRM_NOTE_BASE =
  "Nemzetközi kampány 3. hullám — kutatott lead, automata piszkozat generálás " +
  "(scripts/process_new_leads.js, 2026-08-17).";

const SENT_NOTE = `Nemzetközi kiajánló kiküldve (${TODAY}, scripts/sync_intl_campaign_delivery.js).`;

// A process_new_leads.js lead-listájának verifikációs metaadatai.
const WAVE3 = {
  "empfang@immac.de": {
    conf: "verified",
    src: "immac.de kontakt/impressum – Vorstand: Christopher Dill, Mechthild Mösenfechtel",
  },
  "kontakt@cureus.de": {
    conf: "verified",
    src: "cureus.de Impressum – Geschäftsführer: Christian Möhrke (CEO), Oliver Sturhahn (CFO)",
  },
  "info@carestone.com": {
    conf: "verified",
    src: "carestone-group.com Impressum – GF: Ralf Licht, Sandro Pawils, Daniel Ahrendt",
  },
  "maarten.otte@ctp.eu": {
    conf: "pattern-derived",
    src:
      "ctp.eu/investor-contact – név és beosztás publikus, cím elfedve. " +
      "Mintázat (keresztnév.vezetéknév@ctp.eu) igazolva: szabolcs.farkas@ctp.eu, pavel.svihalek@ctp.eu",
  },
  "info@accolade.eu": {
    conf: "verified",
    src: "accolade.eu/contact – cseh HQ hivatalos kapcsolattartó címe",
  },
  "info@garbe.de": {
    conf: "verified",
    src: "garbe-industrial.de/contact – hivatalos céges kapcsolattartó cím (Hamburg)",
  },
  "europe@thermegroup.com": {
    conf: "verified",
    src: "thermegroup.com/contact – európai regionális iroda hivatalos címe (bécsi HQ)",
  },
  "office.badschallerbach@eurothermen.at": {
    conf: "verified",
    src: "eurothermen.at – CEO Patrick Hochhauser, publikált resort-kapcsolattartó cím",
  },
  "queriesEuropeandAfrica@meridiam.com": {
    conf: "verified",
    src: "meridiam.com/contact – Európa & Afrika régiós megkeresési cím",
  },
  "proparco@proparco.fr": {
    conf: "verified",
    src: "proparco.fr/contact – hivatalos intézményi kapcsolattartó cím (Párizs)",
  },
  "eaif@ninetyone.com": {
    conf: "verified",
    src: "eaif.com/working-with-us/contact-us – befektetési megkeresések hivatalos címe",
  },
  "communications@africa50.com": {
    conf: "verified",
    src: "africa50.com/contact-us – hivatalos kapcsolattartó cím (Casablanca)",
  },
};

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

const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Master_Vevőlista";

function normalize(t) { return String(t || "").toLowerCase().trim(); }
function findColIndex(header, keywords, fallback) {
  const idx = header.findIndex((h) => keywords.some((kw) => normalize(h).includes(kw)));
  return idx !== -1 ? idx : fallback;
}
function extractEmail(raw) {
  const m = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(String(raw || ""));
  return m ? m[0].toLowerCase().trim() : "";
}

function main() {
  console.log("==========================================================");
  console.log("  3. hullám — CRM Megjegyzés helyreállítás");
  console.log(`  ${DRY_RUN ? "DRY RUN" : "ÉLES FUTTATÁS"}`);
  console.log("==========================================================\n");

  const existing = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: { spreadsheetId: SPREADSHEET_ID, range: `'${SHEET_NAME}'!A1:S1000` },
  });
  const allRows = existing.values || [];
  const header = allRows[0];
  const dataRows = allRows.slice(1);

  const col = {
    email: findColIndex(header, ["email", "e-mail"], 7),
    note: findColIndex(header, ["megjegyzés"], header.length - 1),
  };
  const noteLetter = String.fromCharCode(65 + col.note);

  // Az e-mail kulcsokat kisbetűsen indexeljük, hogy a CRM-beli írásmódtól
  // függetlenül egyezzenek (pl. queriesEuropeandAfrica@...).
  const wave3ByLowerEmail = new Map(
    Object.entries(WAVE3).map(([k, v]) => [k.toLowerCase(), v])
  );

  let restored = 0;
  let skipped = 0;

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const email = extractEmail(row[col.email]);
    const meta = wave3ByLowerEmail.get(email);
    if (!meta) return;

    const currentNote = String(row[col.note] || "").trim();

    if (currentNote.includes("Cím-verifikáció")) {
      console.log(`[Kihagyva] Sor ${rowNum} <${email}> — a verifikációs adat már megvan.`);
      skipped++;
      return;
    }

    const rebuilt =
      `${CRM_NOTE_BASE} Cím-verifikáció: ${meta.conf}. Forrás: ${meta.src}` +
      (currentNote ? ` | ${currentNote}` : ` | ${SENT_NOTE}`);

    console.log(`[Helyreállítás] Sor ${rowNum} <${email}> (${meta.conf})`);

    if (!DRY_RUN) {
      runGws(["sheets", "spreadsheets", "values", "update"], {
        params: {
          spreadsheetId: SPREADSHEET_ID,
          range: `'${SHEET_NAME}'!${noteLetter}${rowNum}`,
          valueInputOption: "USER_ENTERED",
        },
        json: { values: [[rebuilt]] },
      });
    }
    restored++;
  });

  console.log("\n----------------------------------------------------------");
  console.log(`  Helyreállítva: ${restored} db | Kihagyva: ${skipped} db`);
  if (DRY_RUN) console.log("  --dry-run: nem történt írás.");
  console.log("==========================================================");
}

main();
