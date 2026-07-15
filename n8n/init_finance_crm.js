/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const sheetName = 'Afrika_Projekt_Finanszirozas';

function runGws(args) {
  const res = spawnSync('gws', args, { encoding: 'utf-8', shell: true });
  return res;
}

function main() {
  console.log(`1. Új munkalap ("${sheetName}") létrehozásának indítása a Google Táblázatban...`);
  
  const batchParams = JSON.stringify({
    spreadsheetId: spreadsheetId
  });
  
  const batchJson = JSON.stringify({
    requests: [
      {
        addSheet: {
          properties: {
            title: sheetName
          }
        }
      }
    ]
  });

  // Futtassuk a batchUpdate parancsot
  // Windows cmd/pwsh shell-ben az idézőjeleket megfelelően kell escapelni
  const batchRes = runGws([
    'sheets', 'spreadsheets', 'batchUpdate',
    '--params', `"${batchParams.replace(/"/g, '\\"')}"`,
    '--json', `"${batchJson.replace(/"/g, '\\"')}"`
  ]);

  if (batchRes.status !== 0) {
    const errorMsg = batchRes.stderr || batchRes.stdout;
    if (errorMsg.includes('already exists') || errorMsg.includes('szheet name already exists') || errorMsg.includes('INVALID_ARGUMENT')) {
      // Ha már létezik, az API INVALID_ARGUMENT státuszt adhat vissza, ha a név ütközik
      console.log(`ℹ A "${sheetName}" munkalap valószínűleg már létezik, vagy nem lehetett létrehozni (pl. névütközés). Folytatás a fejléc felülírásával...`);
    } else {
      console.error('❌ Hiba a munkalap létrehozásakor:', errorMsg);
      process.exit(1);
    }
  } else {
    console.log(`✓ A "${sheetName}" munkalap sikeresen létrejött.`);
  }

  console.log(`\n2. Fejlécek injektálása a "${sheetName}" munkalapra...`);
  
  const headers = ['Nev', 'Pozicio', 'Alap/Bank', 'Orszag', 'LinkedIn_URL', 'Email', 'Celzott_Szektor', 'Statusz'];
  
  const updateParams = JSON.stringify({
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!A1:H1`,
    valueInputOption: 'USER_ENTERED'
  });
  
  const updateJson = JSON.stringify({
    values: [headers]
  });

  const updateRes = runGws([
    'sheets', 'spreadsheets', 'values', 'update',
    '--params', `"${updateParams.replace(/"/g, '\\"')}"`,
    '--json', `"${updateJson.replace(/"/g, '\\"')}"`
  ]);

  if (updateRes.status !== 0) {
    console.error('❌ Hiba a fejléc frissítésekor:', updateRes.stderr || updateRes.stdout);
    process.exit(1);
  }

  console.log('✓ Fejlécek sikeresen beírva:', headers.join(', '));
  console.log('\n🎉 CRM Google Sheet sikeresen inicializálva!');
}

main();
