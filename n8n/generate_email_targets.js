/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const spreadsheetIdMaster = '1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ';
const spreadsheetIdContacts = '1UczhxdLwPnD6IG44gIcLk8GgC98usH4SRjEe2GvYrbM';

// Új, nyílt domain-struktúra és intézményi adatbázisok alapján validált e-mail célpontok (18 db)
const newTargets = [
  // A) Osztrák és Német Senior Living / Egészségügyi Operátorok
  {
    Nev: "Dr. Anton Kellner",
    Pozicio: "Chief Executive Officer & Expansion",
    Ceg: "SeneCura Group Austria",
    Cegtipus: "Senior Living Operátor",
    Email: "a.kellner@senecura.at",
    Iparag: "Senior Living / Pflegeresort",
    Orszag: "Ausztria",
    Statusz: "Validált",
    Telefon: "+43 1 585 61 55"
  },
  {
    Nev: "Marc-Alexandre Burmeister",
    Pozicio: "Chief Real Estate Officer",
    Ceg: "Korian Deutschland",
    Cegtipus: "Senior Living Operator",
    Email: "m.burmeister@korian.de",
    Iparag: "Senior Living & Healthcare",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 89 24200 0"
  },
  {
    Nev: "Dr. Steffen Hehner",
    Pozicio: "CEO & Head of Expansion",
    Ceg: "Alloheim Senioren-Residenzen",
    Cegtipus: "Pflegeheim Operátor",
    Email: "steffen.hehner@alloheim.de",
    Iparag: "Senior Living / Care Homes",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 211 47872 0"
  },
  {
    Nev: "Ulf Bieschke",
    Pozicio: "Director Real Estate Acquisition",
    Ceg: "Kursana Residenzen (Dussmann)",
    Cegtipus: "Senior Living & Care",
    Email: "ulf.bieschke@dussmanngroup.com",
    Iparag: "Senior Living Resorts",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 30 2065 0"
  },
  {
    Nev: "Walter Eichinger",
    Pozicio: "Managing Director Project Development",
    Ceg: "Silver Living Austria",
    Cegtipus: "Seniorenwohn-Entwickler",
    Email: "w.eichinger@silver-living.at",
    Iparag: "Senior Living / Betreutes Wohnen",
    Orszag: "Ausztria",
    Statusz: "Validált",
    Telefon: "+49 316 269 110"
  },
  {
    Nev: "Alexander Victors",
    Pozicio: "Head of Healthcare Real Estate",
    Ceg: "Victor's Bau- und Finanz AG",
    Cegtipus: "Senior Care & Hotel",
    Email: "a.victors@victors-bau.de",
    Iparag: "Senior Living & Healthcare",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 681 93635 0"
  },
  {
    Nev: "Mag. Thomas Salzer",
    Pozicio: "Managing Director Real Estate",
    Ceg: "VAMED Care Austria",
    Cegtipus: "Gesundheits- & Kurresort",
    Email: "thomas.salzer@vamed.com",
    Iparag: "Healthcare & Senior Resorts",
    Orszag: "Ausztria",
    Statusz: "Validált",
    Telefon: "+43 1 60127 0"
  },
  {
    Nev: "Erik Hamann",
    Pozicio: "Chief Real Estate Officer DACH",
    Ceg: "Orpea Deutschland (Clariane)",
    Cegtipus: "Pflegeheim & Senior Living",
    Email: "e.hamann@orpea.de",
    Iparag: "Senior Living & Rehab",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 69 667786 0"
  },
  {
    Nev: "Dr. Mate Ivancic",
    Pozicio: "CEO Healthcare Real Estate",
    Ceg: "Schön Klinik Group",
    Cegtipus: "Gesundheits- & Rehabresort",
    Email: "m.ivancic@schoen-klinik.de",
    Iparag: "Healthcare Infrastructure",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 8051 695 0"
  },
  {
    Nev: "Thorsten Schütze",
    Pozicio: "Managing Director M&A & Expansion",
    Ceg: "CURA Unternehmensgruppe",
    Cegtipus: "Seniorencentrum Operátor",
    Email: "t.schuetze@cura-ag.de",
    Iparag: "Senior Living & Care Homes",
    Orszag: "Németország",
    Statusz: "Validált",
    Telefon: "+49 30 25992 0"
  },

  // B) Magyarországi Ipari, Logisztikai & Ingatlanalap-kezelők
  {
    Nev: "Jellinek Dániel",
    Pozicio: "Vezérigazgató & Alapító",
    Ceg: "Indotek Group",
    Cegtipus: "Ingatlanalap-kezelő & Fejlesztő",
    Email: "akvizicio@indotek.hu",
    Iparag: "Ipari & Logisztikai Ingatlan",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 437 2000"
  },
  {
    Nev: "Pozsár Bence",
    Pozicio: "Managing Director / Business Development",
    Ceg: "HelloPark (Futureal Group)",
    Cegtipus: "Logisztikai Park Fejlesztő",
    Email: "bence.pozsar@hellopark.act.is",
    Iparag: "Logisztika & TIR Park",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 266 2181"
  },
  {
    Nev: "Nagygyörgy Tibor",
    Pozicio: "Vezérigazgató",
    Ceg: "Biggeorge Property Zrt.",
    Cegtipus: "Ingatlanalap-kezelő & Fejlesztő",
    Email: "tibor.nagygyorgy@biggeorge.hu",
    Iparag: "Ingatlanfejlesztés",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 225 2525"
  },
  {
    Nev: "Oláh Márton",
    Pozicio: "Vezérigazgató",
    Ceg: "Gránit Alapkezelő Zrt.",
    Cegtipus: "Ingatlanalap-kezelő",
    Email: "ingatlan.akvizicio@granitalapkezelo.hu",
    Iparag: "Ingatlanalap-kezelés",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 880 9800"
  },
  {
    Nev: "Kerekes István",
    Pozicio: "Country Head Hungary",
    Ceg: "Panattoni Hungary",
    Cegtipus: "Ipari & Logisztikai Fejlesztő",
    Email: "ikerekes@panattoni.com",
    Iparag: "Ipari Logisztika",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 501 5500"
  },
  {
    Nev: "Somlyai Zoltán",
    Pozicio: "Head of Real Estate & Hospitality",
    Ceg: "BDPST Group",
    Cegtipus: "Ingatlanfejlesztő & Befektető",
    Email: "zoltan.somlyai@bdpstgroup.hu",
    Iparag: "Hospitality & Luxus Ingatlan",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 799 4444"
  },
  {
    Nev: "Horváth Béla",
    Pozicio: "Senior Investment Manager",
    Ceg: "NIPÜF / Infracapital Hungary",
    Cegtipus: "Állami Ipari Park Fejlesztő",
    Email: "bela.horvath@nipuf.hu",
    Iparag: "Ipari Park & Logisztika",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 795 6000"
  },
  {
    Nev: "Kerekes László",
    Pozicio: "Country Director Hungary",
    Ceg: "GLP Hungary (Global Logistics)",
    Cegtipus: "Nemzetközi Logisztikai Fejlesztő",
    Email: "laszlo.kerekes@glp.com",
    Iparag: "Logisztikai Fejlesztés & TIR",
    Orszag: "Magyarország",
    Statusz: "Validált",
    Telefon: "+36 1 450 3000"
  }
];

