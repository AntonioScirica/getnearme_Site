'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, Globe, Gauge, LogOut, Plus, ArrowUp, Loader2 } from 'lucide-react';
import type { UserData } from '@/app/[locale]/dashboard/page';
import { supabase } from '@/lib/supabase';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import NewPropertyWizard from './NewPropertyWizard';
import PropertyDetail from './PropertyDetail';
import PortfolioView from './PortfolioView';
import ImportView from './ImportView';
import ImproveView from './ImproveView';
import CostsView from './CostsView';
import { isPlatformAdmin } from '@/lib/platformAdmins';
import { go, formatPrice, authFetch } from './api';
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

// Sfondo generale: bianco con puntini grigi al 5%.
export const DOTS: React.CSSProperties = { background: 'radial-gradient(rgba(0,0,0,0.05) 1.2px, transparent 1.2px) 0 0 / 18px 18px, #fff' };

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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">
          <a href="#/" className="flex items-center gap-2">
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
          </a>
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-canvas p-1 md:flex">
            {[...NAV, ...(isPlatformAdmin(userData.email) ? [{ path: '/costi', label: 'Costi AI', icon: Gauge }] : [])].map(({ path, label }) => {
              const active = route === path || (path === '/immobili' && !!detailId);
              return <a key={path} href={`#${path}`} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}</a>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <a href="#/nuovo" aria-label="Nuovo annuncio" title="Nuovo annuncio" className="btn-ink flex h-10 w-10 items-center justify-center rounded-full"><Plus size={18} /></a>
            <AccountMenu email={userData.email} credits={userData.credits} name={profile?.name ?? undefined} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div key={route} className={`fade-up mx-auto max-w-6xl px-6 pb-16 ${route === '/' ? 'pt-16' : 'pt-8'}`}>
          {route === '/costi' && isPlatformAdmin(userData.email) ? (
            <CostsView />
          ) : route === '/migliora' ? (
            <ImproveView key={query} initialUrl={new URLSearchParams(query).get('url') ?? ''} onSaved={reload} />
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
            <HomeView projects={projects} name={profile?.name ?? undefined} />
          )}
        </div>
      </main>
    </div>
  );
}

