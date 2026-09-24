'use client';

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Bath, BedDouble, DoorOpen, Heart, Maximize2 } from 'lucide-react';
import type { SiteConfig, SiteProperty, TemplateId } from '@/lib/siteTemplates';

// Base dei siti vetrina: tema per template, contesto del sito, link (veri sul sito, interni
// nell'anteprima dell'editor) e i mattoni piu' piccoli (titoli, pulsanti, foto, dati).

export type Filters = { q?: string; tipo?: string; max?: number; contratto?: string; camere?: number; bagni?: number; rif?: string };
export type Page = { page: 'home' } | { page: 'immobili'; f?: Filters } | { page: 'immobile'; id: string } | { page: 'agente' } | { page: 'servizi' } | { page: 'contatti' } | { page: 'zona'; slug: string };

// Ogni template sceglie una variante per ogni parte: stessi dati, siti molto diversi.
export type Theme = {
  bg: string; fg: string; muted: string; line: string; surface: string; soft: string; ink: string; radius: number;
  header: 'plain' | 'centered' | 'pill' | 'over' | 'minimal' | 'drawer';
  hero: 'split' | 'full' | 'card' | 'center' | 'form' | 'banner' | 'editorial' | 'tabs' | 'sky' | 'bento';
  intro: 'features' | 'welcome' | 'pastel' | 'none' | 'trust' | 'text' | 'services' | 'categories' | 'bento';
  card: 'classic' | 'button' | 'badge' | 'minimal' | 'price' | 'label' | 'clean';
  featured?: 'chips';
  about: 'stats' | 'card' | 'checklist' | 'dark' | 'numbers' | 'why' | 'numbered';
  reviews: 'cards' | 'quote';
  cta: 'band' | 'photo' | 'gradient' | 'ink';
  footer: 'dark' | 'soft' | 'ink' | 'light';
  listings: 'sidebar' | 'topbar';
  results: 'grid' | 'rows';
  gallery: 'mosaic' | 'slider' | 'full';
  agent: 'split' | 'cover' | 'centered';
  services: 'cards' | 'list' | 'steps';
  contact: 'split' | 'card' | 'band';
  zone: 'sidebar' | 'wide';
};

