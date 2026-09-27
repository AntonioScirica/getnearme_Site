'use client';

import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Building, Building2, ChevronDown, Home, Store, TreePine, Warehouse, Check, ChevronLeft, ChevronRight, Handshake, Heart, Leaf, Mail, MapPin, Menu, Phone, Quote, Search, ShieldCheck, Sparkles, Star, Users, X } from 'lucide-react';
import { pageHidden, zoneSlug, type SiteConfig, type SiteProperty } from '@/lib/siteTemplates';
import { MapBlock, TopBar } from './extras';
import { Btn, Container, contacts, Eyebrow, Facts, FavButton, H, Photo, price, SiteLink, typeOf, useFavs, useSite, useT, zoneOf, pathOf, type Filters, type Page, Select } from './ui';
export type { Filters };

// Sezioni dei siti vetrina. Ogni sezione ha piu' varianti: il tema del template sceglie quale usare,
// cosi' i 5 siti condividono dati e logica ma hanno struttura e aspetto diversi.

const PRICES = [100000, 200000, 300000, 500000, 750000, 1000000];
export const tipiOf = (ps: SiteProperty[]) => [...new Set(ps.map(p => p.tipologia?.split('|')[0].trim()).filter(Boolean))] as string[];
export const isRent = (p: SiteProperty) => /affitt/i.test(p.contratto ?? '');
const heroSrc = (cfg: { heroImage: string }, ps: SiteProperty[]) => cfg.heroImage || ps[0]?.cover || '';
const initial = (s: string) => s.trim().slice(0, 1).toUpperCase();
// "Trova la casa giusta per te" -> ["Trova la casa", "giusta per te"]: la seconda parte va in corsivo
export function splitTitle(t: string): [string, string] {
  const i = t.indexOf(',');
  if (i > 0) return [t.slice(0, i + 1), t.slice(i + 1).trim()];
  const w = t.split(' ');
  const k = Math.max(1, Math.ceil(w.length / 2));
  return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
}
const Accent = ({ children, color }: { children: string; color?: boolean }) =>
  <span className={`font-[family-name:var(--font-serif-accent)] font-normal italic ${color ? 'text-[var(--c)]' : 'opacity-60'}`}>{children}</span>;
// primo paragrafo del testo "chi sono" (il resto, con i sottotitoli, sta nella pagina profilo)
export const introOf = (cfg: SiteConfig) => cfg.aboutText.split(/\n{2,}/)[0].replace(/^## .*$/gm, '').trim();

// numeri del profilo; "Mostra i numeri" spento = nessun numero, e i blocchi che li usano si riadattano
export function statsOf(cfg: SiteConfig, properties: SiteProperty[]) {
  if (!cfg.showStats) return [];
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
export function navLinks(cfg: SiteConfig): [string, Page][] {
  const all: [string, Page][] = [['Home', { page: 'home' }], ['Immobili', { page: 'immobili' }], ...(cfg.services.length ? [['Servizi', { page: 'servizi' }] as [string, Page]] : []), [cfg.aboutTitle || 'Chi sono', { page: 'agente' }], ['Contatti', { page: 'contatti' }]];
  return all.filter(([, to]) => !pageHidden(cfg, to.page)); // pagine nascoste: fuori dal menu e dal piè di pagina
}
// altezze minime, non fisse: con il logo piu' grande la barra cresce invece di tagliarlo
export function Header({ over }: { over?: boolean }) {
  const { cfg, name, logo: profileLogo, t, base, preview, go } = useSite();
  const logo = cfg.logo || profileLogo; // logo scelto nel sito, altrimenti quello del profilo
  const [open, setOpen] = useState(false);
  const links = navLinks(cfg);
  const favs = useFavs();
  const light = over && t.header === 'over';
  const mark = logo
    ? <img src={logo} alt={name} style={{ height: cfg.logoSize, maxWidth: cfg.logoSize * 6 }} className={`object-contain ${light ? 'brightness-0 invert' : ''}`} />
    : <span className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center text-white ${t.header === 'minimal' ? 'rounded-full bg-[var(--ink)]' : 'rounded-[calc(var(--r)*0.6)] bg-[var(--c)]'}`}><Building2 size={17} /></span>
        <span className={`truncate font-bold tracking-tight ${t.header === 'centered' ? 'font-[family-name:var(--font-serif-accent)] text-2xl font-normal' : 'text-[17px]'}`}>{name}</span>
      </span>;
  const navCls = light ? 'text-white/85 hover:text-white' : 'text-[var(--muted)] hover:text-[var(--fg)]';
  const nav = links.map(([l, to]) => <SiteLink key={l} to={to} className={`px-3.5 py-2 text-sm font-medium transition-colors ${navCls}`}>{l}</SiteLink>);
  const cta = cfg.showContact && !pageHidden(cfg, 'contatti') && (
    <span className="hidden md:block"><Btn href={preview ? undefined : pathOf(base, { page: 'contatti' })} onClick={preview ? () => go?.({ page: 'contatti' }) : undefined} size="sm" variant={light ? 'light' : t.header === 'minimal' ? 'ink' : 'solid'} className={`!h-10 ${t.header === 'pill' || t.header === 'minimal' ? '!rounded-full' : ''}`}>
      {t.header !== 'minimal' && <Phone size={14} />}{cfg.ctaLabel}{t.header === 'minimal' && <ArrowUpRight size={14} />}
    </Btn></span>
  );
  // cuore con il numero delle case salvate: porta a Immobili con i soli preferiti (compare dal primo salvataggio)
  const fav = favs.ids.length > 0 && !pageHidden(cfg, 'immobili') && (
    <SiteLink to={{ page: 'immobili', f: { fav: true } }} aria-label={`Preferiti (${favs.ids.length})`}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${light || t.header === 'drawer' ? 'text-white hover:bg-white/10' : 'hover:bg-[var(--soft)]'}`}>
      <Heart size={18} className="fill-rose-500 text-rose-500" />
      <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--c)] px-1 text-[10px] font-bold leading-none text-[var(--on-c,#fff)]">{favs.ids.length}</span>
    </SiteLink>
  );
  const burger = <button onClick={() => setOpen(v => !v)} className="md:hidden" aria-label="Menu">{open ? <X /> : <Menu />}</button>;
  const mobile = open && <div className="border-t border-[var(--line)] bg-[var(--bg)] px-6 py-4 text-[var(--fg)] md:hidden">{links.map(([l, to]) => <SiteLink key={l} to={to} className="block py-2.5 text-base font-medium">{l}</SiteLink>)}</div>;

  // drawer: barra scura, menu a sinistra che apre il pannello laterale (con le pagine zona), logo al centro
  if (t.header === 'drawer') return (
    <header className="relative z-30">
      <TopBar />
      <div className="bg-[var(--ink)] text-white">
        <Container className="grid min-h-[72px] py-3 grid-cols-[1fr_auto_1fr] items-center">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="flex w-fit items-center gap-2 text-sm font-medium"><Menu size={20} /> <span className="hidden md:inline">Menu</span></button>
          <SiteLink to={{ page: 'home' }}>{logo ? <img src={logo} alt={name} style={{ height: cfg.logoSize, maxWidth: cfg.logoSize * 6 }} className="object-contain brightness-0 invert" /> : <span className="text-xl font-bold tracking-tight">#{name.replace(/\s+/g, '')}</span>}</SiteLink>
          <div className="flex items-center justify-end gap-2">{fav}{cfg.showContact && <SiteLink to={{ page: 'contatti' }} className="hidden text-sm font-semibold text-[var(--c)] md:block">{cfg.ctaLabel}</SiteLink>}</div>
        </Container>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <nav className="h-full w-[85%] max-w-xs overflow-y-auto bg-[var(--ink)] p-7 text-white" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Chiudi" className="mb-8"><X /></button>
            {links.map(([l, to]) => <SiteLink key={l} to={to} className="block border-b border-white/10 py-3.5 text-[15px] font-medium hover:text-[var(--c)]">{l}</SiteLink>)}
            {cfg.zones.length > 0 && <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Zone</div>}
            {cfg.zones.map(z => <SiteLink key={z.name} to={{ page: 'zona', slug: zoneSlug(z.name) }} className="block py-2.5 text-sm text-white/80 hover:text-white">Casa a {z.name}</SiteLink>)}
          </nav>
        </div>
      )}
    </header>
  );

  if (t.header === 'centered') return (
    <header className="relative z-30 bg-[var(--bg)]">
      <TopBar />
      <Container className="grid min-h-24 py-3 grid-cols-[1fr_auto_1fr] items-center">
        <nav className="hidden items-center md:flex">{nav}</nav>
        <SiteLink to={{ page: 'home' }}>{mark}</SiteLink>
        <div className="flex justify-end gap-3">{fav}{cta}{burger}</div>
      </Container>{mobile}
    </header>
  );
  if (t.header === 'pill') return (
    <>
    <TopBar />
    <header className="sticky top-0 z-30 pt-4">
      <Container>
        <div className="flex min-h-16 items-center gap-6 rounded-full py-2 bg-[var(--surface)]/85 px-3 pl-5 shadow-[0_10px_40px_-15px_rgba(22,22,58,.25)] ring-1 ring-[var(--line)] backdrop-blur-xl">
          <SiteLink to={{ page: 'home' }}>{mark}</SiteLink>
          <nav className="mx-auto hidden items-center md:flex">{nav}</nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">{fav}{cta}{burger}</div>
        </div>
      </Container>{mobile}
    </header>
    </>
  );
  return (
    <header className={light ? 'absolute inset-x-0 top-0 z-30 text-white' : `relative z-30 bg-[var(--bg)] ${t.header === 'plain' ? 'border-b border-[var(--line)]' : ''}`}>
      <TopBar />
      <Container className="flex min-h-20 items-center gap-6 py-3">
        <SiteLink to={{ page: 'home' }} className="min-w-0">{mark}</SiteLink>
        <nav className={`hidden items-center md:flex ${t.header === 'minimal' ? 'mx-auto' : 'ml-auto'}`}>{nav}</nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">{fav}{cta}{burger}</div>
      </Container>{mobile}
    </header>
  );
}

