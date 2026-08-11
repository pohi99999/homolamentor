<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## B2B Kampány-automatizáció — Fejlesztési Napló & Tanulságok

Ez a szakasz a `scripts/` és `n8n/` alatti CRM/Gmail automatizációs munkáról
szól (Homola Mentor Kft. B2B kiajánló kampányai). A Next.js-fejlesztéshez
nincs köze — ezt a `next dev` nem kezeli/írja felül, kézzel karbantartott.

### Állapot (2026-08-11)

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

### Releváns szkriptek (`scripts/`, `n8n/`)

| Szkript | Feladat |
|---|---|
| `create_intl_drafts.js` | DE/EN sablonválasztás + prémium HTML piszkozat + PDF csatolás egy leadnek |
| `process_intl_campaign.js` | Kombinált: CRM append + piszkozat-generálás egy lead-tömbre |
| `sync_intl_campaign_delivery.js` | Gmail Sent/Trash/Bounce ellenőrzés alapján CRM státusz frissítés ("Piszkozat bekészítve" → "Kiajánló kiküldve" / "Hibás e-mail cím") |
| `add_missing_contacts.js` | Egyedi, kézzel felvett CRM kontaktok biztonságos append-je |
| `audit_drafts_crm.js` | Csak-olvasás: Gmail ↔ CRM egyeztetés, kategória-eltérések |
| `n8n/generate_portfolio_pdf_en_v6.js` | A teljes tartalmú (13 ingatlan + Afrika-szekció) angol portfólió PDF generátora |
