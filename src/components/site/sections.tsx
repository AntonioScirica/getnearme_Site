'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Building2, Check, ChevronLeft, ChevronRight, Handshake, Heart, Leaf, Mail, MapPin, Menu, Phone, Quote, Search, ShieldCheck, Sparkles, Star, Users, X } from 'lucide-react';
import type { SiteConfig, SiteProperty } from '@/lib/siteTemplates';
import { Btn, Container, contacts, Eyebrow, Facts, H, Photo, price, SiteLink, typeOf, useSite, zoneOf, pathOf, type Filters, type Page } from './ui';
export type { Filters };

// Sezioni dei siti vetrina. Ogni sezione ha piu' varianti: il tema del template sceglie quale usare,
// cosi' i 5 siti condividono dati e logica ma hanno struttura e aspetto diversi.

const PRICES = [100000, 200000, 300000, 500000, 750000, 1000000];
export const tipiOf = (ps: SiteProperty[]) => [...new Set(ps.map(p => p.tipologia?.split('|')[0].trim()).filter(Boolean))] as string[];
export const isRent = (p: SiteProperty) => /affitt/i.test(p.contratto ?? '');
const heroSrc = (cfg: { heroImage: string }, ps: SiteProperty[]) => cfg.heroImage || ps[0]?.cover || '';
const initial = (s: string) => s.trim().slice(0, 1).toUpperCase();

export function statsOf(cfg: SiteConfig, properties: SiteProperty[]) {
  const zones = new Set(properties.map(p => p.addr?.split(',').slice(-1)[0]?.trim()).filter(Boolean)).size;
  return [
    cfg.years && { v: `${cfg.years}+`, l: 'Anni di esperienza' },
    cfg.sold && { v: `${cfg.sold}+`, l: 'Immobili venduti' },
    cfg.clients && { v: `${cfg.clients}+`, l: 'Clienti seguiti' },
    { v: String(properties.length), l: 'Immobili disponibili' },
    zones > 1 && { v: String(zones), l: 'Zone servite' },
  ].filter(Boolean).slice(0, 4) as { v: string; l: string }[];
}

