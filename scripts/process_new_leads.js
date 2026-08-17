/**
 * Homola Mentor Kft. – Új Kutatott Nemzetközi Leadek Feldolgozó Szkriptje
 * (3. hullám, 2026-08-17)
 *
 * Egyetlen futtatással:
 *   1. Felveszi az új, kutatással azonosított nemzetközi leadeket a Master CRM
 *      (Google Sheets) aljára "Piszkozat bekészítve" státusszal.
 *   2. Minden leadnek elkészíti a prémium HTML formázású, országa alapján DE/EN
 *      sablonú Gmail piszkozatot az angol portfólió PDF csatolásával.
 *
 * A `scripts/process_intl_campaign.js` bevált mintáját követi, azzal a
 * különbséggel, hogy a lead-lista két új témát is lefed (ipari/logisztikai és
 * nyugat-afrikai infrastruktúra), valamint minden leadnél explicit módon
 * rögzíti a forrást és az e-mail cím verifikáltsági szintjét (lásd `source` és
 * `emailConfidence` mezők) — ez utóbbi a korábbi kampány tanulsága nyomán
 * került be (osztály-szintű címek kemény bounce-a, lásd AGENTS.md 7. pont).
 *
 * HASZNÁLAT
 *   node scripts/process_new_leads.js            # éles futtatás
 *   node scripts/process_new_leads.js --dry-run  # csak terv, nincs írás/piszkozat
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
const TODAY = "2026-08-17";

// ---------------------------------------------------------------------------
// 1. Új, kutatott lead-lista (2026-08-17)
//
// Minden cím nyilvánosan publikált céges forrásból származik (Impressum / §5 DDG
// és §5 ECG szerinti kötelező adatok, Contact/Investor-Relations oldalak,
// sajtóközlemények sajtókapcsolati blokkjai).
//
// `emailConfidence` értékei:
//   "verified"        – a cím szó szerint így szerepel egy publikus céges oldalon.
//   "pattern-derived" – a személy neve és beosztása publikus, a cím maga nem;
//                       a cégdomain e-mail-mintázata viszont LEGALÁBB KÉT
//                       független, publikusan közölt címből bizonyított, és a
//                       cím ezzel a mintázattal lett képezve.
//
// Találgatott ("guessed") cím szándékosan NINCS a listában.
// ---------------------------------------------------------------------------
const newLeads = [
  // --- 1. Senior Living / Healthcare (DACH) --------------------------------
  {
    name: "Christopher Dill",
    email: "empfang@immac.de",
    country: "DE",
    project: "Senior Living",
    company: "IMMAC Holding AG",
    role: "Vorstand (CEO)",
    emailConfidence: "verified",
    source: "immac.de kontakt/impressum – Vorstand: Christopher Dill, Mechthild Mösenfechtel",
  },
  {
    name: "Christian Möhrke",
    email: "kontakt@cureus.de",
    country: "DE",
    project: "Senior Living",
    company: "Cureus GmbH",
    role: "CEO / Geschäftsführer",
    emailConfidence: "verified",
    source: "cureus.de Impressum – Geschäftsführer: Christian Möhrke (CEO), Oliver Sturhahn (CFO)",
  },
  {
    name: "Ralf Licht",
    email: "info@carestone.com",
    country: "DE",
    project: "Senior Living",
    company: "Carestone Group GmbH",
    role: "Geschäftsführer",
    emailConfidence: "verified",
    source: "carestone-group.com Impressum – GF: Ralf Licht, Sandro Pawils, Daniel Ahrendt",
  },

  // --- 2. Ipari és Logisztikai Fejlesztések (CEE / nemzetközi) -------------
  {
    name: "Martijn Vlutters",
    email: "martijn.vlutters@vgpparks.eu",
    country: "BE",
    project: "Industrial Logistics",
    company: "VGP Group NV",
    role: "Vice President – Business Development & Investor Relations",
    emailConfidence: "verified",
    source: "vgpparks.eu/contact – név, beosztás és cím szó szerint publikálva",
  },
  {
    name: "Károly Palovics",
    email: "karoly.palovics@vgpparks.eu",
    country: "HU",
    project: "Industrial Logistics",
    company: "VGP Service Kft. (VGP Hungary)",
    role: "Country Manager Hungary",
    emailConfidence: "verified",
    source: "vgpparks.eu/contact – VGP Service Kft., név és cím szó szerint publikálva",
  },
  {
    name: "Maarten Otte",
    email: "maarten.otte@ctp.eu",
    country: "CZ",
    project: "Industrial Logistics",
    company: "CTP N.V.",
    role: "Chief Investment Officer",
    emailConfidence: "pattern-derived",
    source:
      "ctp.eu/investor-contact – név és beosztás publikus, cím elfedve. " +
      "Mintázat (keresztnév.vezetéknév@ctp.eu) igazolva: szabolcs.farkas@ctp.eu, pavel.svihalek@ctp.eu",
  },
  {
    name: "Ferenc Gondi",
    email: "ferenc.gondi@ctp.eu",
    country: "HU",
    project: "Industrial Logistics",
    company: "CTP Hungary",
    role: "Managing Director Hungary",
    emailConfidence: "pattern-derived",
    source:
      "ctp.eu/contact – név és beosztás publikus, cím elfedve. " +
      "Mintázat (keresztnév.vezetéknév@ctp.eu) igazolva: szabolcs.farkas@ctp.eu, pavel.svihalek@ctp.eu",
  },
  {
    name: "Accolade Investment Team",
    email: "info@accolade.eu",
    country: "CZ",
    project: "Industrial Logistics",
    company: "Accolade Group",
    role: "Investment / Acquisitions",
    emailConfidence: "verified",
    source: "accolade.eu/contact – cseh HQ hivatalos kapcsolattartó címe",
  },
  {
    name: "GARBE Industrial Real Estate",
    email: "info@garbe.de",
    country: "DE",
    project: "Industrial Logistics",
    company: "GARBE Industrial Real Estate GmbH",
    role: "Investment / Acquisitions",
    emailConfidence: "verified",
    source: "garbe-industrial.de/contact – hivatalos céges kapcsolattartó cím (Hamburg)",
  },

  // --- 3. Hospitality / Resort (DACH & CEE) --------------------------------
  {
    name: "Therme Group Europe Development",
    email: "europe@thermegroup.com",
    country: "AT",
    project: "Hospitality Resort",
    company: "Therme Group (RHTG AG)",
    role: "Europe Development",
    emailConfidence: "verified",
    source: "thermegroup.com/contact – európai regionális iroda hivatalos címe (bécsi HQ)",
  },
  {
    name: "Patrick Hochhauser",
    email: "office.badschallerbach@eurothermen.at",
    country: "AT",
    project: "Hospitality Resort",
    company: "EurothermenResorts (OÖ Thermenholding GmbH)",
    role: "Geschäftsführer (CEO)",
    emailConfidence: "verified",
    source: "eurothermen.at – CEO Patrick Hochhauser, publikált resort-kapcsolattartó cím",
  },

  // --- 4. Afrikai Infrastruktúra (Elefántcsontpart) ------------------------
  {
    name: "Meridiam Europe & Africa Investment Team",
    email: "queriesEuropeandAfrica@meridiam.com",
    country: "FR",
    project: "Africa Infrastructure",
    company: "Meridiam SAS",
    role: "Europe & Africa Investment Enquiries",
    emailConfidence: "verified",
    source: "meridiam.com/contact – Európa & Afrika régiós megkeresési cím",
  },
  {
    name: "Proparco Project Finance Team",
    email: "proparco@proparco.fr",
    country: "FR",
    project: "Africa Infrastructure",
    company: "Proparco (Groupe AFD)",
    role: "Project Finance / Private Sector",
    emailConfidence: "verified",
    source: "proparco.fr/contact – hivatalos intézményi kapcsolattartó cím (Párizs)",
  },
  {
    name: "EAAIF Investment Enquiries",
    email: "eaif@ninetyone.com",
    country: "GB",
    project: "Africa Infrastructure",
    company: "Emerging Africa & Asia Infrastructure Fund (PIDG / Ninety One)",
    role: "Debt & Blended Finance Enquiries",
    emailConfidence: "verified",
    source: "eaif.com/working-with-us/contact-us – befektetési megkeresések hivatalos címe",
  },
  {
    name: "Africa50 Investment Team",
    email: "communications@africa50.com",
    country: "MA",
    project: "Africa Infrastructure",
    company: "Africa50 Infrastructure Investment Managers",
    role: "Infrastructure Investment / Project Development",
    emailConfidence: "verified",
    source: "africa50.com/contact-us – hivatalos kapcsolattartó cím (Casablanca)",
  },
];

const CRM_NOTE_BASE =
  "Nemzetközi kampány 3. hullám — kutatott lead, automata piszkozat generálás " +
  "(scripts/process_new_leads.js, 2026-08-17).";

// ---------------------------------------------------------------------------
// gws CLI runner — a Sheets írásokhoz.
//
// KRITIKUS (lásd AGENTS.md 1. tanulság): sosem execSync + shell, mert a JSON
// --params argumentumokban lévő `&` és idézőjelek elszakadnak a cmd.exe
// shell-értelmezésen. Helyette execFileSync-kel, tiszta argv-tömbbel hívjuk
// meg közvetlenül a valódi binárist.
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
// 2. CRM (Google Sheets) segédfüggvények
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

// A CRM kategória-oszlop értéke a lead témája alapján.
function crmCategoryFor(project) {
  switch (project) {
    case "Senior Living":
      return "Senior Living & Healthcare (Nemzetközi)";
    case "Industrial Logistics":
      return "Ipari & Logisztikai Portfólió (Nemzetközi)";
    case "Hospitality Resort":
      return "Hospitality & Resort (Nemzetközi)";
    case "Africa Infrastructure":
      return "Afrikai Infrastruktúra & Projektfinanszírozás";
    default:
      return "Ingatlan & Ipari Portfólió (Nemzetközi)";
  }
}

// ---------------------------------------------------------------------------
// 3. Fő folyamat
// ---------------------------------------------------------------------------
function main() {
  console.log("==========================================================");
  console.log("  Homola Mentor Kft. — Új Kutatott Leadek Feldolgozása");
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

  // Duplikátum-szűrés KIZÁRÓLAG pontos e-mail cím alapján.
  // Cégnév-alapú egyezést tudatosan NEM használunk (AGENTS.md 8. tanulság):
  // egy céghez több kapcsolattartó-sor is tartozhat, és a cégnév-substring
  // egyezés a rossz sort is találatnak venné.
  const existingEmails = new Set(
    dataRows.map((row) => extractEmail(row[col.email])).filter(Boolean)
  );
  console.log(`Meglévő CRM sorok: ${dataRows.length} db\n`);

  const pdfPath = path.join(__dirname, "..", "public", "Portfolio_EN_v6.pdf");
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Nem található az angol portfólió PDF: ${pdfPath}`);
  }
  console.log(`Angol csatolmány PDF: ${pdfPath}`);
  console.log(`Feldolgozandó új leadek: ${newLeads.length} db`);
  console.log("----------------------------------------------------------\n");

  const crmRowsToAppend = [];
  const successes = [];
  const failures = [];
  const skipped = [];

  for (const lead of newLeads) {
    const email = extractEmail(lead.email);

    if (!email) {
      console.error(`[Hiba] Érvénytelen e-mail cím: ${lead.name} (${lead.company}).`);
      failures.push({ lead, reason: "Érvénytelen e-mail cím" });
      continue;
    }

    if (existingEmails.has(email)) {
      console.log(`[Kihagyva] ${lead.name} <${email}> — már szerepel a CRM-ben.`);
      skipped.push(lead);
      continue;
    }

    const templatePath = resolveTemplatePath(lead);
    if (!templatePath || !fs.existsSync(templatePath)) {
      console.error(
        `[Hiba] Nincs elérhető sablon: project="${lead.project}", country="${lead.country}" (${lead.name}).`
      );
      failures.push({ lead, reason: "Nincs sablon" });
      continue;
    }

    const { subject, body, lang } = loadTemplate(templatePath, lead);
    const htmlBody = buildPremiumEmailHtml({ subject, bodyText: body, lang });
    const fullMimeRaw = buildMimeMessage(lead, subject, htmlBody, pdfPath);

    if (DRY_RUN) {
      console.log(
        `[Terv] ${lead.name} <${email}> | ${lead.company} | ${lead.country} | ` +
        `${lead.project} | Sablon: ${path.basename(templatePath)} | Cím: ${lead.emailConfidence}`
      );
      continue;
    }

    try {
      const gwsRes = createDraftViaGwsUpload(fullMimeRaw);
      const draftId = gwsRes.id || gwsRes.message?.id || "OK";
      console.log(
        `[Siker] Piszkozat elkészült: ${lead.name} (${lead.company}) | ${lead.country} | ` +
        `Sablon: ${path.basename(templatePath)} | Draft ID: ${draftId}`
      );

      const row = new Array(header.length).fill("");
      row[col.company] = lead.company;
      row[col.category] = crmCategoryFor(lead.project);
      row[col.contactName] = lead.role ? `${lead.name} (${lead.role})` : lead.name;
      row[col.email] = lead.email;
      // Apostróf-előtag: USER_ENTERED mellett ez kényszeríti ki, hogy a Sheets
      // sima szövegként tárolja a dátumot (ne alakítsa dátum-sorszámmá) — így
      // az admin dashboard (/hu/admin) dátumformázása nem törik el.
      row[col.date] = `'${TODAY}`;
      row[col.channel] = "Email";
      row[col.status] = "Piszkozat bekészítve";
      row[col.note] =
        `${CRM_NOTE_BASE} Cím-verifikáció: ${lead.emailConfidence}. Forrás: ${lead.source}`;
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
  console.log("  ÖSSZEGZÉS — SIKERESEN FELVETT PARTNEREK");
  console.log("==========================================================");
  console.log(`  Felvett partner + bekészített piszkozat: ${successes.length} db\n`);

  const byProject = successes.reduce((acc, entry) => {
    (acc[entry.lead.project] = acc[entry.lead.project] || []).push(entry);
    return acc;
  }, {});

  for (const [project, entries] of Object.entries(byProject)) {
    console.log(`  ${project} (${entries.length} db):`);
    entries.forEach(({ lead, draftId }) => {
      console.log(
        `   • ${lead.name} — ${lead.company} <${lead.email}> | ${lead.country} | ` +
        `${lead.emailConfidence} | Draft ID: ${draftId}`
      );
    });
    console.log("");
  }

  if (skipped.length > 0) {
    console.log(`  Kihagyva (már a CRM-ben volt): ${skipped.length} db`);
    skipped.forEach((lead) => console.log(`   • ${lead.name} <${lead.email}>`));
    console.log("");
  }

  if (failures.length > 0) {
    console.log(`  Hibás: ${failures.length} db`);
    failures.forEach(({ lead, reason }) => {
      console.log(`   • ${lead.name} <${lead.email}> — ${reason}`);
    });
  }
  console.log("==========================================================");
}

main();
