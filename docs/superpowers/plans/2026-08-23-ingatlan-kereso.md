# Ingatlan-kereső Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Élő, AI-alapú webkeresős ingatlan-kereső az `/ingatlan-portal` oldalon, ami külső piaci találatokat mutat (forrás-link nélkül), és az "Érdekel" kattintást CRM-leadként rögzíti, csapat- és felhasználó-értesítéssel, admin dashboard bővítéssel.

**Architecture:** Kliens komponens → `/api/property-search` (Vercel AI Gateway + Anthropic web-search tool) → teaser-lista → "Érdekel" → `/api/property-search/interest` (Google Sheets írás `googleapis` JWT-vel + Resend e-mailek) → admin `/api/demand-sync` (olvasás) → `DemandTable`.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Tailwind 4, next-intl, Vercel AI Gateway (izolált `ai@^6` alias-csomagon keresztül), `@ai-sdk/anthropic`, `googleapis`, `resend`.

**Spec:** `docs/superpowers/specs/2026-08-23-ingatlan-kereso-design.md`

## Global Constraints

- **Nincs automatizált teszt-suite ebben a repóban** (nincs vitest/jest/playwright a package.json-ban). A "teszt" lépések ezért dev-szerveres `curl` ellenőrzésekből (API route-ok) és böngészős manuális ellenőrzésből (UI) állnak — ez a projekt bevett gyakorlata, nem egy hiányzó lépés pótlása.
- **A `gws` CLI NEM npm-függőség** (nincs a `package.json`/`package-lock.json`-ban) — csak a fejlesztő gépén, globálisan telepítve érhető el. Ezért **kizárólag helyi, egyszeri `scripts/`-szkriptekben** használható (pl. Task 3 init szkriptje); **deployolt Next.js API route-ban SOSE** — ott a `googleapis` npm-csomagot kell service account JWT hitelesítéssel használni, a `crm-sync/route.ts` mintája szerint. (Ez egy a projektben eddig fel nem ismert kockázat: a meglévő `/api/contact` és `/api/international-contact` route-ok `execFilePromise('gws', …)`-t hívnak — ez Vercelen valószínűleg csendben hibázik, mert a `gws` bináris nincs a runtime PATH-on. Ez a plan NEM javítja ezt a meglévő kódot, csak nem ismétli meg a hibát az új route-okban.)
- **`gws` hívás helyi szkriptben**: mindig `execFileSync` + a valódi `gws.exe` bináris elérési útja (`%APPDATA%\npm\node_modules\@googleworkspace\cli\bin\gws.exe` Windows alatt), SOSE `execSync`/`shell:true` — lásd AGENTS.md 1. tanulság.
- **Sheets dátumcella**: apostróf-prefixelt ISO dátum (`'2026-08-23`) `USER_ENTERED` mellett, hogy a Sheets szövegként tárolja, ne dátum-sorszámmá alakítsa.
- **Minden érzékeny/admin API route-ba kézzel be kell tenni a `requireAdmin()` guardot** — a `proxy.ts` szándékosan átenged minden `/api/*` kérést.
- **Minden felhasználói input, ami HTML e-mail sablonba kerül, menjen át `escapeHtml()`-en.**
- **A meglévő `ai@4.0.17` csomag NEM változik** (a Brunella chat mögötte van). Az új Gateway-alapú route egy npm alias-csomagon (`ai-gateway-sdk` → ténylegesen `ai@^6`) keresztül importál — ez teljesen izolált, nem ütközik a meglévő `ai`/`@ai-sdk/react`/`@ai-sdk/openai@^4` triplettel.
- **Az AI-generált teaser-eredmények SOSE tartalmazhatnak forrás-URL-t, hirdető-nevet, telefonszámot vagy e-mail címet** — ez a rendszerpromptban és a válasz-parsolásban is kikényszerítendő.
- **Ha nincs érdemi találat vagy az AI Gateway hibázik, a válasz mindig őszinte, emberi üzenet — SOSE kitalált találat.** Ez a projekt már kétszer megégette magát fabrikált "élő" adattal (l. spec, "Hibakezelés" szakasz).

---

### Task 1: Előfeltételek — csomagtelepítés és AI Gateway engedélyezés

**Files:**
- Modify: `package.json` (új függőségek)

**Interfaces:**
- Produces: `ai-gateway-sdk` csomagnév, ami ténylegesen az `ai@^6` csomag — a következő taskok ebből importálnak (`gateway`, `generateText`, `APICallError`). `@ai-sdk/anthropic` csomag, amiből `anthropic.tools.webSearch_20250305(...)` jön.

- [ ] **Step 1: Vercel AI Gateway engedélyezése a projekten (tulajdonosi/deploy teendő)**

Ezt a lépést a projekt tulajdonosának/a Vercel-hozzáféréssel rendelkező személynek kell elvégeznie — ügynök nem tud Vercel dashboardon böngészőben authentikálni:

1. `npm i -g vercel` (a Vercel CLI jelenleg nincs telepítve ezen a gépen)
2. `vercel link` — kösd össze ezt a repót a `brunellaagent-1630s-projects/homolamentor` Vercel projekttel
3. Vercel dashboard → a projekt → **Settings → AI Gateway** → engedélyezés
4. `vercel env pull .env.local` — ez leírja a `VERCEL_OIDC_TOKEN`-t (rövid élettartamú JWT, ~24 óra) `.env.local`-ba, amiből a Gateway hitelesítése automatikusan működik helyi fejlesztéskor. Vercelre deployolva ez automatikus, nem kell semmit beállítani.
5. Opcionális, de ajánlott: Settings → AI Gateway → **Rate Limits** — állíts be per-user RPM-et (pl. 10 kérés/perc) és napi token-plafont, hogy a szabadon elérhető keresőmező ne okozhasson elszabadult költést.

- [ ] **Step 2: Izolált `ai@^6` alias-csomag telepítése**

```bash
npm install ai-gateway-sdk@npm:ai@^6.0.0
```

Ez a meglévő `"ai": "4.0.17"` bejegyzést **nem** módosítja a `package.json`-ban — egy új, `ai-gateway-sdk` nevű bejegyzés jön létre `"ai-gateway-sdk": "npm:ai@^6.x.x"` értékkel. A Brunella chat (`src/app/api/chat/route.ts`, `AIChatAssistant.tsx`) továbbra is a régi `"ai"` csomagot importálja, teljesen érintetlen.

