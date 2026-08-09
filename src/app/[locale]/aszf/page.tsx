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
    hu: 'Általános Szerződési Feltételek | HOMLAMENTOR KFT',
    en: 'Terms & Conditions | HOMLAMENTOR KFT',
    de: 'Allgemeine Geschäftsbedingungen | HOMLAMENTOR KFT',
    fr: 'Conditions Générales | HOMLAMENTOR KFT',
  };

  return {
    title: titles[locale] || titles.hu,
    description: 'HOMLAMENTOR KFT weboldal használatára vonatkozó Általános Szerződési Feltételei.',
    robots: { index: false, follow: true },
  };
}

export default function AszfPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Jogi tájékoztató</span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">Általános Szerződési Feltételek</h1>
            <p className="text-slate-400 text-sm">Hatályos: 2026. augusztus 9-től. Utolsó frissítés: 2026-08-09.</p>
          </div>

          <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-6 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. Szolgáltató</h2>
              <p>
                A jelen weboldalt (<strong>homolamentor.vercel.app</strong>) a <strong>HOMLAMENTOR KFT</strong>
                (a továbbiakban: „Szolgáltató&rdquo;) üzemelteti. Kapcsolat:{' '}
                <a href="mailto:office.homlamentor@gmail.com" className="text-amber-400 hover:underline">office.homlamentor@gmail.com</a>.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                A Szolgáltató cégjegyzékszámát, adószámát és székhelyét a jelen tájékoztató legközelebbi frissítésekor pótolja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. A weboldal célja és tartalma</h2>
              <p>
                A weboldal a Szolgáltató üzletfejlesztési, nemzetközi piacra lépési (Afrika-Inkubátor), ipari
                ingatlanközvetítési (Ingatlan-Portál), moduláris épület-projekt (Mobilház) és nemzetközi befektetői
                (Nemzetközi Divízió) szolgáltatásait mutatja be, és lehetőséget biztosít érdeklődés, kapcsolatfelvétel
                és partneri megkeresés benyújtására. A weboldal önmagában nem minősül online kereskedelmi platformnak,
                a weboldalon keresztül fizetési tranzakció nem történik.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. Az űrlapok használata</h2>
              <p>
                A weboldalon elérhető érdeklődési és kapcsolatfelvételi űrlapok kitöltése és elküldése nem hoz létre
                automatikusan szerződéses jogviszonyt a felhasználó és a Szolgáltató között — az kizárólag az
                üzleti kapcsolatfelvétel megkönnyítését szolgálja. Az érdemi együttműködés feltételeit a felek
                a megkeresést követő egyeztetés során, külön írásbeli megállapodásban rögzítik.
              </p>
              <p className="mt-3">
                A felhasználó felelősséget vállal az űrlapokon megadott adatok valódiságáért.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. Zárt / jelszóval védett tartalmak</h2>
              <p>
                Az Ingatlan-Portál egyes off-market ajánlatai, valamint az adminisztrációs felület kizárólag
                jogosultsággal rendelkező felhasználók (jelszó, illetve engedélyezett Google-fiók) számára
                érhetők el. A hozzáférési adatok harmadik személynek történő átadása tilos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">5. Szellemi tulajdon</h2>
              <p>
                A weboldalon megjelenő szövegek, grafikai elemek, márkanevek és egyéb tartalmak a Szolgáltató, illetve
                jogos partnerei szellemi tulajdonát képezik. Ezek a Szolgáltató előzetes írásbeli engedélye nélküli
                másolása, terjesztése tilos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">6. Felelősség korlátozása</h2>
              <p>
                A Szolgáltató a weboldalon közzétett információk pontosságára törekszik, azonban nem vállal
                felelősséget az esetleges elírásokért, az adatok teljességéért, illetve a weboldal átmeneti
                elérhetetlenségéből eredő károkért.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">7. Kapcsolódó dokumentum</h2>
              <p>
                A személyes adatok kezelésének részleteiről az{' '}
                <Link href="/adatkezeles" className="text-amber-400 hover:underline">Adatkezelési Tájékoztató</Link>{' '}
                nyújt tájékoztatást.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-900/60">
            <Link href="/" className="text-sm text-amber-400 hover:underline">&larr; Vissza a főoldalra</Link>
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
