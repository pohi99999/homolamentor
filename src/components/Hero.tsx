'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('Hero');

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
    <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-slate-950">
      {/* Grafikai háttérkép */}
      <Image
        src="/main-hero-bg.jpg"
        alt="HOMLAMENTOR KFT Global Background"
        fill
        priority
        fetchPriority="high"
        className="object-cover pointer-events-none z-0"
      />

      {/* Sötét luxury overlay a tökéletes olvashatósághoz */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-black/70 to-slate-950 pointer-events-none z-0" />

      {/* Animált Háttér Fényfoltok (Glowing Orbs) */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto flex flex-col items-center gap-8"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-full px-5 py-2 text-xs font-bold text-emerald-400 tracking-wider shadow-lg shadow-slate-950/20"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('badge')}
          </motion.div>

          {/* Főcím */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wide [text-wrap:balance] leading-[1.08] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            {t('title')}
          </motion.h1>

          {/* Alcím */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 leading-relaxed font-light max-w-3xl"
          >
            {t('subtitle')}
          </motion.p>

          {/* CTA gombok */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto"
          >
            <a
              href="#portal"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer relative overflow-hidden after:absolute after:top-0 after:left-0 after:w-[200%] after:h-full after:-skew-x-20 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-[150%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 after:ease-out"
            >
              {t('ctaPortal')}
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href="#incubator"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold rounded-2xl shadow-xl shadow-black/50 hover:shadow-black/70 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer relative overflow-hidden after:absolute after:top-0 after:left-0 after:w-[200%] after:h-full after:-skew-x-20 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:-translate-x-[150%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 after:ease-out"
            >
              {t('ctaIncubator')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
