/**
 * Homola Mentor Kft. – Automata Portfólió Piszkozat-Generáló Szkript (Kizárólag Magyar Leadekre Szűrve)
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

// 2. Szigorú Magyar Lead Szűrő Logika
function isHungarianLead(company, region, name, email, status) {
  if (!email || !email.includes('@')) return false;

  const emailLower = email.toLowerCase().trim();
  const nameLower = name.toLowerCase().trim();
  const companyLower = company.toLowerCase().trim();
  const regionLower = region.toLowerCase().trim();
  const statusLower = status.toLowerCase().trim();

  // Hibás, visszadobott e-mailek kiszűrése
  if (statusLower.includes('visszadobva') || statusLower.includes('hibás') || statusLower.includes('invalid')) {
    return false;
  }

  // 1. Direct .hu TLD vagy magyar e-mail domain
  if (emailLower.endsWith('.hu') || emailLower.includes('.hu/')) {
    return true;
  }

  // Szigorúan kiszűrjük a nemzetközi/külföldi domain-eket, ha nincs magyar relevancia
  const foreignTlds = ['.de', '.at', '.pl', '.cz', '.nl', '.uk', '.fr', '.it', '.ro', '.sk', '.es', '.ch', '.se', '.dk', '.be'];
  if (foreignTlds.some(tld => emailLower.endsWith(tld))) {
    return false;
  }

  // Külföldi döntéshozók / nemzetközi fókuszú leadek kizárása
  const foreignKeywords = [
    'bohne', 'góźdź', 'polák', 'solomon', 'sekutowicz', 'matei', 'gucher', 'falkensteiner',
    'mehringer', 'mohrenschildt', 'zillinger', 'vohánka', 'jakúbek', 'reul', 'bone', 'morek',
    'kiseev', 'moroianu', 'kolesnik', 'willms', 'wolter', 'westerburg', 'rosenberg',
    'presetschnik', 'kornek', 'winter', 'lenze', 'löcher', 'winkler', 'schafleitner', 'etmenan'
  ];

  if (foreignKeywords.some(kw => nameLower.includes(kw))) {
    return false;
  }

  // 2. Magyar régió vagy hazai cég / döntéshozó név
  const isHuRegion = regionLower.includes('hungary') || regionLower.includes('magyarország') || regionLower.includes('hu');
  
  const huNameIndicators = [
    'péter', 'gondi', 'palovics', 'kovács', 'nemes', 'nagygyörgy', 'pinto', 'ferenc', 'károly', 
    'balázs', 'tibor', 'rudolf', 'lászló', 'zoltán', 'istván', 'gábor', 'jános', 'tamas', 'tamás', 
    'andrás', 'attila', 'lázár', 'sándor', 'györgy', 'zsolt', 'bence', 'máté', 'csapó', 'maráczi',
    'tóth', 'kiss', 'horváth', 'varga', 'szabó', 'molnár', 'németh', 'farkas', 'balog', 'takács'
  ];

  const hasHuName = huNameIndicators.some(nameKw => nameLower.includes(nameKw));

  if (isHuRegion || hasHuName) {
    return true;
  }

  return false;
}

// 3. Dinamikus CRM Leadek Kiolvasása Google Sheets-ből (Kizárólag Magyar Döntéshozók)
function fetchCrmLeadsFromGoogleSheets() {
  const masterSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_MASTER || "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
  const contactsSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_CONTACTS || "1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM";

  const fetchRowsFromSheet = (spreadsheetId, range = "A1:Z500") => {
    try {
      const cmd = `gws sheets spreadsheets values get --params "{\\"spreadsheetId\\":\\"${spreadsheetId}\\",\\"range\\":\\"${range}\\"}"`;
      const stdout = execSync(cmd, { encoding: 'utf8', shell: 'cmd.exe' });
      const parsed = JSON.parse(stdout);
      return parsed.values || [];
    } catch (e) {
      return [];
    }
  };

  const validLeads = [];

  const processSheetRows = (rows) => {
    if (rows.length <= 1) return;
    const firstRowHeader = rows[0].map(h => String(h || '').toLowerCase().trim());
    
    // Header mezők dinamikus azonosítása
    const findColIndex = (keywords, defaultIdx) => {
      const idx = firstRowHeader.findIndex(h => keywords.some(kw => h.includes(kw)));
      return idx !== -1 ? idx : defaultIdx;
    };

    let companyIdx = findColIndex(["cég", "company", "szervezet"], 0);
    let regionIdx = findColIndex(["régió", "fókusz", "ország", "region"], 2);
    let nameIdx = findColIndex(["kapcsolattartó", "név", "partner", "ügyfél", "name"], 5);
    let emailIdx = findColIndex(["email", "e-mail", "mail"], 7);
    let statusIdx = findColIndex(["státusz", "status", "állapot"], 13);

    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      let company = String(row[companyIdx] || row[0] || "").trim();
      let region = String(row[regionIdx] || row[2] || "").trim();
      let name = String(row[nameIdx] || row[5] || "").trim();
      let email = String(row[emailIdx] || row[7] || "").trim();
      let status = String(row[statusIdx] || row[13] || "").trim();

      // Ha az email mező hibás index miatt a névbe/LinkedIn URL-be került volna, tisztítjuk
      if (name.startsWith("http://") || name.startsWith("https://") || name.startsWith("www.")) {
        name = company || "Magyar Döntéshozó Partner";
      }

      if (isHungarianLead(company, region, name, email, status)) {
        if (!validLeads.some(l => l.email.toLowerCase() === email.toLowerCase())) {
          validLeads.push({
            company: company || "Magyar Vállalat",
            name: name || "Döntéshozó Partner",
            email: email
          });
        }
      }
      if (validLeads.length >= 10) break;
    }
  };

  // 1. Master CRM táblázat olvasása
  const masterRows = fetchRowsFromSheet(masterSpreadsheetId, "A1:Z500");
  processSheetRows(masterRows);

  // 2. Ha 10-nél kevesebb van, beolvassuk a CONTACTS sheet-et is
  if (validLeads.length < 10) {
    const contactsRows = fetchRowsFromSheet(contactsSpreadsheetId, "CONTACTS!A1:Z500");
    processSheetRows(contactsRows);
  }

  return validLeads.slice(0, 10);
}

// 4. Elegáns B2B HTML E-mail Sablon (Weboldal hivatkozás nélkül, ékezethelyes magyar nyelven)
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

// 5. gws CLI segítségével piszkozat létrehozása --upload kapcsolóval
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

// 6. Fő Futási Folyamat
async function main() {
  console.log("==========================================================");
  console.log("   Homola Mentor Kft. – Magyar Gmail Piszkozat-Generáló   ");
  console.log("==========================================================");

  // A) Kizárólag magyar leadek dinamikus betöltése Google Sheets-ből
  let leads = fetchCrmLeadsFromGoogleSheets();

  if (leads.length === 0) {
    console.log("[Info] Nem sikerült magyar leadeket találni, a teszt lead-et használjuk fallback-ként.");
    leads = [
      { company: "Homola Mentor Kft.", name: "Pohanka Péter", email: "peterpohankapersonal@gmail.com" }
    ];
  }

  // Csatolmány PDF kiválasztása
  let pdfPath = path.join(__dirname, '..', 'public', 'Portfolio_HU_v6.pdf');
  if (!fs.existsSync(pdfPath)) {
    pdfPath = path.join(__dirname, '..', 'Homola_Portfolio_Magazin_HU.pdf');
  }

  console.log(`[Info] Csatolmány PDF útvonala: ${pdfPath}`);
  console.log(`[Info] Szűrt Magyar Leadek Száma: ${leads.length}`);
  console.log("----------------------------------------------------------");

  let createdCount = 0;
  let failedCount = 0;

  for (const lead of leads) {
    if (!lead.email || lead.email.includes("Nincs email")) {
      console.warn(`[Kihagyva] ${lead.name} (${lead.company}): Nincs érvényes e-mail cím.`);
      continue;
    }

    const cleanLeadName = (lead.name.startsWith("http://") || lead.name.startsWith("https://")) ? lead.company : lead.name;
    const subject = `Homola Mentor Kft. – Prémium Off-Market Ingatlan és Globális Infrastruktúra Portfólió (2026)`;
    const htmlBody = getPortfolioEmailHtml(cleanLeadName);

    // MIME Nyers szöveg (RFC 822) előállítása
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
    const encodedToName = `=?UTF-8?B?${Buffer.from(cleanLeadName, 'utf8').toString('base64')}?=`;
    
    let mimeParts = [
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
      console.log(`[Siker] Magyar Piszkozat Elkészült: ${cleanLeadName} | Cég: ${lead.company} | E-mail: ${lead.email} -> Draft ID: ${gwsRes.id || gwsRes.message?.id || 'OK'}`);
      continue;
    } catch (gwsErr) {
      console.error(`[gws CLI Hiba] (${cleanLeadName}):`, gwsErr.stderr || gwsErr.message);
    }

    failedCount++;
    console.error(`[Hiba] Piszkozat készítése meghiúsult (${cleanLeadName} - ${lead.email}).`);
  }

  console.log("----------------------------------------------------------");
  console.log(`[Összegzés] Elkészült Magyar Piszkozatok: ${createdCount} | Hibás: ${failedCount}`);
  console.log("==========================================================");
}

if (require.main === module) {
  main();
}

module.exports = { main, getPortfolioEmailHtml, fetchCrmLeadsFromGoogleSheets, isHungarianLead };
