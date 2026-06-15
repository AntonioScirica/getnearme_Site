'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  locale: Locale;
  openUp?: boolean;
}

export default function LanguageSwitcher({ locale, openUp = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Click fuori / Escape per chiudere (niente hover: su touch l'hover apre e
  // poi il click richiude subito).
  React.useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const currentLocale = {
    code: locale,
    label: localeNames[locale],
    flag: localeFlags[locale],
  };

  const handleLocaleChange = (newLocale: Locale) => {
    // Ottieni il path senza il locale corrente
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Naviga alla nuova URL con il nuovo locale
    router.push(`/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-black transition-colors focus:outline-none"
        aria-label="Seleziona lingua"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="hidden lg:inline">{currentLocale.label}</span>
        <span className="lg:hidden uppercase">{currentLocale.code}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute w-48 z-20 ${openUp ? 'left-1/2 -translate-x-1/2' : 'right-0 md:left-0 md:right-auto'}`}
          style={openUp ? { bottom: '100%', paddingBottom: 8 } : { top: '100%', paddingTop: 8 }}
        >
          <div
            className="rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-fade-in"
            role="listbox"
            aria-label="Lingue disponibili"
          >
            <div className="p-2 grid grid-cols-1 gap-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  role="option"
                  aria-selected={locale === loc}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    locale === loc
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-lg leading-none">{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