// ---------- Barra in alto: 5 varianti ----------
const NAV: [string, Page][] = [['Home', { page: 'home' }], ['Immobili', { page: 'immobili' }]];
export function Header({ over }: { over?: boolean }) {
  const { cfg, name, logo, t } = useSite();
  const [open, setOpen] = useState(false);
  const links: [string, Page][] = [...NAV, [cfg.aboutTitle || 'Chi sono', { page: 'agente' }]];
  const light = over && t.header === 'over';
  const mark = logo
    ? <img src={logo} alt={name} className={`h-9 max-w-[170px] object-contain ${light ? 'brightness-0 invert' : ''}`} />
    : <span className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center text-white ${t.header === 'minimal' ? 'rounded-full bg-[var(--ink)]' : 'rounded-[calc(var(--r)*0.6)] bg-[var(--c)]'}`}><Building2 size={17} /></span>
        <span className={`truncate font-bold tracking-tight ${t.header === 'centered' ? 'font-[family-name:var(--font-serif-accent)] text-2xl font-normal' : 'text-[17px]'}`}>{name}</span>
      </span>;
  const navCls = light ? 'text-white/85 hover:text-white' : 'text-[var(--muted)] hover:text-[var(--fg)]';
  const nav = links.map(([l, to]) => <SiteLink key={l} to={to} className={`px-3.5 py-2 text-sm font-medium transition-colors ${navCls}`}>{l}</SiteLink>);
  const cta = cfg.showContact && (
    <Btn href="#contatti" size="sm" variant={light ? 'light' : t.header === 'minimal' ? 'ink' : 'solid'} className={`hidden !h-10 md:inline-flex ${t.header === 'pill' || t.header === 'minimal' ? '!rounded-full' : ''}`}>
      {t.header !== 'minimal' && <Phone size={14} />}{cfg.ctaLabel}{t.header === 'minimal' && <ArrowUpRight size={14} />}
    </Btn>
  );
  const burger = <button onClick={() => setOpen(v => !v)} className="md:hidden" aria-label="Menu">{open ? <X /> : <Menu />}</button>;
  const mobile = open && <div className="border-t border-[var(--line)] bg-[var(--bg)] px-6 py-4 text-[var(--fg)] md:hidden">{links.map(([l, to]) => <SiteLink key={l} to={to} className="block py-2.5 text-base font-medium">{l}</SiteLink>)}</div>;

  if (t.header === 'centered') return (
    <header className="relative z-30 bg-[var(--bg)]">
      <Container className="grid h-24 grid-cols-[1fr_auto_1fr] items-center">
        <nav className="hidden items-center md:flex">{nav}</nav>
        <SiteLink to={{ page: 'home' }}>{mark}</SiteLink>
        <div className="flex justify-end gap-3">{cta}{burger}</div>
      </Container>{mobile}
    </header>
  );
  if (t.header === 'pill') return (
    <header className="sticky top-0 z-30 pt-4">
      <Container>
        <div className="flex h-16 items-center gap-6 rounded-full bg-[var(--surface)]/85 px-3 pl-5 shadow-[0_10px_40px_-15px_rgba(22,22,58,.25)] ring-1 ring-[var(--line)] backdrop-blur-xl">
          <SiteLink to={{ page: 'home' }}>{mark}</SiteLink>
          <nav className="mx-auto hidden items-center md:flex">{nav}</nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">{cta}{burger}</div>
        </div>
      </Container>{mobile}
    </header>
  );
  return (
    <header className={light ? 'absolute inset-x-0 top-0 z-30 text-white' : `relative z-30 bg-[var(--bg)] ${t.header === 'plain' ? 'border-b border-[var(--line)]' : ''}`}>
      <Container className="flex h-20 items-center gap-6">
        <SiteLink to={{ page: 'home' }} className="min-w-0">{mark}</SiteLink>
        <nav className={`hidden items-center md:flex ${t.header === 'minimal' ? 'mx-auto' : 'ml-auto'}`}>{nav}</nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">{cta}{burger}</div>
      </Container>{mobile}
    </header>
  );
}

// ---------- Ricerca (Compra/Affitta, zona, tipologia, prezzo) ----------
export function SearchForm({ layout = 'bar' }: { layout?: 'bar' | 'stack' }) {
  const { properties, base, preview, go } = useSite();
  const [f, setF] = useState<Filters>({ contratto: 'vendita' });
  const tipi = tipiOf(properties);
  const hasRent = properties.some(isRent);
  const submit = (e: FormEvent) => { if (!preview) return; e.preventDefault(); go?.({ page: 'immobili', f }); };
  const label = 'mb-1 block text-[11px] font-medium text-[var(--muted)]';
  const input = 'h-10 w-full bg-transparent text-sm font-medium text-[var(--fg)] outline-none placeholder:text-[var(--muted)]/70';
  const fields = (
    <>
      <label className="block min-w-0 flex-[1.4]"><span className={label}>Zona</span>
        <span className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-[var(--c)]" /><input name="q" value={f.q ?? ''} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Città, quartiere, via" className={input} /></span>
      </label>
      <label className="block min-w-0 flex-1"><span className={label}>Tipologia</span>
        <select name="tipo" value={f.tipo ?? ''} onChange={e => setF({ ...f, tipo: e.target.value })} className={`${input} cursor-pointer`}><option value="">Tutte</option>{tipi.map(x => <option key={x}>{x}</option>)}</select>
      </label>
      <label className="block min-w-0 flex-1"><span className={label}>Prezzo massimo</span>
        <select name="max" value={f.max ?? ''} onChange={e => setF({ ...f, max: Number(e.target.value) || undefined })} className={`${input} cursor-pointer`}><option value="">Qualsiasi</option>{PRICES.map(v => <option key={v} value={v}>{price(v)}</option>)}</select>
      </label>
    </>
  );
  return (
    <form action={preview ? undefined : pathOf(base, { page: 'immobili' })} method="get" onSubmit={submit}>
      {hasRent && (
        <div className="mb-3 flex gap-1.5">
          {[['vendita', 'Compra'], ['affitto', 'Affitta']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setF({ ...f, contratto: v })}
              className={`rounded-[calc(var(--r)*0.6)] px-4 py-1.5 text-[13px] font-semibold transition-colors ${f.contratto === v ? 'bg-[var(--c)] text-white' : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--fg)]'}`}>{l}</button>
          ))}
          <input type="hidden" name="contratto" value={f.contratto} />
        </div>
      )}
      {layout === 'stack' ? (
        <div className="space-y-3">
          <div className="space-y-3 [&>label]:rounded-[calc(var(--r)*0.6)] [&>label]:border [&>label]:border-[var(--line)] [&>label]:px-3.5 [&>label]:py-2">{fields}</div>
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] text-sm font-semibold text-white transition hover:brightness-110"><Search size={16} /> Cerca</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--r)] bg-[var(--surface)] p-3 pl-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,.25)] ring-1 ring-black/[.04] md:flex-row md:items-center md:gap-5">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-5 md:[&>label+label]:border-l md:[&>label+label]:border-[var(--line)] md:[&>label+label]:pl-5">{fields}</div>
          <button type="submit" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[calc(var(--r)*0.7)] bg-[var(--c)] px-6 text-sm font-semibold text-white transition hover:brightness-110"><Search size={16} /> Cerca</button>
        </div>
      )}
    </form>
  );
}

