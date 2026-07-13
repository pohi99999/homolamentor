import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import RealEstateHero from '@/components/RealEstateHero';
import PropertyTeaserGrid from '@/components/PropertyTeaserGrid';
import VIPAccessGateway from '@/components/VIPAccessGateway';
import PropertyRequestForm from '@/components/PropertyRequestForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    hu: 'Ingatlan & Iparterület Portál | HOMLAMENTOR KFT',
    en: 'Real Estate & Industrial Portal | HOMLAMENTOR KFT',
    de: 'Immobilien- & Industrieportal | HOMLAMENTOR KFT',
  };

  const descriptions: Record<string, string> = {
    hu: 'Zártkörű hozzáférés prémium logisztikai parkokhoz, ipari csarnokokhoz, off-market területekhez Magyarország és Ausztria határán.',
    en: 'Exclusive off-market access to premium logistics parks, factories, and development plots near the Hungarian-Austrian border.',
    de: 'Exklusiver Off-Market-Zugang zu Premium-Logistikparks, Produktionshallen und Entwicklungsflächen an der ungarisch-österreichischen Grenze.',
  };

  const keywordsList: Record<string, string[]> = {
    hu: ['ipari ingatlan', 'logisztikai csarnok', 'off-market ingatlanok', 'Sopron', 'Győr', 'Mosonmagyaróvár', 'VIP ingatlanok', 'HOMLAMENTOR'],
    en: ['industrial real estate', 'logistics hall', 'off-market property', 'Sopron', 'Gyor', 'Mosonmagyarovar', 'VIP gateway', 'HOMLAMENTOR'],
    de: ['industrieimmobilien', 'logistikhalle', 'off-market immobilien', 'Sopron', 'Gyor', 'Mosonmagyarovar', 'VIP zugang', 'HOMLAMENTOR'],
  };

  return {
    title: titles[locale] || titles.hu,
    description: descriptions[locale] || descriptions.hu,
    keywords: keywordsList[locale] || keywordsList.hu,
  };
}

export default function RealEstatePortalPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Fő Navigációs Sáv */}
      <Navbar />

      {/* Ingatlan Hero Fejléc */}
      <RealEstateHero />

      {/* Kiemelt Ajánlatok Grid (Teaser) */}
      <PropertyTeaserGrid />

      {/* VIP Beléptető Kapu & Zártkörű Ingatlanok */}
      <VIPAccessGateway />

      {/* Egyedi Keresési Igények Leadása */}
      <PropertyRequestForm />

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
