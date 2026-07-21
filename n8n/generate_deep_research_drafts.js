/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

const SPREADSHEET_ID_MASTER = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const SPREADSHEET_ID_CONTACTS = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

function runGwsRead(cmdStr) {
  return execSync(`gws ${cmdStr}`, { encoding: 'utf-8' });
}

function runGwsWrite(command, paramsObj, bodyObj) {
  const pEscaped = JSON.stringify(paramsObj).replace(/"/g, '\\"');
  let cmd = `gws ${command.join(' ')} --params "${pEscaped}"`;
  if (bodyObj) {
    const bEscaped = JSON.stringify(bodyObj).replace(/"/g, '\\"');
    cmd += ` --json "${bEscaped}"`;
  }
  return execSync(cmd, { encoding: 'utf-8' });
}

function buildRawMimeMessage({ to, subject, body }) {
  const mime = [
    `From: Homola László <peterpohankapersonal@gmail.com>`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body
  ].join('\r\n');
  return Buffer.from(mime).toString('base64url');
}

function getEmailTemplate({ name, company, project, countryFocus }) {
  const cf = (countryFocus || '').toLowerCase();
  const pr = (project || '').toLowerCase();
  const cp = (company || '').toLowerCase();

  const isGerman = cf.includes('austria') || cf.includes('germany') || cf.includes('österreich') || cf.includes('deutschland') || cf.includes('dach') || pr.includes('nagycenk') || pr.includes('die traube') || cp.includes('senecura') || cp.includes('medicum') || cp.includes('garbe') || cp.includes('carestone') || cp.includes('alloheim');

  // Determine Project Category
  const isSeniorLiving = pr.includes('senior') || pr.includes('living') || pr.includes('nagycenk') || pr.includes('healthcare') || pr.includes('care');
  const isLogistics = pr.includes('logistics') || pr.includes('győr') || pr.includes('ipartelek') || pr.includes('industrial');
  const isSpa = pr.includes('spa') || pr.includes('thermal') || pr.includes('szentendre') || pr.includes('resort');
  const isKamion = pr.includes('kamion') || pr.includes('m5') || pr.includes('tir') || pr.includes('truck');
  const isAfrica = pr.includes('african') || pr.includes('afrika') || cf.includes('afrika') || cf.includes('ivory coast');

  let subject = '';
  let body = '';

  const signatureDE = `Mit freundlichen Grüßen,\nLászló Homola\nLead Advisor / Project Director\nhomlamentor@gmail.com | +36 70 633 270`;
  const signatureEN = `Best regards / Mit freundlichen Grüßen,\nLászló Homola\nLead Advisor / Project Director\nhomlamentor@gmail.com | +36 70 633 270`;

  if (isSeniorLiving) {
    if (isGerman) {
      subject = `Investitionsmöglichkeit: Premium Senioren- & Reha-Resort Nagycenk (€9M) – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `ich wende mich an Sie im Namen der HOMLAMENTOR KFT bezüglich einer hochattraktiven Off-Market Investitionsmöglichkeit im Bereich Care & Senior Living nahe der österreichischen Grenze (Sopron / Nagycenk).\n\n` +
        `Es handelt sich um das Projekt 'Senior Living & Healthcare Center Nagycenk' (€9M), ein zu 75% fertiggestelltes Premium Senioren- und Rehabilitations-Resort auf einem 1,7 Hektar großen Areal mit 6.284 m² Nutzfläche.\n\n` +
        `Kerneckdaten des Projekts:\n` +
        `* 75% Baustatus: Schnelle Fertigstellung innerhalb von 8 Monaten möglich.\n` +
        `* Strategische Lage: Direkte Nähe zur österreichischen Grenze (Sopron / Nagycenk), ideal für grenzüberschreitende Betreuung und Nachfrage aus der DACH-Region.\n` +
        `* Flexibles Betreibermodell: Asset- oder Share-Deal mit Betreiberübernahme oder langfristigem Pachtvertrag.\n\n` +
        `Gerne stellen wir Ihnen das vertrauliche Teaser-Dossier und das Finanzmodell in einem kurzen, 15-minütigen Gespräch vor.\n\n` +
        `Hätten Sie in den kommenden Tagen Zeit für eine kurze Abstimmung?\n\n` +
        signatureDE;
    } else {
      subject = `Investment Opportunity: Premium Senior Living & Healthcare Resort Nagycenk (€9M) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am reaching out on behalf of HOMLAMENTOR KFT regarding an off-market investment opportunity in European Care & Senior Living infrastructure near the Austrian border (Sopron / Nagycenk).\n\n` +
        `The 'Senior Living & Healthcare Resort Nagycenk' (€9M) is a 75% completed premium elder-care and rehabilitation complex situated on a 1.7-hectare estate with 6,284 sqm of built area.\n\n` +
        `Key Project Highlights:\n` +
        `* 75% Built Construction: Operational completion achievable within 8 months.\n` +
        `* Prime Location: Close proximity to Vienna / Austrian border, serving high cross-border demand.\n` +
        `* Flexible Deal Structure: Available via Asset or Share Deal with operator lease or joint venture options.\n\n` +
        `We would be pleased to provide you with our confidential teaser materials and financial model during a brief, 15-minute call.\n\n` +
        `Please let us know your availability for a call in the coming days.\n\n` +
        signatureEN;
    }
  } else if (isLogistics) {
    if (isGerman) {
      subject = `Off-Market Logistik- & Industrieareal Győrszentiván (€6M) – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `ich kontaktiere Sie im Namen der HOMLAMENTOR KFT bezüglich einer strategischen Logistik- und Industrie-Investitionsmöglichkeit im M1-Korridor nahe Győr.\n\n` +
        `Das Portfolio umfasst ein 10,3 Hektar großes Industrie- und Logistikterminal Győrszentiván (€6M) an der Autobahn M1 mit direktem Gleisanschluss, Hafenanbindung und Erweiterungspotenzial (107 ha Agrarland & 46 ha Kiesgrube).\n\n` +
        `Highlights der Immobilie:\n` +
        `* Strategischer Knotenpunkt: M1 Autobahn-Korridor (Wien-Budapest) nahe dem Hafen Győr-Gönyű.\n` +
        `* Industrieller Gleisanschluss: Eigener Bahnanschluss direkt auf dem Gelände für Schwergut und Logistik.\n` +
        `* Hohes Value-Add Potenzial: Entwicklungsfertig für Big-Box Logistik, Gewerbepark oder Multimodal-Terminal.\n\n` +
        `Gerne übersenden wir Ihnen das vertrauliche Teaser-Dossier und besprechen mögliche Synergien.\n\n` +
        `Mit freundlichen Grüßen,\nLászló Homola\nLead Advisor / Project Director\nhomlamentor@gmail.com | +36 70 633 270`;
    } else {
      subject = `Off-Market Logistics & Industrial Terminal Győrszentiván (€6M) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am reaching out on behalf of HOMLAMENTOR KFT regarding a prime off-market logistics and industrial investment opportunity along the M1 European transport corridor near Győr.\n\n` +
        `The 'Győrszentiván Logistics Terminal' (€6M) offers 10.3 hectares of prime industrial land equipped with direct industrial railway track access, close proximity to the Győr-Gönyű Danube port, and expansion options.\n\n` +
        `Key Highlights:\n` +
        `* Strategic Hub: M1 Highway Corridor connecting Vienna, Bratislava, and Budapest.\n` +
        `* Rail & Multimodal Infrastructure: Direct rail siding on site for heavy freight and container logistics.\n` +
        `* Immediate Development Readiness: Zoned for big-box logistics, industrial warehousing, or manufacturing.\n\n` +
        `We would be delighted to share the investment memorandum and arrange an introductory call.\n\n` +
        signatureEN;
    }
  } else if (isSpa) {
    if (isGerman) {
      subject = `Exklusives Thermal & Spa Resort Szentendre Pap-sziget (€6.5M) – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `im Namen der HOMLAMENTOR KFT möchten wir Ihnen eine seltene Trophäen-Investition im Bereich Medical-Spa & Hospitality nahe Budapest präsentieren.\n\n` +
        `Das 'Szentendre Pap-sziget Thermal Resort' (€6,5M) erstreckt sich über ein 3,5 Hektar großes Ufergrundstück an der Donau und verfügt über eine eigene aktive 1.850 m tiefe Thermalwasserquelle (50°C, 1.500 L/Min).\n\n` +
        `Highlights des Projekts:\n` +
        `* Zertifiziertes Thermalwasser: Eigener Thermalbrunnen für medizinisches Heilwasser & Wellness-Resort.\n` +
        `* Einzigartige Lage: Direkte Donauufer-Insel in Szentendre, nur 15 km von Budapest entfernt.\n` +
        `* Vielseitige Nutzung: Ideal für Luxus-Spa-Hotel, Reha-Klinik oder integriertes Wellness-Resort.\n\n` +
        `Gerne lassen wir Ihnen die vertrauliche Projektdokumentation zukommen.\n\n` +
        signatureDE;
    } else {
      subject = `Exclusive Thermal & Medical Spa Resort Szentendre Pap-sziget (€6.5M) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am contacting you on behalf of HOMLAMENTOR KFT to present a rare trophy hospitality asset located in the Budapest metropolitan area.\n\n` +
        `The 'Szentendre Pap-sziget Thermal Resort' (€6.5M) encompasses a 3.5-hectare private riverfront property featuring its own active 1,850-meter deep thermal water well (50°C flow temperature, 1,500 L/min yield).\n\n` +
        `Key Highlights:\n` +
        `* High-Yield Medicinal Thermal Spring: Certified thermal mineral water source for medical spa and wellness applications.\n` +
        `* Prime Location: Exclusive Danube riverbank setting in Szentendre, 15 km from central Budapest.\n` +
        `* High Development Flexibility: Zoned for luxury health resort, thermal spa hotel, or medical rehabilitation facility.\n\n` +
        `We would be pleased to share the project dossier and discuss development models.\n\n` +
        signatureEN;
    }
  } else if (isKamion) {
    if (isGerman) {
      subject = `Investitionsangebot: M5 Kamion Park TIR Logistik-Terminal (€13M) – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `ich kontaktiere Sie im Namen der HOMLAMENTOR KFT bezüglich eines ertragsstarken Infrastruktur- und Logistikprojekts an der M5 Autobahn.\n\n` +
        `Der 'Kamion Park M5 TIR Terminal' (€13M) ist ein 6,66 Hektar großes, gesichertes LKW-Logistikterminal direkt an der serbisch-ungarischen Grenze und der Europastraße E75.\n\n` +
        `Highlights der Anlage:\n` +
        `* Kapazität für 370 LKWs: Vollumzäuntes TIR-Terminal mit Videoüberwachung und automatischer Zufahrt.\n` +
        `* Integrierte Infrastruktur: 200-Betten LKW-Motel, Restaurant, Werkstatt und Schnellladestationen für E-LKW.\n` +
        `* Höchste Auslastung: Strategischer Transitknotenpunkt an der Außengrenze der EU für den Güterverkehr Richtung Balkan/Türkei.\n\n` +
        `Gerne stellen wir Ihnen das vertrauliche Teaser-Dossier vor.\n\n` +
        signatureDE;
    } else {
      subject = `Investment Opportunity: M5 Kamion Park TIR Truck Terminal (€13M) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am reaching out on behalf of HOMLAMENTOR KFT regarding a high-yielding transport infrastructure asset along the major European E75 / M5 highway axis.\n\n` +
        `The 'Kamion Park M5 TIR Terminal' (€13M) is a 6.66-hectare secured heavy transport logistics hub located directly at the Hungarian-Serbian border corridor.\n\n` +
        `Key Highlights:\n` +
        `* 370 Heavy Truck Capacity: Fully secured TIR parking facility with automated access control and 24/7 security.\n` +
        `* Turnkey Amenities: Features a 200-bed motel, restaurant, truck service center, and high-power EV charging infrastructure.\n` +
        `* Strategic Border Corridor: Critical EU external border logistics node for trans-European freight flows.\n\n` +
        `We would be glad to send you the confidential investment memorandum.\n\n` +
        signatureEN;
    }
  } else if (isAfrica) {
    if (isGerman) {
      subject = `Off-Market Projektfinanzierung Nyugat-Afrikában (Abidjan) – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `ich wende mich an Sie im Namen der HOMLAMENTOR KFT bezüglich strukturierter Off-Market Projektfinanzierung und Co-Investment-Möglichkeiten in Westafrika mit operativem Hub in Abidjan (Elfenbeinküste).\n\n` +
        `Die HOMLAMENTOR KFT verfügt über eine etablierte lokale Präsenz und starkes Netz im ECOWAS-Raum. Wir suchen nach Finanzierungspartnern in folgenden Kernbereichen:\n\n` +
        `* Erneuerbare Energien: 50+ MW Solarparks mit staatlichen PPA-Abnahme-Garantien.\n` +
        `* Telekommunikation & Netzausbau: Mobilfunkmasten-Infrastruktur (TowerCo) und Stromnetz-Erweiterungen.\n` +
        `* Agrar- & Bau-Infrastruktur: Moderne Verarbeitungsanlagen und Infrastrukturprojekte in Elefantenküste.\n\n` +
        `Gerne präsentieren wir Ihnen die Projektdetails und Finanzmodelle in einem kurzen Gespräch.\n\n` +
        signatureDE;
    } else {
      subject = `West African Off-Market Project Finance and Co-Investment Opportunities (Abidjan) – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am reaching out on behalf of HOMLAMENTOR KFT regarding high-yielding, off-market project finance and co-investment opportunities in West Africa, managed via our operational hub in Abidjan, Ivory Coast.\n\n` +
        `HOMLAMENTOR KFT has established a strong local presence within the ECOWAS region. We are seeking structured finance partners and private equity investors for capital deployment in the following core sectors:\n\n` +
        `* Green Energy: Development and construction of 50+ MW utility-scale solar PV plants backed by sovereign off-take guarantees (PPA).\n` +
        `* Telecom & Grid Infrastructure: Telecommunication tower infrastructure (TowerCo models) and power grid expansions.\n` +
        `* Agro-processing & Civil Construction: Commercial agricultural facilities and civil infrastructure in Ivory Coast.\n\n` +
        `We would be pleased to schedule a brief introductory call to share pipeline details and financial models.\n\n` +
        `Please let us know your availability for a call in the coming weeks.\n\n` +
        signatureEN;
    }
  } else {
    // Default fallback institutional pitch
    if (isGerman) {
      subject = `Off-Market M&A & Investitionsmöglichkeit – HOMLAMENTOR KFT`;
      body = `Sehr geehrte(r) Frau/Herr ${name},\n\n` +
        `im Namen der HOMLAMENTOR KFT möchten wir Ihnen vertrauliche Off-Market Investitionsmöglichkeiten im Bereich Gewerbeimmobilien und Infrastruktur in der CEE-Region präsentieren.\n\n` +
        `Gerne übersenden wir Ihnen detaillierte Unterlagen für eine vertrauliche Prüfung.\n\n` +
        signatureDE;
    } else {
      subject = `Off-Market Investment Opportunity – HOMLAMENTOR KFT`;
      body = `Dear ${name},\n\n` +
        `I am contacting you on behalf of HOMLAMENTOR KFT regarding high-yield off-market real estate and infrastructure investment opportunities in the CEE region.\n\n` +
        `We would be pleased to provide you with confidential teaser materials for your review.\n\n` +
        signatureEN;
    }
  }

  return { subject, body, isGerman };
}

async function main() {
  console.log('================ DEEP RESEARCH PISZKOZAT GENERÁLÓ ================');
  console.log('1. CRM adatok beolvasása Master CRM-ből...');

  const masterOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_MASTER} --range Master_Vevőlista!A1:S500`));
  const afrikaOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_MASTER} --range Afrika_Projekt_Finanszirozas!A1:L500`));
  const contactsOut = JSON.parse(runGwsRead(`sheets +read --spreadsheet ${SPREADSHEET_ID_CONTACTS} --range CONTACTS!A1:P500`));

  const masterRows = masterOut.values || [];
  const afrikaRows = afrikaOut.values || [];
  const contactsRows = contactsOut.values || [];

  const targets = [];

  // Parse Master_Vevőlista targets (Status column = N, index 13)
  masterRows.forEach((r, idx) => {
    if (idx > 0 && r[13] === 'Új Lead - Deep Research') {
      targets.push({
        sourceTab: 'Master_Vevőlista',
        rowNum: idx + 1,
        company: r[0] || '',
        project: r[1] || '',
        countryFocus: r[2] || '',
        name: r[5] || 'Tisztelt Hölgyem/Uram',
        title: r[6] || '',
        email: (r[7] || '').trim()
      });
    }
  });

  // Parse Afrika_Projekt_Finanszirozas targets (Status column = H, index 7)
  afrikaRows.forEach((r, idx) => {
    if (idx > 0 && r[7] === 'Új Lead - Deep Research') {
      targets.push({
        sourceTab: 'Afrika_Projekt_Finanszirozas',
        rowNum: idx + 1,
        company: r[2] || '',
        project: r[6] || 'African Infrastructure',
        countryFocus: r[3] || 'International',
        name: r[0] || 'Tisztelt Hölgyem/Uram',
        title: r[1] || '',
        email: (r[5] || '').trim()
      });
    }
  });

  console.log(`✓ Összesen ${targets.length} feldolgozandó "Új Lead - Deep Research" sorszám azonosítva.\n`);

  if (targets.length === 0) {
    console.log('ℹ Nincs feldolgozandó lead.');
    return;
  }

  let createdCount = 0;
  const processedEmails = new Set();

  for (const t of targets) {
    if (!t.email) {
      console.warn(`⚠ Sorszám #${t.rowNum} (${t.sourceTab}) hiányzó e-mail cím, kihagyva.`);
      continue;
    }

    const { subject, body, isGerman } = getEmailTemplate(t);
    const rawMime = buildRawMimeMessage({ to: t.email, subject, body });

    console.log(`[Piszkozat #${createdCount + 1}] Készítés: ${t.name} <${t.email}> | Cég: ${t.company} | Projekt: ${t.project} | Nyelv: ${isGerman ? 'DE' : 'EN'}`);

    try {
      const resOutput = runGwsWrite(
        ['gmail', 'users', 'drafts', 'create'],
        { userId: 'me' },
        { message: { raw: rawMime } }
      );
      const resObj = JSON.parse(resOutput);
      console.log(`  ✓ Piszkozat sikeresen bekészítve a Gmailben (ID: ${resObj.id}).`);
      createdCount++;
      processedEmails.add(t.email.toLowerCase());

      // Update status in source tab
      if (t.sourceTab === 'Master_Vevőlista') {
        runGwsWrite(['sheets', 'spreadsheets', 'values', 'update'], {
          spreadsheetId: SPREADSHEET_ID_MASTER,
          range: `Master_Vevőlista!N${t.rowNum}`,
          valueInputOption: 'USER_ENTERED'
        }, { values: [['Piszkozat bekészítve']] });
      } else if (t.sourceTab === 'Afrika_Projekt_Finanszirozas') {
        runGwsWrite(['sheets', 'spreadsheets', 'values', 'update'], {
          spreadsheetId: SPREADSHEET_ID_MASTER,
          range: `Afrika_Projekt_Finanszirozas!H${t.rowNum}`,
          valueInputOption: 'USER_ENTERED'
        }, { values: [['Piszkozat bekészítve']] });
      }

    } catch (draftErr) {
      console.error(`  ❌ Hiba a piszkozat létrehozásakor (${t.email}):`, draftErr.message);
    }
  }

  // Also update status in CONTACTS table for all processed emails
  console.log('\n2. CRM Státusz frissítése a CONTACTS fülön...');
  let contactsUpdated = 0;
  contactsRows.forEach((r, idx) => {
    if (idx > 0) {
      const email = (r[6] || '').toLowerCase().trim();
      if (processedEmails.has(email)) {
        const rowNum = idx + 1;
        try {
          runGwsWrite(['sheets', 'spreadsheets', 'values', 'update'], {
            spreadsheetId: SPREADSHEET_ID_CONTACTS,
            range: `CONTACTS!L${rowNum}`,
            valueInputOption: 'USER_ENTERED'
          }, { values: [['Piszkozat bekészítve']] });
          contactsUpdated++;
        } catch (err) {
          console.error(`  ❌ Hiba a CONTACTS sorszám #${rowNum} frissítésekor:`, err.message);
        }
      }
    }
  });

  console.log(`✓ CONTACTS fülön ${contactsUpdated} sor státusza frissítve "Piszkozat bekészítve" értékre.`);

  console.log('\n========================================================================');
  console.log(`🎉 DEEP RESEARCH PISZKOZATOK GENERÁLÁSA VÉGZETTESEN SIKERES!`);
  console.log(`   - Összesen ${createdCount} új személyre szabott Gmail piszkozat létrejött.`);
  console.log(`   - CRM státuszok mindkét adatbázisban "Piszkozat bekészítve" értékre frissítve.`);
  console.log('========================================================================');
}

main().catch(err => {
  console.error('❌ Végzetes hiba a piszkozatok generálása során:', err);
  process.exit(1);
});