export const THEMES: Record<TemplateId, Theme> = {
  prato: { bg: '#ffffff', fg: '#10231a', muted: '#62706a', line: '#e6ece8', surface: '#ffffff', soft: '#f1f6f3', ink: '#0f2a1d', radius: 14,
    header: 'plain', hero: 'split', intro: 'features', card: 'classic', about: 'stats', reviews: 'cards', cta: 'band', footer: 'dark', listings: 'sidebar', results: 'grid', gallery: 'mosaic', agent: 'split', services: 'cards', contact: 'split', zone: 'sidebar' },
  bosco: { bg: '#f6f4ee', fg: '#1d2417', muted: '#6a705f', line: '#e3e0d4', surface: '#ffffff', soft: '#eceade', ink: '#23301b', radius: 26,
    header: 'centered', hero: 'full', intro: 'welcome', card: 'button', about: 'card', reviews: 'quote', cta: 'photo', footer: 'soft', listings: 'sidebar', results: 'grid', gallery: 'slider', agent: 'cover', services: 'steps', contact: 'card', zone: 'wide' },
  cielo: { bg: '#fbfaff', fg: '#16163a', muted: '#6b6d8c', line: '#ebeaf5', surface: '#ffffff', soft: '#f3f2fc', ink: '#16163a', radius: 20,
    header: 'pill', hero: 'card', intro: 'pastel', card: 'badge', about: 'checklist', reviews: 'cards', cta: 'gradient', footer: 'ink', listings: 'topbar', results: 'grid', gallery: 'mosaic', agent: 'cover', services: 'cards', contact: 'card', zone: 'sidebar' },
  citta: { bg: '#f5f5f2', fg: '#111111', muted: '#6b6b6b', line: '#e2e2de', surface: '#ffffff', soft: '#ebebe7', ink: '#111111', radius: 10,
    header: 'over', hero: 'center', intro: 'none', card: 'minimal', about: 'dark', reviews: 'quote', cta: 'ink', footer: 'ink', listings: 'topbar', results: 'rows', gallery: 'full', agent: 'split', services: 'list', contact: 'band', zone: 'wide' },
  nord: { bg: '#ffffff', fg: '#111111', muted: '#6b6b6b', line: '#ececec', surface: '#ffffff', soft: '#f6f6f3', ink: '#111111', radius: 18,
    header: 'minimal', hero: 'form', intro: 'trust', card: 'price', about: 'numbers', reviews: 'cards', cta: 'band', footer: 'light', listings: 'topbar', results: 'grid', gallery: 'slider', agent: 'centered', services: 'steps', contact: 'split', zone: 'wide' },
  // Riviera: agenzia di zona (sul modello di casalconero.com): barra contatti, logo al centro con menu,
  // foto con titolo e ricerca avanzata sotto, testo di presentazione, card con stato e agente.
  riviera: { bg: '#ffffff', fg: '#222831', muted: '#6b7280', line: '#e8ebee', surface: '#ffffff', soft: '#f4f6f7', ink: '#2b3036', radius: 6,
    header: 'drawer', hero: 'banner', intro: 'text', card: 'classic', about: 'stats', reviews: 'cards', cta: 'band', footer: 'dark', listings: 'topbar', results: 'grid', gallery: 'slider', agent: 'split', services: 'list', contact: 'split', zone: 'sidebar' },
  // Atelier (rif. Ambiente): editoriale, verde scuro, serif con corsivo, servizi con foto su fondo scuro
  atelier: { bg: '#f7f6f2', fg: '#1b221e', muted: '#6c726d', line: '#e3e2dc', surface: '#ffffff', soft: '#eeede7', ink: '#1d2b24', radius: 4,
    header: 'minimal', hero: 'editorial', intro: 'services', card: 'minimal', about: 'dark', reviews: 'quote', cta: 'ink', footer: 'ink', listings: 'sidebar', results: 'grid', gallery: 'full', agent: 'split', services: 'list', contact: 'band', zone: 'wide' },
  // Oro (rif. Nexora): oro e crema, ricerca a schede sulla foto, categorie con icone, perche' sceglierci
  oro: { bg: '#ffffff', fg: '#1c1a17', muted: '#77716a', line: '#ece6dc', surface: '#ffffff', soft: '#f8f4ec', ink: '#1c1a17', radius: 10,
    header: 'over', hero: 'tabs', intro: 'categories', card: 'price', about: 'why', reviews: 'cards', cta: 'photo', footer: 'dark', listings: 'topbar', results: 'grid', gallery: 'mosaic', agent: 'cover', services: 'cards', contact: 'split', zone: 'sidebar' },
  // Orizzonte (rif. Skyline / EstateHorizon): cielo, corsivo nel titolo, ricerca a pillola, filtro a chip, card con etichette
  orizzonte: { bg: '#ffffff', fg: '#111827', muted: '#6b7280', line: '#eceef3', surface: '#ffffff', soft: '#f4f7fb', ink: '#0f172a', radius: 16,
    header: 'over', hero: 'sky', intro: 'none', card: 'label', featured: 'chips', about: 'numbered', reviews: 'cards', cta: 'gradient', footer: 'light', listings: 'topbar', results: 'grid', gallery: 'slider', agent: 'centered', services: 'steps', contact: 'card', zone: 'wide' },
  // Vista (rif. Propvista): titolo a sinistra e testo a destra, modulo sulla foto, riquadri con numeri e mappa
  vista: { bg: '#f9f9f8', fg: '#111111', muted: '#6b6b6b', line: '#e6e6e3', surface: '#ffffff', soft: '#f1f1ee', ink: '#111111', radius: 14,
    header: 'plain', hero: 'bento', intro: 'bento', card: 'clean', about: 'checklist', reviews: 'quote', cta: 'band', footer: 'light', listings: 'sidebar', results: 'grid', gallery: 'mosaic', agent: 'split', services: 'cards', contact: 'split', zone: 'sidebar' },
};