- [ ] **Step 3: `@ai-sdk/anthropic` telepítése**

```bash
npm install @ai-sdk/anthropic@latest
```

Ez egy vadonatúj csomag ebben a projektben (eddig nem volt Anthropic-integráció), nincs verzióütközés.

- [ ] **Step 4: Ellenőrzés**

```bash
node -e "const {gateway} = require('ai-gateway-sdk'); console.log(typeof gateway)"
```

Elvárt kimenet: `function`

```bash
grep -E '"ai"|"ai-gateway-sdk"|@ai-sdk/anthropic|@ai-sdk/openai' package.json
```

Elvárt kimenet: mind a négy sor szerepel, `"ai": "4.0.17"` változatlan.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add isolated AI Gateway packages (ai-gateway-sdk alias + @ai-sdk/anthropic)"
```

---

### Task 2: Megosztott típusok és session-helper

**Files:**
- Create: `src/lib/propertySearch.ts`
- Create: `src/lib/demandSession.ts`

**Interfaces:**
- Produces: `TeaserResult`, `PropertySearchResponse` típusok (Task 4, 6, 8 importálja). `getOrCreateDemandSessionId(): Promise<string>` (Task 4 használja).

- [ ] **Step 1: `src/lib/propertySearch.ts` létrehozása**

```typescript
export interface TeaserResult {
  id: string;
  category: string;
  locationHint: string;
  priceRange?: string;
  summary: string;
  features: string[];
}

export interface PropertySearchResponse {
  results: TeaserResult[];
  notice?: string;
}
```

- [ ] **Step 2: `src/lib/demandSession.ts` létrehozása**

```typescript
import { cookies } from "next/headers";

const COOKIE_NAME = "demand_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Anonim, azonosítható-de-nem-személyes session ID az ingatlan-kereső
 * AI Gateway hívásaihoz (per-user rate limit tag). Nem hitelesítés — csak
 * költség- és visszaélés-védelmi célt szolgál.
 */
