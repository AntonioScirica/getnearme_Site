'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, FileDown, GripVertical, ImagePlus, Info, Loader2, Star, Wand2, X } from 'lucide-react';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';
import { createPortal } from 'react-dom';
import { TEMPLATES, type SiteConfig, type TemplateId } from '@/lib/siteTemplates';
import { SitePage } from '@/components/site/pages';
import type { PropEdit } from '@/components/site/ui';
import { updateProject, type ProjectData } from '@/lib/projects';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { PublicSwitch, toSite } from './PortfolioView';
import { useCredits } from './PlanView';
import { printHtml } from '@/lib/printHtml';
import { tr } from './i18n';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void | Promise<unknown> }) {
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
  // caricamento (anche subito dopo aver creato o salvato l'immobile): la forma della pagina, non una rotellina
  if (loading) return (
    <div aria-busy className="animate-pulse">
      <div className="h-5 w-24 rounded-full bg-black/[0.06]" />
      <div className="mt-6 h-14 rounded-3xl bg-black/[0.05]" />
      <div className="mt-8 aspect-[16/10] rounded-[28px] bg-black/[0.05]" />
    </div>
  );
  if (!project) return <p className="text-muted">{tr('Immobile non trovato.', 'Listing not found.')} <a href="#/immobili" className="text-brand">{tr('Torna agli immobili', 'Back to listings')}</a>.</p>;

  const extra = (project.import_data ?? {}) as { score?: number; suggerimenti?: string[]; photos?: unknown };
  // la pagina del sito e' anche il posto dove si modifica: testi al clic, azioni sulle foto (AI, copertina, togli)
  const photos = Array.isArray(extra.photos) ? extra.photos.filter((x): x is string => typeof x === 'string') : project.cover ? [project.cover] : [];
  // nuovo ordine delle foto (dalla barra): si vede subito sulla pagina, poi si salva
  const reorder = async (order: string[]) => {
    if (order.join() === photos.join()) return;
    setDraft(d => ({ ...d, cover: order[0], import_data: { ...(project.import_data ?? {}), photos: order } }));
    const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: 'order', order }) }).catch(() => null);
    if (r?.ok) onChange(); else { dropPhotoDraft(); alert(tr('Non sono riuscito a cambiare l’ordine delle foto, riprova.', 'Could not change the photo order, please try again.')); }
  };
  const propEdit: PropEdit = {
    photos, cover: project.cover, busy, editing, // in modifica le foto hanno il velo e i pulsanti sempre in vista
    onPhoto: async (src, action) => {
      if (action === 'ai') {
        // senza piano: subito il popup dei piani (in chat non si potrebbe fare niente); con il piano la foto va in chat
        if (credits && credits.plan === 'none' && !credits.unlimited && credits.balance <= 0) { window.dispatchEvent(new Event('agenteimmo:no-credits')); return; }
        window.location.hash = `#/staging?project=${project.id}&photo=${encodeURIComponent(src)}`; return;
      }
      // togliere una foto si fa solo dalla finestra Le foto (che chiede conferma)
      // copertina: sale subito al primo posto e la galleria torna sulla prima (si rimonta sulla copertina nuova)
      if (action === 'cover') setDraft(d => ({ ...d, cover: src, import_data: { ...(project.import_data ?? {}), photos: [src, ...photos.filter(x => x !== src)] } }));
      setBusy(src);
      const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: action, photo: src }) }).catch(() => null);
      setBusy(null);
      if (r?.ok) onChange(); else { dropPhotoDraft(); alert(action === 'cover' ? tr('Non sono riuscito a mettere la copertina, riprova.', 'Could not set the cover photo, please try again.') : tr('Non sono riuscito a togliere la foto, riprova.', 'Could not remove the photo, please try again.')); }
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
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-brand hover:text-brand/70"><ArrowLeft size={16} /> {tr('Immobili', 'Listings')}</a>
      </div>
      {/* avviso: qui e' la scheda della piattaforma, sul sito cambia con il modello scelto */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-2 pl-4 text-sm ${CARD_SHADOW}`}>
        <Info size={16} className="shrink-0 text-brand" />
        {/* tutto quello che riguarda il sito in una riga: stile, online o no, cambio modello */}
        {/* senza un piano col sito (Plus o Pro) non si pubblica: niente interruttore, l'invito a passare al piano */}
        <span className="min-w-0 flex-1 truncate text-muted">{!planKnown ? '' : !sitePlan ? tr('Non è online.', 'Not online yet.') : project.is_public ? tr('Sul tuo sito si vede', 'Live on your website') : tr('Non è sul tuo sito. Online si vedrà', 'Not on your website yet. It will show')}{sitePlan && <> {tr('con lo stile del modello', 'with the template')} {site?.template ? <b className="text-ink">{TEMPLATES.find(t => t.id === site.template)?.name}</b> : tr('scelto', 'you picked')}.</>}</span>
        <a href="#/portfolio" className="flex h-9 items-center rounded-full px-3 font-medium hover:bg-brand/10 text-brand">{tr('Cambia modello', 'Change template')}</a>
        <span className="h-5 w-px bg-line" aria-hidden />
        {!planKnown ? <span className="h-9 w-56 rounded-full bg-canvas" aria-hidden /> : sitePlan
          ? <span className="pr-2"><PublicSwitch on={!!project.is_public} labels={[tr('Pubblico', 'Public'), tr('Non pubblico', 'Not public')]} both onClick={async () => { if (await setPublic(project.id, !project.is_public)) await onChange(); }} /></span>
          : <a href="#/piano?cambia=1" className="flex h-9 items-center rounded-full bg-ink px-4 font-semibold text-white hover:bg-black">{tr('Passa a Plus o Pro per pubblicare', 'Upgrade to Plus or Pro to publish')}</a>}
        {/* Vedi sul sito: si apre in larghezza e dissolvenza quando l'immobile diventa pubblico (prima compariva di scatto) */}
        {sitePlan && site?.slug && (
          <span inert={!project.is_public} className={`grid ease-smooth transition-[grid-template-columns,opacity] duration-[600ms] ${project.is_public ? 'grid-cols-[1fr] opacity-100' : '-ml-3 grid-cols-[0fr] opacity-0'}`}>
            <span className="min-w-0 overflow-hidden">
              <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-canvas px-4 font-medium hover:bg-line/60">{tr('Vedi sul sito', 'View on website')} <ExternalLink size={14} /></a>
            </span>
          </span>
        )}
      </div>
      {/* la pagina dell'immobile com'e' sul sito, col modello scelto; in modifica i campi a sinistra e la pagina si aggiorna */}
      {/* in modifica: barra e sito alti fino al fondo dello schermo, la pagina sta ferma e scorre solo il sito a destra */}
      <div ref={grid} style={editing ? { height: gridH } : undefined} className={`mt-8 grid gap-6 ${editing ? 'scroll-mt-24 lg:grid-cols-[360px_minmax(0,1fr)]' : 'items-start'}`}>
        {editing && <EditProperty project={project} photos={photos} onReorder={reorder} onPhoto={propEdit.onPhoto} onDraft={setDraft} onClose={() => setDraft(null)} onAdded={onChange} onSaved={() => { setDraft(null); onChange(); }}
          report={<button type="button" onClick={() => downloadReport(project.id)} disabled={report === 'busy'} title={report === 'err' ? tr('Report non disponibile, riprova', 'Report not available, please try again') : tr('PDF con foto, dati, zona e costi da mandare ai clienti', 'PDF with photos, details, area and costs to send to clients')} className="mr-auto flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-ink disabled:opacity-50">{report === 'busy' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Report PDF</button>} />}
        {site?.config ? <div className={editing ? 'h-full min-w-0 overflow-y-auto rounded-[28px] overscroll-contain' : 'min-w-0'}><SiteFrame ctx={{ cfg: site.config, name: site.name, logo: site.logo, properties: [toSite({ ...project, ...draft })], base: '', preview: true, propEdit }} id={project.id} /></div> : <div className="aspect-[16/10] animate-pulse rounded-[28px] bg-canvas" />}
      </div>
    </>
  );
}

// Modifica dei dati dell'immobile: gli stessi campi della scheda pubblica. Numeri vuoti = 0 (non indicato).
const FIELDS: { k: keyof ProjectData; label: string; num?: boolean; wide?: boolean; ph?: string }[] = [
  { k: 'titolo', label: tr('Titolo', 'Title'), wide: true, ph: 'Prati, trilocale con box vicino alla metro' },
  { k: 'addr', label: tr('Indirizzo', 'Address'), wide: true, ph: 'Via Cola di Rienzo 120, Roma' },
  { k: 'prezzo', label: tr('Prezzo (€)', 'Price (€)'), num: true }, { k: 'mq', label: tr('Superficie (m²)', 'Floor area (m²)'), num: true },
  { k: 'locali', label: tr('Locali', 'Rooms'), num: true }, { k: 'camere', label: tr('Camere', 'Bedrooms'), num: true },
  { k: 'bagni', label: tr('Bagni', 'Bathrooms'), num: true }, { k: 'tipologia', label: tr('Tipologia', 'Property type'), ph: tr('Appartamento', 'Apartment') },
  { k: 'riferimento', label: tr('Riferimento', 'Reference'), ph: tr('Codice interno', 'Internal code') },
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
    <div ref={box} className="relative min-w-0 overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/10" style={{ height: h ? h * k : undefined }}>
      <div ref={inner} className={ctx.propEdit ? '' : 'pointer-events-none select-none'} style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }} aria-hidden={!ctx.propEdit}>
        <SitePage ctx={ctx} page={{ page: 'immobile', id }} />
      </div>
    </div>
  );
}

// Finestra per riordinare le foto: tutte grandi, si trascinano (maniglia e numero su ognuna), la prima e' la copertina.
// Si salva con Salva ordine; Annulla lascia tutto com'era.
export function PhotoOrder({ photos, onPhoto, onClose, onSave }: { photos: string[]; onPhoto?: PropEdit['onPhoto']; onClose: () => void; onSave: (order: string[]) => void }) {
  const [order, setOrder] = useState(photos);
  // cambio d'ordine animato (FLIP): si fotografano le posizioni prima, dopo il render ogni foto scivola dalla vecchia alla nuova
  const tiles = useRef(new Map<string, HTMLLIElement>());
  const before = useRef(new Map<string, DOMRect>());
  const snap = () => { before.current = new Map([...tiles.current].map(([k, el]) => [k, el.getBoundingClientRect()])); };
  useLayoutEffect(() => {
    tiles.current.forEach((el, k) => {
      const a = before.current.get(k);
      if (!a) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.65,0,.35,1)' });
    });
    before.current = new Map();
  }, [order]);
  const first = (src: string) => { snap(); setOrder(o => [src, ...o.filter(x => x !== src)]); }; // metti per prima (= copertina, salvata con l'ordine)
  const remove = (src: string) => { if (!confirm(tr('Togliere questa foto dall’immobile?', 'Remove this photo from the listing?'))) return; setOrder(o => o.filter(x => x !== src)); onPhoto?.(src, 'remove'); };
  const [drag, setDrag] = useState<string | null>(null);
  const move = (over: string) => { if (!drag || drag === over) return; snap(); setOrder(o => { const n = o.filter(x => x !== drag); n.splice(n.indexOf(over) + (o.indexOf(drag) < o.indexOf(over) ? 1 : 0), 0, drag); return n; }); };
  return createPortal(
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[32px] bg-white shadow-2xl">
        <div className="px-7 pt-7">
          <h2 className="font-display text-2xl font-bold tracking-tight">{tr('Le foto', 'Photos')}</h2>
          <p className="mt-1 text-sm text-muted">{tr('Trascinale per cambiare l’ordine in cui le vedranno i clienti: la prima è la copertina. Passa sopra una foto per migliorarla con l’AI o toglierla.', 'Drag them to change the order clients will see them in: the first one is the cover. Hover over a photo to improve it with AI or remove it.')}</p>
        </div>
        <ul className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 content-start gap-3 overflow-y-auto p-7 sm:grid-cols-3">
          {order.map((src, i) => (
            <li key={src} ref={el => { if (el) tiles.current.set(src, el); else tiles.current.delete(src); }} draggable onDragStart={e => { setDrag(src); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDrag(null)} onDragOver={e => { e.preventDefault(); move(src); }} onDrop={e => e.preventDefault()}
              className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl bg-canvas ease-smooth transition-[opacity,transform,box-shadow] active:cursor-grabbing ${drag === src ? 'scale-95 opacity-40' : 'hover:shadow-lg'} ${i === 0 ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/5'}`}>
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
              <span className={`absolute left-2 top-2 flex h-7 items-center rounded-full px-2.5 text-xs font-semibold shadow ${i === 0 ? 'bg-brand text-white' : 'bg-white text-ink'}`}>{i === 0 ? tr('Copertina', 'Cover') : i + 1}</span>
              {/* maniglia: in hover si sposta accanto alla X (sopra il velo) */}
              <span className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow ease-smooth transition-[right] ${onPhoto ? 'group-hover:right-12' : ''}`} aria-hidden><GripVertical size={16} /></span>
              {onPhoto && (
                // in hover: velo su tutta la foto, azioni al centro una sotto l'altra, togli in alto a destra (sopra la maniglia)
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 ease-smooth transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => { onClose(); onPhoto(src, 'ai'); }} className="flex h-9 min-w-40 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white shadow"><Wand2 size={13} /> {tr('Migliora con l’AI', 'Improve with AI')}</button>
                  {i > 0 && <button type="button" onClick={() => first(src)} className="flex h-9 min-w-40 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow"><Star size={13} /> {tr('Metti per prima', 'Move to first')}</button>}
                  <button type="button" onClick={() => remove(src)} aria-label={tr('Togli la foto', 'Remove photo')} className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow"><X size={14} /></button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 border-t border-line px-7 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-sm font-medium hover:bg-brand/10 text-brand">{tr('Annulla', 'Cancel')}</button>
          <button type="button" onClick={() => onSave(order)} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-black">{tr('Salva ordine', 'Save order')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Barra a sinistra della pagina del sito: i dati dell'immobile per gruppi, la pagina accanto cambia mentre si scrive.
// Le foto si gestiscono sulla pagina (Migliora con l'AI sempre in vista sulle foto).
// [nome italiano (fa anche da chiave), nome inglese, campi]
const GROUPS: [string, string, (keyof ProjectData)[]][] = [['Annuncio', 'Listing', ['titolo', 'addr']], ['Prezzo e spazi', 'Price and size', ['prezzo', 'mq', 'locali', 'camere', 'bagni']], ['Altro', 'Other', ['tipologia', 'riferimento']]];
function EditProperty({ project, photos, onReorder, onPhoto, onClose, onSaved, onAdded, onDraft, report }: { project: ProjectData; photos: string[]; onReorder: (order: string[]) => void; onPhoto: PropEdit['onPhoto']; onClose: () => void; onSaved: () => void; onAdded: () => void; onDraft: (d: Partial<ProjectData>) => void; report: React.ReactNode }) {
  const [sorting, setSorting] = useState(false); // finestra per riordinare le foto
  // aggiungere foto dopo la creazione (anche a un immobile salvato senza foto): su R2, poi in coda all'immobile
  const [adding, setAdding] = useState(false);
  const addPhotos = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter(f => f.type.startsWith('image/')).slice(0, 40);
    if (!list.length) return;
    setAdding(true);
    for (const f of list) {
      const data = await new Promise<string>(res => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(f); });
      const url = await uploadDataUrl(await downscaleDataUrl(data, 1600, 0.82), 'properties');
      if (url) await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: 'add', after: url }) }).catch(() => null);
    }
    setAdding(false);
    onAdded();
  };
  const panel = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const initial = () => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]);
  const reset = () => { setV(initial()); setErr(''); onClose(); }; // Annulla: si torna ai dati salvati
  const dirty = JSON.stringify(v) !== JSON.stringify(initial()); // Salva e Annulla solo se qualcosa e' cambiato
  const n = (x: string) => Math.max(0, Math.round(Number(x.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0));
  const toUp = (o: Record<string, string>) => Object.fromEntries([...FIELDS.map(f => [f.k, f.num ? n(o[f.k]) : o[f.k].trim()]), ['descrizione', o.descrizione.trim()]]);
  const set = (k: string, x: string) => setV(o => { const nv = { ...o, [k]: x }; onDraft(toUp(nv)); return nv; });
  const save = async () => {
    if (busy) return;
    // valori impossibili (prezzo 3 €, 3 m²): si chiede di correggerli prima di salvare
    const low = (k: string, m: number) => { const n = Number(String(v[k] ?? '').replace(/\D/g, '')); return n > 0 && n < m; };
    if (low('prezzo', 50) || low('mq', 10)) { setErr(tr('Prezzo o superficie sembrano troppo bassi: controllali.', 'Price or floor area look too low: please check them.')); return; }
    setBusy(true); setErr('');
    const r = await updateProject(project.id, toUp(v));
    setBusy(false);
    if (r) onSaved(); else setErr(tr('Salvataggio non riuscito, riprova.', 'Save failed, please try again.'));
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
        <h2 className="font-display text-lg font-bold">{tr('Modifica immobile', 'Edit listing')}</h2>
        {err && <span className="ml-auto mr-2 text-sm text-rose-600">{err}</span>}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* foto: una card che apre la finestra per riordinarle (la prima e' la copertina) */}
        {!photos.length && (
          <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-canvas p-5 text-center border border-dashed border-black/15 ${adding ? 'pointer-events-none opacity-60' : 'hover:border-black/30'}`}>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { void addPhotos(e.target.files); e.target.value = ''; }} />
            {adding ? <Loader2 size={20} className="animate-spin text-muted" /> : <ImagePlus size={20} className="text-muted" />}
            <span className="text-sm font-semibold">{tr('Aggiungi le foto', 'Add photos')}</span>
            <span className="text-xs text-muted">{tr('La prima diventa la copertina', 'The first one becomes the cover')}</span>
          </label>
        )}
        {photos.length > 0 && (
          <section className="rounded-2xl bg-canvas p-3">
            <div className="flex items-center gap-3">
              <span className="flex shrink-0 -space-x-7">{/* miniature molto sovrapposte: piu' spazio al testo */}
                {photos.slice(0, 3).map((src, i) => <img key={src} src={src} alt="" className="h-11 w-11 rounded-xl object-cover ring-2 ring-canvas" style={{ zIndex: 3 - i }} />)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{tr('Le foto', 'Photos')}</span>
                <span className="block text-xs text-muted">{photos.length} {tr('foto · ordine, copertina e AI', 'photos · order, cover and AI')}</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setSorting(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white"><GripVertical size={14} /> {tr('Riordina', 'Reorder')}</button>
              <button type="button" onClick={() => setSorting(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white"><Wand2 size={14} /> {tr('Modifica', 'Edit')}</button>
              <label className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white ${adding ? 'pointer-events-none opacity-60' : ''}`}><input type="file" accept="image/*" multiple className="hidden" onChange={e => { void addPhotos(e.target.files); e.target.value = ''; }} />{adding ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {tr('Aggiungi', 'Add')}</label>
            </div>
          </section>
        )}
        {GROUPS.map(([title, titleEn, keys]) => (
          <section key={title}>
            <h3 className="text-sm font-semibold">{tr(title, titleEn)}</h3>
            <div className="mt-2 grid grid-cols-2 gap-3">{keys.map(field)}</div>
            {title === 'Annuncio' && (
              <label className="mt-3 block text-xs font-medium text-muted">{tr('Descrizione', 'Description')}
                <textarea value={v.descrizione} onChange={e => set('descrizione', e.target.value)} rows={7} maxLength={8000} className="mt-1 w-full resize-none rounded-xl bg-canvas px-3 py-2.5 text-sm leading-relaxed outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand" />
              </label>
            )}
          </section>
        ))}
      </div>
      {sorting && <PhotoOrder photos={photos} onPhoto={onPhoto} onClose={() => setSorting(false)} onSave={o => { setSorting(false); onReorder(o); }} />}
      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
        {report}
        <button type="button" onClick={reset} disabled={busy || !dirty} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-brand/10 disabled:opacity-40 disabled:hover:bg-transparent text-brand">{tr('Annulla', 'Cancel')}</button>
        <button type="button" onClick={save} disabled={busy || !dirty} className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:bg-line disabled:text-muted">{busy && <Loader2 size={15} className="animate-spin" />} {tr('Salva', 'Save')}</button>
      </div>
    </div>
  );
}
