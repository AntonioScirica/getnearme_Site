'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, ExternalLink, Loader2, Monitor } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';
import { TEMPLATES, type SiteConfig, type SiteProperty } from '@/lib/siteTemplates';
import SiteRenderer from '@/components/site/SiteRenderer';
import { authFetch, CARD_SHADOW, formatPrice, portfolioUrl, setPublic } from './api';
import ProfileForm, { type Profile } from './ProfileForm';

// Vetrina: l'agente sceglie uno dei 5 template e modifica colori, testi, foto, contatti e sezioni,
// con l'anteprima dal vivo accanto (stesso SiteRenderer della pagina pubblica, con i suoi immobili).

type Site = { slug: string | null; name: string; email: string; logo: string | null; config: SiteConfig };
const COLORS = ['#2563eb', '#0f766e', '#5b7a5e', '#8a6a4f', '#c9a96e', '#e4572e', '#be185d', '#111111'];

export default function PortfolioView({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  const [tab, setTab] = useState<'sito' | 'immobili'>('sito');
  const [site, setSite] = useState<Site | null>(null);
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch('/api/platform/site').then(r => r.json()).then((d: Site) => { setSite(d); setCfg(d.config); });
  }, []);

  if (!site || !cfg) return <Loader2 className="animate-spin text-muted" />;
  const url = site.slug ? portfolioUrl(site.slug) : null;
  const dirty = JSON.stringify(cfg) !== JSON.stringify(site.config);
  const set = (p: Partial<SiteConfig>) => setCfg(c => ({ ...c!, ...p }));
  const save = async () => {
    setSaved('saving');
    const d = await authFetch('/api/platform/site', { method: 'PUT', body: JSON.stringify(cfg) }).then(r => r.json()).catch(() => ({}));
    if (d.config) { setSite(s => ({ ...s!, config: d.config })); setCfg(d.config); setSaved('ok'); setTimeout(() => setSaved('idle'), 1800); } else setSaved('idle');
  };

  const pub = (projects ?? []).filter(p => p.is_public);
  const props: SiteProperty[] = (pub.length ? pub : process.env.NODE_ENV === 'development' ? FAKE_PROPERTIES : [])
    .map(p => ({ id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, tipologia: p.tipologia, cover: p.cover }));
  const covers = [...new Set(props.map(p => p.cover).filter(Boolean))].slice(0, 12);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold leading-[1.2] tracking-tight">Vetrina</h1>
          {url && (
            <div className="mt-1 flex items-center gap-3 text-sm">
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-brand"><ExternalLink size={14} /> {url.replace(/^https?:\/\//, '')}</a>
              <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="flex items-center gap-1 text-muted hover:text-ink">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiato' : 'Copia'}</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white p-1 ring-1 ring-black/10">
            {([['sito', 'Sito'], ['immobili', 'Immobili e indirizzo']] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-[13px] font-medium ease-smooth transition-colors ${tab === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          {tab === 'sito' && (
            <button onClick={save} disabled={!dirty || saved === 'saving'}
              className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-[background-color,opacity] hover:bg-brand/90 disabled:opacity-40">
              {saved === 'saving' ? <Loader2 size={15} className="animate-spin" /> : saved === 'ok' ? <Check size={15} /> : null}
              {saved === 'ok' ? 'Pubblicato' : 'Pubblica modifiche'}
            </button>
          )}
        </div>
      </div>

      {tab === 'immobili' ? <PropertiesTab projects={projects} onChange={onChange} /> : (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[340px_1fr]">
          {/* Controlli */}
          <aside className={`space-y-7 rounded-[28px] bg-white p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto [scrollbar-width:none] ${CARD_SHADOW}`}>
            <Group title="Modello">
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => set({ template: t.id, primary: t.primary, font: t.font })}
                    className={`flex items-center gap-3 rounded-2xl p-2.5 text-left ring-1 ease-smooth transition-all ${cfg.template === t.id ? 'bg-canvas ring-ink' : 'ring-black/10 hover:bg-canvas'}`}>
                    <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.id === 'notte' ? '#0d0d0f' : '#f4f1ec'})` }} />
                    <span className="min-w-0"><span className="block text-sm font-semibold">{t.name}</span><span className="block truncate text-xs text-muted">{t.desc}</span></span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Colore e caratteri">
              <div className="flex flex-wrap items-center gap-2">
                {COLORS.map(c => <button key={c} onClick={() => set({ primary: c })} aria-label={c} className={`h-8 w-8 rounded-full ring-offset-2 ease-smooth transition-shadow ${cfg.primary === c ? 'ring-2 ring-ink' : ''}`} style={{ background: c }} />)}
                <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" title="Altro colore" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                  <input type="color" value={cfg.primary} onChange={e => set({ primary: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
              <Seg value={cfg.font} onChange={v => set({ font: v })} options={[['serif', 'Elegante'], ['sans', 'Moderno']]} />
            </Group>

            <Group title="Apertura">
              <Field label="Titolo" value={cfg.heroTitle} onChange={v => set({ heroTitle: v })} max={90} />
              <Field label="Sottotitolo" value={cfg.heroSubtitle} onChange={v => set({ heroSubtitle: v })} max={200} area />
              <Field label="Città o zona" value={cfg.city} onChange={v => set({ city: v })} max={60} />
              <Pics label="Foto di copertina" covers={covers} value={cfg.heroImage} onChange={v => set({ heroImage: v })} />
            </Group>

            <Group title="Chi sono">
              <Field label="Titolo sezione" value={cfg.aboutTitle} onChange={v => set({ aboutTitle: v })} max={60} />
              <Field label="Testo" value={cfg.aboutText} onChange={v => set({ aboutText: v })} max={900} area />
              <Pics label="Foto" covers={covers} value={cfg.aboutImage} onChange={v => set({ aboutImage: v })} />
            </Group>

            <Group title="Contatti">
              <Field label="Pulsante" value={cfg.ctaLabel} onChange={v => set({ ctaLabel: v })} max={30} />
              <Field label="Telefono" value={cfg.phone} onChange={v => set({ phone: v })} max={20} />
              <Field label="WhatsApp" value={cfg.whatsapp} onChange={v => set({ whatsapp: v })} max={20} />
              <Field label="Email" value={cfg.email} onChange={v => set({ email: v })} max={120} />
            </Group>

            <Group title="Sezioni">
              {([['showPrices', 'Mostra i prezzi'], ['showStats', 'Numeri'], ['showAbout', 'Chi sono'], ['showContact', 'Contatti']] as const).map(([k, l]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between py-1 text-sm">
                  {l}
                  <input type="checkbox" checked={cfg[k]} onChange={e => set({ [k]: e.target.checked })} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-line transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-brand checked:before:translate-x-[18px]" />
                </label>
              ))}
            </Group>
          </aside>

          {/* Anteprima dal vivo */}
          <Preview>
            <SiteRenderer cfg={cfg} name={site.name || 'La tua agenzia'} logo={site.logo} properties={props} base="" preview />
          </Preview>
        </div>
      )}
    </>
  );
}

// Il sito in scala dentro una finestra "browser": largo 1280 px come su un computer, rimpicciolito.
function Preview({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (box.current) setK(box.current.clientWidth / 1280);
      if (inner.current) setH(inner.current.offsetHeight);
    });
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={`overflow-hidden rounded-[28px] bg-white ${CARD_SHADOW}`}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-xs text-muted">
        <span className="flex gap-1.5">{[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 rounded-full bg-line" />)}</span>
        <span className="ml-3 flex items-center gap-1.5"><Monitor size={13} /> Anteprima dal vivo</span>
      </div>
      <div ref={box} className="h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin]"
        onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
        <div style={{ height: h * k }}>
          <div ref={inner} style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div><div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div><div className="space-y-2.5">{children}</div></div>
);

function Field({ label, value, onChange, max, area }: { label: string; value: string; onChange: (v: string) => void; max: number; area?: boolean }) {
  const cls = 'w-full rounded-2xl bg-canvas px-3.5 py-2.5 text-sm outline-none ease-smooth transition-shadow focus:bg-white focus:ring-1 focus:ring-ink/15';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      {area
        ? <textarea rows={3} value={value} maxLength={max} onChange={e => onChange(e.target.value)} className={`${cls} resize-none`} />
        : <input value={value} maxLength={max} onChange={e => onChange(e.target.value)} className={cls} />}
    </label>
  );
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[] }) {
  return (
    <div className="flex rounded-full bg-canvas p-1">
      {options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} className={`flex-1 rounded-full py-1.5 text-[13px] font-medium ease-smooth transition-colors ${value === v ? 'bg-white shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</button>)}
    </div>
  );
}

// Foto dalla lista degli immobili (automatica = la prima)
function Pics({ label, covers, value, onChange }: { label: string; covers: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={() => onChange('')} className={`flex aspect-square items-center justify-center rounded-xl bg-canvas text-[10px] font-medium text-muted ring-offset-1 ${!value ? 'ring-2 ring-ink' : ''}`}>Auto</button>
        {covers.map(c => (
          <button key={c} onClick={() => onChange(c)} className={`aspect-square overflow-hidden rounded-xl ring-offset-1 ${value === c ? 'ring-2 ring-ink' : ''}`}>
            <img src={c} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PropertiesTab({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  useEffect(() => { authFetch('/api/platform/portfolio').then(r => r.json()).then(d => setProfile({ name: d.name, slug: d.slug })); }, []);
  const toggle = async (p: ProjectData) => { if (await setPublic(p.id, !p.is_public)) onChange(); };
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 className="font-display text-xl font-semibold">Immobili in vetrina</h2>
        {!projects ? <Loader2 className="mt-4 animate-spin text-muted" /> : !projects.length ? (
          <p className="mt-4 text-sm text-muted">Nessun immobile. <a href="#/nuovo" className="text-brand">Mettine uno in vetrina</a>.</p>
        ) : (
          <ul className={`mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-white ${CARD_SHADOW}`}>
            {projects.map(p => (
              <li key={p.id} className="flex items-center gap-4 p-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas">{p.cover && <img src={p.thumb || p.cover} alt="" className="h-full w-full object-cover" />}</div>
                <a href={`#/immobile/${p.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.titolo || p.nome}</div>
                  <div className="text-xs text-muted">{formatPrice(p.prezzo)} · {p.addr}</div>
                </a>
                <PublicSwitch on={!!p.is_public} onClick={() => toggle(p)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <section className={`h-fit rounded-[24px] bg-white p-6 ${CARD_SHADOW}`}>
        <h2 className="mb-4 font-display text-xl font-semibold">Nome e indirizzo</h2>
        {profile ? <ProfileForm key={profile.slug ?? ''} initial={profile} submitLabel="Salva" onSaved={setProfile} /> : <Loader2 className="animate-spin text-muted" />}
      </section>
    </div>
  );
}

export function PublicSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={onClick} className="flex shrink-0 items-center gap-2 text-sm">
      <span className={on ? 'text-brand' : 'text-muted'}>{on ? 'Pubblico' : 'Privato'}</span>
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
