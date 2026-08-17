/**
 * Google OAuth Refresh Token generáló — az OAuth Playground kiváltására.
 *
 * MIÉRT: a developers.google.com/oauthplayground oldal a felhasználó böngészőjében
 * nem töltődik be helyesen (a stíluslapok és a JS blokkolva vannak, ezért az
 * "Authorize APIs" gomb halott). Ez a szkript ugyanazt a folyamatot végzi el
 * helyben, külső oldal nélkül.
 *
 * MIT CSINÁL
 *   1. Bekéri a Google OAuth **client secret**-et (a gépelés maszkolva van).
 *   2. Elindít egy ideiglenes helyi szervert a REDIRECT_PORT porton.
 *   3. Kiír egy URL-t — ezt megnyitva bejelentkezel és engedélyezed a hozzáférést.
 *   4. Elkapja a visszakapott `code`-ot, és refresh tokenre váltja.
 *   5. A refresh tokent **FÁJLBA** írja, NEM a képernyőre — így nem kerül bele
 *      a terminál-előzménybe, naplóba vagy ügynök-beszélgetésbe.
 *
 * HASZNÁLAT (a felhasználó futtatja, mert interaktív):
 *   node scripts/get_refresh_token.js
 *
 * A végén a kiírt fájlból másold a tokent a Vercelbe `GOOGLE_REFRESH_TOKEN`
 * néven, majd a fájlt töröld.
 */

const http = require("http");
const https = require("https");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { URL, URLSearchParams } = require("url");

// --- Beállítások ---------------------------------------------------------
const CLIENT_ID =
  "852479495107-mhr459gbhnaebjqrhcme9k8a23hnm7o8.apps.googleusercontent.com";
const REDIRECT_PORT = 5555;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const OUT_FILE = path.join(__dirname, "..", "REFRESH_TOKEN.txt");

// --- Maszkolt bevitel a secrethez ---------------------------------------
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let value = "";
    // A beírt karaktereket csillaggal helyettesítjük, hogy a secret ne
    // maradjon olvashatóan a terminál-előzményben.
    rl._writeToOutput = function (chunk) {
      if (rl.stdoutMuted) {
        if (chunk === "\r\n" || chunk === "\n") rl.output.write(chunk);
        else rl.output.write("*");
      } else {
        rl.output.write(chunk);
      }
    };
    rl.question(question, (answer) => {
      rl.stdoutMuted = false;
      rl.output.write("\n");
      rl.close();
      value = answer.trim();
      resolve(value);
    });
    rl.stdoutMuted = true;
  });
}

// --- Token csere ---------------------------------------------------------
function exchangeCodeForTokens(code, clientSecret) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString();

    const req = https.request(
      {
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(`${parsed.error}: ${parsed.error_description || ""}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error("Értelmezhetetlen válasz a Google-tól."));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("==========================================================");
  console.log("  Google Refresh Token generálás (Playground nélkül)");
  console.log("==========================================================\n");
  console.log(`Client ID    : ${CLIENT_ID.slice(0, 24)}... (nyilvános azonosító)`);
  console.log(`Redirect URI : ${REDIRECT_URI}`);
  console.log(`Scope        : ${SCOPE}\n`);

  const clientSecret = await askHidden(
    "Illeszd be a Google OAuth client secretet (a gépelés rejtve marad), majd Enter:\n> "
  );

  if (!clientSecret) {
    console.error("\n[Hiba] Nem adtál meg client secretet. Kilépés.");
    process.exit(1);
  }

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPE,
      // access_type=offline + prompt=consent együtt garantálja, hogy a Google
      // MINDIG adjon refresh tokent (különben csak az első engedélyezéskor ad).
      access_type: "offline",
      prompt: "consent",
    }).toString();

  const server = http.createServer(async (req, res) => {
    if (!req.url.startsWith("/oauth2callback")) {
      res.writeHead(404).end("Not found");
      return;
    }

    const parsed = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
    const code = parsed.searchParams.get("code");
    const error = parsed.searchParams.get("error");

    if (error) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>Engedélyezés megtagadva</h2><p>${error}</p>`);
      console.error(`\n[Hiba] A Google elutasította: ${error}`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400).end("Hiányzó code");
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code, clientSecret);

      if (!tokens.refresh_token) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h2>Nem érkezett refresh token</h2><p>Nézd meg a terminált.</p>");
        console.error(
          "\n[Hiba] A Google nem adott refresh tokent.\n" +
            "Vond vissza a hozzáférést itt: https://myaccount.google.com/permissions\n" +
            "majd futtasd újra ezt a szkriptet."
        );
        server.close();
        process.exit(1);
      }

      // A tokent KIZÁRÓLAG fájlba írjuk — soha nem a képernyőre.
      fs.writeFileSync(OUT_FILE, tokens.refresh_token, { encoding: "utf8" });

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<h2 style='font-family:sans-serif'>Sikeres! ✅</h2>" +
          "<p style='font-family:sans-serif'>A refresh token elkészült. " +
          "Visszatérhetsz a terminálba — ezt az ablakot bezárhatod.</p>"
      );

      console.log("\n==========================================================");
      console.log("  SIKER ✅  A refresh token elkészült.");
      console.log("==========================================================");
      console.log(`\n  A token ebbe a fájlba került (NEM a képernyőre):\n\n    ${OUT_FILE}\n`);
      console.log("  Teendő:");
      console.log("   1. Nyisd meg a fájlt, másold ki a tartalmát.");
      console.log("   2. Vercel -> Environment Variables -> GOOGLE_REFRESH_TOKEN");
      console.log("      (mind a három környezetre), Save, majd Redeploy.");
      console.log("   3. Ezután TÖRÖLD ezt a fájlt.\n");
      console.log(`  Ellenőrzés: a token ${tokens.refresh_token.length} karakter hosszú,`);
      console.log(`  és így kezdődik: ${tokens.refresh_token.slice(0, 3)}...\n`);

      server.close();
      process.exit(0);
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h2>Hiba</h2><pre>${err.message}</pre>`);
      console.error(`\n[Hiba] Token csere sikertelen: ${err.message}`);
      if (/invalid_client/i.test(err.message)) {
        console.error("  -> A client secret nem stimmel. Ellenőrizd, és futtasd újra.");
      }
      if (/redirect_uri_mismatch/i.test(err.message)) {
        console.error(`  -> A(z) ${REDIRECT_URI} nincs felvéve a Google kliens`);
        console.error("     'Authorized redirect URIs' listájába.");
      }
      server.close();
      process.exit(1);
    }
  });

  server.listen(REDIRECT_PORT, () => {
    console.log("\n----------------------------------------------------------");
    console.log("  NYISD MEG EZT AZ URL-T A BÖNGÉSZŐDBEN:");
    console.log("----------------------------------------------------------\n");
    console.log(authUrl);
    console.log("\n----------------------------------------------------------");
    console.log("  Jelentkezz be a  peterpohankapersonal@gmail.com  fiókkal!");
    console.log("  Az 'unverified app' figyelmeztetésnél:");
    console.log("    Advanced -> Go to ... (unsafe) -> Continue");
    console.log("----------------------------------------------------------");
    console.log("\n(Várakozás a böngészőből érkező válaszra...)\n");
  });
}

main();
