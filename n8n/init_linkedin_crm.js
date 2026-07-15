/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ'; // Master_Vevőlista és Afrika_Projekt_Finanszirozas
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM'; // CONTACTS fül

function main() {
  console.log('====== CRM LINKEDIN NAPLÓ INICIALIZÁLÁSA ======\n');

  // 1. Master_Vevőlista fejléc bővítése (O1:P1)
  console.log('1. [Master CRM] Master_Vevőlista fül ellenőrzése és bővítése...');
  try {
    // Első lépésként beolvassuk az O1:P1 cellákat, hogy ellenőrizzük, léteznek-e már
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Master_Vevőlista!O1:P1"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    const values = data.values || [[]];
    const isAlreadyInitialized = values[0] && values[0][0] === 'LinkedIn_Statusz';

    if (isAlreadyInitialized) {
      console.log('✓ Master_Vevőlista fülön a LinkedIn oszlopok már jelen vannak.');
    } else {
      console.log('🔄 LinkedIn oszlopok hozzáadása a Master_Vevőlista fülhöz (O1:P1)...');
      execSync(`gws sheets spreadsheets values update --params "{\\"spreadsheetId\\":\\"${spreadsheetIdMaster}\\",\\"range\\":\\"Master_Vevőlista!O1:P1\\",\\"valueInputOption\\":\\"USER_ENTERED\\"}" --json "{\\"values\\":[[\\"LinkedIn_Statusz\\",\\"Utolso_InMail_Datum\\"]]}"`);
      console.log('✓ Oszlopok sikeresen hozzáadva.');
    }
  } catch (err) {
    console.error('❌ Hiba a Master_Vevőlista bővítése során:', err.message);
  }

  // 2. CONTACTS fül fejléc bővítése (O1:P1)
  console.log('\n2. [Contacts CRM] CONTACTS fül ellenőrzése és bővítése...');
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdContacts} --range "CONTACTS!O1:P1"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    const values = data.values || [[]];
    const isAlreadyInitialized = values[0] && values[0][0] === 'LinkedIn_Statusz';

    if (isAlreadyInitialized) {
      console.log('✓ CONTACTS fülön a LinkedIn oszlopok már jelen vannak.');
    } else {
      console.log('🔄 LinkedIn oszlopok hozzáadása a CONTACTS fülhöz (O1:P1)...');
      execSync(`gws sheets spreadsheets values update --params "{\\"spreadsheetId\\":\\"${spreadsheetIdContacts}\\",\\"range\\":\\"CONTACTS!O1:P1\\",\\"valueInputOption\\":\\"USER_ENTERED\\"}" --json "{\\"values\\":[[\\"LinkedIn_Statusz\\",\\"Utolso_InMail_Datum\\"]]}"`);
      console.log('✓ Oszlopok sikeresen hozzáadva.');
    }
  } catch (err) {
    console.error('❌ Hiba a CONTACTS fül bővítése során:', err.message);
  }

  // 3. Afrika_Projekt_Finanszirozas fül fejléc bővítése (I1:L1)
  console.log('\n3. [Master CRM] Afrika_Projekt_Finanszirozas fül ellenőrzése és bővítése...');
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Afrika_Projekt_Finanszirozas!I1:L1"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    const values = data.values || [[]];
    const isAlreadyInitialized = values[0] && values[0][2] === 'LinkedIn_Statusz';

    if (isAlreadyInitialized) {
      console.log('✓ Afrika_Projekt_Finanszirozas fülön a LinkedIn oszlopok már jelen vannak.');
    } else {
      console.log('🔄 Oszlopok hozzáadása az Afrika_Projekt_Finanszirozas fülhöz (I1:L1)...');
      // I1: Telefon, J1: Befektetesi_Volumen, K1: LinkedIn_Statusz, L1: Utolso_InMail_Datum
      execSync(`gws sheets spreadsheets values update --params "{\\"spreadsheetId\\":\\"${spreadsheetIdMaster}\\",\\"range\\":\\"Afrika_Projekt_Finanszirozas!I1:L1\\",\\"valueInputOption\\":\\"USER_ENTERED\\"}" --json "{\\"values\\":[[\\"Telefon\\",\\"Befektetési_Volumen\\",\\"LinkedIn_Statusz\\",\\"Utolso_InMail_Datum\\"]]}"`);
      console.log('✓ Oszlopok sikeresen hozzáadva.');
    }
  } catch (err) {
    console.error('❌ Hiba az Afrika_Projekt_Finanszirozas fül bővítése során:', err.message);
  }

  console.log('\n================ INITIALIZATION COMPLETED ================');
}

main();