export async function getOrCreateDemandSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}
```

- [ ] **Step 3: TypeScript ellenőrzés**

```bash
npx tsc --noEmit
```

Elvárt: nincs hiba a két új fájlra hivatkozva (a projekt más, meglévő hibái — ha vannak — ettől függetlenek).

- [ ] **Step 4: Commit**

```bash
git add src/lib/propertySearch.ts src/lib/demandSession.ts
git commit -m "Add shared types and anonymous session helper for property search"
```

---

### Task 3: `Kereslet_Talalatok` Sheets lap létrehozása

**Files:**
- Create: `scripts/init_demand_sheet.js`

**Interfaces:**
- Produces: a `Kereslet_Talalatok` munkalap a `1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ` táblázatban, fejléc: `Datum | Keresesi_Kifejezes | Kategoria | Lokacio_Hint | Ar_Tartomany | AI_Osszefoglalo | Erdeklodo_Neve | Erdeklodo_Email | Nyelv | Allapot` (A:J). Task 8 és Task 9 erre a fejlécsorrendre épít.

- [ ] **Step 1: `scripts/init_demand_sheet.js` létrehozása**

```javascript
/**
 * Homola Mentor Kft. — "Kereslet_Talalatok" munkalap inicializálása
 *
 * Egyszeri, helyi futtatásra szánt szkript: létrehozza az ingatlan-kereső
 * funkció CRM-lapját (ha még nem létezik) és beírja a fejlécsort.
 *
 * Csak a `gws` CLI-n keresztül fut, execFileSync + valódi gws.exe bináris
 * hívással (AGENTS.md 1. tanulság) — ez helyi, egyszeri szkript, NEM Vercel
 * API route, ezért itt biztonságos a gws CLI-t használni (a gws nem npm
 * függőség, Vercel serverless futtatókörnyezetben nem elérhető — lásd a
 * property-search API route-ok googleapis JWT alapú megoldását).
 *
 * HASZNÁLAT
 *   node scripts/init_demand_sheet.js
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const IS_WIN = process.platform === "win32";
const SPREADSHEET_ID = "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";
const HEADER = [
  "Datum",
  "Keresesi_Kifejezes",
  "Kategoria",
  "Lokacio_Hint",
  "Ar_Tartomany",
  "AI_Osszefoglalo",
  "Erdeklodo_Neve",
  "Erdeklodo_Email",
  "Nyelv",
  "Allapot",
];

function resolveGwsBinary() {
  if (!IS_WIN) return "gws";
  const candidate = path.join(
    process.env.APPDATA || "",
    "npm", "node_modules", "@googleworkspace", "cli", "bin", "gws.exe"
  );
  if (fs.existsSync(candidate)) return candidate;
  return "gws";
}

const GWS_BIN = resolveGwsBinary();

function runGws(argv, { params, json } = {}) {
  const args = [...argv];
  if (params !== undefined) args.push("--params", JSON.stringify(params));
  if (json !== undefined) args.push("--json", JSON.stringify(json));

  const out = execFileSync(GWS_BIN, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const start = out.indexOf("{");
  if (start === -1) throw new Error(`Váratlan gws kimenet: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start));
}

function main() {
  console.log(`"${SHEET_NAME}" munkalap ellenőrzése/létrehozása...\n`);

  try {
    runGws(["sheets", "spreadsheets", "batchUpdate"], {
      params: { spreadsheetId: SPREADSHEET_ID },
      json: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    console.log(`✓ A "${SHEET_NAME}" munkalap létrejött.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      console.log(`ℹ A "${SHEET_NAME}" munkalap már létezik, folytatás a fejléc ellenőrzésével.`);
    } else {
      console.error("❌ Hiba a munkalap létrehozásakor:", message);
      process.exit(1);
    }
  }

  console.log("\nFejlécsor beírása...");
  runGws(["sheets", "spreadsheets", "values", "update"], {
    params: {
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1`,
      valueInputOption: "USER_ENTERED",
    },
    json: { values: [HEADER] },
  });
  console.log("✓ Fejlécsor beírva.");

  console.log("\nEllenőrzés — visszaolvasás...");
  const verify = runGws(["sheets", "spreadsheets", "values", "get"], {
    params: { spreadsheetId: SPREADSHEET_ID, range: `'${SHEET_NAME}'!A1:J1` },
  });
  console.log("Beolvasott fejléc:", JSON.stringify(verify.values));

  console.log("\nKész.");
}

main();
```

- [ ] **Step 2: Futtatás**

```bash
node scripts/init_demand_sheet.js
```

Elvárt kimenet vége: `Beolvasott fejléc: [["Datum","Keresesi_Kifejezes","Kategoria","Lokacio_Hint","Ar_Tartomany","AI_Osszefoglalo","Erdeklodo_Neve","Erdeklodo_Email","Nyelv","Allapot"]]` majd `Kész.`

Ez élő Sheets-írás — csak akkor futtasd, ha a `gws` CLI be van jelentkezve ezen a gépen (a meglévő `scripts/`-szkriptek ugyanígy futnak).

- [ ] **Step 3: Commit**

```bash
git add scripts/init_demand_sheet.js
git commit -m "Add one-time init script for the Kereslet_Talalatok CRM sheet"
```

---

### Task 4: `/api/property-search` route

**Files:**
- Create: `src/app/api/property-search/route.ts`

**Interfaces:**
- Consumes: `TeaserResult`, `PropertySearchResponse` (Task 2), `getOrCreateDemandSessionId()` (Task 2)
- Produces: `POST /api/property-search` — bemenet `{ query: string; locale?: string }`, kimenet mindig HTTP 200, body `PropertySearchResponse`. Task 6 (`PropertySearchSection`) ezt hívja.

- [ ] **Step 1: `src/app/api/property-search/route.ts` létrehozása**

```typescript
import { NextResponse } from "next/server";
import { gateway, generateText, APICallError } from "ai-gateway-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { getOrCreateDemandSessionId } from "@/lib/demandSession";
import type { TeaserResult, PropertySearchResponse } from "@/lib/propertySearch";

const LOCALE_NAMES: Record<string, string> = {
  hu: "Hungarian",
  en: "English",
  de: "German",
  fr: "French",
};

function buildSystemPrompt(locale: string): string {
  const langName = LOCALE_NAMES[locale] || "Hungarian";
  return `You are a real estate market research assistant for HOMLAMENTOR KFT, a Hungarian real estate intermediary company.

RULES (must always follow):
1. Search the public web for real, currently active property listings matching the user's query.
2. Summarize each match IN YOUR OWN WORDS — never quote listing text verbatim.
3. NEVER include a source URL, advertiser name, phone number, or email address in your summary.
4. NEVER invent or guess a listing that you did not actually find via search — if nothing relevant turns up, say so plainly in "notice" and return an empty "results" array.
5. Respond in ${langName}.
6. Return at most 5 matches, the most relevant first.

Respond ONLY with a JSON object of this exact shape (no markdown code fences, no extra text before or after):
{"results": [{"id": string, "category": string, "locationHint": string, "priceRange": string | null, "summary": string, "features": string[]}], "notice": string | null}

"notice" must contain a short, human-readable message ONLY when results is empty, explaining that nothing relevant was found.`;
}

function parseModelJson(text: string): { results: TeaserResult[]; notice: string | null } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { results: [], notice: null };
  }
  try {
    const raw = JSON.parse(text.slice(start, end + 1));
    const results: TeaserResult[] = Array.isArray(raw.results)
      ? raw.results
          .filter((r: unknown): r is Record<string, unknown> => typeof r === "object" && r !== null)
          .map((r: Record<string, unknown>, idx: number) => ({
            id: typeof r.id === "string" ? r.id : `result-${idx}`,
            category: typeof r.category === "string" ? r.category : "Ingatlan",
            locationHint: typeof r.locationHint === "string" ? r.locationHint : "",
            priceRange: typeof r.priceRange === "string" ? r.priceRange : undefined,
            summary: typeof r.summary === "string" ? r.summary : "",
            features: Array.isArray(r.features)
              ? r.features.filter((f: unknown): f is string => typeof f === "string")
              : [],
          }))
          .filter((r: TeaserResult) => r.summary.length > 0)
      : [];
    return { results, notice: typeof raw.notice === "string" ? raw.notice : null };
  } catch {
    return { results: [], notice: null };
  }
}

export async function POST(request: Request) {
  let body: { query?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = (body.query || "").trim();
  const locale = body.locale && LOCALE_NAMES[body.locale] ? body.locale : "hu";

  if (query.length < 3) {
    return NextResponse.json({ error: "A keresési kifejezés túl rövid." }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "A keresési kifejezés túl hosszú." }, { status: 400 });
  }

  const sessionId = await getOrCreateDemandSessionId();
  const webSearchTool = anthropic.tools.webSearch_20250305({ maxUses: 3 });

  try {
    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
      system: buildSystemPrompt(locale),
      prompt: `Ingatlanpiaci keresési kifejezés: "${query}"`,
      tools: { web_search: webSearchTool },
      providerOptions: {
        gateway: {
          user: sessionId,
          tags: ["feature:property-search"],
        },
      },
    });

    const parsed = parseModelJson(text);
    const response: PropertySearchResponse = {
      results: parsed.results.slice(0, 5),
      notice:
        parsed.results.length === 0
          ? parsed.notice || "Jelenleg nem találtunk nyilvános hirdetést erre a keresésre."
          : undefined,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429) {
        return NextResponse.json<PropertySearchResponse>({
          results: [],
          notice: "Túl sok keresés érkezett rövid idő alatt. Kérjük, próbálja újra néhány perc múlva.",
        });
      }
      if (error.statusCode === 402) {
        return NextResponse.json<PropertySearchResponse>({
          results: [],
          notice:
            "A keresési szolgáltatás jelenleg nem elérhető. Kérjük, próbálja meg később, vagy vegye fel velünk közvetlenül a kapcsolatot.",
        });
      }
    }
    console.error("Property search error:", error);
    return NextResponse.json<PropertySearchResponse>({
      results: [],
      notice: "Hiba történt a keresés során. Kérjük, próbálja meg később.",
    });
  }
}
```

- [ ] **Step 2: Modell-slug ellenőrzése implementáció közben**

A skill előírja: hardcode-olt modell-slug előtt ellenőrizni kell az elérhető modelleket.

```bash
node -e "const {gateway} = require('ai-gateway-sdk'); gateway.getAvailableModels().then(m => console.log(m.filter(x => x.id.includes('anthropic')).map(x => x.id)))"
```

Ha `anthropic/claude-sonnet-4.6` nem szerepel a listában, cseréld a route-ban a legközelebbi elérhető, web-search-képes Claude modellre.

- [ ] **Step 3: Kézi ellenőrzés dev szerveren**

```bash
npm run dev
```

Másik terminálban:

```bash
curl -s -X POST http://localhost:3000/api/property-search \
  -H "Content-Type: application/json" \
  -d '{"query":"ipari csarnok Szeged környékén","locale":"hu"}'
```

Elvárt: HTTP 200, JSON válasz `results` tömbbel (0–5 elem) vagy `notice` üzenettel. Ha a keresés hibázik (pl. `VERCEL_OIDC_TOKEN` hiányzik), a válasz akkor is 200 és `notice`-t tartalmaz — SOSE 500-as technikai hibakód a felhasználó felé.

```bash
curl -s -X POST http://localhost:3000/api/property-search \
  -H "Content-Type: application/json" \
  -d '{"query":"ab"}'
```

Elvárt: HTTP 400 (`"A keresési kifejezés túl rövid."`).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/property-search/route.ts
git commit -m "Add AI Gateway-backed live property search API route"
```

---

### Task 5: i18n kulcsok (hu/en/de/fr)

**Files:**
- Modify: `src/messages/hu.json`
- Modify: `src/messages/en.json`
- Modify: `src/messages/de.json`
- Modify: `src/messages/fr.json`

**Interfaces:**
- Produces: `PropertySearchSection` namespace mind a 4 nyelvi fájlban — Task 6 (`PropertySearchSection.tsx`) ezekre a kulcsokra hivatkozik `useTranslations('PropertySearchSection')`-nel.

- [ ] **Step 1: `src/messages/hu.json` — új `PropertySearchSection` kulcs beszúrása a `PropertyRequestForm` blokk elé**

```json
  "PropertySearchSection": {
    "title": "Keresse meg, amit szeretne",
    "subtitle": "Írja be, milyen ingatlant vagy iparterületet keres — élőben rákeresünk a piacra, és megmutatjuk, mit találtunk.",
    "inputPlaceholder": "pl. \"ipari csarnok Szeged környékén\"",
    "searchButton": "Keresés",
    "searching": "Keresés...",
    "searchingHint": "Élőben keresünk a nyilvános piaci hirdetések között — ez néhány másodpercet igénybe vehet.",
    "nameLabel": "Teljes név",
    "emailLabel": "E-mail cím",
    "interestButton": "Érdekel",
    "interestSubmit": "Küldés",
    "interestSuccess": "Köszönjük! Kollégáink hamarosan felveszik Önnel a kapcsolatot.",
    "errorNotice": "Hiba történt. Kérjük, próbálja meg később."
  },
```

- [ ] **Step 2: `src/messages/en.json` — ugyanez a kulcs, angolul, ugyanoda beszúrva**

```json
  "PropertySearchSection": {
    "title": "Find what you're looking for",
    "subtitle": "Tell us what property or industrial site you need — we'll search the live market and show you what we found.",
    "inputPlaceholder": "e.g. \"industrial hall near Szeged\"",
    "searchButton": "Search",
    "searching": "Searching...",
    "searchingHint": "We're searching live public listings — this may take a few seconds.",
    "nameLabel": "Full name",
    "emailLabel": "Email address",
    "interestButton": "I'm interested",
    "interestSubmit": "Submit",
    "interestSuccess": "Thank you! Our team will contact you shortly.",
    "errorNotice": "Something went wrong. Please try again later."
  },
```

- [ ] **Step 3: `src/messages/de.json` — német verzió**

```json
  "PropertySearchSection": {
    "title": "Finden Sie, was Sie suchen",
    "subtitle": "Sagen Sie uns, welche Immobilie oder welches Gewerbegrundstück Sie suchen — wir durchsuchen den Live-Markt und zeigen Ihnen die Ergebnisse.",
    "inputPlaceholder": "z. B. \"Industriehalle bei Szeged\"",
    "searchButton": "Suchen",
    "searching": "Suche läuft...",
    "searchingHint": "Wir durchsuchen live öffentliche Angebote — das kann einige Sekunden dauern.",
    "nameLabel": "Vollständiger Name",
    "emailLabel": "E-Mail-Adresse",
    "interestButton": "Interessiert",
    "interestSubmit": "Absenden",
    "interestSuccess": "Vielen Dank! Unser Team wird sich in Kürze bei Ihnen melden.",
    "errorNotice": "Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut."
  },
```

- [ ] **Step 4: `src/messages/fr.json` — francia verzió**

```json
  "PropertySearchSection": {
    "title": "Trouvez ce que vous recherchez",
    "subtitle": "Indiquez-nous le bien ou le terrain industriel que vous recherchez — nous explorons le marché en direct et vous montrons ce que nous avons trouvé.",
    "inputPlaceholder": "p. ex. \"hall industriel près de Szeged\"",
    "searchButton": "Rechercher",
    "searching": "Recherche en cours...",
    "searchingHint": "Nous recherchons en direct parmi les annonces publiques — cela peut prendre quelques secondes.",
    "nameLabel": "Nom complet",
    "emailLabel": "Adresse e-mail",
    "interestButton": "Je suis intéressé(e)",
    "interestSubmit": "Envoyer",
    "interestSuccess": "Merci ! Notre équipe vous contactera prochainement.",
    "errorNotice": "Une erreur s'est produite. Veuillez réessayer plus tard."
  },
```

- [ ] **Step 5: JSON-érvényesség ellenőrzése mind a 4 fájlra**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/messages/hu.json','utf8')); JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/messages/de.json','utf8')); JSON.parse(require('fs').readFileSync('src/messages/fr.json','utf8')); console.log('OK')"
```

Elvárt kimenet: `OK` (ha bármelyik fájl szintaktikailag hibás JSON, itt hibát dob).

- [ ] **Step 6: Commit**

```bash
git add src/messages/hu.json src/messages/en.json src/messages/de.json src/messages/fr.json
git commit -m "Add PropertySearchSection translations for hu/en/de/fr"
```

---

### Task 6: `PropertySearchSection` komponens

**Files:**
- Create: `src/components/PropertySearchSection.tsx`

**Interfaces:**
- Consumes: `POST /api/property-search` (Task 4), `POST /api/property-search/interest` (Task 8 — a komponens ezt már most, Task 6-ban meghívja, de a route csak Task 8-ban készül el; a keresés önmagában Task 6 után is tesztelhető, az "Érdekel" gomb csak Task 8 után fog sikeresen válaszolni), `PropertySearchSection` i18n namespace (Task 5), `TeaserResult`/`PropertySearchResponse` (Task 2)
- Produces: `<PropertySearchSection />` default export — Task 7 ezt illeszti be az `/ingatlan-portal` oldalba.

- [ ] **Step 1: `src/components/PropertySearchSection.tsx` létrehozása**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MapPin, Tag, CheckCircle2, Send, MessageCircleQuestion } from 'lucide-react';
import type { TeaserResult, PropertySearchResponse } from '@/lib/propertySearch';

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

export default function PropertySearchSection() {
  const t = useTranslations('PropertySearchSection');
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<TeaserResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3 || status === 'loading') return;

    setStatus('loading');
    setNotice(null);

    try {
      const res = await fetch('/api/property-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), locale }),
      });
      const data: PropertySearchResponse = await res.json();
      setResults(data.results || []);
      setNotice(data.notice || null);
      setStatus('done');
    } catch {
      setResults([]);
      setNotice(t('errorNotice'));
      setStatus('error');
    }
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950 overflow-hidden border-b border-slate-900/50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('inputPlaceholder')}
            disabled={status === 'loading'}
            minLength={3}
            maxLength={300}
            required
            className="flex-1 bg-slate-900/60 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/50 rounded-xl px-5 py-4 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || query.trim().length < 3}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-sky-400 disabled:from-blue-600/50 disabled:to-sky-500/50 text-slate-950 font-bold rounded-xl shadow-xl shadow-black/50 hover:shadow-black/70 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('searching')}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t('searchButton')}
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-400 text-sm"
            >
              {t('searchingHint')}
            </motion.p>
          )}

          {status !== 'loading' && notice && results.length === 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-300 bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-8 max-w-xl mx-auto text-sm leading-relaxed"
            >
              {notice}
            </motion.p>
          )}

          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {results.map((result) => (
                <ResultCard key={result.id} result={result} query={query} locale={locale} t={t} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  query,
  locale,
  t,
}: {
  result: TeaserResult;
  query: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interestStatus, setInterestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterestStatus('loading');
    try {
      const res = await fetch('/api/property-search/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, matchedResult: result, name, email, locale }),
      });
      if (!res.ok) throw new Error('failed');
      setInterestStatus('success');
    } catch {
      setInterestStatus('error');
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1 uppercase tracking-widest">
          {result.category}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
        <MapPin className="w-3.5 h-3.5 text-blue-400" />
        {result.locationHint}
      </div>

      {result.priceRange && (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-4">
          <Tag className="w-3.5 h-3.5 text-blue-400" />
          {result.priceRange}
        </div>
      )}

      <p className="text-xs text-slate-300 font-light mb-4 leading-relaxed">{result.summary}</p>

      {result.features.length > 0 && (
        <div className="space-y-1.5 mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          {result.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      )}

      {interestStatus === 'success' ? (
        <p className="text-xs text-emerald-400 font-semibold text-center py-2">{t('interestSuccess')}</p>
      ) : showForm ? (
        <form onSubmit={handleInterest} className="space-y-2 border-t border-slate-800 pt-4">
          <input
            type="text"
            required
            placeholder={t('nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={interestStatus === 'loading'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          <input
            type="email"
            required
            placeholder={t('emailLabel')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={interestStatus === 'loading'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          {interestStatus === 'error' && (
            <p className="text-[11px] text-red-400 text-center">{t('errorNotice')}</p>
          )}
          <button
            type="submit"
            disabled={interestStatus === 'loading'}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {interestStatus === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {t('interestSubmit')}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-1 w-full py-2.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <MessageCircleQuestion className="w-3.5 h-3.5" />
          {t('interestButton')}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript és lint ellenőrzés**

```bash
npx tsc --noEmit && npm run lint
```

Elvárt: nincs új hiba a `PropertySearchSection.tsx`-re hivatkozva.

- [ ] **Step 3: Commit**

```bash
git add src/components/PropertySearchSection.tsx
git commit -m "Add PropertySearchSection client component"
```

---

### Task 7: `/ingatlan-portal` oldal módosítása

**Files:**
- Modify: `src/app/[locale]/ingatlan-portal/page.tsx`

**Interfaces:**
- Consumes: `PropertySearchSection` (Task 6)

- [ ] **Step 1: `PropertyRequestForm` import cseréje `PropertySearchSection`-re, és beillesztés a Hero és a Teaser Grid közé**

A jelenlegi fájl teteje:

```tsx
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import RealEstateHero from '@/components/RealEstateHero';
import { Link } from '@/i18n/routing';

const PropertyTeaserGrid = dynamic(() => import('@/components/PropertyTeaserGrid'));
const VIPAccessGateway = dynamic(() => import('@/components/VIPAccessGateway'));
const PropertyRequestForm = dynamic(() => import('@/components/PropertyRequestForm'));
```

Cseréld erre:

```tsx
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import RealEstateHero from '@/components/RealEstateHero';
import { Link } from '@/i18n/routing';

const PropertyTeaserGrid = dynamic(() => import('@/components/PropertyTeaserGrid'));
const VIPAccessGateway = dynamic(() => import('@/components/VIPAccessGateway'));
const PropertySearchSection = dynamic(() => import('@/components/PropertySearchSection'));
```

A `<main>` blokkban (jelenleg):

```tsx
      <main className="flex-grow">
        {/* Ingatlan Hero Fejléc */}
        <RealEstateHero />

        {/* Kiemelt Ajánlatok Grid (Teaser) */}
        <PropertyTeaserGrid />

        {/* VIP Beléptető Kapu & Zártkörű Ingatlanok */}
        <VIPAccessGateway />

        {/* Egyedi Keresési Igények Leadása */}
        <PropertyRequestForm />
      </main>