// ---------- Ricerca (Compra/Affitta, zona, tipologia, prezzo) ----------
export function SearchForm({ layout = 'bar' }: { layout?: 'bar' | 'stack' | 'advanced' }) {
  const { properties, base, preview, go } = useSite();
  const [f, setF] = useState<Filters>({ contratto: 'vendita' });
  const [more, setMore] = useState(false);
  const tx = useT();
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
        <Select name="tipo" value={f.tipo ?? ''} onChange={e => setF({ ...f, tipo: e.target.value })} className={`${input} cursor-pointer`}><option value="">Tutte</option>{tipi.map(x => <option key={x}>{x}</option>)}</Select>
      </label>
      <label className="block min-w-0 flex-1"><span className={label}>Prezzo massimo</span>
        <Select name="max" value={f.max ?? ''} onChange={e => setF({ ...f, max: Number(e.target.value) || undefined })} className={`${input} cursor-pointer`}><option value="">Qualsiasi</option>{PRICES.map(v => <option key={v} value={v}>{price(v)}</option>)}</Select>
      </label>
    </>
  );
  if (layout === 'advanced') {
    const box = 'h-12 w-full rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--c)]';
    const cities = [...new Set(properties.map(p => p.addr?.split(',').slice(-1)[0]?.trim()).filter(Boolean))] as string[];
    return (
      <form action={preview ? undefined : pathOf(base, { page: 'immobili' })} method="get" onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_160px]">
        <input name="rif" value={f.rif ?? ''} onChange={e => setF({ ...f, rif: e.target.value })} placeholder="Codice immobile" className={`${box} hidden md:block`} />
        <Select name="tipo" value={f.tipo ?? ''} onChange={e => setF({ ...f, tipo: e.target.value })} className={box}><option value="">Tutte le tipologie</option>{tipi.map(x => <option key={x}>{x}</option>)}</Select>
        <Select name="q" value={f.q ?? ''} onChange={e => setF({ ...f, q: e.target.value })} className={box}><option value="">Tutte le città</option>{cities.map(x => <option key={x}>{x}</option>)}</Select>
        <Select name="max" value={f.max ?? ''} onChange={e => setF({ ...f, max: Number(e.target.value) || undefined })} className={box}><option value="">Prezzo massimo</option>{PRICES.map(v => <option key={v} value={v}>{price(v)}</option>)}</Select>
        <button type="submit" className="row-span-2 flex h-12 items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] text-sm font-bold uppercase tracking-wider text-[var(--on-c,#fff)] transition hover:brightness-105 md:h-full"><Search size={16} /> {tx('search.button')}</button>
        <Select name="camere" value={f.camere ?? ''} onChange={e => setF({ ...f, camere: Number(e.target.value) || undefined })} className={`${box} hidden md:block`}><option value="">N. camere</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+ camere</option>)}</Select>
        <Select name="bagni" value={f.bagni ?? ''} onChange={e => setF({ ...f, bagni: Number(e.target.value) || undefined })} className={`${box} hidden md:block`}><option value="">N. bagni</option>{[1, 2, 3].map(n => <option key={n} value={n}>{n}+ bagni</option>)}</Select>
        <Select name="contratto" value={f.contratto ?? ''} onChange={e => setF({ ...f, contratto: e.target.value })} className={`${box} hidden md:block`}><option value="">Vendita e affitto</option><option value="vendita">Vendita</option><option value="affitto">Affitto</option></Select>
        <span />
      </form>
    );
  }
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
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] text-sm font-semibold text-white transition hover:brightness-110"><Search size={16} /> {tx('search.button')}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--r)] bg-[var(--surface)] p-3 pl-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,.25)] ring-1 ring-black/[.04] md:flex-row md:items-center md:gap-5">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-5 md:[&>label+label]:border-l md:[&>label+label]:border-[var(--line)] md:[&>label+label]:pl-5">{fields}</div>
          <button type="submit" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[calc(var(--r)*0.7)] bg-[var(--c)] px-6 text-sm font-semibold text-white transition hover:brightness-110"><Search size={16} /> {tx('search.button')}</button>
        </div>
      )}

      {/* altri filtri, come nelle ricerche avanzate dei siti di agenzia */}
      <div className="mt-3">
        <button type="button" onClick={() => setMore(v => !v)} className="inline-flex items-center gap-1 text-[13px] font-semibold opacity-80 hover:opacity-100">{tx('search.more')} <ChevronDown size={14} className={`transition-transform ${more ? 'rotate-180' : ''}`} /></button>
        {more && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Select name="camere" value={f.camere ?? ''} onChange={e => setF({ ...f, camere: Number(e.target.value) || undefined })} className="h-11 rounded-[calc(var(--r)*0.6)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] outline-none ring-1 ring-[var(--line)]"><option value="">Camere</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+ camere</option>)}</Select>
            <Select name="bagni" value={f.bagni ?? ''} onChange={e => setF({ ...f, bagni: Number(e.target.value) || undefined })} className="h-11 rounded-[calc(var(--r)*0.6)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] outline-none ring-1 ring-[var(--line)]"><option value="">Bagni</option>{[1, 2, 3].map(n => <option key={n} value={n}>{n}+ bagni</option>)}</Select>
            <input name="rif" value={f.rif ?? ''} onChange={e => setF({ ...f, rif: e.target.value })} placeholder="Codice immobile" className="h-11 rounded-[calc(var(--r)*0.6)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] outline-none ring-1 ring-[var(--line)] placeholder:text-[var(--muted)]" />
          </div>
        )}
      </div>
    </form>
  );
}

