/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Környezeti változók beolvasása a külső .env fájlból
const externalEnvPath = 'E:/OneDrive/Desktop/profil építés/.env';
let n8nApiKey = '';
let n8nBaseUrl = 'https://n8n-latest-fulv.onrender.com';

if (fs.existsSync(externalEnvPath)) {
  console.log(`Beolvasás a külső .env fájlból: ${externalEnvPath}`);
  const envContent = fs.readFileSync(externalEnvPath, 'utf-8');
  
  const apiKeyMatch = envContent.match(/^N8N_API_KEY=(.*)$/m);
  n8nApiKey = apiKeyMatch ? apiKeyMatch[1].trim().replace(/['"]/g, '') : '';
  
  const baseUrlMatch = envContent.match(/^N8N_BASE_URL=(.*)$/m);
  if (baseUrlMatch) {
    n8nBaseUrl = baseUrlMatch[1].trim().replace(/['"]/g, '');
  }
} else {
  console.warn(`A megadott külső .env fájl nem található a következő útvonalon: ${externalEnvPath}`);
  // Fallback a helyi .env fájlra
  const localEnvPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(localEnvPath)) {
    console.log('Lokális .env fájl használata fallbackként.');
    const envContent = fs.readFileSync(localEnvPath, 'utf-8');
    const apiKeyMatch = envContent.match(/^N8N_API_KEY=(.*)$/m);
    n8nApiKey = apiKeyMatch ? apiKeyMatch[1].trim().replace(/['"]/g, '') : '';
  }
}

if (!n8nApiKey) {
  console.error('❌ Hiba: N8N_API_KEY nem található sem a megadott helyen, sem a helyi .env-ben!');
  process.exit(1);
}

console.log(`n8n API URL: ${n8nBaseUrl}`);
console.log(`n8n API Key: ${n8nApiKey.substring(0, 10)}... (hossz: ${n8nApiKey.length})`);

// Helper funkció a HTTPS kérésekhez
function makeRequest(urlStr, method, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      method: method,
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody
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
    console.log('\n1. Létező n8n Credentials-ök lekérdezése...');
    const credsRes = await makeRequest(`${n8nBaseUrl}/api/v1/credentials`, 'GET');
    
    let credentialsList = [];
    if (credsRes.statusCode === 200) {
      const data = JSON.parse(credsRes.body);
      credentialsList = data.data || [];
      console.log(`✓ Lekérdezve ${credentialsList.length} credential.`);
    } else {
      console.warn(`⚠ Nem sikerült lekérdezni a credentials-t (Státuszkód: ${credsRes.statusCode}). Fallback alapértelmezések.`);
      console.log(credsRes.body);
    }

    // Google Sheets és Gmail credential keresése a szerveren
    let gmailCredId = 'gmail-oauth2-credential-id'; // Fallback alapértelmezett ID
    let sheetsCredId = '';
    
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

    console.log('\n2. Helyi workflow JSON beolvasása és injektálása...');
    const workflowPath = path.join(__dirname, 'homola_b2b_campaign_workflow.json');
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`Nem található a workflow fájl: ${workflowPath}`);
    }
    
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    
    // Injektáljuk a megfelelő ID-kat a workflow-ba
    workflow.nodes.forEach(node => {
      // 1. Google Sheets node testreszabása
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
          // Ha nincs dedikált sheets credential, próbáljuk meg a Gmail OAuth2-t használni, mert az is egy Google Workspace OAuth
          node.credentials = {
            "googleSheetsOAuth2": {
              "id": gmailCredId,
              "name": "Google Sheets (via Gmail Connection)"
            }
          };
        }
      }
      // 2. Gmail node testreszabása
      if (node.type === 'n8n-nodes-base.gmail') {
        if (gmailCredId) {
          node.credentials = {
            "gmailOAuth2": {
              "id": gmailCredId,
              "name": "Gmail Account (peterpohankapersonal@gmail.com)"
            }
          };
        }
      }
    });

    console.log('\n3. Workflow meglétének ellenőrzése az n8n szerveren...');
    const workflowsRes = await makeRequest(`${n8nBaseUrl}/api/v1/workflows`, 'GET');
    let existingWorkflow = null;
    
    if (workflowsRes.statusCode === 200) {
      const data = JSON.parse(workflowsRes.body);
      const list = data.data || [];
      existingWorkflow = list.find(w => w.name === workflow.name || w.id === workflow.id);
    }

    let saveUrl = `${n8nBaseUrl}/api/v1/workflows`;
    let method = 'POST';
    
    if (existingWorkflow) {
      console.log(`✓ A workflow már létezik a szerveren (ID: ${existingWorkflow.id}). Módosítás (PUT) következik.`);
      saveUrl = `${n8nBaseUrl}/api/v1/workflows/${existingWorkflow.id}`;
      method = 'PUT';
      // Megőrizzük az ID-t
      workflow.id = existingWorkflow.id;
    } else {
      console.log('A workflow még nem létezik a szerveren. Új létrehozása (POST) következik.');
    }

    // Elmentjük a módosított JSON-t lokálisan is
    fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

    console.log('\n4. Workflow importálása/frissítése...');
    const saveRes = await makeRequest(saveUrl, method, workflow);
    
    if (saveRes.statusCode === 200) {
      const savedData = JSON.parse(saveRes.body);
      const savedId = savedData.id;
      console.log(`✓ Workflow sikeresen mentve! (Szerver ID: ${savedId})`);
      
      console.log('\n5. Workflow aktiválása (active: true)...');
      const activateRes = await makeRequest(`${n8nBaseUrl}/api/v1/workflows/${savedId}`, 'PUT', {
        active: true
      });
      
      if (activateRes.statusCode === 200) {
        console.log('========================================================================');
        console.log('✓ SUCCESS: Az n8n workflow sikeresen ÉLESÍTVE és AKTIVÁLVA lett!');
        console.log('========================================================================');
      } else {
        console.warn(`⚠ Az aktiválás sikertelen (Státusz: ${activateRes.statusCode}). Válasz: ${activateRes.body}`);
      }
    } else {
      console.error(`❌ Hiba a workflow mentése során (Státuszkód: ${saveRes.statusCode})`);
      console.error(saveRes.body);
    }
  } catch (err) {
    console.error(`❌ Kivétel történt a folyamat futtatása közben: ${err.message}`);
  }
}

main();
