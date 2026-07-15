'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

export default function PropertyRequestForm() {
  const t = useTranslations('PropertyRequestForm');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    propertyType: '',
    location: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'PropertyRequestForm'
        }),
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

  return (
    <section className="relative px-6 py-24 bg-slate-950 overflow-hidden border-b border-slate-900/50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Fejléc */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">
            {t('subtitle')}
          </p>
        </div>

        {/* Űrlap tároló */}
        <div className="relative bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl hover:border-blue-500/20 transition-all duration-300">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-12 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-450 mb-2">
                  <CheckCircle className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100">{t('successMsg')}</h3>
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
                  {/* Név */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('nameLabel')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full bg-slate-950 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:outline-none focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* E-mail */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('emailLabel')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full bg-slate-950 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:outline-none focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Terület típusa */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="propertyType" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('typeLabel')} *
                    </label>
                    <input
                      type="text"
                      id="propertyType"
                      required
                      placeholder={t('typePlaceholder')}
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full bg-slate-950 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:outline-none focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Lokáció */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="location" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('locationLabel')} *
                    </label>
                    <input
                      type="text"
                      id="location"
                      required
                      placeholder={t('locationPlaceholder')}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={status === 'loading'}
                      className="w-full bg-slate-950 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:outline-none focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-405 font-semibold text-center mt-2">
                    {errorMessage}
                  </p>
                )}

                {/* Beküldő gomb */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-blue-500 to-sky-400 disabled:from-blue-600/50 disabled:to-sky-500/50 text-slate-950 font-bold rounded-2xl shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none after:absolute after:top-0 after:left-0 after:w-[200%] after:h-full after:-skew-x-20 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-[150%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 after:ease-out"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('submitButton')}...
                    </>
                  ) : (
                    <>
                      {t('submitButton')}
                      <Send className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
