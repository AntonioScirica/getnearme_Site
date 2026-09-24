'use client';

import { useEffect, useRef, useState } from 'react';
import { Home, Building2, Globe, Gauge, LogOut, Plus, Loader2, X, Wand2 } from 'lucide-react';
import type { UserData } from '@/app/[locale]/dashboard/page';
import { supabase } from '@/lib/supabase';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import NewPropertyWizard from './NewPropertyWizard';
import PropertyDetail from './PropertyDetail';
import PortfolioView from './PortfolioView';
import ImportView from './ImportView';
import { BrowserBody, Results, SCAN_STEPS, useImprove, Verdict, type Stage } from './ImproveView';
import { Elapsed } from './AiPhoto';
import CostsView from './CostsView';
import StagingView from './StagingView';
import { isPlatformAdmin } from '@/lib/platformAdmins';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { go, formatPrice, authFetch, CARD_SHADOW, warm } from './api';
import ProfileForm, { type Profile } from './ProfileForm';

// Routing a hash (#/immobili, #/nuovo, #/immobile/<id>): back/forward del browser
// funzionano senza toccare le route Next della vecchia dashboard.
function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const on = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

// Sfondo generale: bianco con puntini grigi al 9%.
export const DOTS: React.CSSProperties = { background: 'radial-gradient(rgba(0,0,0,0.09) 1.2px, transparent 1.2px) 0 0 / 18px 18px, #fff' };

const NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/immobili', label: 'Immobili', icon: Building2 },
  { path: '/portfolio', label: 'Portfolio', icon: Globe },
];

