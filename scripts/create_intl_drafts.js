/**
 * Homola Mentor Kft. – Nemzetközi (DACH & angol nyelvű) Piszkozat-Generáló Szkript
 *
 * Ez a szkript NEM küld automatikusan levelet, hanem a `gws` CLI segítségével
 * felkészíti és elmenti a nemzetközi B2B kiajánló e-maileket a Gmail Piszkozatok
 * (Drafts) mappájába, a friss angol nyelvű Portfolio_EN_v6.pdf csatolmánnyal.
 *
 * Sablonválasztás logikája:
 *   - a `lead.project` határozza meg a témát (pl. "Senior Living", "Hospitality Resort")
 *   - a `lead.country` határozza meg a nyelvet: DACH régió (DE/AT/CH) esetén német,
 *     egyéb esetben angol sablon kerül kiválasztásra, a rendelkezésre álló fájlokra
 *     eső fallback-kel.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Környezeti változók (.env) automatikus betöltése
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const DACH_COUNTRIES = ['DE', 'AT', 'CH'];

// 2. Projekt témák -> elérhető nyelvi sablonok mappingje (src/messages/)
const PROJECT_TEMPLATES = {
  'Senior Living': {
    de: 'email_02_senior_living_de.txt',
  },
  'Hospitality Resort': {
    de: 'email_03_hospitality_resort_de.txt',
    en: 'email_03_hospitality_resort_en.txt',
  },
};

// 3. Hardcoded teszt lead-tömb (a valós CRM-integráció később kapcsolódik ide)
const testLeads = [
  { name: 'Test Lead', email: 'peterpohankapersonal@gmail.com', country: 'DE', project: 'Senior Living' },
];

// 4. Sablon kiválasztása a lead country + project alapján, nyelvi fallback-kel
function resolveTemplatePath(lead) {
  const templates = PROJECT_TEMPLATES[lead.project];
  if (!templates) {
    return null;
  }

  const preferredLang = DACH_COUNTRIES.includes((lead.country || '').toUpperCase()) ? 'de' : 'en';
  const fallbackLang = preferredLang === 'de' ? 'en' : 'de';

  const fileName = templates[preferredLang] || templates[fallbackLang];
  if (!fileName) {
    return null;
  }

  return path.join(__dirname, '..', 'src', 'messages', fileName);
}

// 5. Sablonfájl beolvasása, "Subject: ..." fejléc kiemelése, {{name}} placeholder csere
function loadTemplate(templatePath, leadName) {
  const raw = fs.readFileSync(templatePath, 'utf8');
  const lines = raw.split('\n');

  const subjectLine = lines.find((line) => line.startsWith('Subject:'));
  const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : 'Homola Mentor Kft. – Off-Market Investment Opportunity';

  const bodyStartIdx = lines.findIndex((line) => line.startsWith('Subject:')) + 1;
  const body = lines
    .slice(bodyStartIdx)
    .join('\n')
    .replace(/\{\{name\}\}/g, leadName)
    .trim();

  return { subject, body };
}

// 6. gws CLI segítségével piszkozat létrehozása --upload kapcsolóval (RFC 822 .eml)
function createDraftViaGwsUpload(fullMimeRaw) {
  const tmpEmlPath = path.join(__dirname, `tmp_intl_draft_${Date.now()}.eml`);
  fs.writeFileSync(tmpEmlPath, fullMimeRaw, 'utf8');

  try {
    const formattedPath = tmpEmlPath.replace(/\\/g, '/');
    const cmd = `gws gmail users drafts create --params "{\\"userId\\":\\"me\\"}" --upload "${formattedPath}" --upload-content-type "message/rfc822"`;
    const stdout = execSync(cmd, { encoding: 'utf8', shell: 'cmd.exe' });
    return JSON.parse(stdout);
  } finally {
    if (fs.existsSync(tmpEmlPath)) {
      try { fs.unlinkSync(tmpEmlPath); } catch (e) {}
    }
  }
}

// 7. Nyers MIME (RFC 822) üzenet felépítése a sablon szövegtörzsből és a PDF csatolmányból
function buildMimeMessage(lead, subject, bodyText, pdfPath) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  const encodedToName = `=?UTF-8?B?${Buffer.from(lead.name, 'utf8').toString('base64')}?=`;

  const mimeParts = [
    `From: Homola Mentor Kft. <office.homlamentor@gmail.com>`,
    `To: ${encodedToName} <${lead.email}>`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(bodyText, 'utf8').toString('base64'),
    ``,
  ];

  if (pdfPath && fs.existsSync(pdfPath)) {
    const filename = path.basename(pdfPath);
    // Kritikus: helyes UTF-8 kódolású Content-Disposition fejléc (RFC 2231 filename*)
    // az esetlegesen ékezetes/nemzetközi fájlnevekhez is, ASCII fallback mellett.
    const asciiFallbackFilename = filename.replace(/[^\x20-\x7E]/g, '_');
    const encodedFilenameRfc2231 = `UTF-8''${encodeURIComponent(filename)}`;
    const fileBuffer = fs.readFileSync(pdfPath);

    mimeParts.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${filename}"`,
      `Content-Disposition: attachment; filename="${asciiFallbackFilename}"; filename*=${encodedFilenameRfc2231}`,
      `Content-Transfer-Encoding: base64`,
      ``,
      fileBuffer.toString('base64'),
      ``,
    );
  } else {
    console.warn(`[Figyelmeztetés] Nem található az angol PDF csatolmány: ${pdfPath}`);
  }

  mimeParts.push(`--${boundary}--`);
  return mimeParts.join('\r\n');
}

// 8. Fő futási folyamat
async function main() {
  console.log('==========================================================');
  console.log('   Homola Mentor Kft. – Nemzetközi Gmail Piszkozat-Generáló ');
  console.log('==========================================================');

  const pdfPath = path.join(__dirname, '..', 'public', 'Portfolio_EN_v6.pdf');
  console.log(`[Info] Angol csatolmány PDF útvonala: ${pdfPath}`);
  console.log(`[Info] Feldolgozandó nemzetközi leadek száma: ${testLeads.length}`);
  console.log('----------------------------------------------------------');

  let createdCount = 0;
  let failedCount = 0;

  for (const lead of testLeads) {
    if (!lead.email || !lead.email.includes('@')) {
      console.warn(`[Kihagyva] ${lead.name}: Nincs érvényes e-mail cím.`);
      continue;
    }

    const templatePath = resolveTemplatePath(lead);
    if (!templatePath || !fs.existsSync(templatePath)) {
      console.error(`[Hiba] Nincs elérhető sablon ehhez: project="${lead.project}", country="${lead.country}" (${lead.name}).`);
      failedCount++;
      continue;
    }

    const { subject, body } = loadTemplate(templatePath, lead.name);
    const fullMimeRaw = buildMimeMessage(lead, subject, body, pdfPath);

    try {
      const gwsRes = createDraftViaGwsUpload(fullMimeRaw);
      createdCount++;
      console.log(
        `[Siker] Nemzetközi Piszkozat Elkészült: ${lead.name} | Ország: ${lead.country} | Sablon: ${path.basename(templatePath)} | Draft ID: ${gwsRes.id || gwsRes.message?.id || 'OK'}`,
      );
    } catch (gwsErr) {
      failedCount++;
      console.error(`[gws CLI Hiba] (${lead.name}):`, gwsErr.stderr || gwsErr.message);
    }
  }

  console.log('----------------------------------------------------------');
  console.log(`[Összegzés] Elkészült Nemzetközi Piszkozatok: ${createdCount} | Hibás: ${failedCount}`);
  console.log('==========================================================');
}

if (require.main === module) {
  main();
}

module.exports = { main, resolveTemplatePath, loadTemplate, buildMimeMessage };
