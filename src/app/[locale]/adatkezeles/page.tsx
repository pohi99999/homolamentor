import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Adatkezelési Tájékoztató | HOMLAMENTOR KFT',
    en: 'Privacy Policy | HOMLAMENTOR KFT',
    de: 'Datenschutzerklärung | HOMLAMENTOR KFT',
    fr: 'Politique de Confidentialité | HOMLAMENTOR KFT',
  };

  return {
    title: titles[locale] || titles.hu,
    description: 'HOMLAMENTOR KFT adatkezelési tájékoztatója a weboldalon keresztül megadott személyes adatok kezeléséről.',
    robots: { index: false, follow: true },
  };
}

export default function AdatkezelesPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Jogi tájékoztató</span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">Adatkezelési Tájékoztató</h1>
            <p className="text-slate-400 text-sm">Hatályos: 2026. augusztus 9-től. Utolsó frissítés: 2026-08-09.</p>
          </div>

          <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-6 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. Adatkezelő</h2>
              <p>
                Az adatkezelő megnevezése: <strong>HOMLAMENTOR KFT</strong> (a továbbiakban: „Társaság&rdquo;
                vagy „Adatkezelő&rdquo;). Kapcsolattartási e-mail cím: {' '}
                <a href="mailto:office.homlamentor@gmail.com" className="text-emerald-400 hover:underline">office.homlamentor@gmail.com</a>.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                A Társaság cégjegyzékszámát, adószámát és székhelyét az Adatkezelő a jelen tájékoztató legközelebbi
                frissítésekor pótolja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. Milyen adatokat kezelünk?</h2>
              <p>A weboldalon elérhető űrlapok (érdeklődés, kapcsolatfelvétel, befektetői és partneri megkeresés) kitöltésekor az alábbi adatokat gyűjthetjük az érintett önkéntes megadása alapján:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Név / kapcsolattartó neve</li>
                <li>E-mail cím</li>
                <li>Telefonszám (ha megadásra kerül)</li>
                <li>Cégnév, beosztás, iparág</li>
                <li>Az űrlapban megadott egyéb üzenet, projektleírás vagy érdeklődési szempont</li>
              </ul>
              <p className="mt-3">
                Az admin felület Google-fiókkal történő bejelentkezéskor a Google által szolgáltatott alapadatokat
                (név, e-mail cím) kezeljük, kizárólag a Társaság előre engedélyezett munkatársai számára.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. Az adatkezelés célja és jogalapja</h2>
              <p>
                Az adatkezelés célja az érdeklődők, partnerek és befektetők megkeresésének fogadása, a kapcsolatfelvétel
                lebonyolítása és az üzleti kapcsolat kialakítása. Jogalapja az érintett önkéntes hozzájárulása
                (GDPR 6. cikk (1) bekezdés a) pont), amelyet az űrlap kitöltésével és elküldésével ad meg.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. Kik férnek hozzá az adatokhoz?</h2>
              <p>Az űrlapokon keresztül beérkező adatokat az alábbi, a Társaság megbízásából eljáró adatfeldolgozók továbbítják, illetve tárolják:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Resend</strong> — e-mail kézbesítési szolgáltató, a beérkezett megkeresések értesítő e-mailként történő továbbítására.</li>
                <li><strong>Google (Google Sheets, Gmail API)</strong> — a beérkezett érdeklődők nyilvántartására (CRM) és a levelezéstörténet megjelenítésére az admin felületen.</li>
                <li><strong>n8n</strong> automatizációs platform — a megkeresések belső feldolgozási folyamatba történő továbbítására.</li>
              </ul>
              <p className="mt-3">Az adatokat harmadik fél részére, a fentieken túl, reklám vagy egyéb célú értékesítésre nem adjuk át.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">5. Adatmegőrzési idő</h2>
              <p>
                A megadott adatokat az üzleti kapcsolat fennállásáig, illetve az érintett törlési kérelméig, de
                legfeljebb a kapcsolatfelvételtől számított 5 évig kezeljük, kivéve, ha jogszabály ennél hosszabb
                megőrzési kötelezettséget ír elő.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">6. Az érintett jogai</h2>
              <p>Az érintett a GDPR alapján jogosult:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>tájékoztatást kérni a kezelt adatairól,</li>
                <li>kérni azok helyesbítését,</li>
                <li>kérni azok törlését vagy kezelésének korlátozását,</li>
                <li>tiltakozni az adatkezelés ellen,</li>
                <li>hozzájárulását bármikor, indoklás nélkül visszavonni.</li>
              </ul>
              <p className="mt-3">
                A jogok gyakorlásához kérjük, vegye fel velünk a kapcsolatot a{' '}
                <a href="mailto:office.homlamentor@gmail.com" className="text-emerald-400 hover:underline">office.homlamentor@gmail.com</a> címen.
                Az érintett jogorvoslatért a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) is fordulhat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">7. Sütik (cookie-k)</h2>
              <p>
                A weboldal a nyelvi beállítás megjegyzéséhez, valamint az admin felület bejelentkezett munkamenetének
                fenntartásához technikailag szükséges sütiket használ. Ezek marketing vagy nyomkövetési célt nem szolgálnak.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-900/60">
            <Link href="/" className="text-sm text-emerald-400 hover:underline">&larr; Vissza a főoldalra</Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900/60 py-12 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-400">
          <div>
            © {new Date().getFullYear()} HOMLAMENTOR KFT. Minden jog fenntartva.
          </div>
          <div className="flex gap-6">
            <Link href="/adatkezeles" className="hover:text-slate-300 transition-colors">Adatkezelés</Link>
            <Link href="/aszf" className="hover:text-slate-300 transition-colors">ÁSZF</Link>
            <Link href="/kapcsolat" className="hover:text-slate-300 transition-colors">Kapcsolat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
