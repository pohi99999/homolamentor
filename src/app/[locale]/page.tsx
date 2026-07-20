import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

const ServiceSplit = dynamic(() => import('@/components/ServiceSplit'));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'HOMLAMENTOR KFT | Prémium Üzletfejlesztés & Ingatlan Portál',
    en: 'HOMLAMENTOR KFT | Premium Business Development & Real Estate',
    de: 'HOMLAMENTOR KFT | Premium Business Development & Immobilien',
    fr: 'HOMLAMENTOR KFT | Développement d\'Entreprises & Portail Immobilier',
  };

  const descriptions: Record<string, string> = {
    hu: 'HOMLAMENTOR KFT - Nemzetközi piacra lépés (Afrika-Inkubátor) és exkluzív off-market ipari ingatlanok közvetítése a nyugat-magyarországi és osztrák határ mentén.',
    en: 'HOMLAMENTOR KFT - International business expansion (Africa-Incubator) and premium off-market industrial real estate brokerage near the Austrian border.',
    de: 'HOMLAMENTOR KFT - Internationale Geschäftsexpansion (Afrika-Inkubator) und Vermittlung von Premium-Off-Market-Industrieimmobilien an der österreichischen Grenze.',
    fr: 'HOMLAMENTOR KFT - Expansion internationale (Incubateur Afrique) et courtage immobilier industriel off-market de premier ordre près de la frontière autrichienne.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['HOMLAMENTOR', 'üzletfejlesztés', 'piacra lépés', 'Afrika-Inkubátor', 'ipari ingatlan', 'logisztikai csarnok', 'exkluzív ingatlan', 'off-market'],
    en: ['HOMLAMENTOR', 'business development', 'market entry', 'Africa-Incubator', 'industrial property', 'logistics park', 'exclusive property', 'off-market'],
    de: ['HOMLAMENTOR', 'geschäftsentwicklung', 'markteintritt', 'Afrika-Inkubator', 'industrieimmobilien', 'logistikpark', 'exklusive immobilien', 'off-market'],
    fr: ['HOMLAMENTOR', 'développement d affaires', 'entrée sur le marché', 'Incubateur Afrique', 'immobilier industriel', 'parc logistique', 'off-market'],
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
    keywords: keywordsList[locale] || keywordsList.hu,
  };
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Fő Navigációs Sáv */}
      <Navbar />

      {/* Fő Tartalom */}
      <main className="flex-grow">
        {/* Hero Szekció */}
        <Hero />

        {/* Szolgáltatásválasztó Szekció */}
        <ServiceSplit />
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
