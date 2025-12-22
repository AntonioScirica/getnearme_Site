'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 backdrop-blur-md border-b border-slate-200'
                : 'bg-[#F5F5F5] border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="text-xl font-serif text-2xl tracking-tight">ORAZIO</div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <Link href="#" className="hover:text-black transition-colors">Why Orazio</Link>
                    <Link href="#" className="hover:text-black transition-colors">Products</Link>
                    <Link href="#" className="hover:text-black transition-colors">Resources</Link>
                    <Link href="#" className="hover:text-black transition-colors">Pricing</Link>
                    <Link href="#" className="hover:text-black transition-colors">Contact</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="#" className="hidden md:block text-sm font-medium hover:text-black">Log in</Link>
                    <Link
                        href="#"
                        className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
                    >
                        Book a Demo
                    </Link>
                    <button className="md:hidden p-2 text-slate-600">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
