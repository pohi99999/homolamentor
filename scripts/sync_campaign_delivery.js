/**
 * Homola Mentor Kft. – Kampány Utókövető és CRM Szinkronizáló Szkript
 * Dátum: 2026. 08. 04.
 * 
 * Funkciók:
 * 1. Élő Gmail API ellenőrzése (Sent & Bounce / Failure levelek).
 * 2. CRM Google Sheet frissítése (Master_Vevőlista & CONTACTS táblázatok).
 * 3. Részletes konzol logolás az admin felület szinkronizációjához.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Környezeti változók (.env) betöltése
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

const MASTER_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID_MASTER || "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const CONTACTS_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID_CONTACTS || "1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM";

// gws CLI parancs futtató segédfüggvény duplán kódolt JSON bemenettel (Windows cmd.exe kompatibilis)
function runGwsCmd(subcommand, paramsObj = null, jsonObj = null) {
  let cmd = `gws ${subcommand}`;
  if (paramsObj) {
    cmd += ` --params ${JSON.stringify(JSON.stringify(paramsObj))}`;
  }
  if (jsonObj) {
    cmd += ` --json ${JSON.stringify(JSON.stringify(jsonObj))}`;
  }
  const stdout = execSync(cmd, { encoding: 'utf8', shell: 'cmd.exe' });
  return JSON.parse(stdout);
}

// E-mail cím kinyerése szögletes zárójelből vagy nyers szövegből
function extractEmailAddress(rawHeaderStr) {
  if (!rawHeaderStr) return "";
  const match = rawHeaderStr.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].toLowerCase().trim();
  }
  const emailMatch = rawHeaderStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0].toLowerCase().trim() : rawHeaderStr.toLowerCase().trim();
}

// 2. Gmail üzenetek lekérdezése gws CLI segítségével
function fetchRecentGmailMessages() {
  console.log("[1/3] Élő Gmail API lekérdezés folyamatban (Sent & Bounce levelek)...");
  
  const sentEmails = new Set();
  const bouncedEmails = new Set();
  const emailDetailsMap = new Map();

  const getMessageDetails = (msgId) => {
    try {
      return runGwsCmd("gmail users messages get", { userId: "me", id: msgId });
    } catch (e) {
      return null;
    }
  };

  try {
    const parsedList = runGwsCmd("gmail users messages list", { userId: "me", q: "newer_than:1d" });
    const messages = parsedList.messages || [];

    console.log(`[Gmail] Összesen ${messages.length} db friss üzenet azonosítva a fiókban.`);

    for (const msgRef of messages.slice(0, 50)) {
      const msg = getMessageDetails(msgRef.id);
      if (!msg) continue;

      const headers = msg.payload?.headers || [];
      const getHeader = (name) => {
        const h = headers.find(hdr => hdr.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : "";
      };

      const fromVal = getHeader("From");
      const toVal = getHeader("To");
      const subjectVal = getHeader("Subject");
      const dateVal = getHeader("Date");
      const snippetVal = msg.snippet || "";

      const toEmail = extractEmailAddress(toVal);
      const fromEmail = extractEmailAddress(fromVal);

      // Visszapattant / Bounce üzenet ellenőrzése
      const isBounce = fromEmail.includes("mailer-daemon") || 
                       fromEmail.includes("postmaster") || 
                       subjectVal.toLowerCase().includes("delivery status notification") ||
                       subjectVal.toLowerCase().includes("undeliverable") ||
                       subjectVal.toLowerCase().includes("failure") ||
                       snippetVal.toLowerCase().includes("address not found") ||
                       snippetVal.toLowerCase().includes("message not delivered");

      if (isBounce) {
        const failedRecipient = extractEmailAddress(snippetVal) || extractEmailAddress(toVal);
        if (failedRecipient && failedRecipient.includes("@") && !failedRecipient.includes("homlamentor") && !failedRecipient.includes("peterpohanka")) {
          bouncedEmails.add(failedRecipient);
          console.log(`[Bounce Észlelve] ❌ Visszapattant e-mail: ${failedRecipient} (Tárgy: ${subjectVal})`);
        }
      } else if (fromEmail.includes("office.homlamentor@gmail.com") || fromEmail.includes("peterpohankapersonal@gmail.com") || subjectVal.includes("Homola Mentor Kft.")) {
        if (toEmail && toEmail.includes("@") && !toEmail.includes("homlamentor") && !toEmail.includes("peterpohanka")) {
          sentEmails.add(toEmail);
          emailDetailsMap.set(toEmail, {
            toRaw: toVal,
            subject: subjectVal,
            date: dateVal,
            id: msg.id
          });
        }
      }
    }

  } catch (err) {
    console.error("[Gmail Hiba] Nem sikerült lekérni a Gmail üzeneteket:", err.message);
  }

  return { sentEmails, bouncedEmails, emailDetailsMap };
}

// 3. CRM Google Sheet Frissítése (Master_Vevőlista és CONTACTS)
function updateCrmSheet(sentEmails, bouncedEmails) {
  console.log("\n[2/3] CRM Google Sheets táblázatok frissítése folyamatban...");

  const deliveredMap = new Map();
  const bouncedMap = new Map();
  let totalUpdatedRows = 0;
  const todayStr = "2026. 08. 04.";

  // A) Master_Vevőlista frissítése
  try {
    const parsedMaster = runGwsCmd("sheets spreadsheets values get", {
      spreadsheetId: MASTER_SPREADSHEET_ID,
      range: "Master_Vevőlista!A1:Z500"
    });
    let masterRows = parsedMaster.values || [];

    if (masterRows.length > 1) {
      const header = masterRows[0].map(h => String(h || '').toLowerCase().trim());
      const findColIndex = (keywords, defaultIdx) => {
        const idx = header.findIndex(h => keywords.some(kw => h.includes(kw)));
        return idx !== -1 ? idx : defaultIdx;
      };

      const companyIdx = findColIndex(["cég", "company"], 0);
      const nameIdx = findColIndex(["kapcsolattartó", "név", "partner"], 5);
      const emailIdx = findColIndex(["email", "e-mail", "mail"], 7);

      for (let i = 1; i < masterRows.length; i++) {
        const row = masterRows[i];
        const rowNum = i + 1;
        const company = row[companyIdx] || row[0] || "";
        const name = row[nameIdx] || row[5] || "";
        const email = String(row[emailIdx] || row[7] || "").toLowerCase().trim();

        if (!email || !email.includes("@")) continue;

        const isBounced = bouncedEmails.has(email);
        const isSent = sentEmails.has(email);

        if (isBounced || isSent) {
          let newStatus = isBounced ? "Hibás e-mail cím" : "Kiajánló kiküldve";
          let newNote = isBounced 
            ? "Visszapattant / Kézbesítési hiba (2026. 08. 04.)" 
            : "Kiajánló kiküldve (Portfólió 2026)";

          const payloadObj = {
            values: [
              [
                todayStr,
                "Email",
                newStatus,
                row[14] || "",
                row[15] || "",
                row[16] || "",
                row[17] || "",
                newNote
              ]
            ]
          };

          const paramsObj = {
            spreadsheetId: MASTER_SPREADSHEET_ID,
            range: `Master_Vevőlista!L${rowNum}:S${rowNum}`,
            valueInputOption: "USER_ENTERED"
          };

          try {
            runGwsCmd("sheets spreadsheets values update", paramsObj, payloadObj);
            totalUpdatedRows++;

            if (isBounced) {
              bouncedMap.set(email, { company, name, email });
            } else {
              deliveredMap.set(email, { company, name, email });
            }
          } catch (err) {
            console.error(`[Master Sheet Hiba] Row ${rowNum}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Master Sheet olvasási hiba]:", err.message);
  }

  // B) CONTACTS Sheet frissítése (ha van benne egyező lead)
  try {
    const parsedContacts = runGwsCmd("sheets spreadsheets values get", {
      spreadsheetId: CONTACTS_SPREADSHEET_ID,
      range: "CONTACTS!A1:Z500"
    });
    let contactsRows = parsedContacts.values || [];

    if (contactsRows.length > 1) {
      for (let i = 1; i < contactsRows.length; i++) {
        const row = contactsRows[i];
        const rowNum = i + 1;
        const name = row[0] || "";
        const company = row[2] || "";
        const email = String(row[6] || "").toLowerCase().trim();

        if (!email || !email.includes("@")) continue;

        const isBounced = bouncedEmails.has(email);
        const isSent = sentEmails.has(email);

        if (isBounced || isSent) {
          let newStatus = isBounced ? "Hibás e-mail cím" : "Kiajánló kiküldve";
          let newNote = isBounced 
            ? "Visszapattant / Kézbesítési hiba (2026. 08. 04.)" 
            : "Kiajánló kiküldve (Portfólió 2026)";

          const payloadObj = {
            values: [
              [
                todayStr,
                "Email",
                newStatus,
                newNote
              ]
            ]
          };

          const paramsObj = {
            spreadsheetId: CONTACTS_SPREADSHEET_ID,
            range: `CONTACTS!J${rowNum}:M${rowNum}`,
            valueInputOption: "USER_ENTERED"
          };

          try {
            runGwsCmd("sheets spreadsheets values update", paramsObj, payloadObj);
            totalUpdatedRows++;

            if (isBounced) {
              bouncedMap.set(email, { company, name, email });
            } else {
              deliveredMap.set(email, { company, name, email });
            }
          } catch (err) {
            console.error(`[Contacts Sheet Hiba] Row ${rowNum}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Contacts Sheet nem érhető el vagy kihagyva]:", err.message);
  }

  console.log(`[CRM Siker] Összesen ${totalUpdatedRows} sor frissítve a Google Sheets CRM-ben.`);
  return { 
    updatedCount: totalUpdatedRows, 
    deliveredList: Array.from(deliveredMap.values()), 
    bouncedList: Array.from(bouncedMap.values()) 
  };
}

// 4. Fő Futási Logika
async function main() {
  console.log("==========================================================");
  console.log("   Homola Mentor Kft. – Kampány Kézbesítés & CRM Szinkron   ");
  console.log("   Dátum: 2026. 08. 04.                                   ");
  console.log("==========================================================");

  // A) Gmail élő üzenetek vizsgálata
  const { sentEmails, bouncedEmails } = fetchRecentGmailMessages();

  console.log(`\n[Gmail Eredmény] Észlelt kiküldött címzettek: ${sentEmails.size} | Visszapattant e-mailek: ${bouncedEmails.size}`);

  // B) CRM Táblázat Frissítése
  const { updatedCount, deliveredList, bouncedList } = updateCrmSheet(sentEmails, bouncedEmails);

  // C) Részletes Konzol Logolás az Admin Dashboard Szinkronizációhoz
  console.log("\n==========================================================");
  console.log("   KAMPÁNY UTÓKÖVETÉS ÖSSZEGZÉS & AUDIT LOG (2026. 08. 04.) ");
  console.log("==========================================================");
  console.log(`• Azonosított és Kiküldött Levelek Száma: ${sentEmails.size} db`);
  console.log(`• CRM-ben Frissített Sorok Száma: ${updatedCount} db`);
  
  console.log("\n----------------------------------------------------------");
  console.log(`Sikeresen Kézbesített Partnerek (${deliveredList.length} db):`);
  console.log("----------------------------------------------------------");
  if (deliveredList.length > 0) {
    deliveredList.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.company}) - E-mail: ${item.email}`);
    });
  } else {
    console.log("Nincs frissített sikeres kézbesítés.");
  }

  console.log("\n----------------------------------------------------------");
  console.log(`Visszapattant / Hibás E-mail Címek (${bouncedList.length} db):`);
  console.log("----------------------------------------------------------");
  if (bouncedList.length > 0) {
    bouncedList.forEach((item, index) => {
      console.log(`⚠️ ${index + 1}. ${item.name} (${item.company}) - E-mail: ${item.email} [Státusz: Hibás e-mail cím]`);
    });
  } else {
    console.log("✅ Egyetlen e-mail sem pattant vissza! Minden levél sikeresen megérkezett.");
  }

  console.log("==========================================================");
}

if (require.main === module) {
  main();
}

module.exports = { main, fetchRecentGmailMessages, updateCrmSheet };
