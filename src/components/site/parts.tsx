'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight, Bath, BedDouble, Mail, MapPin, Maximize2, Phone, Search, SlidersHorizontal } from 'lucide-react';
import type { SiteConfig, SiteProperty } from '@/lib/siteTemplates';

// Mattoni comuni dei template della vetrina. Ogni template sceglie quali usare, in che ordine e con
// quale variante; colori, font e arrotondamenti arrivano dal tema (variabili CSS sul contenitore).

export type Theme = { bg: string; fg: string; muted: string; line: string; surface: string; radius: number; dark?: boolean };
export type SiteCtx = { cfg: SiteConfig; name: string; logo?: string | null; properties: SiteProperty[]; base: string; preview?: boolean };

export const themeStyle = (t: Theme, cfg: SiteConfig) => ({
  '--c': cfg.primary, '--bg': t.bg, '--fg': t.fg, '--muted': t.muted, '--line': t.line, '--surface': t.surface, '--r': `${t.radius}px`,
  background: t.bg, color: t.fg,
}) as CSSProperties;

export const H = ({ cfg, className = '', children, as: Tag = 'h2' }: { cfg: SiteConfig; className?: string; children: ReactNode; as?: 'h1' | 'h2' | 'h3' }) => (
  <Tag className={`${cfg.font === 'serif' ? 'font-[family-name:var(--font-serif-accent)] font-normal tracking-[-0.01em]' : 'font-display font-bold tracking-tight'} leading-[1.1] ${className}`}>{children}</Tag>
);

export const price = (n: number) => (n ? `€ ${Number(n).toLocaleString('it-IT')}` : 'Trattativa riservata');
const zone = (addr: string) => addr?.split(',').map(s => s.trim()).filter(Boolean).slice(-2).join(', ') || '';
const href = (ctx: SiteCtx, id: string) => (ctx.preview ? undefined : `${ctx.base}/${id}`);
const heroImg = (ctx: SiteCtx) => ctx.cfg.heroImage || ctx.properties[0]?.cover || '';

export function Btn({ children, href: h, variant = 'solid', className = '' }: { children: ReactNode; href?: string; variant?: 'solid' | 'outline' | 'light'; className?: string }) {
  const v = variant === 'solid' ? 'bg-[var(--c)] text-white hover:opacity-90' : variant === 'light' ? 'bg-white text-neutral-900 hover:bg-white/90' : 'ring-1 ring-inset ring-current hover:bg-[var(--fg)] hover:text-[var(--bg)]';
  return <a href={h} className={`inline-flex h-12 items-center gap-2 rounded-[var(--r)] px-6 text-sm font-semibold transition-all duration-500 ${v} ${className}`}>{children}</a>;
}

// ---------- Navigazione ----------
export function Nav({ ctx, variant }: { ctx: SiteCtx; variant: 'overlay' | 'bar' | 'centered' }) {
  const { cfg, name, logo } = ctx;
  const brand = logo ? <img src={logo} alt={name} className={`h-9 max-w-[180px] object-contain ${variant === 'overlay' ? 'brightness-0 invert' : ''}`} /> : <span className={`text-lg font-semibold tracking-tight ${variant === 'centered' ? 'text-2xl' : ''}`}>{name}</span>;
  const links = (
    <nav className="hidden items-center gap-8 text-sm md:flex">
      <a href="#immobili" className="opacity-80 transition-opacity hover:opacity-100">Immobili</a>
      {cfg.showAbout && <a href="#chi" className="opacity-80 transition-opacity hover:opacity-100">{cfg.aboutTitle}</a>}
      {cfg.showContact && <a href="#contatti" className="opacity-80 transition-opacity hover:opacity-100">Contatti</a>}
    </nav>
  );
  if (variant === 'centered') return (
    <header className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-6 pt-8">
      {brand}
      <div className="flex w-full items-center justify-center border-y border-[var(--line)] py-3">{links}</div>
    </header>
  );
  return (
    <header className={`${variant === 'overlay' ? 'absolute inset-x-0 top-0 z-20 text-white' : 'border-b border-[var(--line)]'}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        {brand}
        {links}
        {cfg.showContact && <Btn href="#contatti" variant={variant === 'overlay' ? 'light' : 'solid'} className="!h-10 !px-5">{cfg.ctaLabel}</Btn>}
      </div>
    </header>
  );
}

// ---------- Ricerca con filtri (zona, tipologia, prezzo, camere) ----------
type Filters = { q: string; tipo: string; max: number; camere: number };
const PRICES = [0, 150000, 250000, 400000, 600000, 1000000];

export function useSearch(properties: SiteProperty[]) {
  const [f, setF] = useState<Filters>({ q: '', tipo: '', max: 0, camere: 0 });
  const tipi = useMemo(() => [...new Set(properties.map(p => p.tipologia?.split('|')[0].trim()).filter(Boolean))] as string[], [properties]);
  const list = useMemo(() => properties.filter(p =>
    (!f.q || `${p.titolo} ${p.addr}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.tipo || p.tipologia?.startsWith(f.tipo)) &&
    (!f.max || (p.prezzo && p.prezzo <= f.max)) &&
    (!f.camere || (p.camere ?? 0) >= f.camere)), [properties, f]);
  return { f, setF, tipi, list };
}

