<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## B2B Kampány-automatizáció — Fejlesztési Napló & Tanulságok

Ez a szakasz a `scripts/` és `n8n/` alatti CRM/Gmail automatizációs munkáról
szól (Homola Mentor Kft. B2B kiajánló kampányai). A Next.js-fejlesztéshez
nincs köze — ezt a `next dev` nem kezeli/írja felül, kézzel karbantartott.

### Állapot (2026-08-17)

- **Magyar kampány**: lezárva, "várjuk a válaszokat" fázisban.
- **Nemzetközi (DACH) kampány, 1. hullám**: 6 valós, cégek Impressum/Team
  oldalairól ellenőrzött lead (3 Senior Living, 3 Hospitality Resort)
  felkerült a `Master_Vevőlista` CRM-be és ki lett küldve — CRM státusz:
  "Kiajánló kiküldve". A leadek forrása böngészős Google X-ray kutatás
  (LinkedIn helyett, mert a `gws`/CLI nem tud oda bejelentkezni bot-szűrők
  miatt) + cégek saját, jogilag kötelező Impressum-oldala (§5 DDG).
- **Nemzetközi (DACH) kampány, 2. hullám — "Tier 1" intézményi befektetők**:
  5 felhasználó által megadott osztály-szintű cím (SeneCura, Falkensteiner/
  FMTG, Ensana, VAMED, Swiss Life Asset Managers, AT/CH). Kiküldés után
  4 sikeres ("Kiajánló kiküldve"), 1 kemény bounce ("Hibás e-mail cím":
  `investors@falkensteiner.com`, SMTP 550 5.1.1 User unknown — a cím nem
  létezik, a bounce-értesítés a Spam mappába érkezett). A Master CRM ekkor
  74 sor, 44 kiküldött megkeresés, 17 elutasítva/archiválva — mind az admin
  dashboardon (`/hu/admin`), mind a Sheets-ben ellenőrizve, szinkronban.
- **2 új válasz rögzítve a CRM-ben (2026-08-12)**: Panattoni Europe
  (László Kemenes sora, `lkemenes@panattoni.com`) — Percz Péter kollégája
  válaszolt, konkrét érdeklődés az üllői iparterület és a székesfehérvári
  logisztikai ingatlan iránt → "Aktív tárgyalás". Hotel Investments AG
  (Holger Ballwanz, `dialog@ballwanz.immobilien`) — elutasítás, az
  üzemeltető csak A-kategóriás nagyvárosokat (Berlin, Bécs) néz, resortot
  nem → "Elutasítva / Archiválva". Lásd `scripts/update_crm_responses_2.js`.
- **Nemzetközi kampány, 3. hullám — kutatott leadek (2026-08-17)**: 15 kutatott
  lead a négy kiemelt projekt-szegmensre, ebből 12 új (3-at a duplikátum-szűrő
  kiszűrt: Martijn Vlutters, Károly Palovics, Ferenc Gondi — mindhárman
  korábban már kaptak kiajánlót). Szegmensenként: Senior Living 3 (IMMAC,
  Cureus, Carestone), Ipari & Logisztikai 3 (CTP, Accolade, GARBE), Hospitality
  2 (Therme Group, EurothermenResorts), Afrikai Infrastruktúra 4 (Meridiam,
  Proparco, EAAIF/Ninety One, Africa50). Mind a 12-nek elkészült a piszkozat és
  bekerült a CRM-be "Piszkozat bekészítve" státusszal. A Master CRM ekkor
  **87 sor**. Lásd `scripts/process_new_leads.js`.
  Két új e-mail sablon-téma készült: `email_04_industrial_logistics_{de,en}.txt`
  és `email_05_africa_infrastructure_en.txt`, plusz a hiányzó
  `email_02_senior_living_en.txt` (a `create_intl_drafts.js` PROJECT_TEMPLATES
  mappingje ennek megfelelően bővült).
