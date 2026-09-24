'use client';

import { ArrowDown } from 'lucide-react';
import type { TemplateId } from '@/lib/siteTemplates';
import { About, Btn, Contact, Footer, H, heroImg, Listings, Nav, Stats, themeStyle, type SiteCtx, type Theme } from './parts';

// I 5 template della vetrina: stessi mattoni (parts.tsx), struttura e aspetto diversi.

const THEMES: Record<TemplateId, Theme> = {
  maison: { bg: '#f6f2ec', fg: '#1f1a16', muted: '#6f655c', line: '#e4dcd1', surface: '#fffdf9', radius: 2 },
  chiaro: { bg: '#ffffff', fg: '#0f172a', muted: '#64748b', line: '#e8edf3', surface: '#ffffff', radius: 22 },
  agente: { bg: '#f3f5f0', fg: '#1d2a20', muted: '#617064', line: '#dde3d8', surface: '#ffffff', radius: 28 },
  notte: { bg: '#0d0d0f', fg: '#f3efe8', muted: '#9a948a', line: '#26262a', surface: '#17171a', radius: 0, dark: true },
  rivista: { bg: '#fbfaf7', fg: '#111111', muted: '#6b6b6b', line: '#e6e3dc', surface: '#ffffff', radius: 6 },
};

const Photo = ({ src, className = '' }: { src: string; className?: string }) =>
  src ? <img src={src} alt="" className={`h-full w-full object-cover ${className}`} /> : <div className={`h-full w-full bg-[var(--line)] ${className}`} />;

// Maison: foto a tutto schermo, nome enorme in serif sopra, poi collezione in stile catalogo
function Maison(ctx: SiteCtx) {
  const { cfg } = ctx;
  return (
    <>
      <section className="relative h-[92vh] min-h-[560px] overflow-hidden text-white">
        <Photo src={heroImg(ctx)} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/55" />
        <Nav ctx={ctx} variant="overlay" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-14">
          <p className="max-w-md text-lg text-white/85">{cfg.heroSubtitle}</p>
          <H cfg={cfg} as="h1" className="mt-4 text-[clamp(3rem,11vw,9.5rem)] uppercase leading-[0.9]">{ctx.name}</H>
          <div className="mt-8 flex items-center justify-between border-t border-white/30 pt-5 text-sm text-white/80">
            <span>{cfg.heroTitle}</span><a href="#immobili" className="flex items-center gap-2">Scopri <ArrowDown size={14} /></a>
          </div>
        </div>
      </section>
      <Listings ctx={ctx} className="py-28" eyebrow="La collezione" title="Immobili selezionati" search="line" card="caption" layout="grid" />
      {cfg.showAbout && <div className="border-y border-[var(--line)] py-28"><About ctx={ctx} variant="split" /></div>}
      {cfg.showContact && <div className="py-28"><Contact ctx={ctx} variant="card" /></div>}
      <Footer ctx={ctx} />
    </>
  );
}

// Chiaro: titolo al centro, foto arrotondata grande con la ricerca sopra, numeri, griglia di card
function Chiaro(ctx: SiteCtx) {
  const { cfg } = ctx;
  return (
    <>
      <Nav ctx={ctx} variant="bar" />
      <section className="mx-auto max-w-6xl px-6 pt-20 text-center">
        {cfg.city && <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--c)_10%,transparent)] px-4 py-1.5 text-sm font-medium text-[var(--c)]">{cfg.city}</span>}
        <H cfg={cfg} as="h1" className="mx-auto mt-6 max-w-3xl text-5xl md:text-7xl">{cfg.heroTitle}</H>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--muted)]">{cfg.heroSubtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Btn href="#immobili">Guarda gli immobili</Btn>
          {cfg.showContact && <Btn href="#contatti" variant="outline">{cfg.ctaLabel}</Btn>}
        </div>
        <div className="mt-16 aspect-[16/8] overflow-hidden rounded-[calc(var(--r)*1.6)]"><Photo src={heroImg(ctx)} /></div>
      </section>
      {cfg.showStats && <div className="mx-auto max-w-6xl px-6 py-20"><Stats ctx={ctx} variant="row" /></div>}
      <div className="bg-[#f6f8fb] py-24"><Listings ctx={ctx} title="Immobili disponibili" search="pill" card="stacked" layout="grid" /></div>
      {cfg.showAbout && <div className="py-24"><About ctx={ctx} variant="split" /></div>}
      {cfg.showContact && <div className="pb-24"><Contact ctx={ctx} variant="card" /></div>}
      <Footer ctx={ctx} />
    </>
  );
}

