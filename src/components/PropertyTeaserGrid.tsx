'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Lock, MapPin, DollarSign, EyeOff, Building2, CheckCircle2, Filter } from 'lucide-react';
import { properties } from '@/data/properties';

export default function PropertyTeaserGrid() {
  const t = useTranslations('PropertyTeaserGrid');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Egyedi szektorok kigyűjtése
  const categories = ['ALL', ...Array.from(new Set(properties.map((p) => p.category)))];

  const filteredProperties =
    selectedCategory === 'ALL'
      ? properties
      : properties.filter((p) => p.category === selectedCategory);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15,
        delay: (custom % 3) * 0.1
      }
    })
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950/40 border-b border-slate-900/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Fejléc */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            Off-Market Portfólió
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light text-base sm:text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* Szektor Szűrő Gombok */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Szűrés szektor szerint:
          </span>
          {categories.map((cat) => {
            const isAll = cat === 'ALL';
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 font-bold scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {isAll ? t('allSectors') : cat}
              </button>
            );
          })}
        </div>

        {/* Grid rács - 9 valós ingatlan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((item, idx) => {
            // Próbáljuk meg kiolvasni a lefordított elemeket, ha léteznek az i18n JSON-ben
            let title = item.title;
            let location = item.location;
            let price = item.price;
            const currency = item.currency;
            let category = item.category;
            let description = item.description;
            let features = item.features;

            try {
              const itemT = t.raw(`items.${item.translationKey}`) as {
                title?: string;
                location?: string;
                price?: string;
                category?: string;
                features?: string[];
                description?: string;
              };
              if (itemT) {
                if (itemT.title) title = itemT.title;
                if (itemT.location) location = itemT.location;
                if (itemT.price) price = itemT.price;
                if (itemT.category) category = itemT.category;
                if (itemT.features) features = itemT.features;
                if (itemT.description) description = itemT.description;
              }
            } catch {
              // Ha nincs i18n fordítás, a fallback az adatformátum marad
            }

            const formattedPrice =
              typeof price === 'number'
                ? `${price.toLocaleString()} ${currency}`
                : `${price} ${currency}`.trim();

            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={idx}
                className="group relative bg-slate-900/40 border border-slate-800 hover:border-sky-500/30 rounded-2xl p-6 hover:bg-slate-900/70 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_40px_rgba(14,165,233,0.1)] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Kép / Banner Helyőrző diszkrét Off-Market felirattal */}
                  <div className="relative w-full h-44 rounded-xl bg-slate-950 border border-slate-800/80 mb-5 overflow-hidden flex flex-col items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/30 via-slate-950 to-slate-900 opacity-90" />
                    <EyeOff className="w-9 h-9 text-slate-600 group-hover:scale-110 group-hover:text-sky-400 transition-all duration-300 relative z-10 mb-2" />
                    <span className="relative z-10 text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-900/80 border border-slate-700/50 px-2.5 py-1 rounded-full">
                      Diszkrét Off-Market
                    </span>
                    <span className="absolute top-3 right-3 text-[10px] font-extrabold tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                      #{item.id}
                    </span>
                  </div>

                  {/* Kategória Jelvény */}
                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-md inline-block">
                      {category}
                    </span>
                  </div>

                  {/* Cím */}
                  <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-sky-300 transition-colors leading-snug">
                    {title}
                  </h3>

                  {/* Leírás */}
                  <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed line-clamp-3">
                    {description}
                  </p>

                  {/* Kiemelt Jellemzők (Features List) */}
                  <div className="space-y-1.5 mb-6">
                    {features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span className="font-light">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Elhomályosított / Védett adatok sávja */}
                <div className="border-t border-slate-800/80 pt-4 mt-auto space-y-2.5">
                  
                  {/* Lokáció */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400 font-light">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Lokáció:
                    </span>
                    <span className="filter blur-[5px] group-hover:blur-[3px] select-none text-slate-300 font-medium transition-all">
                      {location}
                    </span>
                  </div>

                  {/* Ár */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400 font-light">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                      Irányár / Érték:
                    </span>
                    <span className="filter blur-[6px] group-hover:blur-[3px] select-none text-sky-300 font-bold transition-all">
                      {formattedPrice}
                    </span>
                  </div>

                  {/* VIP Felirat / Zárt Ajánlat Értesítés */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 mt-2 justify-center group-hover:border-sky-500/40 transition-colors">
                    <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                      {t('blurNotice')}
                    </span>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