export function SearchBar({ s, variant }: { s: ReturnType<typeof useSearch>; variant: 'pill' | 'line' | 'panel' }) {
  const { f, setF, tipi } = s;
  const field = variant === 'line'
    ? 'h-11 min-w-0 flex-1 border-b border-[var(--line)] bg-transparent text-sm outline-none focus:border-[var(--fg)]'
    : 'h-11 min-w-0 flex-1 rounded-[calc(var(--r)*0.7)] bg-transparent px-3 text-sm outline-none';
  const sel = `${field} cursor-pointer appearance-none`;
  const sep = variant === 'pill' ? <span className="hidden h-6 w-px bg-[var(--line)] md:block" /> : null;
  const wrap = variant === 'pill' ? 'rounded-[var(--r)] bg-[var(--surface)] p-2 shadow-[0_12px_40px_rgba(0,0,0,.12)]'
    : variant === 'panel' ? 'rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] p-3' : 'gap-6';
  return (
    <div className={`flex flex-col gap-2 md:flex-row md:items-center ${wrap}`}>
      <label className="flex min-w-0 flex-[2] items-center gap-2 pl-2"><Search size={16} className="shrink-0 opacity-50" />
        <input value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Via, quartiere, città" className={`${field} !px-1`} />
      </label>
      {sep}
      <select value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })} className={sel} aria-label="Tipologia">
        <option value="">Tutte le tipologie</option>{tipi.map(t => <option key={t}>{t}</option>)}
      </select>
      {sep}
      <select value={f.max} onChange={e => setF({ ...f, max: Number(e.target.value) })} className={sel} aria-label="Prezzo massimo">
        {PRICES.map(v => <option key={v} value={v}>{v ? `Fino a ${price(v)}` : 'Qualsiasi prezzo'}</option>)}
      </select>
      {sep}
      <select value={f.camere} onChange={e => setF({ ...f, camere: Number(e.target.value) })} className={sel} aria-label="Camere">
        {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v ? `${v}+ camere` : 'Camere'}</option>)}
      </select>
      {variant === 'pill' && <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--r)*0.7)] bg-[var(--c)] text-white md:flex"><SlidersHorizontal size={16} /></span>}
    </div>
  );
}

