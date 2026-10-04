// Stage 2 of the property search (card f1798734, content 75acc820 ch. 2.2 and 8.3): after the
// "Érdekel" form, a detailed, source-checked research for the TEAM. Personal data (name, e-mail,
// phone) never goes to the model: the free Gemini tier may use prompts to improve Google's products.
import { buildPrompt, type FoundSource } from './preview.ts';
import type { CardSecret } from './cardToken.ts';
import { isOfficial } from './sourceCheck.ts';

export const RESEARCH_MAX = 5;

export function buildResearchPrompt(query: string, chosen: CardSecret | null): string {
  const base = buildPrompt(query).replace(/Legfeljebb \d+ találat\./, `Legfeljebb ${RESEARCH_MAX} találat, alaposan: nézz meg több forrást.`);
  if (!chosen) return base;
  return `${base}\n\nAz érdeklődő ezt a találatot választotta, ennek keress további részleteket és hasonlókat: ${chosen.category}, ${chosen.place}${chosen.area ? `, ${chosen.area}` : ''}.`;
}

export type Lead = {
  name: string;
  email: string;
  phone: string;
  marketing: boolean;
  query: string;
  receivedAt: number;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Honest wording: a non-official page is never downloaded, so "not found on the page" would be false.
export const statusHu = (v: 'verified' | 'pending', url: string) =>
  v === 'verified'
    ? 'ELLENŐRIZVE (az idézet szerepel a hivatalos oldalon)'
    : isOfficial(url)
      ? 'ELLENŐRIZETLEN (hivatalos oldal, de az idézetet nem találtuk rajta; nyisd meg kézzel)'
      : 'NEM ELLENŐRIZVE (nem hivatalos forrás, az oldalt nem töltöttük le; nyisd meg kézzel)';

function sourceBlock(s: Pick<FoundSource, 'category' | 'place' | 'area' | 'priceBand' | 'sourceUrl' | 'quote' | 'verification'>): string {
  const href = /^https?:\/\//.test(s.sourceUrl) ? esc(s.sourceUrl) : '#';
  return `<li style="margin:0 0 12px 0">
  <b>${esc(s.category)}</b>, ${esc(s.place)}${s.area ? `, ${esc(s.area)}` : ''}${s.priceBand ? `, ${esc(s.priceBand)}` : ''}<br>
  Forrás: <a href="${href}">${esc(s.sourceUrl)}</a><br>
  ${s.quote ? `Idézet: „${esc(s.quote)}”<br>` : ''}Állapot: ${statusHu(s.verification, s.sourceUrl)}
</li>`;
}

export function buildTeamEmail(lead: Lead, chosen: CardSecret | null, research: FoundSource[] | null, researchError: string | null) {
  const subject = `Ingatlan-érdeklődés: ${lead.query.slice(0, 80)}`;
  const when = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', dateStyle: 'short', timeStyle: 'short' }).format(lead.receivedAt);
  const research_html = researchError
    ? `<p>A részletes kutatás nem futott le (${esc(researchError)}). Kézi keresés kell.</p>`
    : research && research.length
      ? `<ol>${research.map(sourceBlock).join('')}</ol>`
      : '<p>A részletes kutatás nem talált forrással alátámasztott ajánlatot. Kézi keresés kell.</p>';
  const html = `<div style="font-family:sans-serif;font-size:14px;max-width:640px">
<h2 style="margin:0 0 12px 0">Új érdeklődő az ingatlan-keresőből</h2>
<p><b>Ki:</b> ${esc(lead.name)} · <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a> · ${esc(lead.phone)}<br>
<b>Mikor:</b> ${esc(when)} · <b>Marketing-hozzájárulás:</b> ${lead.marketing ? 'igen' : 'nem'}<br>
<b>Mit keresett:</b> ${esc(lead.query)}</p>
<h3>A választott találat</h3>
${chosen ? `<ul>${sourceBlock(chosen)}</ul>` : '<p>Nem választott találatot (kézi keresést kért).</p>'}
<h3>Részletes kutatás (csak a csapatnak)</h3>
${research_html}
<p style="color:#666;font-size:12px">A látogató linket nem kapott. Minden forrás a keresőeszköz tényleges találatai közül való (kitalált link kiszűrve); az eladó megkeresése előtt nyisd meg kézzel. A portálokról (ingatlan.com stb.) nem gyűjtünk.</p>
</div>`;
  return { subject, html };
}

/** Columns A-O of the Kereslet_Talalatok sheet; J is the status, updated after the research. */
export function sheetRow(lead: Lead, chosen: CardSecret | null): string[] {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(lead.receivedAt);
  return [
    `'${day}`,
    lead.query,
    chosen?.category ?? '',
    chosen?.place ?? '',
    chosen?.priceBand ?? '',
    chosen ? `forrás: ${chosen.sourceUrl} (${chosen.verification})` : 'kézi keresést kért',
    lead.name,
    lead.email,
    'hu',
    'queued',
    lead.phone,
    'igen',
    lead.marketing ? 'igen' : 'nem',
    chosen?.area ?? '',
    new Date(lead.receivedAt).toISOString(),
  ];
}
