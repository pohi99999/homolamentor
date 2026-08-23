'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MapPin, Tag, CheckCircle2, Send, MessageCircleQuestion } from 'lucide-react';
import type { TeaserResult, PropertySearchResponse } from '@/lib/propertySearch';

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

export default function PropertySearchSection() {
  const t = useTranslations('PropertySearchSection');
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<TeaserResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3 || status === 'loading') return;

    setStatus('loading');
    setNotice(null);

    try {
      const res = await fetch('/api/property-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), locale }),
      });
      const data: PropertySearchResponse = await res.json();
      setResults(data.results || []);
      setNotice(data.notice || null);
      setStatus('done');
    } catch {
      setResults([]);
      setNotice(t('errorNotice'));
      setStatus('error');
    }
  };

  return (
    <section className="relative px-6 py-24 bg-slate-950 overflow-hidden border-b border-slate-900/50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-wide [text-wrap:balance] mb-4 bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('inputPlaceholder')}
            disabled={status === 'loading'}
            minLength={3}
            maxLength={300}
            required
            className="flex-1 bg-slate-900/60 border border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-blue-500/50 rounded-xl px-5 py-4 text-sm text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || query.trim().length < 3}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-sky-400 disabled:from-blue-600/50 disabled:to-sky-500/50 text-slate-950 font-bold rounded-xl shadow-xl shadow-black/50 hover:shadow-black/70 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('searching')}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t('searchButton')}
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-400 text-sm"
            >
              {t('searchingHint')}
            </motion.p>
          )}

          {status !== 'loading' && notice && results.length === 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-300 bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-8 max-w-xl mx-auto text-sm leading-relaxed"
            >
              {notice}
            </motion.p>
          )}

          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {results.map((result) => (
                <ResultCard key={result.id} result={result} query={query} locale={locale} t={t} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  query,
  locale,
  t,
}: {
  result: TeaserResult;
  query: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interestStatus, setInterestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterestStatus('loading');
    try {
      const res = await fetch('/api/property-search/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, matchedResult: result, name, email, locale }),
      });
      if (!res.ok) throw new Error('failed');
      setInterestStatus('success');
    } catch {
      setInterestStatus('error');
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1 uppercase tracking-widest">
          {result.category}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
        <MapPin className="w-3.5 h-3.5 text-blue-400" />
        {result.locationHint}
      </div>

      {result.priceRange && (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-4">
          <Tag className="w-3.5 h-3.5 text-blue-400" />
          {result.priceRange}
        </div>
      )}

      <p className="text-xs text-slate-300 font-light mb-4 leading-relaxed">{result.summary}</p>

      {result.features.length > 0 && (
        <div className="space-y-1.5 mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          {result.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      )}

      {interestStatus === 'success' ? (
        <p className="text-xs text-emerald-400 font-semibold text-center py-2">{t('interestSuccess')}</p>
      ) : showForm ? (
        <form onSubmit={handleInterest} className="space-y-2 border-t border-slate-800 pt-4">
          <input
            type="text"
            required
            placeholder={t('nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={interestStatus === 'loading'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          <input
            type="email"
            required
            placeholder={t('emailLabel')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={interestStatus === 'loading'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          {interestStatus === 'error' && (
            <p className="text-[11px] text-red-400 text-center">{t('errorNotice')}</p>
          )}
          <button
            type="submit"
            disabled={interestStatus === 'loading'}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {interestStatus === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {t('interestSubmit')}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-1 w-full py-2.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <MessageCircleQuestion className="w-3.5 h-3.5" />
          {t('interestButton')}
        </button>
      )}
    </div>
  );
}
