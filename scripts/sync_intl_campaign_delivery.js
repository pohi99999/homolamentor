/**
 * Homola Mentor Kft. – Nemzetközi Kampány Kézbesítés-szinkronizáló Szkript
 *
 * A `scripts/process_intl_campaign.js` által "Piszkozat bekészítve" státusszal
 * felvett Master CRM sorokat ellenőrzi a Gmail Sent/Trash/Bounce állapota
 * alapján, és a valós kézbesítési állapotra frissíti:
 *   - "Kiajánló kiküldve"  — ha a levél megtalálható a Sent (bárhol, Trash-t
 *                             is beleértve — a küldés ténye számít, nem az,
 *                             hogy utólag törölték-e a helyi másolatot)
 *   - "Hibás e-mail cím"   — ha mailer-daemon / postmaster bounce érkezett rá
 *   - változatlan marad, ha egyik sem igazolható (még nem küldték ki)
 *
 * KRITIKUS: a régi `scripts/sync_campaign_delivery.js`-vel ellentétben ez a
 * szkript NEM `execSync` + `cmd.exe` shell-en keresztül hívja a `gws`-t
 * (ami `&` karaktereknél és beágyazott idézőjeleknél elszúrja a JSON-t),
 * hanem a `scripts/add_missing_contacts.js`-ben bevált mintát követi:
 * közvetlen `gws.exe` bináris hívás `execFileSync`-kel, tiszta argv-tömbbel.
 *
 * CSAK a Master_Vevőlista "Piszkozat bekészítve" sorait vizsgálja és
 * frissíti (values.update, kizárólag a saját sorára) — más sorokhoz nem nyúl.
 *
 * HASZNÁLAT
 *   node scripts/sync_intl_campaign_delivery.js            # éles frissítés
 *   node scripts/sync_intl_campaign_delivery.js --dry-run  # csak terv
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DRY_RUN = process.argv.includes("--dry-run");
const TODAY = "2026-08-11";

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

/** Egy e-mail címre: elküldve-e (Sent, Trash-t is beleértve), és jött-e rá bounce. */
function checkDeliveryStatus(email) {
  const sentRes = runGws(["gmail", "users", "messages", "list"], {
    params: {
      userId: "me",
      q: `to:${email} newer_than:3d`,
      includeSpamTrash: true,
    },
  });
  const wasSent = (sentRes.messages || []).length > 0;

  // Bounce: a mailer-daemon értesítés szövegében szerepel a visszapattant cím.
  const bounceRes = runGws(["gmail", "users", "messages", "list"], {
    params: {
      userId: "me",
      q: `newer_than:3d (from:mailer-daemon OR from:postmaster) "${email}"`,
      includeSpamTrash: true,
    },
  });
  const bounced = (bounceRes.messages || []).length > 0;

  return { wasSent, bounced };
}

function updateCrmRow(rowNum, col, values) {
  const range = `'${SHEET_NAME}'!A${rowNum}:S${rowNum}`;
  const row = new Array(19).fill(null);
  Object.entries(values).forEach(([key, value]) => {
    row[col[key]] = value;
  });
  // Csak a ténylegesen módosítandó cellákat írjuk (üres oszlopok kihagyása
  // helyett explicit egyedi cellafrissítést végzünk, hogy semmi mást ne
  // írjunk felül a sorban).
  const updates = Object.entries(values).map(([key, value]) => {
    const colLetter = String.fromCharCode(65 + col[key]);
    return runGws(["sheets", "spreadsheets", "values", "update"], {
      params: {
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!${colLetter}${rowNum}`,
        valueInputOption: "USER_ENTERED",
      },
      json: { values: [[value]] },
    });
  });
  return updates;
}

function main() {
  console.log("==========================================================");
  console.log("  Homola Mentor Kft. — Nemzetközi Kampány Kézbesítés-szinkron");
  console.log(`  ${DRY_RUN ? "DRY RUN — nincs írás" : "ÉLES FUTTATÁS"}`);
  console.log("==========================================================\n");

  console.log("Master CRM olvasása...");
  const existing = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: {
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:S1000`,
    },
  });

  const allRows = existing.values || [];
  const header = allRows[0];
  const dataRows = allRows.slice(1);

  const col = {
    company: findColIndex(header, ["cégnév", "cég", "company"], 0),
    contactName: findColIndex(header, ["kapcsolattartó_neve", "kapcsolattartó", "kontakt"], 5),
    email: findColIndex(header, ["email", "e-mail"], 7),
    date: findColIndex(header, ["első_kapcsolatfelvétel", "kapcsolatfelvétel", "dátum"], 11),
    status: findColIndex(header, ["aktuális_státusz", "státusz", "status"], 13),
    note: findColIndex(header, ["megjegyzés"], header.length - 1),
  };

  const pendingRows = [];
  dataRows.forEach((row, idx) => {
    const status = normalize(row[col.status]);
    if (status.includes("bekész")) {
      pendingRows.push({ rowNum: idx + 2, row });
    }
  });

  console.log(`"Piszkozat bekészítve" státuszú sorok: ${pendingRows.length} db\n`);

  if (pendingRows.length === 0) {
    console.log("Nincs frissítendő sor. Minden szinkronban van.");
    return;
  }

  const results = { sent: [], bounced: [], unconfirmed: [] };

  for (const { rowNum, row } of pendingRows) {
    const email = extractEmail(row[col.email]);
    const name = row[col.contactName];
    const company = row[col.company];

    if (!email) {
      console.log(`[Kihagyva] Sor ${rowNum}: nincs érvényes e-mail cím.`);
      continue;
    }

    const { wasSent, bounced } = checkDeliveryStatus(email);

    if (bounced) {
      console.log(`[Hibás e-mail] Sor ${rowNum}: ${name} (${company}) <${email}> — bounce észlelve.`);
      results.bounced.push({ rowNum, name, company, email });
      if (!DRY_RUN) {
        updateCrmRow(rowNum, col, {
          status: "Hibás e-mail cím",
          note: `Visszapattant / kézbesítési hiba (${TODAY}, scripts/sync_intl_campaign_delivery.js).`,
        });
      }
    } else if (wasSent) {
      console.log(`[Kiküldve] Sor ${rowNum}: ${name} (${company}) <${email}> — sikeresen kiküldve.`);
      results.sent.push({ rowNum, name, company, email });
      if (!DRY_RUN) {
        updateCrmRow(rowNum, col, {
          status: "Kiajánló kiküldve",
          note: `Nemzetközi (DACH) kiajánló kiküldve (${TODAY}, scripts/sync_intl_campaign_delivery.js).`,
        });
      }
    } else {
      console.log(`[Változatlan] Sor ${rowNum}: ${name} (${company}) <${email}> — még nincs kiküldve.`);
      results.unconfirmed.push({ rowNum, name, company, email });
    }
  }

  console.log("\n==========================================================");
  console.log("  ÖSSZEGZÉS");
  console.log("==========================================================");
  console.log(`  Kiajánló kiküldve:  ${results.sent.length} db`);
  console.log(`  Hibás e-mail cím:   ${results.bounced.length} db`);
  console.log(`  Változatlan (várakozik): ${results.unconfirmed.length} db`);
  if (DRY_RUN) {
    console.log("\n--dry-run: nem történt CRM írás.");
  }
  console.log("==========================================================");
}

main();