- **3. hullám kiküldve és auditálva (2026-08-17)**: a felhasználó mind a 12
  piszkozatot kiküldte. A `sync_intl_campaign_delivery.js` mind a 12 sort
  "Kiajánló kiküldve" státuszra váltotta — **12/12 sikeres, 0 bounce**.
  A dedukált (`pattern-derived`) `maarten.otte@ctp.eu` **nem pattant vissza**,
  ami megerősíti a kétforrásos mintázat-igazolás módszerét. Független,
  cím-független bounce-audit (`from:mailer-daemon OR from:postmaster OR
  subject:"Delivery Status Notification"...`, `includeSpamTrash: true`) is
  0 találatot adott. Master CRM: **86 sor**, admin dashboardon ellenőrizve
  (86 lead / 55 kiküldött megkeresés / 2 aktív tárgyalás / 18 elutasítva) —
  mind a négy kártya egyezik a Sheets státusz-eloszlásával.

### Kritikus tanulságok jövőbeli munkához

1. **`gws` CLI hívás: SOSE `execSync` + `shell: 'cmd.exe'`.** A JSON
   `--params`/`--json` argumentumokban előforduló `&` karakterek és
   beágyazott idézőjelek elszakadnak a cmd.exe shell-értelmezésen (pl.
   "Geschäftsführer & Gründer", "Hospitality & Resort" tárgysorok). Helyette
   `execFileSync`-kel, tiszta argv-tömbbel hívd meg **közvetlenül a valódi
   binárist**: `%APPDATA%\npm\node_modules\@googleworkspace\cli\bin\gws.exe`
   (Windows) — lásd `scripts/add_missing_contacts.js`,
   `scripts/create_intl_drafts.js`, `scripts/process_intl_campaign.js`,
   `scripts/sync_intl_campaign_delivery.js`. A `scripts/sync_campaign_delivery.js`
   és `scripts/audit_drafts_crm.js` (régebbi/audit-only) még a régi
   `execSync`+shell mintát használja — audit-only szkriptnél tolerálható
   (nincs írás), de íráshoz NE ezt a mintát másold.

2. **Google Sheets dátumoszlop: `USER_ENTERED` + ISO dátum-string ⇒ Sheets
   dátum-sorszámmá alakítja** (pl. "2026-08-11" → `46245`), ha a cél cella
   korábban nem szöveg-formátumú. Az admin dashboard (`/hu/admin`) ezt nem
   formázza vissza, csak a nyers számot mutatja. **Megoldás**: a dátum értékét
   apostróf-előtaggal írd (`'2026-08-11`), ez kényszeríti a Sheets-et sima
   szöveg tárolásra, USER_ENTERED mellett is. Lásd
   `scripts/process_intl_campaign.js` és `scripts/add_missing_contacts.js`
   `col.date` sorai.

3. **Gmail API-val létrehozott piszkozatok: a "Piszkozatok" oldalsáv/`in:draft`
   szűrő pár percet késhet az indexeléssel**, még akkor is, ha a piszkozat
   ténylegesen létrejött (helyes `DRAFT` label, tartalommal, melléklettel —
   ellenőrizhető `gws gmail users drafts get` vagy sima Gmail keresés
   (recipient domain) segítségével). Ne vond le "üres/hibás piszkozat"
   következtetést pusztán abból, hogy a mappa-nézet üresnek látszik
   közvetlenül a létrehozás után.

4. **A `public/Portfolio_HU_v6.pdf` tartalma bővebb, mint amit jelenleg
   `src/messages/hu.json` + `n8n/templates/portfolio_magazine.ejs` (
   `n8n/generate_portfolio_pdf.js`) generál.** A valódi HU PDF 13 ingatlant
   tartalmaz (a hu.json/en.json `PropertyTeaserGrid.items` csak 9-et,
   `prop1`–`prop9`), plusz egy részletes nyugat-afrikai szolár-projekt
   táblázatot (9 helyszín) és EPC/BOT építőipari lehetőség-listát, amit az
   ejs sablon egyáltalán nem renderel. Amíg ez nincs összehangolva (a hiányzó
   4 ingatlan + Afrika-szekció felvétele a JSON-okba/sablonba), az angol
   portfólió PDF hiteles forrása `n8n/generate_portfolio_pdf_en_v6.js`
   (kézzel karbantartott, teljes tartalommal) — ez generálja
   `public/Portfolio_EN_v6.pdf`-et, NEM az `n8n/generate_portfolio_pdf.js`.