// ---------- Apertura: 5 impostazioni ----------
export function Hero() {
  const { cfg, properties, t } = useSite();
  const src = heroSrc(cfg, properties);
  const trust = (cfg.clients || cfg.years) && (
    <div className="flex items-center gap-3 rounded-[calc(var(--r)*0.8)] bg-white/95 px-4 py-3 text-neutral-900 shadow-lg backdrop-blur">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_12%,white)] text-[var(--c)]"><Users size={17} /></span>
      <span><span className="block text-[11px] text-neutral-500">{cfg.clients ? 'Clienti seguiti' : 'Esperienza'}</span><span className="block text-base font-bold">{cfg.clients ? `${cfg.clients}+` : `${cfg.years} anni`}</span></span>
    </div>
  );
  const serif = cfg.font === 'serif';
  const title = <H as="h1" className={serif ? 'text-[clamp(3rem,6vw,5.4rem)]' : 'text-[clamp(2.5rem,5vw,4.4rem)]'}>{cfg.heroTitle}</H>;
  const sub = <p className="mt-5 max-w-lg text-[17px] leading-relaxed opacity-80">{cfg.heroSubtitle}</p>;

  if (t.hero === 'split') return (
    <section className="bg-[var(--soft)]">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div>
          <Eyebrow>{cfg.city ? `Immobili a ${cfg.city}` : 'La tua casa ti aspetta'}</Eyebrow>
          <div className="mt-4">{title}</div>{sub}
          <div className="relative z-10 mt-9 lg:-mr-40"><SearchForm /></div>
        </div>
        <div className="relative aspect-[4/3.4] overflow-hidden rounded-[calc(var(--r)*1.4)]">
          <Photo src={src} className="h-full" />
          <div className="absolute right-4 top-4">{trust}</div>
        </div>
      </Container>
    </section>
  );
  if (t.hero === 'full') return (
    <section className="relative">
      <div className="relative h-[660px] overflow-hidden text-white">
        <Photo src={src} className="h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <Container className="absolute inset-0 flex flex-col justify-center pb-16">
          {cfg.city && <span className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[var(--c)]"><Leaf size={13} /> {cfg.city}</span>}
          <div className="max-w-2xl">{title}</div>{sub}
          <SiteLink to={{ page: 'immobili' }} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold transition hover:bg-white hover:text-neutral-900">Guarda gli immobili <ArrowRight size={16} /></SiteLink>
        </Container>
      </div>
      <Container className="relative z-10 -mt-16"><div className="rounded-[calc(var(--r)*1.3)] bg-[var(--bg)] p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)]"><SearchForm /></div></Container>
    </section>
  );
  if (t.hero === 'card') return (
    <Container className="pt-6">
      <section className="relative overflow-hidden rounded-[calc(var(--r)*1.6)] text-white">
        <Photo src={src} className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/75 via-[var(--ink)]/25 to-transparent" />
        <div className="relative flex min-h-[620px] flex-col justify-between p-8 md:p-14">
          <div className="flex justify-end">{trust}</div>
          <div className="max-w-xl">{title}{sub}</div>
          <div className="mx-auto mt-10 w-full max-w-4xl"><SearchForm /></div>
        </div>
      </section>
    </Container>
  );
  if (t.hero === 'center') return (
    <section className="relative">
      <div className="relative flex h-[760px] items-center justify-center overflow-hidden text-center text-white">
        <Photo src={src} className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative -mt-24">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">{cfg.city || 'Immobili'}</div>
          <div className="mx-auto mt-5 max-w-4xl">{title}</div>
          <p className="mx-auto mt-5 max-w-xl text-[17px] opacity-85">{cfg.heroSubtitle}</p>
        </Container>
      </div>
      <Container className="relative z-10 -mt-44 space-y-3"><SearchForm /><Features compact /></Container>
    </section>
  );
  return (
    <Container className="pt-6">
      <section className="relative overflow-hidden rounded-[calc(var(--r)*1.6)] text-white">
        <Photo src={src} className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
        <div className="relative grid min-h-[620px] items-end gap-8 p-8 md:grid-cols-[1fr_360px] md:p-12">
          <div className="max-w-xl">
            {title}
            <SiteLink to={{ page: 'immobili' }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900">Tutti gli immobili <ArrowUpRight size={15} /></SiteLink>
          </div>
          <div className="self-center rounded-[var(--r)] bg-white p-6 text-neutral-900 shadow-2xl">
            <H className="text-3xl">Cosa stai cercando?</H>
            <p className="mb-5 mt-1 text-sm text-neutral-500">{cfg.heroSubtitle}</p>
            <SearchForm layout="stack" />
          </div>
        </div>
      </section>
    </Container>
  );
}

// ---------- Intro dopo l'apertura: 4 varianti (citta le mette dentro l'apertura) ----------
const FEATURES = [
  { i: ShieldCheck, t: 'Affidabilità', d: 'Ogni immobile verificato, documenti in ordine prima della visita.', tint: '#e7f0ff' },
  { i: Users, t: 'Consulenza vera', d: 'Un agente che ti segue di persona, non un call center.', tint: '#f3e8ff' },
  { i: Building2, t: 'Scelta selezionata', d: 'Poche case, quelle giuste: niente annunci fantasma.', tint: '#e8f7ef' },
  { i: Handshake, t: 'Fino al rogito', d: 'Trattativa, mutuo e notaio: ti accompagno in ogni passo.', tint: '#fff1e6' },
];
export function Features({ compact, pastel }: { compact?: boolean; pastel?: boolean }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${compact ? 'rounded-[var(--r)] bg-[var(--surface)] p-3 shadow-[0_20px_60px_-25px_rgba(0,0,0,.25)]' : ''}`}>
      {FEATURES.map(f => (
        <div key={f.t} className={`flex gap-3.5 p-4 ${compact ? '' : pastel ? 'rounded-[var(--r)] bg-[var(--surface)] shadow-[0_8px_30px_-12px_rgba(22,22,58,.12)]' : 'rounded-[var(--r)] bg-[var(--surface)] ring-1 ring-[var(--line)]'}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--c)]" style={{ background: pastel ? f.tint : 'color-mix(in srgb, var(--c) 12%, transparent)' }}><f.i size={19} /></span>
          <div><div className="text-sm font-semibold">{f.t}</div><div className="mt-0.5 text-[13px] leading-snug text-[var(--muted)]">{f.d}</div></div>
        </div>
      ))}
    </div>
  );
}

