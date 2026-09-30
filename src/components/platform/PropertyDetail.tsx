'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, FileDown, Info, Loader2, Pencil, X } from 'lucide-react';
import { TEMPLATES, type SiteConfig, type TemplateId } from '@/lib/siteTemplates';
import { SitePage } from '@/components/site/pages';
import type { PropEdit } from '@/components/site/ui';
import { updateProject, type ProjectData } from '@/lib/projects';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { PublicSwitch, toSite } from './PortfolioView';
import { useCredits } from './PlanView';
import { printHtml } from '@/lib/printHtml';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void }) {
  // modello del sito e indirizzo: per l'avviso "sul sito si vede con lo stile del modello"
  const [site, setSite] = useState<{ slug: string | null; template: TemplateId; config: SiteConfig; name: string; logo: string | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectData> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const credits = useCredits();
  const sitePlan = !credits || credits.unlimited || credits.plan === 'plus' || credits.plan === 'pro'; // come in Il mio sito // foto su cui si sta lavorando (copertina, togli) // dati in modifica: la pagina del sito si aggiorna mentre si scrive
  // report PDF da mandare ai clienti: lo compone il server (api/platform/report), si stampa da un iframe nascosto
  const [report, setReport] = useState<'idle' | 'busy' | 'err'>('idle');
  const downloadReport = async (id: string) => {
    setReport('busy');
    const html = await authFetch(`/api/platform/report?id=${encodeURIComponent(id)}`).then(r => (r.ok ? r.text() : '')).catch(() => '');
    if (html) { await printHtml(html); setReport('idle'); } else setReport('err');
  };
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSite({ slug: d.slug ?? null, template: d.config?.template, config: d.config, name: d.name || 'La tua agenzia', logo: d.logo ?? null })).catch(() => {}); }, []);
  if (loading) return <Loader2 className="animate-spin text-muted" />;
  if (!project) return <p className="text-muted">Immobile non trovato. <a href="#/immobili" className="text-brand">Torna agli immobili</a>.</p>;

  const extra = (project.import_data ?? {}) as { score?: number; suggerimenti?: string[]; photos?: unknown };
  // la pagina del sito e' anche il posto dove si modifica: testi al clic, azioni sulle foto (AI, copertina, togli)
  const photos = Array.isArray(extra.photos) ? extra.photos.filter((x): x is string => typeof x === 'string') : project.cover ? [project.cover] : [];
  const propEdit: PropEdit = {
    photos, cover: project.cover, busy,
    onPhoto: async (src, action) => {
      if (action === 'ai') { window.location.hash = `#/staging?project=${project.id}&photo=${encodeURIComponent(src)}`; return; }
      if (action === 'remove' && !confirm('Togliere questa foto dall’immobile?')) return;
      setBusy(src);
      const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: action, photo: src }) }).catch(() => null);
      setBusy(null);
      if (r?.ok) onChange();
    },
    onField: async (k, v) => {
      const val = k === 'prezzo' ? Math.max(0, Math.round(Number(v.replace(/[^\d]/g, '')) || 0)) : v.trim();
      setDraft(d => ({ ...d, [k]: val })); // si vede subito, poi si salva
      if (await updateProject(project.id, { [k]: val })) onChange();
    },
  };
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Immobili</a>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => downloadReport(project.id)} disabled={report === 'busy'} title={report === 'err' ? 'Report non disponibile, riprova' : 'PDF con foto, dati, zona e costi da mandare ai clienti'} className={`flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium ring-1 ease-smooth transition-colors hover:bg-canvas disabled:opacity-60 ${report === 'err' ? 'ring-rose-300 text-rose-700' : 'ring-black/10'}`}>{report === 'busy' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} {report === 'busy' ? 'Preparo il report…' : 'Scarica report'}</button>
          <button type="button" onClick={() => setEditing(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-black/10 ease-smooth transition-colors hover:bg-canvas"><Pencil size={14} /> Modifica</button>
        </div>
      </div>
      {/* avviso: qui e' la scheda della piattaforma, sul sito cambia con il modello scelto */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-2 pl-4 text-sm ${CARD_SHADOW}`}>
        <Info size={16} className="shrink-0 text-brand" />
        {/* tutto quello che riguarda il sito in una riga: stile, online o no, cambio modello */}
        {/* senza un piano col sito (Plus o Pro) non si pubblica: niente interruttore, l'invito a passare al piano */}
        <span className="min-w-0 flex-1 truncate text-muted">{!sitePlan ? 'Non è online.' : project.is_public ? 'Sul tuo sito si vede' : 'Non è sul tuo sito. Online si vedrà'}{sitePlan && <> con lo stile del modello {site?.template ? <b className="text-ink">{TEMPLATES.find(t => t.id === site.template)?.name}</b> : 'scelto'}.</>}</span>
        <a href="#/portfolio" className="flex h-9 items-center rounded-full px-3 font-medium hover:bg-canvas">Cambia modello</a>
        <span className="h-5 w-px bg-line" aria-hidden />
        {sitePlan
          ? <span className="pr-2"><PublicSwitch on={!!project.is_public} labels={['Pubblico', 'Non pubblico']} right onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} /></span>
          : <a href="#/piano" className="flex h-9 items-center rounded-full bg-ink px-4 font-semibold text-white hover:bg-black">Passa a Plus o Pro per pubblicare</a>}
        {sitePlan && project.is_public && site?.slug && <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-4 font-medium hover:bg-line/60">Vedi sul sito <ExternalLink size={14} /></a>}
      </div>
      {/* la pagina dell'immobile com'e' sul sito, col modello scelto; in modifica i campi a sinistra e la pagina si aggiorna */}
      <div className={`mt-8 grid items-start gap-6 ${editing ? 'lg:grid-cols-[360px_minmax(0,1fr)]' : ''}`}>
        {editing && <EditProperty project={project} onDraft={setDraft} onClose={() => { setEditing(false); setDraft(null); }} onSaved={() => { setEditing(false); setDraft(null); onChange(); }} />}
        {site?.config ? <SiteFrame ctx={{ cfg: site.config, name: site.name, logo: site.logo, properties: [toSite({ ...project, ...draft })], base: '', preview: true, propEdit }} id={project.id} /> : <div className="aspect-[16/10] animate-pulse rounded-[28px] bg-canvas" />}
      </div>
      {typeof extra.score === 'number' && (
        <section className="mt-10 card p-6">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-lg font-semibold">Qualità dell&apos;annuncio</h2><span className="font-display text-2xl font-bold text-ai">{extra.score}/100</span></div>
          {!!extra.suggerimenti?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{extra.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>}
        </section>
      )}
    </>
  );
}

// Modifica dei dati dell'immobile: gli stessi campi della scheda pubblica. Numeri vuoti = 0 (non indicato).
const FIELDS: { k: keyof ProjectData; label: string; num?: boolean; wide?: boolean; ph?: string }[] = [
  { k: 'titolo', label: 'Titolo', wide: true, ph: 'Prati, trilocale con box vicino alla metro' },
  { k: 'addr', label: 'Indirizzo', wide: true, ph: 'Via Cola di Rienzo 120, Roma' },
  { k: 'prezzo', label: 'Prezzo (€)', num: true }, { k: 'mq', label: 'Superficie (m²)', num: true },
  { k: 'locali', label: 'Locali', num: true }, { k: 'camere', label: 'Camere', num: true },
  { k: 'bagni', label: 'Bagni', num: true }, { k: 'tipologia', label: 'Tipologia', ph: 'Appartamento' },
  { k: 'riferimento', label: 'Riferimento', ph: 'Codice interno' },
]
// Pagina del sito in scala, larga 1280 px come su un computer; non cliccabile (si guarda e si scorre con la pagina)
function SiteFrame({ ctx, id }: { ctx: Parameters<typeof SitePage>[0]['ctx']; id: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => { if (box.current) setK(box.current.clientWidth / 1280); if (inner.current) setH(inner.current.offsetHeight); });
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`relative min-w-0 overflow-hidden rounded-[28px] bg-white ${CARD_SHADOW}`} style={{ height: h ? h * k : undefined }}>
      <div ref={inner} className={ctx.propEdit ? '' : 'pointer-events-none select-none'} style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }} aria-hidden={!ctx.propEdit}>
        <SitePage ctx={ctx} page={{ page: 'immobile', id }} />
      </div>
    </div>
  );
}

function EditProperty({ project, onClose, onSaved, onDraft }: { project: ProjectData; onClose: () => void; onSaved: () => void; onDraft: (d: Partial<ProjectData>) => void }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const n = (x: string) => Math.max(0, Math.round(Number(x.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0));
  const toUp = (o: Record<string, string>) => Object.fromEntries([...FIELDS.map(f => [f.k, f.num ? n(o[f.k]) : o[f.k].trim()]), ['descrizione', o.descrizione.trim()]]);
  const set = (k: string, x: string) => setV(o => { const nv = { ...o, [k]: x }; onDraft(toUp(nv)); return nv; });
  const save = async () => {
    setBusy(true); setErr('');
    const up = toUp(v);
    const r = await updateProject(project.id, up);
    setBusy(false);
    if (r) onSaved(); else setErr('Salvataggio non riuscito, riprova.');
  };
  const input = 'mt-1.5 h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15';
  return (
    // pannello a sinistra della pagina del sito (non piu' finestra sopra): si scrive e la pagina accanto cambia
    <div className="blur-in flex max-h-[calc(100vh-8rem)] flex-col rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-xl font-bold">Modifica immobile</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto px-6 py-5">
          {FIELDS.map(f => (
            <label key={f.k} className={`block text-xs font-medium text-ink/70 ${f.wide ? 'col-span-2' : ''}`}>{f.label}
              <input value={v[f.k]} onChange={e => set(f.k, e.target.value)} inputMode={f.num ? 'numeric' : undefined} placeholder={f.ph} maxLength={f.k === 'titolo' ? 120 : 200} className={input} />
            </label>
          ))}
          <label className="block text-xs font-medium text-ink/70 col-span-2">Descrizione
            <textarea value={v.descrizione} onChange={e => set('descrizione', e.target.value)} rows={8} maxLength={8000} className="mt-1.5 w-full rounded-[20px] bg-canvas px-4 py-3 text-sm leading-relaxed outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          {err && <span className="mr-auto text-sm text-rose-600">{err}</span>}
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-full px-5 text-sm font-medium text-muted hover:bg-canvas">Annulla</button>
          <button type="button" onClick={save} disabled={busy} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />} Salva</button>
        </div>
    </div>
  );
}
