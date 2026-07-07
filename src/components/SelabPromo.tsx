'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Sparkles, Download } from 'lucide-react';
import { Link } from '@/i18n/routing';

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
            
            {/* Bal oszlop: Vizuális PDF előnézet és letöltő kártya */}
            <div className="lg:col-span-5 flex flex-col items-center gap-4">
              <div className="w-full relative group">
                <div className="absolute inset-0 rounded-3xl bg-amber-500/5 blur-xl scale-105 group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                <div className="relative w-full h-[320px] bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
                  {/* PDF mock iframe vagy stilizált megjelenítő */}
                  <div className="w-full h-[220px] rounded-2xl overflow-hidden border border-slate-900 bg-slate-900/40 relative">
                    <iframe
                      src="/Plaquette_commerciale_livestock_show_4e_edition_v43.pdf#toolbar=0&navpanes=0&scrollbar=0"
                      className="w-full h-full object-cover select-none pointer-events-none opacity-80"
                      title="SELAB PDF Preview"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                        PDF
                      </div>
                      <span className="text-[10px] text-slate-350 font-medium tracking-wide">
                        SELAB Brochure 2026
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 px-2">
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-100">SELAB Livestock Show</p>
                      <span className="text-[9px] text-slate-500">Official Brochure • 4th Edition</span>
                    </div>
                    <a
                      href="/Plaquette_commerciale_livestock_show_4e_edition_v43.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('downloadPdf')}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Jobb oszlop: Tartalom */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <div className="inline-flex self-start items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1 text-xs font-bold text-amber-400 tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                {t('badge')}
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100 bg-gradient-to-r from-white via-amber-50 to-amber-200 bg-clip-text text-transparent">
                {t('title')}
              </h2>

              <p className="text-slate-450 leading-relaxed font-light text-base md:text-lg">
                {t('subtitle')}
              </p>

              <div className="flex flex-col gap-1.5 border-l border-amber-500/30 pl-4 py-1 text-xs text-amber-400/80 font-medium">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('partnerNotice')}</span>
                </div>
              </div>

              <Link
                href="/kapcsolat"
                className="inline-flex self-start items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {t('cta')}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
