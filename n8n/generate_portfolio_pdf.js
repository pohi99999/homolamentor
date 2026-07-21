/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('====== HOMLAMENTOR KFT — PDF PORTFÓLIÓ MAGAZIN GENERÁTOR ======\n');

  const huJsonPath = path.join(__dirname, '..', 'src', 'messages', 'hu.json');
  const enJsonPath = path.join(__dirname, '..', 'src', 'messages', 'en.json');

  const huJson = JSON.parse(fs.readFileSync(huJsonPath, 'utf8'));
  const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

  const tHU = {
    metaTitle: 'HOMLAMENTOR KFT — Prémium Befektetési Portfólió',
    execSummaryTitle: 'Vállalati Áttekintés & Stratégiai Vízió',
    execSummaryDesc: 'A HOMLAMENTOR KFT prémium ipari, logisztikai és turisztikai ingatlanbefektetések közvetítésére, valamint nyugat-afrikai (elefántcsontparti Abidjan központú) infrastrukturális és projekt-finanszírozási deal-flow-k strukturálására szakosodott tanácsadó cég.',
    tocTitle: 'Tartalomjegyzék',
    guidePriceLabel: 'Irányár',
    keyFeaturesLabel: 'Főbb Jellemzők',
    items: huJson.PropertyTeaserGrid.items,
    intlBadge: 'NEMZETKÖZI DIVÍZIÓ',
    intlTitle: huJson.InternationalDivision.title,
    intlSubtitle: huJson.InternationalDivision.subtitle,
    energyTitle: huJson.InternationalDivision.energyTitle,
    energyDesc: huJson.InternationalDivision.energyDesc,
    telecomTitle: huJson.InternationalDivision.telecomTitle,
    telecomDesc: huJson.InternationalDivision.telecomDesc,
    agriTitle: huJson.InternationalDivision.agriTitle,
    agriDesc: huJson.InternationalDivision.agriDesc,
    mobileBadge: huJson.MobileHome.badge,
    mobileTitle: huJson.MobileHome.title,
    mobileSubtitle: huJson.MobileHome.subtitle,
    feature1Title: huJson.MobileHome.feature1Title,
    feature1Desc: huJson.MobileHome.feature1Desc,
    feature2Title: huJson.MobileHome.feature2Title,
    feature2Desc: huJson.MobileHome.feature2Desc,
    feature3Title: huJson.MobileHome.feature3Title,
    feature3Desc: huJson.MobileHome.feature3Desc,
    b2bTitle: huJson.MobileHome.b2bTitle,
    b2bSubtitle: huJson.MobileHome.b2bSubtitle,
    contactTitle: 'Kapcsolat & Befektetői Tanácsadás',
    contactSubtitle: 'Kiemelt üzleti és off-market befektetési megkeresések',
    rolePrimary: huJson.ContactInfoCards.rolePrimary
  };

  const tEN = {
    metaTitle: 'HOMLAMENTOR KFT — Premium Investment Portfolio',
    execSummaryTitle: 'Executive Summary & Strategic Vision',
    execSummaryDesc: 'HOMLAMENTOR KFT is a premier corporate advisory firm specializing in off-market real estate investments across Central Europe and structuring high-yield infrastructure projects in West Africa (Abidjan, Ivory Coast).',
    tocTitle: 'Table of Contents',
    guidePriceLabel: 'Asking Price',
    keyFeaturesLabel: 'Key Highlights',
    items: enJson.PropertyTeaserGrid.items,
    intlBadge: 'INTERNATIONAL DIVISION',
    intlTitle: enJson.InternationalDivision.title,
    intlSubtitle: enJson.InternationalDivision.subtitle,
    energyTitle: enJson.InternationalDivision.energyTitle,
    energyDesc: enJson.InternationalDivision.energyDesc,
    telecomTitle: enJson.InternationalDivision.telecomTitle,
    telecomDesc: enJson.InternationalDivision.telecomDesc,
    agriTitle: enJson.InternationalDivision.agriTitle,
    agriDesc: enJson.InternationalDivision.agriDesc,
    mobileBadge: enJson.MobileHome.badge,
    mobileTitle: enJson.MobileHome.title,
    mobileSubtitle: enJson.MobileHome.subtitle,
    feature1Title: enJson.MobileHome.feature1Title,
    feature1Desc: enJson.MobileHome.feature1Desc,
    feature2Title: enJson.MobileHome.feature2Title,
    feature2Desc: enJson.MobileHome.feature2Desc,
    feature3Title: enJson.MobileHome.feature3Title,
    feature3Desc: enJson.MobileHome.feature3Desc,
    b2bTitle: enJson.MobileHome.b2bTitle,
    b2bSubtitle: enJson.MobileHome.b2bSubtitle,
    contactTitle: 'Contact & Advisory Services',
    contactSubtitle: 'Institutional Deal Flow & Investment Inquiries',
    rolePrimary: enJson.ContactInfoCards.rolePrimary
  };

  const templatePath = path.join(__dirname, 'templates', 'portfolio_magazine.ejs');

  console.log('1. EJS HTML sablonok kirendelése...');
  const htmlHU = await ejs.renderFile(templatePath, { lang: 'hu', t: tHU });
  const htmlEN = await ejs.renderFile(templatePath, { lang: 'en', t: tEN });

  console.log('2. Puppeteer indítása és PDF generálás...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // HU PDF
  console.log('   -> Magyar PDF generálása (Homola_Portfolio_Magazin_HU.pdf)...');
  const pageHU = await browser.newPage();
  await pageHU.setContent(htmlHU, { waitUntil: 'networkidle0' });
  const pdfPathHU = path.join(__dirname, '..', 'Homola_Portfolio_Magazin_HU.pdf');
  await pageHU.pdf({
    path: pdfPathHU,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await pageHU.close();

  // EN PDF
  console.log('   -> Angol PDF generálása (Homola_Portfolio_Magazine_EN.pdf)...');
  const pageEN = await browser.newPage();
  await pageEN.setContent(htmlEN, { waitUntil: 'networkidle0' });
  const pdfPathEN = path.join(__dirname, '..', 'Homola_Portfolio_Magazine_EN.pdf');
  await pageEN.pdf({
    path: pdfPathEN,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await pageEN.close();

  await browser.close();

  console.log('\n========================================================================');
  console.log('🎉 PORTFÓLIÓ MAGAZIN PDF-EK SIKERESEN KISZÁMÍTVA ÉS ELMENTVE!');
  console.log(`   - HU: ${pdfPathHU}`);
  console.log(`   - EN: ${pdfPathEN}`);
  console.log('========================================================================');
}

main().catch(err => {
  console.error('❌ Végzetes hiba a PDF generálás során:', err);
  process.exit(1);
});
