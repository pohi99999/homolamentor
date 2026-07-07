'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

export default function ContactHero() {
  const t = useTranslations('ContactHero');

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
    <section className="relative min-h-[40vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-slate-950 border-b border-slate-900/50">
      {/* Háttérfények és rács */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto flex flex-col items-center gap-5"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-xs font-bold text-slate-350 tracking-wider shadow-lg"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            {t('badge')}
          </motion.div>

          {/* Cím */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent"
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
