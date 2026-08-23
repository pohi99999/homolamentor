'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ArrowRight, ShieldCheck, MapPin, DollarSign, CheckCircle2, ExternalLink } from 'lucide-react';
import { properties } from '@/data/properties';

export default function VIPAccessGateway() {
  const t = useTranslations('VIPAccessGateway');
  const tGrid = useTranslations('PropertyTeaserGrid');
  const [password, setPassword] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === 'homola-vip-2026') {
      setIsVIP(true);
      setIsError(false);
    } else {
      setIsError(true);
      setShake(true);
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

      <div className="max-w-7xl mx-auto relative z-10">
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
                <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto mb-6 shadow-lg shadow-sky-500/5">
                  <Lock className="w-8 h-8 text-sky-400" />
                </div>
                <h2 className="text-3xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  {t('title')}
                </h2>
                <p className="text-slate-400 leading-relaxed font-light text-sm sm:text-base">
                  {t('subtitle')}
                </p>
              </div>

              {/* Jelszó Űrlap */}
              <motion.form
                variants={shakeVariants}
                animate={shake ? 'shake' : 'idle'}
                onSubmit={handleAccessSubmit}
                className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl p-8 shadow-2xl hover:border-sky-500/20 flex flex-col gap-5 transition-all duration-300"
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
                    className="w-full bg-slate-950 border border-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none focus:outline-none focus:border-sky-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-700 transition-all text-center tracking-widest font-black"
                  />
                </div>

                {isError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 font-semibold text-center"
                  >
                    {t('errorMsg')}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 font-bold rounded-2xl shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 after:absolute after:top-0 after:left-0 after:w-[200%] after:h-full after:-skew-x-20 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-[150%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 after:ease-out"
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
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-500/5">
                  <Unlock className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VIP Hozzáférés Aktív
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-emerald-400">
                  {t('vipTitle')}
                </h2>
                <p className="text-slate-300 leading-relaxed font-light text-base">
                  {t('vipSubtitle')}
                </p>
              </div>

              {/* VIP Ingatlan Rács - Mind a 13 valós projekt feloldva */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((item) => {
                  let title = item.title;
                  let location = item.location;
                  let price = item.price;
                  const currency = item.currency;
                  let category = item.category;
                  let description = item.description;
                  let features = item.features;

                  try {
                    const itemT = tGrid.raw(`items.${item.translationKey}`) as {
                      title?: string;
                      location?: string;
                      price?: string;
                      category?: string;
                      features?: string[];
                      description?: string;
                    };
                    if (itemT) {
                      if (itemT.title) title = itemT.title;
                      if (itemT.location) location = itemT.location;
                      if (itemT.price) price = itemT.price;
                      if (itemT.category) category = itemT.category;
                      if (itemT.features) features = itemT.features;
                      if (itemT.description) description = itemT.description;
                    }
                  } catch {
                    // Fallback
                  }

                  const formattedPrice =
                    typeof price === 'number'
                      ? `${price.toLocaleString()} ${currency}`
                      : `${price} ${currency}`.trim();

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-6 hover:bg-slate-900/80 transition-all duration-300 shadow-xl shadow-emerald-500/5 flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                      
                      <div>
                        {/* Fejléc badgek */}
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VIP Verified
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            {category}
                          </span>
                        </div>

                        {/* Cím */}
                        <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-emerald-300 transition-colors leading-snug">
                          {title}
                        </h3>

                        {/* Leírás */}
                        <p className="text-xs text-slate-300 font-light mb-4 leading-relaxed">
                          {description}
                        </p>

                        {/* Kiemelt Jellemzők */}
                        <div className="space-y-1.5 mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                          {features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 text-xs text-slate-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Feloldott Pontos Adatok */}
                      <div className="border-t border-slate-800 pt-4 mt-auto space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-slate-400 font-light">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lokáció:
                          </span>
                          <span className="text-slate-100 font-bold text-right">{location}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-slate-400 font-light">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Irányár / Érték:
                          </span>
                          <span className="text-emerald-400 font-black text-sm">{formattedPrice}</span>
                        </div>

                        <a
                          href="#request-form"
                          className="mt-3 w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          Kapcsolatfelvétel & Doksi Kérés
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
