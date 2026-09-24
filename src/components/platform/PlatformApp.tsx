'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, Globe, Gauge, LogOut, Link2, Sparkles, Plus, ArrowRight, MapPin, Loader2, FileSpreadsheet } from 'lucide-react';
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
    <div className="gnm-bg flex h-full font-body text-ink">
      <aside className="glass flex w-60 shrink-0 flex-col border-r px-3 py-5">
        <div className="flex items-center gap-2 px-3 pb-6"><span className="btn-primary flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold">G</span><span className="font-display text-xl font-bold tracking-tight">GetNearMe</span></div>
        <nav className="flex flex-col gap-1">
          {[...NAV, ...(isPlatformAdmin(userData.email) ? [{ path: '/costi', label: 'Costi AI', icon: Gauge }] : [])].map(({ path, label, icon: Icon }) => {
            const active = route === path || (path === '/immobili' && !!detailId);
            return (
              <a key={path} href={`#${path}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-white text-ai shadow-sm ring-1 ring-ai/15' : 'text-muted hover:bg-white/70 hover:text-ink'}`}>
                <Icon size={18} /> {label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line px-3 pt-4">
          <div className="truncate text-xs text-muted">{userData.email}</div>
          <div className="mt-1 text-xs text-muted">{userData.credits} crediti</div>
          <button onClick={() => supabase.auth.signOut()} className="mt-3 flex items-center gap-2 text-sm text-muted hover:text-ink">
            <LogOut size={16} /> Esci
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div key={route} className="fade-up mx-auto max-w-6xl px-8 py-10">
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

// Home: una domanda sola ("Da dove partiamo?") con tre tessere, poi gli immobili con i numeri.
export function HomeView({ projects, name }: { projects: ProjectData[] | null; name?: string }) {
  const [mode, setMode] = useState<'link' | null>(null);
  const [url, setUrl] = useState('');
  const n = projects?.length ?? 0;
  const pub = projects?.filter(p => p.is_public).length ?? 0;
  const scores = (projects ?? []).map(p => (p.import_data as { score?: number } | undefined)?.score).filter((x): x is number => typeof x === 'number');
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <>
      <p className="fade-up text-sm text-muted">{name ? `Ciao ${name.split(' ')[0]}` : 'Ciao'}</p>
      <h1 className="fade-up mt-1 font-display text-4xl font-bold tracking-tight">Da dove <span className="gradient-text">partiamo?</span></h1>

      <div className="stagger mt-8 grid gap-4 md:grid-cols-3">
        <Tile active={mode === 'link'} onClick={() => setMode(m => (m === 'link' ? null : 'link'))} icon={Link2} kicker="Ho già un annuncio online" title="Miglioralo" desc="Incolla il link: score, cosa sistemare, testo riscritto." />
        <Tile href="#/nuovo" icon={Plus} kicker="Parto da zero" title="Crea l'annuncio" desc="Foto, dati e note: l'AI scrive tutto e finisce nel tuo portfolio." />
        <Tile href="#/importa" icon={FileSpreadsheet} kicker="Ho un file" title="Importa" desc="Excel o CSV del gestionale, colonne riconosciute da sole." />
      </div>

      {mode === 'link' && (
        <form onSubmit={e => { e.preventDefault(); if (url.trim()) go(`/migliora?url=${encodeURIComponent(url.trim())}`); }} className="card ring-gradient fade-up mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-canvas px-4">
            <Link2 size={18} className="shrink-0 text-muted" />
            <input autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.immobiliare.it/annunci/..." className="w-full bg-transparent py-3.5 text-base outline-none" />
          </div>
          <button disabled={!url.trim()} className="btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"><Sparkles size={16} /> Analizza</button>
        </form>
      )}

      <div className="mt-14 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">I tuoi immobili</h2>
          {n > 0 && <p className="mt-1 text-sm text-muted">{n} {n === 1 ? 'immobile' : 'immobili'} · {pub} nel portfolio{avg !== null ? ` · score medio ${avg}` : ''}</p>}
        </div>
        {n > 6 && <a href="#/immobili" className="text-sm font-medium text-brand">Vedi tutti</a>}
      </div>
      <div className="mt-5"><PropertyGrid projects={projects?.slice(0, 6) ?? null} /></div>
    </>
  );
}

function Tile({ href, onClick, active, icon: Icon, kicker, title, desc }: { href?: string; onClick?: () => void; active?: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; kicker: string; title: string; desc: string }) {
  const cls = `card card-hover group relative flex min-h-48 flex-col p-5 text-left ${active ? 'sel-glow' : ''}`;
  const inner = (
    <>
      <span className="icon-badge flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"><Icon size={22} /></span>
      <span className="mt-auto block pt-6 text-xs font-medium uppercase tracking-wide text-muted">{kicker}</span>
      <span className="mt-1 block font-display text-2xl font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted">{desc}</span>
      <ArrowRight size={18} className="absolute right-5 top-5 text-muted transition-all group-hover:translate-x-1 group-hover:text-ai" />
    </>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
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
    <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(p => (
        <a key={p.id} href={`#/immobile/${p.id}`} className="group card card-hover overflow-hidden">
          <div className="aspect-[4/3] overflow-hidden bg-canvas">
            {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
          </div>
          <div className="p-4">
            <div className="font-display text-lg font-semibold">{formatPrice(p.prezzo)}</div>
            <div className="mt-0.5 truncate text-sm">{p.titolo || p.nome}</div>
            <div className="mt-2 flex items-center gap-1 truncate text-xs text-muted"><MapPin size={12} /> {p.addr || 'Indirizzo n.d.'}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-canvas px-6 font-body text-ink">
      <div className="w-full max-w-md card p-8">
        <div className="font-display text-xl font-bold tracking-tight">GetNearMe</div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Come ti chiami?</h1>
        <p className="mt-1 text-sm text-muted">Il tuo nome apparirà sul portfolio pubblico, la vetrina con i tuoi immobili da condividere con i clienti.</p>
        <div className="mt-6"><ProfileForm initial={{ name: null, slug: null }} submitLabel="Continua" onSaved={onDone} /></div>
      </div>
    </div>
  );
}
