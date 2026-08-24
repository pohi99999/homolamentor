'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function AfricaHero() {
  const t = useTranslations('AfricaHero');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15
      }
    }
  };

  return (
    <section className="relative min-h-[50vh] flex items-center justify-center px-6 py-24 overflow-hidden bg-slate-950 border-b border-slate-900/50">
      {/* Háttér videó */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source src="/videos/afrika-bg.mp4" type="video/mp4" />
      </video>

      {/* Meleg tónusú sötétítő overlay a tökéletes olvashatósághoz */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-black/75 to-slate-950 pointer-events-none z-0" />

      {/* Geometriai afrikai motívumok mintázat és háttérfények */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[130px] pointer-events-none z-0" />


      {/* Finom animált körvonalak (geometriai díszítés) */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-amber-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] rounded-full border border-orange-500/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto flex flex-col items-center gap-6"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4.5 py-1.5 text-xs font-bold text-amber-400 tracking-wider shadow-lg"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            {t('badge')}
          </motion.div>

          {/* Cím */}
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-6xl font-black tracking-wide break-words [text-wrap:balance] bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent"
          >
            {t('title')}
          </motion.h1>

          {/* Alcím */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 leading-relaxed font-light"
          >
            {t('subtitle')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
