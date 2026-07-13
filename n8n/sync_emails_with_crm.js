/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, spawnSync } = require('child_process');

const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';

async function main() {
  console.log('1. CRM adatok beolvasása a Google Sheet-ből...');
  let crmData;
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetId} --range "Master_Vevőlista!A1:N50"`, { encoding: 'utf-8' });
    crmData = JSON.parse(output);
  } catch (err) {
    console.error('❌ Hiba a Google Sheet beolvasása közben:', err.message);
    process.exit(1);
  }

  const rows = crmData.values;
  if (!rows || rows.length < 2) {
    console.error('❌ Üres vagy érvénytelen táblázat adatok.');
    process.exit(1);
  }

  const header = rows[0];
  const crmRecords = rows.slice(1).map((row, idx) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = row[index] ? row[index].trim() : '';
    });
    record._rowNum = idx + 2;
    return record;
  });

  console.log(`✓ CRM beolvasva, összesen ${crmRecords.length} cég észlelve.`);

  // Gyűjtsük össze az összes érvényes e-mail címet a CRM-ből
  const crmEmails = [];
  const emailToRecord = {};
  
  crmRecords.forEach(rec => {
    const email = rec['Email'];
    if (email && email.includes('@')) {
      const cleanEmail = email.toLowerCase().trim();
      crmEmails.push(cleanEmail);
      emailToRecord[cleanEmail] = rec;
    }
  });

  // Helyi kontaktlistát is beolvassuk cross-reference-hez, ha a CRM-ben üres lenne
  console.log('\n2. Helyi kontaktlista beolvasása cross-reference-hez...');
  const fs = require('fs');
  const path = require('path');
  const path1 = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '1.Keszthely telek', '03_Vevo_jeloltek', 'kontaktlista.md');
  const path2 = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '_ÖSSZES', '03_Vevo_jeloltek', 'kontaktlista.md');

  let kontaktlistaPath = '';
  if (fs.existsSync(path1)) kontaktlistaPath = path1;
  else if (fs.existsSync(path2)) kontaktlistaPath = path2;

  if (kontaktlistaPath) {
    const content = fs.readFileSync(kontaktlistaPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.includes('|') && !line.includes('Priority Score') && !line.includes('---|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 8) {
          const companyName = parts[2].replace(/\*\*/g, '').split('(')[0].trim();
          const contactInfo = parts[6];
          const emailMatch = contactInfo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            const email = emailMatch[1].toLowerCase().trim();
            // Ha a CRM-ben nincs meg a cég e-mailje, de a kontaktlistában igen, rendeljük hozzá
            const matchingRec = crmRecords.find(r => r['Cégnév'] && r['Cégnév'].toLowerCase().includes(companyName.toLowerCase()));
            if (matchingRec && !matchingRec['Email']) {
              matchingRec['Email'] = email;
              crmEmails.push(email);
              emailToRecord[email] = matchingRec;
              console.log(`  ✓ E-mail hozzárendelve: ${companyName} -> ${email}`);
            }
          }
        }
      }
    });
  }

  if (crmEmails.length === 0) {
    console.log('⚠ Nem található e-mail cím a CRM-ben. Kilépés.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // 3. SENT mappában lévő elküldött levelek keresése
  console.log('\n3. Elküldött (SENT) levelek keresése és CRM szinkronizáció...');
  
  // Gmail query felépítése a legutóbbi elküldött levelekre
  const sentQuery = 'after:2026/07/11 is:sent';
  
  console.log(`Lekérdezés küldése a Gmail API-nak: "${sentQuery}"...`);
  
  let sentListOutput;
  try {
    const res = spawnSync('gws', [
      'gmail', 'users', 'messages', 'list',
      '--params', `"${JSON.stringify({ userId: 'me', q: sentQuery }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    sentListOutput = JSON.parse(res.stdout);
  } catch (err) {
    console.error('❌ Hiba a SENT levelek listázása közben:', err.message);
    sentListOutput = { messages: [] };
  }

  const sentMessages = sentListOutput.messages || [];
  console.log(`✓ Talált elküldött levelek száma: ${sentMessages.length}`);

  const processedSentEmails = new Set();

  for (const msg of sentMessages) {
    // Részletek lekérése
    const detailRes = spawnSync('gws', [
      'gmail', 'users', 'messages', 'get',
      '--params', `"${JSON.stringify({ userId: 'me', id: msg.id }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    
    if (detailRes.status !== 0) {
      console.error(`  ❌ Hiba a(z) ${msg.id} levél részleteinek lekérése közben:`, detailRes.stderr || detailRes.stdout);
      continue;
    }
    
    try {
      const msgDetail = JSON.parse(detailRes.stdout);
      const headers = msgDetail.payload.headers || [];
      const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
      if (toHeader) {
        // Címzett kinyerése
        const toEmailMatch = toHeader.value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (toEmailMatch) {
          const recipientEmail = toEmailMatch[1].toLowerCase().trim();
          if (emailToRecord[recipientEmail] && !processedSentEmails.has(recipientEmail)) {
            const record = emailToRecord[recipientEmail];
            
            console.log(`  ✓ Találat: Levelet küldtünk a következő címre: ${recipientEmail} (${record['Cégnév']})`);
            
            // CRM frissítése "Kiküldve" státuszra
            console.log(`  CRM frissítése a(z) ${record._rowNum}. sorban...`);
            const updateParams = JSON.stringify({
              spreadsheetId: spreadsheetId,
              range: `Master_Vevőlista!L${record._rowNum}:N${record._rowNum}`, // L: Első_Kapcsolatfelvétel_Dátuma, N: Aktuális_Státusz
              valueInputOption: 'USER_ENTERED'
            });
            const updateJson = JSON.stringify({
              values: [[today, "", "Kiküldve"]]
            });
            
            const sheetResult = spawnSync('gws', [
              'sheets', 'spreadsheets', 'values', 'update',
              '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
              '--json', `"${updateJson.replace(/"/g, '\\"')}"`
            ], { encoding: 'utf-8', shell: true });

            if (sheetResult.status === 0) {
              console.log(`    ✓ CRM frissítve: Sor ${record._rowNum} -> "Kiküldve" (${today})`);
            } else {
              console.error(`    ❌ Hiba a Google Sheet frissítése közben:`, sheetResult.stderr || sheetResult.stdout);
            }
            
            processedSentEmails.add(recipientEmail);
          }
        }
      }
    } catch (e) {
      // Hiba a JSON parszolásakor
    }
  }

  // 4. Bounce levelek auditálása az INBOX-ból
  console.log('\n4. Bounce és visszadobott levelek auditálása az INBOX-ból...');
  const bounceQuery = 'from:mailer-daemon OR subject:(undelivered OR failure OR failed OR notice)';
  
  let bounceListOutput;
  try {
    const res = spawnSync('gws', [
      'gmail', 'users', 'messages', 'list',
      '--params', `"${JSON.stringify({ userId: 'me', q: bounceQuery }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    bounceListOutput = JSON.parse(res.stdout);
  } catch (err) {
    console.error('❌ Hiba a bounce levelek listázása közben:', err.message);
    bounceListOutput = { messages: [] };
  }

  const bounceMessages = bounceListOutput.messages || [];
  console.log(`✓ Talált bounce levelek száma a fiókban: ${bounceMessages.length}`);

  let bounceCount = 0;

  for (const msg of bounceMessages.slice(0, 15)) { // Csak a legfrissebb 15 bounce-t vizsgáljuk át a túlzott API hívások elkerülésére
    const detailRes = spawnSync('gws', [
      'gmail', 'users', 'messages', 'get',
      '--params', `"${JSON.stringify({ userId: 'me', id: msg.id }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });
    
    if (detailRes.status !== 0) continue;
    
    try {
      const msgDetail = JSON.parse(detailRes.stdout);
      const snippet = msgDetail.snippet || '';
      
      // Megkeressük, hogy a snippet tartalmaz-e a CRM e-mailjei közül bármelyiket
      for (const email of crmEmails) {
        if (snippet.toLowerCase().includes(email)) {
          const record = emailToRecord[email];
          console.log(`  ⚠ Bounce észlelve a következő címre: ${email} (${record['Cégnév']})`);
          
          // CRM frissítése "Visszadobva / Érvénytelen" státuszra
          console.log(`  CRM frissítése a(z) ${record._rowNum}. sorban...`);
          const updateParams = JSON.stringify({
            spreadsheetId: spreadsheetId,
            range: `Master_Vevőlista!N${record._rowNum}`,
            valueInputOption: 'USER_ENTERED'
          });
          const updateJson = JSON.stringify({
            values: [["Visszadobva / Érvénytelen"]]
          });
          
          const sheetResult = spawnSync('gws', [
            'sheets', 'spreadsheets', 'values', 'update',
            '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
            '--json', `"${updateJson.replace(/"/g, '\\"')}"`
          ], { encoding: 'utf-8', shell: true });

          if (sheetResult.status === 0) {
            console.log(`    ✓ CRM frissítve: Sor ${record._rowNum} -> "Visszadobva / Érvénytelen"`);
            bounceCount++;
          } else {
            console.error(`    ❌ Hiba a Google Sheet frissítése közben:`, sheetResult.stderr || sheetResult.stdout);
          }
        }
      }
    } catch (e) {
      // Hiba a JSON parszolásakor
    }
  }

  console.log(`\n========================================================================`);
  console.log(`✓ SZINKRONIZÁLÁS KÉSZ: ${processedSentEmails.size} elküldött e-mail szinkronizálva, ${bounceCount} bounce kezelve.`);
  console.log(`========================================================================`);
}

main();
