/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Környezeti változók beolvasása
const envPath = path.join(__dirname, '..', '.env');
let n8nApiKey = '';
let n8nBaseUrl = 'https://n8n-latest-fulv.onrender.com';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const apiKeyMatch = envContent.match(/^N8N_API_KEY=(.*)$/m);
  n8nApiKey = apiKeyMatch ? apiKeyMatch[1].trim().replace(/['"]/g, '') : '';
  
  const baseUrlMatch = envContent.match(/^N8N_BASE_URL=(.*)$/m);
  if (baseUrlMatch) {
    n8nBaseUrl = baseUrlMatch[1].trim().replace(/['"]/g, '');
  }
}

const csvPath = path.join(__dirname, 'b2b_target_companies.csv');
const templatePath = path.join(__dirname, 'templates', 'b2b_outreach_email.md');
const workflowPath = path.join(__dirname, 'homola_b2b_campaign_workflow.json');

// Fájlok meglétének ellenőrzése
if (!fs.existsSync(csvPath)) {
  console.error(`CSV fájl nem található: ${csvPath}`);
  process.exit(1);
}
if (!fs.existsSync(templatePath)) {
  console.error(`Sablon fájl nem található: ${templatePath}`);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const templateContent = fs.readFileSync(templatePath, 'utf-8');

// Nyelvi sablonok kinyerése regex segítségével
const getTemplateSection = (langRegex) => {
  const match = templateContent.match(langRegex);
  return match ? match[1].trim() : '';
};

const huTemplate = getTemplateSection(/## 1\. Magyar verzió \(Hungarian\)\r?\n\r?\n([\s\S]*?)(?:\r?\n\r?\n---|## 2|$)/);
const enTemplate = getTemplateSection(/## 2\. Angol verzió \(English\)\r?\n\r?\n([\s\S]*?)(?:\r?\n\r?\n---|## 3|$)/);
const deTemplate = getTemplateSection(/## 3\. Német verzió \(German\)\r?\n\r?\n([\s\S]*?)(?:\r?\n\r?\n---|## 4|$)/);

// CSV parszolása
const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
const header = lines[0].split(',');
const records = lines.slice(1).map((line, idx) => {
  const values = line.split(',');
  const record = {};
  header.forEach((key, index) => {
    record[key.trim()] = values[index] ? values[index].trim() : '';
  });
  record._lineIdx = idx + 1; // Eredeti sorszám a CSV-ben
  return record;
});

// E-mail validációs regex (RFC 5322 szabvány alapján egyszerűsített, de robusztus)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

console.log('========================================================================');
console.log('B2B OUTREACH KAMPÁNY: ADAT- ÉS E-MAIL VALIDÁCIÓ');
console.log('========================================================================');

let hasError = false;
const updatedRecords = [];

records.forEach((record) => {
  const name = record.Nev;
  const company = record.Ceg;
  const email = record.Email;
  const country = record.Orszag || 'Magyarország';
  const position = record.Pozicio;
  const industry = record.Iparag;
  const type = record.Cegtipus;
  
  let errors = [];

  // 1. Mező ellenőrzések
  if (!name) errors.push('Hiányzó Név');
  if (!company) errors.push('Hiányzó Cégnév');
  if (!email) {
    errors.push('Hiányzó E-mail');
  } else if (!emailRegex.test(email)) {
    errors.push(`Érvénytelen e-mail formátum: "${email}"`);
  }

  if (errors.length > 0) {
    console.error(`❌ HIBA [Sor #${record._lineIdx + 1}]: ${company || 'Ismeretlen cég'} - ${name || 'Ismeretlen név'}`);
    errors.forEach(err => console.error(`   - ${err}`));
    hasError = true;
    record.Statusz = 'Hiba';
  } else {
    // 2. Nyelvi lokalizáció és sablon választás
    let lang = 'hu';
    let selectedTemplate = huTemplate;
    
    if (country.toLowerCase() === 'ausztria' || country.toLowerCase() === 'németország' || country.toLowerCase() === 'germany' || country.toLowerCase() === 'austria') {
      lang = 'de';
      selectedTemplate = deTemplate;
    } else if (country.toLowerCase() !== 'magyarország' && country.toLowerCase() !== 'hungary') {
      lang = 'en';
      selectedTemplate = enTemplate;
    }

    // Személyre szabás
    let emailBody = selectedTemplate
      .replace(/\[Keresztnév \/ Kapcsolattartó\]/g, `${name} (${position})`)
      .replace(/\[Keresztnév \/ Contact Name\]/g, `${name} (${position})`)
      .replace(/\[Keresztnév \/ Kontaktname\]/g, `${name} (${position})`)
      .replace(/\[Cégnév \/ Company Name\]/g, company)
      .replace(/\[Cégnév \/ Unternehmensname\]/g, company)
      .replace(/\[Iparág \/ Industry\]/g, industry)
      .replace(/\[Iparág \/ Branche\]/g, industry)
      .replace(/\[Cégnév\]/g, company)
      .replace(/\[Iparág\]/g, industry);

    // Tárgy behelyettesítése
    let subject = `Afrikai piacnyitás és megbízások felkutatása a(z) ${company} részére – HOMLAMENTOR KFT`;
    const subjectMatch = emailBody.match(/^\*\*(?:Tárgy|Subject|Betreff):\*\* (.*)\r?\n/);
    if (subjectMatch) {
      subject = subjectMatch[1];
      emailBody = emailBody.replace(/^\*\*(?:Tárgy|Subject|Betreff):\*\* .*\r?\n/, '');
    }

    record.Statusz = 'Validált';
    
    console.log(`✓ [VALIDÁLT] ${company} (${country}) -> Címzett: ${name} | Nyelv: ${lang.toUpperCase()}`);
    console.log(`   Tárgy: ${subject}`);
    console.log(`   E-mail: ${email}`);
  }
  
  updatedRecords.push(record);
});

// CSV frissítése a státuszokkal
const newCsvLines = [header.join(',')];
updatedRecords.forEach(r => {
  const lineValues = header.map(key => r[key.trim()] || '');
  newCsvLines.push(lineValues.join(','));
});
fs.writeFileSync(csvPath, newCsvLines.join('\n'), 'utf-8');
console.log('\n✓ A local CSV CRM státuszai frissítve lettek a helyes rekordoknál "Validált" státuszra.');

// n8n Workflow frissítése API-n keresztül
if (n8nApiKey && fs.existsSync(workflowPath)) {
  console.log('\n========================================================================');
  console.log('N8N WORKFLOW FRISSÍTÉSE API-N KERESZTÜL');
  console.log('========================================================================');
  console.log(`Kapcsolódás az n8n szerverhez: ${n8nBaseUrl}`);
  
  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
  
  // n8n API hívás (workflows)
  // Megpróbáljuk frissíteni a workflow-t. Az n8n REST API a /v1/workflows/{id} PUT hívással dolgozik.
  // A workflow ID nálunk: homola-b2b-outreach-campaign
  const workflowId = 'homola-b2b-outreach-campaign';
  
  const https = require('https');
  const url = new URL(`${n8nBaseUrl}/api/v1/workflows/${workflowId}`);
  
  const options = {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': n8nApiKey,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✓ Az n8n workflow sikeresen frissítve és élesítve a szerveren! (ID: ${workflowId})`);
      } else {
        console.warn(`⚠ n8n API válasz: Code ${res.statusCode}. Válasz: ${data.trim().substring(0, 150)}...`);
        console.warn('A workflow-t lokálisan elmentettük, de a távoli n8n szerveren manuális importálás vagy fiók OAuth ellenőrzés szükséges.');
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Hiba az n8n API kapcsolat során: ${e.message}`);
  });
  
  req.write(JSON.stringify(workflowData));
  req.end();
} else {
  console.log('\nℹ n8n API kulcs nem áll rendelkezésre vagy hiányzik a workflow fájl, a távoli frissítés kihagyva.');
}
