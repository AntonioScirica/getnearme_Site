'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import AuthCta from '@/components/AuthCta';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { type Locale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

// Barra delle pagine secondarie (privacy, termini, cookie, blog, conferma email, password): la stessa della home
// (AgenteImmoLanding): pillola di vetro, voci Annunci / Social / Il tuo sito / Prezzi che portano alle sezioni
// della home, a destra solo Prova gratis (al login, poi la prova) o Dashboard se si e' gia' dentro.
export default function Navbar({ locale }: { locale: Locale | string }) {
  const lang = locale === 'en' ? 'en' : 'it';
  const en = lang === 'en';
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false); // tendina dei link su telefono
  const [logged, setLogged] = useState(false); // dentro: niente Accedi
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLogged(!!session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLogged(!!s?.user));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const links: [string, string][] = [['staging', en ? 'Listings' : 'Annunci'], ['video', 'Social'], ['sito', en ? 'Your website' : 'Il tuo sito'], ['prezzi', en ? 'Pricing' : 'Prezzi']];
  return (
    <header className="sticky top-0 z-40 pt-4 font-body text-ink">
      <ProgressiveBlur show={scrolled} fade={40} />
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4">
        <nav className="glass flex h-14 w-full items-center gap-1 rounded-full border px-2 pl-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)] sm:gap-2 sm:pl-4">
          {/* telefono: solo il marchio, la scritta da sm in su */}
          <Link href={`/${lang}`} aria-label="Agente Immo" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="hidden whitespace-nowrap font-display text-lg font-extrabold tracking-tight sm:inline">Agente <span className="text-brand">Immo</span></span>
          </Link>
          <div className="mx-auto hidden items-center gap-1 lg:flex">
            {links.map(([h, l]) => <Link key={h} href={`/${lang}#${h}`} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{l}</Link>)}
          </div>
          {!logged && <Link href={`/${lang}/accedi`} className="ml-auto flex h-10 shrink-0 items-center rounded-full px-3 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink sm:px-3.5 lg:ml-0">{en ? 'Sign in' : 'Accedi'}</Link>}
          <AuthCta locale={lang} href={`/${lang}/accedi?next=/${lang}/prova`} dashLabel="Dashboard"
            className={`group ${logged ? 'ml-auto' : ''} inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 text-sm font-semibold text-white ease-smooth transition-all hover:bg-black active:scale-[.98] sm:px-5 lg:ml-0`}>
            {en ? 'Try it free' : 'Prova gratis'} <ArrowRight size={16} className="ease-smooth transition-transform group-hover:translate-x-0.5" />
          </AuthCta>
          <button type="button" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="Menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink ease-smooth transition-colors hover:bg-canvas lg:hidden">{menu ? <X size={18} /> : <Menu size={18} />}</button>
        </nav>
        {/* tendina dei link su telefono, sotto la pillola */}
        {menu && <div className="glass blur-in absolute inset-x-4 top-full mt-2 flex flex-col rounded-[24px] border p-2 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)] lg:hidden">
          {links.map(([h, l]) => <Link key={h} href={`/${lang}#${h}`} onClick={() => setMenu(false)} className="flex h-12 items-center rounded-[16px] px-4 text-[15px] font-medium text-ink ease-smooth transition-colors hover:bg-canvas">{l}</Link>)}
        </div>}
      </div>
    </header>
  );
}
