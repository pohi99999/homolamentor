/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { spawnSync } = require('child_process');

const SPREADSHEET_ID_MASTER = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const SPREADSHEET_ID_CONTACTS = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

const TODAY = '2026-07-22';
const BOUNCE_STATUS = 'Visszadobva / Hibás email';
const BOUNCE_NOTE = '2026-07-22: Kézbesíthetetlen (Connection timed out / Socket error). LinkedIn outreach szükséges.';

const GWS_CLI_PATH = 'C:\\Users\\pohi9\\AppData\\Roaming\\npm\\node_modules\\@googleworkspace\\cli\\run.js';

function runGws(args) {
  if (fs.existsSync(GWS_CLI_PATH)) {
    return spawnSync(process.execPath, [GWS_CLI_PATH, ...args], { encoding: 'utf-8', shell: false });
  } else {
    return spawnSync('gws', args, { encoding: 'utf-8', shell: true });
  }
}

function colLetter(index) {
  let temp, letter = '';
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
    data: dataRanges
  };
  const res = runGws([
    'sheets', 'spreadsheets', 'values', 'batchUpdate',
    '--params', JSON.stringify(paramsObj),
    '--json', JSON.stringify(bodyObj)
  ]);
  if (res.status !== 0) {
    throw new Error(`batchUpdate hiba (${spreadsheetId}): ${res.stderr || res.stdout}`);
  }
  return JSON.parse(res.stdout);
}

function isMatchingRow(row) {
  if (!row || row.length === 0) return false;
  const rowStr = row.join(' ').toLowerCase();
  return rowStr.includes('e.wheeler@afdb.org') || rowStr.includes('ewah wheeler');
}

function processAfrikaFinanceCRM() {
  console.log('\n--- 1. MASTER CRM (Afrika_Projekt_Finanszirozas) feldolgozása ---');
  const rows = getSheetData(SPREADSHEET_ID_MASTER, 'Afrika_Projekt_Finanszirozas!A1:Z500');
  if (rows.length === 0) throw new Error('Üres Afrika_Projekt_Finanszirozas data');

  const headers = rows[0];
  let statusColIdx = headers.findIndex(h => /statusz|aktuális_státusz/i.test(h));
  if (statusColIdx === -1) statusColIdx = 7; // Column H

  let dateColIdx = headers.findIndex(h => /utolso_interakcio|utolso_inmail_datum/i.test(h));
  if (dateColIdx === -1) dateColIdx = 11; // Column L

  let noteColIdx = headers.findIndex(h => /megjegyzés|megjegyzes/i.test(h));
  if (noteColIdx === -1) noteColIdx = 12; // Column M

  const dataUpdates = [];

  rows.forEach((row, idx) => {
    if (idx === 0) return;
    if (isMatchingRow(row)) {
      const rowIndex = idx + 1;
      console.log(`[Afrika Projekt CRM] Matching sor azonosítva (${rowIndex}. sor): ${row[0]} / ${row[5] || row[2]}`);

      // 1. Statusz -> "Visszadobva / Hibás email"
      dataUpdates.push({
        range: `Afrika_Projekt_Finanszirozas!${colLetter(statusColIdx)}${rowIndex}`,
        values: [[BOUNCE_STATUS]]
      });

      // 2. Utolso_interakcio / InMail Dátum -> TODAY
      dataUpdates.push({
        range: `Afrika_Projekt_Finanszirozas!${colLetter(dateColIdx)}${rowIndex}`,
        values: [[TODAY]]
      });

      // 3. Megjegyzés -> fűzze be az információt
      const currentNote = row[noteColIdx] || '';
      let newNote = BOUNCE_NOTE;
      if (currentNote && !currentNote.includes(BOUNCE_NOTE)) {
        newNote = `${currentNote} | ${BOUNCE_NOTE}`;
      }
      dataUpdates.push({
        range: `Afrika_Projekt_Finanszirozas!${colLetter(noteColIdx)}${rowIndex}`,
        values: [[newNote]]
      });
    }
  });

  if (dataUpdates.length > 0) {
    console.log(`Küldés batchUpdate használatával (${dataUpdates.length} mező módosítása)...`);
    const result = batchUpdateValues(SPREADSHEET_ID_MASTER, dataUpdates);
    console.log(`✅ Afrika_Projekt_Finanszirozas batchUpdate sikeres! Total updated cells: ${result.totalUpdatedCells}, rows: ${result.totalUpdatedRows}`);
  } else {
    console.warn('⚠ Nem található matching sor az Afrika_Projekt_Finanszirozas fülön.');
  }
}