export type SiteCtx = {
  cfg: SiteConfig; name: string; logo?: string | null; properties: SiteProperty[]; base: string;
  preview?: boolean; go?: (p: Page) => void;
};
const Ctx = createContext<SiteCtx | null>(null);
export const useSite = () => {
  const c = useContext(Ctx)!;
  return { ...c, t: THEMES[c.cfg.template] };
};

export function SiteRoot({ ctx, children }: { ctx: SiteCtx; children: ReactNode }) {
  const t = THEMES[ctx.cfg.template];
  const style = {
    '--c': ctx.cfg.primary, '--bg': t.bg, '--fg': t.fg, '--muted': t.muted, '--line': t.line, '--surface': t.surface, '--soft': t.soft, '--ink': t.ink, '--r': `${t.radius}px`,
    background: t.bg, color: t.fg,
  } as CSSProperties;
  return <Ctx.Provider value={ctx}><div style={style} className="min-h-screen font-body antialiased selection:bg-[var(--c)] selection:text-white">{children}</div></Ctx.Provider>;
}

export const pathOf = (base: string, p: Page): string =>
  p.page === 'home' ? base || '/' : p.page === 'servizi' ? `${base}/servizi` : p.page === 'contatti' ? `${base}/contatti` : p.page === 'zona' ? `${base}/zona/${p.slug}` : p.page === 'immobili' ? `${base}/immobili${p.f ? `?${new URLSearchParams(Object.entries(p.f).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))}` : ''}` : p.page === 'agente' ? `${base}/agente` : `${base}/${p.id}`;

// Link del sito: sul sito vero e' un <a href>, nell'anteprima cambia pagina dentro l'editor
export function SiteLink({ to, className = '', children, ...rest }: { to: Page; className?: string; children: ReactNode; 'aria-label'?: string; onMouseEnter?: () => void }) {
  const { base, preview, go } = useSite();
  if (preview) return <a role="link" tabIndex={0} className={`cursor-pointer ${className}`} onClick={() => go?.(to)} {...rest}>{children}</a>;
  return <a href={pathOf(base, to)} className={className} {...rest}>{children}</a>;
}

export function H({ as: Tag = 'h2', className = '', children }: { as?: 'h1' | 'h2' | 'h3'; className?: string; children: ReactNode }) {
  const { cfg } = useSite();
  const f = cfg.font === 'serif' ? 'font-[family-name:var(--font-serif-accent)] font-normal tracking-[-0.015em]' : 'font-display font-bold tracking-[-0.03em]';
  return <Tag className={`${f} leading-[1.05] text-balance ${className}`}>{children}</Tag>;
}

export const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c)] ${className}`}>{children}</div>;

export function Btn({ children, href, onClick, variant = 'solid', size = 'md', className = '', external }: {
  children: ReactNode; href?: string; onClick?: () => void; variant?: 'solid' | 'ghost' | 'light' | 'ink'; size?: 'sm' | 'md' | 'lg'; className?: string; external?: boolean;
}) {
  const { preview } = useSite();
  const v = { solid: 'bg-[var(--c)] text-[var(--on-c,#fff)] hover:brightness-110', ink: 'bg-[var(--fg)] text-[var(--bg)] hover:opacity-85', light: 'bg-white text-neutral-900 hover:bg-white/90', ghost: 'ring-1 ring-inset ring-[var(--line)] hover:ring-[var(--fg)]' }[variant];
  const s = { sm: 'h-9 px-4 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-13 px-7 text-[15px]' }[size];
  const cls = `inline-flex shrink-0 items-center justify-center gap-2 rounded-[min(var(--r),999px)] font-semibold transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[.98] ${v} ${s} ${className}`;
  if (href && !preview) return <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{children}</a>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

export const Photo = ({ src, alt = '', className = '', zoom }: { src?: string; alt?: string; className?: string; zoom?: boolean }) => (
  <div className={`overflow-hidden bg-[var(--soft)] ${className}`}>
    {src && <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${zoom ? 'transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]' : ''}`} />}
  </div>
);

