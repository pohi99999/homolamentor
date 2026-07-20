import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import AfricaHero from '@/components/AfricaHero';

const ThreeStepProcess = dynamic(() => import('@/components/ThreeStepProcess'));
const SelabPromo = dynamic(() => import('@/components/SelabPromo'));
const LeadCaptureForm = dynamic(() => import('@/components/LeadCaptureForm'));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Afrika-Inkubátor Program | HOMLAMENTOR KFT',
    en: 'Africa-Incubator Program | HOMLAMENTOR KFT',
    de: 'Afrika-Inkubator Programm | HOMLAMENTOR KFT',
    fr: 'Programme Incubateur Afrique | HOMLAMENTOR KFT',
  };

  const descriptions: Record<string, string> = {
    hu: 'Piacra lépési és mentorálási program Nyugat-Afrikában magyar és európai cégek számára. SELAB Livestock Show szakvásár és üzletfejlesztés.',
    en: 'Market entry and mentoring program in West Africa for European SMEs. SELAB Livestock Show exhibition and business expansion.',
    de: 'Markteintritts- und Mentoringprogramm in Westafrika für europäische KMUs. SELAB Livestock Show Messe und Geschäftsexpansion.',
    fr: 'Programme d\'implantation et de mentorat en Afrique de l\'Ouest pour les PME européennes. Salon professionnel SELAB Livestock Show et expansion commerciale.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['Afrika-Inkubátor', 'SELAB Livestock Show', 'Nyugat-Afrika', 'piacra lépés', 'HOMLAMENTOR', 'mentoring', 'export'],
    en: ['Africa-Incubator', 'SELAB Livestock Show', 'West Africa', 'market entry', 'HOMLAMENTOR', 'mentorship', 'business travel'],
    de: ['Afrika-Inkubator', 'SELAB Livestock Show', 'Westafrika', 'Markteintritt', 'HOMLAMENTOR', 'Mentoring', 'Geschäftsreise'],
    fr: ['Incubateur Afrique', 'SELAB Livestock Show', 'Afrique de l Ouest', 'entrée sur le marché', 'HOMLAMENTOR', 'mentorat', 'exportation'],
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
    keywords: keywordsList[locale] || keywordsList.hu,
  };
}

export default function AfricaIncubatorPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Fő Navigációs Sáv */}
      <Navbar />

      {/* Fő Tartalom */}
      <main className="flex-grow">
        {/* Afrika Hero Fejléc */}
        <AfricaHero />

        {/* 3 Lépéses Inkubációs Modell */}
        <ThreeStepProcess />

        {/* SELAB Livestock Show Promóció */}
        <SelabPromo />

        {/* Kapcsolati Konzultációs Űrlap */}
        <LeadCaptureForm />
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
