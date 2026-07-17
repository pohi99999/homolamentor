/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

const spreadsheetId = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';

const leads = [
  {
    Nev: "Investment Director - Infrastructure",
    Pozicio: "Investment Director",
    AlapBank: "African Development Bank (AfDB)",
    Orszag: "Ivory Coast",
    LinkedIn_URL: "https://www.linkedin.com/company/african-development-bank/",
    Email: "infrastructure-finance@afdb.org",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+225 2026 3900",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Head of Infrastructure and Energy Acquisitions - SSA",
    Pozicio: "Investment Director",
    AlapBank: "International Finance Corporation (IFC)",
    Orszag: "USA / South Africa",
    LinkedIn_URL: "https://www.linkedin.com/company/ifc-org/",
    Email: "ssa-infrastructure@ifc.org",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+27 11 731 3000",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Investment Director - Project Development",
    Pozicio: "Investment Director",
    AlapBank: "Africa50 Infrastructure Fund",
    Orszag: "Morocco",
    LinkedIn_URL: "https://www.linkedin.com/company/africa50-infrastructure-investment-platform/",
    Email: "project-finance@africa50.com",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+212 522 97 50 50",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Partner, Head of Africa Infrastructure",
    Pozicio: "Investment Partner",
    AlapBank: "Meridiam",
    Orszag: "France",
    LinkedIn_URL: "https://www.linkedin.com/company/meridiam/",
    Email: "africa-office@meridiam.com",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+33 1 53 34 96 96",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Investment Director - Renewable Energy and Telecom",
    Pozicio: "Investment Director",
    AlapBank: "African Infrastructure Investment Managers (AIIM)",
    Orszag: "South Africa",
    LinkedIn_URL: "https://www.linkedin.com/company/african-infrastructure-investment-managers/",
    Email: "info@aiimafrica.com",
    Celzott_Szektor: "Telekommunikáció / Távközlési Oszlopok",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+27 21 670 1234",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Portfolio Manager - Energy Infrastructure",
    Pozicio: "Portfolio Manager",
    AlapBank: "Emerging Africa Infrastructure Fund (EAIF)",
    Orszag: "United Kingdom",
    LinkedIn_URL: "https://www.linkedin.com/company/eaif/",
    Email: "eaif-queries@ninetyone.com",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+44 20 3938 2000",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Investment Officer - Power and Infrastructure",
    Pozicio: "Investment Officer",
    AlapBank: "Proparco (AFD Group)",
    Orszag: "France",
    LinkedIn_URL: "https://www.linkedin.com/company/proparco/",
    Email: "infrastructure-dept@proparco.fr",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+33 1 53 44 31 08",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Investment Director - Energy and Climate",
    Pozicio: "Investment Director",
    AlapBank: "FMO",
    Orszag: "Netherlands",
    LinkedIn_URL: "https://www.linkedin.com/company/fmo/",
    Email: "energy-dealflow@fmo.nl",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+31 70 314 9696",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Head of Infrastructure and Energy - Africa",
    Pozicio: "Investment Director",
    AlapBank: "DEG (KfW Group)",
    Orszag: "Germany",
    LinkedIn_URL: "https://www.linkedin.com/company/deg/",
    Email: "africa-infrastructure@deginvest.de",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+49 221 4986 0",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Investment Director - Clean Energy SSA",
    Pozicio: "Investment Director",
    AlapBank: "Norfund",
    Orszag: "Norway",
    LinkedIn_URL: "https://www.linkedin.com/company/norfund/",
    Email: "cleanenergy-africa@norfund.no",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+47 22 01 93 93",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Director, Energy Infrastructure Africa",
    Pozicio: "Investment Director",
    AlapBank: "Actis",
    Orszag: "United Kingdom",
    LinkedIn_URL: "https://www.linkedin.com/company/actis/",
    Email: "energy-africa@act.is",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+44 20 7234 5000",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Investment Director - Solar Dev",
    Pozicio: "Investment Director",
    AlapBank: "CrossBoundary Energy",
    Orszag: "Kenya / Ivory Coast",
    LinkedIn_URL: "https://www.linkedin.com/company/crossboundary/",
    Email: "energy-proposals@crossboundary.com",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+254 700 000 000",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Investment Director - Transmission and Dist",
    Pozicio: "Investment Director",
    AlapBank: "Gridworks (BII Group)",
    Orszag: "United Kingdom",
    LinkedIn_URL: "https://www.linkedin.com/company/gridworks-development-partners/",
    Email: "projects@gridworkspartners.com",
    Celzott_Szektor: "Telekommunikáció / Távközlési Oszlopok",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+44 20 7939 4000",
    Befektetési_Volumen: "10M-50M EUR"
  },
  {
    Nev: "Head of Infrastructure Equity - Africa",
    Pozicio: "Investment Director",
    AlapBank: "British International Investment (BII)",
    Orszag: "United Kingdom",
    LinkedIn_URL: "https://www.linkedin.com/company/british-international-investment/",
    Email: "africa-infrastructure@bii.co.uk",
    Celzott_Szektor: "Telekommunikáció / Távközlési Oszlopok",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+44 20 7939 4000",
    Befektetési_Volumen: "50M+ EUR"
  },
  {
    Nev: "Investment Manager - Clean Energy",
    Pozicio: "Investment Manager",
    AlapBank: "Swedfund",
    Orszag: "Sweden",
    LinkedIn_URL: "https://www.linkedin.com/company/swedfund-international/",
    Email: "info@swedfund.se",
    Celzott_Szektor: "Megújuló Energia / 50+ MW Naperőmű",
    Statusz: "Azonosítva / Kutatás alatt",
    Telefon: "+46 8 725 94 00",
    Befektetési_Volumen: "10M-50M EUR"
  }
];

async function main() {
  console.log(`Befektetők generálása, összesen ${leads.length} sor...`);
  
  const values = leads.map(l => [
    l.Nev,
    l.Pozicio,
    l.AlapBank,
    l.Orszag,
    l.LinkedIn_URL,
    l.Email,
    l.Celzott_Szektor,
    l.Statusz,
    l.Telefon && l.Telefon.startsWith('+') ? `'${l.Telefon}` : (l.Telefon || ''),
    l.Befektetési_Volumen,
    "", // LinkedIn_Statusz
    ""  // Utolso_InMail_Datum
  ]);

  const range = `Afrika_Projekt_Finanszirozas!A2:L${leads.length + 1}`;
  const data = [{ range, values }];

  console.log(`Adatok feltöltése a Google Sheets-be (range: ${range})...`);

  try {
    const res = spawnSync('gws', [
      'sheets', 'spreadsheets', 'values', 'batchUpdate',
      '--params', `"${JSON.stringify({ spreadsheetId }).replace(/"/g, '\\"')}"`,
      '--json', `"${JSON.stringify({ valueInputOption: 'USER_ENTERED', data }).replace(/"/g, '\\"')}"`
    ], { encoding: 'utf-8', shell: true });

    if (res.status === 0) {
      console.log('✓ Afrika_Projekt_Finanszirozas fül sikeresen frissítve.');
    } else {
      console.error('❌ Hiba a batchUpdate futtatásakor:', res.stderr || res.stdout);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Kivétel történt a batchUpdate futtatásakor:', err.message);
    process.exit(1);
  }
}

main();
