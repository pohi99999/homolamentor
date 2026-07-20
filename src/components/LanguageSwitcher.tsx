'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();


  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      // Nyelvváltás az aktuális útvonal megőrzésével
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3.5 py-1.5 shadow-lg shadow-slate-950/40 hover:border-slate-700 transition-colors">
      <Globe className={`w-4 h-4 text-emerald-400 ${isPending ? 'animate-spin' : ''}`} />
      <label htmlFor="language-switcher-select" className="sr-only">Nyelv választása / Select Language / Sprache auswählen</label>
      <select
        id="language-switcher-select"
        defaultValue={locale}
        disabled={isPending}
        onChange={(e) => onSelectChange(e.target.value)}
        className="bg-transparent text-xs text-slate-200 focus-visible:ring-1 focus-visible:ring-emerald-400 focus-visible:outline-none focus:outline-none cursor-pointer font-semibold uppercase tracking-wider appearance-none pr-1"
        style={{ WebkitAppearance: 'none' }}
      >
        <option value="hu" className="bg-slate-950 text-slate-200">HU</option>
        <option value="en" className="bg-slate-950 text-slate-200">EN</option>
        <option value="de" className="bg-slate-950 text-slate-200">DE</option>
        <option value="fr" className="bg-slate-950 text-slate-200">FR</option>
      </select>
    </div>
  );
}
