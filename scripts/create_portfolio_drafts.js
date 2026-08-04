/**
 * Homola Mentor Kft. – Automata Portfólió Piszkozat-Generáló Szkript
 * 
 * Ez a szkript NEM küld automatikusan levelet, hanem felkészíti és elmenti a B2B 
 * kiajánló e-maileket a Gmail Piszkozatok (Drafts) mappájába a megadott csatolmánnyal.
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

// 2. Dinamikus CRM Leadek Kiolvasása a Google Sheets API / gws CLI Segítségével
function fetchCrmLeadsFromGoogleSheets() {
  const masterSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_MASTER || "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
  const contactsSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_CONTACTS || "1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM";

  const fetchRowsFromSheet = (spreadsheetId) => {
    try {
      const cmd = `gws sheets spreadsheets values get --params "{\\"spreadsheetId\\":\\"${spreadsheetId}\\",\\"range\\":\\"A1:Z200\\"}"`;
      const stdout = execSync(cmd, { encoding: 'utf8', shell: 'cmd.exe' });
      const parsed = JSON.parse(stdout);
      return parsed.values || [];
    } catch (e) {
      return [];
    }
  };

  let masterRows = fetchRowsFromSheet(masterSpreadsheetId);
  if (masterRows.length === 0) {
    masterRows = fetchRowsFromSheet(contactsSpreadsheetId);
  }

  if (masterRows.length <= 1) return [];

  const firstRowHeader = masterRows[0].map(h => String(h || '').toLowerCase().trim());
  const findColIndex = (keywords, defaultIdx) => {
    const idx = firstRowHeader.findIndex(h => keywords.some(kw => h.includes(kw)));
    return idx !== -1 ? idx : defaultIdx;
  };

  const nameIdx = findColIndex(["kapcsolattartó", "név", "partner", "ügyfél", "name"], 5);
  const emailIdx = findColIndex(["email", "e-mail", "mail"], 7);
  const statusIdx = findColIndex(["státusz", "status", "állapot"], 13);

  const validLeads = [];
  const dataRows = masterRows.slice(1);

  for (const row of dataRows) {
    const name = row[nameIdx] || row[0] || "";
    const email = row[emailIdx] || "";
    const status = row[statusIdx] || "";

    if (
      email &&
      email.includes("@") &&
      !email.includes("Nincs email") &&
      !status.toLowerCase().includes("visszadobva") &&
      !status.toLowerCase().includes("hibás")
    ) {
      if (!validLeads.some(l => l.email.toLowerCase() === email.trim().toLowerCase())) {
        validLeads.push({
          name: name.trim() || "Döntéshozó Partner",
          email: email.trim()
        });
      }
    }
    if (validLeads.length >= 10) break;
  }

  return validLeads;
}

// 3. Elegáns B2B HTML E-mail Sablon (Weboldal hivatkozás nélkül)
function getPortfolioEmailHtml(leadName) {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
    .content { font-size: 14px; line-height: 1.7; color: #334155; }
    .highlight { background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; font-size: 13px; color: #64748b; }
    .signature { font-weight: bold; color: #0f172a; margin-top: 12px; }
    .title { color: #b45309; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">HOMOLA MENTOR KFT.</div>
      <div class="badge">Diszkrét B2B Partnerség & Off-Market Portfólió</div>
    </div>
    <div class="content">
      <p>Tisztelt <strong>${leadName}</strong>!</p>
      
      <p>Bízom benne, hogy levelem jó egészségben és sikeres üzleti időszakban találja Önöket.</p>

      <p>Engedje meg, hogy a <strong>Homola Mentor Kft.</strong> nevében közvetlenül figyelmébe ajánljam legújabb, kifejezetten zártkörű partnereinknek összeállított <strong>"Prémium Off-Market Ingatlan és Globális Infrastruktúra Portfólió (2026)"</strong> kiadványunkat.</p>

      <div class="highlight">
        <strong style="color: #0f172a;">A mellékelt digitális portfólió kiemelt M&A és ingatlan befektetési lehetőségei:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #475569;">
          <li>Magyarországi prémium iparterületek és off-market csarnok fejlesztések (Üllő, Győrszentiván, M5 Kamion Park)</li>
          <li>Közép-Európai megújuló energia (Szolár park) projektek akvizíciója</li>
          <li>Elefántcsontparti Nemzetközi Divízió: Afrikai Infrastruktúra-Finanszírozás és Inkubáció (Abidjan)</li>
        </ul>
      </div>

      <p>A mellékelt PDF dokumentum részletes műszaki és pénzügyi áttekintést nyújt a projektekről. Amennyiben az anyagban szereplő tárgyalási opciók felkeltik érdeklődését, készséggel állok rendelkezésére egy személyes vagy online egyeztetés keretében.</p>

      <p>Üdvözlettel és tisztelettel,</p>
    </div>

    <div class="footer">
      <div class="signature">Homola László</div>
      <div class="title">Ügyvezető Igazgató / Founder</div>
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        Homola Mentor Kft. • Hivatalos Központi Iroda & B2B Divízió<br>
        E-mail: office.homlamentor@gmail.com
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 4. gws CLI segítségével piszkozat létrehozása --upload kapcsolóval
function createDraftViaGwsUpload(fullMimeRaw) {
  const tmpEmlPath = path.join(__dirname, `tmp_draft_${Date.now()}.eml`);
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

// 5. Fő Futási Folyamat
async function main() {
  console.log("==========================================================");
  console.log("   Homola Mentor Kft. – Gmail Piszkozat-Generáló Indítása");
  console.log("==========================================================");

  // A) CRM leadek dinamikus betöltése Google Sheets-ből
  let leads = fetchCrmLeadsFromGoogleSheets();

  if (leads.length === 0) {
    console.log("[Info] Nem sikerült leadeket kiolvasni a táblázatból, a teszt lead-et használjuk fallback-ként.");
    leads = [
      { name: "Pohanka Péter", email: "peterpohankapersonal@gmail.com" }
    ];
  }

  // Csatolmány PDF kiválasztása
  let pdfPath = path.join(__dirname, '..', 'public', 'Portfolio_HU_v6.pdf');
  if (!fs.existsSync(pdfPath)) {
    pdfPath = path.join(__dirname, '..', 'Homola_Portfolio_Magazin_HU.pdf');
  }

  console.log(`[Info] Csatolmány PDF útvonala: ${pdfPath}`);
  console.log(`[Info] Feldolgozandó leadek száma: ${leads.length}`);
  console.log("----------------------------------------------------------");

  let createdCount = 0;
  let failedCount = 0;

  for (const lead of leads) {
    if (!lead.email || lead.email.includes("Nincs email")) {
      console.warn(`[Kihagyva] ${lead.name}: Nincs érvényes e-mail cím.`);
      continue;
    }

    const subject = `Homola Mentor Kft. – Prémium Off-Market Ingatlan és Globális Infrastruktúra Portfólió (2026)`;
    const htmlBody = getPortfolioEmailHtml(lead.name);

    // MIME Nyers szöveg (RFC 822) előállítása
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
    let mimeParts = [
      `From: Homola Mentor Kft. <office.homlamentor@gmail.com>`,
      `To: ${lead.name} <${lead.email}>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(htmlBody, 'utf8').toString('base64'),
      ``
    ];

    if (pdfPath && fs.existsSync(pdfPath)) {
      const filename = path.basename(pdfPath);
      const fileBuffer = fs.readFileSync(pdfPath);
      mimeParts.push(
        `--${boundary}`,
        `Content-Type: application/pdf; name="${filename}"`,
        `Content-Disposition: attachment; filename="${filename}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        fileBuffer.toString('base64'),
        ``
      );
    }
    mimeParts.push(`--${boundary}--`);
    const fullMimeRaw = mimeParts.join('\r\n');

    try {
      const gwsRes = createDraftViaGwsUpload(fullMimeRaw);
      createdCount++;
      console.log(`[Siker] Piszkozat sikeresen elkészült: ${lead.name} (${lead.email}) -> Draft ID: ${gwsRes.id || gwsRes.message?.id || 'OK'}`);
      continue;
    } catch (gwsErr) {
      console.error(`[gws CLI Hiba]:`, gwsErr.stderr || gwsErr.message);
    }

    failedCount++;
    console.error(`[Hiba] Piszkozat készítése meghiúsult (${lead.name} - ${lead.email}).`);
  }

  console.log("----------------------------------------------------------");
  console.log(`[Összegzés] Elkészült piszkozatok: ${createdCount} | Hibás: ${failedCount}`);
  console.log("==========================================================");
}

if (require.main === module) {
  main();
}

module.exports = { main, getPortfolioEmailHtml, fetchCrmLeadsFromGoogleSheets };
