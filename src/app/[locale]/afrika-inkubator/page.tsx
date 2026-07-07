import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AfricaHero from '@/components/AfricaHero';
import ThreeStepProcess from '@/components/ThreeStepProcess';
import SelabPromo from '@/components/SelabPromo';
import LeadCaptureForm from '@/components/LeadCaptureForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Afrika-Inkubátor Program | HomolaMentor KFT',
    en: 'Africa-Incubator Program | HomolaMentor KFT',
    de: 'Afrika-Inkubator Programm | HomolaMentor KFT',
  };

  const descriptions: Record<string, string> = {
    hu: 'Piacra lépési és mentorálási program Nyugat-Afrikában magyar és európai cégek számára. SELAB Livestock Show szakvásár és üzletfejlesztés.',
    en: 'Market entry and mentoring program in West Africa for European SMEs. SELAB Livestock Show exhibition and business expansion.',
    de: 'Markteintritts- und Mentoringprogramm in Westafrika für europäische KMUs. SELAB Livestock Show Messe und Geschäftsexpansion.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['Afrika-Inkubátor', 'SELAB Livestock Show', 'Nyugat-Afrika', 'piacra lépés', 'HomolaMentor', 'mentoring', 'export'],
    en: ['Africa-Incubator', 'SELAB Livestock Show', 'West Africa', 'market entry', 'HomolaMentor', 'mentorship', 'business travel'],
    de: ['Afrika-Inkubator', 'SELAB Livestock Show', 'Westafrika', 'Markteintritt', 'HomolaMentor', 'Mentoring', 'Geschäftsreise'],
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

      {/* Afrika Hero Fejléc */}
      <AfricaHero />

      {/* 3 Lépéses Inkubációs Modell */}
      <ThreeStepProcess />

      {/* SELAB Livestock Show Promóció */}
      <SelabPromo />

      {/* Kapcsolati Konzultációs Űrlap */}
      <LeadCaptureForm />

      {/* Lábléc */}
      <footer className="border-t border-slate-900/60 py-12 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div>
            © {new Date().getFullYear()} HomolaMentor KFT. Minden jog fenntartva.
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
