'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';
import { TEMPLATES, type SiteConfig, type SiteProperty, type TemplateId } from '@/lib/siteTemplates';
import { SitePage, SiteThumb } from '@/components/site/pages';
import type { Page } from '@/components/site/ui';
import { fileToResizedDataUrl } from '@/lib/staging';
import { uploadDataUrl } from '@/lib/imageUpload';
import { authFetch, CARD_SHADOW, formatPrice, portfolioUrl, setPublic } from './api';
import ProfileForm, { type Profile } from './ProfileForm';

// Vetrina: l'agente sceglie uno dei 5 template e modifica colori, testi, foto, contatti e sezioni,
// con l'anteprima dal vivo accanto (stesse pagine del sito pubblico, con i suoi immobili).

type Site = { slug: string | null; name: string; email: string; logo: string | null; config: SiteConfig };
const COLORS = ['#1d5b3c', '#4d7a2c', '#2a2b7c', '#1f6feb', '#111111', '#ff6a2b', '#be185d', '#8a6a4f'];

export default function PortfolioView({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  const [tab, setTab] = useState<'sito' | 'immobili'>('sito');
  const [site, setSite] = useState<Site | null>(null);
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok'>('idle');
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState<Page>({ page: 'home' });
  // null = galleria dei modelli; altrimenti editor del modello scelto
  const [editing, setEditing] = useState<TemplateId | null>(null);

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
    .map(p => {
      const d = (p.import_data ?? {}) as { photos?: string[]; zona?: string[]; contratto?: string };
      return { id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, locali: p.locali, tipologia: p.tipologia, cover: p.cover,
        descrizione: p.descrizione, riferimento: p.riferimento, createdAt: p.createdAt, details: (d as { details?: Record<string, unknown> }).details, photos: Array.isArray(d.photos) && d.photos.length ? d.photos : [p.cover], zona: Array.isArray(d.zona) ? d.zona : [], contratto: d.contratto ?? '' };
    });
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
          {tab === 'sito' && editing && (
            <button onClick={save} disabled={!dirty || saved === 'saving'}
              className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-[background-color,opacity] hover:bg-brand/90 disabled:opacity-40">
              {saved === 'saving' ? <Loader2 size={15} className="animate-spin" /> : saved === 'ok' ? <Check size={15} /> : null}
              {saved === 'ok' ? 'Pubblicato' : 'Pubblica modifiche'}
            </button>
          )}
        </div>
      </div>

      {tab === 'immobili' ? <PropertiesTab projects={projects} onChange={onChange} /> : !editing ? (
        <Gallery cfg={site.config} name={site.name || 'La tua agenzia'} logo={site.logo} props={props}
          onPick={id => { if (id !== cfg.template) set({ template: id, primary: TEMPLATES.find(t => t.id === id)!.primary, font: TEMPLATES.find(t => t.id === id)!.font }); setPage({ page: 'home' }); setEditing(id); }} />
      ) : (
        <div className="mt-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button onClick={() => { if (!dirty || confirm('Hai modifiche non pubblicate. Tornare ai modelli e scartarle?')) { setCfg(site.config); setEditing(null); } }}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-black/10 ease-smooth transition-colors hover:bg-canvas"><ArrowLeft size={15} /> Tutti i modelli</button>
            <span className="text-sm text-muted">Stai modificando <b className="text-ink">{TEMPLATES.find(t => t.id === cfg.template)?.name}</b>{cfg.template !== site.config.template && ' (non ancora pubblicato)'}</span>
          </div>
        <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
          {/* Controlli */}
          <aside className={`space-y-7 rounded-[28px] bg-white p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto [scrollbar-width:none] ${CARD_SHADOW}`}>
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

            <Group title="Il tuo profilo">
              <Pics label="La tua foto" covers={[]} value={cfg.aboutImage} onChange={v => set({ aboutImage: v })} />
              <Field label="Ruolo" value={cfg.agentRole} onChange={v => set({ agentRole: v })} max={60} />
              <Field label="Nome della pagina" value={cfg.aboutTitle} onChange={v => set({ aboutTitle: v })} max={60} />
              <Field label="Chi sei, in poche righe" value={cfg.aboutText} onChange={v => set({ aboutText: v })} max={900} area />
              <Field label="Zone in cui lavori (separate da virgola)" value={cfg.areas} onChange={v => set({ areas: v })} max={160} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Anni" value={cfg.years} onChange={v => set({ years: v.replace(/\D/g, '') })} max={4} />
                <Field label="Venduti" value={cfg.sold} onChange={v => set({ sold: v.replace(/\D/g, '') })} max={6} />
                <Field label="Clienti" value={cfg.clients} onChange={v => set({ clients: v.replace(/\D/g, '') })} max={6} />
              </div>
            </Group>

            <Group title="Servizi">
              <ListEditor items={cfg.services} max={8} addLabel="Aggiungi servizio" onChange={v => set({ services: v })}
                fields={[['title', 'Nome del servizio', 70, false], ['text', 'Descrizione', 600, true]]} empty={{ title: '', text: '' }} />
            </Group>

            <Group title="Il tuo metodo">
              <Field label="In evidenza nella pagina Servizi" value={cfg.method} onChange={v => set({ method: v })} max={1500} area />
            </Group>

            <Group title="Pagine zona">
              <p className="text-xs text-muted">Una pagina per località (es. “Casa a Sirolo”) con il tuo testo e gli annunci di quella zona. Scrivi “## Titolo” per un sottotitolo.</p>
              <ListEditor items={cfg.zones} max={8} addLabel="Aggiungi zona" onChange={v => set({ zones: v })}
                fields={[['name', 'Località', 40, false], ['text', 'Testo sulla zona', 4000, true]]} empty={{ name: '', text: '' }} />
            </Group>

            <Group title="Punti in evidenza">
              <Field label="Separati da virgola" value={cfg.highlights.join(', ')} onChange={v => set({ highlights: v.split(',').map(x => x.trimStart()).slice(0, 6) })} max={320} />
            </Group>

            <Group title="Recensioni">
              {cfg.reviews.map((r, i) => (
                <div key={i} className="space-y-2 rounded-2xl bg-canvas p-3">
                  <textarea rows={2} value={r.text} maxLength={300} placeholder="Cosa ha detto il cliente" onChange={e => set({ reviews: cfg.reviews.map((x, k) => k === i ? { ...x, text: e.target.value } : x) })}
                    className="w-full resize-none rounded-xl bg-white px-3 py-2 text-sm outline-none" />
                  <div className="flex gap-2">
                    <input value={r.name} maxLength={60} placeholder="Nome" onChange={e => set({ reviews: cfg.reviews.map((x, k) => k === i ? { ...x, name: e.target.value } : x) })} className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm outline-none" />
                    <button onClick={() => set({ reviews: cfg.reviews.filter((_, k) => k !== i) })} aria-label="Togli" className="px-2 text-muted hover:text-rose-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {cfg.reviews.length < 3 && <button onClick={() => set({ reviews: [...cfg.reviews, { text: '', name: '', zone: '' }] })} className="flex items-center gap-1.5 text-sm font-medium text-brand"><Plus size={15} /> Aggiungi recensione</button>}
            </Group>

            <Group title="Contatti">
              <Field label="Pulsante" value={cfg.ctaLabel} onChange={v => set({ ctaLabel: v })} max={30} />
              <Field label="Telefono" value={cfg.phone} onChange={v => set({ phone: v })} max={20} />
              <Field label="WhatsApp" value={cfg.whatsapp} onChange={v => set({ whatsapp: v })} max={20} />
              <Field label="Email" value={cfg.email} onChange={v => set({ email: v })} max={120} />
              <Field label="Indirizzo dell'ufficio" value={cfg.address} onChange={v => set({ address: v })} max={120} />
              <Field label="Instagram (link)" value={cfg.instagram} onChange={v => set({ instagram: v })} max={300} />
              <Field label="Facebook (link)" value={cfg.facebook} onChange={v => set({ facebook: v })} max={300} />
              <Field label="P.IVA, REA (piè di pagina)" value={cfg.legal} onChange={v => set({ legal: v })} max={160} />
            </Group>

            <Group title="Sezioni">
              {([['showPrices', 'Mostra i prezzi'], ['showStats', 'Numeri'], ['showAbout', 'Chi sono'], ['showContact', 'Contatti'], ['topBar', 'Barra con telefono ed email'], ['whatsappButton', 'Pulsante WhatsApp fisso']] as const).map(([k, l]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between py-1 text-sm">
                  {l}
                  <input type="checkbox" checked={cfg[k]} onChange={e => set({ [k]: e.target.checked })} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-line transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-brand checked:before:translate-x-[18px]" />
                </label>
              ))}
            </Group>
          </aside>

          {/* Anteprima dal vivo */}
          <Preview page={page} onPage={setPage} firstId={props[0]?.id}>
            <SitePage page={page} ctx={{ cfg, name: site.name || 'La tua agenzia', logo: site.logo, properties: props, base: '', preview: true, go: setPage }} />
          </Preview>
        </div>
        </div>
      )}
    </>
  );
}

// Galleria dei modelli: anteprima vera della home (con i dati dell'agente), clic per entrare nell'editor
function Gallery({ cfg, name, logo, props, onPick }: { cfg: SiteConfig; name: string; logo: string | null; props: SiteProperty[]; onPick: (id: TemplateId) => void }) {
  return (
    <div className="mt-8">
      <p className="mb-6 text-sm text-muted">Scegli un modello: entri nell’editor e lo personalizzi. Il sito cambia solo quando premi “Pubblica modifiche”.</p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t, i) => {
          const used = cfg.template === t.id;
          const tcfg = used ? cfg : { ...cfg, template: t.id, primary: t.primary, font: t.font };
          return (
            <div key={t.id} role="button" tabIndex={0} onClick={() => onPick(t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(t.id); } }}
              className="group rise cursor-pointer rounded-[22px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={`relative overflow-hidden rounded-[22px] bg-white ring-1 ease-smooth transition-[box-shadow,transform] group-hover:-translate-y-1 ${used ? 'ring-2 ring-brand' : 'ring-black/10'} ${CARD_SHADOW}`}>
                <Thumb><SiteThumb ctx={{ cfg: tcfg, name, logo, properties: props, base: '', preview: true }} /></Thumb>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 ease-smooth transition-colors group-hover:bg-black/25">
                  <span className="flex translate-y-2 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold opacity-0 shadow-lg ease-smooth transition-[opacity,transform] group-hover:translate-y-0 group-hover:opacity-100"><Pencil size={14} /> Personalizza</span>
                </div>
                {used && <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow">In uso</span>}
              </div>
              <div className="mt-3 flex items-start gap-2.5 px-1">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ background: t.primary, boxShadow: '0 0 0 1px rgba(0,0,0,.1)' }} />
                <span><span className="block font-semibold">{t.name}</span><span className="block text-sm text-muted">{t.desc}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Miniatura: il sito largo 1280 px rimpicciolito nella card, solo la parte alta, non cliccabile
function Thumb({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3);
  useEffect(() => {
    const ro = new ResizeObserver(() => { if (box.current) setK(box.current.clientWidth / 1280); });
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="pointer-events-none relative aspect-[16/11] select-none overflow-hidden" aria-hidden>
      <div style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

// Il sito in scala dentro una finestra "browser": largo 1280 px come su un computer, rimpicciolito.
function Preview({ children, page, onPage, firstId }: { children: ReactNode; page: Page; onPage: (p: Page) => void; firstId?: string }) {
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
        {/* pagine del sito: si naviga anche cliccando dentro l'anteprima */}
        <div className="ml-3 flex rounded-full bg-canvas p-0.5">
          {([['home', 'Home'], ['immobili', 'Immobili'], ['immobile', 'Scheda'], ['agente', 'Profilo'], ['servizi', 'Servizi'], ['contatti', 'Contatti']] as const).map(([id, l]) => (
            <button key={id} disabled={id === 'immobile' && !firstId} onClick={() => onPage(id === 'immobile' ? { page: 'immobile', id: firstId! } : { page: id } as Page)}
              className={`rounded-full px-3 py-1 font-medium ease-smooth transition-colors disabled:opacity-40 ${page.page === id ? 'bg-white text-ink shadow-sm' : 'hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div ref={box} key={JSON.stringify(page)} className="h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin]"
        onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
        <div style={{ height: h * k }}>
          <div ref={inner} style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Lista modificabile (servizi, zone): campi per voce, togli, aggiungi
function ListEditor<T extends Record<string, string>>({ items, fields, onChange, max, addLabel, empty }: {
  items: T[]; fields: [keyof T & string, string, number, boolean][]; onChange: (v: T[]) => void; max: number; addLabel: string; empty: T;
}) {
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-canvas p-3">
          {fields.map(([k, label, m, area]) => area
            ? <textarea key={k} rows={4} value={it[k]} maxLength={m} placeholder={label} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} className="w-full resize-y rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            : <input key={k} value={it[k]} maxLength={m} placeholder={label} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium outline-none" />)}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-muted hover:text-rose-600"><Trash2 size={13} /> Togli</button>
        </div>
      ))}
      {items.length < max && <button onClick={() => onChange([...items, { ...empty }])} className="flex items-center gap-1.5 text-sm font-medium text-brand"><Plus size={15} /> {addLabel}</button>}
    </>
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

// Foto: carica dal computer, oppure scegli tra quelle degli immobili (Auto = la prima)
function Pics({ label, covers, value, onChange }: { label: string; covers: string[]; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (f?: File) => {
    if (!f?.type.startsWith('image/')) return;
    setBusy(true);
    const url = await uploadDataUrl(await fileToResizedDataUrl(f, 1800), 'vetrina');
    setBusy(false);
    if (url) onChange(url);
  };
  const own = value && !covers.includes(value);
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      <div className="grid grid-cols-4 gap-1.5">
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl bg-canvas text-[10px] font-medium text-muted ring-1 ring-dashed ring-black/15 hover:text-ink">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}Carica
          <input type="file" accept="image/*" className="hidden" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {own && <button onClick={() => onChange(value)} className="aspect-square overflow-hidden rounded-xl ring-2 ring-ink ring-offset-1"><img src={value} alt="" className="h-full w-full object-cover" /></button>}
        {covers.length > 0 && <button onClick={() => onChange('')} className={`flex aspect-square items-center justify-center rounded-xl bg-canvas text-[10px] font-medium text-muted ring-offset-1 ${!value ? 'ring-2 ring-ink' : ''}`}>Auto</button>}
        {covers.map(c => (
          <button key={c} onClick={() => onChange(c)} className={`aspect-square overflow-hidden rounded-xl ring-offset-1 ${value === c ? 'ring-2 ring-ink' : ''}`}>
            <img src={c} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {!covers.length && value && <button onClick={() => onChange('')} className="flex aspect-square items-center justify-center rounded-xl bg-canvas text-[10px] font-medium text-muted">Togli</button>}
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
