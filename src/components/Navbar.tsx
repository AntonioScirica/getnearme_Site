'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav
            className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-md border-b border-slate-200'
                : 'bg-[#F5F5F5] border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-3 h-20 flex items-center justify-between">
                <div className="text-xl font-serif text-2xl tracking-tight font-semibold">GetNearMe</div>

                <div className="hidden md:flex items-center gap-16 text-sm font-medium text-slate-600">
                    <Link href="#funzionalita" className="hover:text-black transition-colors">{t.nav.features}</Link>
                    <Link href="#prezzi" className="hover:text-black transition-colors">{t.nav.pricing}</Link>
                    <Link href="#faq" className="hover:text-black transition-colors">{t.nav.faq}</Link>
                    <LanguageSwitcher />
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="#estensione"
                        className="hidden sm:flex px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans"
                    >
                        {t.nav.startAnalysis}
                    </Link>
                    <button 
                        className="md:hidden p-2 text-slate-600"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <Link 
                        href="#funzionalita" 
                        className="text-lg font-medium text-slate-600 hover:text-blue-500 py-2 border-b border-slate-100"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t.nav.features}
                    </Link>
                    <Link 
                        href="#prezzi" 
                        className="text-lg font-medium text-slate-600 hover:text-blue-500 py-2 border-b border-slate-100"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t.nav.pricing}
                    </Link>
                    <Link 
                        href="#faq" 
                        className="text-lg font-medium text-slate-600 hover:text-blue-500 py-2 border-b border-slate-100"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t.nav.faq}
                    </Link>
                    
                    <div className="py-2 flex justify-between items-center border-b border-slate-100">
                        <span className="text-lg font-medium text-slate-600">Language</span>
                        <LanguageSwitcher />
                    </div>

                    <Link
                        href="#estensione"
                        className="mt-2 w-full text-center px-6 py-3 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t.nav.startAnalysis}
                    </Link>
                </div>
            )}
        </nav>
    );
}
