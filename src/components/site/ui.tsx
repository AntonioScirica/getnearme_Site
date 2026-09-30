'use client';

import { Children, createContext, isValidElement, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FitImage from '@/components/ui/FitImage';
import { Bath, BedDouble, Check, ChevronDown, DoorOpen, Heart, House, ImageIcon, Maximize2, type LucideIcon } from 'lucide-react';
import { FONTS, fontCss, PAGE_SECTIONS, pageHidden, TEXTS, type SiteConfig, type SiteProperty, type TemplateId } from '@/lib/siteTemplates';

// Base dei siti vetrina: tema per template, contesto del sito, link (veri sul sito, interni
// nell'anteprima dell'editor) e i mattoni piu' piccoli (titoli, pulsanti, foto, dati).

export type Filters = { q?: string; tipo?: string; max?: number; contratto?: string; camere?: number; bagni?: number; rif?: string; fav?: boolean };
export type Page = { page: 'home' } | { page: 'immobili'; f?: Filters } | { page: 'immobile'; id: string } | { page: 'agente' } | { page: 'servizi' } | { page: 'contatti' } | { page: 'zona'; slug: string } | { page: 'legal'; doc: 'privacy' | 'cookie' };

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
  // editor: in modalita' modifica i clic selezionano la sezione invece di navigare
  editMode?: boolean; selected?: string | null; onSelect?: (id: string) => void;
  // editor: segna quali testi usa davvero il modello aperto (gli altri non si mostrano tra i campi)
  onText?: (key: string) => void;
  // piattaforma, scheda dell'immobile: i dati si modificano sulla pagina (testi al clic, azioni sulle foto)
  propEdit?: PropEdit;
};
export type PropEdit = { photos: string[]; cover: string; busy: string | null; onPhoto: (src: string, action: 'ai' | 'cover' | 'remove') => void; onField: (k: 'titolo' | 'addr' | 'prezzo' | 'descrizione', v: string) => void };

// Testo dell'immobile modificabile al clic (solo nella scheda della piattaforma): si salva uscendo dal campo
export function Editable({ k, value, children, multiline = false, className = '' }: { k: Parameters<PropEdit['onField']>[0]; value: string; children: ReactNode; multiline?: boolean; className?: string }) {
  const pe = useContext(Ctx)?.propEdit;
  const [on, setOn] = useState(false);
  if (!pe) return <>{children}</>;
  if (!on) return <span role="button" tabIndex={0} title="Clicca per modificare" onClick={e => { e.preventDefault(); e.stopPropagation(); setOn(true); }} className={`cursor-text rounded-md outline-dashed outline-2 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-[#3b82f6] ${className}`}>{children}</span>;
  const done = (v: string) => { setOn(false); if (v.trim() !== value.trim()) pe.onField(k, v); };
  const cls = 'w-full rounded-md bg-white/95 px-2 py-1 text-inherit text-neutral-900 outline outline-2 outline-[#3b82f6]';
  return multiline
    ? <textarea autoFocus defaultValue={value} rows={10} onClick={e => e.stopPropagation()} onBlur={e => done(e.target.value)} onKeyDown={e => e.key === 'Escape' && setOn(false)} className={`${cls} text-base leading-relaxed`} />
    : <input autoFocus defaultValue={value} onClick={e => e.stopPropagation()} onBlur={e => done(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setOn(false); }} className={cls} />;
}
const Ctx = createContext<SiteCtx | null>(null);
export const useSite = () => {
  const c = useContext(Ctx)!;
  return { ...c, t: THEMES[c.cfg.template] };
};

export function SiteRoot({ ctx, children }: { ctx: SiteCtx; children: ReactNode }) {
  const t = THEMES[ctx.cfg.template];
  const style = {
    '--c': ctx.cfg.primary, '--bg': t.bg, '--fg': t.fg, '--muted': t.muted, '--line': t.line, '--surface': t.surface, '--soft': t.soft, '--ink': t.ink, '--r': `${t.radius}px`, '--rc': `${Math.min(10, Math.round(t.radius / 2))}px`,
    background: t.bg, color: t.fg,
  } as CSSProperties;
  // carattere dei titoli scelto dall'agente: il foglio di Google Fonts va nella pagina (React lo sposta nel <head>)
  const fontHref = fontCss([ctx.cfg.headingFont]);
  return <Ctx.Provider value={ctx}>{fontHref && <link rel="stylesheet" href={fontHref} precedence="default" />}<div data-site-root style={style} className="relative min-h-screen font-body antialiased selection:bg-[var(--c)] selection:text-white">{children}</div></Ctx.Provider>;
}