// Agente: la persona prima delle case. Testo a sinistra, foto alta a destra, citazione, case in card grandi
function Agente(ctx: SiteCtx) {
  const { cfg } = ctx;
  return (
    <>
      <Nav ctx={ctx} variant="bar" />
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c)]">{cfg.city || 'Agente immobiliare'}</div>
          <H cfg={cfg} as="h1" className="mt-5 text-5xl md:text-7xl">{cfg.heroTitle}</H>
          <p className="mt-6 max-w-md text-lg text-[var(--muted)]">{cfg.heroSubtitle}</p>
          <div className="mt-8 flex gap-3">{cfg.showContact && <Btn href="#contatti">{cfg.ctaLabel}</Btn>}<Btn href="#immobili" variant="outline">Gli immobili</Btn></div>
          {cfg.showStats && <div className="mt-14"><Stats ctx={ctx} variant="cards" /></div>}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--r)*1.4)]">
          <Photo src={cfg.aboutImage || heroImg(ctx)} />
          <div className="absolute bottom-5 left-5 right-5 rounded-[var(--r)] bg-white/90 p-4 text-sm backdrop-blur-md">
            <div className="font-semibold text-neutral-900">{ctx.name}</div><div className="text-neutral-500">Ti seguo dalla visita al rogito</div>
          </div>
        </div>
      </section>
      {cfg.showAbout && <div className="bg-[var(--surface)] py-24"><About ctx={ctx} variant="quote" /></div>}
      <Listings ctx={ctx} className="py-24" eyebrow="Le mie case" title="Immobili che seguo" search="panel" card="overlay" layout="grid" />
      {cfg.showContact && <Contact ctx={ctx} variant="band" />}
      <Footer ctx={ctx} />
    </>
  );
}

// Notte: scuro, oro, lettere spaziate; immobili in righe alternate grandi
function Notte(ctx: SiteCtx) {
  const { cfg } = ctx;
  return (
    <>
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <Photo src={heroImg(ctx)} className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-black/40" />
        <Nav ctx={ctx} variant="overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-xs uppercase tracking-[0.5em] text-[var(--c)]">{cfg.city || 'Immobili di pregio'}</div>
          <H cfg={cfg} as="h1" className="mt-6 max-w-4xl text-5xl md:text-8xl">{cfg.heroTitle}</H>
          <p className="mt-6 max-w-lg text-[var(--muted)]">{cfg.heroSubtitle}</p>
          <a href="#immobili" className="mt-12 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--c)] text-[var(--c)] transition-colors duration-500 hover:bg-[var(--c)] hover:text-black"><ArrowDown size={18} /></a>
        </div>
      </section>
      <Listings ctx={ctx} className="py-28" eyebrow="Collezione" title="Residenze" search="line" card="row" layout="rows" />
      {cfg.showAbout && <div className="border-t border-[var(--line)] py-28"><About ctx={ctx} variant="quote" /></div>}
      {cfg.showContact && <div className="border-t border-[var(--line)] py-28"><Contact ctx={ctx} variant="card" /></div>}
      <Footer ctx={ctx} />
    </>
  );
}

// Rivista: testata centrata, titolo enorme su blocco colore, mosaico asimmetrico
function Rivista(ctx: SiteCtx) {
  const { cfg } = ctx;
  return (
    <>
      <Nav ctx={ctx} variant="centered" />
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pt-6 md:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col justify-between rounded-[var(--r)] bg-[var(--c)] p-8 text-white md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">N° {ctx.properties.length} · {cfg.city || 'Immobili'}</div>
          <H cfg={cfg} as="h1" className="mt-10 text-5xl md:text-7xl">{cfg.heroTitle}</H>
          <div className="mt-10 flex items-end justify-between gap-6">
            <p className="max-w-xs text-white/85">{cfg.heroSubtitle}</p>
            <a href="#immobili" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900"><ArrowDown size={18} /></a>
          </div>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-[var(--r)] md:aspect-auto"><Photo src={heroImg(ctx)} /></div>
      </section>
      {cfg.showStats && <div className="mx-auto max-w-6xl border-b border-[var(--line)] px-6 py-16"><Stats ctx={ctx} variant="row" /></div>}
      <Listings ctx={ctx} className="py-24" eyebrow="In questo numero" title="Da non perdere" search="panel" card="overlay" layout="mosaic" />
      {cfg.showAbout && <div className="bg-[var(--surface)] py-24"><About ctx={ctx} variant="split" /></div>}
      {cfg.showContact && <Contact ctx={ctx} variant="band" />}
      <Footer ctx={ctx} />
    </>
  );
}

const RENDER: Record<TemplateId, (ctx: SiteCtx) => React.ReactElement> = { maison: Maison, chiaro: Chiaro, agente: Agente, notte: Notte, rivista: Rivista };

export default function SiteRenderer(ctx: SiteCtx) {
  const T = RENDER[ctx.cfg.template];
  return <div style={themeStyle(THEMES[ctx.cfg.template], ctx.cfg)} className="min-h-screen scroll-smooth font-body antialiased"><T {...ctx} /></div>;
}
