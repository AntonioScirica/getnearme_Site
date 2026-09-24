'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, Globe, Gauge, LogOut, Plus, ArrowUp, Loader2, ImagePlus, Paperclip } from 'lucide-react';
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
    <div className="grid-bg relative flex h-full flex-col font-body text-ink">
      {/* Menu piccolo fluttuante in alto a sinistra */}
      <aside className="card fixed left-5 top-5 z-30 hidden w-48 p-3 shadow-sm lg:block">
        <a href="#/" className="flex items-center gap-2 px-2 pb-3 pt-1">
          <img src="/immo/logo-mark.png" alt="" className="h-7 w-7" />
          <span className="font-display text-base font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
        </a>
        <nav className="flex flex-col gap-0.5">
          {[...NAV, ...(isPlatformAdmin(userData.email) ? [{ path: '/costi', label: 'Costi AI', icon: Gauge }] : [])].map(({ path, label, icon: Icon }) => {
            const active = route === path || (path === '/immobili' && !!detailId);
            return (
              <a key={path} href={`#${path}`} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${active ? 'bg-canvas font-semibold text-ink' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
                <Icon size={15} /> {label}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* In alto a destra: nuovo annuncio, crediti, account */}
      <div className="fixed right-5 top-5 z-30 flex items-center gap-2.5">
        <a href="#/nuovo" aria-label="Nuovo annuncio" title="Nuovo annuncio" className="btn-ink flex h-10 w-10 items-center justify-center rounded-full"><Plus size={18} /></a>
        <AccountMenu email={userData.email} credits={userData.credits} name={profile?.name ?? undefined} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div key={route} className={`fade-up mx-auto px-6 pb-16 pt-20 lg:pl-60 lg:pr-10 ${route === '/' ? 'max-w-none' : 'max-w-7xl'}`}>
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

// Home: titolo grande, ventaglio di card inclinate (immobili veri o esempi) e UN campo in basso.
// Incolli un link -> Migliora. Graffetta -> Importa file. Immagine -> Crea da zero.
const EXAMPLES = [
  { cover: '/reference/giorno-notte-poster.jpg', a: 'Bilocale', b: 'luminoso', sub: 'Travi a vista, centro storico', score: 86 },
  { cover: '/staging/2.jpg', a: 'Trilocale', b: 'arredato', sub: 'Home staging con AI', score: 78 },
  { cover: '/staging/1_real.jpg', a: 'Monolocale', b: 'da rivedere', sub: 'Foto vuote, testo da riscrivere', score: 41 },
  { cover: '/staging/4.jpg', a: 'Attico', b: 'con terrazzo', sub: 'Descrizione riscritta', score: 91 },
];
const TILT = ['-rotate-6 translate-y-3', '-rotate-2', 'rotate-2', 'rotate-6 translate-y-3'];
const scoreColor = (n: number) => (n >= 75 ? 'bg-emerald-500' : n >= 55 ? 'bg-amber-400' : 'bg-rose-500');

export function HomeView({ projects, name }: { projects: ProjectData[] | null; name?: string }) {
  const [text, setText] = useState('');
  const isLink = /^https?:\/\//i.test(text.trim());
  const mine = (projects ?? []).filter(p => p.cover).slice(0, 4);
  const cards = mine.length >= 2
    ? mine.map(p => {
        const words = (p.titolo || p.nome || 'Immobile').split(' ');
        return { cover: p.cover, a: words[0], b: words.slice(1, 3).join(' '), sub: p.addr?.split(',').slice(-1)[0]?.trim() || '', score: (p.import_data as { score?: number } | undefined)?.score ?? null, href: `#/immobile/${p.id}` };
      })
    : EXAMPLES.map(e => ({ ...e, href: undefined as string | undefined }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLink) go(`/migliora?url=${encodeURIComponent(text.trim())}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col items-center">
      <h1 className="fade-up mt-6 text-center font-display text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl">
        Incolla un annuncio.<br />Lo rendiamo <span className="accent-serif text-[1.12em]">irresistibile</span> 🏡
      </h1>
      <p className="fade-up mt-4 text-center text-lg text-muted" style={{ animationDelay: '.05s' }}>Score, cosa sistemare e testo riscritto in pochi secondi. Oppure crealo da zero.</p>

      {/* Ventaglio di card */}
      <div className="stagger mt-12 flex items-end justify-center">
        {cards.map((c, i) => {
          const inner = (
            <>
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-canvas"><img src={c.cover} alt="" className="h-full w-full object-cover" /></div>
              <div className="mt-3 flex items-center gap-1.5">
                {typeof c.score === 'number' && <span className={`h-3 w-3 rounded-full ${scoreColor(c.score)}`} />}
                {typeof c.score === 'number' && <span className="text-xs font-semibold text-muted">{c.score}/100</span>}
              </div>
              <div className="mt-1.5 text-[15px] font-semibold leading-tight">{c.a} <span className="accent-serif text-[1.15em]">{c.b}</span></div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted">{c.sub}</div>
            </>
          );
          const cls = `fan-card -mx-2 w-48 rounded-2xl bg-white p-2.5 pb-4 md:w-56 ${TILT[i % 4]}`;
          return c.href ? <a key={i} href={c.href} className={cls}>{inner}</a> : <div key={i} className={cls}>{inner}</div>;
        })}
      </div>

      {/* Il campo unico */}
      <form onSubmit={submit} className="float-bar fade-up mt-auto w-full max-w-2xl rounded-3xl p-3 pt-4" style={{ animationDelay: '.15s' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Incolla il link di un annuncio (immobiliare.it, idealista, casa.it)…" className="w-full bg-transparent px-2 text-base outline-none placeholder:text-muted/70" />
        <div className="mt-4 flex items-center gap-2">
          <a href="#/importa" title="Importa da Excel o CSV" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-3 text-xs font-medium text-muted hover:text-ink"><Paperclip size={15} /> Importa file</a>
          <a href="#/nuovo" title="Crea da zero" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-3 text-xs font-medium text-muted hover:text-ink"><ImagePlus size={15} /> Crea da zero</a>
          <button disabled={!isLink} aria-label="Analizza" className="btn-ink ml-auto flex h-10 w-10 items-center justify-center rounded-full"><ArrowUp size={18} /></button>
        </div>
        {text.trim() && !isLink && <p className="mt-2 px-2 text-xs text-muted">Incolla un link che inizi con https://</p>}
      </form>
      <p className="mt-4 text-xs text-muted">{name ? `Ciao ${name.split(' ')[0]} · ` : ''}{projects?.length ? <a href="#/immobili" className="underline underline-offset-2">{projects.length} immobili</a> : 'Nessun immobile ancora'}</p>
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