export const pathOf = (base: string, p: Page): string =>
  p.page === 'home' ? base || '/' : p.page === 'servizi' ? `${base}/servizi` : p.page === 'contatti' ? `${base}/contatti` : p.page === 'zona' ? `${base}/zona/${p.slug}` : p.page === 'immobili' ? `${base}/immobili${p.f ? `?${new URLSearchParams(Object.entries(p.f).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))}` : ''}` : p.page === 'agente' ? `${base}/agente` : p.page === 'legal' ? `${base}/${p.doc}` : `${base}/${p.id}`;

// Link del sito: sul sito vero e' un <a href>, nell'anteprima cambia pagina dentro l'editor
export function SiteLink({ to, className = '', children, ...rest }: { to: Page; className?: string; children: ReactNode; 'aria-label'?: string; onMouseEnter?: () => void }) {
  const { base, preview, go, editMode, cfg } = useSite();
  // pagina nascosta dall'agente: il collegamento resta come testo, senza portare a una pagina che non c'e'
  if (to.page !== 'home' && pageHidden(cfg, to.page)) return <span className={className}>{children}</span>;
  if (preview) return <a role="link" tabIndex={0} className={`cursor-pointer ${className}`} onClick={() => { if (!editMode) go?.(to); }} {...rest}>{children}</a>;
  return <a href={pathOf(base, to)} className={className} {...rest}>{children}</a>;
}