// ---------- Apertura: 5 impostazioni ----------
export function Hero() {
  const { cfg, properties, t } = useSite();
  const tx = useT();
  const src = heroSrc(cfg, properties);
  const trust = cfg.showStats && (cfg.clients || cfg.years) && (
    <div className="flex items-center gap-3 rounded-[calc(var(--r)*0.8)] bg-white/95 px-4 py-3 text-neutral-900 shadow-lg backdrop-blur">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_12%,white)] text-[var(--c)]"><Users size={17} /></span>
      <span><span className="block text-[11px] text-neutral-500">{cfg.clients ? 'Clienti seguiti' : 'Esperienza'}</span><span className="block text-base font-bold">{cfg.clients ? `${cfg.clients}+` : `${cfg.years} anni`}</span></span>
    </div>
  );
  const serif = cfg.font === 'serif';
  const title = <H as="h1" className={serif ? 'text-[clamp(3rem,6vw,5.4rem)]' : 'text-[clamp(2.5rem,5vw,4.4rem)]'}>{cfg.heroTitle}</H>;
  const sub = <p className="mt-5 max-w-lg text-[17px] leading-relaxed opacity-80">{cfg.heroSubtitle}</p>;

  if (t.hero === 'editorial') {
    const [a, b] = splitTitle(cfg.heroTitle);
    return (
      <section>
        <Container className="pt-14 md:pt-20">
          <div className="flex items-end justify-between gap-8">
            <div>
              <H as="h1" className="text-[clamp(3.2rem,8vw,7rem)] leading-[0.98]">{a}<br /><Accent>{b}</Accent></H>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">{cfg.heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <SiteLink to={{ page: 'contatti' }} className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white">{tx('hero.cta2')}</SiteLink>
                <SiteLink to={{ page: 'immobili' }} className="rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-[var(--fg)]/30 hover:ring-[var(--fg)]">{tx('hero.cta')}</SiteLink>
              </div>
            </div>
            <SiteLink to={{ page: 'immobili' }} aria-label="Scorri" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-[var(--fg)]/30 md:flex"><ArrowDown size={18} /></SiteLink>
          </div>
        </Container>
        <div className="relative mt-14">
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[var(--ink)]" />
          <Container className="relative"><Photo src={src} className="aspect-[21/9] rounded-[var(--r)]" /></Container>
        </div>
        <div className="bg-[var(--ink)] pb-4 pt-10"><Container><SearchForm /></Container></div>
      </section>
    );
  }
  if (t.hero === 'tabs') return (
    <section className="relative">
      <div className="relative h-[640px] overflow-hidden text-white">
        <Photo src={src} className="h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <Container className="absolute inset-0 flex flex-col justify-center pb-20">
          <Eyebrow className="!text-[var(--c)]">{cfg.city ? `Immobili a ${cfg.city}` : tx('hero.eyebrow')}</Eyebrow>
          <H as="h1" className="mt-4 max-w-2xl text-[clamp(3rem,6vw,5.2rem)]">{cfg.heroTitle}</H>
          <p className="mt-5 max-w-lg text-[17px] text-white/80">{cfg.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SiteLink to={{ page: 'immobili' }} className="inline-flex items-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] px-6 py-3 text-sm font-semibold text-white">{tx('hero.cta')} <ArrowRight size={15} /></SiteLink>
            <SiteLink to={{ page: 'contatti' }} className="inline-flex items-center gap-2 rounded-[calc(var(--r)*0.6)] bg-white px-6 py-3 text-sm font-semibold text-neutral-900">Vuoi vendere?</SiteLink>
          </div>
        </Container>
      </div>
      <Container className="relative z-10 -mt-16"><div className="rounded-[var(--r)] bg-[var(--surface)] p-4 shadow-[0_30px_70px_-30px_rgba(0,0,0,.35)]"><SearchForm /></div></Container>
    </section>
  );
  if (t.hero === 'sky') {
    return (
      <section className="relative">
        <div className="relative flex h-[620px] items-start justify-center overflow-hidden text-center text-white">
          <Photo src={src} className="absolute inset-0 h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
          <div className="relative px-6 pt-36">
            <div className="font-[family-name:var(--font-serif-accent)] text-4xl italic md:text-5xl">Compra. Vendi. Affitta.</div>
            <H as="h1" className="mt-2 text-[clamp(2.6rem,5.5vw,4.6rem)]">{cfg.heroTitle}</H>
          </div>
        </div>
        <Container className="relative z-10 -mt-14 max-w-4xl"><div className="rounded-[calc(var(--r)*1.6)] bg-[var(--surface)] p-2 shadow-[0_25px_60px_-20px_rgba(15,23,42,.3)] [&_form>div:last-child]:shadow-none [&_form>div:last-child]:ring-0"><SearchForm /></div></Container>
      </section>
    );
  }
  if (t.hero === 'bento') return (
    <Container className="pt-12">
      <div className="grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
        <H as="h1" className="text-[clamp(2.6rem,5.2vw,4.4rem)]">{cfg.heroTitle}</H>
        <div className="md:text-right">
          <p className="text-lg leading-snug">{cfg.heroSubtitle}</p>
          <SiteLink to={{ page: 'immobili' }} className="mt-5 inline-flex items-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">{tx('hero.cta')} <ArrowUpRight size={15} /></SiteLink>
        </div>
      </div>
      <div className="relative mt-10 h-[560px] overflow-hidden rounded-[calc(var(--r)*1.4)]">
        <Photo src={src} className="h-full" />
        <div className="absolute bottom-8 left-8 right-8 max-w-4xl rounded-[var(--r)] bg-[var(--surface)] p-4 shadow-2xl"><SearchForm /></div>
      </div>
    </Container>
  );
  if (t.hero === 'banner') return (
    <section>
      <div className="relative flex h-[520px] items-center justify-center overflow-hidden text-center text-white">
        <Photo src={src} className="absolute inset-0 h-full" /><div className="absolute inset-0 bg-black/30" />
        <div className="relative px-6 [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">
          <div className="font-[family-name:var(--font-serif-accent)] text-3xl italic md:text-4xl">{cfg.city ? 'Benvenuti a' : 'Benvenuti'}</div>
          <div className="mt-1 font-display text-[clamp(3.2rem,9vw,7rem)] font-extrabold uppercase leading-none tracking-tight">{cfg.city || cfg.heroTitle}</div>
          <p className="mx-auto mt-4 max-w-md text-lg">{cfg.city ? cfg.heroTitle : cfg.heroSubtitle}</p>
        </div>
      </div>
      <div className="border-b border-[var(--line)] bg-[var(--soft)] py-6"><Container><SearchForm layout="advanced" /></Container></div>
    </section>
  );
  if (t.hero === 'split') return (
    <section className="bg-[var(--soft)]">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div>
          <Eyebrow>{cfg.city ? `Immobili a ${cfg.city}` : tx('hero.eyebrow')}</Eyebrow>
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
          <SiteLink to={{ page: 'immobili' }} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold transition hover:bg-white hover:text-neutral-900">{tx('hero.cta')} <ArrowRight size={16} /></SiteLink>
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
            <SiteLink to={{ page: 'immobili' }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900">{tx('hero.cta')} <ArrowUpRight size={15} /></SiteLink>
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
const FEATURE_ICONS = [ShieldCheck, Users, Building2, Handshake];
const TINTS = ['#e7f0ff', '#f3e8ff', '#e8f7ef', '#fff1e6'];
function useFeatures() {
  const tx = useT();
  return FEATURE_ICONS.map((i, k) => ({ i, t: tx(`feature.${k + 1}.title`), d: tx(`feature.${k + 1}.text`), tint: TINTS[k] }));
}
export function Features({ compact, pastel }: { compact?: boolean; pastel?: boolean }) {
  const FEATURES = useFeatures();
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
  const tx = useT();
  if (t.intro === 'none') return null;
  if (t.intro === 'services') {
    const [a, b] = ['I miei', 'servizi'];
    return (
      <section className="bg-[var(--ink)] pb-24 pt-16 text-white">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div><H className="text-4xl md:text-5xl">{a} <Accent>{b}</Accent></H><p className="mt-3 max-w-md text-sm text-white/60">Dalla valutazione al rogito, ogni passaggio seguito di persona.</p></div>
            <SiteLink to={{ page: 'servizi' }} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-white/40 hover:bg-white hover:text-[var(--ink)]">Tutti i servizi</SiteLink>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {cfg.services.slice(0, 3).map((x, i) => (
              <div key={i}>
                <Photo src={properties[i]?.cover} className="aspect-[4/3.6] rounded-[var(--r)]" />
                <div className="mt-5 text-lg font-semibold">{x.title}</div>
                <p className="mt-2 line-clamp-2 text-sm text-white/60">{x.text}</p>
                <SiteLink to={{ page: 'servizi' }} className="mt-5 inline-flex rounded-full px-4 py-2 text-xs ring-1 ring-white/40 hover:bg-white hover:text-[var(--ink)]">Scopri il servizio</SiteLink>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }
  if (t.intro === 'categories') {
    const icon = (x: string) => /villa|indipend|rustico|casale/i.test(x) ? Home : /loft|capannone/i.test(x) ? Warehouse : /negozio|ufficio|commerc/i.test(x) ? Store : /terreno/i.test(x) ? TreePine : /attico|mansarda/i.test(x) ? Building : Building2;
    // sempre 5: prima le tipologie presenti, poi le piu' cercate
    const tipi = [...new Set([...tipiOf(properties), 'Appartamento', 'Villa', 'Attico', 'Casa indipendente', 'Loft'])].slice(0, 5);
    return (
      <Container className="pt-14">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {tipi.map(x => { const I = icon(x); const n = properties.filter(p => p.tipologia?.startsWith(x)).length; return (
            <SiteLink key={x} to={{ page: 'immobili', f: { tipo: x } }} className="group flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--soft)] text-[var(--c)] transition-colors duration-500 group-hover:bg-[var(--c)] group-hover:text-white"><I size={24} /></span>
              <span className="mt-3 text-sm font-semibold">{x}</span><span className="text-xs text-[var(--muted)]">{n} {n === 1 ? 'immobile' : 'immobili'}</span>
            </SiteLink>
          ); })}
        </div>
      </Container>
    );
  }
  if (t.intro === 'bento') {
    const stats = statsOf(cfg, properties);
    return (
      <Container className="pt-20">
        <div className="text-sm text-[var(--muted)]">Chi è {name}</div>
        <H className="mt-2 text-4xl md:text-5xl">Al tuo fianco, dalla ricerca al rogito</H>
        <div className={`mt-10 grid gap-4 ${stats.length ? 'lg:grid-cols-[1.2fr_1fr]' : ''}`}>
          <div className="rounded-[var(--r)] bg-[var(--surface)] p-6 ring-1 ring-[var(--line)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-sm"><div className="text-lg font-semibold">Trova la casa giusta vicino a te</div><p className="mt-2 text-sm text-[var(--muted)]">{introOf(cfg)}</p></div>
              <SiteLink to={{ page: 'immobili' }} className="inline-flex items-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--ink)] px-4 py-2.5 text-xs font-semibold text-white">Immobili in zona <ArrowUpRight size={14} /></SiteLink>
            </div>
            <div className="mt-5"><MapBlock addr={cfg.city || properties[0]?.addr || 'Italia'} bare /></div>
          </div>
          {stats.length > 0 && <div className="grid grid-cols-2 gap-4">
            {stats.map(x => (
              <div key={x.l} className="flex flex-col justify-between rounded-[var(--r)] bg-[var(--surface)] p-6 ring-1 ring-[var(--line)]">
                <div className="flex items-start justify-between"><span className="text-4xl font-bold tracking-tight md:text-5xl">{x.v}</span><ArrowUpRight size={18} className="text-[var(--muted)]" /></div>
                <span className="mt-8 text-sm">{x.l}</span>
              </div>
            ))}
          </div>}
        </div>
      </Container>
    );
  }
  if (t.intro === 'text') return (
    <Container className="pt-20 text-center">
      <H className="mx-auto max-w-3xl text-3xl md:text-[2.6rem]">{name} — {cfg.agentRole}{cfg.city ? ` a ${cfg.city}` : ''}</H>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">{cfg.heroSubtitle}</p>
      {cfg.zones[0] && <SiteLink to={{ page: 'zona', slug: zoneSlug(cfg.zones[0].name) }} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c)]">Scopri {cfg.zones[0].name} <ArrowRight size={15} /></SiteLink>}
    </Container>
  );
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
          <H className="mt-3 text-4xl md:text-5xl">{tx('intro.title')}</H>
          <p className="mt-4 leading-relaxed text-[var(--muted)]">{introOf(cfg)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <SiteLink to={{ page: 'immobili' }} className="inline-flex items-center gap-2 rounded-full bg-[var(--c)] px-6 py-3 text-sm font-semibold text-white"><MapPin size={15} /> {tx('intro.button')}</SiteLink>
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
        <H className="text-5xl md:text-6xl">{stats[0] ? `${stats[0].v} ${stats[0].l.toLowerCase()}.` : 'Case scelte con cura.'}</H>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex -space-x-2">{cfg.reviews.slice(0, 3).map((r, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--soft)] text-xs font-bold ring-2 ring-white">{initial(r.name)}</span>)}<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--c)] text-white ring-2 ring-white"><Star size={14} fill="currentColor" /></span></span>
          <span className="text-sm text-[var(--muted)]">Clienti che ci hanno scelto</span>
        </div>
      </div>
      <div>
        <p className="text-lg leading-relaxed">{introOf(cfg)}</p>
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
  const { cfg, t, name } = useSite();
  const riv = cfg.template === 'riviera';
  const badge = <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-white">{isRent(p) ? 'In affitto' : 'In vendita'}</span>;
  const pr = cfg.showPrices && <span className="shrink-0 whitespace-nowrap text-lg font-bold text-[var(--fg)]">{price(p.prezzo)}{isRent(p) && p.prezzo ? <span className="text-sm font-medium text-[var(--muted)]"> /mese</span> : null}</span>;
  const place = <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-[var(--muted)]"><MapPin size={13} className="shrink-0" />{zoneOf(p.addr)}</div>;
  const shell = 'group flex flex-col overflow-hidden rounded-[var(--rc)] bg-[var(--surface)] transition-all duration-500 hover:-translate-y-1';

  if (t.card === 'minimal') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className="group block">
      <div className="relative"><Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3] rounded-[var(--rc)]" /><span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900">{typeOf(p)}</span><FavButton id={p.id} className="absolute right-3 top-3" /></div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="line-clamp-2 text-[17px] font-semibold leading-snug">{p.titolo}</div>{place}</div>{pr}
      </div>
      <Facts p={p} className="mt-3 text-[var(--muted)]" />
    </SiteLink>
  );
  if (t.card === 'label') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className={`${shell} shadow-[0_1px_2px_rgba(0,0,0,.04),0_14px_34px_-18px_rgba(15,23,42,.2)] ring-1 ring-[var(--line)]`}>
      <div className="relative">
        <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3]" />
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-900">{typeOf(p)}</span>
        <FavButton id={p.id} className="absolute right-3 top-3 !h-8 !w-8 !bg-black/35 !text-white backdrop-blur" />
        <span className="absolute bottom-3 left-3 rounded-[calc(var(--r)*0.4)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-white">{isRent(p) ? 'In affitto' : 'In vendita'}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="line-clamp-2 min-h-[2.75em] text-[16px] font-bold leading-snug">{p.titolo}</div>{place}
        <Facts p={p} className="mt-3 text-[var(--muted)]" />
        <div className="mt-4 flex items-end justify-between border-t border-[var(--line)] pt-4">
          {cfg.showPrices ? <div><div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Prezzo</div><div className="text-xl font-bold text-[var(--c)]">{price(p.prezzo)}{isRent(p) && p.prezzo ? <span className="text-sm font-medium text-[var(--muted)]">/mese</span> : null}</div></div> : <span />}
          <span className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--r)*0.5)] bg-[var(--soft)] text-[var(--c)] transition-transform duration-500 group-hover:translate-x-0.5"><ArrowRight size={16} /></span>
        </div>
      </div>
    </SiteLink>
  );
  if (t.card === 'clean') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className="group block">
      <div className="relative">
        <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3] rounded-[var(--rc)]" />
        <div className="absolute right-3 top-3 flex gap-1.5">{['In evidenza', isRent(p) ? 'Affitto' : 'Vendita'].map(x => <span key={x} className="rounded-[calc(var(--r)*0.4)] bg-white/25 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">{x}</span>)}</div>
        <FavButton id={p.id} className="absolute left-3 top-3 !h-8 !w-8" />
      </div>
      <div className="mt-4 line-clamp-2 text-xl font-semibold leading-snug tracking-tight">{p.titolo}</div>
      <div className="mt-1.5 flex items-center gap-1 text-sm text-[var(--muted)]"><MapPin size={14} />{zoneOf(p.addr)}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><Facts p={p} className="text-[var(--muted)]" />{pr}</div>
    </SiteLink>
  );
  if (t.card === 'price') return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className={`${shell} ring-1 ring-[var(--line)]`}>
      <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">{pr}<FavButton id={p.id} className="!bg-transparent ring-1 ring-[var(--line)] !shadow-none" /></div>
        <div className="mt-2 line-clamp-2 min-h-[2.75em] text-[16px] font-semibold leading-snug">{p.titolo}</div>{place}
        <Facts p={p} className="mt-4 text-[var(--muted)]" />
      </div>
    </SiteLink>
  );
  return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className={`${shell} shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_32px_-12px_rgba(0,0,0,.12)] ring-1 ring-[var(--line)] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,.2)]`}>
      <div className="relative">
        <Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3]" />
        <div className="absolute left-3 top-3 flex gap-1.5">{riv ? <span className="rounded-[calc(var(--r)*0.5)] bg-[#e5533d] px-2.5 py-1 text-[11px] font-bold uppercase text-white">In evidenza</span> : badge}{t.card === 'badge' && <span className="rounded-[calc(var(--r)*0.5)] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-800">{typeOf(p)}</span>}</div>
        <FavButton id={p.id} className="absolute bottom-3 right-3" />
        {riv && <span className="absolute right-3 top-3 rounded-[calc(var(--r)*0.5)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-bold uppercase text-[var(--on-c,#fff)]">{isRent(p) ? 'Affitto' : 'Disponibile'}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="line-clamp-2 min-h-[2.75em] text-[16px] font-semibold leading-snug">{p.titolo}</div>{place}
        <Facts p={p} className="mt-3 border-t border-[var(--line)] pt-3 text-[var(--muted)]" />
        {t.card === 'button'
          ? <div className="mt-4 flex items-center justify-between">{pr}<span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c)] px-4 py-2 text-[13px] font-semibold text-white">Dettagli <ArrowRight size={14} /></span></div>
          : <div className="mt-4 flex items-center justify-between">{pr}{t.card === 'badge' ? <ArrowUpRight size={18} className="text-[var(--muted)]" /> : <ArrowRight size={18} className="text-[var(--c)] transition-transform duration-500 group-hover:translate-x-1" />}</div>}
        {riv && (
          <div className="mt-4 flex items-center gap-2.5 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
            {cfg.aboutImage ? <Photo src={cfg.aboutImage} className="h-7 w-7 rounded-full" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--soft)] text-[11px] font-bold text-[var(--fg)]">{initial(name)}</span>}
            <span className="font-medium text-[var(--fg)]">{name}</span>
            {p.createdAt && <span className="ml-auto">{new Date(p.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          </div>
        )}
      </div>
    </SiteLink>
  );
}