```

Cseréld erre (a keresés a Hero alá, a Teaser Grid elé kerül, és kiváltja a statikus űrlapot):

```tsx
      <main className="flex-grow">
        {/* Ingatlan Hero Fejléc */}
        <RealEstateHero />

        {/* Élő AI Ingatlankereső */}
        <PropertySearchSection />

        {/* Kiemelt Ajánlatok Grid (Teaser) */}
        <PropertyTeaserGrid />

        {/* VIP Beléptető Kapu & Zártkörű Ingatlanok */}
        <VIPAccessGateway />
      </main>
```

Megjegyzés: a `src/components/PropertyRequestForm.tsx` fájl a repóban marad (nem törlődik ebben a planben) — az éles validáció után külön takarítási lépésben törölhető, ha a csapat úgy dönt.

- [ ] **Step 2: TypeScript ellenőrzés**

```bash
npx tsc --noEmit
```

Elvárt: nincs hiba (a `PropertyRequestForm` importjának eltávolítása nem hagy "unused import" hibát, mert teljesen törölve van a sor).

- [ ] **Step 3: Böngészős ellenőrzés**

```bash
npm run dev
```

Nyisd meg `http://localhost:3000/hu/ingatlan-portal`-t böngészőben. Ellenőrizd:
1. A Hero alatt megjelenik az új "Keresse meg, amit szeretne" szekció keresőmezővel
2. Alatta a 9 saját ingatlan Teaser Grid-je változatlanul megjelenik
3. A VIP kapu változatlanul megjelenik
4. A régi "Egyedi igények benyújtása" statikus űrlap **nem** jelenik meg többé

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/ingatlan-portal/page.tsx"
git commit -m "Replace static PropertyRequestForm with PropertySearchSection on ingatlan-portal page"
```

---

### Task 8: `/api/property-search/interest` route

**Files:**
- Create: `src/app/api/property-search/interest/route.ts`

**Interfaces:**
- Consumes: `TeaserResult` (Task 2), `escapeHtml` (`src/lib/escapeHtml.ts`, meglévő), a `Kereslet_Talalatok` lap A:J oszlopsorrendje (Task 3)
- Produces: `POST /api/property-search/interest` — bemenet `{ query: string; matchedResult: TeaserResult; name: string; email: string; locale?: string }`, kimenet `{ success: true; integrations: {...} }`. Task 6 `ResultCard`-ja ezt hívja.

- [ ] **Step 1: `src/app/api/property-search/interest/route.ts` létrehozása**

```typescript
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/escapeHtml";
import type { TeaserResult } from "@/lib/propertySearch";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const CONFIRMATION_COPY: Record<string, { subject: string; body: string }> = {
  hu: {
    subject: "Köszönjük az érdeklődését – HOMLAMENTOR KFT",
    body: "Köszönjük, hogy jelezte érdeklődését. Kollégáink hamarosan felveszik Önnel a kapcsolatot.",
  },
  en: {
    subject: "Thank you for your interest – HOMLAMENTOR KFT",
    body: "Thank you for reaching out. Our team will contact you shortly.",
  },
  de: {
    subject: "Vielen Dank für Ihr Interesse – HOMLAMENTOR KFT",
    body: "Vielen Dank für Ihre Anfrage. Unser Team wird sich in Kürze bei Ihnen melden.",
  },
  fr: {
    subject: "Merci de votre intérêt – HOMLAMENTOR KFT",
    body: "Merci de nous avoir contactés. Notre équipe vous répondra sous peu.",
  },
};

