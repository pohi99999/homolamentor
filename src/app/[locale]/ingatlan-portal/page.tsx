import Navbar from '@/components/Navbar';
import RealEstateHero from '@/components/RealEstateHero';
import PropertyTeaserGrid from '@/components/PropertyTeaserGrid';
import VIPAccessGateway from '@/components/VIPAccessGateway';
import PropertyRequestForm from '@/components/PropertyRequestForm';

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
