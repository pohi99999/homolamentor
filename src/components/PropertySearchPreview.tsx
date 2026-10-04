'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, MapPin, Ruler, Plug, Tag, X, CheckCircle2, FlaskConical } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { validateInterest } from '@/lib/propertyInterest';

// PREVIEW of the property-search module (card f1798734, content: homola-artifaktok 01, chapter 8).
// Search results are the made-up examples of chapter 8.2, nothing is fetched; the "Érdekel" form
// posts to /api/property-search/interest-preview, which validates and then drops everything.
// The model call, the office e-mail address and the sending domain wait for Péter's decision.

type Example = { category: string; place: string; area: string; utilities: string; price: string };

const EXAMPLES: Example[] = [
  { category: 'Ipari terület', place: 'Szeged környéke', area: 'kb. 1,4-1,6 ha', utilities: 'víz, villany, csatorna', price: 'egyeztetendő' },
  { category: 'Ipari terület', place: 'Szeged környéke', area: 'kb. 1,5 ha', utilities: 'villany, víz; csatorna tervezett', price: 'egyeztetendő' },
  { category: 'Építési telek', place: 'Csongrád-Csanád vármegye', area: 'kb. 2 ha', utilities: 'közmű a telekhatáron', price: 'egyeztetendő' },
];

const PROMPTS = ['Ipari terület Szeged környékén', 'Építési telek 1000 m² fölött, közművel', 'Üzlethelyiség belvárosban'];

// The mock "finds" the examples only for queries they plausibly answer, so the empty state shows too.
const MATCH = /szeged|csongr|ipar|telek|ha\b|hektár|közm/i;

type Phase = 'idle' | 'loading' | 'results' | 'empty';
type FormState = 'editing' | 'sending' | 'sent';

export default function PropertySearchPreview() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [chosen, setChosen] = useState<Example | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const search = (q: string) => {
    if (q.trim().length < 3 || phase === 'loading') return;
    setQuery(q);
    setPhase('loading');
    window.setTimeout(() => setPhase(MATCH.test(q) ? 'results' : 'empty'), 1400);
  };

  const openForm = (example: Example | null) => {
    setChosen(example);
    dialogRef.current?.showModal();
  };

  return (
    <section id="kereso" aria-labelledby="kereso-cim" className="relative px-6 py-20 sm:py-24 bg-slate-950 border-b border-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <p className="mx-auto mb-6 flex w-fit max-w-full items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Előnézet: a keresés mintaadatokkal fut, az űrlap nem küld és nem tárol adatot.</span>
        </p>

        <div className="text-center mb-8">
          <h2 id="kereso-cim" className="text-3xl sm:text-4xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Mondja el, mit keres. Mi megkeressük.
          </h2>
          <p className="text-slate-400 leading-relaxed font-light [text-wrap:balance]">
            Telket, ipari területet, ingatlant keres? Írja le saját szavaival, mi végigkutatjuk.
          </p>
        </div>

        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); search(query); }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <label htmlFor="kereso-mezo" className="sr-only">Mit keres?</label>
          <input
            id="kereso-mezo"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="pl. szegedi iparterületet keresek, 1,5 ha, közműves"
            minLength={3}
            className="min-w-0 flex-1 bg-slate-900/60 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/50 rounded-xl px-5 py-4 text-base sm:text-sm text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={phase === 'loading' || query.trim().length < 3}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            {phase === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Search className="w-5 h-5" aria-hidden="true" />}
            Keresés indítása
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => search(p)}
              className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              {p}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Az összegzést mesterséges intelligencia készíti, a találatok ellenőrzés alatt állnak.
        </p>

        <div aria-live="polite" className="mt-10">
          {phase === 'loading' && (
            <div className="mx-auto max-w-xl text-center text-sm text-slate-400">
              <p>Kutatunk a nyilvános forrásokban... ez akár egy percig is tarthat.</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-sky-400" />
              </div>
            </div>
          )}

          {phase === 'results' && (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {EXAMPLES.map((ex, i) => (
                <li key={i} className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <span className="mb-3 w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                    Példa, nem valós hirdetés
                  </span>
                  <h3 className="text-base font-bold text-white">{ex.category}</h3>
                  <dl className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex gap-2"><dt className="sr-only">Település</dt><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" /><dd>{ex.place}</dd></div>
                    <div className="flex gap-2"><dt className="sr-only">Terület</dt><Ruler className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" /><dd>{ex.area}</dd></div>
                    <div className="flex gap-2"><dt className="sr-only">Közmű</dt><Plug className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" /><dd>{ex.utilities}</dd></div>
                    <div className="flex gap-2"><dt className="sr-only">Ársáv</dt><Tag className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" /><dd>Ár: {ex.price}</dd></div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => openForm(ex)}
                    className="mt-5 w-full rounded-xl border border-blue-500/30 bg-blue-500/10 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                  >
                    Érdekel, kérek további információt
                  </button>
                </li>
              ))}
            </ul>
          )}

          {phase === 'empty' && (
            <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-8 text-center text-sm leading-relaxed text-slate-300">
              <p>Most nem találtunk pontosan megfelelőt. Ha megadja az elérhetőségét, a csapatunk kézzel is utánanéz.</p>
              <button
                type="button"
                onClick={() => openForm(null)}
                className="mt-5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-400 px-5 py-2.5 font-bold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                Kérek kézi keresést
              </button>
            </div>
          )}
        </div>
      </div>

      <InterestDialog dialogRef={dialogRef} query={query} chosen={chosen} />
    </section>
  );
}

