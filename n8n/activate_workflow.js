/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const http = require('http');

// 1. Környezeti változók beolvasása a külső .env fájlból
const externalEnvPath = 'E:/OneDrive/Desktop/profil építés/.env';
let n8nEmail = 'dev@localhost.com';
let n8nPassword = 'DevPass2026!';
let n8nBaseUrl = 'http://localhost:5678';

if (fs.existsSync(externalEnvPath)) {
  console.log(`Beolvasás a külső .env fájlból: ${externalEnvPath}`);
  const envContent = fs.readFileSync(externalEnvPath, 'utf-8');
  
  const emailMatch = envContent.match(/^N8N_OWNER_EMAIL=(.*)$/m);
  if (emailMatch) n8nEmail = emailMatch[1].trim().replace(/['"]/g, '');
  
  const passwordMatch = envContent.match(/^N8N_OWNER_PASSWORD=(.*)$/m);
  if (passwordMatch) n8nPassword = passwordMatch[1].trim().replace(/['"]/g, '');
} else {
  console.warn(`A megadott külső .env fájl nem található: ${externalEnvPath}`);
}

console.log(`n8n Cím: ${n8nBaseUrl}`);
console.log(`Tulajdonos E-mail: ${n8nEmail}`);

let authCookie = '';

// Helper funkció a HTTP kérésekhez (Cookie kezeléssel)
function makeRequest(urlStr, method, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authCookie) {
      options.headers['Cookie'] = authCookie;
    }

    const req = http.request(options, (res) => {
      // Megőrizzük a kapott auth cookie-t
      if (res.headers['set-cookie']) {
        const cookies = res.headers['set-cookie'];
        const authCookieMatch = cookies.find(c => c.startsWith('n8n-auth='));
        if (authCookieMatch) {
          authCookie = authCookieMatch.split(';')[0];
        }
      }

      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  try {
    // 1. Bejelentkezés a belső API-n keresztül
    console.log('\n1. Bejelentkezés a helyi n8n szerverre...');
    const loginRes = await makeRequest(`${n8nBaseUrl}/rest/login`, 'POST', {
      emailOrLdapLoginId: n8nEmail,
      password: n8nPassword
    });

    if (loginRes.statusCode !== 200) {
      throw new Error(`Nem sikerült a bejelentkezés (Státuszkód: ${loginRes.statusCode}): ${loginRes.body}`);
    }
    console.log('✓ Sikeresen bejelentkezve. Auth Cookie mentve.');

    // 2. Credentials lekérdezése
    console.log('\n2. Létező n8n Credentials-ök lekérdezése...');
    const credsRes = await makeRequest(`${n8nBaseUrl}/rest/credentials`, 'GET');
    
    let credentialsList = [];
    if (credsRes.statusCode === 200) {
      const data = JSON.parse(credsRes.body);
      credentialsList = data.data || data || [];
      console.log(`✓ Lekérdezve ${credentialsList.length} credential.`);
    } else {
      console.warn(`⚠ Nem sikerült lekérdezni a credentials listát (Státuszkód: ${credsRes.statusCode}).`);
    }

    // Google Sheets és Gmail credential keresése a szerveren
    let gmailCredId = '';
    let sheetsCredId = '';
    
    if (Array.isArray(credentialsList)) {
      credentialsList.forEach(cred => {
        if (cred.type === 'gmailOAuth2') {
          gmailCredId = cred.id;
          console.log(`Found Gmail Credential ID: ${gmailCredId} (${cred.name})`);
        }
        if (cred.type === 'googleSheetsOAuth2' || cred.type === 'googleApi') {
          sheetsCredId = cred.id;
          console.log(`Found Google Sheets/API Credential ID: ${sheetsCredId} (${cred.name})`);
        }
      });
    }

    // 3. Helyi workflow JSON beolvasása és injektálása
    console.log('\n3. Helyi workflow JSON beolvasása és injektálása...');
    const workflowPath = path.join(__dirname, 'homola_b2b_campaign_workflow.json');
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`Nem található a workflow fájl: ${workflowPath}`);
    }
    
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    
    // Injektáljuk a megfelelő ID-kat és hitelesítéseket a workflow-ba
    workflow.nodes.forEach(node => {
      // Google Sheets node testreszabása
      if (node.type === 'n8n-nodes-base.googleSheets') {
        node.parameters.documentId = {
          "__rl": true,
          "value": "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ",
          "mode": "id"
        };
        if (sheetsCredId) {
          node.credentials = {
            "googleSheetsOAuth2": {
              "id": sheetsCredId,
              "name": "Google Sheets Connection"
            }
          };
        } else if (gmailCredId) {
          node.credentials = {
            "googleSheetsOAuth2": {
              "id": gmailCredId,
              "name": "Google Sheets (via Gmail Connection)"
            }
          };
        }
      }
      // Gmail node testreszabása
      if (node.type === 'n8n-nodes-base.gmail') {
        if (gmailCredId) {
          node.credentials = {
            "gmailOAuth2": {
              "id": gmailCredId,
              "name": "Gmail Account (office.homlamentor@gmail.com)"
            }
          };
        }
      }
    });

    // 4. Workflow meglétének ellenőrzése
    console.log('\n4. Workflow meglétének ellenőrzése a szerveren...');
    const workflowsRes = await makeRequest(`${n8nBaseUrl}/rest/workflows`, 'GET');
    let existingWorkflow = null;
    
    if (workflowsRes.statusCode === 200) {
      const data = JSON.parse(workflowsRes.body);
      const list = data.data || data || [];
      if (Array.isArray(list)) {
        existingWorkflow = list.find(w => w.name === workflow.name);
      }
    }

    let saveUrl = `${n8nBaseUrl}/rest/workflows`;
    let method = 'POST';
    
    // Aktiváljuk a munkafolyamatot a mentéssel egy időben
    workflow.active = true;
    
    if (existingWorkflow) {
      console.log(`✓ A workflow már létezik (ID: ${existingWorkflow.id}). Módosítás (PATCH) következik.`);
      saveUrl = `${n8nBaseUrl}/rest/workflows/${existingWorkflow.id}`;
      method = 'PATCH';
      workflow.id = existingWorkflow.id;
    } else {
      console.log('A workflow még nem létezik. Új létrehozása (POST ID nélkül) következik.');
      delete workflow.id; // POST-nál a szerver generálja
    }

    // Elmentjük lokálisan is a módosított JSON-t
    fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

    // 5. Workflow importálása, frissítése és AKTIVÁLÁSA
    console.log('\n5. Workflow importálása, frissítése és AKTIVÁLÁSA...');
    const saveRes = await makeRequest(saveUrl, method, workflow);
    
    if (saveRes.statusCode === 200) {
      const savedData = JSON.parse(saveRes.body);
      const savedId = savedData.id || (savedData.data && savedData.data.id);
      
      if (!savedId) {
        throw new Error(`Nem sikerült kinyerni a mentett workflow ID-ját: ${saveRes.body}`);
      }
      
      console.log(`✓ Workflow sikeresen mentve! (ID: ${savedId})`);
      
      // 6. Kifejezett aktiválási kérés küldése (PATCH /rest/workflows/{id} body: { active: true })
      console.log('\n6. Workflow aktiválása (active: true)...');
      const activateRes = await makeRequest(`${n8nBaseUrl}/rest/workflows/${savedId}`, 'PATCH', {
        active: true
      });
      
      let finalActiveState = false;
      if (activateRes.statusCode === 200) {
        const activeData = JSON.parse(activateRes.body);
        finalActiveState = activeData.active || (activeData.data && activeData.data.active) || false;
      }
      
      console.log('========================================================================');
      console.log(`✓ SUCCESS: Az n8n workflow mentési folyamata lefutott!`);
      console.log(`✓ Workflow ID: ${savedId}`);
      console.log(`✓ Aktív státusz a szerveren: ${finalActiveState ? 'ACTIVE' : 'INACTIVE (OAuth hitelesítés szükséges a helyi n8n felületen)'}`);
      console.log(`✓ Helyi Production Webhook URL: http://localhost:5678/webhook/${savedId}/webhook`);
      console.log('========================================================================');
    } else {
      console.error(`❌ Hiba a workflow mentése során (Státuszkód: ${saveRes.statusCode})`);
      console.error(saveRes.body);
    }
  } catch (err) {
    console.error(`❌ Kivétel történt a folyamat futtatása közben: ${err.message}`);
  }
}

main();
