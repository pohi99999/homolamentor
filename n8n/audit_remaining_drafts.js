/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ'; // Master_Vevőlista
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM'; // CONTACTS fül

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
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

function evaluateProject(subject, snippet) {
  const text = `${subject} ${snippet}`.toLowerCase();
  
  if (text.includes('vt-8') || text.includes('vt8') || text.includes('keszthely vt')) {
    return 'Keszthely VT-8';
  }
  if (text.includes('nagycenk senior') || text.includes('senior living') || text.includes('nagycenk idősotthon') || text.includes('nagycenk idősek')) {
    return 'Nagycenk Senior Living';
  }
  if (text.includes('afrika') || text.includes('inkubátor') || text.includes('elefántcsontpart') || text.includes('abidjan') || text.includes('selab') || text.includes('livestock') || text.includes('west africa')) {
    return 'Afrika-Inkubátor';
  }
  if (text.includes('mobilház') || text.includes('mobile home') || text.includes('kínai mobilház') || text.includes('modular house') || text.includes('flat-pack')) {
    return 'Mobilház-Projekt';
  }
  if (text.includes('9 kiemelt') || text.includes('9 ingatlan') || text.includes('exkluzív off-market') || text.includes('portfólió') || text.includes('ingatlanfejlesztési lehetőség') || text.includes('ensana') || text.includes('győrszentiván') || text.includes('nagycenk') || text.includes('pap-sziget') || text.includes('keszthely lakópark') || text.includes('kamion park') || text.includes('gyenesdiás wellness') || text.includes('balatongyörök golf') || text.includes('hotel die traube')) {
    return '9 ingatlan';
  }
  
  return 'Egyéb / Beazonosítatlan';
}