// ---------- Card immobile ----------
function Facts({ p, className = '' }: { p: SiteProperty; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] ${className}`}>
      {!!p.mq && <span className="flex items-center gap-1.5"><Maximize2 size={13} className="opacity-60" />{p.mq} m²</span>}
      {!!p.camere && <span className="flex items-center gap-1.5"><BedDouble size={13} className="opacity-60" />{p.camere}</span>}
      {!!p.bagni && <span className="flex items-center gap-1.5"><Bath size={13} className="opacity-60" />{p.bagni}</span>}
    </div>
  );
}

export function PropertyCard({ ctx, p, variant, big }: { ctx: SiteCtx; p: SiteProperty; variant: 'stacked' | 'overlay' | 'caption' | 'row'; big?: boolean }) {
  const { cfg } = ctx;
  const photo = (cls: string) => (
    <div className={`overflow-hidden bg-[var(--line)] ${cls}`}>
      {p.cover && <img src={p.cover} alt={p.titolo} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]" />}
    </div>
  );
  if (variant === 'overlay') return (
    <a href={href(ctx, p.id)} className={`group relative block overflow-hidden rounded-[var(--r)] ${big ? 'aspect-[4/5] md:aspect-auto md:h-full' : 'aspect-[4/5]'}`}>
      {photo('absolute inset-0')}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        {cfg.showPrices && <div className="text-xl font-semibold">{price(p.prezzo)}</div>}
        <H cfg={cfg} as="h3" className={`mt-1 line-clamp-2 ${big ? 'text-3xl' : 'text-lg'}`}>{p.titolo}</H>
        <Facts p={p} className="mt-2 text-white/85" />
      </div>
      <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 transition-all duration-500 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
    </a>
  );
  if (variant === 'row') return (
    <a href={href(ctx, p.id)} className="group grid items-center gap-8 md:grid-cols-2 md:[&:nth-child(even)>div:first-child]:order-2">
      {photo('aspect-[4/3] rounded-[var(--r)]')}
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--c)]">{p.tipologia?.split('|')[0] || 'Immobile'}</div>
        <H cfg={cfg} as="h3" className="mt-3 text-4xl">{p.titolo}</H>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--muted)]"><MapPin size={14} />{zone(p.addr)}</div>
        <Facts p={p} className="mt-5 text-[var(--muted)]" />
        <div className="mt-6 flex items-center gap-6 border-t border-[var(--line)] pt-6">
          {cfg.showPrices && <span className="text-2xl font-semibold">{price(p.prezzo)}</span>}
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-[var(--c)]">Scopri <ArrowUpRight size={15} /></span>
        </div>
      </div>
    </a>
  );
  if (variant === 'caption') return (
    <a href={href(ctx, p.id)} className="group block">
      {photo(`${big ? 'aspect-[16/11]' : 'aspect-[4/5]'} rounded-[var(--r)]`)}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <H cfg={cfg} as="h3" className={`line-clamp-1 ${big ? 'text-3xl' : 'text-xl'}`}>{p.titolo}</H>
        {cfg.showPrices && <span className="shrink-0 text-sm font-semibold">{price(p.prezzo)}</span>}
      </div>
      <div className="mt-1 text-sm text-[var(--muted)]">{[zone(p.addr), p.mq ? `${p.mq} m²` : ''].filter(Boolean).join(' · ')}</div>
    </a>
  );
  return (
    <a href={href(ctx, p.id)} className="group block overflow-hidden rounded-[var(--r)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_30px_rgba(0,0,0,.06)] transition-transform duration-500 hover:-translate-y-1">
      <div className="relative">
        {photo('aspect-[4/3]')}
        {cfg.showPrices && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-neutral-900 shadow-sm">{price(p.prezzo)}</span>}
      </div>
      <div className="p-5">
        <H cfg={cfg} as="h3" className="line-clamp-2 text-lg">{p.titolo}</H>
        <div className="mt-1.5 flex items-center gap-1 truncate text-[13px] text-[var(--muted)]"><MapPin size={13} className="shrink-0" />{zone(p.addr)}</div>
        <Facts p={p} className="mt-3 border-t border-[var(--line)] pt-3 text-[var(--muted)]" />
      </div>
    </a>
  );
}

// ---------- Sezione immobili: titolo + ricerca + griglia ----------
export function Listings({ ctx, title, eyebrow, search, card, layout, className = '' }: {
  ctx: SiteCtx; title: string; eyebrow?: string; search: 'pill' | 'line' | 'panel' | null; card: 'stacked' | 'overlay' | 'caption' | 'row'; layout: 'grid' | 'mosaic' | 'rows'; className?: string;
}) {
  const s = useSearch(ctx.properties);
  const grid = layout === 'rows' ? 'space-y-24' : layout === 'mosaic' ? 'grid gap-5 md:grid-cols-3 md:auto-rows-[260px]' : 'grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section id="immobili" className={`mx-auto max-w-6xl px-6 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c)]">{eyebrow}</div>}
          <H cfg={ctx.cfg} className="text-4xl md:text-5xl">{title}</H>
        </div>
        <span className="text-sm text-[var(--muted)]">{s.list.length} {s.list.length === 1 ? 'immobile' : 'immobili'}</span>
      </div>
      {search && ctx.properties.length > 3 && <div className="mt-8"><SearchBar s={s} variant={search} /></div>}
      <div className={`mt-10 ${grid}`}>
        {s.list.map((p, i) => {
          const big = layout === 'mosaic' && i % 5 === 0;
          return <div key={p.id} className={big ? 'md:col-span-2 md:row-span-2' : layout === 'mosaic' ? 'md:row-span-1 [&>a]:md:h-full [&>a]:md:aspect-auto' : ''}>
            <PropertyCard ctx={ctx} p={p} variant={card} big={big} />
          </div>;
        })}
      </div>
      {!s.list.length && <p className="mt-10 text-[var(--muted)]">{ctx.properties.length ? 'Nessun immobile con questi filtri.' : 'Presto nuovi immobili.'}</p>}
    </section>
  );
}

