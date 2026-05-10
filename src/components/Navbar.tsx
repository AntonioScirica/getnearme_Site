'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type Locale } from '@/lib/i18n';
import { translations } from '@/lib/translations';
import LanguageSwitcher from './LanguageSwitcher';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
    locale: Locale;
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export default function Navbar({ locale }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const t = translations[locale];

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);

        handleScroll();
        checkMobile();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    useEffect(() => {
        // Validate token server-side (catches deleted accounts)
        supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error || !user) {
                setIsLoggedIn(false);
                supabase.auth.signOut();
            } else {
                setIsLoggedIn(true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user);
        });

        return () => { subscription.unsubscribe(); };
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            <nav
                className="w-full transition-all duration-300 border-b"
                style={{
                    background: isScrolled ? 'rgba(250,250,248,0.8)' : (isMobile ? 'transparent' : '#fafaf8'),
                    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    borderColor: isScrolled ? '#e2e8f0' : 'transparent',
                }}
            >
                <div className="max-w-7xl mx-auto px-5 md:px-3 h-20 flex items-center justify-between relative">
                    <Link href={`/${locale}`} className="flex items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo_blu_nero.svg" alt="GetNearMe" className="h-7 md:h-9 w-auto" />
                    </Link>

                    <div className="hidden md:flex items-center gap-16 text-sm font-medium text-slate-600 absolute left-1/2 -translate-x-1/2">
                        <Link href={`/${locale}#funzionalita`} className="hover:text-black transition-colors">{t.nav.features}</Link>
                        <Link href={`/${locale}/tutorial`} className="hover:text-black transition-colors">{t.nav.tutorial}</Link>
                        <Link href={`/${locale}#pricing`} className="hover:text-black transition-colors">{t.nav.pricing}</Link>
                        <Link href={`/${locale}#faq`} className="hover:text-black transition-colors">{t.nav.faq}</Link>
                        <LanguageSwitcher locale={locale} />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {isLoggedIn ? (
                            <Link
                                href={`/${locale}/dashboard`}
                                className="hidden md:flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-[#3B83F6] text-white rounded-xl neo-border neo-shadow hover:bg-[#2563EB] transition-all font-bold text-sm sm:text-base"
                            >
                                <UserIcon />
                                <span className="hidden sm:inline">{t.nav.dashboard}</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={`/${locale}/checkout/agency`}
                                    className="hidden md:flex items-center justify-center h-[48px] w-[48px] bg-white neo-border rounded-xl neo-shadow hover:bg-slate-50 transition-all text-[#1a1a2e]"
                                    aria-label="Login"
                                >
                                    <UserIcon />
                                </Link>
                                <a
                                    href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden md:flex items-center h-[48px] px-6 bg-amber-500 text-[#1a1a2e] rounded-xl neo-border neo-shadow hover:bg-amber-600 transition-all font-bold text-lg"
                                >
                                    {t.nav.startAnalysis}
                                </a>
                            </>
                        )}
                        <button
                            className="md:hidden relative z-[70] p-2 text-slate-600"
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
                className={`md:hidden fixed inset-0 z-[60] bg-white transition-all duration-500 ease-out ${
                    isMenuOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    className="absolute top-7 right-5 p-2 text-slate-600 z-10"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <div className="relative w-6 h-6">
                        <span className="absolute left-0 top-2.75 w-6 h-0.5 bg-current rotate-45" />
                        <span className="absolute left-0 top-2.75 w-6 h-0.5 bg-current -rotate-45" />
                    </div>
                </button>
                <div className="flex flex-col justify-between h-full pt-28 pb-12 px-8">
                    <div className="flex flex-col items-center gap-2">
                        {[
                            { href: `/${locale}#funzionalita`, label: t.nav.features },
                            { href: `/${locale}/tutorial`, label: t.nav.tutorial },
                            { href: `/${locale}#pricing`, label: t.nav.pricing },
                            { href: `/${locale}#faq`, label: t.nav.faq },
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

                        {isLoggedIn ? (
                            <Link
                                href={`/${locale}/dashboard`}
                                className={`mt-6 w-full max-w-xs text-center flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B83F6] text-white rounded-xl neo-border neo-shadow hover:bg-[#2563EB] transition-all duration-500 ease-out font-bold text-base ${
                                    isMenuOpen
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                }`}
                                style={{ transitionDelay: isMenuOpen ? '450ms' : '0ms' }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <UserIcon />
                                {t.nav.dashboard}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={`/${locale}/checkout/agency`}
                                    className={`mt-6 w-full max-w-[280px] text-center flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#1a1a2e] rounded-xl neo-border neo-shadow hover:bg-slate-50 transition-all duration-500 ease-out font-bold text-base ${
                                        isMenuOpen
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4'
                                    }`}
                                    style={{ transitionDelay: isMenuOpen ? '450ms' : '0ms' }}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <UserIcon />
                                    Accedi
                                </Link>
                                <a
                                    href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-3 w-full max-w-[280px] text-center flex items-center justify-center px-5 py-3 bg-amber-500 text-[#1a1a2e] rounded-xl neo-border neo-shadow hover:bg-amber-600 transition-all duration-500 ease-out font-bold text-base ${
                                        isMenuOpen
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4'
                                    }`}
                                    style={{ transitionDelay: isMenuOpen ? '525ms' : '0ms' }}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t.nav.startAnalysis}
                                </a>
                            </>
                        )}
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
