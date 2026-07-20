/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

function runGws(args) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'cmd.exe' : 'gws';
  const fullArgs = isWin ? ['/c', 'gws', ...args] : args;

  const res = spawnSync(cmd, fullArgs, { encoding: 'utf-8' });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || 'gws command failed');
  }
  return res.stdout;
}

function parseRecipient(toValue) {
  if (!toValue) return { name: '', email: '' };
  const emailMatch = toValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1].toLowerCase().trim() : '';
  let name = '';
  const nameMatch = toValue.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }
  return { name, email };
}

async function main() {
  console.log('====== POSTAFÍÓK ÉS SPAM MAPPA SZINKRONIZÁCIÓ (ÖSSZES CRM FÜL) ======\n');
  
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // 1. CRM-ek beolvasása
  console.log('1. CRM adatok beolvasása...');
  
  // Master_Vevőlista
  let masterRows = [];
  try {
    const raw = runGws(['sheets', '+read', '--spreadsheet', spreadsheetIdMaster, '--range', 'Master_Vevőlista!A1:S100']);
    masterRows = JSON.parse(raw).values || [];
    console.log(`  ✓ Master_Vevőlista beolvasva: ${masterRows.length} sor`);
  } catch (err) {
    console.error('  ❌ Hiba a Master_Vevőlista beolvasásakor:', err.message);
  }

  // CONTACTS
  let contactsRows = [];
  try {
    const raw = runGws(['sheets', '+read', '--spreadsheet', spreadsheetIdContacts, '--range', 'CONTACTS!A1:O150']);
    contactsRows = JSON.parse(raw).values || [];
    console.log(`  ✓ CONTACTS fül beolvasva: ${contactsRows.length} sor`);
  } catch (err) {
    console.error('  ❌ Hiba a CONTACTS fül beolvasásakor:', err.message);
  }

  // Afrika_Projekt_Finanszirozas
  let afrikaRows = [];
  try {
    const raw = runGws(['sheets', '+read', '--spreadsheet', spreadsheetIdMaster, '--range', 'Afrika_Projekt_Finanszirozas!A1:L50']);
    afrikaRows = JSON.parse(raw).values || [];
    console.log(`  ✓ Afrika_Projekt_Finanszirozas fül beolvasva: ${afrikaRows.length} sor`);
  } catch (err) {
    console.error('  ❌ Hiba az Afrika_Projekt_Finanszirozas fül beolvasásakor:', err.message);
  }

  // Map-ek és kollekciók
  const emailToMaster = {};
  const emailToContacts = {};
  const emailToAfrika = {};
  const monitoredEmails = new Set();

  if (masterRows.length > 1) {
    const header = masterRows[0];
    masterRows.slice(1).forEach((row, idx) => {
      const rec = {};
      header.forEach((key, index) => { rec[key] = row[index] ? row[index].trim() : ''; });
      rec._rowNum = idx + 2;
      const email = rec['Email'] ? rec['Email'].toLowerCase().trim() : '';
      if (email && email.includes('@')) {
        monitoredEmails.add(email);
        emailToMaster[email] = rec;
      }
    });
  }

  if (contactsRows.length > 1) {
    contactsRows.slice(1).forEach((row, idx) => {
      const rec = { email: row[6] ? row[6].trim().toLowerCase() : '', company: row[2] ? row[2].trim() : '', _rowNum: idx + 2 };
      if (rec.email && rec.email.includes('@')) {
        monitoredEmails.add(rec.email);
        emailToContacts[rec.email] = rec;
      }
    });
  }

  if (afrikaRows.length > 1) {
    afrikaRows.slice(1).forEach((row, idx) => {
      const rec = { fund: row[2] ? row[2].trim() : '', email: row[5] ? row[5].trim().toLowerCase() : '', status: row[7] ? row[7].trim() : '', _rowNum: idx + 2 };
      if (rec.email && rec.email.includes('@')) {
        monitoredEmails.add(rec.email);
        emailToAfrika[rec.email] = rec;
      }
    });
  }

  console.log(`✓ Összesített megfigyelt e-mailek száma: ${monitoredEmails.size} db\n`);

  // 2. SPAM, INBOX és SENT lekérdezése
  console.log('2. Postaláda mappák lekérdezése (SPAM, INBOX, SENT)...');

  let spamMsgs = [], inboxMsgs = [], sentMsgs = [];
  try { spamMsgs = JSON.parse(runGws(['gmail', 'users', 'messages', 'list', '--params', JSON.stringify({ userId: 'me', q: 'in:spam', maxResults: 40 })])).messages || []; } catch (e) {}
  try { inboxMsgs = JSON.parse(runGws(['gmail', 'users', 'messages', 'list', '--params', JSON.stringify({ userId: 'me', q: 'is:inbox', maxResults: 40 })])).messages || []; } catch (e) {}
  try { sentMsgs = JSON.parse(runGws(['gmail', 'users', 'messages', 'list', '--params', JSON.stringify({ userId: 'me', q: 'is:sent', maxResults: 40 })])).messages || []; } catch (e) {}

  console.log(`  ✓ SPAM: ${spamMsgs.length} db | INBOX: ${inboxMsgs.length} db | SENT: ${sentMsgs.length} db\n`);

  const afrikaUpdates = new Map();
  const bouncesFound = new Set();

  const folderMsgs = [
    ...spamMsgs.map(m => ({ ...m, folder: 'SPAM' })),
    ...inboxMsgs.map(m => ({ ...m, folder: 'INBOX' }))
  ];

  console.log('3. Hibaüzenetek (Bounces) azonosítása...');
  for (const m of folderMsgs) {
    try {
      const detail = JSON.parse(runGws(['gmail', 'users', 'messages', 'get', '--params', JSON.stringify({ userId: 'me', id: m.id, format: 'full' })]));
      const snippet = detail.snippet || '';
      const headers = detail.payload?.headers || [];
      const fromHeader = (headers.find(h => h.name.toLowerCase() === 'from')?.value || '').toLowerCase();
      const subjectHeader = (headers.find(h => h.name.toLowerCase() === 'subject')?.value || '').toLowerCase();

      const isBounce = fromHeader.includes('mailer-daemon') || fromHeader.includes('postmaster') || fromHeader.includes('mail-delivery') ||
                       subjectHeader.includes('undelivered') || subjectHeader.includes('failure') || subjectHeader.includes('failed') || subjectHeader.includes('returned') || subjectHeader.includes('delivery status');

      if (isBounce) {
        for (const email of monitoredEmails) {
          if (snippet.toLowerCase().includes(email) || JSON.stringify(detail).toLowerCase().includes(email)) {
            bouncesFound.add(email);
            if (emailToAfrika[email]) {
              const rec = emailToAfrika[email];
              console.log(`  ❌ Afrikai Bounce: ${email} (${rec.fund})`);
              afrikaUpdates.set(`Afrika_Projekt_Finanszirozas!H${rec._rowNum}`, [["Visszadobva / Hibás email"]]);
            }
          }
        }
      }
    } catch (e) {}
  }

  // Sikeres kiküldések beállítása az Afrikai fülre
  for (const [email, rec] of Object.entries(emailToAfrika)) {
    if (!bouncesFound.has(email)) {
      console.log(`  ✓ Sikeres Kiküldve: ${email} (${rec.fund})`);
      afrikaUpdates.set(`Afrika_Projekt_Finanszirozas!H${rec._rowNum}`, [["Kiküldve"]]);
    }
  }

  // 4. Batch update Afrika fülhöz
  if (afrikaUpdates.size > 0) {
    console.log(`\n4. Afrika_Projekt_Finanszirozas frissítése (${afrikaUpdates.size} sor)...`);
    const updatesList = [];
    for (let r = 2; r <= afrikaRows.length; r++) {
      const emailCell = afrikaRows[r - 1] ? afrikaRows[r - 1][5] : '';
      if (emailCell) {
        const cleanEmail = emailCell.trim().toLowerCase();
        const statusVal = bouncesFound.has(cleanEmail) ? "Visszadobva / Hibás email" : "Kiküldve";
        updatesList.push([statusVal]);
      }
    }

    try {
      const updateParams = JSON.stringify({
        spreadsheetId: spreadsheetIdMaster,
        range: `Afrika_Projekt_Finanszirozas!H2:H${1 + updatesList.length}`,
        valueInputOption: "USER_ENTERED"
      });
      const updateJson = JSON.stringify({ values: updatesList });
      runGws(['sheets', 'spreadsheets', 'values', 'update', '--params', updateParams, '--json', updateJson]);
      console.log('✓ Afrika_Projekt_Finanszirozas sikeresen frissítve!');
    } catch (err) {
      console.error('❌ Hiba a CRM frissítéskor:', err.message);
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 POSTALÁDA ÉS SPAM SZINKRONIZÁCIÓ SIKERESEN BEFEJEZŐDÖTT.');
  console.log('========================================================================');
}

main();