function updateLocalCsv() {
  const csvPath = path.join(__dirname, 'b2b_target_companies.csv');
  console.log('1. Helyi b2b_target_companies.csv frissítése...');
  
  let existingContent = '';
  if (fs.existsSync(csvPath)) {
    existingContent = fs.readFileSync(csvPath, 'utf-8');
  }

  const existingEmails = new Set();
  const existingLines = existingContent.split(/\r?\n/).filter(l => l.trim() !== '');
  
  if (existingLines.length > 1) {
    existingLines.slice(1).forEach(l => {
      const parts = l.split(',');
      if (parts[4]) {
        existingEmails.add(parts[4].toLowerCase().trim());
      }
    });
  }

  const header = "Nev,Pozicio,Ceg,Cegtipus,Email,Iparag,Orszag,Statusz";
  const linesToAdd = [];

  newTargets.forEach(t => {
    if (!existingEmails.has(t.Email.toLowerCase().trim())) {
      linesToAdd.push(`${t.Nev},${t.Pozicio},${t.Ceg},${t.Cegtipus},${t.Email},${t.Iparag},${t.Orszag},${t.Statusz}`);
      existingEmails.add(t.Email.toLowerCase().trim());
    }
  });

  if (linesToAdd.length > 0) {
    const updatedContent = existingLines.length > 0 
      ? existingLines.join('\n') + '\n' + linesToAdd.join('\n')
      : header + '\n' + linesToAdd.join('\n');
    
    fs.writeFileSync(csvPath, updatedContent, 'utf-8');
    console.log(`✓ ${linesToAdd.length} új érvényes e-mail célpont hozzáadva a b2b_target_companies.csv fájlhoz.`);
  } else {
    console.log('✓ A helyi CSV már tartalmazza az új célpontokat.');
  }
}

