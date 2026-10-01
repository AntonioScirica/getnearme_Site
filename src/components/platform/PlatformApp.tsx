'use client';

import ConsentGate from './ConsentGate';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { History, Home, MessageSquare, SquarePen, Building2, Globe, Gauge, LogOut, Plus, Loader2, X, Wand2, Images, ExternalLink, UserRound, ArrowLeft, Download, BookOpen, ChevronDown, Gift, Lock } from 'lucide-react';
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
import CostsView from './CostsView';
import AffiliatesView from './AffiliatesView';
import StagingView from './StagingView';
import MediaView, { useGalleryNews } from './MediaView';
import PropertiesView from './PropertiesView';
import { isPlatformAdmin } from '@/lib/platformAdmins';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { go, formatPrice, authFetch, CARD_SHADOW } from './api';
import ProfileForm, { type Profile } from './ProfileForm';
import Onboarding from './Onboarding';
import PlanView, { CreditsPill, DemoDownload, hasDemo, isBuy, NoCreditsModal, useCredits } from './PlanView';
import { tiltMove, tiltReset } from '@/components/ui/tilt';
import { tr, lp, pageLocale } from './i18n';
import ImmoLoader from '@/components/ui/ImmoLoader';

// Routing a hash (#/immobili, #/nuovo, #/immobile/<id>): back/forward del browser
// funzionano senza toccare le route Next della vecchia dashboard.
// chi arriva dalla prova gratis della landing (segno nel browser): si segnala una volta, per contare gli iscritti dalla prova
function useDemoTrack() {
  useEffect(() => {
    try {
      if (!localStorage.getItem('agenteimmo:demo-used') || localStorage.getItem('agenteimmo:demo-tracked')) return;
      const video = !!localStorage.getItem('agenteimmo:demo-video');
      authFetch('/api/platform/demo-track', { method: 'POST', body: JSON.stringify({ video }) })
        .then(r => { if (r.ok) localStorage.setItem('agenteimmo:demo-tracked', '1'); }).catch(() => {});
    } catch { /* niente storage */ }
  }, []);
}

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
  { path: '/staging', label: 'Chat', icon: MessageSquare },
  { path: '/immobili', label: tr('Immobili', 'Properties'), icon: Building2 },
  { path: '/portfolio', label: tr('Il mio sito', 'My website'), icon: Globe },
  { path: '/galleria', label: tr('Galleria', 'Gallery'), icon: Images },
];

