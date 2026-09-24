'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, Globe, Gauge, LogOut, Link2, Sparkles, Plus, ArrowRight, Loader2, FileSpreadsheet } from 'lucide-react';
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
    <div className="gnm-bg flex h-full flex-col font-body text-ink">
      <header className="glass sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-8 px-8">
          <a href="#/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-extrabold text-white">G</span>
            <span className="font-display text-xl font-extrabold tracking-tight">GetNearMe</span>
          </a>
          <nav className="mx-auto hidden items-center gap-7 text-sm font-medium md:flex">
            {[...NAV, ...(isPlatformAdmin(userData.email) ? [{ path: '/costi', label: 'Costi AI', icon: Gauge }] : [])].map(({ path, label }) => {
              const active = route === path || (path === '/immobili' && !!detailId);
              return <a key={path} href={`#${path}`} aria-current={active ? 'page' : undefined} className={`link-underline py-1 ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}>{label}</a>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <a href="#/nuovo" className="btn-ink hidden rounded-full px-5 py-2.5 text-sm font-semibold sm:block">Nuovo annuncio</a>
            <AccountMenu email={userData.email} credits={userData.credits} name={profile?.name ?? undefined} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div key={route} className="fade-up mx-auto max-w-6xl px-8 py-8">
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

// Home stile Airbnb: grande foto (ultimo immobile o foto di default), titolo deciso, barra
// fluttuante con i tre ingressi; sotto gli immobili a card con foto protagonista.
const HERO_FALLBACK = '/reference/giorno-notte-poster.jpg';

export function HomeView({ projects, name }: { projects: ProjectData[] | null; name?: string }) {
  const [mode, setMode] = useState<'link' | null>(null);
  const [url, setUrl] = useState('');
  const n = projects?.length ?? 0;
  const pub = projects?.filter(p => p.is_public).length ?? 0;
  const hero = projects?.find(p => p.cover)?.cover || HERO_FALLBACK;

  return (
    <>
      <section className="relative">
        <div className="fade-up relative h-[420px] overflow-hidden rounded-[28px] bg-canvas">
          <img src={hero} alt="" className="h-full w-full object-cover object-[center_60%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent" />
          <div className="absolute left-10 top-12 max-w-lg">
            <p className="flex items-center gap-2 text-sm font-medium text-ink/70"><span className="h-px w-6 bg-ink/50" /> {name ? `Ciao ${name.split(' ')[0]}` : 'Per agenti immobiliari'}</p>
            <h1 className="mt-4 font-display text-6xl font-extrabold leading-[1.02] tracking-tight">Annunci che<br />si fanno notare.</h1>
          </div>
        </div>

        {/* Barra fluttuante: tre ingressi, il primo diventa campo link */}
        <div className="float-bar fade-up relative z-10 mx-auto -mt-14 flex max-w-4xl items-stretch rounded-[22px] p-2" style={{ animationDelay: '0.1s' }}>
          {mode === 'link' ? (
            <form onSubmit={e => { e.preventDefault(); if (url.trim()) go(`/migliora?url=${encodeURIComponent(url.trim())}`); }} className="flex flex-1 items-center gap-3 pl-5">
              <Link2 size={18} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">Migliora un annuncio</div>
                <input autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="Incolla il link da immobiliare.it, idealista o casa.it" className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:text-muted" />
              </div>
              <button type="button" onClick={() => setMode(null)} className="px-2 text-sm text-muted hover:text-ink">Annulla</button>
              <button disabled={!url.trim()} aria-label="Analizza" className="btn-ink flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"><Sparkles size={20} /></button>
            </form>
          ) : (
            <>
              <BarItem onClick={() => setMode('link')} icon={Link2} title="Migliora un annuncio" sub="Incolla il link del portale" />
              <span className="my-3 w-px bg-line" />
              <BarItem href="#/nuovo" icon={Plus} title="Crea da zero" sub="Foto, dati e l'AI scrive" />
              <span className="my-3 w-px bg-line" />
              <BarItem href="#/importa" icon={FileSpreadsheet} title="Importa" sub="Excel o CSV del gestionale" />
              <a href="#/nuovo" aria-label="Crea da zero" className="btn-ink flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-2xl"><ArrowRight size={20} /></a>
            </>
          )}
        </div>
      </section>

      <div className="mt-16 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">I tuoi immobili</h2>
          {n > 0 && <p className="mt-1 text-sm text-muted">{n} {n === 1 ? 'immobile' : 'immobili'} · {pub} nel portfolio</p>}
        </div>
        {n > 6 && <a href="#/immobili" className="text-sm font-semibold underline underline-offset-4">Vedi tutti</a>}
      </div>
      <div className="mt-6"><PropertyGrid projects={projects?.slice(0, 6) ?? null} /></div>
    </>
  );
}

function BarItem({ href, onClick, icon: Icon, title, sub }: { href?: string; onClick?: () => void; icon: React.ComponentType<{ size?: number; className?: string }>; title: string; sub: string }) {
  const cls = 'group flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 text-left transition-colors hover:bg-canvas';
  const inner = (
    <>
      <Icon size={18} className="shrink-0 text-muted transition-colors group-hover:text-ink" />
      <span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className="block truncate text-sm text-muted">{sub}</span></span>
    </>
  );
  return href ? <a href={href} className={cls}>{inner}</a> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function AccountMenu({ email, credits, name }: { email: string; credits: number; name?: string }) {
  const [open, setOpen] = useState(false);
  const initial = (name || email)[0]?.toUpperCase();
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-3 pr-1.5 transition-shadow hover:shadow-md">
        <span className="text-xs font-medium text-muted">{credits} crediti</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{initial}</span>
      </button>
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
        <div className="font-display text-xl font-bold tracking-tight">GetNearMe</div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Come ti chiami?</h1>
        <p className="mt-1 text-sm text-muted">Il tuo nome apparirà sul portfolio pubblico, la vetrina con i tuoi immobili da condividere con i clienti.</p>
        <div className="mt-6"><ProfileForm initial={{ name: null, slug: null }} submitLabel="Continua" onSaved={onDone} /></div>
      </div>
    </div>
  );
}
