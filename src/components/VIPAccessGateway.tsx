'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ArrowRight, ShieldCheck, MapPin, DollarSign } from 'lucide-react';

export default function VIPAccessGateway() {
  const t = useTranslations('VIPAccessGateway');
  const [password, setPassword] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'homola-vip-2026') {
      setIsVIP(true);
      setIsError(false);
    } else {
      setIsError(true);
      setShake(true);
      // Reset shake state after animation
      setTimeout(() => setShake(false), 500);
    }
  };

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 }
    },
    idle: { x: 0 }
  };

  return (
    <section id="portal" className="relative px-6 py-24 bg-slate-950 overflow-hidden border-b border-slate-900/50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-sky-500/3 blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!isVIP ? (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              {/* Fejléc */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 mx-auto mb-6 shadow-lg shadow-sky-500/5">
                  <Lock className="w-8 h-8 text-sky-400" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-4 bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
                  {t('title')}
                </h2>
                <p className="text-slate-400 leading-relaxed font-light text-sm">
                  {t('subtitle')}
                </p>
              </div>

              {/* Jelszó Űrlap */}
              <motion.form
                variants={shakeVariants}
                animate={shake ? 'shake' : 'idle'}
                onSubmit={handleAccessSubmit}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-8 shadow-2xl shadow-slate-950/40 flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="vipKey" className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                    {t('passwordPlaceholder')}
                  </label>
                  <input
                    type="password"
                    id="vipKey"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all text-center tracking-widest font-black"
                  />
                </div>

                {isError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-405 font-semibold text-center"
                  >
                    {t('errorMsg')}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('submitButton')}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div
              key="vip-portal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Sikeres belépés fejléc */}
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-450 mx-auto mb-6 shadow-lg shadow-emerald-500/5">
                  <Unlock className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-4 text-emerald-400">
                  {t('vipTitle')}
                </h2>
                <p className="text-slate-400 leading-relaxed font-light">
                  {t('vipSubtitle')}
                </p>
              </div>

              {/* VIP Ingatlan Rács */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* VIP Kártya 1 */}
                <div className="group relative bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-8 hover:bg-slate-900/70 transition-all duration-300 shadow-2xl shadow-emerald-500/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-2.5 py-1 uppercase tracking-widest">
                      VIP Off-Market
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 group-hover:text-emerald-450 transition-colors">
                    {t('vipCard1Title')}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed font-light">
                    {t('vipCard1Spec')}
                  </p>
                  <div className="border-t border-slate-850 pt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-light">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> Lokáció:
                      </span>
                      <span className="text-slate-200 font-bold">Hegyeshalom (M1/M15 csomópont)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-light">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Ár:
                      </span>
                      <span className="text-emerald-450 font-black">€ 4,800,000</span>
                    </div>
                  </div>
                </div>

                {/* VIP Kártya 2 */}
                <div className="group relative bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-8 hover:bg-slate-900/70 transition-all duration-300 shadow-2xl shadow-emerald-500/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-2.5 py-1 uppercase tracking-widest">
                      VIP Off-Market
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 group-hover:text-emerald-450 transition-colors">
                    {t('vipCard2Title')}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed font-light">
                    {t('vipCard2Spec')}
                  </p>
                  <div className="border-t border-slate-850 pt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-light">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> Lokáció:
                      </span>
                      <span className="text-slate-200 font-bold">Sopron Ipari Park</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-light">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Ár:
                      </span>
                      <span className="text-emerald-450 font-black">€ 3,200,000</span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