5. **Gmail piszkozat HTML törzs**: a teljes, önálló `<!DOCTYPE html><html>
   <head><style>...</style></head><body>...` dokumentum (nem csak egy body
   fragment) **helyesen jelenik meg** a Gmail piszkozat-szerkesztőjében —
   böngészőben vizuálisan ellenőrizve. Nem kell body-fragmentre redukálni.

6. **Bounce-detektálás `includeSpamTrash: true` nélkül vak folt.** A
   Mailer Daemon "Delivery Status Notification (Failure)" értesítések
   gyakran a Spam-be futnak be (nem az Inbox-ba), ezért a
   `gmail.users.messages.list` bounce-keresésnek MINDIG kell
   `includeSpamTrash: true` — enélkül a `sync_intl_campaign_delivery.js`
   hamis "sikeresen kiküldve" eredményt adna egy ténylegesen visszapattant
   címre. Éles esetben megerősítve: `investors@falkensteiner.com` bounce-a
   csak a Spam-ben volt látható, a szkript mégis helyesen azonosította.

7. **A felhasználó által megadott, osztály-szintű céges e-mail címek
   (pl. `investors@...`, `development@...`, `realestate@...`) nem mindig
   léteznek** — nem a szkript/CRM hibája, ha egy ilyen cím kemény bounce-ot
   ad (SMTP 550 5.1.1 User unknown), hanem a cím önmagában rossz/elavult.
   Ilyenkor ne próbáld újraküldeni ugyanarra a címre; jelezd a
   felhasználónak, és ha kérik, keress alternatív (konkrét személyhez vagy
   más osztályhoz tartozó) elérhetőséget a cég Impressum/Team oldalán.

8. **CRM reakció-szinkronizáló szkriptben SOSE használj puszta cégnév-alapú
   fallback-egyezést a sor-azonosításhoz.** Egy cégnek több kapcsolattartó-
   sora is lehet a `Master_Vevőlista`-ban (pl. Panattoni Europe: László
   Kemenes ÉS Tóth Mariann, külön sorokban) — a cégnév-substring egyezés
   mindkettőt találatnak veszi, és a rossz sort is felülírja. Éles esetben
   megtörtént: `update_crm_responses_2.js` első verziója a `rowStr.includes(
   company.toLowerCase())` fallback miatt véletlenül felülírta Tóth Mariann
   sorát is Percz Péter válaszával — kézzel kellett visszaállítani az
   eredeti "Kiajánló kiküldve" státuszt és megjegyzést. **Megoldás**: csak
   pontos (vagy tudott alternatív) e-mail cím(ek) alapján egyezz, cégnév
   alapján soha.

9. **Lead-kutatásnál a személyes e-mail cím kitalálása tilos — helyette
   háromszintű verifikáció.** A `process_new_leads.js` minden leadnél tárolja az
   `emailConfidence` mezőt: `"verified"` (a cím szó szerint így szerepel egy
   publikus céges oldalon) vagy `"pattern-derived"` (a személy neve/beosztása
   publikus, a címe nem, DE a cégdomain mintázata legalább **két független,
   publikusan közölt címből** bizonyított). Harmadik szint — puszta találgatás —
   nem kerülhet a listába. Éles megerősítés: a CTP mintázata
   (`keresztnév.vezetéknév@ctp.eu`) két sajtókapcsolati címből lett igazolva
   (`szabolcs.farkas@`, `pavel.svihalek@`), és az így képzett
   `ferenc.gondi@ctp.eu` egyezett a CRM-ben már 2026-08-04 óta meglévő,
   független kutatásból származó címmel. A verifikáltsági szint a CRM
   Megjegyzés oszlopába is bekerül, hogy bounce esetén visszakövethető legyen,
   melyik cím volt dedukált.

