'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, Globe2, Briefcase, ArrowUpRight } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const t = useTranslations('HomePage');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 15
      }
    }
  };


  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden flex flex-col">
      {/* Háttér fények (Glow Effects) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/8 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/8 blur-[130px] pointer-events-none" />

      {/* Navigáció */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/10">
              H
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              HomolaMentor<span className="text-emerald-400 font-medium">KFT</span>
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero szekció */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-20 pb-32 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto flex flex-col items-center gap-8"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-full px-4.5 py-2 text-xs font-bold text-emerald-400 tracking-wider"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            GLOBAL BUSINESS & REAL ESTATE ADVISORY
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.08] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            {t('title')}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-450 leading-relaxed font-light max-w-2xl"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto"
          >
            <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer">
              Zárt Ingatlan Portál
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold rounded-xl hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer">
              Afrika Inkubátor
            </button>
          </motion.div>
        </motion.div>

        {/* Fő pillérek kártyarács */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
        >
          {/* 1. kártya */}
          <motion.div
            variants={itemVariants}
            className="group relative bg-slate-900/30 border border-slate-850 rounded-2xl p-8 hover:border-emerald-500/20 hover:bg-slate-900/50 transition-all duration-300 shadow-xl shadow-slate-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/8 transition-colors pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-emerald-400 transition-colors">Zárt Ingatlan Portál</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Exkluzív hozzáférés kiemelt ipari területekhez, kereskedelmi ingatlanokhoz és prémium befektetési lehetőségekhez. Szigorúan ellenőrzött partneri körnek.
            </p>
          </motion.div>

          {/* 2. kártya */}
          <motion.div
            variants={itemVariants}
            className="group relative bg-slate-900/30 border border-slate-850 rounded-2xl p-8 hover:border-blue-500/20 hover:bg-slate-900/50 transition-all duration-300 shadow-xl shadow-slate-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/8 transition-colors pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors">Afrika Inkubátor</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Üzleti lehetőségek és fejlesztési projektek támogatása az afrikai kontinensen. Tapasztalt mentorálás és kapcsolatépítés a helyi piacokon történő sikeres induláshoz.
            </p>
          </motion.div>

          {/* 3. kártya */}
          <motion.div
            variants={itemVariants}
            className="group relative bg-slate-900/30 border border-slate-850 rounded-2xl p-8 hover:border-purple-500/20 hover:bg-slate-900/50 transition-all duration-300 shadow-xl shadow-slate-950/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/8 transition-colors pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-purple-400 transition-colors">Üzleti Mentorálás</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Személyre szabott stratégiai tanácsadás, skálázási tervek készítése és tőkebevonási felkészítés. Vezetői támogatás az ötlettől a nemzetközi piacra lépésig.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Lábléc */}
      <footer className="border-t border-slate-900/60 py-12 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div>
            © {new Date().getFullYear()} HomolaMentor KFT. Minden jog fenntartva.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-350 transition-colors">Adatkezelés</a>
            <a href="#" className="hover:text-slate-350 transition-colors">ÁSZF</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Kapcsolat</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
