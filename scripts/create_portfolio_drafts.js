/**
 * Homola Mentor Kft. – Automata Portfólió Piszkozat-Generáló Szkript
 * 
 * Ez a szkript NEM küld automatikusan levelet, hanem felkészíti és elmenti a B2B 
 * kiajánló e-maileket a Gmail Piszkozatok (Drafts) mappájába a megadott csatolmánnyal.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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

// 2. Google OAuth2 / Auth Kliens Inicializálása
function getGoogleAuthClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  if (serviceAccountEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    return new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/gmail.drafts',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://mail.google.com/'
      ],
      subject: 'office.homlamentor@gmail.com'
    });
  }

  throw new Error("Hiányzó Google Auth beállítások! Ellenőrizd a .env fájl GOOGLE_SERVICE_ACCOUNT_EMAIL vagy OAuth2 változóit.");
}

// 3. MIME Nyers Üzenet Összeállítása (Base64url UTF-8 és PDF Csatolmánnyal)
function createMimeMessage({ toName, toEmail, subject, htmlBody, attachmentPath }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;

  let mimeParts = [
    `From: Homola Mentor Kft. <office.homlamentor@gmail.com>`,
    `To: ${toName} <${toEmail}>`,
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

  // Csatolmány beolvasása (ha létezik a PDF)
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    const filename = path.basename(attachmentPath);
    const fileBuffer = fs.readFileSync(attachmentPath);
    const base64File = fileBuffer.toString('base64');

    mimeParts.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64File,
      ``
    );
  } else {
    console.warn(`[Figyelmeztetés] A csatolmány fájl nem található a megadott útvonalon: ${attachmentPath}`);
  }

  mimeParts.push(`--${boundary}--`);

  const fullMimeString = mimeParts.join('\r\n');

  // RFC 2822 Nyers üzenet Base64URL kódolása a Gmail API részére
  return Buffer.from(fullMimeString, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 4. Elegáns B2B HTML E-mail Sablon
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

      <p>Engedje meg,hogy a <strong>Homola Mentor Kft.</strong> nevében közvetlenül figyelmébe ajánljam legújabb, kifejezetten zártkörű partnereinknek összeállított <strong>"Prémium Off-Market Ingatlan és Globális Infrastruktúra Portfólió (2026)"</strong> kiadványunkat.</p>

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
        E-mail: office.homlamentor@gmail.com • Web: <a href="https://homolamentor.hu" style="color: #d97706; text-decoration: none;">homolamentor.hu</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 5. Címlista Logika és Fő Futási Folyamat
async function main() {
  console.log("==========================================================");
  console.log("   Homola Mentor Kft. – Gmail Piszkozat-Generáló Indítása");
  console.log("==========================================================");

  // A) Első futtatáshoz használt teszt tömb
  const leads = [
    { name: "Pohanka Péter", email: "peterpohankapersonal@gmail.com" }
  ];

  /*
  // B) Jövőbeli Dinamikus Logika (Master CRM vagy Google API alapján):
  // const crmRes = await fetch("http://localhost:3000/api/crm-sync");
  // const crmData = await crmRes.json();
  // const leads = crmData.activities.map(a => ({ name: a.name, email: a.email }));
  */

  // Csatolmány PDF kiválasztása
  let pdfPath = path.join(__dirname, '..', 'public', 'Portfolio_HU_v6.pdf');
  if (!fs.existsSync(pdfPath)) {
    pdfPath = path.join(__dirname, '..', 'Homola_Portfolio_Magazin_HU.pdf');
  }

  console.log(`[Info] Csatolmány PDF útvonala: ${pdfPath}`);
  console.log(`[Info] Feldolgozandó leadek száma: ${leads.length}`);

  try {
    const auth = getGoogleAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    let createdCount = 0;
    let failedCount = 0;

    for (const lead of leads) {
      if (!lead.email || lead.email.includes("Nincs email")) {
        console.warn(`[Kihagyva] ${lead.name}: Nincs érvényes e-mail cím.`);
        continue;
      }

      try {
        const subject = `Homola Mentor Kft. – Prémium Off-Market Ingatlan és Globális Infrastruktúra Portfólió (2026)`;
        const htmlBody = getPortfolioEmailHtml(lead.name);

        const rawBase64Url = createMimeMessage({
          toName: lead.name,
          toEmail: lead.email,
          subject,
          htmlBody,
          attachmentPath: pdfPath
        });

        // Szigorúan PISZKOZAT (Draft) létrehozása (NEM KÜLDÉS!)
        const res = await gmail.users.drafts.create({
          userId: 'me',
          requestBody: {
            message: {
              raw: rawBase64Url
            }
          }
        });

        createdCount++;
        console.log(`[Siker] Piszkozat létrehozva: ${lead.name} (${lead.email}) -> Draft ID: ${res.data.id}`);
      } catch (leadErr) {
        failedCount++;
        console.error(`[Hiba] Piszkozat készítése meghiúsult (${lead.name} - ${lead.email}):`, leadErr.message);
      }
    }

    console.log("----------------------------------------------------------");
    console.log(`[Összegzés] Elkészült piszkozatok: ${createdCount} | Hibás: ${failedCount}`);
    console.log("==========================================================");
  } catch (err) {
    console.error("[Kritikus Hiba] Nem sikerült kapcsolódni a Gmail API-hoz:", err.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, createMimeMessage, getPortfolioEmailHtml };
