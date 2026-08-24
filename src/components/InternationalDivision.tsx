'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Radio, Sprout, Send, CheckCircle, Loader2, DollarSign, Building, User, Mail, Phone, Layers } from 'lucide-react';

export default function InternationalDivision() {
  const t = useTranslations('InternationalDivision');
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    targetedSector: '',
    investmentVolume: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/international-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong.');
      }

      setStatus('success');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Submit error:', error);
      setErrorMessage(error.message || 'Hiba történt a küldés során.');
      setStatus('idle');
    }
  };

  const sectors = [
    {
      title: t('energyTitle'),
      desc: t('energyDesc'),
      icon: Sun,
      color: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/10'
    },
    {
      title: t('telecomTitle'),
      desc: t('telecomDesc'),
      icon: Radio,
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/10'
    },
    {
      title: t('agriTitle'),
      desc: t('agriDesc'),
      icon: Sprout,
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/10'
    }
  ];

  return (
    <section className="relative px-6 py-24 bg-slate-950 overflow-hidden">
      {/* Háttérfények (Arany/Kék) */}
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full bg-blue-500/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full bg-amber-500/3 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Fejléc és Badge */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold tracking-widest text-amber-400 uppercase bg-amber-400/5 px-4 py-2 rounded-full border border-amber-400/20 mb-6"
          >
            {t('badge')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black tracking-tight break-words mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 leading-relaxed font-light text-lg [text-wrap:balance]"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Strukturált Szektorok */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-28">
          {sectors.map((sec, idx) => {
            const IconComponent = sec.icon;
            return (
              <motion.div
                key={sec.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col bg-slate-900/30 backdrop-blur-md border border-slate-900 rounded-3xl p-8 relative overflow-hidden group shadow-lg ${sec.shadow} hover:shadow-2xl hover:border-slate-800 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${sec.color} flex items-center justify-center text-slate-950 font-bold mb-6 shadow-md shadow-black/20 group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-4 group-hover:text-amber-300 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-slate-400 leading-relaxed font-light text-sm">
                  {sec.desc}
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-bl-full pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        {/* Kapcsolati Űrlap */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-150 mb-3">
              {t('formTitle')}
            </h3>
            <p className="text-slate-400 font-light text-sm">
              {t('formSubtitle')}
            </p>
          </div>

          <div className="relative bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl hover:border-amber-500/20 transition-all duration-300">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center py-12 gap-5"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-inner">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-100">{t('successMsg')}</h4>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cégnév */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="companyName" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        {t('companyNameLabel')} *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        required
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>

                    {/* Képviselő */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="representativeName" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        {t('representativeLabel')} *
                      </label>
                      <input
                        type="text"
                        id="representativeName"
                        required
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* E-mail */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        {t('emailLabel')} *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    {/* Telefon */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        {t('phoneLabel')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    {/* Érintett Szektor */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="targetedSector" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        {t('sectorLabel')} *
                      </label>
                      <select
                        id="targetedSector"
                        required
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-300 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm appearance-none cursor-pointer"
                        value={formData.targetedSector}
                        onChange={(e) => setFormData({ ...formData, targetedSector: e.target.value })}
                      >
                        <option value="" disabled>{t('sectorPlaceholder')}</option>
                        <option value="Megujulo Energia (50+ MW solar)">{t('sectorOption1')}</option>
                        <option value="Tavkozlesi Infrastruktura">{t('sectorOption2')}</option>
                        <option value="Agrar- es Elelmiszeripar">{t('sectorOption3')}</option>
                        <option value="Osszes / Vegyes portfolio">{t('sectorOption4')}</option>
                      </select>
                    </div>

                    {/* Befektetési Volumen */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="investmentVolume" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                        {t('volumeLabel')}
                      </label>
                      <input
                        type="text"
                        id="investmentVolume"
                        placeholder={t('volumePlaceholder')}
                        className="bg-slate-950/50 border border-slate-900 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-amber-550 focus-visible:outline-none focus:outline-none focus:border-amber-400/50 transition-all text-sm"
                        value={formData.investmentVolume}
                        onChange={(e) => setFormData({ ...formData, investmentVolume: e.target.value })}
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="text-rose-400 text-xs font-semibold bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('submitButton')}...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('submitButton')}</span>
                        </>
                      )}
                      <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-30 -translate-x-full group-hover:animate-[sweep_0.8s_ease-out_1]" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
