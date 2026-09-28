'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Home, Building2, Globe, Gauge, LogOut, Plus, Loader2, X, Wand2, Images, ExternalLink, UserRound, ArrowLeft } from 'lucide-react';
import type { UserData } from '@/app/[locale]/dashboard/page';
import { supabase } from '@/lib/supabase';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import NewPropertyWizard from './NewPropertyWizard';
import PropertyDetail from './PropertyDetail';
import PortfolioView, { TemplatePreview } from './PortfolioView';
import Tour, { TOUR_KEY } from './Tour';
import type { TemplateId } from '@/lib/siteTemplates';
import ImportView from './ImportView';
import { BrowserBody, Results, SCAN_STEPS, useImprove, Verdict, type Stage } from './ImproveView';
import { Elapsed } from './AiPhoto';
import CostsView from './CostsView';
import StagingView from './StagingView';
import MediaView from './MediaView';
import PropertiesView from './PropertiesView';
import { isPlatformAdmin } from '@/lib/platformAdmins';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { go, formatPrice, authFetch, CARD_SHADOW, warm } from './api';
import ProfileForm, { type Profile } from './ProfileForm';
import Onboarding from './Onboarding';
import PlanView, { CreditsPill, DemoDownload, hasDemo, isBuy, NoCreditsModal } from './PlanView';
import { tiltMove, tiltReset } from '@/components/ui/tilt';

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
  { path: '/portfolio', label: 'Il mio sito', icon: Globe },
  { path: '/galleria', label: 'Galleria', icon: Images },
];

