'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Phone, Mail, ShieldCheck, Code, Globe2 } from 'lucide-react';

export default function ContactInfoCards() {
  const t = useTranslations('ContactInfoCards');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section className="relative px-6 py-20 bg-slate-950/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Fő kapcsolattartó kártya (László) */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-amber-500/30 rounded-3xl p-8 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Hover highlight effekt */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                  {t('rolePrimary')}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-100 mb-2">Homola László</h3>
              <p className="text-sm text-slate-450 mb-8 font-light leading-relaxed">
                {t('descPrimary')}
              </p>

              <div className="space-y-4">
                {/* Telefon */}
                <a
                  href="tel:+36706363270"
                  className="flex items-center gap-3.5 text-slate-300 hover:text-amber-400 transition-colors group/link py-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850 group-hover/link:border-amber-500/30">
                    <Phone className="w-4 h-4 text-slate-400 group-hover/link:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium tracking-wide">+36 70 636 3270</span>
                </a>

                {/* Email */}
                <a
                  href="mailto:homlamentor@gmail.com"
                  className="flex items-center gap-3.5 text-slate-300 hover:text-amber-400 transition-colors group/link py-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850 group-hover/link:border-amber-500/30">
                    <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium tracking-wide">homlamentor@gmail.com</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Fejlesztés & AI kártya (Peter) */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-8 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Hover highlight effekt */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <Code className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  {t('roleDev')}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-100 mb-2">Pohánka József Péter</h3>
              <p className="text-sm text-slate-450 mb-8 font-light leading-relaxed">
                {t('descDev')}
              </p>

              <div className="space-y-4">
                {/* Email */}
                <a
                  href="mailto:peterpohankapersonal@gmail.com"
                  className="flex items-center gap-3.5 text-slate-300 hover:text-emerald-400 transition-colors group/link py-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850 group-hover/link:border-emerald-500/30">
                    <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium tracking-wide">peterpohankapersonal@gmail.com</span>
                </a>

                {/* Github / Web */}
                <div className="flex items-center gap-3.5 text-slate-455 py-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-850">
                    <Globe2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm font-light">Lead AI Integrator</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
