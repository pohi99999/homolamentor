/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';

async function main() {
  console.log('====== AFRIKA PROJEKT-FINANSZÍROZÁSI PISZKOZATOK KÉSZÍTÉSE ======\n');
  
  console.log('1. CRM adatok beolvasása a Google Sheets "Afrika_Projekt_Finanszirozas" füléről...');
  let crmData;
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Afrika_Projekt_Finanszirozas!A1:L50"`, { encoding: 'utf-8' });
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
  const records = rows.slice(1).map((row, idx) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = row[index] ? row[index].trim() : '';
    });
    record._rowNum = idx + 2;
    return record;
  });

  console.log(`✓ CRM beolvasva, ${records.length} sor észlelve.`);

  const targetsToProcess = records.filter(r => r.Statusz === 'Azonosítva / Kutatás alatt');
  console.log(`✓ Feldolgozandó tőkealapok/bankok száma: ${targetsToProcess.length} db\n`);

  if (targetsToProcess.length === 0) {
    console.log('ℹ Nincs feldolgozásra váró sor.');
    return;
  }

  let createdCount = 0;
  const rowNumsToUpdate = [];

  for (const target of targetsToProcess) {
    const rowNum = target._rowNum;
    const name = target.Nev || 'Tisztelt Hölgyem/Uram';
    const fund = target['Alap/Bank'] || 'Alap / Bank';
    const email = target.Email;
    const country = target.Orszag || 'International';

    if (!email) {
      console.warn(`⚠ Sorszám #${rowNum} hiányzó e-mail cím, kihagyva.`);
      continue;
    }

    const isHungarian = country.toLowerCase() === 'magyarország' || country.toLowerCase() === 'hungary';
    let subject = '';
    let body = '';

    if (isHungarian) {
      subject = `Nyugat-afrikai off-market projektfinanszírozási és társbefektetési lehetőségek (Abidjan) – HOMLAMENTOR KFT`;
      body = `Tisztelt ${name}!\n\n` +
        `Azért keresem meg Önt mint a(z) ${fund} képviselőjét, mert intézményük kiemelt szerepet játszik az infrastrukturális és energetikai beruházások finanszírozásában, és szeretnénk a figyelmükbe ajánlani egy kiemelkedő, off-market projektfinanszírozási deal-flow-t Nyugat-Afrikában, elefántcsontparti (Abidjan) központtal.\n\n` +
        `A HOMLAMENTOR KFT jól megalapozott helyi operációval, kormányzati és magánszektorbeli kapcsolatrendszerrel rendelkezik az ECOWAS régióban (Nyugat-afrikai Államok Gazdasági Közössége). Jelenleg strukturált projektfinanszírozási és társbefektetői partnereket keresünk tőkebevonás céljából a következő kiemelt szektorokban:\n\n` +
        `* Zöldenergia: 50+ MW kapacitású naperőmű fejlesztések és megvalósítások állami áramátvételi (PPA) garanciákkal.\n` +
        `* Hálózatépítés és Távközlés: Elektromos hálózatok kiépítése és távközlési adótorony-infrastruktúra (towerco modellek, hosszú távú MLA bérleti szerződésekkel).\n` +
        `* Építőipar és Agrár-infrastruktúra: Lakossági és ipari építőipari beruházások, valamint modern mezőgazdasági takarmányelőállító üzemek létesítése Elefántcsontparton (SELAB ökoszisztéma).\n\n` +
        `Miért jelent kiemelkedő lehetőséget a HOMLAMENTOR KFT-vel való együttműködés?\n` +
        `* Állami és regionális garanciák: A kiemelt infrastrukturális projektek kormányzati elkötelezettséggel és multilaterális garanciavállalásokkal támogatottak, ami jelentősen csökkenti a befektetési kockázatot.\n` +
        `* ECOWAS szabadkereskedelmi előnyök: Az Abidjan-i operáció közvetlen hozzáférést biztosít az ECOWAS szabadkereskedelmi övezethez, amely jelentős vám- és adómentességeket (tax holidays), valamint kedvező profit-hazatelepítési szabályozást biztosít a külföldi befektetők számára.\n` +
        `* Kiemelkedő, kockázattal arányos megtérülés (IRR): A régió fejlődési dinamikája és a helyi piaci igények miatt a projektek az európai vagy észak-amerikai infrastruktúra-befektetésekhez képest lényegesen magasabb hozamot ígérnek.\n\n` +
        `Szeretnénk egy 15-20 perces online bemutató beszélgetés keretében ismertetni az aktuális deal-flow részleteit, a projektek pénzügyi modellezését és a strukturálási lehetőségeket (szenior adósság, mezzanine vagy equity szinten).\n\n` +
        `Kérjük, jelezze, ha nyitott egy rövid egyeztetésre a következő hetek folyamán.\n\n` +
        `Üdvözlettel,\n\n` +
        `Homola László\nÜgyvezető Menedzser & Tulajdonos\nHOMLAMENTOR KFT\nhomlamentor@gmail.com\n+36 70 633 270 | https://homolamentor.vercel.app`;
    } else {
      subject = `West African Off-Market Project Finance and Co-Investment Opportunities (Abidjan) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am reaching out to you as a representative of ${fund} because of your institution’s prominent role in infrastructure and energy finance. We would like to present a high-yielding, off-market project finance and co-investment deal flow in West Africa, managed via our operational hub in Abidjan, Ivory Coast.\n\n` +
        `HOMLAMENTOR KFT has established a strong local presence, backed by extensive public and private sector relations within the ECOWAS region (Economic Community of West African States). We are currently looking for structured finance partners, Private Equity funds, and development banks for capital raising and joint venture opportunities in the following core sectors:\n\n` +
        `* Green Energy: Development and construction of 50+ MW utility-scale solar PV plants backed by sovereign off-take guarantees (PPA).\n` +
        `* Grid Development & Telecom: Power grid expansion projects and telecommunication tower infrastructure (towerco models with long-term Master Lease Agreements).\n` +
        `* Construction & Agro-processing: Large-scale civil construction and state-of-the-art agricultural feed production facilities in Ivory Coast (SELAB ecosystem).\n\n` +
        `Key investment highlights:\n` +
        `* Sovereign & Regional Guarantees: Our major infrastructure projects are backed by government commitments and multilateral risk-mitigation guarantees, substantially lowering the overall risk profile.\n` +
        `* ECOWAS Free Trade & Tax Incentives: Our operations in Abidjan leverage the benefits of the ECOWAS free trade area, offering corporate tax holidays, customs duties exemptions, and flexible profit repatriation schemes.\n` +
        `* Superior Risk-Adjusted Returns (IRR): Due to the high growth velocity of the region and massive demand, these projects yield significantly higher returns compared to typical European or North American infrastructure assets.\n\n` +
        `We would be pleased to schedule a brief, 15-20 minute introductory call to share the pipeline details, financial models, and discuss capital structuring options (Senior Debt, Mezzanine, or Equity).\n\n` +
        `Please let us know your availability for a call in the coming weeks.\n\n` +
        `Best regards,\n\n` +
        `Laszlo Homola\nManaging Director & Owner\nHOMLAMENTOR KFT\nhomlamentor@gmail.com\n+36 70 633 270 | https://homolamentor.vercel.app`;
    }

    console.log(`[Draft #${createdCount + 1}] Készítés: ${fund} (${email}) | Nyelv: ${isHungarian ? 'HU' : 'EN'}`);

    const res = spawnSync('gws', [
      'gmail', '+send',
      '--to', `"${email}"`,
      '--subject', `"${subject}"`,
      '--body', `"${body.replace(/"/g, '\\"')}"`,
      '--from', '"HOMLAMENTOR <homlamentor@gmail.com>"',
      '--draft'
    ], { encoding: 'utf-8', shell: true });

    if (res.status === 0) {
      console.log(`  ✓ Gmail piszkozat sikeresen létrejött a fiókban.`);
      createdCount++;
      rowNumsToUpdate.push(rowNum);
    } else {
      console.error(`  ❌ Hiba a piszkozat létrehozásakor:`, res.stderr || res.stdout);
    }
  }

  // Google Sheets Frissítés
  if (rowNumsToUpdate.length > 0) {
    console.log(`\nMaster CRM státuszok frissítése...`);
    for (const rNum of rowNumsToUpdate) {
      const updateParams = JSON.stringify({
        spreadsheetId: spreadsheetIdMaster,
        range: `Afrika_Projekt_Finanszirozas!H${rNum}`,
        valueInputOption: "USER_ENTERED"
      });
      const updateJson = JSON.stringify({
        values: [["Piszkozat bekészítve"]]
      });

      spawnSync('gws', [
        'sheets', 'spreadsheets', 'values', 'update',
        '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
        '--json', `"${updateJson.replace(/"/g, '\\"')}"`
      ], { encoding: 'utf-8', shell: true });
    }
    console.log(`✓ ${rowNumsToUpdate.length} sor frissítve "Piszkozat bekészítve" státuszra.`);
  }

  console.log('\n========================================================================');
  console.log(`🎉 AFRIKAI PROJEKT-FINANSZÍROZÁSI PISZKOZATOK LÉTREHOZÁSA SIKERES!`);
  console.log(`Összesen ${createdCount} új piszkozat létrejött a Gmailedben.`);
  console.log('========================================================================');
}

main();
