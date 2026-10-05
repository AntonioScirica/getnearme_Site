'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Code2, Copy, ChevronLeft, ChevronRight, ExternalLink, Eye, MessageCircle, FileDown, GripVertical, ImagePlus, Images, Info, Loader2, Star, Wand2, X } from 'lucide-react';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';
import { createPortal } from 'react-dom';
import { isClosed, statusOf, STATUS_KEYS, STATUS_LABELS, STATUSES, TEMPLATES, type PropertyStatus, type SiteConfig, type TemplateId } from '@/lib/siteTemplates';
import Dropdown from '@/components/ui/Dropdown';
import { SitePage } from '@/components/site/pages';
import type { PropEdit } from '@/components/site/ui';
import { patchProjectDetails, updateProject, type ProjectData } from '@/lib/projects';
import { authFetch, CARD_SHADOW, formatPrice, portfolioUrl, setPublic } from './api';
import { PublicSwitch, toSite } from './PortfolioView';
import { useCredits } from './PlanView';
import { useViews } from './useViews';
import Casa3DCard from './Casa3DCard';
import { printHtml } from '@/lib/printHtml';
import { tr, trf } from './i18n';
import { Chips, Counter, EnergyScale, NumberField, TextField, Toggle } from './NewPropertyWizard';
import { ESSENTIALS, GROUPS as DETAIL_GROUPS, visible, type Details, type Field } from '@/lib/propertyFields';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void | Promise<unknown> }) {
  // modello del sito e indirizzo: per l'avviso "sul sito si vede con lo stile del modello"
  const [site, setSite] = useState<{ slug: string | null; template: TemplateId; config: SiteConfig; name: string; logo: string | null; published: boolean } | null>(null);
  const editing = true; // la barra di modifica c'e' sempre, a sinistra della pagina del sito
  const [draft, setDraft] = useState<Partial<ProjectData> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // foto mostrate prima della risposta del server: si tolgono quando arrivano i dati ricaricati (niente ritorno all'ordine vecchio)
  const dropPhotoDraft = () => setDraft(d => { if (!d) return d; const { cover: _c, import_data: _i, ...rest } = d; return rest; });
  const photoKey = project ? `${project.cover}|${JSON.stringify((project.import_data as { photos?: unknown } | undefined)?.photos ?? null)}` : '';
  const [seenPhotos, setSeenPhotos] = useState(photoKey);
  if (photoKey !== seenPhotos) { setSeenPhotos(photoKey); dropPhotoDraft(); }
  const credits = useCredits();
  // video fatti da questo immobile (dalla Galleria): nell'anteprima della pagina come sul sito pubblicato
  const [videos, setVideos] = useState<string[]>([]);
  const pid = project?.id;
  useEffect(() => {
    if (!pid) return;
    authFetch('/api/platform/media').then(r => r.json()).then((d: { items?: { video?: string; casa?: string | null }[] }) =>
      setVideos((d.items ?? []).filter(x => x.video && x.casa === pid).map(x => x.video!))).catch(() => {});
  }, [pid]);
  const grid = useRef<HTMLDivElement>(null);
  const [addingSlot, setAddingSlot] = useState(false); // foto dai riquadri vuoti della scheda
  // in modifica (da lg): barra e sito alti quanto lo schermo e fermi, si scorre solo dentro ciascuno.
  // Si porta la griglia in cima (prima l'altezza inseguiva lo scorrimento della pagina e tutto si spostava)
  useEffect(() => {
    if (!editing || window.innerWidth < 1024) return;
    const t = setTimeout(() => grid.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
    return () => clearTimeout(t);
  }, [editing, project?.id]); // anche quando l'immobile arriva (prima la griglia non c'era ancora)
  const planKnown = !!credits; // finche' non si sa il piano, niente interruttore ne' invito (niente salto)
  const sitePlan = !!credits && (credits.unlimited || credits.plan === 'plus' || credits.plan === 'pro'); // come in Il mio sito
  // visite alla scheda sul sito (solo qui, non nel report PDF)
  const views = useViews(sitePlan && project ? [project.id] : [])?.[project?.id ?? ''];
  // report PDF da mandare ai clienti: lo compone il server (api/platform/report), si stampa da un iframe nascosto
  const [report, setReport] = useState<'idle' | 'busy' | 'err'>('idle');
  // Manda al cliente senza sito: link pubblico della scheda su WhatsApp (prima: stampa, salva PDF e allega)
  const [sending, setSending] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false); // codice per mettere la scheda in un altro sito
  const sendSheet = async () => {
    setSending(true);
    const w = window.open('', '_blank'); // aperta subito (dopo l'attesa il browser la bloccherebbe come popup)
    const d = await authFetch(`/api/platform/report?id=${encodeURIComponent(project!.id)}&link=1`).then(r => r.json()).catch(() => null) as { url?: string } | null;
    setSending(false);
    if (!d?.url) { w?.close(); alert(tr('Non sono riuscito a preparare la scheda, riprova.', 'Could not prepare the sheet, please try again.')); return; }
    const text = `${tr('Buongiorno, ecco la scheda della casa di cui parlavamo', 'Hello, here is the sheet of the home we talked about')}: ${(project!.titolo || project!.nome || '').replace(/\s+/g, ' ').replace(/[\s.]+$/, '')}\n${d.url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (w) w.location.href = wa; else window.location.href = wa;
  };
  const downloadReport = async (id: string) => {
    setReport('busy');
    const html = await authFetch(`/api/platform/report?id=${encodeURIComponent(id)}`).then(r => (r.ok ? r.text() : '')).catch(() => '');
    if (html) { await printHtml(html); setReport('idle'); } else setReport('err');
  };
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSite({ slug: d.slug ?? null, template: d.config?.template, config: d.config, name: d.name || 'La tua agenzia', logo: d.logo ?? null, published: !!d.published })).catch(() => {}); }, []);
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
    adding: addingSlot, onAdd: async files => { setAddingSlot(true); await uploadPhotos(project.id, files); setAddingSlot(false); await onChange(); },
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
  // stato salvato dalla barra in alto: la bozza della barra a sinistra (se c'e') prende lo stato nuovo, poi si ricarica
  const statusSaved = async (patch: Details) => {
    setDraft(d => { const id = d?.import_data as { details?: Details } | undefined; return d && id ? { ...d, import_data: { ...id, details: { ...id.details, ...patch } } } : d; });
    await onChange();
  };
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-brand hover:text-brand/70"><ArrowLeft size={16} /> {tr('Immobili', 'Listings')}</a>
      </div>
      {/* barra dell'immobile: a sinistra se e' online (interruttore, modello, visite), a destra stato e azioni */}
      {(() => {
        const online = !!(sitePlan && site?.slug && site.published && project.is_public);
        const tpl = sitePlan && site?.template ? TEMPLATES.find(t => t.id === site.template)?.name : null;
        const waText = site?.slug ? `${tr('Buongiorno, ecco la casa di cui parlavamo', 'Hello, here is the home we talked about')}: ${(project.titolo || project.nome || '').replace(/\s+/g, ' ').replace(/[\s.]+$/, '')}${project.prezzo ? `, ${formatPrice(project.prezzo)}` : ''}\n${portfolioUrl(site.slug)}/${project.id}` : '';
        const btn = 'flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm max-sm:h-11 max-sm:flex-1';
        return (
          <div className={`mb-6 flex flex-col gap-4 rounded-[28px] bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between ${CARD_SHADOW}`}>
            <div className="flex min-w-0 items-center gap-4">
              {!planKnown ? <span className="h-10 w-64 rounded-full bg-canvas" aria-hidden /> : <>
                {sitePlan
                  ? <PublicSwitch on={!!project.is_public} labels={['', '']} onClick={async () => { if (await setPublic(project.id, !project.is_public)) await onChange(); }} />
                  : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-muted"><Info size={18} /></span>}
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-ink">{!sitePlan ? tr('Non è online', 'Not online') : project.is_public ? tr('Online sul tuo sito', 'Live on your website') : tr('Non visibile sul tuo sito', 'Hidden from your website')}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-muted">
                    {!sitePlan
                      ? <a href="#/piano?cambia=1" className="font-medium text-brand hover:underline">{tr('Passa a Plus o Pro per pubblicarlo', 'Upgrade to Plus or Pro to publish it')}</a>
                      : <>
                        {tpl && <span>{tr('Modello', 'Template')} <a href="#/portfolio" title={tr('Cambia modello', 'Change template')} className="font-medium text-brand hover:underline">{tpl}</a></span>}
                        {views && (project.is_public || views.total > 0) && <span className="blur-in inline-flex items-center gap-1 whitespace-nowrap">{tpl && <span aria-hidden>·</span>}<Eye size={14} className="shrink-0" /><b className="font-semibold text-ink">{views.d30}</b> {views.d30 === 1 ? tr('visita in 30 giorni', 'view in 30 days') : tr('visite in 30 giorni', 'views in 30 days')}, {views.total} {tr('in totale', 'in total')}</span>}
                      </>}
                  </p>
                </div>
              </>}
            </div>
            <div className="flex flex-wrap items-center gap-2 max-sm:border-t max-sm:border-line max-sm:pt-4">
              <StatusPicker project={project} onSaved={statusSaved} />
              <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
              {/* online: al cliente il link pubblico della casa; altrimenti la scheda in PDF */}
              {online && site?.slug
                ? <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className={`${btn} bg-[#25d366] font-semibold text-white hover:brightness-95`}><MessageCircle size={15} /> {tr('Manda al cliente', 'Send to client')}</a>
                : <button type="button" onClick={() => void sendSheet()} disabled={sending || !planKnown} title={tr('Manda al cliente la scheda della casa su WhatsApp', 'Send the client the property sheet on WhatsApp')} className={`${btn} bg-[#25d366] font-semibold text-white hover:brightness-95 disabled:opacity-60`}>{sending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />} {tr('Manda al cliente', 'Send to client')}</button>}
              {online && site?.slug && <>
                <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className={`blur-in ${btn} bg-canvas font-medium hover:bg-line/60`}>{tr('Vedi sul sito', 'View on website')} <ExternalLink size={14} /></a>
                <button type="button" onClick={() => setEmbedOpen(true)} title={tr('Incorpora in un altro sito', 'Embed in another website')} className={`blur-in ${btn} bg-canvas font-medium hover:bg-line/60 max-sm:hidden`}><Code2 size={15} /> {tr('Incorpora', 'Embed')}</button>
              </>}
            </div>
          </div>
        );
      })()}
      {embedOpen && site?.slug && <EmbedCode url={`${portfolioUrl(site.slug)}/${project.id}`} id={project.id} title={project.titolo || project.nome || ''} casa={!!((project.import_data as { details?: { casa3d?: unknown } } | undefined)?.details?.casa3d)} onClose={() => setEmbedOpen(false)} />}
      {/* la pagina dell'immobile com'e' sul sito, col modello scelto; in modifica i campi a sinistra e la pagina si aggiorna */}
      {/* in modifica: barra e sito alti fino al fondo dello schermo, la pagina sta ferma e scorre solo il sito a destra */}
      <div ref={grid} className={`mt-8 grid gap-6 ${editing ? 'scroll-mt-6 lg:sticky lg:top-6 lg:h-[calc(100svh-8rem)] lg:grid-cols-[360px_minmax(0,1fr)]' : 'items-start'}`}>
        {editing && <EditProperty project={project} photos={photos} onReorder={reorder} onPhoto={propEdit.onPhoto} onDraft={setDraft} onClose={() => setDraft(null)} onAdded={onChange} onSaved={() => { setDraft(null); onChange(); }}
          report={<button type="button" onClick={() => downloadReport(project.id)} disabled={report === 'busy'} title={report === 'err' ? tr('Report non disponibile, riprova', 'Report not available, please try again') : tr('PDF con foto, dati, zona e costi da mandare ai clienti', 'PDF with photos, details, area and costs to send to clients')} className="mr-auto flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-ink disabled:opacity-50">{report === 'busy' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Report PDF</button>} />}
        {site?.config ? <div className={editing ? 'h-full min-w-0 overflow-y-auto rounded-[28px] border border-black/10 overscroll-contain [&>div]:shadow-none [&>div]:ring-0' : 'min-w-0'}>{/* in modifica il bordo grigio sta sul riquadro che scorre (l'anello del sito verrebbe tagliato) */}<SiteFrame ctx={{ cfg: site.config, name: site.name, logo: site.logo, properties: [{ ...toSite({ ...project, ...draft }), videos }], base: '', preview: true, propEdit }} id={project.id} /></div> : <div className="aspect-[16/10] animate-pulse rounded-[28px] bg-canvas" />}
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
// Stato dell'immobile (disponibile, in trattativa, riservato, venduto, affittato): si salva subito nei dettagli,
// come Pubblico. Venduti e affittati restano sul sito ma fuori dagli elenchi; il prezzo si mostra solo se acceso.
const STATUS_DOT: Record<PropertyStatus, string> = { disponibile: 'bg-emerald-500', trattativa: 'bg-amber-500', riservato: 'bg-brand', venduto: 'bg-ink', affittato: 'bg-ink' };
const statusLabel = (s: PropertyStatus) => tr(...STATUS_LABELS[s]);
function StatusPicker({ project, onSaved }: { project: ProjectData; onSaved: (patch: Details) => void | Promise<unknown> }) {
  const det = ((project.import_data ?? {}) as { details?: Details }).details ?? {};
  const [pending, setPending] = useState<PropertyStatus | null>(null);
  const cur = pending ?? statusOf({ details: det });
  const save = async (patch: Details) => {
    if (!(await patchProjectDetails(project, patch))) { alert(tr('Non sono riuscito a salvare lo stato, riprova.', 'Could not save the status, please try again.')); return; }
    await onSaved(patch);
  };
  const pick = async (s: PropertyStatus) => {
    if (s === cur || pending) return;
    setPending(s);
    await save({ stato_annuncio: s, stato_annuncio_data: new Date().toISOString() });
    setPending(null);
  };
  return (
    <span className="flex items-center gap-3">
      <Dropdown value={cur} options={STATUSES.map(s => ({ value: s, label: statusLabel(s) }))} onChange={s => void pick(s)} className="h-9 gap-1.5 bg-canvas pl-3.5 pr-3 font-medium hover:bg-line/60 hover:!text-ink">
        {pending ? <Loader2 size={12} className="animate-spin text-muted" /> : <span className={`h-2 w-2 rounded-full ${STATUS_DOT[cur]}`} aria-hidden />}
        <span className="whitespace-nowrap">{statusLabel(cur)}</span>
      </Dropdown>
      {/* venduti e affittati: il prezzo e' nascosto sul sito, a meno che l'agente non voglia mostrarlo */}
      {isClosed(cur) && <PublicSwitch on={!!det.mostra_prezzo_venduto} labels={[tr('Prezzo visibile', 'Price shown'), tr('Prezzo nascosto', 'Price hidden')]} onClick={() => save({ mostra_prezzo_venduto: !det.mostra_prezzo_venduto })} />}
    </span>
  );
}

// Pagina del sito in scala, larga 1280 px come su un computer; non cliccabile (si guarda e si scorre con la pagina).
// Su telefono invece a grandezza vera, larga quanto il riquadro: si vede la versione mobile del sito, leggibile
function SiteFrame({ ctx, id }: { ctx: Parameters<typeof SitePage>[0]['ctx']; id: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  const [w, setW] = useState(1280);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (box.current) { const cw = box.current.clientWidth, W = window.innerWidth < 768 ? cw : 1280; setW(W); setK(cw / W); }
      if (inner.current) setH(inner.current.offsetHeight);
    });
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="relative min-w-0 overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/10" style={{ height: h ? h * k : undefined }}>
      <div ref={inner} className={ctx.propEdit ? '' : 'pointer-events-none select-none'} style={{ width: w, transform: `scale(${k})`, transformOrigin: 'top left' }} aria-hidden={!ctx.propEdit}>
        <SitePage ctx={ctx} page={{ page: 'immobile', id }} />
      </div>
    </div>
  );
}

