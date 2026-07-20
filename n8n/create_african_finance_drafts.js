/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';

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

function buildRawMimeMessage({ to, subject, body }) {
  const mime = [
    `From: Homola László <peterpohankapersonal@gmail.com>`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body
  ].join('\r\n');
  
  return Buffer.from(mime).toString('base64url');
}

async function main() {
  console.log('====== AFRIKA PROJEKT-FINANSZÍROZÁSI PISZKOZATOK KÉSZÍTÉSE (Javított) ======\n');
  
  // 1. Meglévő piszkozatok törlése a tiszta kezdéshez
  console.log('1. Meglévő Gmail piszkozatok ellenőrzése és törlése...');
  try {
    const listRaw = runGws(['gmail', 'users', 'drafts', 'list', '--params', JSON.stringify({ userId: 'me' })]);
    const listData = JSON.parse(listRaw);
    const existingDrafts = listData.drafts || [];
    if (existingDrafts.length > 0) {
      console.log(`  ⚠ ${existingDrafts.length} meglévő piszkozat található, törlésük folyamatban...`);
      for (const d of existingDrafts) {
        try {
          runGws(['gmail', 'users', 'drafts', 'delete', '--params', JSON.stringify({ userId: 'me', id: d.id })]);
          console.log(`  ✓ Piszkozat törölve (ID: ${d.id})`);
        } catch (delErr) {
          console.warn(`  ⚠ Nem sikerült törölni a piszkozatot (ID: ${d.id}):`, delErr.message);
        }
      }
    } else {
      console.log('  ✓ Nincs törlendő régi piszkozat.');
    }
  } catch (err) {
    console.warn('  ⚠ Nem sikerült lekérni a piszkozatok listáját:', err.message);
  }

  // 2. CRM adatok beolvasása
  console.log('\n2. CRM adatok beolvasása a Google Sheets "Afrika_Projekt_Finanszirozas" füléről...');
  let crmData;
  try {
    const output = runGws(['sheets', '+read', '--spreadsheet', spreadsheetIdMaster, '--range', 'Afrika_Projekt_Finanszirozas!A1:L50']);
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

  const targetsToProcess = records;
  console.log(`✓ Feldolgozandó tőkealapok/bankok száma: ${targetsToProcess.length} db\n`);

  if (targetsToProcess.length === 0) {
    console.log('ℹ Nincs feldolgozásra váró sor.');
    return;
  }

  let createdCount = 0;
  const rowNumsToUpdate = [];

  const exactSignature = `Üdvözlettel,\nHomola László\nLead Advisor / Projektigazgató\nhomlamentor@gmail.com | +36 70 633 270`;

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
        exactSignature;
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
        exactSignature;
    }

    const rawMime = buildRawMimeMessage({ to: email, subject, body });

    console.log(`[Draft #${createdCount + 1}] Készítés: ${fund} (${email}) | Nyelv: ${isHungarian ? 'HU' : 'EN'}`);

    try {
      const resOutput = runGws(['gmail', 'users', 'drafts', 'create', '--params', JSON.stringify({ userId: 'me' }), '--json', JSON.stringify({ message: { raw: rawMime } })]);
      const resObj = JSON.parse(resOutput);
      console.log(`  ✓ Gmail piszkozat sikeresen létrejött a fiókban (ID: ${resObj.id}).`);
      createdCount++;
      rowNumsToUpdate.push(rowNum);
    } catch (draftErr) {
      console.error(`  ❌ Hiba a piszkozat létrehozásakor (${email}):`, draftErr.message);
    }
  }

  // 3. Google Sheets CRM frissítése
  if (rowNumsToUpdate.length > 0) {
    console.log(`\n3. Master CRM státuszok frissítése...`);
    for (const rNum of rowNumsToUpdate) {
      const updateParams = JSON.stringify({
        spreadsheetId: spreadsheetIdMaster,
        range: `Afrika_Projekt_Finanszirozas!H${rNum}`,
        valueInputOption: "USER_ENTERED"
      });
      const updateJson = JSON.stringify({
        values: [["Piszkozat bekészítve"]]
      });

      try {
        runGws(['sheets', 'spreadsheets', 'values', 'update', '--params', updateParams, '--json', updateJson]);
      } catch (sheetErr) {
        console.error(`  ❌ Hiba a CRM sorszám #${rNum} frissítésekor:`, sheetErr.message);
      }
    }
    console.log(`✓ ${rowNumsToUpdate.length} sor frissítve "Piszkozat bekészítve" státuszra.`);
  }

  console.log('\n========================================================================');
  console.log(`🎉 AFRIKAI PROJEKT-FINANSZÍROZÁSI PISZKOZATOK LÉTREHOZÁSA SIKERES!`);
  console.log(`Összesen ${createdCount} új tisztított piszkozat létrejött a Gmailedben.`);
  console.log('========================================================================');
}

main();
