# Ingatlan-kereső (kereslet–kínálat összekötő) — Design

**Dátum:** 2026-08-23
**Státusz:** Jóváhagyva brainstormingon, implementációs tervre vár
**Kezdeményezte:** Homola László felvetése

## Cél és kontextus

Ma az `/ingatlan-portal` oldal csak a saját, 9 tételes off-market portfóliót mutatja
be, VIP jelszavas kapu mögött. A `PropertyRequestForm` komponens gyűjt egy statikus
"egyedi igény" űrlapot (név, e-mail, terület-típus, lokáció), de ez csak e-mailt küld
(`/api/contact`) és n8n webhookot hív — **nem kerül CRM-be**, tehát nem látszik az
admin dashboardon.

Homola László felvetése: legyen egy **valódi kereső**, ahova a látogató beírhatja,
mit keres (pl. "Szeged, ipartelek"), a rendszer **élőben rákeres a nyilvános
internetre**, megmutat pár releváns találatot (nem a saját adatbázisunkból, hanem a
piacról), és egy "Érdekel" gombbal a látogató jelezheti az érdeklődését — **anélkül,
hogy elirányítanánk** a forrás oldalára. A HOMLAMENTOR csapata ezután maga veszi fel a
kapcsolatot a hirdetővel/forrással, és köti össze a keresletet a kínálattal.

Ez konzisztens a cég 2026-08-19-i repozicionálásával (l. `marketing/portfolio-magazine.html`):
a cég nem zárt ingatlanlistaként, hanem **működő nemzetközi kapcsolatrendszerként**
pozicionálja magát, ami bármilyen ingatlanigényt össze tud kötni.

## Hatókör

**Ez a spec tartalmazza:**
- Szabad szöveges keresőmező bármilyen ingatlantípusra (nem csak a cég B2B niche-ére —
  ez tudatos döntés, a repozicionálással összhangban)
- AI-ügynökös, élő webkeresés (Vercel AI Gateway, web-search képes modell)
- Paraprhrasált (nem szó szerint másolt) teaser-eredmények, forrás-link és hirdető
  elérhetősége nélkül
- "Érdekel" mini-űrlap → lead a CRM-be, csapat-értesítés, felhasználói visszaigazolás
- Admin dashboard bővítés a kereslet-oldali leadek megtekintésére
- AI Gateway-alapú per-user rate limiting

**Ez a spec NEM tartalmazza (jövőbeli bővítés):**
- A `homola-mcp-hub` (szüneteltetett MCP szerver) összekötése — külön döntés
- Automatikus, csapat-beavatkozás nélküli ajánlat-küldés a hirdetőnek
- Térképes/geolokációs keresés vagy szűrők (ár, méret) — induláskor csak szabad szöveg
- A meglévő 9 saját ingatlan és a kereső-találatok egy listába rendezése — külön marad
  a "saját portfólió" (VIP kapu) és az "AI-talált piaci lehetőség" (új szekció)

## Architektúra és adatfolyam

```
Látogató (bármely locale: hu/en/de/fr)
  │  beírja: "Szeged, ipartelek"
  ▼
PropertySearchSection (új kliens komponens, /ingatlan-portal oldalon,
  a Hero és a Teaser Grid között — kiváltja a mai PropertyRequestFormot)
  │  POST /api/property-search  { query, locale }
  ▼
/api/property-search (Next.js route handler)
  │  Vercel AI Gateway hívás (generateText + web-search tool)
  │  Prompt: "keress rá X-re, foglald össze SAJÁT SZAVAKKAL,
  │           NE add meg a forrás URL-jét vagy a hirdető elérhetőségét"
  │  providerOptions.gateway.user = anonim session-cookie ID (rate limit)
  ▼
Strukturált teaser-lista (0–5 elem) vagy őszinte üres állapot
  │
  ▼
Látogató megnézi a teasereket → "Érdekel" gombra kattint egy találatnál
  │  mini-űrlap: név + e-mail
  │  POST /api/property-search/interest { query, matchedTeaser, name, email, locale }
  ▼
/api/property-search/interest (Next.js route handler)
  ├─ Google Sheets: új sor a "Kereslet_Talalatok" lapon (gws CLI, execFileSync minta)
  ├─ Resend: azonnali e-mail a csapatnak (office.homlamentor@gmail.com)
  └─ Resend: automata visszaigazolás az érdeklődőnek
  ▼
Admin dashboard → új "Kereslet" szekció → /api/demand-sync (requireAdmin védett)
  olvassa a "Kereslet_Talalatok" lapot, a csapat innen indítja a tényleges
  kapcsolatfelvételt a hirdető/forrás felé
```

## Komponensek

### 1. `PropertySearchSection` (`src/components/PropertySearchSection.tsx`)

