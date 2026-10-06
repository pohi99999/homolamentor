'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useChat } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { usePathname } from '@/i18n/routing';

export default function AIChatAssistant() {
  const t = useTranslations('AIChatAssistant');
  // Az admin felületen mobilon (lg alatt) a lebegő buborék a kártyák jobb szélére
  // csúszott; ott elrejtjük. A publikus oldalon és az asztali adminon marad.
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const [isOpen, setIsOpen] = useState(false);
  
  const [inputText, setInputText] = useState('');
  
  // @ai-sdk/react 4 is the AI SDK 7 client: no append/isLoading/content any more, it is
  // sendMessage + status + message.parts, and it reads a UI message stream from /api/chat
  // (card 06c41d5e: the old append() call threw before anything was sent).
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';



  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatikus görgetés az új üzenetekhez
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage({ text: inputText });
    setInputText('');
  };

  return (
    // The launcher is a 20 px tab in the page's 24 px right gutter (every section has px-6), so a text
    // line always stays at least 4 px away from it (card 101bbcda: the round 56 px bubble covered the
    // search title at 390 px and "Kapcsolat" at every width; a 24 px tab still touched line ends).
    <div className={`fixed bottom-6 right-0 z-50 flex flex-col items-end ${isAdmin ? 'max-lg:hidden' : ''}`}>
      <AnimatePresence>
        {/* Kinyílt chat ablak */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="mr-4 sm:mr-6 w-[90vw] sm:w-[380px] h-[min(500px,calc(100dvh-8rem))] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden mb-4"
          >
            {/* Fejléc */}
            <div className="bg-slate-950/80 border-b border-slate-850 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
                  B
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    {t('title')}
                    <Sparkles className="w-3 h-3 text-amber-400 fill-current" />
                  </h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {t('subtitle')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                aria-label="Chat ablak bezárása"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Üzenetlista */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-950/20">
              {/* Alapértelmezett üdvözlő üzenet (Brunella bemutatkozása) */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md bg-slate-900/60 border border-slate-850 text-slate-200 rounded-tl-none font-light">
                  <p className="leading-relaxed">{t('welcomeMessage')}</p>
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-tr-none font-medium'
                        : 'bg-slate-900/60 border border-slate-850 text-slate-200 rounded-tl-none font-light'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 border border-slate-850 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-md flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Brunella gépel...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Szövegbeviteli mező */}
            <form
              onSubmit={handleSend}
              className="bg-slate-950/80 border-t border-slate-850 px-4 py-3 flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('placeholder')}
                aria-label={t('placeholder')}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:outline-none focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 disabled:from-slate-800 disabled:to-slate-850 text-slate-950 disabled:text-slate-600 shadow-xl shadow-black/50 hover:shadow-black/70 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer disabled:scale-100 disabled:cursor-not-allowed shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                aria-label="Üzenet küldése"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lebegő gomb */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-16 w-5 items-center justify-center rounded-l-xl bg-gradient-to-b from-amber-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        aria-label={isOpen ? 'AI Chat asszisztens bezárása' : 'AI Chat asszisztens megnyitása'}
        aria-expanded={isOpen}
        title="AI Chat asszisztens"
      >
        <span className="pointer-events-none absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/90 motion-safe:animate-pulse" />
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
      </motion.button>
    </div>
  );
}