export function Intro() {
  const { t, cfg, name, properties } = useSite();
  if (t.intro === 'none') return null;
  if (t.intro === 'features' || t.intro === 'pastel') return <Container className="pt-14"><Features pastel={t.intro === 'pastel'} /></Container>;
  if (t.intro === 'welcome') return (
    <Container className="pt-16">
      <div className="grid items-center gap-10 rounded-[calc(var(--r)*1.3)] bg-[var(--soft)] p-6 md:grid-cols-2 md:p-10">
        <div className="relative">
          <Photo src={properties[1]?.cover || properties[0]?.cover} className="aspect-[4/3] rounded-[var(--r)] ring-4 ring-white" />
          <span className="absolute -left-3 -top-3 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[var(--c)] text-center text-[11px] font-semibold leading-tight text-white shadow-lg"><Sparkles size={18} className="mb-1" />Scelte<br />per te</span>
        </div>
        <div>
          <Eyebrow>Benvenuti da {name}</Eyebrow>
          <H className="mt-3 text-4xl md:text-5xl">Case scelte una per una, come le vorresti tu</H>
          <p className="mt-4 leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <SiteLink to={{ page: 'immobili' }} className="inline-flex items-center gap-2 rounded-full bg-[var(--c)] px-6 py-3 text-sm font-semibold text-white"><MapPin size={15} /> Esplora</SiteLink>
            <SiteLink to={{ page: 'agente' }} className="inline-flex items-center gap-1 text-sm font-semibold">{cfg.aboutTitle} <ArrowRight size={14} /></SiteLink>
          </div>
        </div>
      </div>
    </Container>
  );
  // trust: numeri grandi e frase, come nelle landing moderne
  const stats = statsOf(cfg, properties);
  return (
    <Container className="grid gap-10 pt-20 md:grid-cols-2 md:items-end">
      <div>
        <H className="text-5xl md:text-6xl">{stats[0]?.v ?? properties.length} {stats[0]?.l.toLowerCase() ?? 'immobili'}.</H>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex -space-x-2">{cfg.reviews.slice(0, 3).map((r, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--soft)] text-xs font-bold ring-2 ring-white">{initial(r.name)}</span>)}<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--c)] text-white ring-2 ring-white"><Star size={14} fill="currentColor" /></span></span>
          <span className="text-sm text-[var(--muted)]">Clienti che ci hanno scelto</span>
        </div>
      </div>
      <div>
        <p className="text-lg leading-relaxed">{cfg.aboutText}</p>
        <div className="mt-6 flex items-center gap-5">
          <SiteLink to={{ page: 'immobili' }} className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white">Tutti gli immobili</SiteLink>
          {cfg.showContact && <a href="#contatti" className="flex items-center gap-2 text-sm font-semibold">Richiedi una chiamata <ArrowRight size={15} /></a>}
        </div>
      </div>
    </Container>
  );
}

