'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { translations } from '@/lib/translations';
import LanguageSwitcher from './LanguageSwitcher';

interface NavbarProps {
    locale: Locale;
}

export default function Navbar({ locale }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const t = translations[locale];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            <nav
                className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${isScrolled
                    ? 'bg-white/80 backdrop-blur-md border-b border-slate-200'
                    : 'bg-[#F5F5F5] border-b border-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-3 h-20 flex items-center justify-between">
                    <Link href={`/${locale}`} className="font-serif text-2xl tracking-tight font-semibold">
                        GetNearMe
                    </Link>

                    <div className="hidden md:flex items-center gap-16 text-sm font-medium text-slate-600">
                        <Link href={`/${locale}/features`} className="hover:text-black transition-colors">{t.nav.features}</Link>
                        <Link href={`/${locale}#prezzi`} className="hover:text-black transition-colors">{t.nav.pricing}</Link>
                        <Link href={`/${locale}#faq`} className="hover:text-black transition-colors">{t.nav.faq}</Link>
                        <Link href={`/${locale}/tutorial`} className="hover:text-black transition-colors">{t.nav.tutorial}</Link>
                        <LanguageSwitcher locale={locale} />
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-bold text-lg font-sans"
                        >
                            {t.nav.startAnalysis}
                        </a>
                        <button
                            className="md:hidden relative z-50 p-2 text-slate-600"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <div className="relative w-6 h-6">
                                <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ease-out ${isMenuOpen ? 'top-2.75 rotate-45' : 'top-1'}`} />
                                <span className={`absolute left-0 top-2.75 w-6 h-0.5 bg-current transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`} />
                                <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ease-out ${isMenuOpen ? 'top-2.75 -rotate-45' : 'top-4.75'}`} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Full-screen Mobile Menu */}
            <div
                className={`md:hidden fixed inset-0 z-40 bg-white transition-all duration-500 ease-out ${
                    isMenuOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
            >
                <div className="flex flex-col justify-between h-full pt-28 pb-12 px-8">
                    <div className="flex flex-col items-center gap-2">
                        {[
                            { href: `/${locale}#funzionalita`, label: t.nav.features },
                            { href: `/${locale}#prezzi`, label: t.nav.pricing },
                            { href: `/${locale}#faq`, label: t.nav.faq },
                            { href: `/${locale}/tutorial`, label: t.nav.tutorial },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                href={item.href}
                                className={`text-3xl font-semibold text-slate-900 hover:text-blue-500 py-3 transition-all duration-500 ease-out ${
                                    isMenuOpen
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                }`}
                                style={{ transitionDelay: isMenuOpen ? `${150 + i * 75}ms` : '0ms' }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}

                        <a
                            href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-6 w-full max-w-xs text-center px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-500 ease-out font-bold text-base font-sans ${
                                isMenuOpen
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-4'
                            }`}
                            style={{ transitionDelay: isMenuOpen ? '450ms' : '0ms' }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {t.nav.startAnalysis}
                        </a>
                    </div>

                    <div
                        className={`flex justify-center transition-all duration-500 ease-out ${
                            isMenuOpen
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: isMenuOpen ? '525ms' : '0ms' }}
                    >
                        <LanguageSwitcher locale={locale} openUp />
                    </div>
                </div>
            </div>
        </>
    );
}
