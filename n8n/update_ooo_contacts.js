/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

const spreadsheetId = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

function main() {
  console.log('1. CONTACTS adatok lekérdezése...');
  
  const readParams = JSON.stringify({
    spreadsheetId: spreadsheetId,
    range: 'CONTACTS!A1:O150'
  });
  
  const readRes = spawnSync('gws', [
    'sheets', 'spreadsheets', 'values', 'get',
    '--params', `"${readParams.replace(/"/g, '\\"')}"`
  ], { encoding: 'utf-8', shell: true });

  if (readRes.status !== 0) {
    console.error('❌ Hiba a táblázat olvasásakor:', readRes.stderr || readRes.stdout);
    process.exit(1);
  }

  const crmData = JSON.parse(readRes.stdout);
  const rows = crmData.values || [];
  if (rows.length < 2) {
    console.error('❌ Nincsenek megfelelő adatok a CONTACTS fülön.');
    process.exit(1);
  }

  const header = rows[0];
  console.log(`✓ Beolvasva ${rows.length} sor (fejléccel együtt).`);

  let aronRowIndex = -1;
  let rudolfRowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const name = rows[i][0] ? rows[i][0].trim() : '';
    if (name.toLowerCase().includes('görög áron')) {
      aronRowIndex = i + 1; // 1-indexed Excel sor
    }
    if (name.toLowerCase().includes('rudolf nemes') || name.toLowerCase().includes('nemes rudolf')) {
      rudolfRowIndex = i + 1; // 1-indexed Excel sor
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // Görög Áron frissítése (Sor index: aronRowIndex)
  if (aronRowIndex !== -1) {
    console.log(`\n2. Görög Áron frissítése a(z) ${aronRowIndex}. sorban...`);
    const status = 'Szabadságon (Visszatér: 2026-07-21)';
    const notes = 'Szabadságon 07.11-07.20 között. Sürgős helyettes: Tettamanti Iván (+36-70-686-55-16, ivan.tettamanti@cordiahomes.com).';
    
    // Status (L oszlop, 12. oszlop), Notes (O oszlop, 15. oszlop)
    // Range: L{row}:O{row} -> L (12), M (13), N (14), O (15)
    // Az egyszerűség kedvéért külön frissítjük a kettőt vagy egyben a tartományt:
    // M (Utolsó interakció) -> mai dátum? Nem kérte, de frissíthetjük.
    const updateParams = JSON.stringify({
      spreadsheetId: spreadsheetId,
      range: `CONTACTS!L${aronRowIndex}:O${aronRowIndex}`,
      valueInputOption: 'USER_ENTERED'
    });
    const updateJson = JSON.stringify({
      values: [[status, today, "", notes]]
    });

    const res = spawnSync('gws', [
      'sheets', 'spreadsheets', 'values', 'update',
      '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
      '--json', `"${updateJson.replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });

    if (res.status === 0) {
      console.log('  ✓ Görög Áron sikeresen frissítve.');
    } else {
      console.error('  ❌ Hiba Görög Áron frissítésekor:', res.stderr || res.stdout);
    }
  } else {
    console.warn('  ⚠ Görög Áron nem található a táblázatban.');
  }

  // Nemes Rudolf frissítése (Sor index: rudolfRowIndex)
  if (rudolfRowIndex !== -1) {
    console.log(`\n3. Nemes Rudolf frissítése a(z) ${rudolfRowIndex}. sorban...`);
    const status = 'Szabadságon / Helyettesítve';
    const notes = 'OOO auto-reply received. Urgent contact: Galambos Eszter (Asszisztens, +36706636649, eszter.galambos@helloparks.com).';

    const updateParams = JSON.stringify({
      spreadsheetId: spreadsheetId,
      range: `CONTACTS!L${rudolfRowIndex}:O${rudolfRowIndex}`,
      valueInputOption: 'USER_ENTERED'
    });
    const updateJson = JSON.stringify({
      values: [[status, today, "", notes]]
    });

    const res = spawnSync('gws', [
      'sheets', 'spreadsheets', 'values', 'update',
      '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
      '--json', `"${updateJson.replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });

    if (res.status === 0) {
      console.log('  ✓ Nemes Rudolf sikeresen frissítve.');
    } else {
      console.error('  ❌ Hiba Nemes Rudolf frissítésekor:', res.stderr || res.stdout);
    }
  } else {
    console.warn('  ⚠ Nemes Rudolf nem található a táblázatban.');
  }

  // Új helyettesítő sorok létrehozása (a táblázat végére appendeljük őket)
  console.log('\n4. Helyettesítő kapcsolattartók hozzáadása a táblázat végére...');
  
  // Tettamanti Iván és Galambos Eszter sorai
  const newContacts = [
    [
      'Tettamanti Iván',
      'Sürgős helyettes',
      'Cordia Homes',
      'Residential Developer',
      'Hungary',
      '', // LinkedIn
      'ivan.tettamanti@cordiahomes.com',
      'OOO Referral',
      'Keszthely Lakópark',
      today,
      'Email',
      'Helyettesítő / Kapcsolatfelvétel szükséges',
      today,
      '', // Következő lépés határideje
      'Görög Áron helyettese szabadság alatt. Telefon: +36-70-686-55-16.'
    ],
    [
      'Galambos Eszter',
      'Asszisztens',
      'HelloParks',
      'Industrial Developer (Biggeorge Group)',
      'Hungary',
      '', // LinkedIn
      'eszter.galambos@helloparks.com',
      'OOO Referral',
      'Keszthely Lakópark',
      today,
      'Email',
      'Helyettesítő',
      today,
      '', // Következő lépés határideje
      'Nemes Rudolf helyettese szabadság alatt. Telefon: +36706636649.'
    ]
  ];

  const appendParams = JSON.stringify({
    spreadsheetId: spreadsheetId,
    range: 'CONTACTS!A1:O1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS'
  });
  const appendJson = JSON.stringify({
    values: newContacts
  });

  const appendRes = spawnSync('gws', [
    'sheets', 'spreadsheets', 'values', 'append',
    '--params', `"${appendParams.replace(/"/g, '\\"')}"`,
    '--json', `"${appendJson.replace(/"/g, '\\"')}"`
  ], { encoding: 'utf-8', shell: true });

  if (appendRes.status === 0) {
    console.log('✓ Új helyettesítő kapcsolattartók sikeresen hozzáadva.');
  } else {
    console.error('❌ Hiba a helyettesítők hozzáadásakor:', appendRes.stderr || appendRes.stdout);
  }
}

main();
