'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import AuthCta from '@/components/AuthCta';
import { type Locale } from '@/lib/i18n';

// Barra delle pagine secondarie (privacy, termini, cookie, blog, conferma email, password): stessa pillola della
// landing di Agente Immo. Rimanda alla landing per prezzi e domande; lingue solo italiano e inglese.
// (La barra di GetNearMe con Esempi, sei lingue e sezioni della vecchia home e' nella storia git.)
export default function Navbar({ locale }: { locale: Locale | string }) {
  const lang = locale === 'en' ? 'en' : 'it';
  const en = lang === 'en';
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [[`/${lang}#prezzi`, en ? 'Pricing' : 'Prezzi'], [`/${lang}#domande`, en ? 'FAQ' : 'Domande']];
  return (
    <header className="sticky top-0 z-40 pt-4 font-body text-ink">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex h-14 w-full items-center gap-2 rounded-full border border-line bg-white/90 px-2 pl-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)] backdrop-blur">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="whitespace-nowrap font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
          </Link>
          <div className="mx-auto hidden items-center gap-1 md:flex">
            {links.map(([h, l]) => <Link key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink">{l}</Link>)}
            <span className="ml-2 flex h-9 items-center rounded-full bg-canvas p-1 text-xs font-semibold">
              {(['it', 'en'] as const).map(l => <Link key={l} href={`/${l}`} hrefLang={l} className={`flex h-7 items-center rounded-full px-2.5 uppercase ${lang === l ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</Link>)}
            </span>
          </div>
          <AuthCta locale={lang} href="/it/dashboard" dashLabel="Dashboard" className="ml-auto hidden px-3 text-sm font-semibold text-ink sm:block md:ml-0">{en ? 'Sign in' : 'Accedi'}</AuthCta>
          <Link href={`/${lang}#prova`} className="hidden h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 text-sm font-semibold text-white sm:inline-flex">{en ? 'Try it free' : 'Prova gratis'} <ArrowRight size={15} /></Link>
          <button type="button" onClick={() => setOpen(v => !v)} aria-label="Menu" className="ml-auto flex h-10 w-10 items-center justify-center rounded-full sm:ml-0 md:hidden">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </nav>
        {open && (
          <div className="mt-2 rounded-[24px] bg-white p-3 shadow-lg ring-1 ring-black/5 md:hidden">
            {links.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-[15px] font-medium hover:bg-canvas">{l}</Link>)}
            <Link href={`/it/dashboard`} className="block rounded-2xl px-4 py-3 text-[15px] font-medium hover:bg-canvas">{en ? 'Sign in' : 'Accedi'}</Link>
            <Link href={`/${lang}#prova`} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white sm:hidden">{en ? 'Try it free' : 'Prova gratis'} <ArrowRight size={15} /></Link>
            <div className="flex gap-2 px-4 py-2 text-sm">{(['it', 'en'] as const).map(l => <Link key={l} href={`/${l}`} className={lang === l ? 'font-semibold text-ink' : 'text-muted'}>{l === 'it' ? 'Italiano' : 'English'}</Link>)}</div>
          </div>
        )}
      </div>
    </header>
  );
}
