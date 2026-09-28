'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Info, Loader2, Pencil, Sparkles, Star, Wand2, X } from 'lucide-react';
import FitImage from '@/components/ui/FitImage';
import { TEMPLATES, type TemplateId } from '@/lib/siteTemplates';
import { updateProject, type ProjectData } from '@/lib/projects';
import PropertyView from '../property/PropertyView';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { PublicSwitch } from './PortfolioView';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void }) {
  // modello del sito e indirizzo: per l'avviso "sul sito si vede con lo stile del modello"
  const [site, setSite] = useState<{ slug: string | null; template: TemplateId } | null>(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSite({ slug: d.slug ?? null, template: d.config?.template })).catch(() => {}); }, []);
  if (loading) return <Loader2 className="animate-spin text-muted" />;
  if (!project) return <p className="text-muted">Immobile non trovato. <a href="#/immobili" className="text-brand">Torna agli immobili</a>.</p>;

  const extra = (project.import_data ?? {}) as { score?: number; suggerimenti?: string[] };
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Immobili</a>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setEditing(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-black/10 ease-smooth transition-colors hover:bg-canvas"><Pencil size={14} /> Modifica</button>
          <PublicSwitch on={!!project.is_public} onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} />
        </div>
      </div>
      {editing && <EditProperty project={project} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onChange(); }} />}
      {/* avviso: qui e' la scheda della piattaforma, sul sito cambia con il modello scelto */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-2 pl-4 text-sm ${CARD_SHADOW}`}>
        <Info size={16} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1 truncate text-muted">Sul tuo sito si vedrà con lo stile del modello {site?.template ? <b className="text-ink">{TEMPLATES.find(t => t.id === site.template)?.name}</b> : 'scelto'}.</span>
        <a href="#/portfolio" className="flex h-9 items-center rounded-full px-3 font-medium hover:bg-canvas">Cambia modello</a>
        {project.is_public && site?.slug && <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-4 font-medium hover:bg-line/60">Vedi sul sito <ExternalLink size={14} /></a>}
      </div>
      {/* le foto: da qui ogni foto va all'AI, e una foto AI torna qui accanto all'originale (prima/dopo sul sito) */}
      <PhotoManager project={project} onChange={onChange} />
      <PropertyView p={project} hideGallery />
      {typeof extra.score === 'number' && (
        <section className="mt-10 card p-6">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-lg font-semibold">Qualità dell&apos;annuncio</h2><span className="font-display text-2xl font-bold text-ai">{extra.score}/100</span></div>
          {!!extra.suggerimenti?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{extra.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>}
        </section>
      )}
    </>
  );
}

// Foto dell'immobile con le azioni: Migliora con l'AI (apre la chat con quella foto), Copertina, togli.
// Le foto AI messe accanto all'originale hanno l'etichetta Prima / Dopo.
function PhotoManager({ project, onChange }: { project: ProjectData; onChange: () => void }) {
  const d = (project.import_data ?? {}) as { photos?: unknown; prima?: Record<string, string> };
  const photos = Array.isArray(d.photos) ? d.photos.filter((x): x is string => typeof x === 'string') : project.cover ? [project.cover] : [];
  const [busy, setBusy] = useState<string | null>(null);
  // passando sopra una foto si fa gia' riconoscere la stanza: quando la apri in chat la risposta e' in memoria
  const warmed = useRef(new Set<string>());
  const prefetch = (src: string) => {
    const known = (d as { rooms?: Record<string, unknown> }).rooms?.[src];
    if (known || warmed.current.has(src)) return;
    warmed.current.add(src);
    authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageUrl: src, projectId: project.id, photoUrl: src }) }).catch(() => {});
  };
  const act = async (mode: 'remove' | 'cover', photo: string) => {
    if (mode === 'remove' && !confirm('Togliere questa foto dall’immobile?')) return;
    setBusy(photo);
    const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode, photo }) }).catch(() => null);
    setBusy(null);
    if (r?.ok) onChange();
  };
  return (
    <section className={`mb-6 rounded-3xl bg-white p-4 ${CARD_SHADOW}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-5">
        <div><h2 className="font-display text-lg font-semibold">Le foto</h2><p className="text-sm text-muted">Passa sopra una foto per migliorarla con l’AI. Il risultato torna qui, accanto all’originale, e sul sito si vede il prima/dopo.</p></div>
      </div>
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map(src => (
            <li key={src} onMouseEnter={() => prefetch(src)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
              <FitImage src={src} />
              {src === project.cover && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-semibold text-white"><Star size={10} /> Copertina</span>}
              {d.prima?.[src] && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white"><Sparkles size={10} /> Prima / Dopo</span>}
              {busy === src ? <span className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 size={18} className="animate-spin" /></span> : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 opacity-0 ease-smooth transition-opacity group-hover:opacity-100">
                  {/* togli: in alto a destra; al centro l'azione principale e, uguale ma secondaria, Copertina */}
                  <button onClick={() => act('remove', src)} aria-label="Togli la foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"><X size={14} /></button>
                  {/* colonna larga quanto il pulsante piu' largo: i due pulsanti hanno la stessa larghezza */}
                  <div className="flex w-fit flex-col gap-2">
                    <a href={`#/staging?project=${project.id}&photo=${encodeURIComponent(src)}`} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white shadow-lg ease-smooth transition-transform hover:scale-105"><Wand2 size={13} /> Migliora con l’AI</a>
                    {src !== project.cover && <button onClick={() => act('cover', src)} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow-lg ease-smooth transition-transform hover:scale-105"><Star size={13} /> Copertina</button>}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="px-1 pb-2 text-sm text-muted">Nessuna foto ancora.</p>}
    </section>
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
function EditProperty({ project, onClose, onSaved }: { project: ProjectData; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, x: string) => setV(o => ({ ...o, [k]: x }));
  const save = async () => {
    setBusy(true); setErr('');
    const n = (x: string) => Math.max(0, Math.round(Number(x.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0));
    const up = Object.fromEntries([...FIELDS.map(f => [f.k, f.num ? n(v[f.k]) : v[f.k].trim()]), ['descrizione', v.descrizione.trim()]]);
    const r = await updateProject(project.id, up);
    setBusy(false);
    if (r) onSaved(); else setErr('Salvataggio non riuscito, riprova.');
  };
  const input = 'mt-1.5 h-11 w-full rounded-full bg-canvas px-4 text-sm outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15';
  return (
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-xl font-bold">Modifica immobile</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>
        <div className="grid gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          {FIELDS.map(f => (
            <label key={f.k} className={`block text-xs font-medium text-ink/70 ${f.wide ? 'sm:col-span-2' : ''}`}>{f.label}
              <input value={v[f.k]} onChange={e => set(f.k, e.target.value)} inputMode={f.num ? 'numeric' : undefined} placeholder={f.ph} maxLength={f.k === 'titolo' ? 120 : 200} className={input} />
            </label>
          ))}
          <label className="block text-xs font-medium text-ink/70 sm:col-span-2">Descrizione
            <textarea value={v.descrizione} onChange={e => set('descrizione', e.target.value)} rows={8} maxLength={8000} className="mt-1.5 w-full rounded-[20px] bg-canvas px-4 py-3 text-sm leading-relaxed outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          {err && <span className="mr-auto text-sm text-rose-600">{err}</span>}
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-full px-5 text-sm font-medium text-muted hover:bg-canvas">Annulla</button>
          <button type="button" onClick={save} disabled={busy} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />} Salva</button>
        </div>
      </div>
    </div>
  );
}
