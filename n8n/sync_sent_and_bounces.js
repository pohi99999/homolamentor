/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ'; // Master_Vevőlista
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM'; // CONTACTS fül a másik táblázatban

function getDomain(str) {
  if (!str) return '';
  let clean = str.toLowerCase().trim();
  if (clean.includes('@')) {
    clean = clean.split('@')[1];
  }
  clean = clean.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  return clean;
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
  console.log('1. CRM adatok beolvasása a Google Sheets-ből...');
  
  // a) Master_Vevőlista beolvasása
  let masterRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Master_Vevőlista!A1:S100"`, { encoding: 'utf-8' });
    masterRows = JSON.parse(output).values || [];
    console.log(`✓ Master_Vevőlista beolvasva, ${masterRows.length} sor észlelve.`);
  } catch (err) {
    console.error('❌ Hiba a Master_Vevőlista beolvasásakor:', err.message);
  }

  // b) CONTACTS fül beolvasása a másik táblázatból
  let contactsRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdContacts} --range "CONTACTS!A1:O150"`, { encoding: 'utf-8' });
    contactsRows = JSON.parse(output).values || [];
    console.log(`✓ CONTACTS táblázat beolvasva, ${contactsRows.length} sor észlelve.`);
  } catch (err) {
    console.error('❌ Hiba a CONTACTS fül beolvasásakor:', err.message);
  }

  // Rekordok felépítése
  const masterRecords = [];
  if (masterRows.length > 1) {
    const header = masterRows[0];
    masterRows.slice(1).forEach((row, idx) => {
      const record = {};
      header.forEach((key, index) => {
        record[key] = row[index] ? row[index].trim() : '';
      });
      record._rowNum = idx + 2;
      masterRecords.push(record);
    });
  }

  const contactsRecords = [];
  if (contactsRows.length > 1) {
    const header = contactsRows[0];
    contactsRows.slice(1).forEach((row, idx) => {
      const record = {
        name: row[0] ? row[0].trim() : '',
        position: row[1] ? row[1].trim() : '',
        company: row[2] ? row[2].trim() : '',
        email: row[6] ? row[6].trim() : '',
        status: row[11] ? row[11].trim() : '',
        _rowNum: idx + 2
      };
      contactsRecords.push(record);
    });
  }

  // E-mail szótár és források betöltése
  const emailToCompanyName = {};
  const emailToMasterRecord = {};
  const emailToContactsRecord = {};
  const monitoredEmails = new Set();

  // Master rekordok regisztrálása
  masterRecords.forEach(rec => {
    const email = rec['Email'] ? rec['Email'].toLowerCase().trim() : '';
    if (email && email.includes('@')) {
      monitoredEmails.add(email);
      emailToMasterRecord[email] = rec;
      if (rec['Cégnév']) emailToCompanyName[email] = rec['Cégnév'];
    }
  });

  // Contacts rekordok regisztrálása
  contactsRecords.forEach(rec => {
    const email = rec.email ? rec.email.toLowerCase().trim() : '';
    if (email && email.includes('@')) {
      monitoredEmails.add(email);
      emailToContactsRecord[email] = rec;
      if (rec.company) emailToCompanyName[email] = rec.company;
    }
  });

  // Helyi CSV és kontaktlista beolvasása a párosítások segítésére
  const csvPath = path.join(__dirname, 'b2b_target_companies.csv');
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (csvLines.length > 1) {
      const csvHeader = csvLines[0].split(',').map(h => h.trim());
      csvLines.slice(1).forEach(line => {
        const values = line.split(',');
        const record = {};
        csvHeader.forEach((key, index) => {
          record[key] = values[index] ? values[index].trim() : '';
        });
        if (record.Email && record.Ceg) {
          const email = record.Email.toLowerCase().trim();
          emailToCompanyName[email] = record.Ceg;
          monitoredEmails.add(email);
        }
      });
    }
  }

  const path1 = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '1.Keszthely telek', '03_Vevo_jeloltek', 'kontaktlista.md');
  if (fs.existsSync(path1)) {
    const content = fs.readFileSync(path1, 'utf-8');
    content.split('\n').forEach(line => {
      if (line.includes('|') && !line.includes('Priority Score') && !line.includes('---|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 8) {
          const companyName = parts[2].replace(/\*\*/g, '').split('(')[0].trim();
          const contactInfo = parts[6];
          const emailMatch = contactInfo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            const email = emailMatch[1].toLowerCase().trim();
            emailToCompanyName[email] = companyName;
            monitoredEmails.add(email);
          }
        }
      }
    });
  }

  // Intelligens párosítás Master és Contacts rekordokhoz
  function findMasterRecord(email, displayName, companyFromSources) {
    if (!email) return null;
    if (emailToMasterRecord[email]) return emailToMasterRecord[email];
    
    const emailDomain = getDomain(email);
    
    if (companyFromSources) {
      const match = masterRecords.find(r => r['Cégnév'] && (
        r['Cégnév'].toLowerCase().includes(companyFromSources.toLowerCase()) ||
        companyFromSources.toLowerCase().includes(r['Cégnév'].toLowerCase())
      ));
      if (match) return match;
    }
    
    if (displayName) {
      const match = masterRecords.find(r => r['Kapcsolattartó_Neve'] && (
        r['Kapcsolattartó_Neve'].toLowerCase().includes(displayName.toLowerCase()) ||
        displayName.toLowerCase().includes(r['Kapcsolattartó_Neve'].toLowerCase())
      ));
      if (match) return match;
    }
    
    if (emailDomain && emailDomain !== 'gmail.com' && emailDomain !== 'yahoo.com' && emailDomain !== 'hotmail.com') {
      let match = masterRecords.find(r => r['Weboldal'] && getDomain(r['Weboldal']) === emailDomain);
      if (match) return match;
      
      match = masterRecords.find(r => {
        const cegnev = r['Cégnév'] ? r['Cégnév'].toLowerCase().replace(/\s+/g, '') : '';
        const domainWithoutTld = emailDomain.split('.')[0];
        return cegnev && (cegnev.includes(domainWithoutTld) || domainWithoutTld.includes(cegnev));
      });
      if (match) return match;
    }
    
    return null;
  }

  function findContactsRecord(email, displayName, companyFromSources) {
    if (!email) return null;
    if (emailToContactsRecord[email]) return emailToContactsRecord[email];
    
    const emailDomain = getDomain(email);
    
    if (companyFromSources) {
      const match = contactsRecords.find(r => r.company && (
        r.company.toLowerCase().includes(companyFromSources.toLowerCase()) ||
        companyFromSources.toLowerCase().includes(r.company.toLowerCase())
      ));
      if (match) return match;
    }
    
    if (displayName) {
      const match = contactsRecords.find(r => r.name && (
        r.name.toLowerCase().includes(displayName.toLowerCase()) ||
        displayName.toLowerCase().includes(r.name.toLowerCase())
      ));
      if (match) return match;
    }
    
    if (emailDomain && emailDomain !== 'gmail.com' && emailDomain !== 'yahoo.com' && emailDomain !== 'hotmail.com') {
      const match = contactsRecords.find(r => {
        const company = r.company ? r.company.toLowerCase().replace(/\s+/g, '') : '';
        const domainWithoutTld = emailDomain.split('.')[0];
        return company && (company.includes(domainWithoutTld) || domainWithoutTld.includes(company));
      });
      if (match) return match;
    }
    
    return null;
  }

  console.log(`✓ Monitored e-mailek száma: ${monitoredEmails.size}`);

  const today = '2026-07-15';
  let sentCount = 0;
  let bounceCount = 0;
  let oooCount = 0;

  // 2. SENT mappából lekérdezés
  console.log('\n2. SENT levelek lekérdezése...');
  let sentListOutput;
  try {
    const res = spawnSync('gws', [
      'gmail', 'users', 'messages', 'list',
      '--params', `"${JSON.stringify({ userId: 'me', q: 'is:sent', maxResults: 50 }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    sentListOutput = JSON.parse(res.stdout);
  } catch (err) {
    console.error('❌ Hiba a SENT listázásakor:', err.message);
    sentListOutput = { messages: [] };
  }

  const sentMessages = sentListOutput.messages || [];
  console.log(`✓ Talált elküldött levelek: ${sentMessages.length} db`);

  const processedSentEmails = new Set();
  const pairedSentEmails = new Set();

  for (const msg of sentMessages) {
    const detailRes = spawnSync('gws', [
      'gmail', 'users', 'messages', 'get',
      '--params', `"${JSON.stringify({ userId: 'me', id: msg.id }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    
    if (detailRes.status !== 0) continue;
    
    try {
      const msgDetail = JSON.parse(detailRes.stdout);
      const headers = msgDetail.payload.headers || [];
      const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
      const subject = subjectHeader ? subjectHeader.value : '';

      if (toHeader) {
        const { name: displayName, email: recipientEmail } = parseRecipient(toHeader.value);
        if (recipientEmail && !processedSentEmails.has(recipientEmail)) {
          processedSentEmails.add(recipientEmail);
          const companyFromSources = emailToCompanyName[recipientEmail] || '';
          
          let hasAnyMatch = false;

          // a) Párosítás a Master_Vevőlista fülhöz
          const masterRec = findMasterRecord(recipientEmail, displayName, companyFromSources);
          if (masterRec) {
            console.log(`  ✓ SENT találat (Master CRM): ${recipientEmail} -> ${masterRec['Cégnév']}`);
            hasAnyMatch = true;
            pairedSentEmails.add(recipientEmail);
            emailToMasterRecord[recipientEmail] = masterRec;

            if (!masterRec['Email']) {
              console.log(`    Pótlás Master CRM H${masterRec._rowNum}: ${recipientEmail}`);
              spawnSync('gws', [
                'sheets', 'spreadsheets', 'values', 'update',
                '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdMaster, range: `Master_Vevőlista!H${masterRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
                '--json', `"${JSON.stringify({ values: [[recipientEmail]] }).replace(/"/g, '\\"')}"`
              ], { encoding: 'utf-8', shell: true });
              masterRec['Email'] = recipientEmail;
            }

            spawnSync('gws', [
              'sheets', 'spreadsheets', 'values', 'update',
              '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdMaster, range: `Master_Vevőlista!L${masterRec._rowNum}:N${masterRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
              '--json', `"${JSON.stringify({ values: [[today, "", "Kiküldve"]] }).replace(/"/g, '\\"')}"`
            ], { encoding: 'utf-8', shell: true });
          }

          // b) Párosítás a CONTACTS fülhöz
          const contactsRec = findContactsRecord(recipientEmail, displayName, companyFromSources);
          if (contactsRec) {
            console.log(`  ✓ SENT találat (Contacts): ${recipientEmail} -> ${contactsRec.company}`);
            hasAnyMatch = true;
            pairedSentEmails.add(recipientEmail);
            emailToContactsRecord[recipientEmail] = contactsRec;

            if (!contactsRec.email) {
              console.log(`    Pótlás Contacts G${contactsRec._rowNum}: ${recipientEmail}`);
              spawnSync('gws', [
                'sheets', 'spreadsheets', 'values', 'update',
                '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdContacts, range: `CONTACTS!G${contactsRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
                '--json', `"${JSON.stringify({ values: [[recipientEmail]] }).replace(/"/g, '\\"')}"`
              ], { encoding: 'utf-8', shell: true });
              contactsRec.email = recipientEmail;
            }

            // L: Status, M: Last Interaction Date
            spawnSync('gws', [
              'sheets', 'spreadsheets', 'values', 'update',
              '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdContacts, range: `CONTACTS!L${contactsRec._rowNum}:M${contactsRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
              '--json', `"${JSON.stringify({ values: [["Kiküldve", today]] }).replace(/"/g, '\\"')}"`
            ], { encoding: 'utf-8', shell: true });
          }

          if (hasAnyMatch) {
            sentCount++;
          } else {
            console.log(`  ⚠ SENT nem párosítható: ${recipientEmail} (Név: "${displayName}", Tárgy: "${subject}")`);
          }
        }
      }
    } catch (e) {
      // Hiba
    }
  }

  // 3. INBOX mappából lekérdezés
  console.log('\n3. INBOX levelek lekérdezése (Bounce és OOO keresés)...');
  let inboxListOutput;
  try {
    const res = spawnSync('gws', [
      'gmail', 'users', 'messages', 'list',
      '--params', `"${JSON.stringify({ userId: 'me', q: 'is:inbox', maxResults: 50 }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    inboxListOutput = JSON.parse(res.stdout);
  } catch (err) {
    console.error('❌ Hiba az INBOX listázásakor:', err.message);
    inboxListOutput = { messages: [] };
  }

  const inboxMessages = inboxListOutput.messages || [];
  console.log(`✓ Talált beérkező levelek: ${inboxMessages.length} db`);

  const processedInboxEmails = new Set();
  const allMonitoredEmails = [...new Set([...Array.from(monitoredEmails), ...Array.from(processedSentEmails)])];

  for (const msg of inboxMessages) {
    const detailRes = spawnSync('gws', [
      'gmail', 'users', 'messages', 'get',
      '--params', `"${JSON.stringify({ userId: 'me', id: msg.id }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    
    if (detailRes.status !== 0) continue;
    
    try {
      const msgDetail = JSON.parse(detailRes.stdout);
      const snippet = msgDetail.snippet || '';
      const headers = msgDetail.payload.headers || [];
      
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
      
      const subject = subjectHeader ? subjectHeader.value.toLowerCase() : '';
      const from = fromHeader ? fromHeader.value.toLowerCase() : '';
      
      let fromEmail = '';
      const fromEmailMatch = from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (fromEmailMatch) {
        fromEmail = fromEmailMatch[1].toLowerCase().trim();
      }

      // Bounce ellenőrzés
      const isBounceSender = from.includes('mailer-daemon') || from.includes('postmaster') || from.includes('mail-delivery');
      const isBounceSubject = subject.includes('undelivered') || subject.includes('failure') || subject.includes('failed') || subject.includes('notice') || subject.includes('returned') || subject.includes('delivery status');
      
      if (isBounceSender || isBounceSubject) {
        for (const email of allMonitoredEmails) {
          if (snippet.toLowerCase().includes(email) && !processedInboxEmails.has(email)) {
            processedInboxEmails.add(email);
            let hasBounceMatch = false;

            // Master CRM frissítés
            const masterRec = emailToMasterRecord[email];
            if (masterRec) {
              console.log(`  ⚠ BOUNCE észlelve (Master CRM): ${email} (${masterRec['Cégnév']})`);
              hasBounceMatch = true;
              spawnSync('gws', [
                'sheets', 'spreadsheets', 'values', 'update',
                '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdMaster, range: `Master_Vevőlista!N${masterRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
                '--json', `"${JSON.stringify({ values: [["Visszadobva / Hibás email"]] }).replace(/"/g, '\\"')}"`
              ], { encoding: 'utf-8', shell: true });
            }

            // Contacts frissítés
            const contactsRec = emailToContactsRecord[email];
            if (contactsRec) {
              console.log(`  ⚠ BOUNCE észlelve (Contacts): ${email} (${contactsRec.company})`);
              hasBounceMatch = true;
              spawnSync('gws', [
                'sheets', 'spreadsheets', 'values', 'update',
                '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdContacts, range: `CONTACTS!L${contactsRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
                '--json', `"${JSON.stringify({ values: [["Visszadobva / Hibás email"]] }).replace(/"/g, '\\"')}"`
              ], { encoding: 'utf-8', shell: true });
            }

            if (hasBounceMatch) {
              bounceCount++;
              if (pairedSentEmails.has(email)) {
                sentCount = Math.max(0, sentCount - 1);
              }
            }
          }
        }
      }
      
      // OOO ellenőrzés
      const masterRec = fromEmail ? emailToMasterRecord[fromEmail] : null;
      const contactsRec = fromEmail ? emailToContactsRecord[fromEmail] : null;
      
      if ((masterRec || contactsRec) && !processedInboxEmails.has(fromEmail)) {
        const isOooSubject = subject.includes('out of office') || subject.includes('ooo') || subject.includes('automated response') || 
                             subject.includes('távollét') || subject.includes('szabadság') || subject.includes('házon kívül') || 
                             subject.includes('auto:') || subject.includes('autopulse') || subject.includes('autofeedback') || 
                             subject.includes('automatikus válasz') || subject.includes('replied');
        
        const autoSubmittedHeader = headers.find(h => h.name.toLowerCase() === 'auto-submitted');
        const isAutoReplied = autoSubmittedHeader && autoSubmittedHeader.value.toLowerCase().includes('auto-replied');
        
        if (isOooSubject || isAutoReplied) {
          processedInboxEmails.add(fromEmail);
          let hasOooMatch = false;

          if (masterRec) {
            console.log(`  ✉ OOO észlelve (Master CRM): ${fromEmail} (${masterRec['Cégnév']})`);
            hasOooMatch = true;
            spawnSync('gws', [
              'sheets', 'spreadsheets', 'values', 'update',
              '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdMaster, range: `Master_Vevőlista!N${masterRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
              '--json', `"${JSON.stringify({ values: [["Távollét / Elérhető később"]] }).replace(/"/g, '\\"')}"`
            ], { encoding: 'utf-8', shell: true });
          }

          if (contactsRec) {
            console.log(`  ✉ OOO észlelve (Contacts): ${fromEmail} (${contactsRec.company})`);
            hasOooMatch = true;
            spawnSync('gws', [
              'sheets', 'spreadsheets', 'values', 'update',
              '--params', `"${JSON.stringify({ spreadsheetId: spreadsheetIdContacts, range: `CONTACTS!L${contactsRec._rowNum}`, valueInputOption: 'USER_ENTERED' }).replace(/"/g, '\\"')}"`,
              '--json', `"${JSON.stringify({ values: [["Távollét / Elérhető később"]] }).replace(/"/g, '\\"')}"`
            ], { encoding: 'utf-8', shell: true });
          }

          if (hasOooMatch) {
            oooCount++;
            if (pairedSentEmails.has(fromEmail)) {
              sentCount = Math.max(0, sentCount - 1);
            }
          }
        }
      }
    } catch (e) {
      // Hiba
    }
  }

  console.log(`\n========================================================================`);
  console.log(`🎉 POSTALÁDA SZINKRONIZÁLÁS STATISZTIKA:`);
  console.log(`- Sikeresen "Kiküldve" státuszú lett: ${sentCount} db`);
  console.log(`- Visszadobódott (Visszadobva / Hibás email): ${bounceCount} db`);
  console.log(`- Automatikus választ küldött (Távollét / Elérhető később): ${oooCount} db`);
  console.log(`========================================================================`);
}

main();
