const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

async function main() {
  console.log('CRM adatok beolvasása...');
  
  // 1. CONTACTS fül beolvasása
  let contactsRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdContacts} --range "CONTACTS!A1:O150"`, { encoding: 'utf-8' });
    contactsRows = JSON.parse(output).values || [];
    console.log(`CONTACTS táblázatból beolvasva: ${contactsRows.length} sor.`);
  } catch (err) {
    console.error('Hiba a CONTACTS beolvasásakor:', err.message);
  }

  // 2. Master_Vevőlista beolvasása
  let masterRows = [];
  try {
    const output = execSync(`gws sheets +read --spreadsheet ${spreadsheetIdMaster} --range "Master_Vevőlista!A1:S100"`, { encoding: 'utf-8' });
    masterRows = JSON.parse(output).values || [];
    console.log(`Master_Vevőlista táblázatból beolvasva: ${masterRows.length} sor.`);
  } catch (err) {
    console.error('Hiba a Master_Vevőlista beolvasásakor:', err.message);
  }

  const uniqueBounces = new Map();

  // Process Contacts
  if (contactsRows.length > 1) {
    contactsRows.slice(1).forEach(row => {
      const status = row[11] ? row[11].trim() : '';
      if (status === 'Visszadobva / Hibás email') {
        const name = row[0] ? row[0].trim() : '';
        const position = row[1] ? row[1].trim() : '';
        const company = row[2] ? row[2].trim() : '';
        const email = row[6] ? row[6].trim().toLowerCase() : '';
        const project = row[8] ? row[8].trim() : '';
        
        const key = email || name || (company + '_' + position);
        if (key) {
          uniqueBounces.set(key, { name, position, company, email, project, source: 'Contacts' });
        }
      }
    });
  }

  // Process Master CRM - Read only, as LinkedIn outreach targets are sourced from the CONTACTS sheet
  if (masterRows.length > 1) {
    let masterBounceCount = 0;
    const header = masterRows[0];
    masterRows.slice(1).forEach(row => {
      const statusIdx = header.indexOf('Aktuális_Státusz');
      const status = row[statusIdx] ? row[statusIdx].trim() : '';
      if (status === 'Visszadobva / Hibás email') {
        masterBounceCount++;
      }
    });
    console.log(`Master CRM-ben talált visszadobott sorok száma (ellenőrzésre): ${masterBounceCount}`);
  }

  const bounces = Array.from(uniqueBounces.values());
  console.log(`Összes egyedi visszadobott partner: ${bounces.length}`);

  // Sablon beolvasása a manifestből
  const manifestPath = path.join(__dirname, 'linkedin_outreach_manifest.md');
  let templateText = '';
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const startIdx = manifestContent.indexOf('## C) Bounce Mentő Szakasz');
    if (startIdx !== -1) {
      const endIdx = manifestContent.indexOf('---', startIdx + 30);
      if (endIdx !== -1) {
        templateText = manifestContent.slice(startIdx, endIdx).trim();
      } else {
        templateText = manifestContent.slice(startIdx).trim();
      }
    }
  }

  if (!templateText) {
    templateText = `## C) Bounce Mentő Szakasz (LinkedIn Bridge)
**Célcsoport:** A visszadobott kiemelt cégek expanziós igazgatói és ingatlanfejlesztési döntéshozói.`;
  }

  // MD fájl generálása
  let mdContent = `# LinkedIn Bounce Mentő Akciólista\n\n`;
  mdContent += `Generálva: ${new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} ${new Date().toLocaleTimeString('hu-HU')}\n\n`;
  mdContent += `## 1. Kampányirányelvek és Sablonok\n\n`;
  mdContent += `${templateText}\n\n`;
  mdContent += `---\n\n`;
  mdContent += `## 2. Célpontok Listája (${bounces.length} fő)\n\n`;
  mdContent += `Az alábbi partnerek e-mail címe visszadobott vagy hibás státuszt kapott a CRM-ben, ezért őket LinkedIn-en keresztül keressük meg.\n\n`;
  mdContent += `| Név | Pozíció | Cég | Projekt | LinkedIn Keresés |\n`;
  mdContent += `| :--- | :--- | :--- | :--- | :--- |\n`;

  bounces.forEach(p => {
    const searchName = p.name || '';
    const searchCompany = p.company || '';
    const query = `${searchName} ${searchCompany}`.trim();
    const searchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`;
    mdContent += `| ${p.name || '-'} | ${p.position || '-'} | ${p.company || '-'} | ${p.project || '-'} | [Keresés](${searchUrl}) |\n`;
  });

  const outputPath = path.join(__dirname, 'linkedin_bounce_targets.md');
  fs.writeFileSync(outputPath, mdContent, 'utf-8');
  console.log(`Sikeresen legenerálva: ${outputPath}`);
}

main();