async function appendDemandRow(row: string[]): Promise<{ success: boolean; message?: string }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    return { success: false, message: "Hiányzó GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY." };
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message };
  }
}

export async function POST(request: Request) {
  let body: {
    query?: string;
    matchedResult?: TeaserResult;
    name?: string;
    email?: string;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { query, matchedResult, name, email, locale } = body;

  if (!query || !matchedResult || !name || !email) {
    return NextResponse.json(
      { error: "A keresési kifejezés, a találat, a név és az e-mail cím megadása kötelező." },
      { status: 400 }
    );
  }

  const safeLocale = locale && CONFIRMATION_COPY[locale] ? locale : "hu";
  const today = new Date().toISOString().split("T")[0];

  const row = [
    `'${today}`,
    query,
    matchedResult.category || "",
    matchedResult.locationHint || "",
    matchedResult.priceRange || "",
    matchedResult.summary || "",
    name,
    email,
    safeLocale,
    "Új",
  ];

  const teamEmailHtml = `
    <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">Új kereslet-találat érdeklődés</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">Keresési kifejezés:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(query)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Kategória:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(matchedResult.category || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Lokáció:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(matchedResult.locationHint || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Ár-tartomány:</td><td style="padding: 8px 0; color: #34d399;">${escapeHtml(matchedResult.priceRange || "Nincs megadva")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; vertical-align: top;">AI-összefoglaló:</td><td style="padding: 8px 0; color: #ffffff; white-space: pre-wrap;">${escapeHtml(matchedResult.summary || "")}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Érdeklődő:</td><td style="padding: 8px 0; color: #ffffff;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">E-mail:</td><td style="padding: 8px 0; color: #38bdf8;"><a href="mailto:${escapeHtml(email)}" style="color: #38bdf8;">${escapeHtml(email)}</a></td></tr>
      </table>
    </div>
  `;

  const userEmailHtml = `
    <div style="background-color: #0b0f19; color: #f1f5f9; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">HOMLAMENTOR KFT</h1>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">${escapeHtml(CONFIRMATION_COPY[safeLocale].body)}</p>
    </div>
  `;

  const [sheetResult, teamEmailResult, userEmailResult] = await Promise.allSettled([
    appendDemandRow(row),
    resend
      ? resend.emails.send({
          from: "HOMLAMENTOR <onboarding@resend.dev>",
          to: ["office.homlamentor@gmail.com"],
          subject: `Új kereslet-találat érdeklődés: ${query}`,
          html: teamEmailHtml,
        })
      : Promise.resolve({ skipped: true }),
    resend
      ? resend.emails.send({
          from: "HOMLAMENTOR <onboarding@resend.dev>",
          to: [email],
          subject: CONFIRMATION_COPY[safeLocale].subject,
          html: userEmailHtml,
        })
      : Promise.resolve({ skipped: true }),
  ]);

  const sheetOk = sheetResult.status === "fulfilled" && sheetResult.value.success;
  if (!sheetOk) {
    console.error(
      "Kereslet_Talalatok írási hiba:",
      sheetResult.status === "fulfilled" ? sheetResult.value.message : sheetResult.reason
    );
  }
  if (teamEmailResult.status === "rejected") {
    console.error("Csapat-értesítő e-mail hiba:", teamEmailResult.reason);
  }
  if (userEmailResult.status === "rejected") {
    console.error("Visszaigazoló e-mail hiba:", userEmailResult.reason);
  }

  return NextResponse.json({
    success: true,
    integrations: {
      sheet: sheetOk ? "success" : "failed",
      teamEmail: resend ? (teamEmailResult.status === "fulfilled" ? "sent" : "failed") : "mocked",
      userEmail: resend ? (userEmailResult.status === "fulfilled" ? "sent" : "failed") : "mocked",
    },
  });
}
```

- [ ] **Step 2: Kézi ellenőrzés dev szerveren**

```bash
curl -s -X POST http://localhost:3000/api/property-search/interest \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ipari csarnok Szeged környékén",
    "matchedResult": {"id":"test-1","category":"Ipari & Logisztika","locationHint":"Szeged környéke","priceRange":"kb. 1-2M EUR","summary":"Teszt összefoglaló.","features":["teszt jellemző"]},
    "name": "Teszt Elek",
    "email": "teszt@example.com",
    "locale": "hu"
  }'