export function H({ as: Tag = 'h2', className = '', children }: { as?: 'h1' | 'h2' | 'h3'; className?: string; children: ReactNode }) {
  const { cfg } = useSite();
  const custom = FONTS.find(x => x.id === cfg.headingFont);
  if (custom) return <Tag className={`leading-[1.08] text-balance ${custom.serif ? 'tracking-[-0.01em]' : 'tracking-[-0.02em]'} ${className}`} style={{ fontFamily: `'${custom.family}', ${custom.serif ? 'serif' : 'sans-serif'}`, fontWeight: custom.weight }}>{children}</Tag>;
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

// Foto segnaposto solo nell'anteprima dell'editor: finche' l'agente non mette le sue, i riquadri vuoti
// mostrano una casa di esempio (scelta in modo fisso dal punto della pagina). Sul sito vero restano vuoti.
const PLACEHOLDERS = ['/staging/1.jpg', '/staging/2.jpg', '/staging/3.jpg', '/staging/4.jpg', '/staging/5.jpg', '/staging/6.jpg'];
const pick = (key: string) => PLACEHOLDERS[[...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % PLACEHOLDERS.length];
// fit: foto verticali intere con lo sfondo sfocato (gallerie della scheda) invece che ritagliate
export function Photo({ src, alt = '', className = '', zoom, fit, noActions }: { src?: string; alt?: string; className?: string; zoom?: boolean; fit?: boolean; noActions?: boolean }) {
  const preview = useContext(Ctx)?.preview;
  const pe = useContext(Ctx)?.propEdit;
  const shown = src || (preview ? pick(alt + className) : '');
  // scheda della piattaforma: sulle foto dell'immobile le azioni (span e non button: le gallerie hanno gia' un button intorno)
  const acts = pe && src && !noActions && pe.photos.includes(src) ? (
    pe.busy === src ? <span className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 text-sm font-semibold text-neutral-900">Un attimo…</span> : (
      <span className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/35 opacity-0 transition-opacity group-hover/ph:opacity-100" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
        <span role="button" tabIndex={0} onClick={() => pe.onPhoto(src, 'ai')} className="flex h-10 items-center gap-1.5 rounded-full bg-[#537eec] px-4 text-sm font-semibold text-white shadow-lg">Migliora con l’AI</span>
        {src !== pe.cover && <span role="button" tabIndex={0} onClick={() => pe.onPhoto(src, 'cover')} className="flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-neutral-900 shadow-lg">Copertina</span>}
        <span role="button" tabIndex={0} aria-label="Togli la foto" onClick={() => pe.onPhoto(src, 'remove')} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-neutral-900">×</span>
      </span>
    )
  ) : null;
  return (
    <div className={`overflow-hidden bg-[var(--soft)] ${fit || acts ? 'relative' : ''} ${acts ? 'group/ph' : ''} ${className}`}>
      {acts}
      {shown && fit && <FitImage src={shown} alt={alt} imgClassName={zoom ? 'transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]' : ''} />}
      {shown && !fit && <img src={shown} alt={alt} loading="lazy" className={`h-full w-full object-cover ${zoom ? 'transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]' : ''}`} />}
      {/* senza foto (sul sito vero): un'icona discreta invece del riquadro vuoto */}
      {!shown && <div className="flex h-full min-h-24 w-full items-center justify-center text-[var(--muted)] opacity-40"><ImageIcon size={28} strokeWidth={1.5} /></div>}
    </div>
  );
}

// Stato vuoto del sito: icona in un cerchio tenue, titolo, testo e un'azione. Prende colori e raggi del template.
export function EmptyState({ icon: I, title, text, action, className = '' }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center rounded-[var(--r)] bg-[var(--soft)] px-6 py-14 text-center sm:py-16 ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_12%,transparent)] text-[var(--c)]"><I size={24} /></span>
      <H as="h3" className="mt-5 text-2xl">{title}</H>
      {text && <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
// Nessun immobile pubblicato: si invita a dire cosa si cerca (pagina Contatti, se non e' nascosta)
export function NoListings({ className = '' }: { className?: string }) {
  const { cfg } = useSite();
  return <EmptyState icon={House} className={className} title="Nuovi immobili in arrivo" text="Sto selezionando le prossime case. Dimmi cosa cerchi e ti avviso appena arriva quella giusta."
    action={!pageHidden(cfg, 'contatti') && <SiteLink to={{ page: 'contatti' }} className="inline-flex h-11 items-center justify-center rounded-[min(var(--r),999px)] bg-[var(--c)] px-5 text-sm font-semibold text-[var(--on-c,#fff)] transition-all hover:brightness-110">Dimmi cosa cerchi</SiteLink>} />;
}

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
    // su telefono tante colonne quanti i dati (max 3 per riga): niente caselle vuote
    <div className={`grid gap-px overflow-hidden rounded-[var(--r)] bg-[var(--line)] ${items.length === 4 ? 'grid-cols-2' : items.length === 2 ? 'grid-cols-2' : items.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} sm:grid-cols-4 ${className}`}>
      {items.map(x => (
        <div key={x.l} className="min-w-0 bg-[var(--surface)] p-4 sm:p-5">
          <x.i size={18} className="text-[var(--c)]" />
          <div className="mt-3 text-xl font-semibold">{x.v}</div>
          <div className="text-xs text-[var(--muted)]">{x.l}</div>
        </div>
      ))}
    </div>
  );
  return (
    // nelle card: icona e numero (il nome sta nel tooltip), sempre su una riga anche nelle card strette
    <div className={`flex items-center gap-x-4 overflow-hidden whitespace-nowrap text-[13px] ${className}`}>
      {items.map(x => <span key={x.l} title={x.l} className="flex shrink-0 items-center gap-1.5"><x.i size={15} className="opacity-60" />{x.v}</span>)}
    </div>
  );
}

export const Container = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 md:px-10 ${className}`}>{children}</div>;

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
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm outline-none transition-transform duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--c)] active:scale-95 ${className}`}>
      <Heart size={16} className={on ? 'fill-rose-500 text-rose-500' : ''} />
    </button>
  );
}

// Testo del sito: quello scritto dall'agente o quello di partenza
export function useT() {
  const { cfg, onText } = useSite();
  return (key: string) => { onText?.(key); return cfg.texts[key] || TEXTS[key] || ''; };
}