// Storico delle chat (api/platform/chats): elenco con anteprima, titolo e data; un clic riapre la chat e si continua.
// Le chat piu' vecchie di 30 giorni si cancellano da sole.
function ChatHistory() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<{ id: string; title: string; thumb: string | null; at: number; days: number }[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    authFetch('/api/platform/chats').then(r => (r.ok ? r.json() : { chats: [] })).then((d: { chats?: { id: string; title: string; thumb: string | null; at: number }[] }) => { const now = Date.now(); setList((d.chats ?? []).map(c => ({ ...c, days: Math.floor((now - c.at) / 86_400_000) }))); }).catch(() => setList([]));
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, [open]);
  const when = (d: number) => (d === 0 ? tr('Oggi', 'Today') : d === 1 ? tr('Ieri', 'Yesterday') : tr(`${d} giorni fa`, `${d} days ago`));
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => { if (!open) setList(null); setOpen(o => !o); }} aria-expanded={open} aria-label={tr('Storico delle chat', 'Chat history')} title={tr('Storico delle chat', 'Chat history')} className="group flex h-10 w-10 items-center justify-center lg:h-8 lg:w-8"><span className={`flex h-8 w-8 items-center justify-center rounded-full ease-smooth transition-colors ${open ? 'bg-ink text-white' : 'bg-canvas text-ink group-hover:bg-line'}`}><History size={16} /></span></button>
      {open && (
        <div className="blur-in absolute -right-1 top-11 z-50 w-80 rounded-[24px] bg-white p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5">
          <div className="px-3 pb-2 pt-1.5 text-xs text-muted">{tr('Le chat restano 30 giorni. Foto e video li trovi sempre in Galleria.', 'Chats are kept for 30 days. Your photos and videos are always in the Gallery.')}</div>
          <div className="max-h-[60vh] overflow-y-auto">
            {!list ? <div className="flex h-20 items-center justify-center"><Loader2 size={18} className="animate-spin text-muted" /></div>
              : !list.length ? <p className="px-3 py-6 text-center text-sm text-muted">{tr('Ancora nessuna chat.', 'No chats yet.')}</p>
              : list.map(c => (
                <button key={c.id} type="button" onClick={() => { window.dispatchEvent(new CustomEvent('agenteimmo:open-chat', { detail: c.id })); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left ease-smooth transition-colors hover:bg-canvas">
                  {c.thumb ? <img src={c.thumb} alt="" className="h-11 w-14 shrink-0 rounded-xl object-cover" /> : <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-canvas text-muted"><Wand2 size={16} /></span>}
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.title}</span><span className="block text-xs text-muted">{when(c.days)}</span></span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformApp(props: { userData: UserData }) {
  return <><ConsentGate /><PlatformInner {...props} /></>;
}

function PlatformInner({ userData }: { userData: UserData }) {
  const credits = useCredits(); // senza piano niente Metti in vetrina in alto
  // senza piano ma con crediti da pacchetto (pagati, non scadono): si usa tutto come con un piano
  const noPlan = !!credits && credits.plan === 'none' && !credits.unlimited && credits.balance <= 0;
  const [homeOpen, setHomeOpen] = useState(false); // Miglioralo aperto in home: niente pillola Importa immobile
  useEffect(() => {
    const on = (e: Event) => setHomeOpen(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener('agenteimmo:home-open', on);
    return () => window.removeEventListener('agenteimmo:home-open', on);
  }, []);
  const blockNoPlan = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new Event('agenteimmo:no-credits')); };
  useDemoTrack();
  const [route, query = ''] = useHashRoute().split('?');
  const news = useGalleryNews(userData.id, route === '/galleria');
  // abbonamento finito senza rinnovo (e niente crediti): foto, immobili e sito si vedono sfocati col lucchetto.
  // Chi non ha mai pagato no: puo' entrare e provare come sempre.
  const lapsed = !!credits && !!credits.lapsed && !credits.unlimited && credits.balance <= 0;
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
  // immobile appena creato: l'elenco in memoria non lo ha ancora. Si ricarica una volta (scheletro nel frattempo) e solo
  // se non c'e' nemmeno dopo si dice "non trovato" (prima compariva per un attimo prima della pagina)
  const [checkedId, setCheckedId] = useState<string | null>(null);
  const wantedId = route.startsWith('/immobile/') ? route.slice('/immobile/'.length) : null;
  useEffect(() => {
    if (!wantedId || !projects || projects.some(p => p.id === wantedId) || checkedId === wantedId) return;
    let on = true;
    fetchProjects().then(p => { if (on) { setProjects(p); setCheckedId(wantedId); } }).catch(() => { if (on) setCheckedId(wantedId); });
    return () => { on = false; };
  }, [wantedId, projects, checkedId]);
  // cambio pagina: si riparte dall'alto (restava lo scorrimento della pagina prima, es. dopo aver creato un immobile)
  useEffect(() => { document.querySelector('main')?.scrollTo(0, 0); window.scrollTo(0, 0); }, [route]);
  useEffect(() => {
    reload();
    try { localStorage.setItem('agenteimmo:has-account', '1'); } catch { /* niente storage */ } // /accedi poi si apre sull'accesso
    authFetch('/api/platform/portfolio').then(r => r.json()).then(d => setProfile({ name: d.name, slug: d.slug })).catch(() => setProfile(null));
  }, []);

  // Onboarding: finche' l'agente non ha scelto nome + indirizzo portfolio, niente piattaforma.
  if (profile === undefined) return <div className="flex h-full items-center justify-center bg-canvas"><ImmoLoader /></div>;
  // #/benvenuto la rimostra a chi vuole rivederla (tutta: scarica la prova se c'e', onboarding, tour).
  // agente nuovo arrivato dalla prova della landing: prima scarica foto/video, poi l'onboarding dall'inizio
  if (profile && (!profile.slug || route === '/benvenuto') && demoGate) return <div className="h-full" style={DOTS}><DemoDownload onDone={() => setDemoGate(false)} /></div>;
  if (profile && (!profile.slug || route === '/benvenuto')) return <Onboarding onDone={p => {
    // arrivato scegliendo un piano sulla landing: finito l'onboarding si va dritti al pagamento
    if (/^#\/piano\?buy=/.test(location.hash)) { setProfile(p); return; }
    // hashchange lanciato a mano: e' sincrono, cosi' la home e' gia' nel DOM quando il browser cattura lo stato nuovo
    // tour appena finisce la transizione (il logo e' arrivato in alto a sinistra), entra in dissolvenza:
    // non prima, finche' dura le card della home stanno sopra a tutto (anche sopra il velo)
    localStorage.setItem(TOUR_KEY, '1');
    const tourLater = () => setTour(true);
    const swap = () => flushSync(() => { history.replaceState(null, '', '#/'); window.dispatchEvent(new HashChangeEvent('hashchange')); setMorphAt('/'); setProfile(p); });
    if (!document.startViewTransition) { swap(); tourLater(); return; }
    document.startViewTransition(swap).finished.finally(tourLater);
  }} />;

  if (route === '/tour' && !tour) queueMicrotask(() => { history.replaceState(null, '', '#/'); window.dispatchEvent(new HashChangeEvent('hashchange')); setTour(true); });
  // anteprima di un modello del sito (aperta in un'altra scheda dalla galleria dei modelli)
  if (route.startsWith('/anteprima/')) return <TemplatePreview id={route.slice('/anteprima/'.length) as TemplateId} projects={projects} solo={new URLSearchParams(query).get('solo') === '1'} pagina={new URLSearchParams(query).get('pagina')} />;
  const detailId = route.startsWith('/immobile/') ? route.slice('/immobile/'.length) : null;
  const detail = projects?.find(p => p.id === detailId);
  const chat = route === '/staging';

  return (
    <div className="relative flex h-full flex-col font-body text-ink" style={DOTS}>
      <NoCreditsModal />
      <DemoDownload />
      {tour && !chat && credits && <Tour noPlan={noPlan} noSite={credits.plan === 'starter'} onDone={() => setTour(false)} />}
      <header style={morph ? { viewTransitionName: 'ob-nav' } : undefined} className={`${route === '/immobili' ? 'absolute inset-x-0' : 'sticky'} top-0 z-30`}>
        <ProgressiveBlur />
        <div className={`mx-auto h-20 max-w-6xl items-center px-6 ${chat ? 'flex' : 'grid grid-cols-[1fr_auto_1fr] max-lg:flex'}`}>
          {/* in chat: niente logo, menu e Metti in vetrina, solo Indietro e i crediti (la chat ha tutto lo spazio) */}
          {chat ? (<>
            {/* Indietro dalla chat: all'immobile se la chat e' partita da li' (?project=), altrimenti alla home */}
            <button type="button" onClick={() => { const pid = new URLSearchParams(query).get('project'); go(pid ? `/immobile/${pid}` : '/'); }}
              aria-label={tr('Indietro', 'Back')} className="-ml-2 flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-brand ease-smooth transition-colors hover:bg-brand/10 sm:ml-0 sm:px-3"><ArrowLeft size={18} /> <span className="hidden sm:inline">{tr('Indietro', 'Back')}</span></button>
            {/* crediti sempre in vista in alto a destra: in chat ogni azione ne spende */}
            {/* entrando in chat i pulsanti arrivano in dissolvenza, non di scatto */}
            {/* a destra, solo quando si sa il piano (niente scatti): prima i crediti, poi Nuova chat con lo storico dentro */}
            <div className="ml-auto flex items-center gap-2">
              {credits && !noPlan && (
                <span className="blur-in flex h-10 items-center rounded-full bg-white ring-1 ring-line lg:pr-1" style={{ animationDelay: '.15s' }}>
                  {/* telefono: solo la matita, la scritta da sm in su */}
                  <button type="button" onClick={() => window.dispatchEvent(new Event('agenteimmo:new-chat'))} aria-label={tr('Nuova chat', 'New chat')} className="flex h-full min-w-10 items-center justify-center whitespace-nowrap text-sm font-semibold sm:pl-4 sm:pr-3"><SquarePen size={16} className="sm:hidden" /><span className="hidden sm:inline">{tr('Nuova chat', 'New chat')}</span></button>
                  <span className="mr-1 h-5 w-px bg-line" aria-hidden />
                  <ChatHistory />
                </span>
              )}
              {credits && <CreditsPill c={credits} />}
            </div>
          </>) : <>
          <a href="#/" className="flex items-center gap-2 justify-self-start">
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" style={{ viewTransitionName: 'ob-logo' }} />
            <span className="hidden font-display text-lg font-extrabold tracking-tight sm:inline">Agente <span className="text-brand">Immo</span></span>{/* telefono: solo il marchio */}
          </a>
          {/* menu al centro esatto: colonne laterali uguali (1fr), qualunque sia la larghezza di logo e pulsanti */}
          <nav className="hidden items-center gap-1 rounded-full bg-canvas p-1 lg:flex">{/* sotto lg le voci stanno nella barra in basso */}
            {NAV.map(({ path, label }) => {
              const active = route === path || (path === '/immobili' && !!detailId);
              return <a key={path} href={`#${path}`} data-tour={path} className={`relative rounded-full px-4 py-1.5 text-sm font-medium ease-smooth transition-colors ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}
                {/* foto o video pronti dall'ultima visita alla Galleria */}
                {path === '/galleria' && news > 0 && <span className="pop absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-canvas">{news > 9 ? '9+' : news}</span>}
              </a>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5 justify-self-end lg:ml-0">
            <span data-tour="crediti"><CreditsPill /></span>
            {/* senza piano solo Scegli un piano (in nero): Metti in vetrina appare col piano */}
            {/* telefono: solo il + (la scritta da sm in su) */}
            {credits && !noPlan && <a href="#/nuovo" data-tour="nuovo" aria-label={tr('Metti in vetrina', 'List a property')} className="flex h-10 w-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-brand text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.98] sm:w-auto sm:px-5"><Plus size={18} className="sm:hidden" /><span className="hidden sm:inline">{tr('Metti in vetrina', 'List a property')}</span></a>}
          </div>
          </>}
        </div>
      </header>

      {/* Importa immobile: pillola in basso al centro, solo in home (il profilo e' nella pillola dei crediti in alto) */}
      {!chat && route === '/' && <div inert={homeOpen} className={`fixed bottom-[84px] left-1/2 z-30 lg:bottom-5 flex -translate-x-1/2 items-center gap-2 ease-smooth transition-[opacity,translate] duration-[600ms] ${homeOpen ? 'pointer-events-none translate-y-4 opacity-0' : ''}`}>
        <a href="#/importa" style={morph ? { viewTransitionName: 'ob-bottom' } : undefined} className={`flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-line ease-smooth transition-shadow hover:shadow-md`}>
          <Download size={16} className="text-muted" /> {tr('Importa immobile', 'Import property')}
        </a>
      </div>}

      <main className={`flex-1 ${route === '/staging' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Home staging: la chat gestisce lo scorrimento da sola (campo fisso in fondo) */}
        {/* piano scaduto: si dice in home, con la data e come riattivarlo */}
        {route === '/' && credits?.lapsed && !credits.unlimited && (
          <div className="mx-auto mt-4 max-w-6xl px-6">
            <p className="blur-in flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 ring-1 ring-amber-200">
              {tr(`Il tuo piano è scaduto il ${new Date(credits.until!).toLocaleDateString(pageLocale(), { day: 'numeric', month: 'long' })}. Immobili, Galleria e sito sono in pausa: non abbiamo cancellato niente.`, `Your plan ended on ${new Date(credits.until!).toLocaleDateString(pageLocale(), { day: 'numeric', month: 'long' })}. Properties, Gallery and website are paused: nothing was deleted.`)}
              <a href="#/piano?cambia=1" className="font-semibold text-brand">{tr('Riattiva il piano', 'Reactivate your plan')}</a>
            </p>
          </div>
        )}
        <div key={route} className={`${morph ? '' : 'fade-up'} ${route === '/immobili' ? '' : 'mx-auto max-w-6xl px-6'} ${route === '/immobili' ? '' : route === '/staging' ? 'h-full' : route === '/' || route === '/migliora' ? '' : 'pb-16 pt-8'}`}>
          {route === '/profilo' ? (
            <ProfileView email={userData.email} profile={profile ?? null} onSaved={setProfile} admin={isPlatformAdmin(userData.email)} />
          ) : route === '/piano' ? (
            <PlanView key={query} change={new URLSearchParams(query).get('cambia') === '1'} ok={new URLSearchParams(query).get('ok') === '1'} buy={(b => (isBuy(b) ? b : undefined))(new URLSearchParams(query).get('buy'))} />
          ) : route === '/costi' && isPlatformAdmin(userData.email) ? (
            <CostsView />
          ) : route === '/affiliati' && isPlatformAdmin(userData.email) ? (
            <AffiliatesView />
          ) : route === '/migliora' ? (
            <HomeView key={query} name={profile?.name ?? undefined} slug={profile?.slug ?? undefined} initialUrl={new URLSearchParams(query).get('url') ?? ''} onSaved={reload} />
          ) : route === '/staging' ? (
            // senza piano: qualsiasi clic, tasto o foto trascinata nella chat apre il popup che porta ai piani
            <div className="h-full" onClickCapture={noPlan ? blockNoPlan : undefined} onKeyDownCapture={noPlan ? blockNoPlan : undefined} onDropCapture={noPlan ? blockNoPlan : undefined} onDragOverCapture={noPlan ? e => e.preventDefault() : undefined}>
              <StagingView initial={{ photo: new URLSearchParams(query).get('photo') ?? undefined, project: new URLSearchParams(query).get('project') ?? undefined }} />
            </div>
          ) : route === '/galleria' ? (
            <Locked on={lapsed} what="gallery"><MediaView /></Locked>
          ) : route === '/importa' ? (
            <ImportView onDone={reload} />
          ) : route === '/nuovo' ? (
            <NewPropertyWizard onCreated={(p) => { reload(); go(`/immobile/${p.id}`); }} />
          ) : detailId ? (
            <Locked on={lapsed} what="properties"><PropertyDetail project={detail} loading={projects === null || (!detail && checkedId !== detailId)} onChange={reload} /></Locked>
          ) : route === '/immobili' ? (
            <Locked on={lapsed} what="properties"><PropertiesView projects={projects} onChange={reload} /></Locked>
          ) : route === '/portfolio' ? (
            <Locked on={lapsed} what="site"><PortfolioView projects={projects} onChange={reload} /></Locked>
          ) : (
            <HomeView name={profile?.name ?? undefined} slug={profile?.slug ?? undefined} onSaved={reload} morph={morph} />
          )}
        </div>
      </main>
      {/* telefono e tablet (sotto lg): le voci del menu in una barra in basso (in chat e nel percorso Metti in vetrina no, hanno il loro fondo) */}
      {!chat && route !== '/nuovo' && (
        <nav aria-label={tr('Menu principale', 'Main menu')} className="flex shrink-0 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = route === path || (path === '/immobili' && !!detailId);
            return <a key={path} href={`#${path}`} aria-current={active ? 'page' : undefined} className={`relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ease-smooth transition-colors ${active ? 'text-ink' : 'text-muted'}`}>
              <Icon size={20} className={active ? 'text-brand' : ''} /><span className="max-w-full truncate px-1">{label}</span>
              {path === '/galleria' && news > 0 && <span className="pop absolute left-1/2 top-2 ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white">{news > 9 ? '9+' : news}</span>}
            </a>;
          })}
        </nav>
      )}
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
      {/* titolo in piccolo sopra, la domanda in grande */}
      <span className="par-1 text-sm text-muted">{title}</span>
      <span className="par-1 mt-1 text-2xl font-bold leading-tight tracking-tight">{kicker}</span>
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
  return <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg ease-smooth transition-colors ${color}`}>{n}%{n >= 75 && ' ✓'}</span>;
}

const TITLE_WORDS = (name?: string) => (name ? tr(`Ciao ${name.split(' ')[0]}, da dove partiamo?`, `Hi ${name.split(' ')[0]}, where do we start?`) : tr('Da dove partiamo?', 'Where do we start?')).split(' ');


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
        <button type="button" onClick={onClose} aria-label={tr('Torna indietro', 'Go back')} tabIndex={open ? 0 : -1}
          className={`absolute z-30 flex h-9 w-9 items-center justify-center rounded-full text-muted ease-smooth transition-all hover:bg-canvas hover:text-ink ${flow ? 'right-5 top-[26px]' : 'right-4 top-4'} ${open ? 'scale-100 opacity-100 delay-[450ms]' : 'pointer-events-none scale-75 opacity-0'}`}><X size={18} /></button>

        {/* Titolo della card: svanisce e si chiude */}
        <div className={`overflow-hidden transition-all ease-smooth ${open ? 'max-h-0 -translate-y-2 opacity-0 blur-[4px]' : 'max-h-24 delay-100'}`}>
          <span className="par-1 block text-sm text-muted">{tr('Miglioralo', 'Improve it')}</span>
          <span className="par-1 mt-1 block text-2xl font-bold leading-tight tracking-tight">{tr('Annuncio già online?', 'Listing already online?')}</span>
        </div>

        {/* Mini scheda annuncio: diventa la pill sopra l'input, poi sparisce quando si apre il browser */}
        <div className={`flex items-center justify-center transition-all ease-smooth ${flow ? 'max-h-0 scale-95 overflow-hidden opacity-0' : 'max-h-60'} flex-1`}>
          <div className={`relative transition-all ease-smooth ${open ? 'w-72 delay-[120ms]' : 'w-48'}`}>
            <div className="par-2">
              {/* Il contenitore cambia forma (misure, angoli, sfondo: tutto animabile); la versione verticale sfuma e quella
                  orizzontale compare dopo. Passare da colonna a riga nello stesso box dava uno scatto: non si anima. */}
              <div className={`relative overflow-hidden transition-all ease-smooth ${open ? 'h-16 rounded-2xl bg-canvas delay-[120ms]' : 'h-40 rounded-xl bg-white shadow-md group-hover:-rotate-2'}`}>
                <div className={`absolute inset-2 flex flex-col transition-[opacity,filter] ease-smooth ${open ? 'opacity-0 blur-[4px] duration-200' : 'opacity-100 delay-300'}`}>
                  <img src="/immo/home/card.webp" alt="" decoding="async" className="h-[6.5rem] w-full shrink-0 rounded-lg object-cover" />
                  <div className="mt-2">
                    {['w-2/3', 'w-2/5', 'w-1/2'].map((w, i) => <div key={w} className={`rewrite h-1.5 rounded bg-line ${w} ${i ? 'mt-1.5' : ''}`} />)}
                  </div>
                </div>
                <div className={`absolute inset-2 flex items-center gap-3 pr-1 transition-[opacity,filter] ease-smooth ${open ? 'opacity-100 delay-[450ms]' : 'pointer-events-none opacity-0 blur-[4px] duration-200'}`}>
                  <img src="/immo/home/card.webp" alt="" decoding="async" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    {['w-2/3', 'w-2/5'].map((w, i) => <div key={w} className={`h-1.5 rounded bg-line ${w} ${i ? 'mt-1.5' : ''}`} />)}
                  </div>
                  {open && <span className="blur-in shrink-0" style={{ animationDelay: '.45s' }}><ScoreBadge on /></span>}
                </div>
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
            <span className="blur-in flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium"><Loader2 size={15} className="animate-spin" /> {stage === 'opening' ? tr('Apro', 'Opening') : tr('Analizzo', 'Analysing')} <span className="text-muted">{tr('circa 1-2 min', 'about 1-2 min')}</span></span>
          ) : phase === 'done' ? (
            <button type="button" onClick={onNew} className="blur-in h-11 shrink-0 rounded-full bg-white px-5 text-sm font-semibold hover:bg-ink hover:text-white">{tr('Nuova analisi', 'New analysis')}</button>
          ) : (
            <button disabled={!ok} tabIndex={open ? 0 : -1} className="h-11 shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-30 disabled:active:scale-100">{flow ? tr('Riprova', 'Try again') : tr('Analizza', 'Analyse')}</button>
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
  link: [tr('Incolla il link dell\'annuncio', 'Paste the listing link'), tr('Da qualsiasi portale immobiliare.', 'From any property portal.')],
  opening: [tr('Apro l\'annuncio', 'Opening the listing'), tr('Di solito ci vuole un paio di minuti.', 'It usually takes a couple of minutes.')],
  scanning: [tr('Sto analizzando l\'annuncio', 'Analysing the listing'), ''],
  done: [tr('Ecco il tuo annuncio, migliorato', 'Here is your listing, improved'), tr('Score, versione riscritta e cosa sistemare.', 'Score, rewritten version and what to fix.')],
  error: [tr('Non riesco a leggerlo', 'I can\'t read it'), tr('Riprova o incolla il testo dell\'annuncio.', 'Try again or paste the listing text.')],
  manual: [tr('Incolla il testo dell\'annuncio', 'Paste the listing text'), tr('Titolo, prezzo, caratteristiche e descrizione.', 'Title, price, features and description.')],
};

export function HomeView({ name, slug, initialUrl = '', onSaved, morph }: { name?: string; slug?: string; initialUrl?: string; onSaved?: () => void; morph?: boolean }) {
  const noSite = useCredits()?.plan === 'starter'; // Starter non ha il sito: niente indirizzo sulla card Mettilo in vetrina
  const imp = useImprove();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [hover, setHover] = useState(false);
  const [stageHover, setStageHover] = useState(false);
  const [d0] = useState(morph ? 0.5 : 0); // dall'onboarding: il titolo entra quando le card sono quasi al loro posto
  const [intro, setIntro] = useState(!morph); // arrivando dall'onboarding le card ci sono gia', niente ingresso
  const phase: Phase = !open ? 'closed' : imp.stage === 'input' ? 'input' : imp.stage === 'done' ? 'done' : 'browser';
  // con Miglioralo aperto la pillola Importa immobile in basso sparisce (dice alla cornice se la card e' aperta)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agenteimmo:home-open', { detail: phase !== 'closed' }));
    return () => { window.dispatchEvent(new CustomEvent('agenteimmo:home-open', { detail: false })); };
  }, [phase]);

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
    const t = setTimeout(() => { setIntro(false); setOpen(true); imp.start(initialUrl); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // Apre Migliora = intenzione di analizzare: si accende la GPU dell'analisi (avvio a freddo ~3,5 min).
  const openLink = () => { setIntro(false); setOpen(true); };
  // l'indirizzo vero del sito (lo slug scelto), non uno ricavato dal nome
  const vetrina = slug || (name ?? tr('tuonome', 'yourname')).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const close = () => { imp.reset(); setOpen(false); };
  const restart = () => { imp.reset(); setUrl(''); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); };

  const [head, sub] = shown === 'home' ? [TITLE_WORDS(name).join(' '), tr('Migliora, pubblica o arreda.', 'Improve, publish or furnish.')] : TITLES[shown];
  const subtitle = shown === 'scanning' ? `${SCAN_STEPS[imp.step]}...` : sub;
  // Apertura: parte il container (altre card via, box al centro), la card si trasforma subito dopo, sovrapposta.
  // Chiusura: al contrario, con gli stessi piccoli sfalsamenti.
  const others = (i: number) => `mx-2.5 ${open ? 'pointer-events-none -my-2.5 max-h-0 overflow-hidden lg:mx-0! lg:my-0 lg:w-0! scale-75 opacity-0 blur-[8px]' : `max-h-[24rem] ${i === 1 ? 'delay-[160ms]' : 'delay-[220ms]'}`}`;

  return (
    // pb-24: lo spazio delle pill fisse in basso (Profilo, Importa), cosi' titolo e box stanno al centro della parte libera
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center pb-24 pt-10">
      <h1 className={`text-center font-display text-4xl font-bold leading-[1.2] tracking-tight ease-smooth transition-all md:text-5xl md:leading-[1.2] ${titleOut ? '-translate-y-3 opacity-0 blur-[6px]' : ''}`}>
        {head.split(' ').map((w, i) => <span key={`${shown}-${i}`} className="blur-in inline-block" style={{ animationDelay: `${d0 + i * 0.05}s` }}>{w}&nbsp;</span>)}
        <span key={subtitle} className="blur-in block text-muted/70" style={{ animationDelay: shown === 'scanning' ? '0s' : `${d0 + 0.3}s` }}>{subtitle}</span>
      </h1>

      {/* tessere in fila solo da lg (a 768 tre da 320 uscivano dai lati), sotto in colonna */}
      <div className="mt-14 flex w-full flex-col items-center justify-center gap-5 lg:flex-row lg:gap-0">
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
        <Tile index={1} intro={intro} wrapClass={others(1)} kicker={tr('Hai un nuovo immobile?', 'Got a new property?')} title={tr('Mettilo in vetrina', 'Put it on show')} href="#/nuovo">
          {/* la vetrina e' la pagina AgenteImmo dell'agente: si capisce dalla barra indirizzi */}
          {!noSite && <span className="par-1 absolute -top-3 left-1/2 z-20 -translate-x-1/2"><span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-medium text-muted shadow-md ring-1 ring-black/5 ease-smooth transition-[translate] group-hover:-translate-y-1"><Globe size={11} className="text-brand" /><span>agenteimmo.me/<span className="text-ink">{vetrina}</span></span></span></span>}
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
        <Tile index={2} intro={intro} wrapClass={others(2)} onHover={setStageHover} kicker="Home staging" title={tr('Hai una stanza vuota?', 'Got an empty room?')} href="#/staging">
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
// Profilo: il piano in una riga (nome, crediti, rinnovo o scadenza) e il link alla pagina del piano e alle fatture
function PlanCard() {
  const c = useCredits();
  if (!c || c.unlimited) return <div className="mt-8" />;
  const d = (x: string | null) => (x ? new Date(x).toLocaleDateString(pageLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const name = { none: '', starter: 'Starter', plus: 'Plus', pro: 'Pro' }[c.plan];
  const line = c.plan !== 'none' ? tr(`${c.balance} ${c.balance === 1 ? 'credito' : 'crediti'} · si ricaricano il ${d(c.renews)}`, `${c.balance} credits · top up on ${d(c.renews)}`)
    : c.lapsed ? tr(`Scaduto il ${d(c.until)}`, `Ended on ${d(c.until)}`) : c.balance > 0 ? tr(`${c.balance} crediti dei pacchetti`, `${c.balance} pack credits`) : tr('Nessun piano attivo', 'No active plan');
  return (
    <a href={c.plan === 'none' ? '#/piano?cambia=1' : '#/piano'} className={`mt-8 flex items-center gap-3 rounded-[28px] bg-white p-6 ease-smooth transition-shadow hover:shadow-md ${CARD_SHADOW}`}>
      <span className="flex-1"><span className="block font-semibold">{name ? tr(`Piano ${name}`, `${name} plan`) : tr('Il tuo piano', 'Your plan')}</span><span className="block text-sm text-muted">{line}</span></span>
      <span className="text-sm font-medium text-brand">{c.plan === 'none' ? (c.lapsed ? tr('Riattiva', 'Reactivate') : tr('Scegli un piano', 'Choose a plan')) : tr('Piano e fatture', 'Plan and invoices')}</span>
    </a>
  );
}

function ProfileView({ email, profile, onSaved, admin }: { email: string; profile: Profile | null; onSaved: (p: Profile) => void; admin: boolean }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">{tr('Il mio profilo', 'My profile')}</h1>
      <p className="mt-1 text-muted">{email}</p>
      <PlanCard />
      <div className={`mt-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
        <h2 className="font-semibold">{tr('Il tuo sito personale', 'Your personal website')}</h2>
        <p className="mt-1 text-sm text-muted">{tr('Il nome che vedono i clienti e l\'indirizzo della pagina con le tue case.', 'The name your clients see and the address of the page with your properties.')}</p>
        <div className="mt-5"><ProfileForm initial={profile ?? { name: null, slug: null }} submitLabel={tr('Salva', 'Save')} onSaved={onSaved} /></div>
        {profile?.slug && <a href="#/portfolio" className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-brand hover:underline md:mt-4 md:min-h-0">{tr('Modifica il tuo sito', 'Edit your website')}</a>}
      </div>
      {/* Costi AI: solo per gli amministratori, qui invece che nel menu */}
      {admin && (<>
        <a href="#/costi" className={`mt-4 flex items-center gap-3 rounded-[28px] bg-white p-6 ease-smooth transition-shadow hover:shadow-md ${CARD_SHADOW}`}>
          <Gauge size={18} className="text-muted" /><span className="flex-1"><span className="block font-semibold">{tr('Costi AI', 'AI costs')}</span><span className="block text-sm text-muted">{tr('Spesa per le foto e i video generati', 'Spend on generated photos and videos')}</span></span>
        </a>
        <a href="#/affiliati" className={`mt-4 flex items-center gap-3 rounded-[28px] bg-white p-6 ease-smooth transition-shadow hover:shadow-md ${CARD_SHADOW}`}>
          <Gift size={18} className="text-muted" /><span className="flex-1"><span className="block font-semibold">{tr('Affiliati', 'Affiliates')}</span><span className="block text-sm text-muted">{tr('Codici, crediti dati e utilizzi', 'Codes, credits given and uses')}</span></span>
        </a>
      </>)}
      <Guides />
      {/* documenti legali */}
      <div className={`mt-4 rounded-[28px] bg-white p-2 ${CARD_SHADOW}`}>
        {([['Privacy', lp('/privacy')], [tr('Termini e condizioni', 'Terms and conditions'), lp('/termini')], ['Cookie', lp('/cookie')], [tr('Come cancelliamo i dati', 'How we delete your data'), lp('/data-deletion')]] as const).map(([l, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener" className="flex h-12 items-center justify-between rounded-[20px] px-4 text-sm font-medium ease-smooth transition-colors hover:bg-canvas">{l}<ExternalLink size={15} className="text-muted" /></a>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={() => { try { sessionStorage.clear(); } catch { /* niente */ } void supabase.auth.signOut(); }} className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-line hover:bg-white hover:text-ink"><LogOut size={15} /> {tr('Esci', 'Log out')}</button>
        <DeleteAccount />
      </div>
    </div>
  );
}

// Guide per agenti (le pagine SEO del sito): elenco che si apre nel profilo. Titoli caricati solo all'apertura,
// cosi' i testi delle guide non pesano sulla piattaforma.
function Guides() {
  const [list, setList] = useState<{ slug: string; label: string }[] | null>(null);
  const [open, setOpen] = useState(false);
  const toggle = () => {
    setOpen(o => !o);
    if (!list) void import('@/lib/guides').then(m => setList(m.GUIDES.map(g => ({ slug: g.slug, label: g.label }))));
  };
  return (
    <div className={`mt-4 rounded-[28px] bg-white p-2 ${CARD_SHADOW}`}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex h-12 w-full items-center justify-between rounded-[20px] px-4 text-sm font-medium ease-smooth transition-colors hover:bg-canvas">
        <span className="flex items-center gap-2"><BookOpen size={16} className="text-brand" /> {tr('Guide per agenti immobiliari', 'Guides for real estate agents (Italian)')}</span>
        <ChevronDown size={16} className={`text-muted ease-smooth transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid ease-smooth transition-[grid-template-rows,opacity] duration-[600ms] ${open && list ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-x-2 sm:grid-cols-2">
            {(list ?? []).map(g => (
              <a key={g.slug} href={`/it/${g.slug}`} target="_blank" rel="noopener" className="flex h-11 items-center justify-between gap-2 rounded-[20px] px-4 text-sm ease-smooth transition-colors hover:bg-canvas"><span className="truncate">{g.label}</span><ExternalLink size={14} className="shrink-0 text-muted" /></a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Abbonamento scaduto: la pagina resta visibile ma sfocata e non si tocca, sopra la card per riattivare.
// ponytail: blocco solo nell'interfaccia (i file su R2 restano ai loro indirizzi); il sito pubblico va gia' offline
// senza piano col sito (lib/sitePlan).
const LOCK_TEXT = {
  gallery: [tr('Le tue foto e i tuoi video sono in pausa', 'Your photos and videos are paused'), tr('Il tuo abbonamento è scaduto. Riattiva un piano e ritrovi qui tutto quello che hai creato: niente è stato cancellato.', 'Your subscription has ended. Reactivate a plan to get back everything you created: nothing has been deleted.')],
  properties: [tr('I tuoi immobili sono in pausa', 'Your listings are paused'), tr('Il tuo abbonamento è scaduto. Riattiva un piano e ritrovi immobili, foto e report come li hai lasciati.', 'Your subscription has ended. Reactivate a plan to get your listings, photos and reports back as you left them.')],
  site: [tr('Il tuo sito è offline', 'Your website is offline'), tr('Il tuo abbonamento è scaduto e il sito non è più visibile ai clienti. Riattiva Plus o Pro e torna online con tutte le tue case.', 'Your subscription has ended and your website is no longer visible to clients. Reactivate Plus or Pro to go back online with all your listings.')],
} as const;
function Locked({ on, what, children }: { on: boolean; what: keyof typeof LOCK_TEXT; children: ReactNode }) {
  if (!on) return <>{children}</>;
  const [t, d] = LOCK_TEXT[what];
  return (
    <div className="relative">
      <div inert aria-hidden className="pointer-events-none max-h-[calc(100vh-7rem)] select-none overflow-hidden blur-md">{children}</div>
      <div className="absolute inset-0 flex items-start justify-center pt-[12vh]">
        <div className="blur-in w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-[0_40px_100px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><Lock size={24} /></span>
          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{t}</h2>
          <p className="mt-2 text-[15px] text-muted">{d}</p>
          <a href="#/piano?cambia=1" className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-7 text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Riattiva un piano', 'Reactivate a plan')}</a>
        </div>
      </div>
    </div>
  );
}

// Eliminazione dell'account: conferma scrivendo ELIMINA. Cancella account, immobili, sito, foto create e
// l'abbonamento Stripe (/api/account/delete), poi esce.
const CONFIRM = tr('ELIMINA', 'DELETE'); // parola da scrivere per confermare, nella lingua della pagina
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true); setErr('');
    const r = await authFetch('/api/account/delete', { method: 'DELETE' }).catch(() => null);
    if (!r?.ok) { setBusy(false); setErr(tr('Non sono riuscito a eliminare l’account, riprova o scrivici.', 'I couldn’t delete the account, try again or write to us.')); return; }
    // la chat e le altre memorie della scheda non passano al prossimo account; il segno dice alla dashboard di andare
    // sulla home del sito e non al login (all'uscita la dashboard reindirizza da sola)
    try { sessionStorage.clear(); sessionStorage.setItem('gnm_post_delete', '1'); } catch { /* niente */ }
    await supabase.auth.signOut();
    window.location.replace(lp(''));
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">{tr('Elimina account', 'Delete account')}</button>
      {/* nel body: dentro la pagina un antenato con transform limitava il velo al solo contenuto */}
      {open && createPortal(
        <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => !busy && setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">{tr('Eliminare l’account?', 'Delete the account?')}</h2>
            <p className="pt-2 text-sm text-muted">{tr('Cancelliamo per sempre il tuo account, gli immobili, il tuo sito, le foto della Galleria e l’eventuale abbonamento. Non si può annullare.', 'We permanently delete your account, properties, website, Gallery photos and any subscription. This can’t be undone.')}</p>
            <label className="mt-5 block text-xs font-medium text-ink/70">{tr('Per confermare scrivi', 'To confirm, type')} <b>{CONFIRM}</b>
              <input value={word} onChange={e => setWord(e.target.value)} autoFocus className="mt-1.5 h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
            </label>
            {err && <p className="pt-3 text-sm text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2 pt-6">
              <button disabled={busy} onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-brand/10 text-brand">{tr('Annulla', 'Cancel')}</button>
              <button disabled={busy || word.trim() !== CONFIRM} onClick={run} className="flex h-10 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40">{busy && <Loader2 size={15} className="animate-spin" />} {tr('Elimina per sempre', 'Delete forever')}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
