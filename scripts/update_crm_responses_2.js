/**
 * Homola Mentor Kft. – Kampány Reakció Szinkronizáló Szkript (#2)
 * Dátum: 2026. 08. 12.
 *
 * Cél: A nemzetközi (DACH) és hazai kampányra beérkezett két újabb Gmail
 * reakció (Panattoni Europe – Percz Péter, konkrét érdeklődés; Hotel
 * Investments AG – Holger Ballwanz, elutasítás) rögzítése a Google Sheets
 * CRM-ben (Master_Vevőlista tábla), hogy a Next.js Dashboard is azonnal
 * szinkronizálja az új státuszokat.
 *
 * Használat: node scripts/update_crm_responses_2.js
 *
 * A szkript a `gws` CLI-t használja (ugyanaz az auth mechanizmus, mint a
 * többi scripts/ és n8n/ alatti CRM frissítő szkriptben) – lásd
 * scripts/update_crm_responses.js mintáját.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { spawnSync } = require('child_process');

const SPREADSHEET_ID_MASTER = process.env.GOOGLE_SPREADSHEET_ID_MASTER || '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const SHEET_NAME = 'Master_Vevőlista';

const GWS_CLI_PATH = 'C:\\Users\\pohi9\\AppData\\Roaming\\npm\\node_modules\\@googleworkspace\\cli\\run.js';

// A ma beérkezett reakciók, amiket a Gmailből be kell szinkronizálni a CRM-be.
const REACTIONS = [
  {
    emails: ['lkemenes@panattoni.com', 'ppercz@panattoni.com'],
    company: 'Panattoni Europe',
    status: 'Aktív tárgyalás',
    note: '2026.08.12: Percz Péter válaszolt. Konkrét érdeklődés az üllői nagy iparterület és a székesfehérvári logisztikai ingatlan iránt. Pontos lokációt és további infókat kértek.',
  },
  {
    emails: ['dialog@ballwanz.immobilien', 'h.ballwanz@hotel-investments.ch'],
    company: 'Hotel Investments AG',
    status: 'Elutasítva / Archiválva',
    note: '2026.08.12: Holger Ballwanz válaszolt. Nem aktuális, az üzemeltetőjük csak A-kategóriás nagyvárosok (Berlin, Bécs) központjában keres hoteleket, resortokat nem.',
  },
];

function runGws(args) {
  if (fs.existsSync(GWS_CLI_PATH)) {
    return spawnSync(process.execPath, [GWS_CLI_PATH, ...args], { encoding: 'utf-8', shell: false });
  }
  return spawnSync('gws', args, { encoding: 'utf-8', shell: true });
}

function colLetter(index) {
  let temp;
  let letter = '';
  while (index >= 0) {
    temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor((index - temp) / 26) - 1;
  }
  return letter;
}

function getSheetData(id, range) {
  const readParams = JSON.stringify({ spreadsheetId: id, range });
  const res = runGws(['sheets', 'spreadsheets', 'values', 'get', '--params', readParams]);
  if (res.status !== 0) {
    throw new Error(`Hiba az adatok beolvasásakor (${id}, ${range}): ${res.stderr || res.stdout}`);
  }
  return JSON.parse(res.stdout).values || [];
}

function batchUpdateValues(spreadsheetId, dataRanges) {
  const paramsObj = { spreadsheetId };
  const bodyObj = {
    valueInputOption: 'USER_ENTERED',
    data: dataRanges,
  };
  const res = runGws([
    'sheets', 'spreadsheets', 'values', 'batchUpdate',
    '--params', JSON.stringify(paramsObj),
    '--json', JSON.stringify(bodyObj),
  ]);
  if (res.status !== 0) {
    throw new Error(`batchUpdate hiba (${spreadsheetId}): ${res.stderr || res.stdout}`);
  }
  return JSON.parse(res.stdout);
}

function findColIndex(headers, keywords, fallbackIdx) {
  const idx = headers.findIndex((h) => {
    const norm = String(h || '').toLowerCase();
    return keywords.some((kw) => norm.includes(kw));
  });
  return idx !== -1 ? idx : fallbackIdx;
}

function findEmailColIndex(headers, rows) {
  let idx = findColIndex(headers, ['email', 'e-mail', 'mail'], -1);
  if (idx !== -1) return idx;
  // Fallback: keresés a soradatok alapján, ha nincs @-t tartalmazó fejléc
  for (let c = 0; c < (rows[1] || []).length; c += 1) {
    const sample = String((rows[1] || [])[c] || '');
    if (sample.includes('@')) return c;
  }
  return 7; // ismert alapértelmezett oszlop (H)
}

function processReactions() {
  console.log(`\n--- Master CRM (${SHEET_NAME}) frissítése – Kampány reakciók #2 ---`);
  const rows = getSheetData(SPREADSHEET_ID_MASTER, `${SHEET_NAME}!A1:Z500`);
  if (rows.length === 0) {
    throw new Error(`Üres ${SHEET_NAME} tábla adat.`);
  }

  const headers = rows[0];
  const statusColIdx = findColIndex(headers, ['státusz', 'statusz'], 13);
  const noteColIdx = findColIndex(headers, ['utolsó reakció', 'utolso reakcio', 'megjegyzés', 'megjegyzes'], 18);
  const emailColIdx = findEmailColIndex(headers, rows);

  console.log(`Oszlopok: Státusz=${colLetter(statusColIdx)}, Utolsó Reakció/Megjegyzés=${colLetter(noteColIdx)}, Email=${colLetter(emailColIdx)}`);

  const dataUpdates = [];
  const notFound = [];

  REACTIONS.forEach((reaction) => {
    let matched = false;
    const candidateEmails = reaction.emails.map((e) => e.toLowerCase());

    rows.forEach((row, idx) => {
      if (idx === 0) return;
      const rowEmail = String(row[emailColIdx] || '').toLowerCase().trim();
      const rowStr = row.join(' ').toLowerCase();

      // FIGYELEM: szándékosan NINCS cégnév-alapú fallback-egyeztetés — egy
      // cégnek több kapcsolattartó-sora is lehet a CRM-ben (pl. Panattoni
      // Europe), és a puszta cégnév-egyezés téves sort is módosítana.
      const isMatch = candidateEmails.some((e) => rowEmail === e || rowStr.includes(e));

      if (isMatch) {
        matched = true;
        const rowIndex = idx + 1;
        console.log(`[Master CRM] "${reaction.company}" sor azonosítva (${rowIndex}. sor).`);

        dataUpdates.push({
          range: `${SHEET_NAME}!${colLetter(statusColIdx)}${rowIndex}`,
          values: [[reaction.status]],
        });

        dataUpdates.push({
          range: `${SHEET_NAME}!${colLetter(noteColIdx)}${rowIndex}`,
          values: [[reaction.note]],
        });
      }
    });

    if (!matched) {
      notFound.push(reaction);
      console.warn(`⚠ Nem található sor a(z) "${reaction.company}" (${reaction.emails.join(' / ')}) partnerhez.`);
    }
  });

  if (dataUpdates.length > 0) {
    console.log(`Küldés batchUpdate használatával (${dataUpdates.length} mező módosítása)...`);
    const result = batchUpdateValues(SPREADSHEET_ID_MASTER, dataUpdates);
    console.log(`✅ Master CRM batchUpdate sikeres! Total updated cells: ${result.totalUpdatedCells}, rows: ${result.totalUpdatedRows}`);
  } else {
    console.warn('⚠ Egyik reakcióhoz sem található egyező sor, nem történt frissítés.');
  }

  if (notFound.length > 0) {
    console.warn(`\n⚠ ${notFound.length} reakció nem lett rögzítve, mert nem található hozzájuk sor a CRM-ben:`);
    notFound.forEach((r) => console.warn(` - ${r.company} (${r.emails.join(' / ')})`));
  }

  return { updatedCount: dataUpdates.length / 2, notFound };
}

function main() {
  console.log('=== KAMPÁNY REAKCIÓK SZINKRONIZÁLÁSA #2 (CRM) — 2026.08.12 ===');
  const { updatedCount, notFound } = processReactions();
  console.log(`\n🎉 ${updatedCount} partner reakciója sikeresen rögzítve a Master CRM táblázatban.`);
  if (notFound.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, processReactions, REACTIONS };