10. **A DACH-cégek többsége ma már NEM publikál személyes e-mail címet** —
   csak `info@` / `kontakt@` / `empfang@` osztály-szintű címet az Impressumban
   (GDPR-óvatosság). Ez nem akadály: a döntéshozó nevét és beosztását az
   Impressum/Management oldal kötelezően közli, így a levél megszólítása
   célzott lehet a verifikáltan létező osztály-címre küldve. Ez lényegesen
   biztonságosabb, mint találgatott személyes címre küldeni (vö. 7. tanulság).

11. **A Sheets `values.append` nem feltétlenül a lap legvégére ír.** A 3.
   hullámnál a 75 soros lapon az append az `A39:S50` tartományt adta vissza,
   mert az API a „table" határát a 38. sornál érzékelte. `insertDataOption:
   "INSERT_ROWS"` mellett ez **nem destruktív** — a korábbi 39+ sorok lejjebb
   tolódtak, adat nem veszett el (ellenőrizve: 75 → 87 sor, 0 duplikátum,
   0 üres sor). De az `updatedRange` értéke önmagában megtévesztő; írás után
   érdemes sorszám- és duplikátum-ellenőrzést futtatni, nem az append válaszára
   hagyatkozni.

12. **Kézbesítés-szinkron: a Megjegyzés oszlopot HOZZÁFŰZNI kell, nem
   felülírni.** A `sync_intl_campaign_delivery.js` eredetileg felülírta a
   Megjegyzés cellát a kiküldés tényével — ezzel a 3. hullám mind a 12 sorából
   törölte a lead felvételekor odaírt `Cím-verifikáció: ... Forrás: ...`
   metaadatot, vagyis pont azt az információt, ami egy későbbi bounce
   kivizsgálásához kellene. Javítva: a szkript beolvassa a meglévő megjegyzést
   és ` | ` elválasztóval hozzáfűz. A már megtörtént adatvesztést a
   `scripts/restore_wave3_notes.js` (egyszeri javítószkript) állította helyre.
   **Minden CRM-író szkriptnél kérdezd meg: felülír vagy hozzáfűz?**

13. **A szinkron-szkriptek `TODAY` konstansát hullámonként frissíteni kell.**
   A `sync_intl_campaign_delivery.js` `TODAY` értéke `2026-08-11`-en maradt;
   enélkül a 3. hullám sorai a 2. hullám dátumával kerültek volna a CRM-be.
   Ugyanitt a megjegyzés szövege "(DACH)"-ot írt, ami a 3. hullámra pontatlan
   (francia, brit, marokkói intézmények is vannak) — általánosítva.

14. **Az `/api/gmail-history` fabrikált levelezést adott vissza, ha a Gmail API
   nem talált semmit — JAVÍTVA (2026-08-17).** A route végén egy "fallback"
   levélpár állt, benne egy kitalált BEJÖVŐ válasszal ("Érdekel minket a
   tárgyalási lehetőség..."), relatív dátumokkal (`Date.now() - 2/5 nap`), amit
   a `PartnerDrawer` "Élő Levelezési Előzmények / Gmail API" jelvénnyel,
   valós adattól megkülönböztethetetlenül jelenített meg. Mivel a fallback
   akkor is aktiválódott, ha az API sikeresen válaszolt de 0 találattal, ez
   **minden friss leadnél hamis partneri érdeklődést mutatott**. Éles eseten
   igazolva: az Africa50-nél, ahol aznap ment ki az első levél, a dashboard
   5 napos kiküldést és 2 napos "érdeklődő választ" mutatott. Javítás: üres
   lista visszaadása (`source: "gmail_api_no_results"`) — a `PartnerDrawer`
   már tartalmazott őszinte üres állapotot, azt kellett csak érvényre juttatni.
   Ez ugyanaz a hibaosztály, mint a korábbi hardcode-olt növekedési görbe:
   **soha ne fabrikálj adatot a dashboardra, még "fallback" néven sem.**

15. **MEGOLDVA (2026-08-17): a `/api/gmail-history` élő Gmail-lekérdezése éles
   környezetben nem adott találatot.** A fallback eltávolítása után kiderült, hogy a végpont
   **minden** címre `total: 0`-t ad — beleértve olyanokat is, ahol bizonyítottan
   van levelezés (`lkemenes@panattoni.com`: Percz Péter válasza 2026-08-12;
   `maarten.otte@ctp.eu`: aznap kiküldött levél a Sent mappában). Ugyanezeket a
   leveleket a lokális `gws` CLI hibátlanul megtalálja, tehát a levelek ott
   vannak a fiókban — a webalkalmazás nem éri el őket.

   **Gyökérok (2026-08-17-én a Vercel env változók ellenőrzésével azonosítva).**
   A projekt env változói: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `NEXTAUTH_SECRET`,
   `NEXTAUTH_URL`, `N8N_WEBHOOK_URL`, `RESEND_API_KEY`.
   **`GOOGLE_REFRESH_TOKEN` NINCS beállítva.** A route hitelesítési logikája:

   ```js
   if (clientId && clientSecret && refreshToken)      // OAuth ág  -> KIESIK
   else if (serviceAccountEmail && privateKey)        // JWT ág    -> ez fut
   ```

   A refresh token hiánya miatt a JWT (service account) ág fut, ami
   `subject: "office.homlamentor@gmail.com"` impersonation-t végez. A
   **domain-wide delegation viszont kizárólag Google Workspace fiókkal
   működik — egy sima `@gmail.com` címmel soha nem fog**, ezért a Gmail hívás
   mindig hibára fut, és eddig a fallback ágra esett.

   Ez egyben megmagyarázza, miért működik a Sheets olvasás ugyanezzel a service
   accounttal: ott nincs szükség impersonationre, elég a táblázatot megosztani
   a service account címével. A Gmailnél nincs ilyen megkerülő út.

   **Melyik postafiókban vannak a levelek?** A `peterpohankapersonal@gmail.com`
   fiókban (15 143 üzenet) — ezt használja a `gws` CLI is, ezért találja meg a
   kampánylevelet. Az `office.homlamentor@gmail.com` ehhez "send mail as"-ként
   van hozzákötve: a válaszok mindkét címen látszanak, kiküldéskor pedig
   választható a feladó. A route viszont hardcode-oltan az **office** címet
   impersonálta, tehát még működő delegation esetén is rossz postafiókba nézett.
   Javítva: az impersonált cím a `GMAIL_IMPERSONATED_USER` env változóból jön
   (alapértelmezés a régi office cím, hogy visszafelé kompatibilis maradjon).

   **A megoldás menete (2026-08-17)** — a `GOOGLE_REFRESH_TOKEN` legenerálva a
   `peterpohankapersonal@gmail.com` fiókra és felvéve a Vercelre. Igazolás:
   `source: "gmail_api_live"`, a Panattoni-címre 7 valós üzenet (1 bejövő
   automatikus szabadság-válasz 2026-08-04-ről + 6 elküldött), a 3. hullám
   címeire 1-1 elküldött levél 2026-08-17 07:58-cal. Kontroll: nem létező
   címre `gmail_api_no_results`, 0 üzenet — azaz nincs fabrikáció.

   **Négy csapda, amibe belefutottunk — jövőbeli hasonló feladatnál nézd meg
   elsőként:**

   a) **ROSSZ PROJEKT.** A Google Cloudban több projekt is van; a weboldal
      kliense a **`homola-admin-dashboard`** projektben él (`NextAuth Vercel`
      néven, `852479495107-mhr459…`), NEM a `bas1987`-ben (`1064371205091-…`,
      Firebase-hez auto-generált kliens). Az első nekifutás teljes egészében a
      rossz projektben történt. **Ellenőrzés**: a weboldal által ténylegesen
      használt client_id kiolvasható a NextAuth signin flow `Location`
      fejlécéből (`/api/auth/csrf` → POST `/api/auth/signin/google`,
      `redirect: 'manual'`) — ez cáfolhatatlan bizonyíték, ne tippelj.

   b) **A client secret nem olvasható vissza — sehol.** A Google 2024 óta csak
      létrehozáskor mutatja (utána `****P_qK`), a Vercelben pedig `Sensitive`
      változóként szintén rejtett. Megoldás: **második secret létrehozása**
      ("Add secret"); a kliensnek több aktív secretje is lehet. A refresh token
      a *client_id*-hoz kötődik, nem a secrethez, ezért az új secrettel generált
      token a Vercelben maradó régi secrettel is működik. A régit tilos letiltani
      — azzal megy a NextAuth bejelentkezés.

   c) **Az OAuth Playground használhatatlan volt** ezen a gépen: a
      `developers.google.com/oauthplayground` stíluslapjai és JS-e nem töltődtek
      be (vélhetően tartalomblokkoló bővítmény), így az "Authorize APIs" gomb
      halott volt — sem kézi, sem szkriptelt kattintásra nem reagált. Megoldás:
      `scripts/get_refresh_token.js`, ami helyben, külső oldal nélkül végzi el
      ugyanazt (saját HTTP szerver a `localhost:5555/oauth2callback` redirect
      URI-n, `access_type=offline` + `prompt=consent`). **A tokent fájlba írja,
      nem a képernyőre**, hogy ne kerüljön terminál-előzménybe vagy
      ügynök-beszélgetésbe; a fájl `.gitignore`-ban van.

   d) **A szkript interaktív, ezért ügynök nem futtathatja.** A secret bekérése
      maszkolt `readline`-nal történik, amihez valódi TTY kell — a nem-interaktív
      Bash eszköz azonnal EOF-ot kap. A felhasználónak külön PowerShell ablakban
      kell futtatnia.

   > Ügynök-szabály: titkot (client secret, refresh token) ügynök nem gépel be,
   > nem olvas ki és nem jelenít meg. A böngészőben az input mezőknél csak azt
   > ellenőrizd, hogy *ki van-e töltve*, az értékét soha ne kérdezd le, és ne
   > készíts képernyőképet olyan oldalról, ahol titok látszik.
   > Tanulság: **a fabrikált fallback két hónapig elrejtette, hogy az integráció
   > halott.** Egy fallback, ami valós adatnak látszik, nem hibatűrés, hanem
   > hibaelfedés. A rendszerdiagnosztika is félrevezetett: HTTP 200-at jelzett,
   > mert a végpont *válaszolt* — csak épp kitalált tartalommal. Health-check
   > sose csak státuszkódot nézzen, hanem a válasz értelmességét is.

### Releváns szkriptek (`scripts/`, `n8n/`)

| Szkript | Feladat |
|---|---|
| `create_intl_drafts.js` | DE/EN sablonválasztás + prémium HTML piszkozat + PDF csatolás egy leadnek |
| `process_intl_campaign.js` | Kombinált: CRM append + piszkozat-generálás egy lead-tömbre |
| `sync_intl_campaign_delivery.js` | Gmail Sent/Trash/Bounce ellenőrzés alapján CRM státusz frissítés ("Piszkozat bekészítve" → "Kiajánló kiküldve" / "Hibás e-mail cím") |
| `add_missing_contacts.js` | Egyedi, kézzel felvett CRM kontaktok biztonságos append-je |
| `audit_drafts_crm.js` | Csak-olvasás: Gmail ↔ CRM egyeztetés, kategória-eltérések |
| `update_crm_responses.js` / `update_crm_responses_2.js` | Ad-hoc Gmail-válaszok (státusz + megjegyzés) rögzítése a CRM-ben, e-mail cím alapú sor-egyeztetéssel |
| `process_new_leads.js` | 3. hullám: kutatott nemzetközi leadek CRM-be töltése + piszkozat-generálás, `emailConfidence`/`source` verifikációs metaadatokkal |
| `restore_wave3_notes.js` | Egyszeri javítószkript: a szinkron által felülírt 3. hullám Megjegyzés-metaadatainak helyreállítása |
| `get_refresh_token.js` | Google OAuth refresh token generálás helyben (az OAuth Playground kiváltására). **Interaktív — a felhasználó futtatja külön terminálban.** A tokent fájlba írja, nem a képernyőre |
| `n8n/generate_portfolio_pdf_en_v6.js` | A teljes tartalmú (13 ingatlan + Afrika-szekció) angol portfólió PDF generátora |
