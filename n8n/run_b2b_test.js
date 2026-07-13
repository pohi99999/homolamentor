/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Útvonalak beállítása
const csvPath = path.join(__dirname, 'b2b_target_companies.csv');
const templatePath = path.join(__dirname, 'templates', 'b2b_outreach_email.md');

// Fájlok ellenőrzése
if (!fs.existsSync(csvPath)) {
  console.error(`A CSV fájl nem található: ${csvPath}`);
  process.exit(1);
}
if (!fs.existsSync(templatePath)) {
  console.error(`A sablonfájl nem található: ${templatePath}`);
  process.exit(1);
}

// Fájlok beolvasása
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const templateContent = fs.readFileSync(templatePath, 'utf-8');

// Sablon szétbontása magyar verzióra
const hungarianTemplateMatch = templateContent.match(/## 1\. Magyar verzió \(Hungarian\)\r?\n\r?\n([\s\S]*?)\r?\n\r?\n---/);
let emailTemplate = hungarianTemplateMatch ? hungarianTemplateMatch[1] : '';

if (!emailTemplate) {
  console.warn('Nem sikerült kinyerni a magyar e-mail sablont. A teljes sablont használjuk fallbackként.');
  emailTemplate = templateContent;
}

// CSV feldolgozása soronként
const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
const header = lines[0].split(',');

const records = lines.slice(1).map(line => {
  // Egyszerű CSV sor parszolás (feltételezve, hogy a mezőkben nincs beágyazott vessző)
  const values = line.split(',');
  const record = {};
  header.forEach((key, index) => {
    record[key.trim()] = values[index] ? values[index].trim() : '';
  });
  return record;
});

console.log('========================================================================');
console.log(`B2B OUTREACH KAMPÁNY TESZT SZIMULÁCIÓ - Összesen ${records.length} partner`);
console.log('========================================================================\n');

records.forEach((record, index) => {
  const name = record.Nev;
  const company = record.Ceg;
  const industry = record.Iparag;
  const email = record.Email;
  const position = record.Pozicio;
  const status = record.Statusz;

  if (!name || !company) return;

  // Személyre szabott e-mail szöveg generálása a magyar sablon alapján
  let personalizedBody = emailTemplate
    .replace(/\[Keresztnév \/ Kapcsolattartó\]/g, `${name} (${position})`)
    .replace(/\[Keresztnév \/ Contact Name\]/g, `${name} (${position})`)
    .replace(/\[Cégnév \/ Company Name\]/g, company)
    .replace(/\[Iparág \/ Industry\]/g, industry)
    .replace(/\[Cégnév\]/g, company)
    .replace(/\[Iparág\]/g, industry);

  // Tárgy behelyettesítése (a sablon első sora tartalmazza a tárgyat)
  let subject = `Afrikai piacnyitás és megbízások felkutatása a(z) ${company} részére – HOMLAMENTOR KFT`;
  const subjectMatch = personalizedBody.match(/^\*\*Tárgy:\*\* (.*)\r?\n/);
  if (subjectMatch) {
    subject = subjectMatch[1];
    personalizedBody = personalizedBody.replace(/^\*\*Tárgy:\*\* .*\r?\n/, '');
  }

  console.log(`[PARTNER #${index + 1}]`);
  console.log(`Címzett: ${name} <${email}>`);
  console.log(`Cég/Pozíció: ${company} - ${position}`);
  console.log(`Iparág: ${industry}`);
  console.log(`Státusz a CRM-ben: ${status}`);
  console.log(`Tárgy: ${subject}`);
  console.log('------------------------------------------------------------------------');
  console.log(personalizedBody.trim());
  console.log('========================================================================\n');
});

console.log('Szimuláció sikeresen befejeződött. Az n8n workflow készen áll a tömeges futtatásra.');