function InterestDialog({
  dialogRef,
  query,
  chosen,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  query: string;
  chosen: Example | null;
}) {
  const [state, setState] = useState<FormState>('editing');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverNote, setServerNote] = useState<string | null>(null);
  const startedAt = useRef(0);

  // A fresh form every time the dialog opens; the clock starts for the "too fast" spam check.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onOpen = () => { setState('editing'); setErrors({}); setServerNote(null); startedAt.current = Date.now(); };
    const observer = new MutationObserver(() => { if (d.open) onOpen(); });
    observer.observe(d, { attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, [dialogRef]);

  const close = () => dialogRef.current?.close();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name') ?? ''),
      email: String(f.get('email') ?? ''),
      phone: String(f.get('phone') ?? ''),
      consent: f.get('consent') === 'on',
      marketing: f.get('marketing') === 'on',
      website: String(f.get('website') ?? ''),
      query,
      startedAt: startedAt.current,
    };
    const found = validateInterest(body);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`);
      first?.focus();
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/property-search/interest-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { form: 'Nem sikerült elküldeni. Próbálja újra.' });
        setState('editing');
        return;
      }
      setServerNote(data.note ?? null);
      setState('sent');
    } catch {
      setErrors({ form: 'Nem sikerült elküldeni. Próbálja újra.' });
      setState('editing');
    }
  };

  const field = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  const err = (k: string) => errors[k] && <p id={`${k}-hiba`} className="mt-1 text-xs text-red-300">{errors[k]}</p>;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="erdekel-cim"
      className="m-auto w-[min(100%-2rem,28rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 id="erdekel-cim" className="text-lg font-bold text-white">
            {state === 'sent' ? 'Köszönjük!' : chosen ? 'Érdekel, kérek további információt' : 'Kérek kézi keresést'}
          </h3>
          <button type="button" onClick={close} aria-label="Bezárás" className="rounded-lg p-1 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {state === 'sent' ? (
          <div className="mt-4 text-sm leading-relaxed text-slate-300">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>Átvettük a keresését. Munkatársunk hamarosan jelentkezik.</span>
            </p>
            {serverNote && <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{serverNote}</p>}
            <button type="button" onClick={close} className="mt-6 w-full rounded-xl border border-slate-700 py-2.5 font-semibold text-slate-200 hover:bg-slate-800">
              Bezárás
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            {(chosen || query) && (
              <p className="rounded-lg bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                {chosen ? `${chosen.category}, ${chosen.place}, ${chosen.area}` : `Keresés: „${query}”`}
              </p>
            )}
            <div>
              <label htmlFor="erdekel-nev" className="mb-1 block text-sm font-medium text-slate-200">Név</label>
              <input id="erdekel-nev" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-hiba' : undefined} className={field} />
              {err('name')}
            </div>
            <div>
              <label htmlFor="erdekel-email" className="mb-1 block text-sm font-medium text-slate-200">E-mail</label>
              <input id="erdekel-email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-hiba' : undefined} className={field} />
              {err('email')}
            </div>
            <div>
              <label htmlFor="erdekel-telefon" className="mb-1 block text-sm font-medium text-slate-200">Telefon</label>
              <input id="erdekel-telefon" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+36 30 123 4567" required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-hiba' : undefined} className={field} />
              {err('phone')}
            </div>

            {/* Honeypot: hidden from people and from assistive technology, bots fill it in. */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label htmlFor="erdekel-weboldal">Weboldal</label>
              <input id="erdekel-weboldal" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                <input name="consent" type="checkbox" required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-hiba' : undefined} className="mt-1 h-4 w-4 shrink-0 accent-sky-400" />
                <span>
                  Elolvastam az{' '}
                  <Link href="/adatkezeles" target="_blank" className="text-sky-300 underline underline-offset-2 hover:text-sky-200">
                    adatkezelési tájékoztatót
                  </Link>
                  , és hozzájárulok, hogy a HomolaMentor a megadott adatokkal felvegye velem a kapcsolatot ebben az ügyben.
                </span>
              </label>
              {err('consent')}
            </div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-400">
              <input name="marketing" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-sky-400" />
              <span>Szeretnék hírt kapni új ajánlatokról. (nem kötelező)</span>
            </label>

            {errors.form && <p role="alert" className="text-sm text-red-300">{errors.form}</p>}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-400 py-3 font-bold text-slate-950 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Elküldöm
            </button>
            <p className="text-center text-[11px] text-slate-500">Előnézet: a gomb nem küld el semmit.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
