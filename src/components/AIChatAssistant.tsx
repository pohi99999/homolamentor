'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function AIChatAssistant() {
  const t = useTranslations('AIChatAssistant');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatikus görgetés az új üzenetekhez
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Szimulált válaszadási késleltetés
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const botMessage: Message = {
      sender: 'bot',
      text: t('mockResponse'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {/* Kinyílt chat ablak */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="w-[90vw] sm:w-[380px] h-[500px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden mb-4"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 transition-all cursor-pointer"
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

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-tr-none font-medium'
                        : 'bg-slate-900/60 border border-slate-850 text-slate-200 rounded-tl-none font-light'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1.5 ${
                        msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
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
                disabled={isTyping}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 disabled:from-slate-800 disabled:to-slate-850 text-slate-950 disabled:text-slate-600 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer disabled:scale-100 disabled:cursor-not-allowed shrink-0"
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-emerald-500/25 cursor-pointer relative"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400/20 scale-110 animate-ping pointer-events-none" />
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
