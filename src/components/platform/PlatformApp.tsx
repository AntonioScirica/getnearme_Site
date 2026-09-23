'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, Globe, LogOut, Link2, Sparkles, Plus, ArrowRight, MapPin, Loader2 } from 'lucide-react';
import type { UserData } from '@/app/[locale]/dashboard/page';
import { supabase } from '@/lib/supabase';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import NewPropertyWizard from './NewPropertyWizard';
import PropertyDetail from './PropertyDetail';

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

export const go = (path: string) => { window.location.hash = path; };

export const formatPrice = (n: number) => (n ? `€ ${n.toLocaleString('it-IT')}` : 'Prezzo n.d.');

const NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/immobili', label: 'Immobili', icon: Building2 },
  { path: '/portfolio', label: 'Portfolio', icon: Globe },
];

export default function PlatformApp({ userData }: { userData: UserData }) {
  const route = useHashRoute();
  const [projects, setProjects] = useState<ProjectData[] | null>(null);

  const reload = () => fetchProjects().then(setProjects);
  useEffect(() => { reload(); }, []);

  const detailId = route.startsWith('/immobile/') ? route.slice('/immobile/'.length) : null;

  return (
    <div className="flex h-full bg-canvas font-body text-ink">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-5">
        <div className="px-3 pb-6 font-display text-xl font-bold tracking-tight">GetNearMe</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = route === path || (path === '/immobili' && !!detailId);
            return (
              <a key={path} href={`#${path}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
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
        <div className="mx-auto max-w-6xl px-8 py-10">
          {route === '/nuovo' ? (
            <NewPropertyWizard onCreated={(p) => { reload(); go(`/immobile/${p.id}`); }} />
          ) : detailId ? (
            <PropertyDetail project={projects?.find(p => p.id === detailId)} loading={projects === null} />
          ) : route === '/immobili' ? (
            <PropertyList projects={projects} />
          ) : route === '/portfolio' ? (
            <p className="text-muted">Portfolio pubblico: in arrivo.</p>
          ) : (
            <HomeView projects={projects} />
          )}
        </div>
      </main>
    </div>
  );
}

function HomeView({ projects }: { projects: ProjectData[] | null }) {
  const [url, setUrl] = useState('');
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Cosa facciamo oggi?</h1>
      <p className="mt-1 text-muted">Migliora un annuncio che hai già online, oppure creane uno nuovo da zero.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ai/10 text-ai"><Sparkles size={20} /></div>
          <h2 className="mt-4 font-display text-xl font-semibold">Migliora un annuncio</h2>
          <p className="mt-1 text-sm text-muted">Incolla il link da immobiliare.it, idealista o casa.it: ti diamo score, nuova descrizione e cosa sistemare.</p>
          <div className="mt-5 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-line px-3">
              <Link2 size={16} className="text-muted" />
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.immobiliare.it/annunci/..."
                className="w-full bg-transparent py-2.5 text-sm outline-none" />
            </div>
            <button disabled className="rounded-lg bg-ink px-4 text-sm font-medium text-white opacity-40" title="In arrivo">Analizza</button>
          </div>
          <p className="mt-2 text-xs text-muted">In arrivo.</p>
        </section>

        <a href="#/nuovo" className="group rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><Plus size={20} /></div>
          <h2 className="mt-4 font-display text-xl font-semibold">Crea da zero</h2>
          <p className="mt-1 text-sm text-muted">Inserisci dati e foto: generiamo titolo, descrizione e score, e l&apos;immobile finisce nel tuo portfolio pubblico.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand">Inizia <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span>
        </a>
      </div>

      <div className="mt-12 flex items-end justify-between">
        <h2 className="font-display text-xl font-semibold">I tuoi immobili</h2>
        <a href="#/immobili" className="text-sm text-brand">Vedi tutti</a>
      </div>
      <div className="mt-4"><PropertyGrid projects={projects?.slice(0, 6) ?? null} /></div>
    </>
  );
}

function PropertyList({ projects }: { projects: ProjectData[] | null }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Immobili</h1>
        <a href="#/nuovo" className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"><Plus size={16} /> Nuovo</a>
      </div>
      <div className="mt-8"><PropertyGrid projects={projects} /></div>
    </>
  );
}

function PropertyGrid({ projects }: { projects: ProjectData[] | null }) {
  if (!projects) return <Loader2 className="animate-spin text-muted" />;
  if (!projects.length) return <p className="text-sm text-muted">Nessun immobile ancora. <a href="#/nuovo" className="text-brand">Crea il primo</a>.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(p => (
        <a key={p.id} href={`#/immobile/${p.id}`} className="overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg">
          <div className="aspect-[4/3] bg-canvas">
            {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
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