const LABELS: Record<string, string> = Object.fromEntries(Object.values(PAGE_SECTIONS).flat().map(x => [x.id, x.label]));

// Sezione del sito: sparisce se l'agente l'ha nascosta; nell'editor si evidenzia e si seleziona al clic
export function Sec({ id, children }: { id: string; children: ReactNode }) {
  const { cfg, preview, editMode, selected, onSelect } = useSite();
  if (cfg.hidden.includes(id)) return null;
  if (!preview || !editMode) return <>{children}</>;
  const on = selected === id;
  return (
    <div data-sec={id} className={`group/sec relative cursor-pointer outline-offset-[-3px] ${on ? 'outline outline-[3px] outline-[#3b82f6]' : 'hover:outline hover:outline-2 hover:outline-[#3b82f6]/70'}`}
      onClickCapture={e => e.preventDefault()} onClick={e => { e.stopPropagation(); onSelect?.(id); }}>
      <span className={`pointer-events-none absolute left-3 top-3 z-[60] rounded-md bg-[#3b82f6] px-2.5 py-1 font-sans text-[13px] font-semibold text-white shadow ${on ? '' : 'opacity-0 group-hover/sec:opacity-100'}`}>{LABELS[id] ?? id}</span>
      {children}
    </div>
  );
}

// Menu a tendina dei siti, al posto del <select> del browser: stessi colori, angoli e caratteri del tema.
// Si usa come un <select> (stessi <option> dentro, onChange con e.target.value, name per i form GET).
// Il menu va nella radice del sito (portal su [data-site-root]) cosi' nessun contenitore lo taglia e
// prende le variabili del tema; nell'anteprima rimpicciolita la posizione si divide per la scala.
type Opt = { value: string; label: string };
export function Select({ value, onChange, name, className = '', children }: { value: string | number; onChange: (e: { target: { value: string } }) => void; name?: string; className?: string; children: ReactNode }) {
  const opts: Opt[] = Children.toArray(children).filter(isValidElement).map(o => {
    const p = (o as ReactElement<{ value?: string | number; children?: ReactNode }>).props;
    return { value: String(p.value ?? p.children ?? ''), label: String(p.children ?? '') };
  });
  const cur = opts.find(o => o.value === String(value ?? '')) ?? opts[0];
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ root: HTMLElement; left: number; top: number; width: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const root = btn.current.closest<HTMLElement>('[data-site-root]');
    if (!root) return;
    const place = () => {
      const r = btn.current!.getBoundingClientRect(), rr = root.getBoundingClientRect(), k = rr.width / root.offsetWidth || 1;
      setPos({ root, left: (r.left - rr.left) / k, top: (r.bottom - rr.top) / k + 6, width: r.width / k });
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const out = (e: PointerEvent) => { if (!btn.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('[data-site-menu]')) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <>
      {name && <input type="hidden" name={name} value={String(value ?? '')} />}
      <button ref={btn} type="button" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}
        className={`${className} flex items-center justify-between gap-2 text-left`}>
        <span className="min-w-0 truncate">{cur?.label}</span>
        <ChevronDown size={15} className={`shrink-0 opacity-60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div data-site-menu role="listbox" className="absolute z-[80] max-h-72 overflow-y-auto rounded-[var(--rc)] border border-[var(--line)] bg-[var(--surface)] p-1.5 text-sm text-[var(--fg)] shadow-[0_18px_50px_-12px_rgba(0,0,0,.25)]"
          style={{ left: pos.left, top: pos.top, minWidth: Math.max(180, pos.width), animation: 'gnm-fade .3s ease both' }}>
          {opts.map(o => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === cur?.value}
              onClick={() => { onChange({ target: { value: o.value } }); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 rounded-[calc(var(--rc)*0.7)] px-3 py-2 text-left transition-colors hover:bg-[var(--soft)] ${o.value === cur?.value ? 'font-semibold' : ''}`}>
              {o.label}{o.value === cur?.value && <Check size={14} className="shrink-0 text-[var(--c)]" />}
            </button>
          ))}
        </div>,
        pos.root,
      )}
    </>
  );
}