export default function PlatformApp({ userData }: { userData: UserData }) {
  const [route, query = ''] = useHashRoute().split('?');
  const [projects, setProjects] = useState<ProjectData[] | null>(null);

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const reload = () => fetchProjects().then(setProjects);
  useEffect(() => {
    reload();
    authFetch('/api/platform/portfolio').then(r => r.json()).then(d => setProfile({ name: d.name, slug: d.slug })).catch(() => setProfile(null));
  }, []);

  // Onboarding: finche' l'agente non ha scelto nome + indirizzo portfolio, niente piattaforma.
  if (profile === undefined) return <div className="flex h-full items-center justify-center bg-canvas"><Loader2 className="animate-spin text-muted" /></div>;
  if (profile && !profile.slug) return <Onboarding onDone={setProfile} />;

  const detailId = route.startsWith('/immobile/') ? route.slice('/immobile/'.length) : null;

  return (
    <div className="relative flex h-full flex-col font-body text-ink" style={DOTS}>
      <header className="sticky top-0 z-30">
        <ProgressiveBlur />
        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">
          <a href="#/" className="flex items-center gap-2">
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
          </a>
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-canvas p-1 md:flex">
            {[...NAV, ...(isPlatformAdmin(userData.email) ? [{ path: '/costi', label: 'Costi AI', icon: Gauge }] : [])].map(({ path, label }) => {
              const active = route === path || (path === '/immobili' && !!detailId);
              return <a key={path} href={`#${path}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ease-smooth transition-colors ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}</a>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <a href="#/nuovo" aria-label="Nuovo annuncio" title="Nuovo annuncio" className="btn-ink flex h-10 w-10 items-center justify-center rounded-full"><Plus size={18} /></a>
            <AccountMenu email={userData.email} credits={userData.credits} name={profile?.name ?? undefined} />
          </div>
        </div>
      </header>

      <main className={`flex-1 ${route === '/staging' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Home staging: la chat gestisce lo scorrimento da sola (campo fisso in fondo) */}
        <div key={route} className={`fade-up mx-auto max-w-6xl px-6 ${route === '/staging' ? 'h-full' : route === '/' || route === '/migliora' ? '' : 'pb-16 pt-8'}`}>
          {route === '/costi' && isPlatformAdmin(userData.email) ? (
            <CostsView />
          ) : route === '/migliora' ? (
            <HomeView key={query} name={profile?.name ?? undefined} initialUrl={new URLSearchParams(query).get('url') ?? ''} onSaved={reload} />
          ) : route === '/staging' ? (
            <StagingView />
          ) : route === '/importa' ? (
            <ImportView onDone={reload} />
          ) : route === '/nuovo' ? (
            <NewPropertyWizard onCreated={(p) => { reload(); go(`/immobile/${p.id}`); }} />
          ) : detailId ? (
            <PropertyDetail project={projects?.find(p => p.id === detailId)} loading={projects === null} onChange={reload} />
          ) : route === '/immobili' ? (
            <PropertyList projects={projects} />
          ) : route === '/portfolio' ? (
            <PortfolioView projects={projects} onChange={reload} />
          ) : (
            <HomeView name={profile?.name ?? undefined} onSaved={reload} />
          )}
        </div>
      </main>
    </div>
  );
}

// Home minimal: titolo piccolo su due toni, tre tessere dritte con un mini collage che si
// anima al passaggio del mouse. "Migliora" apre il campo link sotto le tessere.
// Card azione: si inclina verso il mouse (--rx/--ry), riflesso di luce (--sx/--sy) e
// variabili --mx/--my (-1..1) per la parallasse degli elementi del collage (.par-1/2/3).
function tiltMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  const st = e.currentTarget.style;
  st.setProperty('--ry', `${(x - 0.5) * 5}deg`); st.setProperty('--rx', `${(0.5 - y) * 4}deg`);
  st.setProperty('--mx', String((x - 0.5) * 2)); st.setProperty('--my', String((y - 0.5) * 2));
  st.setProperty('--sx', `${x * 100}%`); st.setProperty('--sy', `${y * 100}%`); st.setProperty('--lift', '-4px');
}
function tiltReset(el: HTMLElement) { ['--rx', '--ry', '--mx', '--my', '--lift'].forEach(k => el.style.removeProperty(k)); }

function Tile({ kicker, title, onClick, href, active, index, onHover, intro, wrapRef, wrapClass = '', wrapStyle, children }: { kicker: string; title: string; onClick?: () => void; href?: string; active?: boolean; index: number; onHover?: (on: boolean) => void; intro?: boolean; wrapRef?: React.Ref<HTMLDivElement>; wrapClass?: string; wrapStyle?: React.CSSProperties; children: React.ReactNode }) {
  const move = tiltMove;
  const leave = (e: React.MouseEvent<HTMLElement>) => { tiltReset(e.currentTarget); onHover?.(false); };
  const cls = `tilt group relative flex h-[22rem] w-full flex-col overflow-hidden rounded-[28px] bg-white p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/5 hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_30px_50px_-20px_rgba(0,0,0,.25)] active:scale-[0.985] sm:w-80 ${active ? 'ring-2 ring-ink' : ''}`;
  const props = { className: cls, onMouseMove: move, onMouseEnter: () => onHover?.(true), onMouseLeave: leave };
  const inner = (
    <>
      <span className="sheen pointer-events-none absolute inset-0 z-20" />
      <span className="par-1 text-sm text-muted">{kicker}</span>
      <span className="par-1 mt-1 text-2xl font-bold leading-tight tracking-tight">{title}</span>
      <div className="flex flex-1 items-center justify-center pt-4"><div className="relative h-40 w-full">{children}</div></div>
    </>
  );
  // Ingresso sul contenitore, inclinazione sulla card: due transform che non si sovrascrivono.
  return (
    <div ref={wrapRef} className={`w-full shrink-0 transition-all ease-smooth sm:w-80 ${intro ? 'rise' : ''} ${wrapClass}`} style={{ animationDelay: `${0.25 + index * 0.1}s`, ...wrapStyle }}>
      {href ? <a href={href} {...props}>{inner}</a> : <button type="button" onClick={onClick} {...props}>{inner}</button>}
    </div>
  );
}

// Score che sale da 42 a 86 mentre il mouse e' sulla card, colore rosso -> ambra -> verde.
function ScoreBadge({ on }: { on: boolean }) {
  const [n, setN] = useState(42);
  useEffect(() => {
    let raf = 0; const from = n, to = on ? 86 : 42, t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 900); setN(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  const color = n >= 75 ? 'bg-emerald-500' : n >= 55 ? 'bg-amber-400' : 'bg-rose-500';
  return <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg ease-smooth transition-colors ${color}`}>{n}{n >= 75 && ' ✓'}</span>;
}

const TITLE_WORDS = (name?: string) => (name ? `Ciao ${name.split(' ')[0]}, da dove partiamo?` : 'Da dove partiamo?').split(' ');


// Card "Migliora" che si trasforma in quattro fasi, sempre lo stesso box:
// closed (card) -> input (mini scheda + campo link) -> browser (il campo diventa la barra
// indirizzi, dentro l'annuncio in scansione) -> done (verdetto; i risultati escono sotto).
type Phase = 'closed' | 'input' | 'browser' | 'done';

function ImproveTile({ phase, stage, onOpen, onClose, onSubmit, onNew, hover, setHover, intro, url, setUrl, children }: {
  phase: Phase; stage: Stage; onOpen: () => void; onClose: () => void; onSubmit: () => void; onNew: () => void;
  hover: boolean; setHover: (v: boolean) => void; intro: boolean; url: string; setUrl: (v: string) => void; children: React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const open = phase !== 'closed';
  const flow = phase === 'browser' || phase === 'done';
  const busy = stage === 'opening' || stage === 'scanning';
  const ok = /^https?:\/\//i.test(url.trim());

  useEffect(() => {
    if (phase !== 'input') return;
    const t = setTimeout(() => input.current?.focus(), 600);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);

  const width = { closed: 'sm:w-80 delay-[120ms]', input: 'sm:w-[34rem]', browser: 'sm:w-[56rem]', done: 'sm:w-[56rem]' }[phase];
  const height = { closed: 'h-[22rem] p-6', input: 'h-[12.5rem] p-6 delay-[120ms]', browser: 'h-[36rem] p-4', done: 'h-[20rem] p-4' }[phase];

  return (
    <div className={`relative mx-2.5 w-full max-w-full shrink-0 transition-all ease-smooth ${width} ${intro ? 'rise' : ''}`} style={{ animationDelay: '0.25s' }}>
      {/* Fascio di scansione blu AgenteImmo: fuori dalla card (niente overflow), sporge dai bordi */}
      {stage === 'scanning' && (
        // la maschera taglia tutto cio' che esce dal suo box: il box sborda di 3rem sopra e sotto il percorso della linea, cosi' l'alone non si tronca
        <div className="blur-in pointer-events-none absolute -inset-x-5 -bottom-8 top-10 z-40" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}>
          {/* solo transform: gira sul compositor, fluido anche se la pagina e' occupata */}
          <div className="absolute inset-x-0 bottom-12 top-12 will-change-transform" style={{ animation: 'gnm-scan 2.2s ease-in-out infinite alternate' }}>
            <div className="absolute inset-x-0 top-0 h-24 -translate-y-1/2 bg-gradient-to-b from-transparent via-brand/20 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-0.5 -translate-y-1/2 bg-brand shadow-[0_0_14px_3px] shadow-brand/50" />
          </div>
        </div>
      )}
      <div role={open ? undefined : 'button'} tabIndex={open ? -1 : 0}
        onClick={open ? undefined : onOpen} onKeyDown={e => { if (!open && e.key === 'Enter') onOpen(); }}
        onMouseMove={open ? undefined : tiltMove} onMouseEnter={() => !open && setHover(true)} onMouseLeave={e => { tiltReset(e.currentTarget); setHover(false); }}
        className={`${open ? '' : 'tilt cursor-pointer active:scale-[0.985] hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_30px_50px_-20px_rgba(0,0,0,.25)]'} group relative flex w-full flex-col overflow-hidden rounded-[28px] bg-white text-left transition-[height,padding,box-shadow] ease-smooth ${height} ${CARD_SHADOW} ${open ? 'shadow-[0_1px_3px_rgba(0,0,0,.04),0_16px_40px_-22px_rgba(0,0,0,.18)]' : ''}`}>
        {!open && <span className="sheen pointer-events-none absolute inset-0 z-20" />}
        <button type="button" onClick={onClose} aria-label="Torna indietro" tabIndex={open ? 0 : -1}
          className={`absolute z-30 flex h-9 w-9 items-center justify-center rounded-full text-muted ease-smooth transition-all hover:bg-canvas hover:text-ink ${flow ? 'right-5 top-[26px]' : 'right-4 top-4'} ${open ? 'scale-100 opacity-100 delay-[450ms]' : 'pointer-events-none scale-75 opacity-0'}`}><X size={18} /></button>

        {/* Titolo della card: svanisce e si chiude */}
        <div className={`overflow-hidden transition-all ease-smooth ${open ? 'max-h-0 -translate-y-2 opacity-0 blur-[4px]' : 'max-h-24 delay-100'}`}>
          <span className="par-1 block text-sm text-muted">Hai già un annuncio online?</span>
          <span className="par-1 mt-1 block text-2xl font-bold leading-tight tracking-tight">Miglioralo</span>
        </div>

        {/* Mini scheda annuncio: diventa la pill sopra l'input, poi sparisce quando si apre il browser */}
        <div className={`flex items-center justify-center transition-all ease-smooth ${flow ? 'max-h-0 flex-none scale-95 overflow-hidden opacity-0' : 'max-h-60 flex-1'}`}>
          <div className={`relative transition-all ease-smooth ${open ? 'w-72 delay-[120ms]' : 'w-44'}`}>
            <div className="par-2">
              <div className={`flex transition-all ease-smooth ${open ? 'flex-row items-center gap-3 rounded-2xl bg-canvas p-2 pr-3 delay-[120ms]' : 'flex-col rounded-xl bg-white p-2 shadow-md group-hover:-rotate-2'}`}>
                <img src="/immo/home/card.webp" alt="" decoding="async" className={`shrink-0 object-cover transition-all ease-smooth ${open ? 'h-12 w-16 rounded-xl delay-[120ms]' : 'h-24 w-full rounded-lg'}`} />
                <div className={`min-w-0 flex-1 ease-smooth transition-all ${open ? '' : 'mt-2'}`}>
                  {['w-2/3', 'w-2/5', 'w-1/2'].map((w, i) => (
                    <div key={w} className={`${open ? '' : 'rewrite'} h-1.5 rounded bg-line ease-smooth transition-all ${i ? 'mt-1.5' : ''} ${open && i === 2 ? 'hidden' : w}`} />
                  ))}
                </div>
                {open && <span className="blur-in shrink-0" style={{ animationDelay: '.45s' }}><ScoreBadge on /></span>}
              </div>
            </div>
            {!open && <span className="par-3 absolute -right-4 -top-3 z-10"><ScoreBadge on={hover} /></span>}
          </div>
        </div>

        {/* Campo link: nel browser diventa la barra indirizzi */}
        <form onSubmit={e => { e.preventDefault(); if (ok && !busy) onSubmit(); }}
          className={`flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-canvas pl-5 transition-all ease-smooth focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/15 ${
            !open ? 'pointer-events-none max-h-0 translate-y-4 p-0 opacity-0' : flow ? 'mr-12 max-h-16 p-1.5 opacity-100' : 'mt-4 max-h-16 translate-y-0 p-1.5 opacity-100 delay-[250ms]'}`}>
          <span className={`flex shrink-0 gap-1.5 overflow-hidden ease-smooth transition-all ${flow ? 'max-w-16 opacity-100' : 'max-w-0 opacity-0'}`}>
            {['bg-[#ff5f57]', 'bg-[#febc2e]', 'bg-[#28c840]'].map(c => <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
          </span>
          <input ref={input} tabIndex={open ? 0 : -1} value={url} readOnly={busy || phase === 'done'} onChange={e => setUrl(e.target.value)} placeholder="https://www.immobiliare.it/annunci/..."
            className={`min-w-0 flex-1 bg-transparent py-2 pr-4 outline-none placeholder:text-muted/60 ease-smooth transition-all ${flow ? 'text-sm text-muted' : 'text-base'}`} />
          {busy ? (
            <span className="blur-in flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium"><Loader2 size={15} className="animate-spin" /> {stage === 'opening' ? 'Apro' : 'Analizzo'} <Elapsed key={stage} /></span>
          ) : phase === 'done' ? (
            <button type="button" onClick={onNew} className="blur-in h-11 shrink-0 rounded-full bg-white px-5 text-sm font-semibold hover:bg-ink hover:text-white">Nuova analisi</button>
          ) : (
            <button disabled={!ok} tabIndex={open ? 0 : -1} className="h-11 shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-30 disabled:active:scale-100">{flow ? 'Riprova' : 'Analizza'}</button>
          )}
        </form>

        {/* Barra di avanzamento sotto la barra indirizzi: stima, sale veloce e rallenta verso il 95% */}
        {stage === 'scanning' && <ScanProgress />}

        {/* Corpo del browser: annuncio in scansione, poi verdetto */}
        <div className={`min-h-0 overflow-hidden transition-all ease-smooth ${flow ? 'mt-3 flex-1 opacity-100 delay-[120ms]' : 'max-h-0 flex-none opacity-0'}`}>
          {flow && children}
        </div>
      </div>
    </div>
  );
}

// ponytail: stima, non avanzamento reale (Qwen non lo espone). Curva 1 - e^(-t/40): ~50% a 28 s,
// ~90% a 90 s, ferma al 95%. Se la durata tipica cambia, cambiare TAU.
const TAU = 40;
function ScanProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const t = setInterval(() => setP(Math.min(95, 100 * (1 - Math.exp(-(Date.now() - t0) / 1000 / TAU)))), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="blur-in mx-5 mt-2 h-1 shrink-0 overflow-hidden rounded-full bg-canvas">
      <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-linear" style={{ width: `${p}%` }} />
    </div>
  );
}

// Prima/dopo della tessera Home staging: con il mouse sopra la linea va e viene (1,6 s per corsa,
// ease-in-out), quando esce torna al centro con la transizione standard: niente scatti ne' in entrata ne' in uscita.
function StageCompare({ active }: { active: boolean }) {
  const [p, setP] = useState(50);
  useEffect(() => {
    const first = setTimeout(() => setP(active ? 85 : 50), 0);
    if (!active) return () => clearTimeout(first);
    let i = 0;
    const loop = setInterval(() => { i = 1 - i; setP(i ? 15 : 85); }, 1700);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, [active]);
  const t = active ? 'clip-path 1.6s cubic-bezier(.65,0,.35,1), left 1.6s cubic-bezier(.65,0,.35,1)' : 'clip-path var(--gnm-dur) var(--gnm-ease), left var(--gnm-dur) var(--gnm-ease)';
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
      <img src="/immo/home/staging-after.webp" alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <img src="/immo/home/staging-before.webp" alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - p}% 0 0)`, transition: t }} />
      <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,.4)]" style={{ left: `${p}%`, transition: t }}>
        <span className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[9px] font-bold text-ink shadow">‹›</span>
      </span>
    </div>
  );
}