function processMasterVevolistaCRM() {
  console.log('\n--- 2. MASTER CRM (Master_Vevőlista) feldolgozása ---');
  const rows = getSheetData(SPREADSHEET_ID_MASTER, 'Master_Vevőlista!A1:Z500');
  if (rows.length === 0) throw new Error('Üres Master_Vevőlista data');

  const headers = rows[0];
  let statusColIdx = headers.findIndex(h => /aktuális_státusz|statusz/i.test(h));
  if (statusColIdx === -1) statusColIdx = 13; // Column N

  let dateColIdx = headers.findIndex(h => /utolso_interakcio|utolso_inmail_datum/i.test(h));
  if (dateColIdx === -1) dateColIdx = 15; // Column P

  let noteColIdx = headers.findIndex(h => /megjegyzés|megjegyzes/i.test(h));
  if (noteColIdx === -1) noteColIdx = 18; // Column S

  const dataUpdates = [];

  rows.forEach((row, idx) => {
    if (idx === 0) return;
    if (isMatchingRow(row)) {
      const rowIndex = idx + 1;
      console.log(`[Master CRM] Matching sor azonosítva (${rowIndex}. sor): ${row[0]} / ${row[5]}`);

      // 1. Aktuális_Státusz -> "Visszadobva / Hibás email"
      dataUpdates.push({
        range: `Master_Vevőlista!${colLetter(statusColIdx)}${rowIndex}`,
        values: [[BOUNCE_STATUS]]
      });

      // 2. Utolso_interakcio / InMail Dátum -> TODAY
      dataUpdates.push({
        range: `Master_Vevőlista!${colLetter(dateColIdx)}${rowIndex}`,
        values: [[TODAY]]
      });

      // 3. Megjegyzés -> fűzze be az információt
      const currentNote = row[noteColIdx] || '';
      let newNote = BOUNCE_NOTE;
      if (currentNote && !currentNote.includes(BOUNCE_NOTE)) {
        newNote = `${currentNote} | ${BOUNCE_NOTE}`;
      }
      dataUpdates.push({
        range: `Master_Vevőlista!${colLetter(noteColIdx)}${rowIndex}`,
        values: [[newNote]]
      });
    }
  });

  if (dataUpdates.length > 0) {
    console.log(`Küldés batchUpdate használatával (${dataUpdates.length} mező módosítása)...`);
    const result = batchUpdateValues(SPREADSHEET_ID_MASTER, dataUpdates);
    console.log(`✅ Master_Vevőlista batchUpdate sikeres! Total updated cells: ${result.totalUpdatedCells}, rows: ${result.totalUpdatedRows}`);
  } else {
    console.warn('⚠ Nem található matching sor a Master_Vevőlista fülön.');
  }
}

function processContactsCRM() {
  console.log('\n--- 3. CONTACTS CRM (CONTACTS) feldolgozása ---');
  const rows = getSheetData(SPREADSHEET_ID_CONTACTS, 'CONTACTS!A1:Z500');
  if (rows.length === 0) throw new Error('Üres CONTACTS data');

  const headers = rows[0];
  let statusColIdx = headers.findIndex(h => /^statusz$/i.test(h) || /statusz/i.test(h));
  if (statusColIdx === -1) statusColIdx = 11; // Column L

  let dateColIdx = headers.findIndex(h => /utolso_interakcio/i.test(h));
  if (dateColIdx === -1) dateColIdx = 12; // Column M

  let noteColIdx = headers.findIndex(h => /megjegyzés|megjegyzes/i.test(h));
  if (noteColIdx === -1) noteColIdx = 16; // Column Q

  const dataUpdates = [];

  rows.forEach((row, idx) => {
    if (idx === 0) return;
    if (isMatchingRow(row)) {
      const rowIndex = idx + 1;
      console.log(`[Contacts CRM] Matching sor azonosítva (${rowIndex}. sor): ${row[0]} / ${row[2]}`);

      // 1. Statusz -> "Visszadobva / Hibás email"
      dataUpdates.push({
        range: `CONTACTS!${colLetter(statusColIdx)}${rowIndex}`,
        values: [[BOUNCE_STATUS]]
      });

      // 2. Utolso_interakcio -> TODAY
      dataUpdates.push({
        range: `CONTACTS!${colLetter(dateColIdx)}${rowIndex}`,
        values: [[TODAY]]
      });

      // 3. Megjegyzés -> fűzze be az információt
      const currentNote = row[noteColIdx] || '';
      let newNote = BOUNCE_NOTE;
      if (currentNote && !currentNote.includes(BOUNCE_NOTE)) {
        newNote = `${currentNote} | ${BOUNCE_NOTE}`;
      }
      dataUpdates.push({
        range: `CONTACTS!${colLetter(noteColIdx)}${rowIndex}`,
        values: [[newNote]]
      });
    }
  });

  if (dataUpdates.length > 0) {
    console.log(`Küldés batchUpdate használatával (${dataUpdates.length} mező módosítása)...`);
    const result = batchUpdateValues(SPREADSHEET_ID_CONTACTS, dataUpdates);
    console.log(`✅ Contacts CRM batchUpdate sikeres! Total updated cells: ${result.totalUpdatedCells}, rows: ${result.totalUpdatedRows}`);
  } else {
    console.warn('⚠ Nem található matching sor a Contacts CRM-ben.');
  }
}

function main() {
  console.log('=== EWAH WHEELER (AFDB) BOUNCE REGISZTRÁCIÓ (CRM) ===');
  processAfrikaFinanceCRM();
  processMasterVevolistaCRM();
  processContactsCRM();
  console.log('\n🎉 AfDB Ewah Wheeler visszapattanása feldolgozva!');
}

main();
