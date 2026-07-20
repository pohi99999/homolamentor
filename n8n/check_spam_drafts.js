/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

function runGws(args) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'cmd.exe' : 'gws';
  const fullArgs = isWin ? ['/c', 'gws', ...args] : args;

  const res = spawnSync(cmd, fullArgs, { encoding: 'utf-8' });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || 'gws command failed');
  }
  return res.stdout;
}

async function main() {
  console.log('====== SPAM MAPPA ELLENŐRZÉSE (peterpohankapersonal@gmail.com) ======\n');

  let listRes;
  try {
    const rawOutput = runGws(['gmail', 'users', 'messages', 'list', '--params', JSON.stringify({ userId: 'me', q: 'in:spam', maxResults: 15 })]);
    listRes = JSON.parse(rawOutput);
  } catch (err) {
    console.error('❌ Hiba a Spam üzenetek lekérésekor:', err.message);
    process.exit(1);
  }

  const messages = listRes.messages || [];
  console.log(`✓ Érkezett üzenetek száma a SPAM mappában: ${messages.length} db\n`);

  if (messages.length === 0) {
    console.log('ℹ Nincs levél a SPAM mappában.');
    return;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    try {
      const msgOutput = runGws(['gmail', 'users', 'messages', 'get', '--params', JSON.stringify({ userId: 'me', id: msg.id, format: 'full' })]);
      const msgData = JSON.parse(msgOutput);
      
      const headers = msgData.payload?.headers || [];
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'N/A';
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'N/A';
      const snippet = msgData.snippet || 'Nincs szövegrészlet';

      console.log(`--- [SPAM #${i + 1}] ID: ${msg.id} ---`);
      console.log(`  Feladó (From): ${fromHeader}`);
      console.log(`  Tárgy (Subject): ${subjectHeader}`);
      console.log(`  Részlet (Snippet): ${snippet}\n`);
    } catch (err) {
      console.error(`  ❌ Hiba a(z) ${msg.id} üzenet részleteinek lekérésekor:`, err.message);
    }
  }

  console.log('========================================================================');
  console.log('✓ SPAM MAPPA Elemzése Sikeresen Befejeződött.');
  console.log('========================================================================');
}

main();
