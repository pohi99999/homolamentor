/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');

const SPREADSHEET_ID_MASTER = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const SPREADSHEET_ID_CONTACTS = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

function runGwsRead(cmdStr) {
  return execSync(`gws ${cmdStr}`, { encoding: 'utf-8' });
}

function runGwsUpdate(spreadsheetId, rangeStr, rowValues) {
  const paramsObj = {
    spreadsheetId: spreadsheetId,
    range: rangeStr,
    valueInputOption: 'USER_ENTERED'
  };
  const bodyObj = {
    values: rowValues
  };
  const pEscaped = JSON.stringify(paramsObj).replace(/"/g, '\\"');
  const bEscaped = JSON.stringify(bodyObj).replace(/"/g, '\\"');
  const cmd = `gws sheets spreadsheets values update --params "${pEscaped}" --json "${bEscaped}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

async function main() {
  console.log('====== POSTAFÍÓK ÉS SPAM MAPPA SZINKRONIZÁCIÓ (DEEP RESEARCH LEADEK) ======\n');
  
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. CRM adatok beolvasása
  console.log('1. CRM adatok beolvasása...');
  
  const masterOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_MASTER} --range Master_Vevőlista!A1:S500`));
  const afrikaOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_MASTER} --range Afrika_Projekt_Finanszirozas!A1:L500`));
  const contactsOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_CONTACTS} --range CONTACTS!A1:P500`));

  const masterRows = masterOut.values || [];
  const afrikaRows = afrikaOut.values || [];
  const contactsRows = contactsOut.values || [];

  const monitoredEmails = new Set();
  
  if (masterRows.length > 1) {
    masterRows.slice(1).forEach(r => {
      const email = (r[7] || '').toLowerCase().trim();
      if (email && email.includes('@')) monitoredEmails.add(email);
    });
  }

  if (contactsRows.length > 1) {
    contactsRows.slice(1).forEach(r => {
      const email = (r[6] || '').toLowerCase().trim();
      if (email && email.includes('@')) monitoredEmails.add(email);
    });
  }

  if (afrikaRows.length > 1) {
    afrikaRows.slice(1).forEach(r => {
      const email = (r[5] || '').toLowerCase().trim();
      if (email && email.includes('@')) monitoredEmails.add(email);
    });
  }

  console.log(`✓ Megfigyelt CRM e-mailek száma: ${monitoredEmails.size} db\n`);

  // 2. SPAM és INBOX mappák fésülése Bounce-okért
  console.log('2. SPAM, INBOX és SENT mappák átfésülése...');

  let spamMsgs = [], inboxMsgs = [], sentMsgs = [];
  try { spamMsgs = JSON.parse(runGwsRead('gmail users messages list --params "{\\"userId\\":\\"me\\",\\"q\\":\\"in:spam\\",\\"maxResults\\":100}"')).messages || []; } catch (e) {}
  try { inboxMsgs = JSON.parse(runGwsRead('gmail users messages list --params "{\\"userId\\":\\"me\\",\\"q\\":\\"is:inbox\\",\\"maxResults\\":100}"')).messages || []; } catch (e) {}
  try { sentMsgs = JSON.parse(runGwsRead('gmail users messages list --params "{\\"userId\\":\\"me\\",\\"q\\":\\"is:sent\\",\\"maxResults\\":100}"')).messages || []; } catch (e) {}

  console.log(`  ✓ SPAM üzenetek: ${spamMsgs.length} db | INBOX: ${inboxMsgs.length} db | SENT: ${sentMsgs.length} db`);

  const bouncesFound = new Set();
  const folderMsgs = [
    ...spamMsgs.map(m => ({ ...m, folder: 'SPAM' })),
    ...inboxMsgs.map(m => ({ ...m, folder: 'INBOX' }))
  ];

  console.log('\n3. Mailer-Daemon és Bounce hibaüzenetek azonosítása...');
  for (const m of folderMsgs) {
    try {
      const detailRaw = runGwsRead(`gmail users messages get --params "{\\"userId\\":\\"me\\",\\"id\\":\\"${m.id}\\",\\"format\\":\\"full\\"}"`);
      const detail = JSON.parse(detailRaw);
      const headers = detail.payload?.headers || [];
      const from = (headers.find(h => h.name.toLowerCase() === 'from')?.value || '').toLowerCase();
      const subject = (headers.find(h => h.name.toLowerCase() === 'subject')?.value || '').toLowerCase();

      const isBounce = from.includes('mailer-daemon') || from.includes('postmaster') || from.includes('mail-delivery') ||
                       subject.includes('undelivered') || subject.includes('failure') || subject.includes('failed') || subject.includes('returned') || subject.includes('delivery status');

      if (isBounce) {
        const snippet = detail.snippet || '';
        const snippetMatches = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        for (const eMatch of snippetMatches) {
          const clean = eMatch.toLowerCase().trim();
          if (monitoredEmails.has(clean)) {
            console.log(`  ❌ Azonosított Bounce (${m.folder}): ${clean}`);
            bouncesFound.add(clean);
          }
        }
      }
    } catch (e) {}
  }

  console.log(`\n✓ Összesen ${bouncesFound.size} igazoltan visszadobott e-mail cím került azonosításra.\n`);

  // 4. CRM Státuszok Frissítése
  console.log('4. CRM Státuszok oszlop-szintű frissítése...');

  let sentCount = 0;
  let bounceCount = 0;

  // A) Master_Vevőlista
  if (masterRows.length > 1) {
    const masterStatuses = [];
    const masterDates = [];
    masterRows.slice(1).forEach(r => {
      const email = (r[7] || '').toLowerCase().trim();
      const currentStatus = r[13] || '';
      let newStatus = currentStatus;
      let newDate = r[11] || '';

      if (currentStatus === 'Piszkozat bekészítve' || currentStatus === 'Új Lead - Deep Research' || (email && monitoredEmails.has(email) && currentStatus !== 'Visszadobva / Hibás email' && currentStatus !== 'Nem megkeresett')) {
        if (bouncesFound.has(email)) {
          newStatus = 'Visszadobva / Hibás email';
          bounceCount++;
        } else if (currentStatus === 'Piszkozat bekészítve' || currentStatus === 'Új Lead - Deep Research') {
          newStatus = 'Kiküldve';
          newDate = todayStr;
          sentCount++;
        }
      }
      masterStatuses.push([newStatus]);
      masterDates.push([newDate]);
    });

    try {
      runGwsUpdate(SPREADSHEET_ID_MASTER, `Master_Vevőlista!N2:N${1 + masterStatuses.length}`, masterStatuses);
      runGwsUpdate(SPREADSHEET_ID_MASTER, `Master_Vevőlista!L2:L${1 + masterDates.length}`, masterDates);
      console.log('  ✓ Master_Vevőlista fül (Státusz és Dátum) frissítve.');
    } catch (err) {
      console.error('  ❌ Hiba a Master_Vevőlista frissítésekor:', err.message);
    }
  }

  // B) Afrika_Projekt_Finanszirozas
  if (afrikaRows.length > 1) {
    const afrikaStatuses = [];
    afrikaRows.slice(1).forEach(r => {
      const email = (r[5] || '').toLowerCase().trim();
      const currentStatus = r[7] || '';
      let newStatus = currentStatus;

      if (currentStatus === 'Piszkozat bekészítve' || currentStatus === 'Új Lead - Deep Research') {
        if (bouncesFound.has(email)) {
          newStatus = 'Visszadobva / Hibás email';
        } else {
          newStatus = 'Kiküldve';
        }
      }
      afrikaStatuses.push([newStatus]);
    });

    try {
      runGwsUpdate(SPREADSHEET_ID_MASTER, `Afrika_Projekt_Finanszirozas!H2:H${1 + afrikaStatuses.length}`, afrikaStatuses);
      console.log('  ✓ Afrika_Projekt_Finanszirozas fül frissítve.');
    } catch (err) {
      console.error('  ❌ Hiba az Afrika_Projekt_Finanszirozas frissítésekor:', err.message);
    }
  }

  // C) CONTACTS fül
  if (contactsRows.length > 1) {
    const contactsStatuses = [];
    const contactsLastInteractions = [];
    contactsRows.slice(1).forEach(r => {
      const email = (r[6] || '').toLowerCase().trim();
      const currentStatus = r[11] || '';
      let newStatus = currentStatus;
      let newInteraction = r[12] || '';

      if (currentStatus === 'Piszkozat bekészítve' || currentStatus === 'Új Lead - Deep Research') {
        if (bouncesFound.has(email)) {
          newStatus = 'Visszadobva / Hibás email';
        } else {
          newStatus = 'Kiküldve';
          newInteraction = todayStr;
        }
      }
      contactsStatuses.push([newStatus]);
      contactsLastInteractions.push([newInteraction]);
    });

    try {
      runGwsUpdate(SPREADSHEET_ID_CONTACTS, `CONTACTS!L2:L${1 + contactsStatuses.length}`, contactsStatuses);
      runGwsUpdate(SPREADSHEET_ID_CONTACTS, `CONTACTS!M2:M${1 + contactsLastInteractions.length}`, contactsLastInteractions);
      console.log('  ✓ CONTACTS fül (Státusz és Utolsó Interakció) frissítve.');
    } catch (err) {
      console.error('  ❌ Hiba a CONTACTS fül frissítésekor:', err.message);
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 POSTALÁDA ÉS SPAM SZINKRONIZÁCIÓ SIKERESEN BEFEJEZŐDÖTT!');
  console.log(`   - Sikeresen Kiküldve: ${sentCount} db lead`);
  console.log(`   - Visszadobva / Hibás email: ${bouncesFound.size} db lead`);
  console.log('========================================================================');
}

main().catch(err => {
  console.error('❌ Végzetes hiba a szinkronizáció során:', err);
  process.exit(1);
});