// Finestra per riordinare le foto: tutte grandi, si trascinano (maniglia e numero su ognuna), la prima e' la copertina.
// Si salva con Salva ordine; Annulla lascia tutto com'era.
// Foto della Galleria (arredate, svuotate...) da mettere nell'immobile: un tocco per sceglierle, poi Aggiungi
function GalleryPick({ onPick, onClose }: { onPick: (urls: string[]) => void; onClose: () => void }) {
  const [items, setItems] = useState<string[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => {
    authFetch('/api/platform/media').then(r => r.json()).then((d: { items?: { dopo?: string; video?: string }[] }) =>
      setItems((d.items ?? []).filter(x => x.dopo && !x.video).map(x => x.dopo!))).catch(() => setItems([]));
  }, []);
  return createPortal(
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div><h2 className="font-display text-2xl font-bold tracking-tight">{tr('Dalla Galleria', 'From Gallery')}</h2><p className="mt-1 text-sm text-muted">{tr('Tocca le foto da mettere nell’immobile.', 'Tap the photos to add to the property.')}</p></div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {items === null ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted" /></div>
            : !items.length ? <p className="py-10 text-center text-sm text-muted">{tr('La Galleria è vuota: le foto che arredi in chat finiscono qui.', 'The Gallery is empty: photos you furnish in chat end up here.')}</p>
            : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map(u => {
              const on = sel.includes(u);
              return <button key={u} type="button" onClick={() => setSel(s => (on ? s.filter(x => x !== u) : [...s, u]))} className={`relative aspect-[4/3] overflow-hidden rounded-2xl ring-offset-2 ${on ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/5'}`}>
                <img src={u} alt="" className="h-full w-full object-cover" />
                {on && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white"><Check size={15} /></span>}
              </button>;
            })}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-full px-4 text-sm font-medium text-brand hover:bg-brand/10">{tr('Annulla', 'Cancel')}</button>
          <button type="button" disabled={!sel.length} onClick={() => onPick(sel)} className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40">{sel.length ? tr(`Aggiungi ${sel.length}`, `Add ${sel.length}`) : tr('Aggiungi', 'Add')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

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
  // togliere: come l'ordine, vale solo con Salva (Annulla la rimette); prima la X cancellava subito
  const remove = (src: string) => { snap(); setOrder(o => o.filter(x => x !== src)); };
  // telefono (niente trascinamento): frecce per spostare la foto prima o dopo
  const shift = (src: string, d: number) => { snap(); setOrder(o => { const i = o.indexOf(src), j = i + d; if (j < 0 || j >= o.length) return o; const n = [...o]; [n[i], n[j]] = [n[j], n[i]]; return n; }); };
  const [drag, setDrag] = useState<string | null>(null);
  // trascinando: dopo uno spostamento le foto scivolano (600 ms) e passano sotto il puntatore, che rimandava indietro
  // la foto (avanti e indietro all'infinito). Si ignora il passaggio sulle foto in movimento e sulla stessa due volte.
  const lock = useRef(0), lastOver = useRef<string | null>(null);
  const move = (over: string) => {
    if (!drag) return;
    if (drag === over) { lastOver.current = null; return; } // di nuovo sulla foto trascinata: si puo' tornare indietro
    if (over === lastOver.current || performance.now() < lock.current) return; // eslint-disable-line react-hooks/purity
    lastOver.current = over; lock.current = performance.now() + 350; // eslint-disable-line react-hooks/purity
    snap(); setOrder(o => { const n = o.filter(x => x !== drag); n.splice(n.indexOf(over) + (o.indexOf(drag) < o.indexOf(over) ? 1 : 0), 0, drag); return n; });
  };
  return createPortal(
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[32px] bg-white shadow-2xl">
        <div className="px-7 pt-7">
          <h2 className="font-display text-2xl font-bold tracking-tight">{tr('Le foto', 'Photos')}</h2>
          {/* touch (niente hover, niente trascinamento): le azioni stanno sempre sulle foto, il testo lo dice */}
          <p className="mt-1 text-sm text-muted [@media(hover:none)]:hidden">{tr('Trascinale per cambiare l’ordine in cui le vedranno i clienti: la prima è la copertina. Passa sopra una foto per migliorarla con l’AI o toglierla.', 'Drag them to change the order clients will see them in: the first one is the cover. Hover over a photo to improve it with AI or remove it.')}</p>
          <p className="mt-1 hidden text-sm text-muted [@media(hover:none)]:block">{tr('La prima è la copertina. Su ogni foto: la bacchetta la migliora con l’AI, la stella la mette in copertina, le frecce la spostano, la X la toglie. Poi Salva.', 'The first one is the cover. On each photo: the wand improves it with AI, the star moves it first, the X removes it.')}</p>
        </div>
        <ul className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 content-start gap-3 overflow-y-auto p-7 sm:grid-cols-3">
          {order.map((src, i) => (
            <li key={src} ref={el => { if (el) tiles.current.set(src, el); else tiles.current.delete(src); }} draggable onDragStart={e => { setDrag(src); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); lastOver.current = null; }} onDragOver={e => { e.preventDefault(); move(src); }} onDrop={e => e.preventDefault()}
              className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl bg-canvas ease-smooth transition-[opacity,transform,box-shadow] active:cursor-grabbing ${drag === src ? 'scale-95 opacity-40' : 'hover:shadow-lg'} ${i === 0 ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/5'}`}>
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
              <span className={`absolute left-2 top-2 flex h-7 items-center rounded-full px-2.5 text-xs font-semibold shadow ${i === 0 ? 'bg-brand text-white' : 'bg-white text-ink'}`}>{i === 0 ? tr('Copertina', 'Cover') : i + 1}</span>
              {/* maniglia: in hover si sposta accanto alla X (sopra il velo) */}
              <span className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow ease-smooth transition-[right] [@media(hover:none)]:hidden ${onPhoto ? 'group-hover:right-12' : ''}`} aria-hidden><GripVertical size={16} /></span>
              {onPhoto && (
                // in hover: velo su tutta la foto, azioni al centro una sotto l'altra, togli in alto a destra (sopra la maniglia)
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 ease-smooth transition-opacity group-hover:opacity-100 [@media(hover:none)]:flex-row [@media(hover:none)]:items-end [@media(hover:none)]:justify-start [@media(hover:none)]:gap-1 [@media(hover:none)]:bg-transparent [@media(hover:none)]:p-2 [@media(hover:none)]:opacity-100">
                  <button type="button" onClick={() => { onClose(); onPhoto(src, 'ai'); }} aria-label={tr('Migliora con l’AI', 'Improve with AI')} className="flex h-9 min-w-40 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white shadow [@media(hover:none)]:h-10 [@media(hover:none)]:w-10 [@media(hover:none)]:min-w-0 [@media(hover:none)]:px-0"><Wand2 size={13} /> <span className="[@media(hover:none)]:hidden">{tr('Migliora con l’AI', 'Improve with AI')}</span></button>
                  {i > 0 && <button type="button" onClick={() => first(src)} aria-label={tr('Metti in copertina', 'Make it the cover')} className="flex h-9 min-w-40 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow [@media(hover:none)]:h-10 [@media(hover:none)]:w-10 [@media(hover:none)]:min-w-0 [@media(hover:none)]:px-0"><Star size={13} /> <span className="[@media(hover:none)]:hidden">{tr('Metti in copertina', 'Make it the cover')}</span></button>}
                  <button type="button" onClick={() => remove(src)} aria-label={tr('Togli la foto', 'Remove photo')} className="absolute right-2 top-2 z-10 flex h-8 w-8 [@media(hover:none)]:h-10 [@media(hover:none)]:w-10 items-center justify-center rounded-full bg-white text-rose-600 shadow"><X size={14} /></button>
                  {/* telefono: frecce per spostare (il trascinamento col dito non c'e') */}
                  <span className="absolute bottom-2 right-2 z-10 hidden gap-1 [@media(hover:none)]:flex">
                    {i > 0 && <button type="button" onClick={() => shift(src, -1)} aria-label={tr('Sposta prima', 'Move earlier')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow"><ChevronLeft size={18} /></button>}
                    {i < order.length - 1 && <button type="button" onClick={() => shift(src, 1)} aria-label={tr('Sposta dopo', 'Move later')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow"><ChevronRight size={18} /></button>}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 border-t border-line px-7 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-sm font-medium hover:bg-brand/10 text-brand">{tr('Annulla', 'Cancel')}</button>
          <button type="button" onClick={() => onSave(order)} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-black">{order.length < photos.length ? tr('Salva', 'Save') : tr('Salva ordine', 'Save order')}</button>
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
// Tutti gli altri dati del form di creazione (import_data.details): prima in Modifica non c'erano (classe energetica,
// spese, piano, stato...). Quelli gia' sopra (prezzo, superficie, locali...) restano nei campi base e si copiano qui al salvataggio.
const BASE_KEYS = new Set(['tipologia', 'indirizzo', 'prezzo', 'superficie', 'locali', 'camere', 'bagni', 'riferimento']);
const DETAIL_SECTIONS: { title: string; fields: Field[] }[] = [
  { title: 'Contratto e piano', fields: ESSENTIALS.filter(f => !BASE_KEYS.has(f.key)) },
  ...DETAIL_GROUPS.map(g => ({ title: g.title, fields: g.fields.filter(f => !BASE_KEYS.has(f.key)) })),
];
function DetailField({ f, v, set }: { f: Field; v: Details[string]; set: (x: Details[string]) => void }) {
  if (f.key === 'classe_energetica') return <EnergyScale v={v} set={set} />;
  if (f.type === 'toggle') return <Toggle f={f} v={v} set={set} />;
  if (f.type === 'stepper') return <Counter f={f} v={v} set={set} inline />;
  if (f.type === 'number') return <NumberField f={f} v={v} set={set} raw={f.key === 'anno'} />;
  if (f.type === 'text') return <TextField f={f} v={v} set={set} />;
  return <Chips f={f} v={v} set={set} multi={f.type === 'multi'} />;
}
// foto dal computer in coda all'immobile (su R2, ridotte a 1600 px): da Modifica e dai riquadri vuoti della scheda
async function uploadPhotos(projectId: string, files: FileList) {
  for (const f of [...files].filter(f => f.type.startsWith('image/')).slice(0, 40)) {
    const data = await new Promise<string>(res => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(f); });
    const url = await uploadDataUrl(await downscaleDataUrl(data, 1600, 0.82), 'properties');
    if (url) await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId, mode: 'add', after: url }) }).catch(() => null);
  }
}

function EditProperty({ project, photos, onReorder, onPhoto, onClose, onSaved, onAdded, onDraft, report }: { project: ProjectData; photos: string[]; onReorder: (order: string[]) => void; onPhoto: PropEdit['onPhoto']; onClose: () => void; onSaved: () => void; onAdded: () => void; onDraft: (d: Partial<ProjectData>) => void; report: React.ReactNode }) {
  const [sorting, setSorting] = useState(false); // finestra per riordinare le foto
  const [shut, setShut] = useState(false); // sotto lg: pannello chiuso con la freccia
  // aggiungere foto dopo la creazione (anche a un immobile salvato senza foto): su R2, poi in coda all'immobile
  const [adding, setAdding] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [picking, setPicking] = useState(false); // scelta di foto gia' fatte (Galleria) da aggiungere all'immobile
  const addUrls = async (all: string[]) => {
    setPicking(false);
    // gia' nell'immobile: si dice (prima non cambiava niente e nessuno lo spiegava)
    const urls = all.filter(u => !photos.includes(u));
    if (urls.length < all.length) alert(urls.length ? tr('Alcune foto erano già nell’immobile: aggiungo le altre.', 'Some photos were already in the property: adding the others.') : tr('Queste foto sono già nell’immobile.', 'These photos are already in the property.'));
    if (!urls.length) return;
    setAdding(true);
    for (const url of urls) await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode: 'add', after: url }) }).catch(() => null);
    setAdding(false); onAdded();
  };
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setAdding(true);
    await uploadPhotos(project.id, files);
    setAdding(false);
    onAdded();
  };
  const panel = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]));
  // dettagli del form di creazione: bozza a parte (chiave :det), salvati in import_data.details
  // lo stato (venduto, trattativa...) si cambia dalla barra in alto: fuori dalla bozza, al salvataggio si prende quello attuale
  const savedDet = () => Object.fromEntries(Object.entries(((project.import_data ?? {}) as { details?: Details }).details ?? {}).filter(([k]) => !STATUS_KEYS.includes(k))) as Details;
  const [det, setDetState] = useState<Details>(savedDet);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const initial = () => Object.fromEntries([...FIELDS.map(f => [f.k, String(project[f.k] ?? '')]), ['descrizione', project.descrizione ?? '']]);
  // Bozza: le modifiche non salvate restano sul dispositivo (uscendo e tornando si ritrovano), finche' Salva o Scarta
  const dKey = `agenteimmo:prop-draft:${project.id}`;
  const reset = () => { localStorage.removeItem(dKey); localStorage.removeItem(`${dKey}:det`); setV(initial()); setDetState(savedDet()); setErr(''); onClose(); }; // Scarta: si torna ai dati salvati
  const dirty = JSON.stringify(v) !== JSON.stringify(initial()) || JSON.stringify(det) !== JSON.stringify(savedDet()); // Salva e Annulla solo se qualcosa e' cambiato
  const n = (x: string) => Math.max(0, Math.round(Number(x.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')) || 0));
  const toUp = (o: Record<string, string>, dd: Details = det) => {
    const up = Object.fromEntries([...FIELDS.map(f => [f.k, f.num ? n(o[f.k]) : o[f.k].trim()]), ['descrizione', o.descrizione.trim()]]) as Record<string, string | number>;
    // i campi base copiati anche nei dettagli (report, portali e sito leggono anche da li')
    const cur = ((project.import_data ?? {}) as { details?: Details }).details ?? {};
    const details: Details = { ...dd, ...Object.fromEntries(STATUS_KEYS.filter(k => cur[k] !== undefined).map(k => [k, cur[k]])), prezzo: up.prezzo || undefined, superficie: up.mq || undefined, locali: up.locali || undefined, camere: up.camere || undefined, bagni: up.bagni || undefined, indirizzo: String(up.addr) || undefined, tipologia: String(up.tipologia) || undefined, riferimento: String(up.riferimento) || undefined };
    return { ...up, import_data: { ...(project.import_data ?? {}), details } };
  };
  // la bozza al genitore fuori dall'updater (dentro avvisava React: aggiornamento di un altro componente durante il render)
  const set = (k: string, x: string) => { const nv = { ...v, [k]: x }; setV(nv); setErr(''); onDraft(toUp(nv)); try { localStorage.setItem(dKey, JSON.stringify(nv)); } catch { /* niente storage */ } };
  const setDet = (k: string, x: Details[string]) => { const nd = { ...det, [k]: x }; if (x === undefined) delete nd[k]; setDetState(nd); setErr(''); onDraft(toUp(v, nd)); try { localStorage.setItem(`${dKey}:det`, JSON.stringify(nd)); localStorage.setItem(dKey, JSON.stringify(v)); } catch { /* niente storage */ } };
  // all'apertura: c'era una bozza di questo immobile? si riprende (anche nell'anteprima a destra)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(dKey);
      const d = raw ? JSON.parse(raw) as Record<string, string> : null;
      const rawDet = localStorage.getItem(`${dKey}:det`);
      const dd = rawDet ? JSON.parse(rawDet) as Details : null;
      if (dd && JSON.stringify(dd) !== JSON.stringify(savedDet())) setDetState(dd); // eslint-disable-line react-hooks/set-state-in-effect
      else if (rawDet) localStorage.removeItem(`${dKey}:det`);
      if (d && (JSON.stringify(d) !== JSON.stringify(initial()) || dd)) { setV(d); onDraft(toUp(d, dd ?? savedDet())); } else if (raw) localStorage.removeItem(dKey);
    } catch { /* bozza rovinata */ }
  }, [dKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // valori impossibili (prezzo 3 €, 3 m²): il campo diventa rosso e si chiede di correggerlo prima di salvare
  const bad = (k: string) => { const m = k === 'prezzo' ? 50 : k === 'mq' ? 10 : 0; const n = Number(String(v[k] ?? '').replace(/\D/g, '')); return n > 0 && n < m; };
  const save = async () => {
    if (busy) return;
    if (bad('prezzo') || bad('mq')) { setErr(tr('Prezzo o superficie sembrano troppo bassi: controllali.', 'Price or floor area look too low: please check them.')); return; }
    setBusy(true); setErr('');
    const r = await updateProject(project.id, toUp(v));
    setBusy(false);
    if (r) { localStorage.removeItem(dKey); localStorage.removeItem(`${dKey}:det`); onSaved(); } else setErr(tr('Salvataggio non riuscito, riprova.', 'Save failed, please try again.'));
  };
  const input = 'mt-1 h-10 w-full rounded-xl bg-canvas px-3 text-sm outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand';
  const field = (k: keyof ProjectData) => {
    const f = FIELDS.find(x => x.k === k)!;
    return (
      <label key={k} className={`block text-xs font-medium text-muted ${f.wide ? 'col-span-2' : ''}`}>{f.label}
        <input value={v[k]} onChange={e => set(k, e.target.value)} inputMode={f.num ? 'numeric' : undefined} placeholder={f.ph} maxLength={k === 'titolo' ? 120 : 200} className={`${input} ${bad(k) ? '!ring-2 !ring-rose-400' : ''}`} />
        {bad(k) && <span className="mt-1 block text-rose-600">{tr('Sembra troppo basso', 'Looks too low')}</span>}
      </label>
    );
  };
  return (
    <div ref={panel} className="blur-in flex min-h-0 flex-col rounded-[28px] bg-white shadow-sm ring-1 ring-black/5 lg:h-full lg:overflow-hidden">
      {/* telefono: la freccia chiude e riapre il pannello (resta la pagina del sito sotto) */}
      <button type="button" onClick={() => setShut(o => !o)} aria-expanded={!shut} className={`flex items-center justify-between px-5 py-4 text-left lg:pointer-events-none ${shut ? '' : 'border-b border-line'}`}>
        <h2 className="font-display text-lg font-bold">{tr('Modifica immobile', 'Edit listing')}</h2>
        <ChevronDown size={20} className={`text-muted ease-smooth transition-transform lg:hidden ${shut ? '' : 'rotate-180'}`} />
      </button>
      <div className={`flex-1 space-y-6 px-5 py-5 lg:overflow-y-auto lg:overscroll-contain ${shut ? 'max-lg:hidden' : ''}`}>
        {/* foto: una card che apre la finestra per riordinarle (la prima e' la copertina) */}
        {!photos.length && (
          <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-canvas p-5 text-center border border-dashed border-black/15 ${adding ? 'pointer-events-none opacity-60' : 'hover:border-black/30'}`}>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { void addPhotos(e.target.files); e.target.value = ''; }} />
            {adding ? <Loader2 size={20} className="animate-spin text-muted" /> : <ImagePlus size={20} className="text-muted" />}
            <span className="text-sm font-semibold">{tr('Aggiungi le foto', 'Add photos')}</span>
            <span className="text-xs text-muted">{tr('La prima diventa la copertina', 'The first one becomes the cover')}</span>
          </label>
        )}
        {!photos.length && (
          <button type="button" onClick={() => setPicking(true)} className="-mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-brand"><Images size={14} /> {tr('Oppure prendile dalla Galleria', 'Or pick them from the Gallery')}</button>
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSorting(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white"><Wand2 size={14} /> {tr('Modifica AI', 'AI edit')}</button>
              {/* Aggiungi: dal computer o dalla Galleria, in un solo pulsante */}
              <span className="relative">
                <button type="button" onClick={() => setAddMenu(o => !o)} disabled={adding} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white disabled:opacity-60">{adding ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {tr('Aggiungi', 'Add')}</button>
                {addMenu && (
                  <span className="blur-in absolute right-0 top-12 z-30 flex w-52 flex-col rounded-2xl bg-white p-1.5 text-sm shadow-lg ring-1 ring-black/5">
                    <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 font-medium hover:bg-canvas"><input type="file" accept="image/*" multiple className="hidden" onChange={e => { setAddMenu(false); void addPhotos(e.target.files); e.target.value = ''; }} /><ImagePlus size={15} /> {tr('Dal computer o telefono', 'From your device')}</label>
                    <button type="button" onClick={() => { setAddMenu(false); setPicking(true); }} className="flex h-10 items-center gap-2 rounded-xl px-3 text-left font-medium hover:bg-canvas"><Images size={15} /> {tr('Dalla Galleria', 'From Gallery')}</button>
                  </span>
                )}
              </span>
            </div>
          </section>
        )}
        {/* casa 3D dalle planimetrie dell'immobile (sul sito: Vedi in 3D) */}
        <Casa3DCard project={project} photos={photos} onChanged={onAdded} />
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
        {/* come nel form: alimentazione e terminali solo dopo aver scelto il riscaldamento */}
        {DETAIL_SECTIONS.map(sec => { const fs = sec.fields.filter(f => visible(f, det) && ((f.key !== 'alimentazione' && f.key !== 'emissione') || !!det.riscaldamento)); return fs.length ? (
          <section key={sec.title} className="space-y-5">
            <h3 className="text-sm font-semibold">{trf(sec.title)}</h3>
            {fs.map(f => <DetailField key={f.key} f={f} v={det[f.key]} set={x => setDet(f.key, x)} />)}
          </section>
        ) : null; })}
      </div>
      {picking && <GalleryPick onClose={() => setPicking(false)} onPick={addUrls} />}
      {sorting && <PhotoOrder photos={photos} onPhoto={onPhoto} onClose={() => setSorting(false)} onSave={async o => {
        setSorting(false);
        const gone = photos.filter(x => !o.includes(x));
        if (gone.length && !confirm(gone.length === 1 ? tr('Togliere 1 foto dall’immobile?', 'Remove 1 photo from the listing?') : tr(`Togliere ${gone.length} foto dall’immobile?`, `Remove ${gone.length} photos from the listing?`))) return;
        for (const x of gone) await onPhoto(x, 'remove');
        onReorder(o);
      }} />}
      {/* sotto lg il pannello scorre con la pagina: Annulla e Salva restano attaccati in fondo */}
      <div className={`sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-1 rounded-b-[28px] border-t border-line bg-white px-3 py-3 sm:gap-2 sm:px-5 lg:static ${shut ? 'max-lg:hidden' : ''}`}>
        {/* errore accanto a Salva, dove si guarda (in alto finiva fuori schermo) */}
        {err && <span className="basis-full pb-1 text-right text-sm text-rose-600">{err}</span>}
        {!err && dirty && <span className="basis-full pb-1 text-right text-sm text-muted">{tr('Bozza salvata: le modifiche restano qui finché non premi Salva', 'Draft saved: changes stay here until you press Save')}</span>}
        {report}
        <button type="button" onClick={reset} disabled={busy || !dirty} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-brand/10 disabled:opacity-40 disabled:hover:bg-transparent text-brand">{tr('Annulla', 'Cancel')}</button>
        <button type="button" onClick={save} disabled={busy || !dirty} className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:bg-line disabled:text-muted">{busy && <Loader2 size={15} className="animate-spin" />} {tr('Salva', 'Save')}</button>
      </div>
    </div>
  );
}

// Incorpora: codice da incollare nel sito dell'agenzia (o in un altro sito) per mostrare la scheda completa dell'immobile:
// un riquadro che si allunga da solo (la scheda manda la sua altezza, vedi components/site/EmbedHeight).
// casa: c'e' la casa 3D, si puo' incorporare solo quella (riquadro 16:10, il visore si carica nel riquadro)
function EmbedCode({ url, id, title, casa, onClose }: { url: string; id: string; title: string; casa?: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [only3d, setOnly3d] = useState(false);
  const origin = new URL(url).origin;
  const fid = `agenteimmo-${id.slice(0, 8)}`;
  const safeTitle = title.replace(/"/g, '&quot;');
  const code = only3d
    ? `<iframe src="${url}/3d?embed=1" title="Casa 3D, ${safeTitle}" loading="lazy" allow="fullscreen" allowfullscreen style="width:100%;aspect-ratio:16/10;border:0;border-radius:16px"></iframe>`
    : `<iframe id="${fid}" src="${url}/embed" title="${safeTitle}" loading="lazy" style="width:100%;border:0;min-height:900px"></iframe>
<script>window.addEventListener('message',function(e){if(e.origin==='${origin}'&&e.data&&e.data.agenteimmoEmbed==='${id}'){document.getElementById('${fid}').style.height=e.data.h+'px'}});</script>`;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-xl rounded-[32px] bg-white p-6 ${CARD_SHADOW}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">{tr('Metti questa casa su un altro sito', 'Put this home on another website')}</h2>
            <p className="mt-1 text-sm text-muted">{tr('Copia il codice e incollalo nella pagina del tuo sito (blocco HTML o codice incorporato). Si vede la scheda completa: foto, dati, mappa e i tuoi contatti.', 'Copy the code and paste it into your website page (HTML or embed block). It shows the full listing: photos, details, map and your contacts.')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>
        {casa && (
          <div className="mt-4 flex gap-2" role="radiogroup">
            {([[false, tr('Scheda completa', 'Full listing')], [true, tr('Solo la casa 3D', '3D home only')]] as const).map(([v, l]) => (
              <button key={String(v)} type="button" role="radio" aria-checked={only3d === v} onClick={() => setOnly3d(v)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-[600ms] ${only3d === v ? 'bg-ink text-white' : 'bg-canvas text-ink/80 hover:bg-line/60'}`}>{l}</button>
            ))}
          </div>
        )}
        <textarea readOnly value={code} onFocus={e => e.currentTarget.select()} rows={6} className="mt-4 w-full resize-none rounded-2xl bg-canvas p-4 font-mono text-xs leading-relaxed text-ink/80 outline-none ring-1 ring-line" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <a href={only3d ? `${url}/3d?embed=1` : `${url}/embed`} target="_blank" rel="noopener" className="text-sm font-medium text-brand hover:underline">{tr('Vedi l’anteprima', 'See the preview')}</a>
          <button type="button" onClick={() => { void navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand max-sm:w-full">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? tr('Copiato', 'Copied') : tr('Copia il codice', 'Copy code')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
