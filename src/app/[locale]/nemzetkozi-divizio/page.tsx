import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import InternationalDivision from '@/components/InternationalDivision';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Nemzetközi Divízió | HOMLAMENTOR KFT',
    en: 'International Division | HOMLAMENTOR KFT',
    de: 'Internationale Division | HOMLAMENTOR KFT',
  };

  const descriptions: Record<string, string> = {
    hu: 'Nyugat-afrikai infrastruktúra- és projektfinanszírozási kampány Elefántcsontparton (Abidjan). Zöldenergia, távközlés és mezőgazdaság.',
    en: 'West African infrastructure and project finance campaign in Ivory Coast (Abidjan). Green energy, telecom and agriculture investments.',
    de: 'Infrastruktur- und Projektfinanzierungskampagne in Westafrika (Elfenbeinküste, Abidjan). Investitionen in Ökoenergie, Telekom und Agrar.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['Nemzetközi Divízió', 'Projektfinanszírozás', 'Elefántcsontpart', 'Abidjan', 'Zöldenergia', 'Távközlés towerco', 'Magántőkealap', 'Befektetés'],
    en: ['International Division', 'Project Finance', 'Ivory Coast', 'Abidjan', 'Green Energy', 'Telecom towerco', 'Private Equity', 'Investment'],
    de: ['Internationale Division', 'Projektfinanzierung', 'Elfenbeinküste', 'Abidjan', 'Ökoenergie', 'Telekom towerco', 'Private Equity', 'Investition'],
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
    keywords: keywordsList[locale] || keywordsList.hu,
  };
}

export default function InternationalDivisionPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Fő Navigációs Sáv */}
      <Navbar />

      {/* Fő Tartalom */}
      <main className="flex-grow">
        {/* Nemzetközi Divízió Szekció */}
        <InternationalDivision />
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
