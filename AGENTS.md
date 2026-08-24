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
- **A 3. hullám első válasza (2026-08-17)**: **Cureus GmbH — elutasítás.**
  A kiajánló 09:58-kor ment ki Christian Möhrke (`kontakt@cureus.de`) címére,
  a válasz 50 perccel később, 10:48-kor érkezett **Stefanie Monesitől**
  (`smo@cureus.de`, Teamassistenz Projektentwicklung). Két konkrét indok:
  (1) kizárólag Németországon belül terjeszkednek, külföldi projektet nem
  visznek; (2) alapvetően nem vesznek át kulcsrakész vagy már nagyrészt kész
  projektet — a Nagycenk 75%-os készültsége így kizáró ok. **Nem teljes
  elzárkózás**: csatolták a `Cureus_Ankaufsprofil_DE_2026.pdf` akvizíciós
  profiljukat, és jelezték, hogy a profiljukba illő projektekre nyitottak
  (németországi, korai fázisú fejlesztés lehet releváns a jövőben).
  CRM: "Kiajánló kiküldve" → "Elutasítva / Archiválva"; dashboard 55 → 54
  kiküldött, 18 → 19 elutasítva. Szkript: `scripts/update_crm_responses_3.js`.
- **Panattoni Europe — személyes találkozó egyeztetve (2026-08-17)**: Percz
  Péter Dr. válaszolt szabadság után, ugyanazon a soron (László Kemenes,
  `lkemenes@panattoni.com`), ami 2026-08-12-én már kapott egy konkrét
  érdeklődést. Személyes találkozót egyeztetett Budapesten (Alkotás Point
  Irodaház). CRM: "Aktív tárgyalás" → "Személyes találkozó", a Megjegyzés
  oszlop hozzáfűzve (nem felülírva). Ugyanaz a `scripts/update_crm_responses_3.js`
  végezte, kibővítve egy második `REACTIONS` bejegyzéssel és egy
  idempotencia-ellenőrzéssel (ha a reakció szövege már szerepel a
  Megjegyzésben, a szkript kihagyja — így a már lefutott Cureus-reakció
  nem íródott felül duplán, amikor a bővített szkript újra lefutott).