const TITLES: Record<string, [string, string]> = {
  link: ['Incolla il link dell\'annuncio', 'Da qualsiasi portale immobiliare.'],
  opening: ['Apro l\'annuncio', 'Lo leggo dal tuo browser, in background.'],
  scanning: ['Sto analizzando l\'annuncio', ''],
  done: ['Ecco il tuo annuncio, migliorato', 'Score, versione riscritta e cosa sistemare.'],
  'no-extension': ['Manca solo un passo', 'Installa l\'estensione per leggere l\'annuncio.'],
  error: ['Non riesco a leggerlo', 'Riprova o incolla il testo dell\'annuncio.'],
  manual: ['Incolla il testo dell\'annuncio', 'Titolo, prezzo, caratteristiche e descrizione.'],
};

export function HomeView({ name, initialUrl = '', onSaved }: { name?: string; initialUrl?: string; onSaved?: () => void }) {
  const imp = useImprove();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [hover, setHover] = useState(false);
  const [stageHover, setStageHover] = useState(false);
  const [intro, setIntro] = useState(true);
  const phase: Phase = !open ? 'closed' : imp.stage === 'input' ? 'input' : imp.stage === 'done' ? 'done' : 'browser';

  // Titolo: quando cambia fase esce, cambia testo a meta' transizione e rientra.
  const key = phase === 'closed' ? 'home' : phase === 'input' ? 'link' : imp.stage;
  const [shown, setShown] = useState(key);
  const [titleOut, setTitleOut] = useState(false);
  useEffect(() => {
    if (key === shown) return;
    const a = setTimeout(() => setTitleOut(true), 0);
    const b = setTimeout(() => { setShown(key); setTitleOut(false); }, 300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [key, shown]);

  // Arrivo da #/migliora?url=... : parte subito.
  useEffect(() => {
    if (!initialUrl) return;
    const t = setTimeout(() => { setIntro(false); setOpen(true); warm('analysis'); imp.start(initialUrl); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // Apre Migliora = intenzione di analizzare: si accende la GPU dell'analisi (avvio a freddo ~3,5 min).
  const openLink = () => { setIntro(false); setOpen(true); warm('analysis'); };
  const vetrina = (name ?? 'tuonome').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const close = () => { imp.reset(); setOpen(false); };
  const restart = () => { imp.reset(); setUrl(''); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); };

  const [head, sub] = shown === 'home' ? [TITLE_WORDS(name).join(' '), 'Migliora, pubblica o arreda.'] : TITLES[shown];
  const subtitle = shown === 'scanning' ? `${SCAN_STEPS[imp.step]}...` : sub;
  // Apertura: parte il container (altre card via, box al centro), la card si trasforma subito dopo, sovrapposta.
  // Chiusura: al contrario, con gli stessi piccoli sfalsamenti.
  const others = (i: number) => `mx-2.5 ${open ? 'pointer-events-none -my-2.5 max-h-0 overflow-hidden sm:mx-0! sm:my-0 sm:w-0! scale-75 opacity-0 blur-[8px]' : `max-h-[24rem] ${i === 1 ? 'delay-[160ms]' : 'delay-[220ms]'}`}`;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center py-10">
      <h1 className={`text-center font-display text-4xl font-bold leading-[1.2] tracking-tight ease-smooth transition-all md:text-5xl md:leading-[1.2] ${titleOut ? '-translate-y-3 opacity-0 blur-[6px]' : ''}`}>
        {head.split(' ').map((w, i) => <span key={`${shown}-${i}`} className="blur-in inline-block" style={{ animationDelay: `${i * 0.05}s` }}>{w}&nbsp;</span>)}
        <span key={subtitle} className="blur-in block text-muted/70" style={{ animationDelay: shown === 'scanning' ? '0s' : '0.3s' }}>{subtitle}</span>
      </h1>

      <div className="mt-14 flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:gap-0">
        <ImproveTile phase={phase} stage={imp.stage} onOpen={openLink} onClose={close} onSubmit={() => imp.start(url)} onNew={restart}
          hover={hover} setHover={setHover} intro={intro} url={url} setUrl={setUrl}>
          {/* Il contenuto segue il titolo: sfuma, cambia a meta' tempo, rientra (niente salti tra scansione e verdetto) */}
          <div className={`h-full ease-smooth transition-opacity ${titleOut ? 'opacity-0' : ''}`}>
            {shown === 'done' && imp.listing && imp.analysis
              ? <Verdict listing={imp.listing} analysis={imp.analysis} />
              : <BrowserBody stage={imp.stage} listing={imp.listing} error={imp.error} url={url} onRetry={() => imp.start(url)} onManual={imp.manual} onText={t => imp.analyzeText(url, t)} />}
          </div>
        </ImproveTile>

        {/* Crea: foto a ventaglio con molla + "+" che ruota */}
        <Tile index={1} intro={intro} wrapClass={others(1)} kicker="Hai preso un immobile nuovo?" title="Mettilo in vetrina" href="#/nuovo">
          {/* la vetrina e' la pagina AgenteImmo dell'agente: si capisce dalla barra indirizzi */}
          <span className="par-1 absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-medium text-muted shadow-md ring-1 ring-black/5 transition-transform ease-smooth group-hover:-translate-y-1"><Globe size={11} className="text-brand" /> agenteimmo.me/<span className="text-ink">{vetrina}</span></span>
          {['/immo/home/fan-1.webp', '/immo/home/fan-2.webp', '/immo/home/fan-3.webp'].map((src, i) => (
            <div key={src} className={`absolute left-1/2 top-4 ${['par-1', 'par-2 z-10', 'par-3'][i]}`}>
              <img src={src} alt="" className={`h-32 w-24 -translate-x-1/2 rounded-xl object-cover shadow-md ring-2 ring-white transition-transform ease-smooth ${
                ['-translate-x-[90%] -rotate-12 group-hover:-translate-x-[118%] group-hover:-rotate-[18deg]', 'group-hover:-translate-y-3 group-hover:scale-105', '-translate-x-[10%] rotate-12 group-hover:translate-x-[18%] group-hover:rotate-[18deg]'][i]}`} />
            </div>
          ))}
          <span className="par-3 absolute -bottom-2 left-1/2 z-20 -translate-x-1/2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-transform ease-smooth group-hover:rotate-90 group-hover:scale-110"><Plus size={18} /></span>
          </span>
        </Tile>

        {/* Home staging: stanza vuota -> arredata, la linea prima/dopo scorre al passaggio del mouse */}
        <Tile index={2} intro={intro} wrapClass={others(2)} onHover={setStageHover} kicker="Hai una stanza vuota?" title="Home staging" href="#/staging">
          <div className="par-2 absolute left-1/2 top-1/2 w-52 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-1.5 shadow-md transition-transform ease-smooth group-hover:rotate-1">
            <StageCompare active={stageHover} />
          </div>
          <span className="par-3 absolute -top-1 right-[14%] z-10 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white shadow-lg transition-transform ease-smooth group-hover:scale-110"><Wand2 size={12} /> AI</span>
        </Tile>
      </div>

      {phase === 'done' && imp.listing && imp.analysis && <Results listing={imp.listing} analysis={imp.analysis} onSaved={onSaved} onRestart={restart} />}
    </div>
  );
}

function AccountMenu({ email, credits, name }: { email: string; credits: number; name?: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name || email)[0]?.toUpperCase();
  return (
    <div className="relative">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold shadow-sm ring-1 ring-line"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {credits} crediti</span>
        <button onClick={() => setOpen(v => !v)} aria-label="Account" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm ring-1 ring-line ease-smooth transition-shadow hover:shadow-md">{initial}</button>
      </div>
      {open && (
        <div className="float-bar absolute right-0 top-12 z-40 w-60 rounded-2xl p-2" onMouseLeave={() => setOpen(false)}>
          <div className="px-3 py-2"><div className="truncate text-sm font-semibold">{name || 'Account'}</div><div className="truncate text-xs text-muted">{email}</div></div>
          <a href="#/portfolio" className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas">Il mio portfolio</a>
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas"><LogOut size={15} /> Esci</button>
        </div>
      )}
    </div>
  );
}

function PropertyList({ projects }: { projects: ProjectData[] | null }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Immobili</h1>
        <a href="#/nuovo" className="flex items-center gap-2 btn-ink rounded-xl px-4 py-2 text-sm font-semibold"><Plus size={16} /> Nuovo</a>
      </div>
      <div className="mt-8"><PropertyGrid projects={projects} /></div>
    </>
  );
}

export function PropertyGrid({ projects }: { projects: ProjectData[] | null }) {
  if (!projects) return <Loader2 className="animate-spin text-muted" />;
  if (!projects.length) return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="icon-badge float flex h-14 w-14 items-center justify-center rounded-2xl"><Building2 size={26} /></span>
      <p className="mt-5 font-display text-lg font-semibold">Ancora nessun immobile</p>
      <p className="mt-1 max-w-xs text-sm text-muted">Crea il primo annuncio da zero o importa quelli che hai già: compariranno qui e nel tuo portfolio.</p>
      <a href="#/nuovo" className="btn-primary mt-6 rounded-xl px-6 py-3 text-sm font-semibold">Crea il primo annuncio</a>
    </div>
  );
  return (
    <div className="stagger grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(p => {
        const score = (p.import_data as { score?: number } | undefined)?.score;
        return (
          <a key={p.id} href={`#/immobile/${p.id}`} className="group block">
            <div className="relative aspect-[20/19] overflow-hidden rounded-2xl bg-canvas">
              {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover ease-smooth transition group-hover:scale-[1.04]" />}
              {p.is_public && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">Nel portfolio</span>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{p.addr?.split(',').slice(-1)[0]?.trim() || 'Indirizzo n.d.'}</div>
                <div className="truncate text-sm text-muted">{p.titolo || p.nome}</div>
                <div className="mt-1.5 text-[15px]"><span className="font-semibold">{formatPrice(p.prezzo)}</span>{p.mq ? <span className="text-muted"> · {p.mq} m²</span> : null}</div>
              </div>
              {typeof score === 'number' && <span className="badge-warm shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold">{score}</span>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-white px-6 font-body text-ink">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-9 w-9" /><span className="font-display text-xl font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span></div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Come ti chiami?</h1>
        <p className="mt-1 text-sm text-muted">Il tuo nome apparirà sul portfolio pubblico, la vetrina con i tuoi immobili da condividere con i clienti.</p>
        <div className="mt-6"><ProfileForm initial={{ name: null, slug: null }} submitLabel="Continua" onSaved={onDone} /></div>
      </div>
    </div>
  );
}