// ---------- Card immobile: 5 varianti ----------
export function PropertyCard({ p }: { p: SiteProperty }) {
  const { cfg, t } = useSite();
  const badge = <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-white">{isRent(p) ? 'In affitto' : 'In vendita'}</span>;
  const pr = cfg.showPrices && <span className="text-lg font-bold text-[var(--fg)]">{price(p.prezzo)}{isRent(p) && p.prezzo ? <span className="text-sm font-medium text-[var(--muted)]"> /mese</span> : null}</span>;
  const place = <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-[var(--muted)]"><MapPin size={13} className="shrink-0" />{zoneOf(p.addr)}</div>;
  const shell = 'group flex flex-col overflow-hidden rounded-[var(--r)] bg-[var(--surface)] transition-all duration-500 hover:-translate-y-1';

  if (t.card === 'minimal') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className="group block">
      <div className="relative"><Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3] rounded-[var(--r)]" /><span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900">{typeOf(p)}</span></div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="line-clamp-1 text-[17px] font-semibold">{p.titolo}</div>{place}</div>{pr}
      </div>
      <Facts p={p} className="mt-3 text-[var(--muted)]" />
    </SiteLink>
  );
  if (t.card === 'price') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className={`${shell} ring-1 ring-[var(--line)]`}>
      <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">{pr}<span className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-[var(--line)]"><Heart size={14} /></span></div>
        <div className="mt-2 line-clamp-1 text-[16px] font-semibold">{p.titolo}</div>{place}
        <Facts p={p} className="mt-4 text-[var(--muted)]" />
      </div>
    </SiteLink>
  );
  return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className={`${shell} shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-12px_rgba(0,0,0,.12)] ring-1 ring-[var(--line)] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,.2)]`}>
      <div className="relative">
        <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3]" />
        <div className="absolute left-3 top-3 flex gap-1.5">{badge}{t.card === 'badge' && <span className="rounded-[calc(var(--r)*0.5)] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-800">{typeOf(p)}</span>}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="line-clamp-1 text-[16px] font-semibold">{p.titolo}</div>{place}
        <Facts p={p} className="mt-3 border-t border-[var(--line)] pt-3 text-[var(--muted)]" />
        {t.card === 'button'
          ? <div className="mt-4 flex items-center justify-between">{pr}<span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c)] px-4 py-2 text-[13px] font-semibold text-white">Dettagli <ArrowRight size={14} /></span></div>
          : <div className="mt-4 flex items-center justify-between">{pr}{t.card === 'badge' ? <Heart size={18} className="text-[var(--muted)]" /> : <ArrowRight size={18} className="text-[var(--c)] transition-transform duration-500 group-hover:translate-x-1" />}</div>}
      </div>
    </SiteLink>
  );
}

// Riga lunga per le liste (template citta)
export function PropertyRow({ p }: { p: SiteProperty }) {
  const { cfg } = useSite();
  return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className="group grid gap-6 border-b border-[var(--line)] py-8 md:grid-cols-[340px_1fr_auto] md:items-center">
      <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3] rounded-[var(--r)]" />
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{typeOf(p)} · {isRent(p) ? 'Affitto' : 'Vendita'}</div>
        <H as="h3" className="mt-2 text-3xl">{p.titolo}</H>
        <div className="mt-2 flex items-center gap-1 text-sm text-[var(--muted)]"><MapPin size={14} />{p.addr}</div>
        <Facts p={p} className="mt-4 text-[var(--muted)]" />
      </div>
      <div className="flex items-center gap-5 md:flex-col md:items-end">
        {cfg.showPrices && <div className="text-2xl font-bold">{price(p.prezzo)}</div>}
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink)] text-white transition-transform duration-500 group-hover:rotate-45"><ArrowUpRight size={18} /></span>
      </div>
    </SiteLink>
  );
}

export function SectionHead({ eyebrow, title, sub, link, center }: { eyebrow?: string; title: string; sub?: string; link?: { label: string; to: Page }; center?: boolean }) {
  return (
    <div className={center ? 'flex flex-col items-center gap-5 text-center' : 'flex flex-wrap items-end justify-between gap-4'}>
      <div>{eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}<H className="text-3xl md:text-[2.7rem]">{title}</H>{sub && <p className={`mt-3 max-w-lg text-[var(--muted)] ${center ? 'mx-auto' : ''}`}>{sub}</p>}</div>
      {link && <SiteLink to={link.to} className={center ? 'inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold ring-1 ring-[var(--line)] hover:ring-[var(--fg)]' : 'inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--c)] hover:underline'}>{link.label} <ArrowRight size={15} /></SiteLink>}
    </div>
  );
}

