/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';

// 1. CRM adatok beolvasása a gws CLI-vel
console.log('1. Master CRM Google Sheet adatok beolvasása...');
let crmData;
try {
  const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetId} --range "Master_Vevőlista!A1:S50"`, { encoding: 'utf-8' });
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
  record._rowNum = idx + 2; // Google Sheets sor sorszám (1-indexed, +2 mert a fejléc az 1. sor)
  return record;
});

console.log(`✓ CRM beolvasva, összesen ${crmRecords.length} cég észlelve.`);

// 2. Kontaktlista beolvasása az e-mail címekhez és kapcsolattartókhoz
console.log('\n2. Helyi kontaktlista cross-reference elemzése...');
const kontaktlistaPath = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '1.Keszthely telek', '03_Vevo_jeloltek', 'kontaktlista.md');
let contacts = {};

if (fs.existsSync(kontaktlistaPath)) {
  const content = fs.readFileSync(kontaktlistaPath, 'utf-8');
  // Egyszerű regex a táblázat sorainak kinyerésére a markdownból
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('|') && !line.includes('Priority Score') && !line.includes('---|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 8) {
        const companyName = parts[2].replace(/\*\*/g, '').split('(')[0].trim();
        const contactInfo = parts[6]; // pl. **Gondi Ferenc** – Managing Director, Hungary (ferenc.gondi@ctp.eu, +36 30 111 6504)
        
        let name = '';
        let email = '';
        let position = parts[3]; // Kategória
        
        // Kapcsolattartó nevének és e-mailjének kinyerése
        const nameMatch = contactInfo.match(/\*\*(.*?)\*\*/);
        if (nameMatch) name = nameMatch[1];
        
        const emailMatch = contactInfo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) email = emailMatch[1];

        if (companyName) {
          contacts[companyName.toLowerCase()] = { name, email, position };
        }
      }
    }
  });
  console.log(`✓ Elemzés sikeres. ${Object.keys(contacts).length} cég kapcsolattartói adatai beolvasva a kontaktlistából.`);
} else {
  console.warn('⚠ A helyi kontaktlista.md nem található.');
}

// 3. Kampányüzenetek és lokalizációs sablonok meghatározása
const today = new Date().toISOString().split('T')[0];
const batchLimit = 5; // Egyszerre maximum 5 draftot készítünk az első körben a teszteléshez
let processedCount = 0;

console.log('\n3. Piszkozatok generálása és CRM frissítése...');

for (const record of crmRecords) {
  if (processedCount >= batchLimit) {
    console.log(`\nReached batch limit of ${batchLimit} drafts for this run.`);
    break;
  }

  const company = record['Cégnév'];
  if (!company || record['Aktuális_Státusz'] === 'Piszkozat bekészítve') {
    continue;
  }

  // Cross-reference a kapcsolattartó adatokhoz
  let contact = contacts[company.toLowerCase()];
  
  // Ha nem találtuk meg pontos egyezéssel, próbáljuk meg részleges egyezéssel
  if (!contact) {
    const key = Object.keys(contacts).find(k => company.toLowerCase().includes(k) || k.includes(company.toLowerCase()));
    if (key) contact = contacts[key];
  }

  // Alapértelmezett értékek ha nincs a listában
  const name = contact ? contact.name : (record['Kapcsolattartó_Neve'] || 'Kapcsolattartó');
  const email = contact ? contact.email : record['Email'];
  const position = contact ? contact.position : (record['Kapcsolattartó_Pozíció'] || 'Döntéshozó');
  const category = record['Kategória'] || '';

  if (!email) {
    console.log(`- Kihagyva: ${company} (Nincs e-mail cím megadva)`);
    continue;
  }

  // Pitch típus meghatározása
  let pitchType = 'industrial';
  if (category.includes('Private Equity') || category.includes('alap') || category.includes('Alap') || ['WING Zrt.', 'Adventum Group', 'Biggeorge Property', 'Diófa Alapkezelő', 'Erste Real Estate Fund'].some(c => company.includes(c))) {
    pitchType = 'investment';
  } else if (category.includes('Kivitelező') || category.includes('Építő') || company.includes('Market')) {
    pitchType = 'construction';
  }

  // Nyelvi lokalizáció ország/cég alapján
  let lang = 'en';
  const huCompanies = ['WING', 'HelloParks', 'Biggeorge', 'Diófa', 'Erste', 'OTP', 'Market', 'Infogroup', 'Indotek', 'Bonafarm', 'ALTEO'];
  if (huCompanies.some(c => company.includes(c)) || email.endsWith('.hu')) {
    lang = 'hu';
  }

  let subject = '';
  let body = '';

  // E-mail összeállítása típus és nyelv szerint
  if (lang === 'hu') {
    if (pitchType === 'industrial') {
      subject = `Nyugat-afrikai ipari terjeszkedés és logisztikai partnerség – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `Azért fordulok Önhöz, mert a(z) ${company} kiemelkedő szereplő az ipari és logisztikai szektorban. A HOMLAMENTOR KFT (európai és Elefántcsontpart - Abidjan központtal) Nyugat-Afrikában közvetlen ipari és logisztikai megbízásokat kutat fel partnerei részére.\n\n` +
             `Miért érdemes az Abidjan-i központunk segítségével piacot nyitni?\n` +
             `* 100% szállítási profit: Helyi összeszereléssel kiküszöbölhetőek a magas szállítási díjak.\n` +
             `* 50% bérköltség az európaihoz képest.\n` +
             `* Kiemelkedő adókedvezmények a beruházásokra.\n\n` +
             `Szeretnénk felajánlani egy 15 perces online konzultációt a konkrét lehetőségekről.\n\n` +
             `Üdvözlettel,\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT`;
    } else if (pitchType === 'investment') {
      subject = `Zárt off-market prémium ingatlanportfólió ajánlat – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `A HOMLAMENTOR KFT zárt körben értékesíti prémium, off-market ingatlanportfólióját, melyek kiváló yield és fejlesztési potenciállal bírnak az osztrák határ és a Balaton térségében:\n` +
             `* Nagycenk Healthcare & Senior Living: 1.7 ha fejlesztési terület, 75% kész, 9.000.000 EUR vételár.\n` +
             `* Balatongyörök Golf Course Projekt: 80 ha, 18-lyukú golfpálya engedélyezett hotellel, 28.000.000 EUR.\n` +
             `* Keszthely SPV lakópark fejlesztési telek Vt-8 övezetben.\n\n` +
             `Kérésre NDA ellenében részletes teasert küldünk.\n\n` +
             `Üdvözlettel,\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT`;
    } else {
      subject = `Moduláris konténeres mobilház gyártási és finanszírozási partnerség – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `A HOMLAMENTOR KFT gyártó és finanszírozó partnereket keres nyugat-afrikai (Elefántcsontpart) és zambiai projektjeihez, ahol intelligens, konténerben szállítható mobilházakat (30, 50, 80-100 m² önellátó napelemes rendszerekkel) értékesítünk és építünk bemutató területeinken:\n` +
             `* Elefántcsontpart: 15 000 darabos becsült piaci igény.\n` +
             `* Zambia (Lusaka központtal): Komplett konténerfalvak építése kiszolgáló konténerboltokkal, kórházakkal.\n\n` +
             `Keressük az együttműködési lehetőségeket a gyártásban vagy a mintaházak finanszírozásában.\n\n` +
             `Üdvözlettel,\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT`;
    }
  } else {
    // Angol verzió nemzetközi partnereknek
    if (pitchType === 'industrial') {
      subject = `West-African Industrial Expansion & Logistics Partnership – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `I am reaching out regarding potential industrial and logistics opportunities in West Africa. HOMLAMENTOR KFT (with hubs in Europe and Ivory Coast - Abidjan) specializes in sourcing local governmental and private industrial mandates.\n\n` +
             `Key strategic advantages of our Abidjan hub:\n` +
             `* 100% transport-to-profit conversion via local assembly.\n` +
             `* Up to 50% labor cost savings compared to European levels.\n` +
             `* Major corporate tax exemptions.\n\n` +
             `We would like to invite you to a short introductory call to discuss these regional opportunities.\n\n` +
             `Best regards,\nLászló Homola\nManaging Director & Owner\nHOMLAMENTOR KFT`;
    } else if (pitchType === 'investment') {
      subject = `Exclusive Off-Market CEE Property Portfolio – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `HOMLAMENTOR KFT offers an exclusive, off-market portfolio of premium assets with high-yield potential near the Austrian border and Lake Balaton:\n` +
             `* Nagycenk Healthcare & Senior Living: 1.7 ha land, 75% completed, €9M.\n` +
             `* Balatongyörök Golf Course & Resort: 80 ha, approved hotel and 18-hole golf course, €28M.\n` +
             `* Keszthely SPV residential plot Vt-8 zoning.\n\n` +
             `Upon signing an NDA, we can provide the full investment teasers.\n\n` +
             `Best regards,\nLászló Homola\nManaging Director & Owner\nHOMLAMENTOR KFT`;
    } else {
      subject = `Modular Container Mobile Houses Manufacturing & Financing Partnership – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `HOMLAMENTOR KFT is seeking manufacturing and financing partners for containerized modular mobile houses (30, 50, 80-100 sqm off-grid solar layouts) to supply our projects in Ivory Coast and Zambia:\n` +
             `* Ivory Coast: Targeted distribution of 15,000 units.\n` +
             `* Zambia (Lusaka hub): Development of modular villages (container clinics, schools, offices).\n\n` +
             `We provide distribution channels, assembly hubs, and land. We are looking for manufacturing syndications or initial financing for demo houses.\n\n` +
             `Best regards,\nLászló Homola\nManaging Director & Owner\nHOMLAMENTOR KFT`;
    }
  }

  // 4. Gmail Draft létrehozása a gws CLI-vel (spawnSync segítségével shell escaping nélkül)
  console.log(`- Piszkozat készítése: ${company} (${name} <${email}>) | Típus: ${pitchType.toUpperCase()} | Nyelv: ${lang.toUpperCase()}`);
  
  const { spawnSync } = require('child_process');
  const gmailResult = spawnSync('gws', [
    'gmail', '+send',
    '--to', `"${email}"`,
    '--subject', `"${subject}"`,
    '--body', `"${body.replace(/"/g, '\\"')}"`,
    '--from', '"HOMLAMENTOR <onboarding@resend.dev>"',
    '--draft'
  ], { encoding: 'utf-8', shell: true });

  if (gmailResult.status === 0) {
    console.log(`  ✓ Gmail Draft sikeresen létrehozva.`);
  } else {
    console.error(`  ❌ Hiba a draft létrehozása közben:`, gmailResult.error ? gmailResult.error.message : (gmailResult.stderr || gmailResult.stdout));
    continue;
  }

  // 5. Google Sheet CRM frissítése (spawnSync segítségével shell escaping nélkül)
  console.log(`  CRM frissítése a(z) ${record._rowNum}. sorban...`);
  const updateParams = JSON.stringify({
    spreadsheetId: spreadsheetId,
    range: `Master_Vevőlista!N${record._rowNum}:O${record._rowNum}`,
    valueInputOption: 'USER_ENTERED'
  });
  const updateJson = JSON.stringify({
    values: [["Piszkozat bekészítve", today]]
  });

  const sheetResult = spawnSync('gws', [
    'sheets', 'spreadsheets', 'values', 'update',
    '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
    '--json', `"${updateJson.replace(/"/g, '\\"')}"`
  ], { encoding: 'utf-8', shell: true });

  if (sheetResult.status === 0) {
    console.log(`  ✓ CRM frissítve: Sor ${record._rowNum} -> "Piszkozat bekészítve" (${today})`);
  } else {
    console.error(`  ❌ Hiba a Google Sheet frissítése közben:`, sheetResult.error ? sheetResult.error.message : (sheetResult.stderr || sheetResult.stdout));
  }

  processedCount++;
}

console.log(`\n========================================================================`);
console.log(`✓ KAMPÁNY FUTTATÁSA KÉSZ: ${processedCount} darab e-mail draft elmentve és CRM frissítve.`);
console.log(`========================================================================`);
