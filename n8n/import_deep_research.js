/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { spawnSync, execSync } = require('child_process');

const SPREADSHEET_ID_MASTER = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const SPREADSHEET_ID_CONTACTS = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

const FILE_1 = 'Z:/001_Workspace/Ingatlan, iparterület értékesítések/kutatás I.md';
const FILE_2 = 'Z:/001_Workspace/Ingatlan, iparterület értékesítések/Kutatas II.md';

/**
 * Clean email from markdown, citations, mailto links, bolding, etc.
 */
function cleanEmail(emailCell) {
  if (!emailCell) return '';
  let text = emailCell.replace(/\[([^\]]+)\]\(mailto:[^\)]+\)/gi, '$1').replace(/mailto:/gi, '');
  text = text.replace(/\*\*/g, '').replace(/Valószínűsített:/gi, '').replace(/Formátum:/gi, '').replace(/minta:[^\)]+/gi, '');
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches || matches.length === 0) return '';
  const specific = matches.find(m => !m.toLowerCase().startsWith('first.last@') && !m.toLowerCase().startsWith('first_initial.last@') && !m.toLowerCase().startsWith('firstname.lastname@'));
  return (specific || matches[0]).toLowerCase().trim();
}

/**
 * Clean LinkedIn URL from citations or extra brackets
 */
function cleanLinkedIn(urlCell) {
  if (!urlCell) return '';
  let text = urlCell.replace(/\[web:\d+\]/g, '').replace(/\[page:\d+\]/g, '').trim();
  const match = text.match(/https?:\/\/[^\s\)]+/);
  return match ? match[0] : (text.startsWith('http') ? text : '');
}

/**
 * Clean general markdown text fields
 */
function cleanField(val) {
  if (!val) return '';
  return val
    .replace(/&/g, ' and ')
    .replace(/\[web:\d+\]/g, '')
    .replace(/\[page:\d+\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\/g, '')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse markdown tables from file
 */
function parseMarkdownTables(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fájl nem található: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const rows = [];
  let inTable = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s+/g, '')))) continue;
      if (!inTable) {
        if (cells.some(c => c.toLowerCase().includes('project') || c.toLowerCase().includes('projekt') || c.toLowerCase().includes('company') || c.toLowerCase().includes('célvállalat'))) {
          inTable = true;
          continue;
        }
      }
      if (inTable && cells.length >= 7) {
        const rawName = cleanField(cells[2]);
        const email = cleanEmail(cells[4]);

        // Filter out generic placeholders without contact name or valid specific email
        if (rawName.startsWith('(') || !email || email.startsWith('first.last@')) {
          continue;
        }

        rows.push({
          project: cleanField(cells[0]),
          company: cleanField(cells[1]),
          name: rawName,
          title: cleanField(cells[3]),
          email: email,
          linkedin: cleanLinkedIn(cells[5]),
          countryFocus: cleanField(cells[6])
        });
      }
    } else {
      inTable = false;
    }
  }
  return rows;
}

/**
 * Append rows to a Google Sheet in chunks of 5 rows
 */
