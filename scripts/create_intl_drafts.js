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
const { execFileSync } = require('child_process');

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
  { name: 'Péter', email: 'peterpohankapersonal@gmail.com', country: 'DE', project: 'Senior Living', company: 'Test GmbH' },
  { name: 'Péter EN', email: 'peterpohankapersonal@gmail.com', country: 'UK', project: 'Hospitality Resort', company: 'Test Ltd' },
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

// 5. Sablonfájl beolvasása, "Subject: ..." fejléc kiemelése, {{name}}/{{company}} placeholder csere
function loadTemplate(templatePath, lead) {
  const raw = fs.readFileSync(templatePath, 'utf8');
  const lines = raw.split('\n');

  const subjectLine = lines.find((line) => line.startsWith('Subject:'));
  const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : 'Homola Mentor Kft. – Off-Market Investment Opportunity';

  const bodyStartIdx = lines.findIndex((line) => line.startsWith('Subject:')) + 1;
  const body = lines
    .slice(bodyStartIdx)
    .join('\n')
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{company\}\}/g, lead.company || '')
    .trim();

  const lang = path.basename(templatePath).endsWith('_de.txt') ? 'de' : 'en';

  return { subject, body, lang };
}

// 5b. HTML escape segédfüggvény (a lead adatok is átfolyhatnak ide, biztonság kedvéért)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 5c. A záró aláírás-blokk (László Homola / beosztás / cég / e-mail) elkülönített, kiemelt stílusa
function renderSignatureBlock(lines) {
  const [name, ...rest] = lines;
  const restHtml = rest.map(escapeHtml).join('<br>');
  return `<div class="signature">
      <div style="font-weight:bold;color:#0f172a;">${escapeHtml(name)}</div>
      <div style="color:#64748b;font-size:13px;margin-top:2px;">${restHtml}</div>
    </div>`;
}

// 5d. A teljes .txt levéltörzs HTML-lé alakítása soronkénti állapotgéppel:
// - `- ` kötőjellel kezdődő sorokból <ul><li> lista lesz (attól függetlenül, hogy az előttük
//   álló fejlécsorral egy bekezdésben vannak-e, mivel a sablonokban nincs mindig üres sor közöttük),
// - üres sor bekezdéshatárt jelent (a nem-lista sorok <br>-rel összefűzve egy <p>-be kerülnek),
// - a "László/Laszlo Homola" névvel kezdődő záró blokk kiemelt aláírás-stílust kap.
function bodyTextToHtml(bodyText) {
  const rawLines = bodyText.split('\n');
  const htmlParts = [];
  let paragraphBuffer = [];
  let listBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      htmlParts.push(`<p style="margin:0 0 16px 0;">${paragraphBuffer.map(escapeHtml).join('<br>')}</p>`);
      paragraphBuffer = [];
    }
  };
  const flushList = () => {
    if (listBuffer.length > 0) {
      const items = listBuffer.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
      htmlParts.push(`<ul style="margin:8px 0 16px 0;padding-left:20px;color:#475569;">${items}</ul>`);
      listBuffer = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    if (/^(László|Laszlo) Homola/.test(line)) {
      flushParagraph();
      flushList();
      const signatureLines = rawLines.slice(i).map((l) => l.trim()).filter(Boolean);
      htmlParts.push(renderSignatureBlock(signatureLines));
      break;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
    } else if (line.length === 0) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraphBuffer.push(line);
    }
  }

  flushParagraph();
  flushList();

  return htmlParts.join('\n');
}