- **Megosztható prémium portfólió-dosszié — Claude Artifact (2026-08-19)**: a
  `public/Portfolio_HU_v6.pdf` teljes tartalma (mind a 13 ingatlaneszköz, a
  nyugat-afrikai infrastruktúra-szekció szolár pipeline-nal és EPC/BOT
  lehetőségekkel, a moduláris MobileHome divízió, kapcsolati blokk) átkerült
  egy önálló, kétnyelvű (HU/EN, kliensoldali váltógombbal) HTML dokumentumba:
  `marketing/portfolio-magazine.html`. Nem Next.js-oldal — a felhasználó
  kifejezetten Claude Artifactként kérte, hogy a link vagy a böngészőből
  nyomtatott PDF-verzió csatolható legyen e-mail megkeresésekhez. A dokumentum
  új nyitó szekciót kapott (a korábbi "CONFIDENTIAL — csak intézményi
  befektetőknek" zárt hangvétel helyett): a cég nem zárt ingatlanlistaként,
  hanem működő nemzetközi kapcsolatrendszerként mutatkozik be, amely bármilyen
  ingatlanbefektetési igényt, üzleti letelepedést vagy partnerkapcsolatot
  össze tud hozni bármely országban/szektorban. Design: Fraunces (display) +
  IBM Plex Sans/Mono (törzsszöveg, táblázatok, árak) — tudatosan más
  betűpáros, mint a meglévő `n8n/generate_portfolio_pdf_en_v6.js` PDF-generátor
  Playfair Display + Montserrat kombinációja. Nyomtatás/PDF-mentés a böngésző
  natív print-dialógusán keresztül megy (`window.print()` gomb + `@media
  print` szabályok szekciónkénti oldaltöréssel) — nincs külön puppeteer
  PDF-pipeline hozzá, hogy a tartalom egyetlen forrásból (a HTML-fájlból)
  származzon, ne váljon szét két rendszer között. Publikált Artifact URL:
  https://claude.ai/code/artifact/bd5186db-92d8-442c-9924-3e4d3496d232
  (Claude Code-fiókhoz kötött, alapból privát — a felhasználó ossza meg, ha
  nyilvánossá szeretné tenni). **Frissítéshez**: a `marketing/portfolio-
  magazine.html` szerkesztése után ugyanazt a fájlt kell újra publikálni
  ugyanazzal az Artifact-tool hívással (ugyanaz az URL marad) — ez csak olyan
  munkamenetből működik, amely ismeri ezt az URL-t (l. a fenti linket).
  Ismert korlát: a Claude Code böngészős Artifact-előnézetben (beágyazott,
  cross-origin sandboxos iframe) az automatizált görgetés és a HU/EN gombra
  kattintás nem volt megbízhatóan tesztelhető ebből a munkamenetből (a
  képernyőkép-eszköz időnként lefagyott/nem reagált) — a hero-szekció
  vizuálisan hibátlanul renderelt (betűtípusok, gradiens cím, elrendezés), de
  a nyelvváltó gombot és a hosszú görgetést valós böngészőben érdemes
  manuálisan is ellenőrizni, mielőtt élesben kiküldésre kerül.

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

   > **RÉSZBEN FELOLDVA (2026-08-23).** A hiányzó 4 ingatlan (Üllő stratégiai
   > terület, Nagykanizsa ipari telephely, Székesfehérvár ipari/logisztikai
   > terület, Üllő 115 ha) felkerült a `src/data/properties.ts`-be és mind a 4
   > nyelvi JSON-ba (`prop10`–`prop13`, hu/en/de/fr) — a weboldal
   > `/ingatlan-portal` oldala és a `VIPAccessGateway` (ugyanabból a
   > `properties.ts`-ből dolgozik) most már mind a 13 tételt mutatja, a
   > `src/lib/knowledge.ts` Brunella-tudásbázis is frissült. **Ami továbbra is
   > hiányzik**: a nyugat-afrikai szolár/EPC-BOT szekció nincs benne a JSON-okban
   > vagy a `PropertyTeaserGrid`/`VIPAccessGateway` komponensekben (más oldal,
   > más adatstruktúra kellene hozzá) — az `n8n/generate_portfolio_pdf.js` +
   > `portfolio_magazine.ejs` páros is változatlan, a HU PDF hiteles forrása
   > ezért még mindig csak a `marketing/portfolio-magazine.html` /
   > `n8n/generate_portfolio_pdf_en_v6.js`.

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

16. **A partner gyakran MÁS címről válaszol, mint amire írtunk — a Gmail-előzmény
   lekérdezés ezért szál-alapú.** A `to:cím OR from:cím` keresés nem hozza be az
   asszisztenstől vagy másik osztályról érkező választ. Éles eset (2026-08-17):
   a Cureus GmbH-nak `kontakt@cureus.de` címre ment a kiajánló, a válasz viszont
   `smo@cureus.de`-ről jött (Stefanie Monesi, Teamassistenz) — ugyanabban a
   szálban (`threadId` egyezik), de a panelen nem látszott. Javítás: az
   `/api/gmail-history` a találatok `threadId`-ja alapján a **teljes szálakat**
   lekéri (`threads.get`), és `internalDate` szerint rendez (legfrissebb elöl,
   mert a szálakból vegyes sorrendben érkeznek az üzenetek).
   > Következmény a CRM-re: **egy partnerhez több e-mail cím tartozhat.** A
   > reakció-szinkron szkriptekben ezért az `emails` mező tömb — de továbbra is
   > KIZÁRÓLAG pontos egyezéssel, cégnév-fallback nélkül (8. tanulság).

17. **Szerveroldali dátumformázásnál mindig adj meg `timeZone`-t.** A Vercel
   futtatókörnyezet UTC-ben fut, ezért a `toLocaleString("hu-HU", {...})`
   `timeZone` nélkül nyáron 2 órával korábbi időpontot mutat, mint amit a
   felhasználó a Gmailben lát. Éles eset: a Cureus válasza 10:48-kor érkezett,
   a dashboard 08:48-at írt. Javítva: `timeZone: "Europe/Budapest"`.

18. **Élő AI-webkeresős ingatlan-kereső funkció leszállítva (2026-08-23),
   subagent-driven-development munkafolyamattal, 11 taskban.** Spec:
   `docs/superpowers/specs/2026-08-23-ingatlan-kereso-design.md`, terv:
   `docs/superpowers/plans/2026-08-23-ingatlan-kereso.md` (a ledger, briefek és
   review-csomagok a `.superpowers/sdd/2026-08-23-ingatlan-kereso/` alatt
   voltak, git-ignore-olva — a git történet a végleges rekord). Új fájlok:
   `src/lib/propertySearch.ts`, `src/lib/demandSession.ts`,
   `src/app/api/property-search/route.ts` (+`interest/route.ts`),
   `src/app/api/demand-sync/route.ts`, `src/components/PropertySearchSection.tsx`,
   `src/app/[locale]/admin/{demand/page.tsx,components/DemandTable.tsx}`,
   `scripts/init_demand_sheet.js`. Az `/ingatlan-portal` oldal `PropertyRequestForm`
   szekcióját váltotta ki (a fájl a repóban maradt, nem hivatkozott).
   - **AI Gateway izoláltan**: a Brunella chat változatlan `ai@4.0.17`-je mellett
     egy npm-aliasolt `ai-gateway-sdk` (ténylegesen `ai@^7`, NEM `^6` — a Vercel
     `ai-gateway` skill ajánlása menet közben már elavult volt, a telepítéskor
     `npm view <csomag> dependencies`-szel ellenőrizve a `@ai-sdk/provider`
     verzió-párosítást) + `@ai-sdk/anthropic@^4.0.41` biztosítja a web-search
     tool-t (`anthropic.tools.webSearch_20260209` — szintén frissebb, mint bármely
     dokumentált példa, live `gateway.getAvailableModels()`-szel ellenőrizve).
   - **Kettős compliance-védelem**: a forrás-URL/hirdető-elérhetőség sose
     szivároghat ki — ez a rendszerpromptban ÉS a válasz-parsolásban (regex-alapú
     szűrés/redaktálás, gyanús summary esetén a teljes találat eldobva) is
     kikényszerítve, mert a záró review helyesen jelezte, hogy csak a promptra
     hagyatkozni nem elég egy webkereséssel dolgozó modellnél.
   - **Sheets-írás deployolt route-ban KIZÁRÓLAG `googleapis` + service account
     JWT-vel**, SOSE a `gws` CLI-vel (az nem npm-függőség, csak helyi egyszeri
     szkriptekben biztonságos — l. `scripts/init_demand_sheet.js`). Eközben
     kiderült, hogy a **meglévő** `/api/contact` és `/api/international-contact`
     route-ok (ezt a tervet megelőzően, korábban) `execFilePromise('gws', …)`-t
     hívnak — ez Vercel serverlessen valószínűleg csendben hibázik. **Ezt ez a
     terv nem javította**, külön követendő hiba, dokumentálva itt és a projekt
     Obsidian-jegyzetében.
   - **Resend-küldésnél mindig ellenőrizd a `res.error` mezőt** — az SDK
     `resolve`-ol API-szintű hibán is, nem `reject`-el, ezért puszta
     `Promise.allSettled`-fulfillment alapján "sikeresnek" jelenteni egy
     valójában elutasított küldést pontosan az a hibaosztály, amit a 14-15.
     tanulság már leírt. A záró review derítette ki élesben.
   - **`onboarding@resend.dev` (a Resend sandbox-feladója) csak a saját fiók
     ellenőrzött címére tud kézbesíteni**, tetszőleges (pl. látogató által
     megadott) címre nem — ezért a kereső funkció végül **nem küld** látogatói
     visszaigazoló e-mailt (csak csapat-értesítőt), amíg nincs ellenőrzött
     egyedi küldő domain a Resource-ban. Ha ez megtörténik, a visszaigazolás
     visszaépíthető.
   - **Google Cloud OAuth: a `gws` CLI saját, elavult `/o/oauth2/auth` végpontot
     hív** (a friss `/o/oauth2/v2/auth` helyett) — ez adta a "400 Bad Request /
     malformed request" hibát újra-hitelesítéskor, NEM a Google Cloud Console
     (`bas1987` projekt) hibás konfigurációja volt, ahogy elsőre tűnt. A
     `gws auth login` parancs maga generál helyes redirect_uri-t és portot, csak
     a régi authorize-endpointra küldi — ha ez újra előjön, a kiírt URL-ben
     `/o/oauth2/auth` → `/o/oauth2/v2/auth` csere megoldja, Cloud Console-turkálás
     nélkül.
   - **A Vercel dashboard böngészős automatizálása ebben a munkamenetben
     koordináta-alapú kattintással megbízhatatlan volt** (API-kulcs modal,
     env-változó menü) — a működő módszer: `read_page(filter:"interactive")` a
     reffekhez, `form_input` szöveg/select/checkbox mezőkhöz, és
     `javascript_tool`-lal `document.querySelector(...).click()` gombokhoz.
     Csak a Vercel dashboardra vonatkozik, a weboldal saját UI-ján a normál
     koordináta-kattintás működött.
   - **Vercel env változók (`GOOGLE_PRIVATE_KEY` stb.) csak Production+Preview
     scope-ra vannak felvéve, Development-re nem** — ezért `vercel env pull`
     sose hozza le őket helyi fejlesztéshez, függetlenül a "Sensitive" jelzéstől.
     A Sheets-írás élő bizonyítása emiatt a deployolt (Preview/Production)
     környezetre halasztva, nem helyi teszttel igazolva.
   - **AI Gateway költségvédelem**: team-szintű havi $15-os Budget beállítva
     (`https://vercel.com/brunellaagent-1630s-projects/~/ai-gateway/budgets`,
     havi frissítés, 50/75/100%-os e-mail riasztással) — ez a self-serve
     dashboardon elérhető legszűkebb védelem, valódi per-percenkénti RPM-limit
     nem volt elérhető opció ezen a csomagon.
   - **Ismert, nyitva hagyott üzleti probléma a session végén**: a Vercel AI
     Gateway ezen a projekten minden modellnél/szolgáltatónál (Anthropic,
     Bedrock, Claude-on-AWS, Google Vertex) 403/429-et ad vissza, annak
     ellenére, hogy $5 kredit ténylegesen elérhető a fiókon — a kód ezt
     helyesen, becsületes hibaüzenettel kezeli, de az élő keresés funkcionálisan
     nem működik, amíg ez nincs rendezve (Vercel support vagy fiók-szintű
     vizsgálat szükséges, nem kódhiba).
   - **A spec §4 admin státusz-workflow-ja (Új→Kapcsolatba lépve→Lezárva)
     szándékosan elhalasztva** — l. a terv dokumentum záró jegyzetét.
   - **Éles audit után egy ÖTÖDIK, valódi hiba is előkerült és javítva lett
     (2026-08-23, main-be mergelés UTÁN, közvetlenül a fő ágra commitolva
     `a00d234` alatt):** a `property-search/interest/route.ts` csapat-
     értesítő e-mailje `office.homlamentor@gmail.com`-ra próbált menni, de a
     Resend sandbox-feladója (`onboarding@resend.dev`) élesben bizonyítottan
     csak a fiók SAJÁT, hitelesített címére tud kézbesíteni —
     `peterpohankapersonal@gmail.com`-ra, NEM az `office.homlamentor@gmail.com`
     aliasra (bár ez utóbbi ugyanarra a Gmail-fiókra van "send mail as"-ként
     kötve, a Resend a szó szerinti címet ellenőrzi). Élő hiba a Resend API-tól:
     *"You can only send testing emails to your own email address
     (peterpohankapersonal@gmail.com)."* Javítva: a küldés címzettje mostantól
     `peterpohankapersonal@gmail.com`. **Ez valószínűleg ugyanígy érinti a
     `/api/contact` és `/api/international-contact` meglévő route-jait is**
     (mindkettő `office.homlamentor@gmail.com`-ra küld ugyanezzel a sandbox-
     feladóval) — ezt ez a session NEM javította, külön ellenőrzendő/javítandó.

- **2026-08-24 — AI Gateway 403/429 megoldva: ingyenes fixszel, Anthropic Claude
  helyett Google Gemini 2.5 Flash + Gateway-natív Perplexity search.** A gyökérok
  a Vercel Support agent szerint kettős volt (Vertex 403 = Anthropic-specifikus
  `webSearch` tool séma nem támogatott Vertexen; Anthropic/Bedrock 429 = Free
  Tier modellkorlátozás), de élő diagnosztikával kiderült, hogy **súlyosabb**:
  a `providerOptions.gateway.order` önmagában NEM korlátoz — csak preferencia-
  sorrend, a Gateway a listán kívüli providerre is fallback-elhet, ha az elsőt
  nem támogatja a payload (ez okozta, hogy `order: ["anthropic"]` mellett is
  Vertexre ment a kérés). A tényleges korlátozáshoz `only: ["anthropic"]` kell.
  Ezután viszont kiderült, hogy **minden Anthropic modell** (Haiku 4.5 is, nem
  csak Sonnet/Opus) `RestrictedModelsError`-t ad Free Tier-en — a Support
  agent válasza ezen a ponton pontatlan volt. Egy ideiglenes, egy hívásból
  8 modellt tesztelő probe route (`src/app/api/property-search/probe/route.ts`,
  törölve használat után) igazolta: **OpenAI (`gpt-4o-mini`, `gpt-4.1-nano`),
  Google (`gemini-2.5-flash`) és Meta (`llama-3.3-70b`) szabadon használható**
  a Free Tier-en, csak az Anthropic és a DeepSeek van korlátozva. A Free Tier-nek
  emellett egy nagyon alacsony, **fiókszintű aggregát rate limitje** is van —
  a probe 9 egymást követő hívása egy request-en belül kimerítette, ezután
  minden modell (a korábban működők is) 429-et adott percekig, majd magától
  helyreállt. Végleges megoldás: a modellt `google/gemini-2.5-flash`-re
  váltottuk, az Anthropic-specifikus `anthropic.tools.webSearch_20260209`
  helyett a Gateway saját, provider-független `gateway.tools.perplexitySearch()`
  tool-ját használjuk (ez bármelyik modellel párosítható, nem csak Anthropickal).
  Élesben igazolva: valós, 4 találatos ingatlanpiaci keresési eredmény, a
  compliance-szűrés (forrás-URL/hirdető-elérhetőség redaktálása) is helyesen
  működött rajta. **Ingyenes megoldás, nem kellett fizetős kreditet vásárolni.**
  > [!warning] Tanulság jövőbeli AI Gateway munkához
  > 1. `providerOptions.gateway.order` ≠ korlátozás — csak `only` zár ki
  >    ténylegesen providereket a fallback-láncból.
  > 2. Egy Support-válasz (akár AI agent, akár ember) állítása a fiók
  >    tényleges korlátozásairól nem helyettesíti az élő, empirikus tesztet —
  >    itt is tévesnek bizonyult ("csak Sonnet/Opus korlátozott" → valójában
  >    minden Anthropic modell).
  > 3. Diagnosztikai hibaüzenetért mindig logold a teljes hiba-objektumot
  >    (`JSON.stringify(error, Object.getOwnPropertyNames(error))`), mert a
  >    `error.message`/`statusCode` felszíni mezői önmagukban nem elegek —
  >    a Gateway a tényleges okot (`RestrictedModelsError` névvel és pontos
  >    szöveggel) csak a beágyazott `cause`-ban adja vissza.
  > 4. Több modellt egy request-en belül, gyors egymásutánban tesztelni
  >    kimeríti a Free Tier aggregát rate limitjét — egyesével, pár másodperc
  >    szünettel tesztelj, vagy vedd figyelembe, hogy egy "sikertelen" teszt
  >    utáni "mindenki 429" nem jelenti azt, hogy korábban működő modellek is
  >    elromlottak.

- **2026-08-24 — Admin státusz-workflow leszállítva a Kereslet fülön (Új → Kapcsolatba
  lépve → Lezárva), és egy éles build-hiba menet közben javítva.** Három rész: (a) a
  `DemandRow.id` mostantól a tényleges Sheet sorszám (fejléc + 1-től, a blank-sor
  filter ELŐTT számolva — a korábbi szintetikus `idx+1` elcsúszott volna egy üres
  sor esetén); (b) admin-védett `PATCH /api/demand-sync` — `{ id, status }` body,
  az állapot validálva a három megengedett érték egyikére, `values.update`-tel írja
  a J oszlopot; (c) `DemandTable.tsx` — a statikus badge helyett interaktív legördülő,
  optimista UI-frissítéssel, hiba esetén visszaállítással, a `CrmTable` szín-konvencióját
  követve (kék=Új, sárga=Kapcsolatba lépve, zöld=Lezárva).
  > [!warning] Éles build-hiba: futásidejű érték importálása szerver-only route-ból kliens-komponensbe
  > Az első verzió a `DEMAND_STATUSES` konstanst **futásidejű értékként** exportálta a
  > `demand-sync/route.ts`-ből, és a `DemandTable.tsx` (kliens-komponens) ezt importálta.
  > A `DemandRow` **type-only** importja biztonságos (fordításkor törlődik), de egy
  > **érték**-import az egész modult a kliens-bundle-be húzza — a `route.ts` pedig a
  > `googleapis`-t importálja, ami Node-only `net`/`tls` modulokra hivatkozik. Eredmény:
  > `npm run build` elhasalt Vercelen ("Module not found: Can't resolve 'net'/'tls'"),
  > a commit pusholva lett, de mivel a Vercel egy sikertelen buildnél megtartja az előző
  > eles deploy-t, a funkció NEM volt élesben elérhető, és ez a build-lista áttekintése
  > nélkül észrevétlen maradt volna. **A felhasználó vette észre a Vercel build-hiba
  > értesítésben** és jelezte — ez fedezte fel a hibát, nem az agent saját ellenőrzése.
  > Javítva: a megosztott konstansok (`DEMAND_STATUSES`, `DemandStatus` típus) külön
  > `src/lib/demandStatus.ts` fájlba kerültek, amit mind a route, mind a kliens-komponens
  > importál — a route.ts-ből a kliens csak type-only importot kap.
  > **Tanulság: minden push után ellenőrizd a Vercel deployment-listát ("Ready" vs
  > "Error"), ne csak a saját `npm run build`/`tsc` futtatását bízd rá a lokális
  > környezetre** — ez a hiba pont azért csúszott át, mert helyben nem futtattam
  > `npm run build`-ot a push előtt (csak `tsc --noEmit`-et, ami type-only importokat
  > nem különböztet meg érték-importoktól ugyanígy, de a bundlázási problémát nem látja).
  > Élesben, böngészőben végigtesztelve (2026-08-24, a javítás után): valós keresés →
  > "Érdekel" → CRM-sor létrejön "Új" státusszal → legördülőn "Kapcsolatba lépve" →
  > "Lezárva" → oldal-újratöltés után is perzisztál → teszt-sor törölve a `gws` CLI-vel.
  > **Mellékes megfigyelés**: a Vercel "Live Feedback" böngésző-widget (a Vercel-fiókkal
  > bejelentkezett munkamenetekben aktív) időnként elfogja/összezavarja a kattintásokat
  > és görgetést automatizált teszteléskor — ha egy böngészős teszt megmagyarázhatatlanul
  > nem regisztrál kattintást vagy váratlanul görgeti az oldalt, ellenőrizd a konzolt
  > `vercel.live` hibára, és inkább `find`-alapú `ref`-fel kattints koordináta helyett.

> [!warning] Következő munkamenet — itt folytasd
> Nyitva hagyott tételek:
> 1. **Mobil nézet valós ellenőrzése** — a 2026-08-23-i session böngésző-
>    eszköze (`claude-in-chrome` `resize_window`) nem tudta átméretezni a
>    tényleges renderelési viewportot (`window.innerWidth` 1920 maradt a
>    hívás után is) — ez tooling-korlát volt, nem elvégzett és bukott
>    ellenőrzés. Érdemes más úton (valós eszköz, vagy ha elérhető, Chrome
>    DevTools MCP) leellenőrizni a `PropertySearchSection.tsx` és a többi
>    érintett komponens reszponzív viselkedését.
> 2. **Gyanú**: a Resend-címzett hiba (l. fent, 5. hiba) valószínűleg a
>    `/api/contact` és `/api/international-contact` route-okat is érinti —
>    ellenőrizendő.
> 3. **A `google/gemini-2.5-flash` + `perplexitySearch` kombináció Free
>    Tier-en marad** — ha a keresési forgalom megnő, érdemes figyelni, nem
>    fut-e bele ismét a fiókszintű rate limitbe (l. fent). Ha ez gondot okoz,
>    a kreditvásárlás (Homola Lászlóval egyeztetve) továbbra is nyitott opció.

### Releváns szkriptek (`scripts/`, `n8n/`)

| Szkript | Feladat |
|---|---|
| `create_intl_drafts.js` | DE/EN sablonválasztás + prémium HTML piszkozat + PDF csatolás egy leadnek |
| `process_intl_campaign.js` | Kombinált: CRM append + piszkozat-generálás egy lead-tömbre |
| `sync_intl_campaign_delivery.js` | Gmail Sent/Trash/Bounce ellenőrzés alapján CRM státusz frissítés ("Piszkozat bekészítve" → "Kiajánló kiküldve" / "Hibás e-mail cím") |
| `add_missing_contacts.js` | Egyedi, kézzel felvett CRM kontaktok biztonságos append-je |
| `audit_drafts_crm.js` | Csak-olvasás: Gmail ↔ CRM egyeztetés, kategória-eltérések |
| `update_crm_responses.js` / `update_crm_responses_2.js` | Ad-hoc Gmail-válaszok (státusz + megjegyzés) rögzítése a CRM-ben, e-mail cím alapú sor-egyeztetéssel |
| `update_crm_responses_3.js` | 3. hullám reakciói + folyamatban lévő Panattoni tárgyalás frissítései. Modern minta: `execFileSync` + `gws.exe`, pontos e-mail egyezés, Megjegyzés **hozzáfűzése** (nem felülírása), és **idempotencia-ellenőrzés** (a már rögzített reakciót kihagyja) |
| `process_new_leads.js` | 3. hullám: kutatott nemzetközi leadek CRM-be töltése + piszkozat-generálás, `emailConfidence`/`source` verifikációs metaadatokkal |
| `restore_wave3_notes.js` | Egyszeri javítószkript: a szinkron által felülírt 3. hullám Megjegyzés-metaadatainak helyreállítása |
| `get_refresh_token.js` | Google OAuth refresh token generálás helyben (az OAuth Playground kiváltására). **Interaktív — a felhasználó futtatja külön terminálban.** A tokent fájlba írja, nem a képernyőre |
| `n8n/generate_portfolio_pdf_en_v6.js` | A teljes tartalmú (13 ingatlan + Afrika-szekció) angol portfólió PDF generátora |
