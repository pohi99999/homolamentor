'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import { Link } from '@/i18n/routing';

export default function Navbar() {
  const t = useTranslations('Navbar');
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: t('home'), href: '/' },
    { name: t('incubator'), href: '/afrika-inkubator' },
    { name: t('mobilehome'), href: '/mobilhaz-projekt' },
    { name: t('portal'), href: '/ingatlan-portal', icon: Lock },
    { name: t('contact'), href: '/kapcsolat' },
  ];




  return (
    <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-md border-b border-slate-900/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logó */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            HOMLAMENTOR<span className="text-emerald-400 font-medium"> KFT</span>
          </span>
        </Link>

        {/* Asztali menü */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-355 hover:text-emerald-400 transition-colors"
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-emerald-400/80" />}
                {item.name}
              </Link>
            );
          })}
          <div className="h-4 w-px bg-slate-800" />
          <LanguageSwitcher />
        </nav>

        {/* Mobil menü gomb és nyelvváltó */}
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-300 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
            aria-label={isOpen ? "Menü bezárása" : "Menü megnyitása"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobil lenyíló menü panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-slate-950/95 border-t border-slate-900/80 mt-4 -mx-6 px-6"
          >
            <nav className="flex flex-col gap-5 py-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-base font-semibold text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