// 5f. Prémium, sötét-arany akcentusú B2B HTML email sablon – a create_portfolio_drafts.js
// getPortfolioEmailHtml dizájnjának mintájára, nemzetközi (DE/EN) tartalommal feltöltve.
function buildPremiumEmailHtml({ subject, bodyText, lang }) {
  const badgeText = lang === 'de'
    ? 'Diskrete B2B-Partnerschaft &amp; Off-Market-Portfolio'
    : 'Discreet B2B Partnership &amp; Off-Market Portfolio';
  const bodyHtml = bodyTextToHtml(bodyText);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
    .content { font-size: 14px; line-height: 1.7; color: #334155; }
    .content ul { margin: 8px 0 16px 0; }
    .content li { margin-bottom: 6px; }
    .signature { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">HOMOLA MENTOR KFT.</div>
      <div class="badge">${badgeText}</div>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>`;
}

// 6. A gws CLI valódi Node.js belépési pontjának (run.js) felderítése.
// KRITIKUS: a gws.cmd egy cmd.exe batch shim, amit közvetlenül (execFileSync-cel,
// shell nélkül) NEM lehet elindítani Windows alatt. Ehelyett a mögötte lévő
// run.js-t hívjuk meg közvetlenül a node.exe-vel (process.execPath), argv
// tömbként átadott paraméterekkel – így a JSON --params és a fájlnevek
// tetszőleges karaktere (pl. `&`) sosem megy át cmd.exe shell-értelmezésen,
// és nincs szükség kézi escape-elésre.
let cachedGwsRunJsPath = null;
function resolveGwsRunJsPath() {
  if (cachedGwsRunJsPath) return cachedGwsRunJsPath;

  // `where.exe` valódi Windows bináris (nem cmd/bat shim), ezért biztonságosan
  // hívható execFileSync-cel, shell:true nélkül is.
  const whereOutput = execFileSync('where', ['gws.cmd'], { encoding: 'utf8' });
  const gwsCmdPath = whereOutput.split(/\r?\n/).find((line) => line.trim().length > 0).trim();
  const npmBinDir = path.dirname(gwsCmdPath);
  const runJsPath = path.join(npmBinDir, 'node_modules', '@googleworkspace', 'cli', 'run.js');

  if (!fs.existsSync(runJsPath)) {
    throw new Error(`Nem található a gws CLI run.js belépési pontja: ${runJsPath}`);
  }

  cachedGwsRunJsPath = runJsPath;
  return runJsPath;
}

// 7. A gws CLI-vel piszkozat létrehozása --upload kapcsolóval (RFC 822 .eml),
// execFileSync + közvetlen node.exe hívással (nincs cmd.exe shell, nincs escape-probléma).
function createDraftViaGwsUpload(fullMimeRaw) {
  const tmpEmlPath = path.join(__dirname, `tmp_intl_draft_${Date.now()}.eml`);
  fs.writeFileSync(tmpEmlPath, fullMimeRaw, 'utf8');

  try {
    const runJsPath = resolveGwsRunJsPath();
    const stdout = execFileSync(
      process.execPath,
      [
        runJsPath,
        'gmail', 'users', 'drafts', 'create',
        '--params', JSON.stringify({ userId: 'me' }),
        '--upload', tmpEmlPath,
        '--upload-content-type', 'message/rfc822',
      ],
      { encoding: 'utf8' },
    );
    return JSON.parse(stdout);
  } finally {
    if (fs.existsSync(tmpEmlPath)) {
      try { fs.unlinkSync(tmpEmlPath); } catch (e) {}
    }
  }
}

// 8. Nyers MIME (RFC 822) üzenet felépítése a prémium HTML levéltörzsből és a PDF csatolmányból.
// A tetején multipart/mixed marad (a PDF csatolmány miatt), de a szövegrész text/html.
function buildMimeMessage(lead, subject, htmlBody, pdfPath) {
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
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody, 'utf8').toString('base64'),
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

// 9. Fő futási folyamat
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

    const { subject, body, lang } = loadTemplate(templatePath, lead);
    const htmlBody = buildPremiumEmailHtml({ subject, bodyText: body, lang });
    const fullMimeRaw = buildMimeMessage(lead, subject, htmlBody, pdfPath);

    try {
      const gwsRes = createDraftViaGwsUpload(fullMimeRaw);
      createdCount++;
      console.log(
        `[Siker] Nemzetközi Piszkozat Elkészült: ${lead.name} (${lead.company || '-'}) | Ország: ${lead.country} | Sablon: ${path.basename(templatePath)} | Draft ID: ${gwsRes.id || gwsRes.message?.id || 'OK'}`,
      );
    } catch (gwsErr) {
      failedCount++;
      const errOutput = gwsErr.stderr ? gwsErr.stderr.toString() : gwsErr.message;
      console.error(`[gws CLI Hiba] (${lead.name}):`, errOutput);
    }
  }

  console.log('----------------------------------------------------------');
  console.log(`[Összegzés] Elkészült Nemzetközi Piszkozatok: ${createdCount} | Hibás: ${failedCount}`);
  console.log('==========================================================');
}

if (require.main === module) {
  main();
}

module.exports = { main, resolveTemplatePath, loadTemplate, buildMimeMessage, buildPremiumEmailHtml, bodyTextToHtml };