export default function PlatformApp({ userData }: { userData: UserData }) {
  const [route, query = ''] = useHashRoute().split('?');
  const [projects, setProjects] = useState<ProjectData[] | null>(null);

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  // fine onboarding: le card si trasformano nella home (View Transitions). Resta la pagina dove e' successo:
  // mai rimesso a false, altrimenti a fine transizione torna fade-up e il contenuto riparte da trasparente (scatto)
  const [morphAt, setMorphAt] = useState<string | null>(null);
  const [demoGate, setDemoGate] = useState(hasDemo);
  // tour guidato: dopo l'onboarding (flag in localStorage) o da #/tour
  const [tour, setTour] = useState(() => { try { return localStorage.getItem(TOUR_KEY) === '1'; } catch { return false; } });
  const morph = morphAt === route;

  const reload = () => fetchProjects().then(setProjects);
  useEffect(() => {
    reload();
    authFetch('/api/platform/portfolio').then(r => r.json()).then(d => setProfile({ name: d.name, slug: d.slug })).catch(() => setProfile(null));
  }, []);

  // Onboarding: finche' l'agente non ha scelto nome + indirizzo portfolio, niente piattaforma.
  if (profile === undefined) return <div className="flex h-full items-center justify-center bg-canvas"><Loader2 className="animate-spin text-muted" /></div>;
  // #/benvenuto la rimostra a chi vuole rivederla (tutta: scarica la prova se c'e', onboarding, tour).
  // agente nuovo arrivato dalla prova della landing: prima scarica foto/video, poi l'onboarding dall'inizio
  if (profile && (!profile.slug || route === '/benvenuto') && demoGate) return <div className="h-full" style={DOTS}><DemoDownload onDone={() => setDemoGate(false)} /></div>;
  if (profile && (!profile.slug || route === '/benvenuto')) return <Onboarding onDone={p => {
    // arrivato scegliendo un piano sulla landing: finito l'onboarding si va dritti al pagamento
    if (/^#\/piano\?buy=/.test(location.hash)) { setProfile(p); return; }
    // hashchange lanciato a mano: e' sincrono, cosi' la home e' gia' nel DOM quando il browser cattura lo stato nuovo
    // tour solo a transizione finita: finche' dura, le card della home stanno sopra a tutto (anche sopra il velo)
    localStorage.setItem(TOUR_KEY, '1');
    const tourLater = () => setTimeout(() => setTour(true), 800);
    const swap = () => flushSync(() => { history.replaceState(null, '', '#/'); window.dispatchEvent(new HashChangeEvent('hashchange')); setMorphAt('/'); setProfile(p); });
    if (!document.startViewTransition) { swap(); tourLater(); return; }
    document.startViewTransition(swap).finished.finally(tourLater);
  }} />;

  if (route === '/tour' && !tour) queueMicrotask(() => { history.replaceState(null, '', '#/'); window.dispatchEvent(new HashChangeEvent('hashchange')); setTour(true); });
  // anteprima di un modello del sito (aperta in un'altra scheda dalla galleria dei modelli)
  if (route.startsWith('/anteprima/')) return <TemplatePreview id={route.slice('/anteprima/'.length) as TemplateId} projects={projects} solo={new URLSearchParams(query).get('solo') === '1'} pagina={new URLSearchParams(query).get('pagina')} />;
  const detailId = route.startsWith('/immobile/') ? route.slice('/immobile/'.length) : null;
  const chat = route === '/staging';

  return (
    <div className="relative flex h-full flex-col font-body text-ink" style={DOTS}>
      <NoCreditsModal />
      <DemoDownload />
      {tour && !chat && <Tour onDone={() => setTour(false)} />}
      <header style={morph ? { viewTransitionName: 'ob-nav' } : undefined} className={`${route === '/immobili' ? 'absolute inset-x-0' : 'sticky'} top-0 z-30`}>
        <ProgressiveBlur />
        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">
          {/* in chat: niente logo, menu e Metti in vetrina, solo Indietro (la chat ha tutto lo spazio) */}
          {chat ? (
            <button type="button" onClick={() => (history.length > 1 ? history.back() : (location.hash = '#/'))}
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><ArrowLeft size={18} /> Indietro</button>
          ) : <>
          <a href="#/" className="flex items-center gap-2">
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" style={{ viewTransitionName: 'ob-logo' }} />
            <span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
          </a>
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-canvas p-1 md:flex">
            {NAV.map(({ path, label }) => {
              const active = route === path || (path === '/immobili' && !!detailId);
              return <a key={path} href={`#${path}`} data-tour={path} className={`rounded-full px-4 py-1.5 text-sm font-medium ease-smooth transition-colors ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}</a>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <span data-tour="crediti"><CreditsPill /></span>
            <a href="#/nuovo" data-tour="nuovo" className="flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.98]">Metti in vetrina</a>
          </div>
          </>}
        </div>
      </header>

      {/* Profilo: solo icona e testo; in home al centro in basso, nelle altre pagine in basso a sinistra, in chat no */}
      {!chat && <a href="#/profilo" data-tour="profilo" style={morph ? { viewTransitionName: 'ob-bottom' } : undefined} className={`fixed bottom-5 z-30 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-line ease-smooth transition-shadow hover:shadow-md ${route === '/' ? 'left-1/2 -translate-x-1/2' : 'left-5'} ${route === '/profilo' ? 'ring-ink' : ''}`}>
        <UserRound size={16} className="text-muted" /> Il mio profilo
      </a>}

      <main className={`flex-1 ${route === '/staging' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Home staging: la chat gestisce lo scorrimento da sola (campo fisso in fondo) */}
        <div key={route} className={`${morph ? '' : 'fade-up'} ${route === '/immobili' ? '' : 'mx-auto max-w-6xl px-6'} ${route === '/immobili' ? '' : route === '/staging' ? 'h-full' : route === '/' || route === '/migliora' ? '' : 'pb-16 pt-8'}`}>
          {route === '/profilo' ? (
            <ProfileView email={userData.email} profile={profile ?? null} onSaved={setProfile} admin={isPlatformAdmin(userData.email)} />
          ) : route === '/piano' ? (
            <PlanView ok={new URLSearchParams(query).get('ok') === '1'} buy={(b => (isBuy(b) ? b : undefined))(new URLSearchParams(query).get('buy'))} />
          ) : route === '/costi' && isPlatformAdmin(userData.email) ? (
            <CostsView />
          ) : route === '/migliora' ? (
            <HomeView key={query} name={profile?.name ?? undefined} initialUrl={new URLSearchParams(query).get('url') ?? ''} onSaved={reload} />
          ) : route === '/staging' ? (
            <StagingView initial={{ photo: new URLSearchParams(query).get('photo') ?? undefined, project: new URLSearchParams(query).get('project') ?? undefined }} />
          ) : route === '/galleria' ? (
            <MediaView />
          ) : route === '/importa' ? (
            <ImportView onDone={reload} />
          ) : route === '/nuovo' ? (
            <NewPropertyWizard onCreated={(p) => { reload(); go(`/immobile/${p.id}`); }} />
          ) : detailId ? (
            <PropertyDetail project={projects?.find(p => p.id === detailId)} loading={projects === null} onChange={reload} />
          ) : route === '/immobili' ? (
            <PropertiesView projects={projects} />
          ) : route === '/portfolio' ? (
            <PortfolioView projects={projects} onChange={reload} />
          ) : (
            <HomeView name={profile?.name ?? undefined} onSaved={reload} morph={morph} />
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
      <div className="flex flex-1 items-center justify-center pt-4"><div className="relative h-40 w-full scale-110">{children}</div></div>
    </>
  );
  // Ingresso sul contenitore, inclinazione sulla card: due transform che non si sovrascrivono.
  return (
    <div ref={wrapRef} className={`w-full shrink-0 transition-all ease-smooth sm:w-80 ${intro ? 'rise' : ''} ${wrapClass}`} style={{ animationDelay: `${0.25 + index * 0.1}s`, viewTransitionName: `ob-card-${index}`, ...wrapStyle }}>
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
    <div className={`relative mx-2.5 w-full max-w-full shrink-0 transition-all ease-smooth ${width} ${intro ? 'rise' : ''}`} style={{ animationDelay: '0.25s', viewTransitionName: 'ob-card-0' }}>
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
          <div className={`relative transition-all ease-smooth ${open ? 'w-72 delay-[120ms]' : 'w-48'}`}>
            <div className="par-2">
              <div className={`flex transition-all ease-smooth ${open ? 'flex-row items-center gap-3 rounded-2xl bg-canvas p-2 pr-3 delay-[120ms]' : 'flex-col rounded-xl bg-white p-2 shadow-md group-hover:-rotate-2'}`}>
                <img src="/immo/home/card.webp" alt="" decoding="async" className={`shrink-0 object-cover transition-all ease-smooth ${open ? 'h-12 w-16 rounded-xl delay-[120ms]' : 'h-[6.5rem] w-full rounded-lg'}`} />
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

export function HomeView({ name, initialUrl = '', onSaved, morph }: { name?: string; initialUrl?: string; onSaved?: () => void; morph?: boolean }) {
  const imp = useImprove();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [hover, setHover] = useState(false);
  const [stageHover, setStageHover] = useState(false);
  const [d0] = useState(morph ? 0.5 : 0); // dall'onboarding: il titolo entra quando le card sono quasi al loro posto
  const [intro, setIntro] = useState(!morph); // arrivando dall'onboarding le card ci sono gia', niente ingresso
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
        {head.split(' ').map((w, i) => <span key={`${shown}-${i}`} className="blur-in inline-block" style={{ animationDelay: `${d0 + i * 0.05}s` }}>{w}&nbsp;</span>)}
        <span key={subtitle} className="blur-in block text-muted/70" style={{ animationDelay: shown === 'scanning' ? '0s' : `${d0 + 0.3}s` }}>{subtitle}</span>
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
          <span className="par-1 absolute -top-3 left-1/2 z-20 -translate-x-1/2"><span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-medium text-muted shadow-md ring-1 ring-black/5 ease-smooth transition-[translate] group-hover:-translate-y-1"><Globe size={11} className="text-brand" /><span>agenteimmo.me/<span className="text-ink">{vetrina}</span></span></span></span>
          {['/immo/home/fan-1.webp', '/immo/home/fan-2.webp', '/immo/home/fan-3.webp'].map((src, i) => (
            <div key={src} className={`absolute left-1/2 ${i === 1 ? 'top-4' : 'top-6'} ${['par-1', 'par-2 z-10', 'par-3'][i]}`}>
              <img src={src} alt="" className={`${i === 1 ? 'h-32' : 'h-28'} w-24 -translate-x-1/2 rounded-xl object-cover shadow-md ring-2 ring-white transition-transform ease-smooth ${
                ['-translate-x-[90%] -rotate-12 group-hover:-translate-x-[118%] group-hover:-rotate-[18deg]', 'group-hover:-translate-y-3 group-hover:scale-105', '-translate-x-[10%] rotate-12 group-hover:translate-x-[18%] group-hover:rotate-[18deg]'][i]}`} />
            </div>
          ))}
          <span className="par-3 absolute -bottom-2 left-1/2 z-20 -translate-x-1/2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-transform ease-smooth group-hover:rotate-90 group-hover:scale-110"><Plus size={18} /></span>
          </span>
        </Tile>

        {/* Home staging: stanza vuota -> arredata, la linea prima/dopo scorre al passaggio del mouse */}
        <Tile index={2} intro={intro} wrapClass={others(2)} onHover={setStageHover} kicker="Hai una stanza vuota?" title="Home staging" href="#/staging">
          {/* .par-2 imposta la sua transizione su transform: la rotazione sta su un contenitore a parte, cosi' e' morbida */}
          <div className="par-2 absolute left-1/2 top-1/2 w-52 -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-xl bg-white p-1.5 shadow-md ease-smooth transition-[rotate,scale,box-shadow] group-hover:rotate-2 group-hover:scale-[1.03] group-hover:shadow-lg">
              <StageCompare active={stageHover} />
            </div>
          </div>
          <span className="par-3 absolute -top-1 right-[14%] z-10"><span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white shadow-lg ease-smooth transition-[scale] group-hover:scale-110"><Wand2 size={12} /> AI</span></span>
        </Tile>
      </div>

      {phase === 'done' && imp.listing && imp.analysis && <Results listing={imp.listing} analysis={imp.analysis} onSaved={onSaved} onRestart={restart} />}
    </div>
  );
}

// Profilo: nome e indirizzo della vetrina (stesso modulo dell'onboarding), link alla vetrina, uscita.
function ProfileView({ email, profile, onSaved, admin }: { email: string; profile: Profile | null; onSaved: (p: Profile) => void; admin: boolean }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Il mio profilo</h1>
      <p className="mt-1 text-muted">{email}</p>
      <div className={`mt-8 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
        <h2 className="font-semibold">Il tuo sito personale</h2>
        <p className="mt-1 text-sm text-muted">Il nome che vedono i clienti e l&apos;indirizzo della pagina con le tue case.</p>
        <div className="mt-5"><ProfileForm initial={profile ?? { name: null, slug: null }} submitLabel="Salva" onSaved={onSaved} /></div>
        {profile?.slug && <a href="#/portfolio" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">Modifica il tuo sito</a>}
      </div>
      {/* Costi AI: solo per gli amministratori, qui invece che nel menu */}
      {admin && (
        <a href="#/costi" className={`mt-4 flex items-center gap-3 rounded-[28px] bg-white p-6 ease-smooth transition-shadow hover:shadow-md ${CARD_SHADOW}`}>
          <Gauge size={18} className="text-muted" /><span className="flex-1"><span className="block font-semibold">Costi AI</span><span className="block text-sm text-muted">Spesa per le foto e i video generati</span></span>
        </a>
      )}
      {/* documenti legali */}
      <div className={`mt-4 rounded-[28px] bg-white p-2 ${CARD_SHADOW}`}>
        {([['Privacy', '/it/privacy'], ['Termini e condizioni', '/it/termini'], ['Cookie', '/it/cookie'], ['Come cancelliamo i dati', '/it/data-deletion']] as const).map(([l, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener" className="flex h-12 items-center justify-between rounded-[20px] px-4 text-sm font-medium ease-smooth transition-colors hover:bg-canvas">{l}<ExternalLink size={15} className="text-muted" /></a>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-line hover:bg-white hover:text-ink"><LogOut size={15} /> Esci</button>
        <DeleteAccount />
      </div>
    </div>
  );
}

// Eliminazione dell'account: conferma scrivendo ELIMINA. Cancella account, immobili, sito, foto create e
// l'abbonamento Stripe (/api/account/delete), poi esce.
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true); setErr('');
    const r = await authFetch('/api/account/delete', { method: 'DELETE' }).catch(() => null);
    if (!r?.ok) { setBusy(false); setErr('Non sono riuscito a eliminare l’account, riprova o scrivici.'); return; }
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Elimina account</button>
      {open && (
        <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => !busy && setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Eliminare l’account?</h2>
            <p className="pt-2 text-sm text-muted">Cancelliamo per sempre il tuo account, gli immobili, il tuo sito, le foto della Galleria e l’eventuale abbonamento. Non si può annullare.</p>
            <label className="mt-5 block text-xs font-medium text-ink/70">Per confermare scrivi <b>ELIMINA</b>
              <input value={word} onChange={e => setWord(e.target.value)} autoFocus className="mt-1.5 h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
            </label>
            {err && <p className="pt-3 text-sm text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2 pt-6">
              <button disabled={busy} onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-canvas">Annulla</button>
              <button disabled={busy || word.trim() !== 'ELIMINA'} onClick={run} className="flex h-10 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40">{busy && <Loader2 size={15} className="animate-spin" />} Elimina per sempre</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
