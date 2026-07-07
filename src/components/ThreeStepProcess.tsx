'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Search, Users, ShieldCheck } from 'lucide-react';

export default function ThreeStepProcess() {
  const t = useTranslations('ThreeStepProcess');

  const steps = [
    {
      title: t('step1Title'),
      desc: t('step1Desc'),
      icon: Search,
      color: 'from-amber-500 to-orange-400',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400'
    },
    {
      title: t('step2Title'),
      desc: t('step2Desc'),
      icon: Users,
      color: 'from-emerald-500 to-teal-400',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400'
    },
    {
      title: t('step3Title'),
      desc: t('step3Desc'),
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-400',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15
      }
    }
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950/60 border-b border-slate-900/50">
      <div className="max-w-5xl mx-auto">
        
        {/* Szekciófejléc */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">
            {t('subtitle')}
          </p>
        </div>

        {/* Vertikális Idővonal */}
        <div className="relative border-l border-slate-800 ml-4 md:ml-0 md:left-1/2 md:-translate-x-px space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 0;

            return (
              <div key={idx} className="relative md:flex md:justify-between items-center w-full">
                
                {/* Idővonal pont */}
                <div className="absolute -left-[25px] md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-100 z-10">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${step.color} flex items-center justify-center text-slate-950 font-bold text-sm shadow-md`}>
                    {idx + 1}
                  </div>
                </div>

                {/* Kártya tartalom (váltakozó igazítással) */}
                <div className={`w-full md:w-[45%] pl-8 md:pl-0 ${isEven ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8 md:col-start-2 md:order-last'}`}>
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    className="group relative bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl p-8 hover:bg-slate-900/50 transition-all duration-300 shadow-xl shadow-slate-950/20"
                  >
                    <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center ${step.textColor} mb-6 ${isEven ? 'md:ml-auto' : ''} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-amber-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-light">
                      {step.desc}
                    </p>
                  </motion.div>
                </div>

                {/* Desktop igazításhoz üres hely a túloldalon */}
                <div className="hidden md:block w-[45%]" />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