Kliens komponens, a meglévő luxus dark glassmorphism stílusban (a `PropertyRequestForm`
és `VIPAccessGateway` vizuális nyelvét követve). Tartalma:

- Egy keresőmező (pl. "Milyen ingatlant keres? — pl. 'ipari csarnok Szeged környékén'")
- Keresés gomb, `Loader2` spinner state a várakozás alatt (a webkeresés 5–20 mp-et
  is igénybe vehet)
- Eredménylista: kártyánként kategória, hozzávetőleges lokáció, ár-tartomány (ha van),
  2–3 mondatos AI-összefoglaló, jellemzők — **nincs pontos cím, nincs forrás-link, nincs
  hirdető-elérhetőség**
- Kártyánként "Érdekel" gomb → inline mini-form (név + e-mail) → siker-állapot
- Üres állapot: ha nincs találat, őszinte szöveg ("Jelenleg nem találtunk nyilvános
  hirdetést erre, de rögzítettük az igényét, és értesítjük, ha találunk valamit" —
  ez maga is opcionálisan CRM-be írható lead, ld. lentebb)
- Hibaállapot: ha az AI Gateway hibázik (429/402/503), barátságos üzenet, nem technikai
  hibakód

A mai `PropertyRequestForm`-ot ez a szekció váltja ki az oldalon; a komponens fájlja
megmaradhat (nincs hivatkozás törölve élesben, de az oldalról eltávolítjuk az
importot) — implementációs tervben eldöntendő, hogy törlésre kerül-e véglegesen.

### 2. `POST /api/property-search`

- Bemenet: `{ query: string, locale: 'hu'|'en'|'de'|'fr' }`
- Anonim session-azonosító: ha nincs `demand_session` cookie, generál egy `crypto.randomUUID()`-t,
  `httpOnly`, hosszú lejáratú sütiként beállítja — ez lesz az AI Gateway `user` mezője
- Vercel AI Gateway hívás: web-search képes modell (a pontos slugot implementáció
  előtt a `gateway.getAvailableModels()`-ből kell választani, ne hardcode-oljunk
  elavult nevet)
- Rendszerprompt kikényszeríti: (a) csak nyilvánosan elérhető, jelenleg aktívnak tűnő
  hirdetésekre keressen, (b) saját szavakkal foglaljon össze, ne másoljon szó szerint,
  (c) SOHA ne adjon vissza URL-t, telefonszámot, e-mail címet vagy hirdető-nevet,
  (d) ha nincs érdemi találat, mondja ki egyértelműen, ne találjon ki adatot
- Kimenet: `{ results: TeaserResult[] }`, ahol
  `TeaserResult = { id, category, locationHint, priceRange?, summary, features: string[] }`
- Hibakezelés: AI Gateway 429/402/503 → 200-as válasz barátságos `{ results: [], notice: "..." }`
  formában, hogy a frontend ne omoljon össze technikai hibaüzeneten

### 3. `POST /api/property-search/interest`

- Bemenet: `{ query, matchedResult: TeaserResult, name, email, locale }`
- `escapeHtml` minden felhasználói inputon (meglévő minta, `src/lib/escapeHtml.ts`)
- Google Sheets írás a **"Kereslet_Talalatok"** új lapra, `execFileSync` + `gws.exe`
  mintával (soha nem `execSync`+`shell`), apostróf-prefixelt dátummal (Sheets
  dátum-sorszám csapda elkerülése), `INSERT_ROWS` móddal
- Oszlopok: `Dátum | Keresési kifejezés | Kategória | Lokáció-hint | Ár-tartomány |
  AI-összefoglaló | Érdeklődő neve | Érdeklődő e-mail | Nyelv | Állapot`
  (Állapot induláskor mindig `"Új"`)
- Resend e-mail a csapatnak: azonnali, luxury HTML sablon (a `route.ts` meglévő
  stílusát követve), tárgy: `Új kereslet-találat érdeklődés: {query}`
- Resend e-mail az érdeklődőnek: rövid automata visszaigazolás, локale szerint (hu/en/de/fr)
- Válasz: `{ success: true }`

### 4. Admin dashboard bővítés

Új admin route, pl. `src/app/[locale]/admin/demand/page.tsx`, a meglévő
`leads`/`outreach`/`sync` minta szerint. Tartalma:

- Egy `DemandTable` komponens (a `CrmTable.tsx` mintájára), ami a "Kereslet_Talalatok"
  lap sorait listázza: keresési kifejezés, AI-teaser adatok, érdeklődő, dátum, állapot