// Riga lunga per le liste (template citta)
export function PropertyRow({ p }: { p: SiteProperty }) {
  const { cfg } = useSite();
  return (
    <SiteLink to={{ page: 'immobile', id: p.id }} className="group grid gap-6 border-b border-[var(--line)] py-8 md:grid-cols-[340px_1fr_auto] md:items-center">
      <div className="relative"><Photo src={p.cover} alt={p.titolo} zoom className="aspect-[4/3] rounded-[var(--rc)]" /><FavButton id={p.id} className="absolute right-3 top-3" /></div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{typeOf(p)} · {isRent(p) ? 'Affitto' : 'Vendita'}</div>
        <H as="h3" className="mt-2 text-3xl">{p.titolo}</H>
        <div className="mt-2 flex items-center gap-1 text-sm text-[var(--muted)]"><MapPin size={14} />{(p.details as { mostra_indirizzo?: boolean } | undefined)?.mostra_indirizzo ? p.addr : zoneOf(p.addr)}</div>
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
  const tx = useT();
  const [off, setOff] = useState(0);
  const head = { eyebrow: tx('featured.eyebrow'), title: tx('featured.title'), sub: tx('featured.sub'), link: { label: tx('featured.link'), to: { page: 'immobili' } as Page } };
  if (!properties.length) return <Container className="py-20"><SectionHead {...head} /><p className="mt-8 text-[var(--muted)]">Presto nuovi immobili.</p></Container>;
  if (t.results === 'rows') return <Container className="py-24"><SectionHead {...head} /><div className="mt-6 border-t border-[var(--line)]">{properties.slice(0, 4).map(p => <PropertyRow key={p.id} p={p} />)}</div></Container>;
  if (t.featured === 'chips') return <FeaturedChips />;
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

// In evidenza con filtro rapido a chip per tipologia e titolo con parola in corsivo colorato
function FeaturedChips() {
  const { properties } = useSite();
  const tx = useT();
  const [ta, tb] = splitTitle(tx('intro.title'));
  const [tipo, setTipo] = useState('');
  const tipi = tipiOf(properties);
  const list = properties.filter(p => !tipo || p.tipologia?.startsWith(tipo)).slice(0, 6);
  return (
    <Container className="py-24">
      <H className="mx-auto max-w-2xl text-center text-4xl md:text-5xl">{ta} <Accent color>{tb}</Accent></H>
      <div className="mt-10 flex justify-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {['', ...tipi].map(x => (
          <button key={x || 'tutti'} onClick={() => setTipo(x)} className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${tipo === x ? 'bg-[var(--ink)] text-white' : 'bg-[var(--soft)] text-[var(--fg)] hover:bg-[var(--line)]'}`}>{x || 'Tutti'}</button>
        ))}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map(p => <PropertyCard key={p.id} p={p} />)}</div>
      <div className="mt-10 text-center"><SiteLink to={{ page: 'immobili', f: tipo ? { tipo } : undefined }} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ring-1 ring-[var(--line)] hover:ring-[var(--fg)]">{tx('featured.link')} <ArrowRight size={15} /></SiteLink></div>
    </Container>
  );
}

// ---------- Chi siamo: 7 varianti ----------
export function AboutBlock() {
  const { cfg, name, properties, t } = useSite();
  const tx = useT();
  const FEATURES = useFeatures();
  const stats = statsOf(cfg, properties);
  const photo = cfg.aboutImage || properties[1]?.cover || properties[0]?.cover;
  const more = <SiteLink to={{ page: 'agente' }} className="mt-8 inline-flex items-center gap-2 rounded-[min(var(--r),999px)] bg-[var(--c)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">{tx('about.cta')} <ArrowRight size={15} /></SiteLink>;
  const checks = <ul className="mt-6 space-y-2.5 text-sm">{[tx('about.check.1'), tx('about.check.2'), tx('about.check.3')].filter(Boolean).map(x => <li key={x} className="flex items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--c)] text-white"><Check size={12} /></span>{x}</li>)}</ul>;

  if (t.about === 'why') return (
    <section className="bg-[var(--soft)] py-24">
      <Container className="grid items-center gap-12 md:grid-cols-2">
        <Photo src={photo} className="aspect-[5/4] rounded-[var(--r)]" />
        <div>
          <Eyebrow>Perché scegliermi</Eyebrow>
          <H className="mt-3 text-4xl md:text-5xl">Perché scegliere {name}?</H>
          <p className="mt-4 text-[var(--muted)]">{introOf(cfg)}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(f => <div key={f.t} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_15%,white)] text-[var(--c)]"><f.i size={17} /></span><div><div className="text-sm font-semibold">{f.t}</div><div className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{f.d}</div></div></div>)}
          </div>
        </div>
      </Container>
    </section>
  );
  if (t.about === 'numbered') {
    const r = cfg.reviews[0];
    return (
      <Container className="grid items-center gap-16 py-24 md:grid-cols-2">
        <div className="relative pb-10 pr-10">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--c)_14%,white)]" />
          <Photo src={photo} className="relative aspect-[4/3.2] rounded-[calc(var(--r)*1.2)]" />
          {r && <div className="absolute bottom-0 right-0 max-w-[260px] rounded-[var(--r)] bg-[var(--surface)] p-5 shadow-2xl"><div className="flex gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map(k => <Star key={k} size={14} fill="currentColor" />)}</div><p className="mt-2 text-sm font-semibold leading-snug">“{r.text.slice(0, 90)}{r.text.length > 90 ? '…' : ''}”</p><div className="mt-2 text-xs text-[var(--muted)]">— {r.name}</div></div>}
        </div>
        <div>
          <H className="text-4xl md:text-5xl">Perché scegliere {name}?</H>
          <ol className="mt-8 space-y-6">
            {FEATURES.slice(0, 3).map((f, i) => <li key={f.t} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--soft)] text-sm font-bold text-[var(--c)]">{i + 1}</span><div><div className="font-semibold">{f.t}</div><div className="mt-1 text-sm text-[var(--muted)]">{f.d}</div></div></li>)}
          </ol>
          <SiteLink to={{ page: 'agente' }} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c)]">{tx('about.cta')} <ArrowRight size={15} /></SiteLink>
        </div>
      </Container>
    );
  }
  if (t.about === 'dark') return (
    <section className="bg-[var(--ink)] py-24 text-white">
      <Container className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">{cfg.aboutTitle}</div>
          <H className="mt-5 text-5xl md:text-6xl">{name}</H>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">{introOf(cfg)}</p>
          {stats.length > 0 && <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">{stats.slice(0, 3).map(s => <div key={s.l}><div className="text-4xl font-bold">{s.v}</div><div className="mt-1 text-xs text-white/60">{s.l}</div></div>)}</div>}
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
          <p className="mt-5 leading-relaxed text-white/75">{introOf(cfg)}</p>
          {stats.length > 0 && <div className="mt-8 flex flex-wrap gap-8">{stats.slice(0, 3).map(s => <div key={s.l}><div className="text-3xl font-semibold">{s.v}</div><div className="text-xs text-white/60">{s.l}</div></div>)}</div>}
        </div>
      </div>
    </Container>
  );
  if (t.about === 'checklist') return (
    <Container className="grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.3fr]">
      <div><Eyebrow>Perché {name}</Eyebrow><H className="mt-3 text-4xl md:text-5xl">Più di un annuncio</H><p className="mt-5 leading-relaxed text-[var(--muted)]">{introOf(cfg)}</p>{checks}{more}</div>
      <Photo src={photo} className="aspect-[5/4] rounded-[calc(var(--r)*1.3)]" />
    </Container>
  );
  if (t.about === 'numbers') return (
    <Container className="py-24">
      {stats.length > 0 && <div className="mb-14 grid gap-px overflow-hidden rounded-[var(--r)] bg-[var(--line)] md:grid-cols-4">
        {stats.map(s => <div key={s.l} className="bg-[var(--surface)] p-8"><H className="text-5xl">{s.v}</H><div className="mt-2 text-sm text-[var(--muted)]">{s.l}</div></div>)}
      </div>}
      <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
        {cfg.aboutImage ? <Photo src={cfg.aboutImage} className="h-40 w-40 rounded-full" /> : <span className="flex h-40 w-40 items-center justify-center rounded-full bg-[var(--soft)] text-5xl font-bold">{initial(name)}</span>}
        <div><H className="text-3xl md:text-4xl">“{introOf(cfg)}”</H><SiteLink to={{ page: 'agente' }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">{name} · {cfg.agentRole} <ArrowRight size={14} /></SiteLink></div>
      </div>
    </Container>
  );
  return (
    <section className="bg-[var(--soft)] py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.35fr]">
        <div><Eyebrow>{cfg.aboutTitle}</Eyebrow><H className="mt-3 text-3xl md:text-[2.7rem]">{name}</H><p className="mt-5 leading-relaxed text-[var(--muted)]">{introOf(cfg)}</p>{checks}{more}</div>
        <div className={`grid gap-4 ${stats.length ? 'sm:grid-cols-[1fr_190px]' : ''}`}>
          <Photo src={photo} className="aspect-[4/3.2] rounded-[var(--r)] sm:aspect-auto sm:min-h-[400px]" />
          {stats.length > 0 && <div className="grid grid-cols-2 gap-4 rounded-[var(--r)] bg-[var(--surface)] p-6 sm:grid-cols-1 sm:content-center">{stats.map(s => <div key={s.l}><div className="text-3xl font-bold tracking-tight text-[var(--c)]">{s.v}</div><div className="text-xs text-[var(--muted)]">{s.l}</div></div>)}</div>}
        </div>
      </Container>
    </section>
  );
}

// ---------- Recensioni: card o citazione grande a scorrimento ----------
export function Reviews() {
  const { cfg, t } = useSite();
  const tx = useT();
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
      <SectionHead eyebrow={tx('reviews.eyebrow')} title={tx('reviews.title')} />
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
  const { properties, preview, go, base, cfg } = useSite();
  const tx = useT();
  if (cfg.zones.length) {
    const cover = (name: string) => properties.find(p => p.addr?.toLowerCase().includes(name.toLowerCase()))?.cover ?? properties[0]?.cover;
    const count = (name: string) => properties.filter(p => p.addr?.toLowerCase().includes(name.toLowerCase())).length;
    return (
      <Container className="pb-24">
        <SectionHead eyebrow={tx('zones.eyebrow')} title={tx('zones.title')} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cfg.zones.slice(0, 4).map(z => (
            <SiteLink key={z.name} to={{ page: 'zona', slug: zoneSlug(z.name) }} className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--r)] text-white">
              <Photo src={cover(z.name)} zoom className="absolute inset-0 h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5"><div className="text-xs uppercase tracking-[0.2em] text-white/70">Casa a</div><div className="text-2xl font-semibold">{z.name}</div><div className="mt-1 text-sm text-white/80">{count(z.name) ? `${count(z.name)} immobili` : 'Scopri la zona'}</div></div>
            </SiteLink>
          ))}
        </div>
      </Container>
    );
  }
  const byZone = Object.entries(properties.reduce<Record<string, SiteProperty[]>>((a, p) => {
    const parts = p.addr?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    const z = parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1]; if (z) (a[z] ??= []).push(p); return a;
  }, {})).sort((a, b) => b[1].length - a[1].length).slice(0, 4);
  if (byZone.length < 2) return null;
  return (
    <Container className="pb-24">
      <SectionHead eyebrow={tx('zones.eyebrow')} title={tx('zones.title')} />
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
  const tx = useT();
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
  const text = <div><H className="text-3xl md:text-5xl">{tx('cta.title')}</H><p className="mt-3 max-w-md text-white/80">{tx('cta.text')}</p></div>;
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

// ---------- Piè di pagina: 4 varianti, stesse colonne (chi sono, contatti, ultimi immobili, link utili) ----------
export function Footer() {
  const { cfg, name, properties, t } = useSite();
  const dark = t.footer === 'dark' || t.footer === 'ink';
  const bg = t.footer === 'dark' ? 'bg-[color-mix(in_srgb,var(--ink)_85%,#000)] text-white' : t.footer === 'ink' ? 'bg-[#0b0b0f] text-white' : t.footer === 'soft' ? 'bg-[var(--soft)]' : 'border-t border-[var(--line)]';
  const mut = dark ? 'text-white/60' : 'text-[var(--muted)]';
  const head = 'text-[11px] font-semibold uppercase tracking-[0.2em]';
  return (
    <footer className={bg}>
      {t.footer === 'light' && <Container className="pt-16"><div className="font-[family-name:var(--font-serif-accent)] text-[clamp(3rem,10vw,9rem)] leading-none tracking-tight">{name}</div></Container>}
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="text-lg font-bold">{name}</div>
          <p className={`mt-3 max-w-xs text-sm leading-relaxed ${mut}`}>{cfg.agentRole}{cfg.city ? ` a ${cfg.city}` : ''}. {cfg.heroSubtitle}</p>
          <div className={`mt-5 space-y-2 text-sm ${mut}`}>
            {cfg.phone && <div className="flex items-center gap-2"><Phone size={14} />{cfg.phone}</div>}
            {cfg.email && <div className="flex items-center gap-2"><Mail size={14} />{cfg.email}</div>}
            {(cfg.address || cfg.city) && <div className="flex items-center gap-2"><MapPin size={14} />{cfg.address || cfg.city}</div>}
          </div>
        </div>
        <div><div className={head}>Pagine</div><div className={`mt-4 space-y-2.5 text-sm ${mut}`}>{navLinks(cfg).map(([l, to]) => <SiteLink key={l} to={to} className="block hover:underline">{l}</SiteLink>)}</div></div>
        <div><div className={head}>Link utili</div><div className={`mt-4 space-y-2.5 text-sm ${mut}`}>
          {!pageHidden(cfg, 'zona') && cfg.zones.map(z => <SiteLink key={z.name} to={{ page: 'zona', slug: zoneSlug(z.name) }} className="block hover:underline">Casa a {z.name}</SiteLink>)}
          <SiteLink to={{ page: 'immobili', f: { contratto: 'vendita' } }} className="block hover:underline">Immobili in vendita</SiteLink>
          {properties.some(isRent) && <SiteLink to={{ page: 'immobili', f: { contratto: 'affitto' } }} className="block hover:underline">Immobili in affitto</SiteLink>}
          {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noreferrer" className="block hover:underline">Facebook</a>}
          {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noreferrer" className="block hover:underline">Instagram</a>}
        </div></div>
      </Container>
      <Container className={`flex flex-wrap justify-between gap-2 border-t py-6 text-xs ${dark ? 'border-white/10 text-white/45' : 'border-[var(--line)] text-[var(--muted)]'}`}>
        <span>© {new Date().getFullYear()} {name}{cfg.legal ? ` · ${cfg.legal}` : ''}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1"><SiteLink to={{ page: 'legal', doc: 'privacy' }} className="hover:underline">Privacy</SiteLink><SiteLink to={{ page: 'legal', doc: 'cookie' }} className="hover:underline">Cookie</SiteLink><a href="https://agenteimmo.me/it" target="_blank" rel="noopener" className="hover:underline">Sito per agenti immobiliari creato con Agente Immo</a></span>
      </Container>
    </footer>
  );
}

export { Facts, zoneOf };