// Home minimal: titolo piccolo su due toni, tre tessere dritte con un mini collage che si
// anima al passaggio del mouse. "Migliora" apre il campo link sotto le tessere.
function Tile({ kicker, title, onClick, href, active, children }: { kicker: string; title: string; onClick?: () => void; href?: string; active?: boolean; children: React.ReactNode }) {
  const cls = `group relative flex h-[22rem] w-full flex-col overflow-hidden rounded-[28px] bg-white p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_20px_40px_-16px_rgba(0,0,0,.2)] sm:w-80 ${active ? 'ring-2 ring-ink' : ''}`;
  const inner = (
    <>
      <span className="text-sm text-muted">{kicker}</span>
      <span className="mt-1 text-2xl font-bold leading-tight tracking-tight">{title}</span>
      <div className="relative mt-auto h-52 origin-bottom scale-110">{children}</div>
    </>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export function HomeView({ projects, name }: { projects: ProjectData[] | null; name?: string }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const recent = (projects ?? []).slice(0, 5);
  const ok = /^https?:\/\//i.test(url.trim());

  return (
    <div className="flex flex-col items-center">
      <h1 className="fade-up text-center font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        {name ? `Ciao ${name.split(' ')[0]}, da dove partiamo?` : 'Da dove partiamo?'}
        <span className="block text-muted/70">Migliora, crea o importa i tuoi annunci.</span>
      </h1>

      <div className="stagger mt-14 flex w-full flex-col items-center justify-center gap-5 sm:flex-row">
        {/* Migliora: scheda annuncio con score che sale */}
        <Tile kicker="Hai già un annuncio online?" title="Miglioralo" onClick={() => setLinkOpen(v => !v)} active={linkOpen}>
          <div className="absolute left-1/2 top-2 w-40 -translate-x-1/2 rounded-xl bg-white p-2 shadow-md transition-transform duration-500 group-hover:-translate-y-1 group-hover:-rotate-2">
            <img src="/staging/1_real.jpg" alt="" className="h-20 w-full rounded-lg object-cover" />
            <div className="mt-2 h-1.5 w-24 rounded bg-line" /><div className="mt-1 h-1.5 w-16 rounded bg-line" />
          </div>
          <span className="absolute left-[18%] top-0 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow transition-all duration-500 group-hover:opacity-0">42</span>
          <span className="absolute right-[16%] top-16 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:opacity-100">86 ✓</span>
        </Tile>

        {/* Crea: tre foto a ventaglio + "+" */}
        <Tile kicker="Hai un immobile nuovo?" title="Crea da zero" href="#/nuovo">
          {['/staging/4.jpg', '/reference/giorno-notte-poster.jpg', '/staging/2.jpg'].map((src, i) => (
            <img key={src} src={src} alt="" className={`absolute left-1/2 top-4 h-32 w-24 -translate-x-1/2 rounded-xl object-cover shadow-md ring-2 ring-white transition-transform duration-500 ${
              ['-rotate-12 -translate-x-[90%] group-hover:-translate-x-[105%] group-hover:-rotate-[16deg]', 'z-10 group-hover:-translate-y-2', 'rotate-12 -translate-x-[10%] group-hover:translate-x-[5%] group-hover:rotate-[16deg]'][i]}`} />
          ))}
          <span className="absolute bottom-1 left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-transform duration-300 group-hover:scale-110"><Plus size={18} /></span>
        </Tile>

        {/* Importa: foglio Excel che diventa card */}
        <Tile kicker="Hai un file del gestionale?" title="Importalo" href="#/importa">
          <div className="absolute left-[8%] top-6 w-28 rounded-lg bg-white p-1.5 shadow-md transition-transform duration-500 group-hover:-translate-x-1">
            <div className="mb-1 h-2 rounded-sm bg-emerald-500/80" />
            {[0, 1, 2, 3, 4].map(r => <div key={r} className="mt-1 grid grid-cols-3 gap-1">{[0, 1, 2].map(c => <div key={c} className="h-2 rounded-sm bg-line" />)}</div>)}
          </div>
          <span className="absolute left-1/2 top-16 -translate-x-1/2 text-lg text-muted transition-transform duration-500 group-hover:translate-x-0">→</span>
          <div className="absolute right-[8%] top-3 w-20 transition-transform duration-500 group-hover:translate-x-1">
            {['/staging/5.jpg', '/staging/3.jpg'].map((src, i) => (
              <div key={src} className={`rounded-lg bg-white p-1 shadow-md ${i ? 'mt-2' : ''}`}><img src={src} alt="" className="h-11 w-full rounded-md object-cover" /><div className="mt-1 h-1 w-10 rounded bg-line" /></div>
            ))}
          </div>
        </Tile>
      </div>

      {linkOpen && (
        <form onSubmit={e => { e.preventDefault(); if (ok) go(`/migliora?url=${encodeURIComponent(url.trim())}`); }}
          className="fade-up mt-6 flex w-full max-w-xl items-center gap-2 rounded-full bg-canvas p-1.5 pl-5">
          <input autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="Incolla il link da immobiliare.it, idealista o casa.it" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" />
          <button disabled={!ok} className="btn-ink h-10 shrink-0 rounded-full px-5 text-sm font-semibold">Analizza</button>
        </form>
      )}

      {recent.length > 0 && (
        <div className="mt-20 w-full max-w-4xl">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold">Ultimi immobili</h2>
            <a href="#/immobili" className="text-sm text-muted hover:text-ink">Vedi tutti ({projects!.length})</a>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {recent.map(p => (
              <a key={p.id} href={`#/immobile/${p.id}`} className="group block">
                <div className="aspect-square overflow-hidden rounded-2xl bg-canvas">{p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</div>
                <div className="mt-2 truncate text-sm font-semibold">{p.addr?.split(',').slice(-1)[0]?.trim() || p.titolo}</div>
                <div className="text-sm text-muted">{formatPrice(p.prezzo)}</div>
              </a>
            ))}
          </div>
        </div>
      )}
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
        <button onClick={() => setOpen(v => !v)} aria-label="Account" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm ring-1 ring-line transition-shadow hover:shadow-md">{initial}</button>
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
              {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />}
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