function appendInChunks(spreadsheetId, range, allRowValues) {
  if (allRowValues.length === 0) return true;
  const CHUNK_SIZE = 5;

  for (let i = 0; i < allRowValues.length; i += CHUNK_SIZE) {
    const chunk = allRowValues.slice(i, i + CHUNK_SIZE);
    const paramsObj = {
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED'
    };
    const bodyObj = {
      values: chunk
    };

    const paramsStr = JSON.stringify(paramsObj);
    const bodyStr = JSON.stringify(bodyObj);

    const res = spawnSync('gws', [
      'sheets', 'spreadsheets', 'values', 'append',
      '--params', `"${paramsStr.replace(/"/g, '\\"')}"`,
      '--json', `"${bodyStr.replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });

    if (res.status !== 0) {
      console.error(`❌ Hiba a csomag beszúrásakor (${i + 1}-${i + chunk.length}):`, res.stderr || res.stdout);
      return false;
    }
  }
  return true;
}

/**
 * Read existing email set from a Google Sheet range
 */
function getExistingEmails(spreadsheetId, range) {
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetId} --range "${range}"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    const values = data.values || [];
    return new Set(values.map(row => (row[0] || '').toLowerCase().trim()).filter(Boolean));
  } catch (err) {
    console.warn(`⚠ Figyelmeztetés a meglévő e-mailek beolvasásakor (${range}):`, err.message);
    return new Set();
  }
}

/**
 * Deduplicate leads by email address
 */
function deduplicateLeads(leads) {
  const map = new Map();
  leads.forEach(l => {
    if (!map.has(l.email)) {
      map.set(l.email, l);
    } else {
      const existing = map.get(l.email);
      if (!existing.linkedin && l.linkedin) {
        map.set(l.email, l);
      }
    }
  });
  return Array.from(map.values());
}

async function main() {
  console.log('================ DEEP RESEARCH LEAD IMPORTÁLÓ ================');
  console.log(`1. Markdown kutatási fájlok beolvasása...`);
  console.log(`   - ${FILE_1}`);
  console.log(`   - ${FILE_2}`);

  const leads1 = parseMarkdownTables(FILE_1);
  const leads2 = parseMarkdownTables(FILE_2);
  const rawAllLeads = [...leads1, ...leads2];
  const uniqueLeads = deduplicateLeads(rawAllLeads);

  console.log(`✓ Összesen ${rawAllLeads.length} valid lead beolvasva (${uniqueLeads.length} egyedi e-mail cím).`);

  // Szortírozás projektek szerint
  const afrikaLeads = [];
  const realEstateLeads = [];

  uniqueLeads.forEach(lead => {
    const pLower = lead.project.toLowerCase();
    const cLower = lead.countryFocus.toLowerCase();
    if (pLower.includes('african') || pLower.includes('afrika') || cLower.includes('afrika') || cLower.includes('ivory coast')) {
      afrikaLeads.push(lead);
    } else {
      realEstateLeads.push(lead);
    }
  });

  console.log(`\n2. Leadek szortírozása:`);
  console.log(`   - Afrikai Infrastruktúra leadek: ${afrikaLeads.length} db`);
  console.log(`   - Prémium Ingatlan leadek: ${realEstateLeads.length} db`);

  // Beolvassuk a meglévő e-maileket a CRM-ekből a duplikáció elkerülésére
  console.log(`\n3. Meglévő CRM e-mailek ellenőrzése...`);
  const existingAfrikaEmails = getExistingEmails(SPREADSHEET_ID_MASTER, 'Afrika_Projekt_Finanszirozas!F2:F500');
  const existingContactsEmails = getExistingEmails(SPREADSHEET_ID_CONTACTS, 'CONTACTS!G2:G500');
  const existingMasterEmails = getExistingEmails(SPREADSHEET_ID_MASTER, 'Master_Vevőlista!H2:H500');

  const newAfrikaLeads = afrikaLeads.filter(l => !existingAfrikaEmails.has(l.email));
  const newContactsLeads = realEstateLeads.filter(l => !existingContactsEmails.has(l.email));
  const newMasterLeads = realEstateLeads.filter(l => !existingMasterEmails.has(l.email));

  const todayStr = new Date().toISOString().split('T')[0];
  const statusStr = 'Új Lead - Deep Research';

  let addedAfrikaCount = 0;
  let addedContactsCount = 0;
  let addedMasterCount = 0;

  // A) Afrika_Projekt_Finanszirozas beszúrás
  if (newAfrikaLeads.length > 0) {
    console.log(`\n4. Afrikai leadek hozzáadása az 'Afrika_Projekt_Finanszirozas' fülhöz (${newAfrikaLeads.length} új sor)...`);
    const valuesAfrika = newAfrikaLeads.map(l => [
      l.name,          // A: Nev
      l.title,         // B: Pozicio
      l.company,       // C: Alap/Bank
      l.countryFocus,  // D: Orszag
      l.linkedin,      // E: LinkedIn_URL
      l.email,         // F: Email
      l.project,       // G: Celzott_Szektor
      statusStr,       // H: Statusz
      "",              // I: Telefon
      "",              // J: Befektetési_Volumen
      "Azonosítva",    // K: LinkedIn_Statusz
      ""               // L: Utolso_InMail_Datum
    ]);

    const success = appendInChunks(SPREADSHEET_ID_MASTER, 'Afrika_Projekt_Finanszirozas!A:L', valuesAfrika);
    if (success) {
      addedAfrikaCount = newAfrikaLeads.length;
      console.log(`✓ Afrika_Projekt_Finanszirozas sikeresen frissítve (+${addedAfrikaCount} új döntéshozó sor).`);
    }
  } else {
    console.log(`\n4. Az 'Afrika_Projekt_Finanszirozas' fül már naprakész (0 új sor).`);
  }

  // B) CONTACTS (Contacts CRM) beszúrás
  if (newContactsLeads.length > 0) {
    console.log(`\n5. Prémium ingatlan leadek hozzáadása a CONTACTS fülhöz (${newContactsLeads.length} új sor)...`);
    const valuesContacts = newContactsLeads.map(l => [
      l.name,          // A: Nev
      l.title,         // B: Pozicio
      l.company,       // C: Ceg
      "Ingatlan / MA Operator", // D: Cegtipus (no & to avoid cmd splitting)
      l.countryFocus,  // E: Orszag
      l.linkedin,      // F: LinkedIn_URL
      l.email,         // G: Email
      "Deep Research (Kutatas I-II)", // H: Forras
      l.project,       // I: Projekt
      todayStr,        // J: Elso_kontakt_datum
      "Email / LinkedIn", // K: Csatorna
      statusStr,       // L: Statusz
      "",              // M: Utolso_interakcio
      "",              // N: Kovetkezo_lepes_datum
      "Azonosítva",    // O: LinkedIn_Statusz
      ""               // P: Utolso_InMail_Datum
    ]);

    const success = appendInChunks(SPREADSHEET_ID_CONTACTS, 'CONTACTS!A:P', valuesContacts);
    if (success) {
      addedContactsCount = newContactsLeads.length;
      console.log(`✓ CONTACTS fül sikeresen frissítve (+${addedContactsCount} új döntéshozó sor).`);
    }
  } else {
    console.log(`\n5. A CONTACTS fül már naprakész (0 új sor).`);
  }

  // C) Master_Vevőlista beszúrás
  if (newMasterLeads.length > 0) {
    console.log(`\n6. Prémium ingatlan leadek hozzáadása a Master_Vevőlista fülhöz (${newMasterLeads.length} új sor)...`);
    const valuesMaster = newMasterLeads.map(l => [
      l.company,       // A: Cégnév
      l.project,       // B: Kategória
      l.countryFocus,  // C: CEE_Aktivitás
      "High",          // D: Priority_Score
      "Nyitott",       // E: Share_Deal_Nyitottság
      l.name,          // F: Kapcsolattartó_Neve
      l.title,         // G: Kapcsolattartó_Pozíció
      l.email,         // H: Email
      "",              // I: Telefon
      l.linkedin,      // J: LinkedIn_Profil
      "",              // K: Weboldal
      todayStr,        // L: Első_Kapcsolatfelvétel_Dátuma
      "Email / LinkedIn", // M: Csatorna
      statusStr,       // N: Aktuális_Státusz
      "Azonosítva",    // O: LinkedIn_Statusz
      "",              // P: Utolso_InMail_Datum
      "",              // Q: Következő_Lépés_Határideje
      "",              // R: Ajánlott_Ár_EUR
      "Kutatás I-II Deep Research" // S: Megjegyzés
    ]);

    const success = appendInChunks(SPREADSHEET_ID_MASTER, 'Master_Vevőlista!A:S', valuesMaster);
    if (success) {
      addedMasterCount = newMasterLeads.length;
      console.log(`✓ Master_Vevőlista sikeresen frissítve (+${addedMasterCount} új döntéshozó sor).`);
    }
  } else {
    console.log(`\n6. A Master_Vevőlista fül már naprakész (0 új sor).`);
  }

  console.log('\n========================================================================');
  console.log(`🎉 Összesen ${uniqueLeads.length} új, validált döntéshozó került be a CRM rendszerbe!`);
  console.log(`   - Afrika_Projekt_Finanszirozas: +${addedAfrikaCount} új sor`);
  console.log(`   - CONTACTS: +${addedContactsCount} új sor`);
  console.log(`   - Master_Vevőlista: +${addedMasterCount} új sor`);
  console.log('========================================================================');
}

main().catch(err => {
  console.error('❌ Végzetes hiba az importálás során:', err);
  process.exit(1);
});
