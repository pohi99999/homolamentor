/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, spawnSync } = require('child_process');
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

// 2. Kontaktlista beolvasása az e-mail címekhez és kapcsolattartókhoz (mindkét útvonalat ellenőrizzük)
console.log('\n2. Helyi kontaktlista cross-reference elemzése...');
const path1 = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '1.Keszthely telek', '03_Vevo_jeloltek', 'kontaktlista.md');
const path2 = path.join('Z:', '001_Workspace', 'Ingatlan, iparterület értékesítések', '_ÖSSZES', '03_Vevo_jeloltek', 'kontaktlista.md');

let kontaktlistaPath = '';
if (fs.existsSync(path1)) {
  kontaktlistaPath = path1;
} else if (fs.existsSync(path2)) {
  kontaktlistaPath = path2;
}

let contacts = {};

if (kontaktlistaPath) {
  console.log(`✓ Kontaktlista megtalálva itt: ${kontaktlistaPath}`);
  const content = fs.readFileSync(kontaktlistaPath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('|') && !line.includes('Priority Score') && !line.includes('---|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 8) {
        const companyName = parts[2].replace(/\*\*/g, '').split('(')[0].trim();
        const contactInfo = parts[6];
        
        let name = '';
        let email = '';
        let position = parts[3];
        
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
  console.log(`✓ Elemzés sikeres. ${Object.keys(contacts).length} cég kapcsolattartói adatai beolvasva.`);
} else {
  console.warn('⚠ A helyi kontaktlista.md egyik megadott útvonalon sem található.');
}

// 3. Kampányüzenetek és lokalizációs sablonok meghatározása
const today = new Date().toISOString().split('T')[0];
const batchLimit = 10; // Batch limit felemelve 10-re
let processedCount = 0;

console.log('\n3. Piszkozatok generálása és CRM frissítése...');

for (const record of crmRecords) {
  if (processedCount >= batchLimit) {
    console.log(`\nReached batch limit of ${batchLimit} drafts for this run.`);
    break;
  }

  const rowNum = record._rowNum;
  // Csak a 2-22 sorokat dolgozzuk fel ebben a batch-ben (az összes érvényes kiemelt célpontot)
  if (rowNum < 2 || rowNum > 22) {
    continue;
  }

  // Ugrás ha a státusz már "Piszkozat bekészítve"
  if (record['Aktuális_Státusz'] === 'Piszkozat bekészítve') {
    continue;
  }

  const company = record['Cégnév'];
  if (!company) {
    continue;
  }

  // Cross-reference a kapcsolattartó adatokhoz
  let contact = contacts[company.toLowerCase()];
  if (!contact) {
    const key = Object.keys(contacts).find(k => company.toLowerCase().includes(k) || k.includes(company.toLowerCase()));
    if (key) contact = contacts[key];
  }

  // Adatok kinyerése és gazdagítása
  const name = contact ? contact.name : (record['Kapcsolattartó_Neve'] || '');
  const email = contact ? contact.email : record['Email'];
  const position = contact ? contact.position : (record['Kapcsolattartó_Pozíció'] || '');
  const category = record['Kategória'] || '';
  const country = record['CEE_Aktivitás'] || '';

  // Szigorú adatintegritási validációk
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.log(`- Kihagyva: ${company} (Érvénytelen vagy hiányzó e-mail: "${email}")`);
    continue;
  }

  if (!name || name === 'Kapcsolattartó' || name.trim() === '') {
    console.log(`- Kihagyva: ${company} (Hiányzó döntéshozó név)`);
    continue;
  }

  // Pitch típus meghatározása
  let pitchType = 'industrial';
  if (category.includes('Private Equity') || category.includes('alap') || category.includes('Alap') || ['WING Zrt.', 'Adventum Group', 'Biggeorge Property', 'Diófa Alapkezelő', 'Erste Real Estate Fund'].some(c => company.includes(c))) {
    pitchType = 'investment';
  } else if (category.includes('Kivitelező') || category.includes('Építő') || company.includes('Market')) {
    pitchType = 'construction';
  }

  // Nyelvi lokalizáció ország/cég/e-mail végződés alapján
  let lang = 'en';
  const huCompanies = ['WING', 'HelloParks', 'Biggeorge', 'Diófa', 'Erste', 'OTP', 'Market', 'Infogroup', 'Indotek', 'Bonafarm', 'ALTEO'];
  
  if (country.includes('Német') || country.includes('Ausztria') || email.endsWith('.de') || email.endsWith('.at')) {
    lang = 'de';
  } else if (huCompanies.some(c => company.includes(c)) || country.includes('Magyar') || email.endsWith('.hu')) {
    lang = 'hu';
  }

  let subject = '';
  let body = '';

  // E-mail sablonok felépítése a n8n/templates/b2b_outreach_email.md alapján
  if (lang === 'hu') {
    if (pitchType === 'industrial') {
      subject = `Afrikai piacnyitás és megbízások felkutatása a(z) ${company} részére – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `Azért fordulok Önhöz, mert a(z) ${company} tevékenysége a(z) ${category || 'ipari'} szektorban kiemelkedő, és úgy látjuk, hogy az Önök technológiája és szakértelme hatalmas versenyelőnyt jelenthetne a dinamikusan fejlődő nyugat-afrikai piacokon.\n\n` +
             `A HOMLAMENTOR KFT (európai és Elefántcsontpart - Abidjan központtal) kifejezetten arra szakosodott, hogy európai ipari, építőipari, energetikai és mezőgazdasági vállalatok számára kutasson fel közvetlen kormányzati és magánszektorbeli megbízásokat Nyugat-Afrikában, valamint támogassa a helyi jelenlét és telephely kiépítését.\n\n` +
             `Miért érdemes most lépni az Abidjan-i operatív és logisztikai központunk segítségével?\n` +
             `* Helyszíni jelenlét előnyei: Teljes körű jogi, adminisztratív és partnerkapcsolati támogatást biztosítunk közvetlenül a helyszínen.\n` +
             `* 100% profit a szállítási költségeken: A helyi összeszereléssel és gyártással kiküszöbölhetőek a magas tengerentúli szállítási díjak és importvámok, így a megtakarítás közvetlen profitként realizálódik.\n` +
             `* Kiemelkedő adókedvezmények: Az afrikai piacnyitási és beruházás-ösztönző programok keretében jelentős adómentességek érhetők el az első években.\n` +
             `* 50%-os bérköltség: A rendkívül versenyképes helyi munkaerő alkalmazásával a bérköltségek az európai szint töredékére (akár 50%-ára) csökkenthetők.\n\n` +
             `Szeretnénk felajánlani egy rövid, 15 perces online konzultációt, ahol bemutatjuk a jelenleg elérhető konkrét afrikai projektlehetőségeket és megbízásokat a(z) ${category || 'ipari'} területén.\n\n` +
             `Melyik nap lenne alkalmas Önnek a hét folyamán egy rövid egyeztetésre?\n\n` +
             `Üdvözlettel,\n\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else if (pitchType === 'investment') {
      subject = `Zárt off-market prémium ingatlanportfólió ajánlat – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `A HOMLAMENTOR KFT zárt körben értékesíti prémium, off-market ingatlanportfólióját, melyek kiváló yield és fejlesztési potenciállal bírnak az osztrák határ és a Balaton térségében:\n` +
             `* Nagycenk Healthcare & Senior Living: 1.7 ha fejlesztési terület, 75% kész, 9.000.000 EUR vételár.\n` +
             `* Balatongyörök Golf Course Projekt: 80 ha, 18-lyukú golfpálya engedélyezett hotellel, 28.000.000 EUR (100% Share Deal).\n` +
             `* Szentendre Pap-sziget Termál Resort wellness létesítmény.\n\n` +
             `Kérésre NDA ellenében részletes teasert küldünk.\n\n` +
             `Üdvözlettel,\n\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else {
      subject = `Moduláris konténeres mobilház gyártási és finanszírozási partnerség – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
             `A HOMLAMENTOR KFT gyártó és finanszírozó partnereket keres nyugat-afrikai (Elefántcsontpart) és zambiai projektjeihez, ahol intelligens, konténerben szállítható mobilházakat (30, 50, 80-100 m² önellátó napelemes rendszerekkel) értékesítünk és építünk bemutató területeinken:\n` +
             `* Elefántcsontpart: 15 000 darabos becsült piaci igény.\n` +
             `* Zambia (Lusaka központtal): Komplett konténerfalvak építése kiszolgáló konténerboltokkal, kórházakkal.\n\n` +
             `Keressük az együttműködési lehetőségeket a gyártásban vagy a mintaházak finanszírozásában.\n\n` +
             `Üdvözlettel,\n\nHomola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    }
  } else if (lang === 'de') {
    if (pitchType === 'industrial') {
      subject = `Afrikanische Marktexpansion und Projektaquisition für ${company} – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
             `ich wende mich an Sie, da die Aktivitäten von ${company} im Sektor ${category || 'Industrie'} äußerst vielversprechend sind. Wir sind davon überzeugt, dass Ihre Technologie und Expertise auf den dynamisch wachsenden Märkten Westafrikas einen erheblichen Wettbewerbsvorteil darstellen würden.\n\n` +
             `Die HOMLAMENTOR KFT (mit Hauptsitz in Europa und Elfenbeinküste - Abidjan) ist darauf spezialisiert, für europäische Unternehmen aus den Bereichen Industrie, Bauwesen, Energie und Landwirtschaft direkte Aufträge im öffentlichen und privaten Sektor Westafrikas zu akquirieren und den Aufbau lokaler Betriebsstandorte zu begleiten.\n\n` +
             `Warum lohnt sich die Expansion jetzt mit Unterstützung unseres Logistik- und Betriebszentrums in Abidjan?\n` +
             `* Vorteile der lokalen Präsenz: Wir bieten Ihnen umfassende rechtliche, administrative und partnerbezogene Unterstützung direkt vor Ort.\n` +
             `* 100% Profit bei den Transportkosten: Durch lokale Montage und Produktion entfallen hohe Übersee-Frachtkosten und Importzölle – diese Einsparungen fließen direkt in Ihren Gewinn.\n` +
             `* Attraktive Steuervergünstigungen: Nutzen Sie erhebliche Körperschaftssteuerbefreiungen und Investitionsanreize, die von den lokalen Regierungen für ausländische Investitionen bereitgestellt werden.\n` +
             `* 50% geringere Lohnkosten: Durch den Einsatz äußerst wettbewerbsfähiger lokaler Arbeitskräfte können Ihre Personalkosten im Vergleich zum europäischen Niveau um bis zu 50% gesenkt werden.\n\n` +
             `Wir möchten Sie zu einer kurzen, 15-minütigen Online-Konsultation einladen, um Ihnen konkrete Projektmöglichkeiten und Ausschreibungen vorzustellen, die derzeit in Westafrika im Bereich ${category || 'Industrie'} verfügbar sind.\n\n` +
             `Hätten Sie diese Woche Zeit für ein kurzes Gespräch?\n\n` +
             `Mit freundlichen Grüßen\n\nLaszlo Homola\nGeschäftsführer & Inhaber\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else if (pitchType === 'investment') {
      subject = `Exklusives Angebot: Off-Market Premium CEE Immobilienportfolio – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
             `ich wende mich an Sie, da die HOMLAMENTOR KFT ein exklusives Off-Market-Portfolio an Premium-Immobilien mit hohem Rendite- und Entwicklungspotenzial nahe der österreichischen Grenze und am Plattensee zum Verkauf anbietet:\n` +
             `* Nagycenk Healthcare & Senior Living: 1,7 ha Entwicklungsfläche, zu 75 % fertiggestellt, Kaufpreis 9.000.000 EUR.\n` +
             `* Balatongyörök Golf Course Projekt: 80 ha, genehmigter 18-Loch-Golfplatz mit Hotel, 28.000.000 EUR (100% Share Deal).\n` +
             `* Szentendre Pap-Sziget Thermalkurort: Premium-Thermalwellness-Anlage.\n\n` +
             `Gegen Unterzeichnung einer Vertraulichkeitsvereinbarung (NDA) senden wir Ihnen gerne ein detailliertes Investment-Teaser zu.\n\n` +
             `Mit freundlichen Grüßen\n\nLaszlo Homola\nGeschäftsführer & Inhaber\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else {
      subject = `Partnerschaft für modulare Container-Mobilhäuser – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
             `die HOMLAMENTOR KFT sucht Produktions- und Finanzierungspartner für ihre Projekte in Westafrika (Elfenbeinküste) und Sambia, bei denen wir intelligente, in Containern transportierbare Mobilhäuser (Größen von 30, 50 und 80-100 m² mit autarken Solarsystemen) auf unseren Musterflächen errichten und vertreiben:\n` +
             `* Elfenbeinküste: Geschätzter Marktbedarf von 15.000 Einheiten.\n` +
             `* Sambia (Zentrum Lusaka): Bau kompletter Containerdörfer mit Kliniken, Schulen und Geschäften.\n\n` +
             `Wir bieten etablierte Vertriebskanäle, Montage-Hubs und Grundstücke und suchen nach einer Kooperation in der Produktion oder bei der Finanzierung von Musterhäusern.\n\n` +
             `Mit freundlichen Grüßen\n\nLaszlo Homola\nGeschäftsführer & Inhaber\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    }
  } else {
    // Angol verzió
    if (pitchType === 'industrial') {
      subject = `African market expansion and project acquisition for ${company} – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `I am reaching out because of ${company}'s outstanding position in the ${category || 'industrial'} sector. We believe your technology and expertise would represent a massive competitive advantage in the rapidly growing markets of West Africa.\n\n` +
             `HOMLAMENTOR KFT (headquartered in Europe and Ivory Coast - Abidjan) specializes in acquiring direct public and private sector projects in West Africa for European industrial, construction, energy, and agricultural enterprises, as well as establishing local operational facilities.\n\n` +
             `Why expand now with the support of our Abidjan logistics and operational hub?\n` +
             `* Advantages of Local Presence: We provide complete legal, administrative, and B2B matchmaking support directly on the ground.\n` +
             `* 100% Profit on Shipping Costs: By utilizing local assembly and production, you eliminate expensive overseas shipping fees and import duties, converting these savings directly into profit.\n` +
             `* Attractive Tax Incentives: Avail of significant corporate tax exemptions and investment incentives offered by local governments for foreign enterprises.\n` +
             `* 50% Lower Labor Costs: By employing highly competitive local talent, your labor expenses can be reduced by up to 50% compared to European baselines.\n\n` +
             `We would like to invite you to a brief, 15-minute online consultation to present concrete project opportunities and tenders currently available in West Africa within the ${category || 'industrial'} field.\n\n` +
             `Would you have availability for a brief call sometime this week?\n\n` +
             `Best regards,\n\nLaszlo Homola\nManaging Director & Owner\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else if (pitchType === 'investment') {
      subject = `Exclusive Off-Market CEE Property Portfolio – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `HOMLAMENTOR KFT offers an exclusive, off-market portfolio of premium assets with high-yield potential near the Austrian border and Lake Balaton:\n` +
             `* Nagycenk Healthcare & Senior Living: 1.7 ha land, 75% completed, €9M.\n` +
             `* Balatongyörök Golf Course & Resort: 80 ha, approved hotel and 18-hole golf course, €28M.\n` +
             `* Keszthely SPV Vt-8 residential land.\n\n` +
             `Upon signing an NDA, we can provide the full investment teasers.\n\n` +
             `Best regards,\n\nLaszlo Homola\nManaging Director & Owner\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    } else {
      subject = `Modular Container Mobile Houses Manufacturing & Financing Partnership – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
             `HOMLAMENTOR KFT is seeking manufacturing and financing partners for containerized modular mobile houses (30, 50, 80-100 sqm off-grid solar layouts) to supply our projects in Ivory Coast and Zambia:\n` +
             `* Ivory Coast: Targeted distribution of 15,000 units.\n` +
             `* Zambia (Lusaka hub): Development of modular villages (container clinics, schools, offices).\n\n` +
             `We provide distribution channels, assembly hubs, and land. We are looking for manufacturing syndications or initial financing for demo houses.\n\n` +
             `Best regards,\n\nLaszlo Homola\nManaging Director & Owner\nHOMLAMENTOR KFT\noffice.homlamentor@gmail.com`;
    }
  }

  // 4. Gmail Draft létrehozása a gws CLI-vel (spawnSync segítségével shell escaping nélkül)
  console.log(`- Piszkozat készítése: ${company} (${name} <${email}>) | Típus: ${pitchType.toUpperCase()} | Nyelv: ${lang.toUpperCase()}`);
  
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
  console.log(`  CRM frissítése a(z) ${rowNum}. sorban...`);
  const updateParams = JSON.stringify({
    spreadsheetId: spreadsheetId,
    range: `Master_Vevőlista!N${rowNum}:O${rowNum}`,
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
    console.log(`  ✓ CRM frissítve: Sor ${rowNum} -> "Piszkozat bekészítve" (${today})`);
  } else {
    console.error(`  ❌ Hiba a Google Sheet frissítése közben:`, sheetResult.error ? sheetResult.error.message : (sheetResult.stderr || sheetResult.stdout));
  }

  processedCount++;
}

console.log(`\n========================================================================`);
console.log(`✓ KAMPÁNY FUTTATÁSA KÉSZ: ${processedCount} darab e-mail draft elmentve és CRM frissítve.`);
console.log(`========================================================================`);