```

Elvárt: HTTP 200, `{"success":true,"integrations":{"sheet":"success","teamEmail":"sent","userEmail":"sent"}}` (ha a `RESEND_API_KEY` és `GOOGLE_SERVICE_ACCOUNT_EMAIL`/`GOOGLE_PRIVATE_KEY` be van állítva `.env.local`-ban). Ellenőrizd böngészőben a Google Sheets `Kereslet_Talalatok` lapját — az új sornak meg kell jelennie.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/property-search/interest/route.ts
git commit -m "Add lead-capture API route for property search interest clicks"
```

---

### Task 9: `/api/demand-sync` admin route

**Files:**
- Create: `src/app/api/demand-sync/route.ts`

**Interfaces:**
- Consumes: `requireAdmin()` (`src/lib/requireAdmin.ts`, meglévő), a `Kereslet_Talalatok` lap A:J oszlopsorrendje (Task 3)
- Produces: `GET /api/demand-sync` (admin-védett) — `DemandRow` típus és `{ success, entries: DemandRow[], notice?, lastSyncedAt }` válasz. Task 10 (`DemandTable`) ezt hívja és importálja a `DemandRow` típust.

- [ ] **Step 1: `src/app/api/demand-sync/route.ts` létrehozása**

```typescript
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/requireAdmin";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID_MASTER ||
  "1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";
const SHEET_NAME = "Kereslet_Talalatok";

export interface DemandRow {
  id: string;
  date: string;
  query: string;
  category: string;
  locationHint: string;
  priceRange: string;
  summary: string;
  interestedName: string;
  interestedEmail: string;
  locale: string;
  status: string;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return NextResponse.json(
      { error: "Hiányzó környezeti változók: GOOGLE_SERVICE_ACCOUNT_EMAIL vagy GOOGLE_PRIVATE_KEY." },
      { status: 400 }
    );
  }

  privateKey = privateKey.replace(/\\n/g, "\n");
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:J1000`,
    });

    const rows = res.data.values || [];
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    const entries: DemandRow[] = dataRows
      .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
      .map((row, idx) => ({
        id: String(idx + 1),
        date: String(row[0] || "").replace(/^'/, ""),
        query: String(row[1] || ""),
        category: String(row[2] || ""),
        locationHint: String(row[3] || ""),
        priceRange: String(row[4] || ""),
        summary: String(row[5] || ""),
        interestedName: String(row[6] || ""),
        interestedEmail: String(row[7] || ""),
        locale: String(row[8] || ""),
        status: String(row[9] || "Új"),
      }));

    return NextResponse.json({
      success: true,
      source: "google_sheets_live",
      count: entries.length,
      entries,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Kereslet_Talalatok olvasási hiba:", message);

    if (message.includes("Unable to parse range") || message.includes("not found")) {
      return NextResponse.json({
        success: true,
        source: "google_sheets_live",
        count: 0,
        entries: [],
        notice: `A "${SHEET_NAME}" munkalap még nem létezik — futtasd le a scripts/init_demand_sheet.js szkriptet.`,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Google Sheets API olvasási hiba", details: message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Kézi ellenőrzés — hitelesítés nélkül és admin-bejelentkezéssel**

```bash
curl -s http://localhost:3000/api/demand-sync
```

Elvárt: HTTP 401, `{"error":"Hitelesítés szükséges. Jelentkezz be az admin felületen."}`.

Böngészőben, admin-bejelentkezés után nyisd meg `http://localhost:3000/api/demand-sync`-t közvetlenül (vagy dev tools Network fület `/admin` oldalon). Elvárt: HTTP 200, `entries` tömb (a Task 8-ban beírt teszt-sorral, ha az még nem lett törölve).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/demand-sync/route.ts
git commit -m "Add admin-protected read route for demand search leads"
```

---

### Task 10: Admin `DemandTable` + oldal + oldalsáv-bővítés

**Files:**
- Create: `src/app/[locale]/admin/components/DemandTable.tsx`
- Create: `src/app/[locale]/admin/demand/page.tsx`
- Modify: `src/app/[locale]/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: `GET /api/demand-sync` (Task 9), `DemandRow` típus (Task 9), `PageHeader` (`src/app/[locale]/admin/components/PageHeader.tsx`, meglévő)

- [ ] **Step 1: `src/app/[locale]/admin/components/DemandTable.tsx` létrehozása**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, MapPin, RefreshCw, Search, Tag, User } from "lucide-react";
import type { DemandRow } from "@/app/api/demand-sync/route";

export function DemandTable() {
  const [entries, setEntries] = useState<DemandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demand-sync");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ismeretlen hiba");
      setEntries(data.entries || []);
      setNotice(data.notice || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      term === "" ||
      e.query.toLowerCase().includes(term) ||
      e.interestedName.toLowerCase().includes(term) ||
      e.interestedEmail.toLowerCase().includes(term) ||
      e.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Kereslet-találatok
            {!loading && (
              <span className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} / {entries.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Az ingatlan-kereső AI-találataira jelzett érdeklődések
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Keresés kifejezés, név, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors disabled:opacity-50"
            title="Frissítés"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs">
          {notice}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Dátum</th>
              <th className="py-3.5 px-4">Keresési kifejezés</th>
              <th className="py-3.5 px-4">Találat</th>
              <th className="py-3.5 px-4">Érdeklődő</th>
              <th className="py-3.5 px-4">Nyelv</th>
              <th className="py-3.5 px-4">Állapot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{e.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{e.query}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 mb-1">
                      <Tag className="w-3 h-3" />
                      {e.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {e.locationHint} {e.priceRange && `• ${e.priceRange}`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      {e.interestedName}
                    </div>
                    <a
                      href={`mailto:${e.interestedEmail}`}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white text-[11px] font-mono"
                    >
                      <Mail className="w-3 h-3" />
                      {e.interestedEmail}
                    </a>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[11px] text-slate-400">{e.locale}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  {error ? "Nem sikerült betölteni az adatsorokat." : "Még nincs rögzített kereslet-találat."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

Megjegyzés: a `DemandRow` típus egy `route.ts`-ből (`@/app/api/demand-sync/route`) `import type`-tal jön — ez fordításidőben törlődik, nem kerül szerveroldali kód a kliens bundle-be, csak a típusdefiníció.

- [ ] **Step 2: `src/app/[locale]/admin/demand/page.tsx` létrehozása**

```tsx
"use client";

import { PageHeader } from "../components/PageHeader";
import { DemandTable } from "../components/DemandTable";

export default function AdminDemandPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Kereslet"
        subtitle="Az ingatlan-kereső AI-találataira érkezett érdeklődések — innen indítható a kapcsolatfelvétel a hirdetővel/forrással"
      />
      <DemandTable />
    </div>
  );
}
```

- [ ] **Step 3: `src/app/[locale]/admin/AdminSidebar.tsx` bővítése új menüponttal**

A lucide-react import lista bővítése (`Search` hozzáadása):

```tsx
import {
  Building2,
  Database,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Search,
  Settings,
  Users,
} from "lucide-react";
```

A `navItems` tömb bővítése (a "Megkeresések" után, "Beállítások" előtt):

```tsx
const navItems: NavItem[] = [
  { name: "Műszerfal", href: "/admin", icon: LayoutDashboard },
  { name: "CRM Leadek", href: "/admin/leads", icon: Users },
  { name: "Google Sheets Sync", href: "/admin/sync", icon: Database, triggersSync: true },
  { name: "Megkeresések", href: "/admin/outreach", icon: Mail },
  { name: "Kereslet", href: "/admin/demand", icon: Search },
  { name: "Beállítások", href: "/admin/settings", icon: Settings },
];
```

- [ ] **Step 4: TypeScript ellenőrzés**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Böngészős ellenőrzés**

Admin bejelentkezés után nyisd meg `http://localhost:3000/hu/admin/demand`-ot. Ellenőrizd:
1. A bal oldalsávban megjelenik az új "Kereslet" menüpont
2. Az oldal betölti a `Kereslet_Talalatok` lap sorait (vagy őszinte üres/hibaüzenetet mutat, ha még nincs adat)
3. A keresőmező szűri a listát

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/admin/components/DemandTable.tsx" "src/app/[locale]/admin/demand/page.tsx" "src/app/[locale]/admin/AdminSidebar.tsx"
git commit -m "Add admin dashboard section for demand search leads"
```

---

### Task 11: Végponti manuális ellenőrzés (teljes user flow)

**Files:** (nincs új fájl — csak ellenőrzés)

- [ ] **Step 1: Teljes flow böngészőben, mind a 4 locale-on**

Dev szerver fut (`npm run dev`). Mind a 4 nyelven (`/hu/ingatlan-portal`, `/en/ingatlan-portal`, `/de/ingatlan-portal`, `/fr/ingatlan-portal`):
1. Írj be egy keresést (pl. "ipari csarnok Szeged környékén" / "industrial hall near Szeged" / stb.)
2. Ellenőrizd: a keresés gomb letiltódik, "Keresés..." felirat és a `searchingHint` szöveg jelenik meg
3. Néhány másodperc múlva: vagy találatok jelennek meg kártyaformátumban (kategória, lokáció, ár-tartomány, összefoglaló, jellemzők, "Érdekel" gomb), vagy egy őszinte üres-állapot üzenet
4. Kattints az "Érdekel" gombra egy találatnál → mini-form nyílik (név + e-mail)
5. Töltsd ki és küldd be → siker-üzenet jelenik meg
6. Ellenőrizd a Google Sheets `Kereslet_Talalatok` lapját: új sor jelent meg a helyes adatokkal
7. Ellenőrizd az `office.homlamentor@gmail.com` postafiókot (vagy a Resend dashboardot, ha teszt-módban fut): megérkezett a csapat-értesítő e-mail
8. Ellenőrizd a megadott teszt-e-mail címet: megérkezett a visszaigazoló e-mail, a megfelelő nyelven

- [ ] **Step 2: Hibaszimuláció**

Ideiglenesen állíts be egy hibás `VERCEL_OIDC_TOKEN`-t vagy töröld azt a `.env.local`-ból, indítsd újra a dev szervert, és ismételd meg a keresést. Elvárt: a felhasználó barátságos hibaüzenetet lát (`notice` mező), nem technikai hibakódot vagy összeomlott UI-t. Állítsd vissza az érvényes tokent.

- [ ] **Step 3: XSS-ellenőrzés**

```bash
curl -s -X POST http://localhost:3000/api/property-search/interest \
  -H "Content-Type: application/json" \
  -d '{
    "query": "<script>alert(1)</script>",
    "matchedResult": {"id":"xss-test","category":"<img src=x onerror=alert(1)>","locationHint":"teszt","summary":"teszt","features":[]},
    "name": "<b>Teszt</b>",
    "email": "xss@example.com",
    "locale": "hu"
  }'
```

Ellenőrizd a beérkező csapat-e-mailt: a `<script>`/`<img onerror>` tartalom escapelt formában (`&lt;script&gt;`) jelenik meg, nem futó kódként.

- [ ] **Step 4: Admin oldali végső ellenőrzés**

Nyisd meg `/hu/admin/demand`-ot, ellenőrizd, hogy a Task 11 Step 1-3 során létrejött összes teszt-sor megjelenik, és a keresőmező helyesen szűr.

- [ ] **Step 5: Push a távoli GitHub repóba**

```bash
git push origin feat/portfolio-magazine-artifact
```

(Vagy a felhasználó által kért ágra/PR-folyamatba illesztve — kérdezz rá, ha nem egyértelmű, hogy ezen az ágon vagy egy újon menjen tovább a munka.)
