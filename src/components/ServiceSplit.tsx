'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Globe2, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function ServiceSplit() {
  const t = useTranslations('ServiceSplit');
  const incubatorSteps = [
    'Kétoldalú gazdasági kapcsolatok (HU-AFR)',
    'Helyi cégalapítás és jogi háttér',
    'Piaci validáció és kapcsolatépítés'
  ];
  const portalSteps = [
    'Kiemelt ipari területek és logisztikai parkok',
    'Off-market befektetési lehetőségek',
    'Szigorúan ellenőrzött partneri hálózat'
  ];

  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 70,
        damping: 15,
        delay: custom * 0.15
      }
    })
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950/40 border-t border-slate-900/60 overflow-hidden">
      {/* Háttér dekorációs fény */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full bg-emerald-500/3 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* Afrika Inkubátor Kártya */}
          <motion.div
            id="incubator"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            className="group relative flex flex-col justify-between rounded-3xl p-8 md:p-12 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/5 h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Globe2 className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3 py-1">
                  Mentor Program
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-100 group-hover:text-emerald-400 transition-colors mb-4">
                {t('incubatorTitle')}
              </h2>

              <p className="text-slate-400 leading-relaxed text-base font-light mb-8">
                {t('incubatorDesc')}
              </p>

              {/* Főbb pontok - fix háromoszlopos grid mindkét kártyán azonos belső igazítással */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {incubatorSteps.map((step, index) => (
                  <div
                    key={step}
                    className="grid grid-rows-[auto_1fr] gap-2 rounded-2xl p-4 min-h-[150px] transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-emerald-400">
                        {`0${index + 1}`}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/afrika-inkubator"
              className="mt-4 px-6 py-4 bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 border border-slate-800 hover:border-transparent text-slate-200 font-bold rounded-2xl shadow-lg shadow-black/50 hover:shadow-black/70 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
            >
              {t('incubatorCta')}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Ingatlan Portál Kártya */}
          <motion.div
            id="portal"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={1}
            className="group relative flex flex-col justify-between bg-slate-900/40 border border-slate-850 hover:border-blue-500/20 rounded-3xl p-8 md:p-12 hover:bg-slate-900/60 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.2)] h-full"
          >
            <div>
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-blue-400/80 bg-blue-500/5 border border-blue-500/10 rounded-full px-3 py-1">
                  Private Access
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-100 group-hover:text-blue-400 transition-colors mb-4">
                {t('portalTitle')}
              </h2>

              <p className="text-slate-400 leading-relaxed text-base font-light mb-8">
                {t('portalDesc')}
              </p>

              {/* Főbb pontok - fix háromoszlopos grid mindkét kártyán azonos belső igazítással */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {portalSteps.map((step, index) => (
                  <div
                    key={step}
                    className="grid grid-rows-[auto_1fr] gap-2 rounded-2xl border border-blue-500/20 bg-slate-950/60 p-4 min-h-[150px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-blue-400">
                        {`0${index + 1}`}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/ingatlan-portal"
              className="mt-4 px-6 py-4 bg-slate-950 hover:bg-blue-500 hover:text-slate-950 border border-slate-800 hover:border-transparent text-slate-200 font-bold rounded-2xl shadow-lg shadow-black/50 hover:shadow-black/70 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
            >
              {t('portalCta')}
              <Lock className="w-4 h-4 shrink-0" />
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
