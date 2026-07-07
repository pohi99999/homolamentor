# HomolaMentorKFT Weboldal

## Projekt leírása és célok
Ez a projekt a HomolaMentor KFT hivatalos weboldalának Next.js alapú forráskódját és fejlesztési dokumentációját tartalmazza, Vercel platformra történő deployoláshoz optimalizálva.

### Főbb funkciók és modulok:
1. **Főoldal és bemutatkozás**: A cég profiljának és szolgáltatásainak bemutatása.
2. **Afrika Inkubátor Landing Page**: Dedikált érkező oldal az afrikai inkubációs program népszerűsítésére és a jelentkezések kezelésére.
3. **Zárt Ingatlan Portál**: Regisztrációhoz és jogosultságokhoz kötött felület exkluzív ingatlanok, ipari területek és befektetési lehetőségek megjelenítésére.
4. **Kapcsolat és Ajánlatkérés**: Dinamikus űrlapok és integrált ügyfélszolgálati csatornák.

## Weboldal-specifikus Fejlesztési Napló

| Dátum | Elvégzett feladat | Státusz |
| :--- | :--- | :--- |
| 2026-07-07 | Git inicializálása, távoli repó hozzáadása és az alapvető `AGENT.md` struktúra létrehozása a modulok leírásával. | Kész |
| 2026-07-07 | Next.js projekt inicializálása (TS, Tailwind CSS, App Router, src), UI és i18n csomagok (framer-motion, lucide-react, next-intl) telepítése, [locale] routing struktúra, LanguageSwitcher komponens és a prémium sötét főoldal kialakítása. | Kész |
| 2026-07-07 | Prémium UI komponensek létrehozása: Sticky Navbar (hamburger menüvel), Hero szekció animált fényfoltokkal és beúszó elemekkel, ServiceSplit szekció interaktív kártyákkal és hover effektekkel. i18n lokalizáció és Next.js 15 Server Components integráció. | Kész |
| 2026-07-07 | Afrika-Inkubátor aloldal (`/afrika-inkubator`) létrehozása és integrálása. Kapcsolódó UI komponensek kifejlesztése: AfricaHero (meleg afrikai fényekkel), ThreeStepProcess (scrollra animált vertikális idővonal), SelabPromo (SELAB Livestock Show promóciós szekció) és LeadCaptureForm (sötét üveg hatású konzultációs űrlap mock API küldéssel). | Kész |
| 2026-07-07 | Ingatlan és Iparterület Portál aloldal (`/ingatlan-portal`) létrehozása és integrálása. Kapcsolódó UI komponensek kifejlesztése: RealEstateHero (kék építészeti blueprint ráccsal), PropertyTeaserGrid (kiemelt ajánlatok teaser-kártyáival, elhomályosított árakkal és lokációkkal), VIPAccessGateway (jelszavas védelem `homola-vip-2026`, rázkódási és feloldási animációkkal és a zárt off-market listával), valamint PropertyRequestForm (egyedi keresési igények leadásához). Navbar és ServiceSplit navigációs hivatkozásainak frissítése. | Kész |
| 2026-07-07 | Globális Brunella AI Chat Asszisztens (`AIChatAssistant.tsx`) kifejlesztése és integrálása a `layout.tsx`-be. Lebegő, pulzáló gomb kinyíló üveghatású chat felülettel, többnyelvű támogatással, mock válaszadási késleltetéssel és gépelési indikátorral. | Kész |
| 2026-07-07 | Vercel deployment előkészületek: `.gitignore` ellenőrzése, `.env.example` létrehozása a környezeti változók dokumentálására. ESLint hibák és warnings javítása (any castingok kiváltása, unused var elhárítása, useEffect-ben történő setState kiváltása JSX-es statikus rendereléssel az AIChatAssistant-ban). Sikeres pre-deploy lint és build futtatás. | Kész |