- Egy `StatCards`-szerű összegzés (hány kereslet érkezett, hányat vitt tovább a csapat)
- Állapot-váltás (Új → Kapcsolatba lépve → Lezárva) — kézi, az admin felületről
- Új, `requireAdmin`-védett API route: `src/app/api/demand-sync/route.ts` (a
  `crm-sync/route.ts` mintáját követve — **kötelező kézzel betenni a `requireAdmin`
  guardot**, mert a `proxy.ts` minden `/api/*`-ot átenged)
- `AdminSidebar.tsx` bővítése az új menüponttal

### 5. Rate limiting és költségvédelem

- **Elsődleges védelem:** Vercel AI Gateway per-user rate limit (RPM/felhasználó,
  napi token-plafon) a `demand_session` cookie-hoz kötött `user` azonosítóval —
  konfigurálva a Vercel projekt AI Gateway beállításaiban, nem kódban
- **Másodlagos, kliensoldali:** a keresés gomb letiltása a válasz megérkezéséig,
  minimum időköz két keresés között ugyanabban a session-ben
- **Előfeltétel (tulajdonosi/deploy teendő):** az AI Gateway-t engedélyezni kell a
  Vercel projekt beállításaiban (`vercel link` + AI Gateway bekapcsolása a
  dashboardon + `vercel env pull` az OIDC tokenhez) — ez a projekt eddig a GitHub
  Models-t használta közvetlenül a Brunella chathez, az AI Gateway-t még nem

## Jogi és compliance korlátok (kikényszerítve a rendszerpromptban ÉS a UI-ban)

- **Soha ne reprodukáljunk szó szerinti hirdetésszöveget vagy képet** külső oldalról —
  csak AI által átfogalmazott összefoglalót
- **Soha ne mutassunk forrás-URL-t vagy a hirdető elérhetőségét** a látogatónak — a cél,
  hogy a HOMLAMENTOR csapata járjon utána és vegye fel a kapcsolatot, ne a látogató
  menjen közvetlenül a versenytárs oldalára
- **Ne tároljunk feleslegesen személyes adatot**: a szabad keresés maga nem kér nevet/
  e-mailt, csak az "Érdekel" lépés — ez GDPR adatminimalizálási szempontból is helyesebb
- A "Kereslet_Talalatok" lap érzékeny (érdeklődők személyes adatai) — ugyanaz a
  bizalmassági figyelmeztetés vonatkozik rá, mint a Master_Vevőlistára: nem kerülhet
  publikus dokumentumba vagy külső rendszerbe

## Hibakezelés és üres állapotok

Ez a projekt már kétszer megégette magát azzal, hogy egy "élő" adatot ígérő UI mögött
a backend kitalált tartalmat adott vissza (l. a korábbi hardcode-olt növekedési görbe
és a fabrikált Gmail-fallback esetét). Ez a funkció explicit szabályként kapja:

- Ha az AI-keresés nem talál semmi érdemit, a válasz **egyértelműen mondja ki**, hogy
  nincs találat — nem gyárt teasert "hogy legyen valami"
- Ha az AI Gateway hibázik (rate limit, budget, provider timeout), a felhasználó
  barátságos, de őszinte hibaüzenetet lát, nem üres vagy hamis eredménylistát
- Rendszerdiagnosztika (ha lesz ilyen az admin oldalon) ne csak HTTP 200-at nézzen,
  hanem hogy a válasz tartalmaz-e értelmes adatot

## i18n szempontok

A keresés mind a 4 locale-on (hu/en/de/fr) elérhető. A rendszerprompt a `locale`
paraméter alapján kéri az AI-t, hogy az adott nyelven foglaljon össze — a webkeresés
maga elsősorban magyar/osztrák/német piaci találatokra fókuszál (a cég jelenlegi
földrajzi súlypontja), de ez nem kemény korlát a promptban.

## Tesztelés

- Kézi böngészős teszt mind a 4 locale-on: keresés → eredmény vagy őszinte üres állapot
  → "Érdekel" → CRM-sor + 2 e-mail megérkezik
- Hibaszimuláció: AI Gateway rate limit / timeout eset → barátságos üzenet, nem crash
- Admin oldali teszt: új "Kereslet_Talalatok" sor megjelenik a `/admin/demand` oldalon,
  állapotváltás működik
- `escapeHtml` ellenőrzés: XSS-kísérlet a keresőmezőben és a mini-formban

## Nyitott kérdések implementáció előtt

1. A pontos AI Gateway modell-slug (web-search képességgel) — implementáció idején
   `gateway.getAvailableModels()`-ből választandó, ne most rögzítsük
2. A `homola-mcp-hub` projekt jövője — külön döntés, nem blokkolja ezt a funkciót
3. A mai `PropertyRequestForm` komponens fájlja törlésre kerüljön-e, vagy csak az
   oldalról vegyük ki az importot — implementációs tervben eldöntendő