// ---------- Numeri ----------
export function Stats({ ctx, variant }: { ctx: SiteCtx; variant: 'row' | 'cards' }) {
  const ps = ctx.properties;
  const zones = new Set(ps.map(p => p.addr?.split(',').slice(-1)[0]?.trim()).filter(Boolean)).size;
  const min = Math.min(...ps.map(p => p.prezzo).filter(Boolean));
  const items = [
    { v: String(ps.length), l: ps.length === 1 ? 'immobile disponibile' : 'immobili disponibili' },
    { v: String(zones || 1), l: zones === 1 ? 'zona' : 'zone servite' },
    ...(ctx.cfg.showPrices && Number.isFinite(min) ? [{ v: `€ ${Math.round(min / 1000)}k`, l: 'prezzo di partenza' }] : []),
  ];
  return (
    <div className={variant === 'cards' ? 'grid gap-4 sm:grid-cols-3' : 'flex flex-wrap justify-center gap-x-16 gap-y-6'}>
      {items.map(x => (
        <div key={x.l} className={variant === 'cards' ? 'rounded-[var(--r)] bg-[var(--surface)] p-6' : 'text-center'}>
          <H cfg={ctx.cfg} className="text-4xl md:text-5xl">{x.v}</H>
          <div className="mt-1 text-sm text-[var(--muted)]">{x.l}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- Chi sono ----------
export function About({ ctx, variant }: { ctx: SiteCtx; variant: 'split' | 'quote' }) {
  const { cfg } = ctx;
  const photo = cfg.aboutImage || ctx.properties[1]?.cover || heroImg(ctx);
  if (variant === 'quote') return (
    <section id="chi" className="mx-auto max-w-4xl px-6 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c)]">{cfg.aboutTitle}</div>
      <H cfg={cfg} className="mt-6 text-3xl md:text-[2.75rem]">“{cfg.aboutText}”</H>
      <div className="mt-8 text-sm font-semibold">{ctx.name}{cfg.city && <span className="font-normal text-[var(--muted)]"> · {cfg.city}</span>}</div>
    </section>
  );
  return (
    <section id="chi" className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
      <div className="aspect-[4/5] overflow-hidden rounded-[var(--r)] bg-[var(--line)]">{photo && <img src={photo} alt="" className="h-full w-full object-cover" />}</div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c)]">{cfg.aboutTitle}</div>
        <H cfg={cfg} className="mt-4 text-4xl md:text-5xl">{ctx.name}</H>
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>
        {cfg.showContact && <Btn href="#contatti" className="mt-8">{cfg.ctaLabel}</Btn>}
      </div>
    </section>
  );
}

// ---------- Contatti ----------
export function Contact({ ctx, variant }: { ctx: SiteCtx; variant: 'card' | 'band' }) {
  const { cfg } = ctx;
  const wa = cfg.whatsapp.replace(/\D/g, '');
  const links = [
    cfg.phone && { icon: Phone, label: cfg.phone, href: `tel:${cfg.phone.replace(/\s/g, '')}` },
    wa && { icon: Phone, label: 'WhatsApp', href: `https://wa.me/${wa}` },
    cfg.email && { icon: Mail, label: cfg.email, href: `mailto:${cfg.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[];
  const body = (
    <>
      <H cfg={cfg} className="text-4xl md:text-6xl">Parliamo della tua casa</H>
      <p className="mx-auto mt-4 max-w-xl text-lg opacity-75">Per una visita, una valutazione o solo un consiglio. Rispondo di persona.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {links.map((l, i) => <Btn key={l.href} href={ctx.preview ? undefined : l.href} variant={i === 0 ? (variant === 'band' ? 'light' : 'solid') : 'outline'}><l.icon size={16} />{l.label}</Btn>)}
        {!links.length && <span className="text-sm opacity-60">Aggiungi telefono o email nella vetrina.</span>}
      </div>
    </>
  );
  if (variant === 'band') return <section id="contatti" className="bg-[var(--c)] px-6 py-24 text-center text-white [--fg:#fff]">{body}</section>;
  return <section id="contatti" className="mx-auto max-w-6xl px-6"><div className="rounded-[var(--r)] bg-[var(--surface)] px-6 py-20 text-center shadow-[0_10px_40px_rgba(0,0,0,.06)]">{body}</div></section>;
}

export function Footer({ ctx }: { ctx: SiteCtx }) {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] px-6 py-8 text-sm text-[var(--muted)]">
      <span>© {new Date().getFullYear()} {ctx.name}{ctx.cfg.city ? ` · ${ctx.cfg.city}` : ''}</span>
      <span>Vetrina creata con Agente Immo</span>
    </footer>
  );
}

export { heroImg };
