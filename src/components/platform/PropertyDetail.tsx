'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, FileDown, GripVertical, Info, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
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
  const editing = true; // la barra di modifica c'e' sempre, a sinistra della pagina del sito
  const [draft, setDraft] = useState<Partial<ProjectData> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // foto mostrate prima della risposta del server: si tolgono quando arrivano i dati ricaricati (niente ritorno all'ordine vecchio)
  const dropPhotoDraft = () => setDraft(d => { if (!d) return d; const { cover: _c, import_data: _i, ...rest } = d; return rest; });
  const photoKey = project ? `${project.cover}|${JSON.stringify((project.import_data as { photos?: unknown } | undefined)?.photos ?? null)}` : '';
  const [seenPhotos, setSeenPhotos] = useState(photoKey);
  if (photoKey !== seenPhotos) { setSeenPhotos(photoKey); dropPhotoDraft(); }
  const credits = useCredits();
  const grid = useRef<HTMLDivElement>(null);
  const [gridH, setGridH] = useState<number>();
  useEffect(() => {
    if (!editing) return;
    const fit = () => { const el = grid.current; if (el) setGridH(Math.max(420, window.innerHeight - Math.max(0, el.getBoundingClientRect().top) - 24)); };
    fit();
    const t = setTimeout(fit, 700); // dopo lo scorrimento
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', fit, true);
    return () => { clearTimeout(t); window.removeEventListener('resize', fit); window.removeEventListener('scroll', fit, true); };
  }, [editing]);
  const planKnown = !!credits; // finche' non si sa il piano, niente interruttore ne' invito (niente salto)
  const sitePlan = !!credits && (credits.unlimited || credits.plan === 'plus' || credits.plan === 'pro'); // come in Il mio sito
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
  // nuovo ordine delle foto (dalla barra): si vede subito sulla pagina, poi si salva
  const reorder = async (order: string[]) => {
    if (order.join() === photos.join()) return;
    setDraft(d => ({ ...d, cover: order[0], import_data: { ...(project.import_data ?? {}), photos: order } }));
    const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: 'order', order }) }).catch(() => null);
    if (r?.ok) onChange(); else { dropPhotoDraft(); alert('Non sono riuscito a cambiare l’ordine delle foto, riprova.'); }
  };
  const propEdit: PropEdit = {
    photos, cover: project.cover, busy, editing, // in modifica le foto hanno il velo e i pulsanti sempre in vista
    onPhoto: async (src, action) => {
      if (action === 'ai') { window.location.hash = `#/staging?project=${project.id}&photo=${encodeURIComponent(src)}`; return; }
      if (action === 'remove' && !confirm('Togliere questa foto dall’immobile?')) return;
      // copertina: sale subito al primo posto e la galleria torna sulla prima (si rimonta sulla copertina nuova)
      if (action === 'cover') setDraft(d => ({ ...d, cover: src, import_data: { ...(project.import_data ?? {}), photos: [src, ...photos.filter(x => x !== src)] } }));
      setBusy(src);
      const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: action, photo: src }) }).catch(() => null);
      setBusy(null);
      if (r?.ok) onChange(); else { dropPhotoDraft(); alert(action === 'cover' ? 'Non sono riuscito a mettere la copertina, riprova.' : 'Non sono riuscito a togliere la foto, riprova.'); }
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
      </div>
      {/* avviso: qui e' la scheda della piattaforma, sul sito cambia con il modello scelto */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-2 pl-4 text-sm ${CARD_SHADOW}`}>
        <Info size={16} className="shrink-0 text-brand" />
        {/* tutto quello che riguarda il sito in una riga: stile, online o no, cambio modello */}
        {/* senza un piano col sito (Plus o Pro) non si pubblica: niente interruttore, l'invito a passare al piano */}
        <span className="min-w-0 flex-1 truncate text-muted">{!planKnown ? '' : !sitePlan ? 'Non è online.' : project.is_public ? 'Sul tuo sito si vede' : 'Non è sul tuo sito. Online si vedrà'}{sitePlan && <> con lo stile del modello {site?.template ? <b className="text-ink">{TEMPLATES.find(t => t.id === site.template)?.name}</b> : 'scelto'}.</>}</span>
        <a href="#/portfolio" className="flex h-9 items-center rounded-full px-3 font-medium hover:bg-canvas">Cambia modello</a>
        <span className="h-5 w-px bg-line" aria-hidden />
        {!planKnown ? <span className="h-9 w-56 rounded-full bg-canvas" aria-hidden /> : sitePlan
          ? <span className="pr-2"><PublicSwitch on={!!project.is_public} labels={['Pubblico', 'Non pubblico']} right onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} /></span>
          : <a href="#/piano" className="flex h-9 items-center rounded-full bg-ink px-4 font-semibold text-white hover:bg-black">Passa a Plus o Pro per pubblicare</a>}
        {sitePlan && project.is_public && site?.slug && <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-4 font-medium hover:bg-line/60">Vedi sul sito <ExternalLink size={14} /></a>}
      </div>
      {/* la pagina dell'immobile com'e' sul sito, col modello scelto; in modifica i campi a sinistra e la pagina si aggiorna */}
      {/* in modifica: barra e sito alti fino al fondo dello schermo, la pagina sta ferma e scorre solo il sito a destra */}
      <div ref={grid} style={editing ? { height: gridH } : undefined} className={`mt-8 grid gap-6 ${editing ? 'scroll-mt-24 lg:grid-cols-[360px_minmax(0,1fr)]' : 'items-start'}`}>
        {editing && <EditProperty project={project} photos={photos} onReorder={reorder} onDraft={setDraft} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); onChange(); }}
          report={<button type="button" onClick={() => downloadReport(project.id)} disabled={report === 'busy'} title={report === 'err' ? 'Report non disponibile, riprova' : 'PDF con foto, dati, zona e costi da mandare ai clienti'} className="mr-auto flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-ink disabled:opacity-50">{report === 'busy' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Report PDF</button>} />}
        {site?.config ? <div className={editing ? 'h-full min-w-0 overflow-y-auto rounded-[28px] overscroll-contain' : 'min-w-0'}><SiteFrame ctx={{ cfg: site.config, name: site.name, logo: site.logo, properties: [toSite({ ...project, ...draft })], base: '', preview: true, propEdit }} id={project.id} /></div> : <div className="aspect-[16/10] animate-pulse rounded-[28px] bg-canvas" />}
      </div>
      {!editing && typeof extra.score === 'number' && (
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

// Finestra per riordinare le foto: tutte grandi, si trascinano (maniglia e numero su ognuna), la prima e' la copertina.
// Si salva con Salva ordine; Annulla lascia tutto com'era.
export function PhotoOrder({ photos, onClose, onSave }: { photos: string[]; onClose: () => void; onSave: (order: string[]) => void }) {
  const [order, setOrder] = useState(photos);
  const [drag, setDrag] = useState<string | null>(null);
  const move = (over: string) => { if (!drag || drag === over) return; setOrder(o => { const n = o.filter(x => x !== drag); n.splice(n.indexOf(over) + (o.indexOf(drag) < o.indexOf(over) ? 1 : 0), 0, drag); return n; }); };
  return createPortal(
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[32px] bg-white shadow-2xl">
        <div className="px-7 pt-7">
          <h2 className="font-display text-2xl font-bold tracking-tight">Ordine delle foto</h2>
          <p className="mt-1 text-sm text-muted">Trascina le foto per metterle nell’ordine in cui le vedranno i clienti. La prima è la copertina dell’annuncio.</p>
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-7 sm:grid-cols-3">
          {order.map((src, i) => (
            <li key={src} draggable onDragStart={e => { setDrag(src); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDrag(null)} onDragOver={e => { e.preventDefault(); move(src); }} onDrop={e => e.preventDefault()}
              className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl bg-canvas ease-smooth transition-[opacity,transform,box-shadow] active:cursor-grabbing ${drag === src ? 'scale-95 opacity-40' : 'hover:shadow-lg'} ${i === 0 ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/5'}`}>
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
              <span className={`absolute left-2 top-2 flex h-7 items-center rounded-full px-2.5 text-xs font-semibold shadow ${i === 0 ? 'bg-brand text-white' : 'bg-white text-ink'}`}>{i === 0 ? 'Copertina' : i + 1}</span>
              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow" aria-hidden><GripVertical size={16} /></span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 border-t border-line px-7 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-sm font-medium text-muted hover:bg-canvas">Annulla</button>
          <button type="button" onClick={() => onSave(order)} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-black">Salva ordine</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Barra a sinistra della pagina del sito: i dati dell'immobile per gruppi, la pagina accanto cambia mentre si scrive.
