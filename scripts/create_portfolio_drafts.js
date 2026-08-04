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
function getGoogleAuthClients() {
  const tokenPaths = [
    process.env.GOOGLE_WORKSPACE_TOKEN_FILE,
    'F:\\mcp-brunella-core\\ops\\credentials\\google-token.json',
    'Z:\\001_Workspace\\Könyvelés\\config\\google-token.json',
    path.join(__dirname, '..', 'credentials', 'google-token.json')
  ].filter(Boolean);

  let tokenData = null;
  for (const tPath of tokenPaths) {
    if (fs.existsSync(tPath)) {
      try {
        tokenData = JSON.parse(fs.readFileSync(tPath, 'utf8'));
        break;
      } catch (e) {}
    }
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || tokenData?.refresh_token;

  const opsCredsDir = 'F:\\mcp-brunella-core\\ops\\credentials';
  const clientSecretFiles = [];
  if (fs.existsSync(opsCredsDir)) {
    const files = fs.readdirSync(opsCredsDir);
    files.filter(f => f.startsWith('client_secret') && f.endsWith('.json')).forEach(f => {
      clientSecretFiles.push(path.join(opsCredsDir, f));
    });
  }

  const clients = [];

  for (const cPath of clientSecretFiles) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cPath, 'utf8'));
      const cData = parsed.installed || parsed.web || parsed;
      if (cData?.client_id && cData?.client_secret) {
        const oauth2Client = new google.auth.OAuth2(
          cData.client_id,
          cData.client_secret,
          'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({
          refresh_token: refreshToken,
          access_token: tokenData?.access_token
        });
        clients.push({ client: oauth2Client, name: path.basename(cPath) });
      }
    } catch (e) {}
  }

  // Meglévő env kliens
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: tokenData?.access_token
    });
    clients.unshift({ client: oauth2Client, name: 'env-default' });
  }

  return clients;
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

const tls = require('tls');

// IMAP over TLS segítségével piszkozat mentése a Drafts mappába (App Password használatával)
function appendDraftViaImap({ user, pass, mimeRaw }) {
  return new Promise((resolve, reject) => {
    let socket;
    const timeout = setTimeout(() => {
      if (socket) socket.destroy();
      reject(new Error("IMAP csatlakozási időtúllépés (10 mp)."));
    }, 10000);

    socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false }, () => {
      let state = 'CONNECTED';
      let buffer = '';
      let folderIndex = 0;
      const folders = ['Drafts', '[Gmail]/Drafts', '[Gmail]/Piszkozatok'];

      const send = (cmd) => {
        socket.write(cmd + '\r\n');
      };

      const tryNextFolder = () => {
        if (folderIndex >= folders.length) {
          clearTimeout(timeout);
          socket.end();
          return reject(new Error("Egyik Piszkozat mappa (Drafts / [Gmail]/Drafts / [Gmail]/Piszkozatok) sem érhető el IMAP-on."));
        }
        const folder = folders[folderIndex++];
        state = 'APPENDING';
        const mimeBuffer = Buffer.from(mimeRaw, 'utf8');
        send(`A2 APPEND "${folder}" (\\Draft) {${mimeBuffer.length}}`);
      };

      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line) continue;
          if (state === 'CONNECTED' && line.includes('* OK')) {
            state = 'LOGGING_IN';
            send(`A1 LOGIN "${user}" "${pass.replace(/"/g, '')}"`);
          } else if (state === 'LOGGING_IN' && line.includes('A1 OK')) {
            tryNextFolder();
          } else if (state === 'APPENDING' && (line.startsWith('+') || line.includes('+ Ready'))) {
            state = 'SENDING_DATA';
            socket.write(mimeRaw + '\r\n');
          } else if (state === 'SENDING_DATA' && line.includes('A2 OK')) {
            state = 'LOGGING_OUT';
            send(`A3 LOGOUT`);
            clearTimeout(timeout);
            socket.end();
            resolve({ id: 'imap_draft_' + Date.now() });
          } else if (state === 'APPENDING' && line.includes('A2 NO')) {
            tryNextFolder();
          } else if (line.includes('A1 NO') || line.includes('A1 BAD') || line.includes('A2 BAD')) {
            clearTimeout(timeout);
            socket.end();
            reject(new Error(`IMAP elutasítva: ${line}`));
          }
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
}

const { execSync } = require('child_process');

// gws CLI segítségével piszkozat létrehozása --upload kapcsolóval
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
      console.log(`[Siker] Piszkozat sikeresen elkészült a Gmailben (gws CLI): ${lead.name} (${lead.email}) -> Draft ID: ${gwsRes.id || gwsRes.message?.id || 'OK'}`);
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

module.exports = { main, createMimeMessage, getPortfolioEmailHtml };
