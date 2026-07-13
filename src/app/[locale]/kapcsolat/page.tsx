import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ContactHero from '@/components/ContactHero';
import ContactInfoCards from '@/components/ContactInfoCards';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Kapcsolat | HOMLAMENTOR KFT - Prémium Üzletfejlesztés',
    en: 'Contact | HOMLAMENTOR KFT - Premium Business Advisory',
    de: 'Kontakt | HOMLAMENTOR KFT - Premium Business Advisory',
  };

  const descriptions: Record<string, string> = {
    hu: 'Vegye fel a kapcsolatot a HOMLAMENTOR KFT vezetőségével és fejlesztői csapatával. Globális üzletfejlesztés és prémium ingatlanok.',
    en: 'Get in touch with the management and development team of HOMLAMENTOR KFT. Global business development and premium real estate.',
    de: 'Kontaktieren Sie das Management und Entwicklungsteam von HOMLAMENTOR KFT. Globale Geschäftsentwicklung und Premium-Immobilien.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['kapcsolat', 'HOMLAMENTOR', 'Homola László', 'Pohánka József Péter', 'üzletfejlesztés', 'ipari ingatlanok'],
    en: ['contact', 'HOMLAMENTOR', 'Laszlo Homola', 'Peter Pohanka', 'business expansion', 'industrial real estate'],
    de: ['kontakt', 'HOMLAMENTOR', 'Laszlo Homola', 'Peter Pohanka', 'geschäftsexpansion', 'industrieimmobilien'],
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
    keywords: keywordsList[locale] || keywordsList.hu,
  };
}

export default function KapcsolatPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Navigáció */}
      <Navbar />

      {/* Fő tartalom */}
      <main className="flex-1">
        <ContactHero />
        <ContactInfoCards />
      </main>

      {/* Lábléc */}
      <footer className="border-t border-slate-900/60 py-12 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
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