// Le foto si gestiscono sulla pagina (Migliora con l'AI sempre in vista sulle foto).
const GROUPS: [string, (keyof ProjectData)[]][] = [['Annuncio', ['titolo', 'addr']], ['Prezzo e spazi', ['prezzo', 'mq', 'locali', 'camere', 'bagni']], ['Altro', ['tipologia', 'riferimento']]];
function EditProperty({ project, photos, onReorder, onClose, onSaved, onDraft, report }: { project: ProjectData; photos: string[]; onReorder: (order: string[]) => void; onClose: () => void; onSaved: () => void; onDraft: (d: Partial<ProjectData>) => void; report: React.ReactNode }) {
  const [sorting, setSorting] = useState(false); // finestra per riordinare le foto
  const panel = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const initial = () => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]);
  const reset = () => { setV(initial()); setErr(''); onClose(); }; // Annulla: si torna ai dati salvati
  const n = (x: string) => Math.max(0, Math.round(Number(x.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0));
  const toUp = (o: Record<string, string>) => Object.fromEntries([...FIELDS.map(f => [f.k, f.num ? n(o[f.k]) : o[f.k].trim()]), ['descrizione', o.descrizione.trim()]]);
  const set = (k: string, x: string) => setV(o => { const nv = { ...o, [k]: x }; onDraft(toUp(nv)); return nv; });
  const save = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    const r = await updateProject(project.id, toUp(v));
    setBusy(false);
    if (r) onSaved(); else setErr('Salvataggio non riuscito, riprova.');
  };
  const input = 'mt-1 h-10 w-full rounded-xl bg-canvas px-3 text-sm outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand';
  const field = (k: keyof ProjectData) => {
    const f = FIELDS.find(x => x.k === k)!;
    return (
      <label key={k} className={`block text-xs font-medium text-muted ${f.wide ? 'col-span-2' : ''}`}>{f.label}
        <input value={v[k]} onChange={e => set(k, e.target.value)} inputMode={f.num ? 'numeric' : undefined} placeholder={f.ph} maxLength={k === 'titolo' ? 120 : 200} className={input} />
      </label>
    );
  };
  return (
    <div ref={panel} className="blur-in flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-bold">Modifica immobile</h2>
        {err && <span className="ml-auto mr-2 text-sm text-rose-600">{err}</span>}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* foto: una card che apre la finestra per riordinarle (la prima e' la copertina) */}
        {photos.length > 1 && (
          <button type="button" onClick={() => setSorting(true)} className="group w-full rounded-2xl bg-canvas p-3 text-left ring-1 ring-transparent ease-smooth transition-shadow hover:ring-black/10">
            <span className="flex items-center gap-3">
              <span className="flex shrink-0 -space-x-3">
                {photos.slice(0, 3).map((src, i) => <img key={src} src={src} alt="" className="h-12 w-12 rounded-xl object-cover ring-2 ring-canvas" style={{ zIndex: 3 - i }} />)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Ordine delle foto</span>
                <span className="block text-xs text-muted">{photos.length} foto · copertina e ordine</span>
              </span>
            </span>
            {/* pulsante sotto, largo quanto la card */}
            <span className="mt-3 flex h-10 w-full items-center justify-center rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors group-hover:bg-ink group-hover:text-white">Riordina le foto</span>
          </button>
        )}
        {GROUPS.map(([title, keys]) => (
          <section key={title}>
            <h3 className="text-sm font-semibold">{title}</h3>
            <div className="mt-2 grid grid-cols-2 gap-3">{keys.map(field)}</div>
            {title === 'Annuncio' && (
              <label className="mt-3 block text-xs font-medium text-muted">Descrizione
                <textarea value={v.descrizione} onChange={e => set('descrizione', e.target.value)} rows={7} maxLength={8000} className="mt-1 w-full resize-none rounded-xl bg-canvas px-3 py-2.5 text-sm leading-relaxed outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand" />
              </label>
            )}
          </section>
        ))}
      </div>
      {sorting && <PhotoOrder photos={photos} onClose={() => setSorting(false)} onSave={o => { setSorting(false); onReorder(o); }} />}
      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
        {report}
        <button type="button" onClick={reset} disabled={busy} className="h-10 rounded-full px-4 text-sm font-medium text-muted hover:bg-canvas">Annulla</button>
        <button type="button" onClick={save} disabled={busy} className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />} Salva</button>
      </div>
    </div>
  );
}