// ---------- In evidenza: griglia, righe o carosello a seconda del template ----------
export function Featured() {
  const { properties, t, cfg } = useSite();
  const [off, setOff] = useState(0);
  const head = { eyebrow: 'I nostri immobili', title: t.results === 'rows' ? 'Selezionati per te' : 'In evidenza', sub: 'Le case disponibili adesso.', link: { label: 'Vedi tutti', to: { page: 'immobili' } as Page } };
  if (!properties.length) return <Container className="py-20"><SectionHead {...head} /><p className="mt-8 text-[var(--muted)]">Presto nuovi immobili.</p></Container>;
  if (t.results === 'rows') return <Container className="py-24"><SectionHead {...head} /><div className="mt-6 border-t border-[var(--line)]">{properties.slice(0, 4).map(p => <PropertyRow key={p.id} p={p} />)}</div></Container>;
  if (cfg.template === 'bosco') {
    const n = properties.length, show = [0, 1, 2].map(k => properties[(off + k) % n]).filter((p, k, a) => a.indexOf(p) === k);
    return (
      <Container className="py-24">
        <SectionHead {...head} center link={undefined} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">{show.map(p => <PropertyCard key={p.id} p={p} />)}</div>
        {n > 3 && <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setOff(o => (o - 1 + n) % n)} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-[var(--line)] hover:bg-[var(--surface)]"><ChevronLeft size={18} /></button>
          <button onClick={() => setOff(o => (o + 1) % n)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--c)] text-white"><ChevronRight size={18} /></button>
        </div>}
      </Container>
    );
  }
  const cols = cfg.template === 'prato' ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <Container className="py-24">
      <SectionHead {...head} center={cfg.template === 'nord'} />
      <div className={`mt-10 grid gap-6 sm:grid-cols-2 ${cols}`}>{properties.slice(0, cfg.template === 'prato' ? 8 : 6).map(p => <PropertyCard key={p.id} p={p} />)}</div>
    </Container>
  );
}

