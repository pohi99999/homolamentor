'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sprout, ArrowRight, Sparkles } from 'lucide-react';

export default function SelabPromo() {
  const t = useTranslations('SelabPromo');

  return (
    <section className="relative px-6 py-24 bg-slate-950 overflow-hidden border-b border-slate-900/50">
      {/* Háttér dekorációs fények */}
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/3 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: 'spring', stiffness: 70, damping: 15 }}
          className="relative bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-amber-950/10 border border-slate-850 hover:border-amber-500/25 rounded-3xl p-8 md:p-16 overflow-hidden shadow-2xl transition-all duration-500"
        >
          {/* Absztrakt íves minta díszítés */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none select-none">
            <svg width="400" height="400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 80 Q 52.5 10, 95 80" stroke="url(#gradient)" strokeWidth="0.5" fill="none" />
              <path d="M10 70 Q 52.5 0, 95 70" stroke="url(#gradient)" strokeWidth="0.5" fill="none" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Bal oszlop: Vizuális ikon/kártya */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-3xl bg-amber-500/10 blur-xl scale-110 animate-pulse" />
                <div className="relative w-40 h-40 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-amber-400 shadow-2xl">
                  <Sprout className="w-14 h-14 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">SELAB Show</span>
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-950">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            </div>

            {/* Jobb oszlop: Tartalom */}
            <div className="lg:col-span-8 flex flex-col gap-6 text-left">
              <div className="inline-flex self-start items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1 text-xs font-bold text-amber-400 tracking-wider">
                {t('badge')}
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100 bg-gradient-to-r from-white via-amber-50 to-amber-200 bg-clip-text text-transparent">
                {t('title')}
              </h2>

              <p className="text-slate-400 leading-relaxed font-light text-base md:text-lg">
                {t('subtitle')}
              </p>

              <a
                href="#contact"
                className="inline-flex self-start items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {t('cta')}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