export const price = (n: number) => (n ? `€ ${Number(n).toLocaleString('it-IT')}` : 'Trattativa riservata');
export const zoneOf = (addr: string) => addr?.split(',').map(s => s.trim()).filter(Boolean).slice(-2).join(', ') || '';
export const typeOf = (p: SiteProperty) => p.tipologia?.split('|')[0].trim() || 'Immobile';

export function Facts({ p, className = '', full }: { p: SiteProperty; className?: string; full?: boolean }) {
  const items = [
    p.mq ? { i: Maximize2, v: `${p.mq} m²`, l: 'Superficie' } : null,
    full && p.locali ? { i: DoorOpen, v: String(p.locali), l: 'Locali' } : null,
    p.camere ? { i: BedDouble, v: String(p.camere), l: p.camere === 1 ? 'Camera' : 'Camere' } : null,
    p.bagni ? { i: Bath, v: String(p.bagni), l: p.bagni === 1 ? 'Bagno' : 'Bagni' } : null,
  ].filter(Boolean) as { i: typeof Bath; v: string; l: string }[];
  if (full) return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-[var(--r)] bg-[var(--line)] sm:grid-cols-4 ${className}`}>
      {items.map(x => (
        <div key={x.l} className="bg-[var(--surface)] p-5">
          <x.i size={18} className="text-[var(--c)]" />
          <div className="mt-3 text-xl font-semibold">{x.v}</div>
          <div className="text-xs text-[var(--muted)]">{x.l}</div>
        </div>
      ))}
    </div>
  );
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] ${className}`}>
      {items.map(x => <span key={x.l} className="flex items-center gap-1.5"><x.i size={14} className="opacity-60" />{x.l === 'Superficie' ? x.v : `${x.v} ${x.l.toLowerCase()}`}</span>)}
    </div>
  );
}

export const Container = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`mx-auto w-full max-w-[1240px] px-6 md:px-10 ${className}`}>{children}</div>;

// Foto e contatti dell'agente
export function contacts(cfg: SiteConfig, subject?: string) {
  const wa = cfg.whatsapp.replace(/\D/g, '');
  const msg = subject ? `Ciao, vorrei informazioni su: ${subject}` : 'Ciao, vorrei informazioni';
  return {
    tel: cfg.phone ? `tel:${cfg.phone.replace(/\s/g, '')}` : '',
    wa: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : '',
    mail: cfg.email ? `mailto:${cfg.email}?subject=${encodeURIComponent(subject ?? 'Informazioni')}` : '',
  };
}

// Preferiti del visitatore: nel suo browser, uno per sito (niente login)
const FAV_EVT = 'gnm-fav';
export function useFavs() {
  const { base } = useSite();
  const key = `gnm-fav:${base || 'anteprima'}`;
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const load = () => { try { setIds(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setIds([]); } };
    load();
    window.addEventListener(FAV_EVT, load);
    return () => window.removeEventListener(FAV_EVT, load);
  }, [key]);
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(FAV_EVT));
  };
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

export function FavButton({ id, className = '' }: { id: string; className?: string }) {
  const { has, toggle } = useFavs();
  const on = has(id);
  return (
    <button type="button" aria-label={on ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} aria-pressed={on}
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm transition-transform duration-300 hover:scale-110 active:scale-95 ${className}`}>
      <Heart size={16} className={on ? 'fill-rose-500 text-rose-500' : ''} />
    </button>
  );
}
