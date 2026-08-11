/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates public/Portfolio_EN_v6.pdf: a full English-language mirror of the
 * current public/Portfolio_HU_v6.pdf (13 real estate assets, West African
 * infrastructure incubator with solar project table and EPC/BOT construction
 * opportunities, modular housing section, contact/disclaimer page).
 *
 * NOTE: This content is intentionally hardcoded (not sourced from src/messages/*.json)
 * because it mirrors the exact current Portfolio_HU_v6.pdf, which already contains
 * 13 properties and an expanded Africa section beyond what src/messages/hu.json and
 * n8n/templates/portfolio_magazine.ejs currently produce (9 properties, 3 pillars only).
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const properties = [
  {
    category: 'Industrial & Logistics',
    title: 'Győrszentiván Industrial & Agricultural Land',
    price: '6,000,000 EUR',
    location: 'Győrszentiván (1 km from M1 highway)',
    description:
      'Strategically located industrial and agricultural land in Győrszentiván, just 1 km from the M1 highway. The complex includes a 10,300 m² developed industrial facility, 107 hectares of high-quality arable land, and a 46-hectare licensed gravel quarry with a direct railway connection.',
    features: ['M1 highway 1 km away', '10,300 m² industrial facility', '107 ha arable land', '46 ha licensed gravel pit with rail siding'],
  },
  {
    category: 'Healthcare & Senior Living',
    title: 'Nagycenk Senior Living & Healthcare Center',
    price: '9,000,000 EUR',
    location: 'Nagycenk (Sopron region)',
    description:
      'Premium senior living and healthcare complex in Nagycenk at 75% completion. Set in a 1.7-hectare mature tree park, the 6,284 m² building can be completed turnkey in approximately 8 months. Features 56 senior care units, 18 upgraded apartments, a private wellness section, and a healthcare block.',
    features: ['75% completion rate', '8-month turnkey completion', '1.7 ha land', '6,284 m² floor area', '56+18 residential units with wellness'],
  },
  {
    category: 'Tourism & Hospitality',
    title: 'Szentendre Pap Island Thermal Resort',
    price: 'On Request (Off-Market)',
    location: 'Szentendre, Pap Island (20 km from Budapest)',
    description:
      'Unique Danube waterfront tourism and wellness development opportunity on Pap Island in Szentendre. The 3.5-hectare private estate features its own 1,850-meter deep thermal well yielding 50°C water at 1,500 liters/minute. Located just 20 km from Budapest.',
    features: ['3.5 ha Danube waterfront private land', 'Own 1,850 m deep thermal well (50°C, 1,500 L/min)', '20 km from Budapest'],
  },
  {
    category: 'Tourism & Hospitality / Residential',
    title: 'Keszthely Balaton Residential Park Project',
    price: '8,000,000 USD',
    location: 'Keszthely (Lake Balaton shore)',
    description:
      'Premium development plot of nearly 1 hectare, directly near Lake Balaton in Keszthely. The site includes a structurally complete 42-unit luxury condominium shell with a finished underground garage, elevator shafts, and approved plans.',
    features: ['Nearly 1 ha plot near Lake Balaton', 'Structurally complete 42-unit condominium shell', 'Finished underground garage and elevator shafts'],
  },
  {
    category: 'Industrial & Logistics',
    title: 'Truck Park & Logistics Terminal (M5)',
    price: '5,000,000,000 HUF',
    location: 'Hungarian-Serbian border zone (M5 highway)',
    description:
      'International truck park and logistics terminal directly adjacent to the M5 motorway, in the Hungarian-Serbian border zone. The fenced, 6.66-hectare industrial site accommodates up to 370 trucks simultaneously, with a TIR service center, driver motel, and a 200-seat full-service restaurant.',
    features: ['Hungarian-Serbian border zone', 'Directly by the M5 motorway', '6.66 ha industrial site', '370-truck capacity', 'TIR service, motel, and 200-seat restaurant'],
  },
  {
    category: 'Commercial / Retail',
    title: 'Keszthely Vt-8 Commercial Development Plot',
    price: '1,050,000 EUR',
    location: 'Keszthely (southern approach road)',
    description:
      'A contiguous 17,943 m² commercial development plot along the southern approach road into Keszthely. Zoned Vt-8 with 50-75% buildable ratio, ideal for a department store or retail park. The property is available together with a 100% clean single-purpose vehicle (share deal).',
    features: ['17,943 m² contiguous plot on southern approach road', 'Vt-8 commercial zoning', '100% clean SPV (share deal)'],
  },
  {
    category: 'Tourism & Hospitality',
    title: 'Hotel die Traube (Admont, Austria)',
    price: '1,950,000 EUR',
    location: 'Admont, Styria (Austria)',
    description:
      'Operational, storied traditional hotel and hospitality complex in Admont, Styria (Austria). The debt-free property is offered together with a 100% Austrian GmbH. The seller offers an immediate leaseback and long-term operating guarantee to the investor upon request.',
    features: ['Operational Styrian hotel property', 'Debt-free, offered with a 100% Austrian GmbH', 'Immediate leaseback and management offer available'],
  },
  {
    category: 'Tourism & Hospitality',
    title: 'Balaton Wellness Park & Resort (Gyenesdiás)',
    price: '2,150,000,000 HUF',
    location: 'Gyenesdiás (Lake Balaton)',
    description:
      '49,000 m² wellness park and resort complex located in Gyenesdiás. Features 2,300 m² of high-end structures (10 equipped apartments, restaurant, wellness area), accompanied by a fully serviced 100-pitch premium RV/camper park.',
    features: ['49,000 m² contiguous land', '2,300 m² built structure (10 apartments, restaurant, wellness)', '100-pitch premium RV park'],
  },
  {
    category: 'Tourism & Hospitality / Luxury',
    title: 'Balatongyörök Golf Course & Waterfront Property',
    price: '6,000,000 EUR',
    location: 'Balatongyörök (direct Lake Balaton shore)',
    description:
      'A rare 72-hectare direct Lake Balaton waterfront property ensemble in Balatongyörök. Includes an operational 18-hole championship golf course built to international standards, private beach, clubhouse, and panoramic restaurant, with marina and apartment park expansion potential.',
    features: ['72 ha direct Lake Balaton waterfront plot', 'Operational 18-hole championship golf course with beach & clubhouse', 'Marina development option'],
  },
  {
    category: 'Industrial & Logistics',
    title: 'Üllő Strategic Development Site (Small Parcel)',
    price: '780,000,000 HUF',
    location: 'Üllő, M4 motorway / Airport junction',
    description:
      "Premium development site in one of the most dynamically growing logistics zones of Budapest's south-eastern agglomeration. The 18,247 m² (1.82 ha) plot sits directly at the M4 motorway junction, 5 km from Budapest Ferihegy Airport, neighboring the Ferihegy Industrial Park (FIP) and major corporate tenants (SPAR, Rossmann, Auchan). The site holds Priority Development Area status (Resolution 25/2022), is debt-free, held under 1/1 corporate title, and available for immediate possession.",
    features: [
      '18,247 m² (1.82 ha) across three plots (parcels 3633/2, 3634/3, 3635)',
      'Direct M4 motorway junction, excellent visibility',
      'Airport (BUD): 5 km (~7 min) · M0 Ring Road: ~8 min',
      'Zoning: Gksz-Sz2 (Commercial & Service), max. 40% buildable (~7,300 m²)',
      'Max. building height 8.0 m; redundant utilities, dual power feed, two drilled wells',
      'Priority Development Area – accelerated permitting',
    ],
  },
  {
    category: 'Industrial & Logistics',
    title: 'Nagykanizsa Industrial Site (Vágóhíd utca)',
    price: '460,000,000 HUF',
    location: '8800 Nagykanizsa, Vágóhíd utca 4.',
    description:
      'Industrial site for sale in Nagykanizsa, directly adjacent to Road 71 with excellent transport links. The 1.5–2 hectare built-up industrial plot includes a processing hall, a large warehouse building, and complete industrial infrastructure — ideal for food processing, logistics, warehousing, or light manufacturing. Lake Balaton is just 30 km away, Hévíz 32 km, with direct access to the M7 motorway.',
    features: [
      '1.5–2 ha (15,000–20,000 m²) industrial plot',
      'Built-up area ~4,500 m² + loading zones (main hall ~2,594 m², warehouse ~2,214 m²)',
      'Full utilities: 380V industrial power, water, gas, sewage',
      'Truck loading docks, ample parking, multiple entrances, CCTV',
      'Lake Balaton: 30 km · Hévíz: 32 km · M7: direct access · Zalaegerszeg: 38 km',
    ],
  },
  {
    category: 'Industrial & Logistics',
    title: 'Székesfehérvár Strategic Industrial & Logistics Site',
    price: '5,000,000 EUR (asking price)',
    location: 'Székesfehérvár, near Börgönd road (airport-adjacent zone)',
    description:
      "An exceptionally located industrial and logistics development site in Székesfehérvár, one of Hungary's key transport hubs, midway between Budapest and Lake Balaton. Accessible from Börgönd road (~500 m), which connects the city to the airport. The grass-covered greenfield site requires no demolition and is immediately developable. The planned industrial park next to the airport and growing freight rail capacity (VO ring) offer an excellent investment case.",
    features: [
      'Directly adjacent to the M7 motorway (with visibility)',
      'M6 motorway: 30 km (toward Croatia/Serbia) · M1 motorway: 40 km (toward Austria/Slovakia) · M0 Ring Road: 45 km',
      'Börgönd Airport: ~500 m (under government-mandated development)',
      'Börgönd railway station on the VO freight ring (Záhony–Győr); high-capacity substation nearby',
      'Greenfield, debt-free, immediately developable (parcel 020388/10)',
    ],
  },
  {
    category: 'Industrial & Logistics',
    title: 'Üllő Large Industrial Site (115 ha)',
    price: '20,000–25,000 HUF/m²',
    location: 'Üllő, near M4 motorway / Budapest Ferenc Liszt Airport',
    description:
      'An outstanding 115-hectare industrial development base site in Üllő, directly alongside the M4 motorway near Budapest Ferenc Liszt Airport. The site is zoned for development and immediately buildable, with a permitted building height of 12 meters. An adjacent 330-hectare site can also be acquired by agreement at roughly half price (HUF 10,000–15,000/m²), enabling an exceptionally large integrated industrial park.',
    features: [
      '115 ha base site, zoned for development, immediately buildable',
      '12 m permitted building height',
      'M4 motorway: 100 m · Budapest Ferihegy (Terminal 4): a few km · Budapest–Belgrade railway: 500 m',
      'Option: +330 ha adjacent site at ~HUF 10,000–15,000/m² (by agreement)',
      'Ideal for logistics, large-format warehousing, industrial park, e-commerce hub',
    ],
  },
];

const solarProjects = [
  { location: 'Katiola', size: '50 MWac', storage: 'None', contract: 'PPP/IPP/PPA', cost: 'EUR 47 million' },
  { location: 'Tengrela', size: '50 MWac', storage: 'None', contract: 'PPP/IPP/PPA', cost: 'EUR 47 million' },
  { location: 'Bouna', size: '2×50 MWac', storage: 'None', contract: 'PPP/IPP/PPA', cost: 'EUR 100 million' },
  { location: 'Dabakala', size: '100 MWac', storage: '33 MWh', contract: 'PPP/IPP/PPA', cost: 'EUR 110 million' },
  { location: 'Niakaramandougou', size: '100 MWac', storage: '33 MWh', contract: 'PPP/IPP/PPA', cost: 'EUR 110 million' },
  { location: 'Singrobo (floating)', size: '30/22 MWac', storage: 'None', contract: 'JV/PPA', cost: 'EUR 27 million' },
  { location: 'Singrobo', size: '30/22 MWac', storage: 'None', contract: 'JV/PPA', cost: 'EUR 25 million' },
  { location: 'Soubré (floating)', size: '50 MWac', storage: 'None', contract: 'PPP/IPP/PPA', cost: 'EUR 50 million' },
  { location: 'Popoli (floating)', size: '50 MWac', storage: 'None', contract: 'PPP/IPP/PPA', cost: 'EUR 50 million' },
];

const epcOpportunities = [
  {
    name: 'YOP Village',
    detail:
      'Abidjan, Yopopgon district – 8 ha, EUR 330 million, EPC+F, JV/Consortium agreement, immediate start. Documentation available upon signature of the RDA.',
  },
  {
    name: 'Diamond City',
    detail:
      'Songon – entirely new 60,000-unit city development. State project awarded to a private developer, EPC+F participation. An in-person meeting in Abidjan is required to finalize details.',
  },
  {
    name: 'Abidjan Shopping Malls',
    detail: 'Multiple projects, valued at XOF 3–5 billion, BOT contract. Documentation available following the RDA.',
  },
  {
    name: 'San Pedro Industrial Zone',
    detail: '250 ha, entirely new industrial zone, BOT contract. Documentation available following the RDA.',
  },
];

function renderPropertyCard(prop) {
  const featureItems = prop.features
    .map(
      (feat) => `<div class="flex items-center text-xs text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 flex-shrink-0"></span>
        <span>${feat}</span>
      </div>`,
    )
    .join('\n');

  return `<div class="card-dark p-6 rounded-xl relative">
    <div class="flex justify-between items-start mb-3">
      <div>
        <span class="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wider uppercase border border-amber-500/30 mb-2">
          ${prop.category}
        </span>
        <h3 class="font-serif text-xl font-bold text-white leading-tight">
          ${prop.title}
        </h3>
      </div>
      <div class="text-right">
        <span class="text-xs text-slate-400 block tracking-wider uppercase">Asking Price</span>
        <span class="font-serif text-lg font-bold text-amber-400">${prop.price}</span>
      </div>
    </div>

    <div class="flex items-center text-xs text-amber-200/90 mb-4 bg-amber-500/5 px-3 py-1.5 rounded border border-amber-500/10">
      <svg class="w-4 h-4 mr-1.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>${prop.location}</span>
    </div>

    <p class="text-slate-300 text-xs leading-relaxed mb-4">
      ${prop.description}
    </p>

    <div>
      <span class="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-2">Key Highlights:</span>
      <div class="grid grid-cols-2 gap-2">
        ${featureItems}
      </div>
    </div>
  </div>`;
}

function renderPropertyPages() {
  const pages = [];
  for (let i = 0; i < properties.length; i += 2) {
    const chunk = properties.slice(i, i + 2);
    const pageNum = 3 + Math.floor(i / 2);
    pages.push(`<div class="page">
      <div>
        <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-6">
          <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">Section I — Real Estate Investment Portfolio</span>
          <span class="text-xs text-slate-500 uppercase tracking-wider">Off-Market Opportunities</span>
        </div>
        <div class="space-y-6">
          ${chunk.map(renderPropertyCard).join('\n')}
        </div>
      </div>
      <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
        <span>HOMLAMENTOR KFT — Off-Market Real Estate</span>
        <span>Page ${pageNum}</span>
      </div>
    </div>`);
  }
  return pages.join('\n');
}

function renderSolarTableRows() {
  return solarProjects
    .map(
      (p) => `<tr class="border-b border-slate-800">
        <td class="py-2 pr-3 text-slate-200">${p.location}</td>
        <td class="py-2 pr-3 text-slate-300">${p.size}</td>
        <td class="py-2 pr-3 text-slate-300">${p.storage}</td>
        <td class="py-2 pr-3 text-slate-300">${p.contract}</td>
        <td class="py-2 text-amber-400 font-semibold">${p.cost}</td>
      </tr>`,
    )
    .join('\n');
}

function renderEpcOpportunities() {
  return epcOpportunities
    .map(
      (o) => `<div class="bg-slate-900/80 p-3 rounded border border-slate-800 mb-2">
        <span class="font-bold text-amber-400 block mb-1">${o.name}</span>
        <span class="text-slate-300 text-xs">${o.detail}</span>
      </div>`,
    )
    .join('\n');
}

const propertyPageCount = Math.ceil(properties.length / 2);
const lastPropertyPageNum = 2 + propertyPageCount;

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HOMLAMENTOR KFT — Premium Investment Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { background-color: #090a0f; color: #e2e8f0; font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; }
    .font-serif { font-family: 'Playfair Display', serif; }
    .page { width: 210mm; height: 297mm; page-break-after: always; page-break-inside: avoid; position: relative; overflow: hidden; background: #090a0f; display: flex; flex-direction: column; justify-content: space-between; padding: 18mm 16mm; }
    .page-cover { padding: 0; background: radial-gradient(circle at 50% 30%, #1e1b12 0%, #090a0f 70%); }
    .gold-gradient-text { background: linear-gradient(135deg, #f3e7e1 0%, #d4af37 50%, #aa7c11 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .gold-border { border: 1px solid rgba(212, 175, 55, 0.35); }
    .gold-bg-subtle { background: rgba(212, 175, 55, 0.06); }
    .card-dark { background: rgba(19, 21, 31, 0.85); border: 1px solid rgba(212, 175, 55, 0.25); }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body class="bg-[#090a0f] text-slate-200">

  <!-- PAGE 1: COVER -->
  <div class="page page-cover flex flex-col justify-between relative text-center">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#090a0f] to-[#090a0f]"></div>
    <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>
    <div class="relative z-10 pt-16 px-12">
      <div class="inline-block px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs tracking-[0.25em] font-semibold uppercase mb-6">
        HOMLAMENTOR KFT — ADVISORY PORTFOLIO
      </div>
      <h1 class="font-serif text-5xl tracking-wide font-bold gold-gradient-text uppercase leading-tight mb-4">
        PREMIUM INVESTMENT<br>PORTFOLIO
      </h1>
      <div class="h-0.5 w-32 bg-amber-500/50 mx-auto my-6"></div>
      <p class="text-slate-300 text-lg tracking-widest font-light uppercase">
        Real Estate &amp; Global Infrastructure
      </p>
    </div>
    <div class="relative z-10 mx-auto my-auto w-64 h-64 rounded-full border border-amber-500/30 p-4 flex items-center justify-center bg-gradient-to-b from-amber-500/10 to-transparent shadow-[0_0_50px_rgba(212,175,55,0.1)]">
      <div class="w-full h-full rounded-full border border-amber-400/20 flex flex-col items-center justify-center text-center p-6 bg-[#090a0f]/80">
        <svg class="w-12 h-12 text-amber-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-14 0v-5a2 2 0 012-2h2a2 2 0 012 2v5" />
        </svg>
        <span class="text-xs uppercase tracking-widest text-amber-200/80 font-medium">Exclusive Deal Flow</span>
        <span class="text-2xl font-bold font-serif text-white mt-1">2026</span>
      </div>
    </div>
    <div class="relative z-10 pb-16 px-12 text-center bg-gradient-to-t from-[#090a0f] to-transparent">
      <p class="text-amber-400 text-sm font-semibold tracking-wider uppercase mb-1">
        HOMLAMENTOR KFT — European &amp; West African Operations
      </p>
      <p class="text-slate-400 text-xs tracking-wider">
        Budapest • Sopron • Abidjan (Ivory Coast) • Lusaka (Zambia)
      </p>
      <p class="text-slate-500 text-[10px] mt-4 tracking-widest uppercase">
        CONFIDENTIAL &amp; PROPRIETARY — FOR INSTITUTIONAL INVESTORS ONLY
      </p>
    </div>
  </div>

  <!-- PAGE 2: TOC + EXEC SUMMARY -->
  <div class="page">
    <div>
      <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-8">
        <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">HOMLAMENTOR KFT — Executive Overview</span>
        <span class="text-xs text-slate-500 uppercase tracking-wider">Portfolio Dossier</span>
      </div>
      <h2 class="font-serif text-3xl font-bold gold-gradient-text mb-4">Executive Summary &amp; Strategic Vision</h2>
      <p class="text-slate-300 text-sm leading-relaxed mb-6">
        HOMLAMENTOR KFT is a premier corporate advisory firm specializing in off-market industrial, logistics, and tourism real estate investments, and structuring infrastructure and project-finance deal flow in West Africa (Abidjan, Ivory Coast).
      </p>
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="card-dark p-4 rounded-lg">
          <div class="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Real Estate Assets</div>
          <div class="text-2xl font-serif font-bold text-white mb-1">13 Projects</div>
          <p class="text-slate-400 text-xs">Off-market logistics, senior living, thermal and luxury real estate, plus prime waterfront plots.</p>
        </div>
        <div class="card-dark p-4 rounded-lg">
          <div class="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Global Infrastructure</div>
          <div class="text-2xl font-serif font-bold text-white mb-1">West Africa Hub</div>
          <p class="text-slate-400 text-xs">ECOWAS renewable energy (50+ MW Solar), telecom infrastructure, and agro-industrial development.</p>
        </div>
      </div>
      <div class="card-dark p-6 rounded-xl gold-bg-subtle mb-6">
        <h3 class="font-serif text-xl font-bold text-amber-300 mb-4 border-b border-amber-500/20 pb-2">Table of Contents</h3>
        <ul class="space-y-3 text-sm">
          <li class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="font-medium text-slate-200">1. Off-Market Real Estate Investment Portfolio (13 Assets)</span>
            <span class="text-amber-400 font-semibold text-xs">Section I</span>
          </li>
          <li class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="font-medium text-slate-200">2. International Division &amp; African Infrastructure Incubator</span>
            <span class="text-amber-400 font-semibold text-xs">Section II</span>
          </li>
          <li class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="font-medium text-slate-200">3. Modular B2B MobileHome Export Initiative</span>
            <span class="text-amber-400 font-semibold text-xs">Section III</span>
          </li>
          <li class="flex justify-between items-center">
            <span class="font-medium text-slate-200">4. Advisory &amp; Investor Contact Details</span>
            <span class="text-amber-400 font-semibold text-xs">Section IV</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
      <span>HOMLAMENTOR KFT</span>
      <span>Page 2</span>
    </div>
  </div>

  <!-- SECTION I: 13 PROPERTIES -->
  ${renderPropertyPages()}

  <!-- SECTION II: AFRICA INFRASTRUCTURE PILLARS -->
  <div class="page">
    <div>
      <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-6">
        <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">Section II — International Division &amp; Infrastructure</span>
        <span class="text-xs text-slate-500 uppercase tracking-wider">West Africa Hub (Abidjan)</span>
      </div>
      <div class="mb-6">
        <span class="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wider uppercase border border-amber-500/30 mb-2">
          INTERNATIONAL DIVISION
        </span>
        <h2 class="font-serif text-2xl font-bold gold-gradient-text mb-3">West African Infrastructure &amp; Project Finance</h2>
        <p class="text-slate-300 text-xs leading-relaxed mb-6">
          Outstanding off-market investment and co-investment opportunities in Ivory Coast (centered in Abidjan) for private equity funds and banks, featuring sovereign guarantees, high yields, and tax exemptions within the ECOWAS free trade zone.
        </p>
      </div>
      <div class="space-y-4 mb-6">
        <div class="card-dark p-4 rounded-xl">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm mr-3 border border-amber-500/30">01</div>
            <h3 class="font-serif font-bold text-white text-base">Renewable Energy</h3>
          </div>
          <p class="text-slate-300 text-xs leading-relaxed pl-11">
            Development of 50+ MW grid-connected solar power plants and networks, backed by long-term sovereign power purchase guarantees and multilateral credit support. See the current solar pipeline and grid infrastructure details on the following page.
          </p>
        </div>
        <div class="card-dark p-4 rounded-xl">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm mr-3 border border-amber-500/30">02</div>
            <h3 class="font-serif font-bold text-white text-base">Telecommunications Infrastructure</h3>
          </div>
          <p class="text-slate-300 text-xs leading-relaxed pl-11">
            Construction and operation of a nationwide telecom tower network (TowerCo) at strategic locations across Ivory Coast, backed by long-term lease agreements.
          </p>
        </div>
        <div class="card-dark p-4 rounded-xl">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm mr-3 border border-amber-500/30">03</div>
            <h3 class="font-serif font-bold text-white text-base">Agriculture &amp; Food Processing</h3>
          </div>
          <p class="text-slate-300 text-xs leading-relaxed pl-11">
            Establishment of modern agricultural feed and food processing plants to serve growing local food demand, within a customs- and tax-exempt zone.
          </p>
        </div>
      </div>
      <div class="card-dark p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40">
        <h4 class="font-serif font-bold text-amber-300 text-sm mb-2">ECOWAS Free Trade &amp; Investment Incentives</h4>
        <ul class="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Corporate Tax Holidays for initial operating years.</li>
          <li>Customs Duty Exemptions on capital machinery and equipment.</li>
          <li>100% Repatriation of Profits &amp; Capital for foreign private equity investors.</li>
        </ul>
      </div>
    </div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
      <span>HOMLAMENTOR KFT — African Infrastructure</span>
      <span>Page ${lastPropertyPageNum + 1}</span>
    </div>
  </div>

  <!-- SECTION II continued: SOLAR PIPELINE TABLE + EPC/BOT OPPORTUNITIES -->
  <div class="page">
    <div>
      <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-6">
        <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">Section II — International Division &amp; Infrastructure</span>
        <span class="text-xs text-slate-500 uppercase tracking-wider">Solar Pipeline &amp; EPC/BOT Opportunities</span>
      </div>

      <h3 class="font-serif text-lg font-bold text-amber-300 mb-3">Solar Power Plant Pipeline (Ivory Coast)</h3>
      <div class="card-dark p-4 rounded-xl mb-4 overflow-hidden">
        <table class="text-xs">
          <thead>
            <tr class="border-b border-amber-500/30 text-amber-300 text-left">
              <th class="py-2 pr-3 font-semibold uppercase tracking-wider">Location</th>
              <th class="py-2 pr-3 font-semibold uppercase tracking-wider">Size</th>
              <th class="py-2 pr-3 font-semibold uppercase tracking-wider">Storage/BESS</th>
              <th class="py-2 pr-3 font-semibold uppercase tracking-wider">Contract</th>
              <th class="py-2 font-semibold uppercase tracking-wider">Gross Cost</th>
            </tr>
          </thead>
          <tbody>
            ${renderSolarTableRows()}
          </tbody>
        </table>
      </div>
      <p class="text-slate-300 text-xs leading-relaxed mb-6">
        Construction of an electricity transmission and distribution network in the northern regions. Project owner: Côte d'Ivoire Energy (state-owned utility), under an EPC + pre-financing framework. Budget allocated for Phase 1: XOF 14 billion (1 EUR = XOF 655.795, fixed). Medium- and low-voltage network construction: approx. 3,500 km.
      </p>

      <h3 class="font-serif text-lg font-bold text-amber-300 mb-3">Construction &amp; Real Estate Development Opportunities (EPC+F / BOT)</h3>
      <p class="text-slate-300 text-xs leading-relaxed mb-3">
        Featured construction and real estate development opportunities available in Abidjan and across Ivory Coast, under EPC+F and BOT structures:
      </p>
      <div class="text-xs">
        ${renderEpcOpportunities()}
      </div>
    </div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
      <span>HOMLAMENTOR KFT — African Infrastructure</span>
      <span>Page ${lastPropertyPageNum + 2}</span>
    </div>
  </div>

  <!-- SECTION III: MODULAR HOUSING -->
  <div class="page">
    <div>
      <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-6">
        <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">Section III — Modular Housing &amp; B2B Export</span>
        <span class="text-xs text-slate-500 uppercase tracking-wider">MobileHome Concept</span>
      </div>
      <div class="mb-6">
        <span class="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wider uppercase border border-amber-500/30 mb-2">
          MODULAR HOUSING
        </span>
        <h2 class="font-serif text-2xl font-bold gold-gradient-text mb-3">Containerized Mobile Homes &amp; Regional Expansion</h2>
        <p class="text-slate-300 text-xs leading-relaxed mb-6">
          Premium-quality, container-shippable, solar self-sufficient modular living spaces (30 m², 50 m², 80-100 m²), optimized for European export and African assembly.
        </p>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card-dark p-4 rounded-xl text-center">
          <div class="text-amber-400 text-2xl font-bold font-serif mb-1">100%</div>
          <div class="text-xs font-semibold text-white mb-2">Fully Containerized</div>
          <p class="text-slate-400 text-[11px]">Rapidly and easily deployable anywhere in the world via standard ocean container logistics.</p>
        </div>
        <div class="card-dark p-4 rounded-xl text-center">
          <div class="text-amber-400 text-2xl font-bold font-serif mb-1">50%</div>
          <div class="text-xs font-semibold text-white mb-2">Labor Cost Savings</div>
          <p class="text-slate-400 text-[11px]">Achieved by engaging local labor at the African (Abidjan and Lusaka) assembly plants.</p>
        </div>
        <div class="card-dark p-4 rounded-xl text-center">
          <div class="text-amber-400 text-2xl font-bold font-serif mb-1">Profit</div>
          <div class="text-xs font-semibold text-white mb-2">100% Transport Profit</div>
          <p class="text-slate-400 text-[11px]">Driven by the shipping efficiency of flat-pack modular homes assembled on-site.</p>
        </div>
      </div>
      <div class="card-dark p-6 rounded-xl mb-6">
        <h3 class="font-serif font-bold text-amber-300 text-base mb-3">Strategic &amp; Economic Advantages for Manufacturing Partners</h3>
        <p class="text-slate-300 text-xs leading-relaxed mb-4">HOMLAMENTOR KFT's logistics and assembly franchise structure delivers a direct financial and competitive advantage in the international market.</p>
        <div class="space-y-3 text-xs">
          <div class="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span class="font-bold text-amber-400 block mb-1">1. Flat-Pack Containerized Logistics</span>
            <span class="text-slate-300">Containerized shipping converts overseas transport overhead into net operational margin.</span>
          </div>
          <div class="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span class="font-bold text-amber-400 block mb-1">2. Local Assembly Hubs (Abidjan &amp; Lusaka)</span>
            <span class="text-slate-300">Local skilled labor lowers assembly costs by 50% compared to European baselines.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
      <span>HOMLAMENTOR KFT — Modular Housing</span>
      <span>Page ${lastPropertyPageNum + 3}</span>
    </div>
  </div>

  <!-- SECTION IV: CONTACT -->
  <div class="page">
    <div>
      <div class="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-8">
        <span class="text-xs font-semibold text-amber-400 tracking-widest uppercase">Section IV — Advisory &amp; Contact</span>
        <span class="text-xs text-slate-500 uppercase tracking-wider">HOMLAMENTOR KFT</span>
      </div>
      <div class="text-center mb-8">
        <span class="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wider uppercase border border-amber-500/30 mb-2">
          DIRECT CONTACT
        </span>
        <h2 class="font-serif text-3xl font-bold gold-gradient-text mb-2">Contact &amp; Advisory Services</h2>
        <p class="text-slate-400 text-xs tracking-wider">Institutional Deal Flow &amp; Investment Inquiries</p>
      </div>
      <div class="card-dark p-8 rounded-2xl gold-bg-subtle max-w-xl mx-auto mb-8 text-center">
        <div class="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-300 font-serif text-2xl font-bold">
          LH
        </div>
        <h3 class="font-serif text-2xl font-bold text-white mb-1">László Homola</h3>
        <p class="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6">Managing Director &amp; Owner</p>
        <div class="space-y-3 text-sm text-slate-200">
          <div class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">office.homlamentor@gmail.com</span>
          </div>
          <div class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="font-medium">+36 70 633 270</span>
          </div>
          <div class="flex items-center justify-center">
            <svg class="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span class="font-medium">www.homolamentor.com</span>
          </div>
        </div>
      </div>
      <div class="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-500 leading-relaxed text-center">
        <strong>DISCLAIMER &amp; CONFIDENTIALITY NOTICE:</strong> This presentation and its attachments are confidential and intended solely for the use of institutional investors, private equity partners, and accredited buyers. All financial models, property dimensions, and deal structures are subject to Non-Disclosure Agreements (NDA) and formal verification.
      </div>
    </div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-800 text-[11px] text-slate-500">
      <span>HOMLAMENTOR KFT — Confidential Portfolio</span>
      <span>Page ${lastPropertyPageNum + 4}</span>
    </div>
  </div>

</body>
</html>`;
}

async function main() {
  console.log('====== HOMLAMENTOR KFT — EN PORTFOLIO PDF GENERATOR (v6, full content) ======\n');
  const html = buildHtml();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

  const outPath = path.join(__dirname, '..', 'public', 'Portfolio_EN_v6.pdf');
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();

  console.log(`✅ EN portfolio PDF generated: ${outPath}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Fatal error generating EN portfolio PDF:', err);
    process.exit(1);
  });
}

module.exports = { buildHtml, properties, solarProjects, epcOpportunities };
