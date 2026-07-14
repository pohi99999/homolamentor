import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { useTranslations } from 'next-intl';
import { Home as HomeIcon, Award, Shield, CheckCircle, ArrowRight, Zap, Truck, DollarSign } from 'lucide-react';
import MobileHomeContactForm from '@/components/MobileHomeContactForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Moduláris Mobilház Projekt | HOMLAMENTOR KFT',
    en: 'Modular Mobile Home Project | HOMLAMENTOR KFT',
    de: 'Modulares Mobilheim-Projekt | HOMLAMENTOR KFT',
  };

  const descriptions: Record<string, string> = {
    hu: 'HOMLAMENTOR KFT - Konténerben szállítható, önellátó napelemes rendszerrel felszerelt prémium mobilházak európai exportra és afrikai összeszerelésre.',
    en: 'HOMLAMENTOR KFT - Premium container-transportable modular living spaces with self-sustaining solar systems for European export and African assembly.',
    de: 'HOMLAMENTOR KFT - Transportable, autarke modulare Wohnräume mit Solarsystemen für den europäischen Export und die afrikanische Montage.',
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
  };
}

export default function MobileHomeProjectPage() {
  const t = useTranslations('MobileHome');

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Fő Navigációs Sáv */}
      <Navbar />

      {/* Fő Tartalom */}
      <main className="flex-grow">
        {/* Hero Szekció */}
        <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6 overflow-hidden">
        {/* Háttér fényeffektusok */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-inner animate-pulse">
            <Award className="w-3.5 h-3.5" />
            {t('badge')}
          </div>

          {/* Cím */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-8 max-w-4xl mx-auto leading-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>

          {/* Alcím */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <a
              href="#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-base shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              {t('ctaPrimary')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#concept"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-900 hover:border-slate-700 font-semibold text-base transition-all shadow-xl shadow-black/50 hover:shadow-black/70 cursor-pointer"
            >
              {t('ctaSecondary')}
            </a>
          </div>

          {/* Három oszlopos előnyök grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-800 transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{t('feature1Title')}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{t('feature1Desc')}</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-800 transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 border border-teal-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{t('feature2Title')}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{t('feature2Desc')}</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-800 transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{t('feature3Title')}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{t('feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Efficiency Block (Modular Logistics Advantage) */}
      <section className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/60 relative">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">B2B Hatékonyság & Technológia</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 mb-4">A Moduláris Logisztikai Előny (Modular Logistics Advantage)</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Az európai exportpiacokra és afrikai növekedési régiókra szabott logisztikai és összeszerelési modellünk kiemelkedő pénzügyi hatékonyságot biztosít partnereink számára.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">50% Munkaköltség Megtakarítás</h3>
                <span className="text-emerald-400/80 text-xs font-semibold uppercase tracking-wider block mb-4">Factory Labor Cost Savings</span>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A moduláris panelek gyári előszerelésével és a célországokban (pl. Abidjan, Lusaka hubok) történő helyszíni összeszereléssel az élőerő-költség felére csökken a hagyományos építési módokhoz képest.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 border border-teal-500/20">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Konténeres Modularitás</h3>
                <span className="text-teal-400/80 text-xs font-semibold uppercase tracking-wider block mb-4">Containerized Modularity</span>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Minden szerkezeti elem, falpanel és hibrid napelemes részegség úgy lett tervezve, hogy milliméterre pontosan illeszkedjen a szabványos tengeri konténerekbe, minimalizálva a tengerentúli szállítási költségeket.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">100% Profit Realizáció</h3>
                <span className="text-emerald-400/80 text-xs font-semibold uppercase tracking-wider block mb-4">Profit Realization Model</span>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A helyszíni, lapraszerelt (flat-packed) technológiára épülő összeszerelési franchise struktúra lehetővé teszi a fejlesztők számára a szállítási térfogat megtakarításából adódó teljes profit realizálását a lokális piacokon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Részletes termék és méret specifikáció szekció */}

      <section id="concept" className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Elérhető Méretvariációk & Konstrukciók</h2>
            <p className="text-slate-450 text-slate-400 max-w-2xl mx-auto">
              Minden mobilházunk gyárilag előszerelt, lapraszerelten konténerbe csomagolható, és a helyszínen rendkívül gyorsan összeszerelhető.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 30 m² kártya */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950 border border-slate-900 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Kompakt Minimál</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">30 m² Modul</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Ideális egyszemélyes stúdióknak, senior lakóegységeknek vagy irodai moduloknak. Rendkívül gyors telepítés, minimális alapterületi igény mellett.
                </p>
              </div>
              <ul className="space-y-3 border-t border-slate-900 pt-6 text-sm text-slate-300">
                <li className="flex items-center gap-2">✓ 1-2 lakó számára</li>
                <li className="flex items-center gap-2">✓ Beépített konyha & fürdő</li>
                <li className="flex items-center gap-2">✓ Napelemes előkészítés</li>
              </ul>
            </div>

            {/* 50 m² kártya */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg shadow-emerald-500/5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-full uppercase tracking-wider">
                Legnépszerűbb
              </div>
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider mt-2 block">Családi Kialakítás</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">50 m² Tagolt</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Többszobás, optimalizált térelosztású lakóegység. Kiválóan alkalmas állandó lakhatásra vagy üdülőházaknak.
                </p>
              </div>
              <ul className="space-y-3 border-t border-slate-900 pt-6 text-sm text-slate-300">
                <li className="flex items-center gap-2">✓ 2-4 lakó részére</li>
                <li className="flex items-center gap-2">✓ Külön hálószobák</li>
                <li className="flex items-center gap-2">✓ 5.5 kW hibrid napelemes rendszer</li>
              </ul>
            </div>

            {/* 80-100 m² kártya */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950 border border-slate-900 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Prémium Kivitel</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">80 - 100 m²</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Nagyobb alapterületű, luxus igényeket is kielégítő moduláris családi ház. Exkluzív belsőépítészeti megoldásokkal és teljes önellátással.
                </p>
              </div>
              <ul className="space-y-3 border-t border-slate-900 pt-6 text-sm text-slate-300">
                <li className="flex items-center gap-2">✓ Teljes értékű családi otthon</li>
                <li className="flex items-center gap-2">✓ Kiterjedt terasz kapcsolat</li>
                <li className="flex items-center gap-2">✓ 10 kW napelemes akkumulátor park</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stratégiai és Gazdasági Előnyök a Gyártó Partnerek Számára */}
      <section className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/60 relative">
        {/* Háttér fénydekoráció */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-2">B2B Financial Advantages</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-wide mb-4 [text-wrap:balance] bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
              {t('b2bTitle')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              {t('b2bSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kártya 1 */}
            <div 
              className="p-8 rounded-3xl shadow-xl shadow-black/50 hover:shadow-black/70 transition-all duration-300 flex flex-col justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-4">Logistics Profit Layout</span>
                <h3 className="text-xl font-bold text-white mb-4 tracking-wide">{t('b2bCard1Title')}</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">{t('b2bCard1Desc')}</p>
              </div>
            </div>

            {/* Kártya 2 */}
            <div 
              className="p-8 rounded-3xl shadow-xl shadow-black/50 hover:shadow-black/70 transition-all duration-300 flex flex-col justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-4">Labor Cost Optimization</span>
                <h3 className="text-xl font-bold text-white mb-4 tracking-wide">{t('b2bCard2Title')}</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">{t('b2bCard2Desc')}</p>
              </div>
            </div>

            {/* Kártya 3 */}
            <div 
              className="p-8 rounded-3xl shadow-xl shadow-black/50 hover:shadow-black/70 transition-all duration-300 flex flex-col justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-4">Government Subsidies</span>
                <h3 className="text-xl font-bold text-white mb-4 tracking-wide">{t('b2bCard3Title')}</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">{t('b2bCard3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Globális & Afrikai Piacnyitási előnyök */}
      <section className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider block mb-3">Stratégiai Előnyök</span>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">Afrikai Terjeszkedés & Regionális Hubok</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                A HOMLAMENTOR KFT két kiemelt növekedési központot határozott meg az afrikai kontinensen a helyszíni összeszerelés és értékesítés támogatására:
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mt-1">1</div>
                  <div>
                    <h4 className="font-bold text-slate-100">Abidjan (Elefántcsontpart)</h4>
                    <p className="text-slate-400 text-sm">Főleg francia nyelvterületű, a nyugat-afrikai ECOWAS régió gazdasági motorja.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mt-1">2</div>
                  <div>
                    <h4 className="font-bold text-slate-100">Lusaka (Zambia)</h4>
                    <p className="text-slate-400 text-sm">Angol nyelvterületű déli kapu, kiváló logisztikai eléréssel Namíbia, Angola és Mozambik felé.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-900 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl" />
              <h3 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">Piacralépési Hatékonyság</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-3xl text-white mb-2">50%</h4>
                  <p className="text-slate-400 text-sm">Munkaköltség megtakarítás a helyi munkaerő szakképzése és bevonása által.</p>
                </div>
                <div className="h-px bg-slate-900" />
                <div>
                  <h4 className="font-extrabold text-3xl text-white mb-2">100%</h4>
                  <p className="text-slate-400 text-sm">Transzport profitnövekedés a lapraszerelt, konténeres tengeri logisztikai szállításnak köszönhetően.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kapcsolati űrlap szekció */}
      <section id="contact" className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/60">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">B2B Konzultáció & Ajánlatkérés</h2>
          <p className="text-slate-400 mb-8">
            Adja meg projektje adatait, és kérjen egyedi B2B ajánlatot moduláris mobilház portfóliónkra.
          </p>
          <MobileHomeContactForm />
        </div>
      </section>


      </main>

      {/* Lábléc */}
      <footer className="border-t border-slate-900/60 py-12 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-400">
          <div>
            © {new Date().getFullYear()} HOMLAMENTOR KFT. Minden jog fenntartva.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Adatkezelés</a>
            <a href="#" className="hover:text-slate-300 transition-colors">ÁSZF</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Kapcsolat</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
