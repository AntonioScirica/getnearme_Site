'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
    const router = useRouter();
    const pathname = usePathname();

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
        // Read the persisted session (auto-refreshes an expired access token using
        // the refresh token). NB: do NOT use getUser()+signOut() here — on return
        // visits the access token is often expired before the refresh completes, so
        // getUser() errors and the old code signed the user out, hiding Dashboard.
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session?.user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user);
        });

        return () => { subscription.unsubscribe(); };
    }, []);

    // Arrivo sulla landing con un hash (es. da un'altra pagina): scrolla alla
    // sezione con l'offset dell'header sticky (lo scroll nativo non lo applica).
    useEffect(() => {
        const onLanding = pathname === `/${locale}` || pathname === `/${locale}/`;
        if (!onLanding || !window.location.hash) return;
        const id = window.location.hash.slice(1);
        const tid = setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 350);
        return () => clearTimeout(tid);
    }, [pathname, locale]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollTo = (id: string) => {
        setIsMenuOpen(false);
        // Su mobile il menu blocca lo scroll (body overflow:hidden): sblocco subito.
        document.body.style.overflow = '';
        // Se non siamo sulla landing, la sezione non esiste in pagina: naviga alla
        // home con l'hash (il browser fa lo scroll all' id al caricamento).
        const onLanding = pathname === `/${locale}` || pathname === `/${locale}/`;
        if (!onLanding) {
            router.push(`/${locale}#${id}`);
            return;
        }
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 60);
    };

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
                        <button onClick={() => scrollTo('funzionalita')} className="hover:text-black transition-colors cursor-pointer">{t.nav.features}</button>
                        <Link href={`/${locale}/reference`} className="hover:text-black transition-colors">{t.nav.examples}</Link>
                        {/* Blog link removed from nav while the section is still being iterated on — pages stay reachable by direct URL. */}
                        {/* <Link href={`/${locale}/tutorial`} className="hover:text-black transition-colors">{t.nav.tutorial}</Link> */}
                        <button onClick={() => scrollTo('pricing')} className="hover:text-black transition-colors cursor-pointer">{t.nav.pricing}</button>
                        <button onClick={() => scrollTo('faq')} className="hover:text-black transition-colors cursor-pointer">{t.nav.faq}</button>
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
                            <button
                                onClick={() => scrollTo('pricing')}
                                className="hidden md:flex items-center h-[48px] px-6 bg-[#3B83F6] text-white rounded-xl neo-shadow hover:bg-[#2563EB] transition-all font-bold text-lg cursor-pointer"
                            >
                                {t.nav.startAnalysis}
                            </button>
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
                <div className="flex flex-col justify-between h-full pt-28 pb-12 px-8">
                    <div className="flex flex-col items-center gap-2">
                        {[
                            { id: 'funzionalita', label: t.nav.features },
                            { href: `/${locale}/reference`, label: t.nav.examples },
                            // { id: 'tutorial', label: t.nav.tutorial },
                            { id: 'pricing', label: t.nav.pricing },
                            { id: 'faq', label: t.nav.faq },
                        ].map((item, i) => (
                            'id' in item ? (
                            <button
                                key={i}
                                className={`text-3xl font-semibold text-slate-900 hover:text-blue-500 py-3 transition-all duration-500 ease-out cursor-pointer ${
                                    isMenuOpen
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                }`}
                                style={{ transitionDelay: isMenuOpen ? `${150 + i * 75}ms` : '0ms' }}
                                onClick={() => scrollTo((item as { id: string; label: string }).id)}
                            >
                                {item.label}
                            </button>
                            ) : (
                            <a
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
                            </a>
                            )
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
                                <button
                                    onClick={() => scrollTo('pricing')}
                                    className={`mt-3 w-full max-w-[280px] text-center flex items-center justify-center px-5 py-3 bg-[#3B83F6] text-white rounded-xl neo-shadow hover:bg-[#2563EB] transition-all duration-500 ease-out font-bold text-base cursor-pointer ${
                                        isMenuOpen
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4'
                                    }`}
                                    style={{ transitionDelay: isMenuOpen ? '525ms' : '0ms' }}
                                >
                                    {t.nav.startAnalysis}
                                </button>
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