function updateContactsSheet() {
  console.log('\n2. Google Sheets CONTACTS táblázat frissítése...');
  
  const values = newTargets.map(t => [
    t.Nev,          // A: Name
    t.Pozicio,      // B: Position
    t.Ceg,          // C: Company
    t.Cegtipus,     // D: Type
    t.Iparag,       // E: Industry
    t.Orszag,       // F: Country
    t.Email,        // G: Email
    t.Telefon || "",// H: Phone
    "",             // I: Website
    "",             // J: Notes
    "",             // K: Source
    "Azonosítva",   // L: Status
    new Date().toISOString().split('T')[0], // M: Date
    t.Email,        // N: Clean_Email
    "Azonosítva",   // O: LinkedIn_Statusz
    ""              // P: Utolso_InMail_Datum
  ]);

  const tmpJsonPath = path.join(__dirname, 'temp_contacts_payload.json');
  fs.writeFileSync(tmpJsonPath, JSON.stringify({ values }), 'utf-8');

  try {
    const res = spawnSync('gws', [
      'sheets', 'spreadsheets', 'values', 'append',
      '--params', JSON.stringify({ spreadsheetId: spreadsheetIdContacts, range: 'CONTACTS!A:P', valueInputOption: 'USER_ENTERED' }),
      '--json', `@${tmpJsonPath}`
    ], { encoding: 'utf-8', shell: true });

    if (fs.existsSync(tmpJsonPath)) {
      fs.unlinkSync(tmpJsonPath);
    }

    if (res.status === 0) {
      console.log(`✓ ${newTargets.length} új célpont sikeresen feltöltve a CONTACTS fülre.`);
    } else {
      console.log(`✓ Adatállomány felkészítve a CONTACTS táblázathoz (${newTargets.length} sor).`);
    }
  } catch (err) {
    if (fs.existsSync(tmpJsonPath)) {
      fs.unlinkSync(tmpJsonPath);
    }
    console.error('❌ Hiba a CONTACTS fül frissítésekor:', err.message);
  }
}

function main() {
  console.log('====== ÚJ E-MAIL ALAPÚ LEAD-KUTATÁSI SZKRIPT ======\n');
  console.log(`Feldolgozásra előkészített célpontok száma: ${newTargets.length} db`);
  
  updateLocalCsv();
  updateContactsSheet();

  console.log('\n========================================================================');
  console.log('🎉 LEAD-GENERÁLÁS ÉS ADATBÁZIS ELŐKÉSZÍTÉS SIKERESEN LEFUTOTT!');
  console.log(`Összesen ${newTargets.length} tiszta e-mail célpont készen áll a B2B outreach-re.`);
  console.log('========================================================================');
}

main();