async function main() {
  console.log('====== PORTAL & B2B OUTREACH PISZKOZAT-AUDIT ======\n');
  const today = new Date().toISOString().split('T')[0];

  // 1. CRM adatok beolvasása a Google Sheets-ből
  console.log('1. CRM adatok beolvasása a Google Sheets-ből...');
  
  let masterRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Master_Vevőlista!A1:N120"`, { encoding: 'utf-8' });
    masterRows = JSON.parse(output).values || [];
    console.log(`✓ Master_Vevőlista beolvasva: ${masterRows.length} sor.`);
  } catch (err) {
    console.error('❌ Hiba a Master_Vevőlista beolvasásakor:', err.message);
  }

  let contactsRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdContacts} --range "CONTACTS!A1:M160"`, { encoding: 'utf-8' });
    contactsRows = JSON.parse(output).values || [];
    console.log(`✓ CONTACTS fül beolvasva: ${contactsRows.length} sor.`);
  } catch (err) {
    console.error('❌ Hiba a CONTACTS fül beolvasásakor:', err.message);
  }

  // Rekord szótárak felépítése
  const masterRecordsByEmail = {};
  if (masterRows.length > 1) {
    const header = masterRows[0];
    masterRows.slice(1).forEach((row, idx) => {
      const record = {};
      header.forEach((key, index) => {
        record[key] = row[index] ? row[index].trim() : '';
      });
      record._rowNum = idx + 2;
      const email = record['Email'] ? record['Email'].toLowerCase().trim() : '';
      if (email) {
        masterRecordsByEmail[email] = record;
      }
    });
  }

  const contactsRecordsByEmail = {};
  if (contactsRows.length > 1) {
    const header = contactsRows[0];
    contactsRows.slice(1).forEach((row, idx) => {
      const record = {
        name: row[0] ? row[0].trim() : '',
        company: row[2] ? row[2].trim() : '',
        email: row[6] ? row[6].trim() : '',
        status: row[11] ? row[11].trim() : '',
        _rowNum: idx + 2
      };
      const email = record.email ? record.email.toLowerCase().trim() : '';
      if (email) {
        contactsRecordsByEmail[email] = record;
      }
    });
  }

  // 2. Gmail Piszkozatok listázása
  console.log('\n2. Gmail piszkozatok lekérése a GWS CLI-vel...');
  let draftListOutput;
  try {
    const output = execSync(`gws gmail users drafts list --params "{\\"userId\\":\\"me\\",\\"maxResults\\":150}"`, { encoding: 'utf-8' });
    draftListOutput = JSON.parse(output);
  } catch (err) {
    console.error('❌ Hiba a piszkozatok listázásakor:', err.message);
    return;
  }

  const drafts = draftListOutput.drafts || [];
  console.log(`✓ Összesen ${drafts.length} darab piszkozat észlelve a postaládában.`);

  if (drafts.length === 0) {
    console.log('Nincsenek vizsgálandó piszkozatok.');
    return;
  }

  // 3. Részletes adatok lekérése párhuzamosított batchekben
  console.log('\n3. Piszkozatok részletes adatainak letöltése (címzett, tárgy, tartalom)...');
  const detailedDrafts = [];
  const batchSize = 6;
  
  for (let i = 0; i < drafts.length; i += batchSize) {
    const batch = drafts.slice(i, i + batchSize);
    console.log(`   -> Letöltés: ${i + 1} - ${Math.min(i + batchSize, drafts.length)} / ${drafts.length}...`);
    
    const promises = batch.map(async (draft) => {
      try {
        const cmd = `gws gmail users messages get --params "{\\"userId\\":\\"me\\",\\"id\\":\\"${draft.message.id}\\"}"`;
        const stdout = await execPromise(cmd);
        const msgDetails = JSON.parse(stdout);
        
        const headers = msgDetails.payload.headers || [];
        const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
        
        const to = toHeader ? toHeader.value : '';
        const subject = subjectHeader ? subjectHeader.value : '';
        const snippet = msgDetails.snippet || '';
        
        const { name: recipientName, email: recipientEmail } = parseRecipient(to);
        const project = evaluateProject(subject, snippet);
        
        return {
          draftId: draft.id,
          messageId: draft.message.id,
          to,
          recipientEmail,
          recipientName,
          subject,
          snippet,
          project
        };
      } catch (err) {
        console.error(`   ⚠️ Hiba a ${draft.message.id} üzenet lekérésekor:`, err.message);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(res => {
      if (res) detailedDrafts.push(res);
    });
  }

  console.log(`\n✓ Sikeresen letöltve ${detailedDrafts.length} piszkozat részletes adata.`);

  // 4. Elemzés és CRM szinkronizáció
  console.log('\n4. Keresztellenőrzés a CRM táblázatokkal...');
  
  const stats = {
    total: detailedDrafts.length,
    validRecipient: 0,
    invalidRecipient: 0,
    projectDistribution: {},
    inSync: 0,
    updated: 0,
    missingFromCrm: []
  };

  const masterUpdates = [];
  const contactsUpdates = [];

  for (const draft of detailedDrafts) {
    // Projekt eloszlás számlálás
    stats.projectDistribution[draft.project] = (stats.projectDistribution[draft.project] || 0) + 1;
    
    const hasValidEmail = draft.recipientEmail && draft.recipientEmail.includes('@');
    if (hasValidEmail) {
      stats.validRecipient++;
    } else {
      stats.invalidRecipient++;
    }

    const email = draft.recipientEmail;
    if (!hasValidEmail) {
      continue;
    }

    let foundInMaster = false;
    let foundInContacts = false;

    // a) Ellenőrzés a Master_Vevőlista táblázatban
    const masterRec = masterRecordsByEmail[email];
    if (masterRec) {
      foundInMaster = true;
      const currentStatus = masterRec['Aktuális_Státusz'] || '';
      if (currentStatus !== 'Piszkozat bekészítve' && currentStatus !== 'Kiküldve') {
        console.log(`   [Master CRM] 📝 Jelölés frissítésre: ${email} (${masterRec['Cégnév']}) -> 'Piszkozat bekészítve' (Sor: ${masterRec._rowNum})`);
        masterUpdates.push({ row: masterRec._rowNum, email, company: masterRec['Cégnév'] });
      } else {
        stats.inSync++;
      }
    }

    // b) Ellenőrzés a CONTACTS táblázatban
    const contactsRec = contactsRecordsByEmail[email];
    if (contactsRec) {
      foundInContacts = true;
      const currentStatus = contactsRec.status || '';
      if (currentStatus !== 'Piszkozat bekészítve' && currentStatus !== 'Kiküldve') {
        console.log(`   [Contacts CRM] 📝 Jelölés frissítésre: ${email} (${contactsRec.company}) -> 'Piszkozat bekészítve' (Sor: ${contactsRec._rowNum})`);
        contactsUpdates.push({ row: contactsRec._rowNum, email, company: contactsRec.company });
      } else {
        stats.inSync++;
      }
    }

    if (!foundInMaster && !foundInContacts) {
      stats.missingFromCrm.push({
        email: draft.recipientEmail,
        name: draft.recipientName,
        subject: draft.subject,
        project: draft.project
      });
    }
  }

  // Batch frissítések végrehajtása
  if (masterUpdates.length > 0) {
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: masterUpdates.map(u => ({
        range: `Master_Vevőlista!N${u.row}`,
        values: [["Piszkozat bekészítve"]]
      }))
    };
    try {
      const payloadStr = JSON.stringify(payload).replace(/"/g, '\\"');
      const paramsStr = JSON.stringify({ spreadsheetId: spreadsheetIdMaster }).replace(/"/g, '\\"');
      console.log(`\n🔄 [Master CRM] Batch frissítés végrehajtása (${masterUpdates.length} sor)...`);
      execSync(`gws sheets spreadsheets values batchUpdate --params "${paramsStr}" --json "${payloadStr}"`);
      stats.updated += masterUpdates.length;
      console.log('✓ Master CRM sikeresen frissítve.');
    } catch (err) {
      console.error('❌ Hiba a Master CRM batch frissítésekor:', err.message);
    }
  }

  if (contactsUpdates.length > 0) {
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: contactsUpdates.map(u => ({
        range: `CONTACTS!L${u.row}`,
        values: [["Piszkozat bekészítve"]]
      }))
    };
    try {
      const payloadStr = JSON.stringify(payload).replace(/"/g, '\\"');
      const paramsStr = JSON.stringify({ spreadsheetId: spreadsheetIdContacts }).replace(/"/g, '\\"');
      console.log(`\n🔄 [Contacts CRM] Batch frissítés végrehajtása (${contactsUpdates.length} sor)...`);
      execSync(`gws sheets spreadsheets values batchUpdate --params "${paramsStr}" --json "${payloadStr}"`);
      stats.updated += contactsUpdates.length;
      console.log('✓ Contacts CRM sikeresen frissítve.');
    } catch (err) {
      console.error('❌ Hiba a Contacts CRM batch frissítésekor:', err.message);
    }
  }

  // 5. Statisztika kiírása a terminálra
  console.log('\n================ AUDIT EREDMÉNYEK ================');
  console.log(`Összes vizsgált piszkozat: ${stats.total} db`);
  console.log(`Érvényes címzettel rendelkezik: ${stats.validRecipient} db`);
  console.log(`Hiányzó/Érvénytelen címzett: ${stats.invalidRecipient} db`);
  
  console.log('\nProjekt szerinti eloszlás:');
  Object.keys(stats.projectDistribution).forEach(proj => {
    console.log(`  - ${proj}: ${stats.projectDistribution[proj]} db`);
  });
  
  console.log('\nCRM Szinkronizáció:');
  console.log(`  - Már eleve szinkronban volt (Piszkozat/Kiküldve): ${stats.inSync} db`);
  console.log(`  - Sikeresen frissítve "Piszkozat bekészítve"-re: ${stats.updated} db`);
  console.log(`  - CRM-ekből hiányzó piszkozatok száma: ${stats.missingFromCrm.length} db`);

  if (stats.missingFromCrm.length > 0) {
    console.log('\n❌ CRM-ből hiányzó piszkozatok listája:');
    stats.missingFromCrm.forEach((d, idx) => {
      console.log(`  ${idx + 1}. [${d.project}] ${d.email} (Név: "${d.name}", Tárgy: "${d.subject}")`);
    });
  }
  console.log('==================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
