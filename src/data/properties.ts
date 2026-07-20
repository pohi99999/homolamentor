export interface Property {
  id: string;
  title: string;
  location: string;
  price: string | number;
  currency: string;
  category: string;
  features: string[];
  description: string;
  translationKey: string;
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Győrszentiváni Ipari és Mezőgazdasági Terület",
    location: "Győrszentiván (M1 autópálya 1 km)",
    price: "6.000.000",
    currency: "EUR",
    category: "Ipari & Logisztika",
    features: [
      "M1 autópálya 1 km",
      "10.300 m² ipari telephely",
      "107 ha szántó",
      "46 ha engedélyezett kavicsbánya vasútvágánnyal"
    ],
    description: "Győrszentiván stratégiai fekvésű ipari és mezőgazdasági területe az M1-es autópályától mindössze 1 km-re található. A komplexum magában foglal egy 10.300 m²-es kiépített ipari telephelyet, 107 hektár jó minőségű szántót, valamint egy 46 hektáros, bányászati engedéllyel rendelkező kavicsbányát közvetlen vasútvágány kapcsolattal.",
    translationKey: "prop1"
  },
  {
    id: "2",
    title: "Nagycenk Senior Living & Egészségügyi Központ",
    location: "Nagycenk (Sopron régió)",
    price: "9.000.000",
    currency: "EUR",
    category: "Egészségügy & Senior Living",
    features: [
      "75%-os készültségi fok",
      "8 hónapos befejezés",
      "1,7 ha terület",
      "6.284 m² alapterület",
      "56+18 lakóegység wellnessel"
    ],
    description: "Nagycenken található prémium senior living és egészségügyi komplexum 75%-os készültségi állapotban. A 1,7 hektáros ősfás parkban elterülő, 6.284 m²-es felépítmény mintegy 8 hónap alatt kulcsrakészen befejezhető. A projekt 56 idősotthoni lakóegységet, 18 emelt szintű apartmant, saját wellness részleget és egészségügyi blokkot foglal magában.",
    translationKey: "prop2"
  },
  {
    id: "3",
    title: "Szentendre Pap-sziget Termál Resort",
    location: "Szentendre, Pap-sziget (Budapest 20 km)",
    price: "Kérésre (Off-Market)",
    currency: "",
    category: "Turizmus & Vendéglátó",
    features: [
      "3,5 ha Duna-parti magánterület",
      "saját 1.850 m mély termálkút (50°C, 1.500 liter/perc hozam)",
      "Budapest 20 km"
    ],
    description: "Egyedülálló Duna-parti turisztikai és wellness fejlesztési lehetőség Szentendrén, a Pap-szigeten. A 3,5 hektáros magánterület saját, 1.850 méter mélyről feltörő, 50°C-os termálkúttal rendelkezik (1.500 liter/perc hozammal). Budapesttől mindössze 20 km-re fekvő, ritka adottságú gyógy- és élményfürdő resort projekt.",
    translationKey: "prop3"
  },
  {
    id: "4",
    title: "Keszthelyi Balatoni Lakópark Projekt",
    location: "Keszthely (Balaton-part)",
    price: "8.000.000",
    currency: "USD",
    category: "Turizmus & Vendéglátó / Lakó",
    features: [
      "Közel 1 ha Balaton-parti telek",
      "szerkezetkész 42 lakásos társasház-váz",
      "komplett mélygarázzsal és liftaknákkal"
    ],
    description: "Közvetlen Balaton-közeli, közel 1 hektáros prémium fejlesztési telek Keszthelyen. A területen egy szerkezetkész állapotban lévő, 42 lakásos luxus társasház épülettömb található kiépített mélygarázzsal, liftaknákkal és jóváhagyott tervekkel.",
    translationKey: "prop4"
  },
  {
    id: "5",
    title: "Kamion Park & Logisztikai Terminál (M5)",
    location: "Magyar-szerb határövezet (M5 autópálya)",
    price: "5.000.000.000",
    currency: "HUF",
    category: "Ipari & Logisztika",
    features: [
      "Magyar-szerb határövezet",
      "M5 autópálya mellett",
      "6,66 ha ipari terület",
      "370 kamionos kapacitás",
      "TIR szerviz, motel és 200 fős étterem"
    ],
    description: "Nemzetközi kamionpark és logisztikai terminál az M5-ös autópálya közvetlen szomszédságában, a magyar-szerb határövezetben. A 6,66 hektáros bekerített ipari terület 370 kamion egyidejű parkolására alkalmas, TIR szervizzel, sofőrmotellel és 200 fős melegkonyhás étteremmel ellátott.",
    translationKey: "prop5"
  },
  {
    id: "6",
    title: "Keszthely Vt-8 Kereskedelmi Fejlesztési Telek",
    location: "Keszthely (Déli bevezető)",
    price: "1.050.000",
    currency: "EUR",
    category: "Kereskedelmi / Retail",
    features: [
      "17.943 m² egybefüggő terület déli bevezetőnél",
      "Vt-8 övezet (50-75% beépíthetőség)",
      "100% tiszta projektcég (Share Deal) kötbér-fedezettel"
    ],
    description: "Keszthely déli bevezető főútja mellett fekvő 17.943 m²-es, egybefüggő kereskedelmi fejlesztési telek. Vt-8 besorolású övezet 50-75%-os beépíthetőséggel, áruház vagy retail park létesítésére kiválóan alkalmas. Az ingatlan 100%-os tiszta projektcéggel együtt (Share Deal) megvásárolható, kötbér biztosítékkal.",
    translationKey: "prop6"
  },
  {
    id: "7",
    title: "Hotel die Traube (Admont, Ausztria)",
    location: "Admont, Stájerország (Ausztria)",
    price: "1.950.000",
    currency: "EUR",
    category: "Turizmus & Vendéglátó",
    features: [
      "Működő stájer szállodaingatlan",
      "100%-os osztrák GmbH-val együtt tehermentesen",
      "azonnali visszabérlési és üzemeltetési ajánlattal"
    ],
    description: "Működő, patinás hotel és vendéglátó komplexum az ausztriai Admontban (Stájerország). A tehermentes ingatlan 100%-os osztrák GmbH-val együtt eladó. Az eladó igény esetén azonnali visszabérlési és hosszú távú üzemeltetési garanciát nyújt a befektetőnek.",
    translationKey: "prop7"
  },
  {
    id: "8",
    title: "Balatoni Wellness Park & Resort (Gyenesdiás)",
    location: "Gyenesdiás (Balaton)",
    price: "2.150.000.000",
    currency: "HUF",
    category: "Turizmus & Vendéglátó",
    features: [
      "49.000 m² egybefüggő terület",
      "2.300 m² felépítmény (10 apartman, étterem, wellness)",
      "100 férőhelyes prémium lakóautó parkoló"
    ],
    description: "Gyenesdiáson található 49.000 m²-es wellness park és üdülőkomplexum. A területen 2.300 m²-nyi igényes felépítmény áll (10 felszerelt apartman, étterem, wellness részleg), kiegészítve egy 100 férőhelyes, közművesített prémium lakóautó és kemping parkolóval.",
    translationKey: "prop8"
  },
  {
    id: "9",
    title: "Balatongyöröki Golfpálya és Vízparti Terület",
    location: "Balatongyörök (Közvetlen Balaton-part)",
    price: "6.000.000",
    currency: "EUR",
    category: "Turizmus & Vendéglátó / Luxus",
    features: [
      "72 ha közvetlen Balaton-parti terület",
      "professzionális működő 18 lyukú golfkomplexum stranddal és klubházzal",
      "kikötőfejlesztési opcióval"
    ],
    description: "Különleges, 72 hektáros, közvetlen Balaton-parti ingatlankomplexum Balatongyörökön. Nemzetközi szabványoknak megfelelő, működő 18 lyukú golfpályát, saját strandot, klubházat és panorámás éttermet tartalmaz, vitorláskikötő és apartmanpark fejlesztési opcióval.",
    translationKey: "prop9"
  }
];