// ---------- Chi siamo: 5 varianti ----------
export function AboutBlock() {
  const { cfg, name, properties, t } = useSite();
  const stats = statsOf(cfg, properties);
  const photo = cfg.aboutImage || properties[1]?.cover || properties[0]?.cover;
  const more = <SiteLink to={{ page: 'agente' }} className="mt-8 inline-flex items-center gap-2 rounded-[min(var(--r),999px)] bg-[var(--c)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">Conoscimi meglio <ArrowRight size={15} /></SiteLink>;
  const checks = <ul className="mt-6 space-y-2.5 text-sm">{['Valutazione gratuita del tuo immobile', 'Foto e annunci curati', 'Assistenza fino al rogito'].map(x => <li key={x} className="flex items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--c)] text-white"><Check size={12} /></span>{x}</li>)}</ul>;

  if (t.about === 'dark') return (
    <section className="bg-[var(--ink)] py-24 text-white">
      <Container className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">{cfg.aboutTitle}</div>
          <H className="mt-5 text-5xl md:text-6xl">{name}</H>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">{cfg.aboutText}</p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">{stats.slice(0, 3).map(s => <div key={s.l}><div className="text-4xl font-bold">{s.v}</div><div className="mt-1 text-xs text-white/60">{s.l}</div></div>)}</div>
        </div>
        <Photo src={photo} className="aspect-[4/5] rounded-[var(--r)]" />
      </Container>
    </section>
  );
  if (t.about === 'card') return (
    <Container className="py-16">
      <div className="grid overflow-hidden rounded-[calc(var(--r)*1.3)] bg-[var(--ink)] text-white md:grid-cols-2">
        <Photo src={photo} className="min-h-[360px]" />
        <div className="p-10 md:p-14">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{cfg.aboutTitle}</div>
          <H className="mt-4 text-4xl md:text-5xl">{name}</H>
          <p className="mt-5 leading-relaxed text-white/75">{cfg.aboutText}</p>
          <div className="mt-8 flex flex-wrap gap-8">{stats.slice(0, 3).map(s => <div key={s.l}><div className="text-3xl font-semibold">{s.v}</div><div className="text-xs text-white/60">{s.l}</div></div>)}</div>
        </div>
      </div>
    </Container>
  );
  if (t.about === 'checklist') return (
    <Container className="grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.3fr]">
      <div><Eyebrow>Perché {name}</Eyebrow><H className="mt-3 text-4xl md:text-5xl">Più di un annuncio</H><p className="mt-5 leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>{checks}{more}</div>
      <Photo src={photo} className="aspect-[5/4] rounded-[calc(var(--r)*1.3)]" />
    </Container>
  );
  if (t.about === 'numbers') return (
    <Container className="py-24">
      <div className="grid gap-px overflow-hidden rounded-[var(--r)] bg-[var(--line)] md:grid-cols-4">
        {stats.map(s => <div key={s.l} className="bg-[var(--surface)] p-8"><H className="text-5xl">{s.v}</H><div className="mt-2 text-sm text-[var(--muted)]">{s.l}</div></div>)}
      </div>
      <div className="mt-14 grid items-center gap-10 md:grid-cols-[auto_1fr]">
        {cfg.aboutImage ? <Photo src={cfg.aboutImage} className="h-40 w-40 rounded-full" /> : <span className="flex h-40 w-40 items-center justify-center rounded-full bg-[var(--soft)] text-5xl font-bold">{initial(name)}</span>}
        <div><H className="text-3xl md:text-4xl">“{cfg.aboutText}”</H><SiteLink to={{ page: 'agente' }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">{name} · {cfg.agentRole} <ArrowRight size={14} /></SiteLink></div>
      </div>
    </Container>
  );
  return (
    <section className="bg-[var(--soft)] py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.35fr]">
        <div><Eyebrow>{cfg.aboutTitle}</Eyebrow><H className="mt-3 text-3xl md:text-[2.7rem]">{name}</H><p className="mt-5 leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>{checks}{more}</div>
        <div className="grid gap-4 sm:grid-cols-[1fr_190px]">
          <Photo src={photo} className="aspect-[4/3.2] rounded-[var(--r)] sm:aspect-auto sm:min-h-[400px]" />
          {cfg.showStats && <div className="grid grid-cols-2 gap-4 rounded-[var(--r)] bg-[var(--surface)] p-6 sm:grid-cols-1 sm:content-center">{stats.map(s => <div key={s.l}><div className="text-3xl font-bold tracking-tight text-[var(--c)]">{s.v}</div><div className="text-xs text-[var(--muted)]">{s.l}</div></div>)}</div>}
        </div>
      </Container>
    </section>
  );
}

// ---------- Recensioni: card o citazione grande a scorrimento ----------
export function Reviews() {
  const { cfg, t } = useSite();
  const [i, setI] = useState(0);
  if (!cfg.reviews.length) return null;
  if (t.reviews === 'quote') {
    const r = cfg.reviews[i % cfg.reviews.length];
    return (
      <Container className="py-24 text-center">
        <Quote size={34} className="mx-auto text-[var(--c)]" />
        <H className="mx-auto mt-8 max-w-4xl text-3xl md:text-5xl">“{r.text}”</H>
        <div className="mt-8 flex justify-center gap-0.5 text-[var(--c)]">{[0, 1, 2, 3, 4].map(s => <Star key={s} size={15} fill="currentColor" />)}</div>
        <div className="mt-3 font-semibold">{r.name}</div>
        {cfg.reviews.length > 1 && <div className="mt-8 flex justify-center gap-2">{cfg.reviews.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Recensione ${k + 1}`} className={`h-2 rounded-full transition-all duration-500 ${k === i % cfg.reviews.length ? 'w-8 bg-[var(--fg)]' : 'w-2 bg-[var(--line)]'}`} />)}</div>}
      </Container>
    );
  }
  return (
    <Container className="py-24">
      <SectionHead eyebrow="Recensioni" title="Cosa dicono i clienti" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {cfg.reviews.map((r, k) => (
          <figure key={k} className="flex flex-col rounded-[var(--r)] bg-[var(--surface)] p-7 ring-1 ring-[var(--line)]">
            <div className="flex gap-0.5 text-[var(--c)]">{[0, 1, 2, 3, 4].map(s => <Star key={s} size={14} fill="currentColor" />)}</div>
            <blockquote className="mt-4 flex-1 leading-relaxed">“{r.text}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft)] text-sm font-bold">{initial(r.name)}</span>
              <span className="text-sm font-semibold">{r.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}

// ---------- Zone ----------
export function Zones() {
  const { properties, preview, go, base } = useSite();
  const byZone = Object.entries(properties.reduce<Record<string, SiteProperty[]>>((a, p) => {
    const parts = p.addr?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    const z = parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1]; if (z) (a[z] ??= []).push(p); return a;
  }, {})).sort((a, b) => b[1].length - a[1].length).slice(0, 4);
  if (byZone.length < 2) return null;
  return (
    <Container className="pb-24">
      <SectionHead eyebrow="Dove lavoro" title="Cerca per zona" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {byZone.map(([z, ps]) => (
          <a key={z} href={preview ? undefined : pathOf(base, { page: 'immobili', f: { q: z } })} onClick={preview ? () => go?.({ page: 'immobili', f: { q: z } }) : undefined}
            className="group relative block aspect-[4/5] cursor-pointer overflow-hidden rounded-[var(--r)] text-white">
            <Photo src={ps[0].cover} zoom className="absolute inset-0 h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-5 left-5"><div className="text-xl font-semibold">{z}</div><div className="text-sm text-white/80">{ps.length} {ps.length === 1 ? 'immobile' : 'immobili'}</div></div>
          </a>
        ))}
      </div>
    </Container>
  );
}

// ---------- Fascia contatti: 4 varianti ----------
export function CtaBand() {
  const { cfg, t, properties } = useSite();
  const c = contacts(cfg);
  if (!cfg.showContact) return null;
  const buttons = (
    <div className="flex flex-wrap gap-3">
      {c.tel && <Btn href={c.tel} variant="light"><Phone size={15} /> {cfg.phone}</Btn>}
      {c.wa && <Btn href={c.wa} external variant="light">WhatsApp</Btn>}
      {c.mail && <Btn href={c.mail} variant="light"><Mail size={15} /> Email</Btn>}
      {!c.tel && !c.wa && !c.mail && <span className="text-sm text-white/80">Aggiungi telefono o email nell’editor.</span>}
    </div>
  );
  const text = <div><H className="text-3xl md:text-5xl">Pronto a trovare casa?</H><p className="mt-3 max-w-md text-white/80">Scrivimi o chiamami: rispondo di persona, senza impegno.</p></div>;
  if (t.cta === 'photo') return (
    <Container className="pb-24"><section id="contatti" className="relative overflow-hidden rounded-[calc(var(--r)*1.3)] px-8 py-20 text-center text-white md:px-16">
      <Photo src={properties[2]?.cover || properties[0]?.cover} className="absolute inset-0 h-full" /><div className="absolute inset-0 bg-[var(--ink)]/75" />
      <div className="relative flex flex-col items-center gap-8">{text}{buttons}</div>
    </section></Container>
  );
  if (t.cta === 'gradient') return (
    <Container className="pb-24"><section id="contatti" className="flex flex-col items-start justify-between gap-8 rounded-[calc(var(--r)*1.3)] px-8 py-14 text-white md:flex-row md:items-center md:px-14" style={{ background: 'linear-gradient(120deg, var(--c), color-mix(in srgb, var(--c) 55%, #a78bfa))' }}>{text}{buttons}</section></Container>
  );
  if (t.cta === 'ink') return (
    <section id="contatti" className="bg-[var(--ink)] py-24 text-white"><Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">{text}{buttons}</Container></section>
  );
  return (
    <Container className="pb-24"><section id="contatti" className="flex flex-col items-start justify-between gap-8 rounded-[calc(var(--r)*1.2)] bg-[var(--c)] px-8 py-12 text-white md:flex-row md:items-center md:px-12">{text}{buttons}</section></Container>
  );
}

// ---------- Piè di pagina: 4 varianti ----------
export function Footer() {
  const { cfg, name, properties, t } = useSite();
  const tipi = tipiOf(properties).slice(0, 4);
  const dark = t.footer === 'dark' || t.footer === 'ink';
  const bg = t.footer === 'dark' ? 'bg-[color-mix(in_srgb,var(--c)_25%,#08110c)] text-white' : t.footer === 'ink' ? 'bg-[#0b0b0f] text-white' : t.footer === 'soft' ? 'bg-[var(--soft)]' : 'border-t border-[var(--line)]';
  const mut = dark ? 'text-white/60' : 'text-[var(--muted)]';
  return (
    <footer className={bg}>
      {t.footer === 'light' && <Container className="pt-16"><div className="font-[family-name:var(--font-serif-accent)] text-[clamp(3rem,10vw,9rem)] leading-none tracking-tight">{name}</div></Container>}
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div><div className="text-lg font-bold">{name}</div><p className={`mt-3 max-w-xs text-sm ${mut}`}>{cfg.agentRole}{cfg.city ? ` a ${cfg.city}` : ''}. {cfg.heroSubtitle}</p></div>
        <div><div className="text-sm font-semibold">Link</div><div className={`mt-3 space-y-2 text-sm ${mut}`}>
          <SiteLink to={{ page: 'home' }} className="block hover:opacity-100">Home</SiteLink><SiteLink to={{ page: 'immobili' }} className="block">Immobili</SiteLink><SiteLink to={{ page: 'agente' }} className="block">{cfg.aboutTitle}</SiteLink>
        </div></div>
        <div><div className="text-sm font-semibold">Tipologie</div><div className={`mt-3 space-y-2 text-sm ${mut}`}>{tipi.length ? tipi.map(x => <div key={x}>{x}</div>) : <div>Case e appartamenti</div>}</div></div>
        <div><div className="text-sm font-semibold">Contatti</div><div className={`mt-3 space-y-2 text-sm ${mut}`}>
          {cfg.phone && <div className="flex items-center gap-2"><Phone size={14} />{cfg.phone}</div>}
          {cfg.email && <div className="flex items-center gap-2"><Mail size={14} />{cfg.email}</div>}
          {cfg.city && <div className="flex items-center gap-2"><MapPin size={14} />{cfg.city}</div>}
        </div></div>
      </Container>
      <Container className={`flex flex-wrap justify-between gap-2 border-t py-6 text-xs ${dark ? 'border-white/10 text-white/45' : 'border-[var(--line)] text-[var(--muted)]'}`}>
        <span>© {new Date().getFullYear()} {name}</span><span>Sito creato con Agente Immo</span>
      </Container>
    </footer>
  );
}

export { Facts, zoneOf };
