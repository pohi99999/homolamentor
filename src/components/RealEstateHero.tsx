'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';

export default function RealEstateHero() {
  const t = useTranslations('RealEstateHero');

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
      {/* Blueprint stílusú háttér rács */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-600/5 blur-[130px] pointer-events-none" />

      {/* Geometriai elemek */}
      <div className="absolute w-[700px] h-[700px] rounded-full border border-sky-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

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
            className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4.5 py-1.5 text-xs font-bold text-sky-400 tracking-wider shadow-lg"
          >
            <Building className="w-4 h-4 text-sky-405" />
            {t('badge')}
          </motion.div>

          {/* Cím */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent"
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
