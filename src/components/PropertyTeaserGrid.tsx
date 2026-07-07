'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Lock, MapPin, DollarSign, EyeOff } from 'lucide-react';

export default function PropertyTeaserGrid() {
  const t = useTranslations('PropertyTeaserGrid');

  const teasers = [
    {
      title: t('card1Title'),
      spec: t('card1Spec'),
      price: '€ 1,250,000',
      location: 'Győr industrial zone'
    },
    {
      title: t('card2Title'),
      spec: t('card2Spec'),
      price: '€ 2,900,000',
      location: 'Mosonmagyaróvár highway area'
    },
    {
      title: t('card3Title'),
      spec: t('card3Spec'),
      price: '€ 850,000',
      location: 'Sopron border bypass'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15,
        delay: custom * 0.1
      }
    })
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950/20 border-b border-slate-900/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Fejléc */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">
            {t('subtitle')}
          </p>
        </div>

        {/* Grid rács */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teasers.map((item, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={idx}
              className="group relative bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-6 hover:bg-slate-900/50 transition-all duration-300 shadow-xl shadow-slate-950/30 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Kép helyőrző */}
                <div className="relative w-full h-48 rounded-xl bg-slate-950 border border-slate-850 mb-6 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/20 to-slate-950" />
                  <EyeOff className="w-10 h-10 text-slate-700 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Zárt Ajánlat
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-sky-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 font-light mb-6">
                  {item.spec}
                </p>
              </div>

              {/* Elhomályosított adatok */}
              <div className="border-t border-slate-850/80 pt-4 mt-4 space-y-3">
                
                {/* Lokáció */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-light">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Lokáció:
                  </span>
                  <span className="filter blur-[5px] select-none text-slate-300 font-medium">
                    {item.location}
                  </span>
                </div>

                {/* Ár */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-light">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    Irányár:
                  </span>
                  <span className="filter blur-[5px] select-none text-slate-350 font-bold">
                    {item.price}
                  </span>
                </div>

                {/* VIP Felirat */}
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850/50 rounded-lg p-2.5 mt-2 justify-center">
                  <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                    {t('blurNotice')}
                  </span>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
