import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Pezzi comuni delle pagine per i proprietari (prezzi case per città, guide per chi vende, hub "Vendere casa"):
// testata con "Valuta gratis" e riquadri che portano alla valutazione gratuita (/it/quanto-vale-la-mia-casa).

export const VALUATION = '/it/quanto-vale-la-mia-casa#valuta';

export function HomeownerHeader({ href = VALUATION }: { href?: string }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
      <Link href="/it" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/immo/logo-mark.png" alt="Agente Immo" className="h-8 w-8" /><span className="whitespace-nowrap">Agente <span className="text-brand">Immo</span></span>
      </Link>
      <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">Valuta gratis <ArrowRight size={15} /></Link>
    </header>
  );
}

// riquadro chiaro dentro il testo (stessa forma dell'invito "Prova gratis" delle guide per agenti)
export function ValuationCard({ href = VALUATION, title = 'Scopri quanto vale la tua casa, gratis', text = 'Scrivi l\'indirizzo e rispondi a poche domande: la stima dalle quotazioni OMI della tua zona ti arriva per email in un minuto.', compact = false }: { href?: string; title?: string; text?: string; compact?: boolean }) {
  return (
    <Link href={href} className={`not-prose group my-10 flex items-center gap-5 rounded-[28px] bg-canvas p-3 pr-6 no-underline ring-1 ring-black/5 ease-smooth transition-shadow hover:shadow-md ${compact ? '' : 'mt-8'}`}>
      <span aria-hidden className={`${compact ? 'h-20 w-20' : 'h-24 w-24'} flex shrink-0 items-center justify-center rounded-[20px] bg-brand text-white`}>
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold leading-tight text-ink">{title}</span>
        <span className="mt-1 block text-sm text-muted">{text}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">Valuta gratis <ArrowRight size={14} className="ease-smooth transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

// riquadro scuro di chiusura pagina
export function ValuationAside({ href = VALUATION, title = 'Scopri quanto vale la tua casa', text = 'Un minuto, gratis, senza impegno. Parte dalle quotazioni OMI della tua zona e ti arriva per email.', note }: { href?: string; title?: string; text?: string; note?: string }) {
  return (
    <aside className="mt-16 rounded-[32px] bg-ink px-6 py-12 text-center text-white">
      <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-white/70">{text}</p>
      <Link href={href} className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink max-sm:w-full">Valuta la tua casa gratis <ArrowRight size={16} /></Link>
      {note && <p className="mt-6 text-xs text-white/50">{note}</p>}
    </aside>
  );
}
