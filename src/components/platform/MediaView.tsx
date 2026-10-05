'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clapperboard, Download, Layers, Loader2, Search, Trash2, Wand2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import PhotoViewer from '@/components/ui/PhotoViewer';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import Dropdown from '@/components/ui/Dropdown';
import { downloadImage, STAGING_ANGLES, STAGING_STYLES } from '@/lib/staging';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import { authFetch, CARD_SHADOW } from './api';
import { FAKE_MEDIA, FAKE_PROPERTIES } from '@/lib/fakeProperties';
import ImmoLoader from '@/components/ui/ImmoLoader';
import { pageLocale, tr } from './i18n';
import { byRecent, pageMedia, type MediaFilters, type MediaItem, type MediaPage } from '@/lib/mediaPage';

// Una voce = una foto di partenza: ultima versione (dopo), originale (prima) e i passaggi in mezzo.
// video in lavorazione: della piattaforma, o della prova gratis della landing (landing:<lavoro>, lo finisce la sua rotta)
const jobUrl = (job: string) => (job.startsWith('landing:') ? `/api/landing/demo-video?job=${encodeURIComponent(job.slice(8))}` : `/api/platform/video?job=${encodeURIComponent(job)}`);
export type { MediaItem };

// elenco intero (immobili, chat, reel); la Galleria invece va a pagine con fetchMediaPage
export async function fetchMedia(): Promise<MediaItem[]> {
  const r = await authFetch('/api/platform/media').catch(() => null);
  const d = r?.ok ? await r.json() : null;
  return d?.items ?? [];
}

// una pagina della Galleria (dal piu' recente), con i filtri; null se la richiesta non va
export async function fetchMediaPage(f: MediaFilters, before: string | null, limit: number): Promise<MediaPage | null> {
  const p = new URLSearchParams({ limit: String(limit) });
  if (before) p.set('before', before);
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.casa && f.casa !== 'tutte') p.set('casa', f.casa);
  if (f.since) p.set('since', String(f.since));
  if (f.tipo && f.tipo !== 'tutto') p.set('tipo', f.tipo);
  const r = await authFetch(`/api/platform/media?${p}`).catch(() => null);
  return r?.ok ? await r.json().catch(() => null) : null;
}

// anteprima leggera (api/thumb: WebP ridotto, in cache sul CDN) per le foto https; locali, data: e blob: restano come sono
export const thumb = (u: string, w: 160 | 320 | 480 | 640 | 960) => (/^https:\/\//.test(u) ? `/api/thumb?w=${w}&u=${encodeURIComponent(u)}` : u);

// Novita' in Galleria (notifica sulla voce del menu): foto e video finiti dopo l'ultima visita alla Galleria, anche
// se l'agente ha chiuso la chat mentre il video si faceva. Si controlla ogni 30 s con la pagina in vista; i video ancora
// in lavorazione si sollecitano come fa la Galleria (la richiesta sul lavoro lo chiude e lo salva).
// Si leggono solo le 100 voci piu' recenti (il server elenca comunque R2: se pesa, un endpoint "ultimo at").
export function useGalleryNews(uid: string, onGallery: boolean): number {
  const key = `agenteimmo:gallery-seen:${uid}`;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (onGallery) { try { localStorage.setItem(key, String(Date.now())); } catch { /* niente */ } return; }
    let stop = false;
    const check = async () => {
      if (document.hidden) return;
      let seen = Number((() => { try { return localStorage.getItem(key); } catch { return null; } })() ?? 0);
      if (!seen) { seen = Date.now(); try { localStorage.setItem(key, String(seen)); } catch { /* niente */ } } // primo accesso: niente arretrati
      // bastano i piu' recenti (i video in lavorazione sono degli ultimi 30 minuti, quindi in testa)
      const items = (await fetchMediaPage({}, null, 100))?.items ?? [];
      // prima il numero, poi in sottofondo i lavori in corso (aspettarli ritardava il pallino anche di minuti)
      if (!stop) setN(items.filter(m => !m.pending && m.at > seen).length);
      for (const m of items.filter(x => x.pending && x.job)) void authFetch(jobUrl(m.job!)).catch(() => null);
    };
    void check();
    // subito quando la chat finisce una foto o un video (evento 'agenteimmo:media'), al ritorno sulla scheda, e ogni 15 s
    const now = () => void check();
    const vis = () => { if (!document.hidden) now(); };
    window.addEventListener('agenteimmo:media', now);
    document.addEventListener('visibilitychange', vis);
    const id = setInterval(now, 15000);
    return () => { stop = true; clearInterval(id); window.removeEventListener('agenteimmo:media', now); document.removeEventListener('visibilitychange', vis); };
  }, [key, onGallery]);
  return onGallery ? 0 : n;
}

const DAY = new Intl.DateTimeFormat(pageLocale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const PERIODS = [
  { value: 'tutto', label: tr('Sempre', 'All time'), days: 0 },
  { value: 'oggi', label: tr('Oggi', 'Today'), days: 1 },
  { value: '7', label: tr('Ultimi 7 giorni', 'Last 7 days'), days: 7 },
  { value: '30', label: tr('Ultimi 30 giorni', 'Last 30 days'), days: 30 },
] as const;
type Period = (typeof PERIODS)[number]['value'];
const PAGE = 40;
// richiesta salvata come id dello stile ("modern", "empty day"...): si mostra il nome in italiano
const presetName = (w: string) => ({ empty: tr('Svuota', 'Empty'), day: tr('Luminoso', 'Brighter') } as Record<string, string>)[w] ?? STAGING_STYLES.find(x => x.id === w)?.label ?? STAGING_ANGLES.find(x => x.id === w)?.label ?? (w === 'planimetria' ? tr('Planimetria', 'Floor plan') : null)
// solo se sono tutti id di stile; una richiesta scritta a mano resta com'e' (prima diventava "mettere, un, letto")
const nice = (t: string) => { const w = t.split(' '); return w.every(presetName) ? w.map(presetName).join(', ') : t; }
const stepsOf = (m: MediaItem) => [...(m.prima ? [{ src: m.prima, label: tr('Prima', 'Before') }] : []), ...m.steps.map(s => ({ src: s.url, label: s.text ? nice(s.text) : tr('Modifica', 'Edit') }))];

// Galleria: divisa per immobile, con ricerca (stanza, casa, richiesta), filtri e caricamento a scorrimento:
// il server manda 40 voci per volta (dal piu' recente), le altre arrivano avvicinandosi al fondo. Nella griglia
// solo anteprime leggere; i video si scaricano al passaggio del mouse o aprendoli. Passando sopra una foto si
// vede com'era all'inizio.
export default function MediaView() {
  const [items, setItems] = useState<MediaItem[] | null>(null); // voci caricate finora (pagine gia' arrivate)
  const [next, setNext] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [casas, setCasas] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [viewer, setViewer] = useState<MediaItem | null>(null);
  const [q, setQ] = useState('');
  const [qq, setQq] = useState(''); // ricerca mandata al server, dopo una breve pausa nella scrittura
  const [casa, setCasa] = useState('tutte');
  const [period, setPeriod] = useState<Period>('tutto');
  const [tipo, setTipo] = useState<'tutto' | 'foto' | 'video'>('tutto');
  const [reload, setReload] = useState(0);
  // selezione multipla per cancellare
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  // scarico con conferma: "Scaricata" sul pulsante per un attimo (prima non diceva niente)
  const [got, setGot] = useState<string | null>(null);
  const dl = async (m: { id: string; video?: string; dopo: string }, n = 0) => {
    await downloadImage(m.video ?? m.dopo, m.video ? `agenteimmo-video${n ? `-${n}` : ''}.mp4` : `agenteimmo${n ? `-${n}` : ''}.jpg`);
    setGot(m.id); setTimeout(() => setGot(g => (g === m.id ? null : g)), 2000);
  };
  const [dlAll, setDlAll] = useState(false);
  const downloadSel = async () => {
    setDlAll(true);
    let n = 0;
    for (const m of (items ?? []).filter(x => sel.has(x.id))) await dl(m, ++n).catch(() => {});
    setDlAll(false);
  };
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState('');
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const stopSelecting = () => { setSelecting(false); setSel(new Set()); };
  const [now] = useState(() => Date.now()); // riferimento per i periodi (Oggi, 7 giorni...)
  const sentinel = useRef<HTMLDivElement>(null);
  // Galleria vuota o tour (evento 'agenteimmo:tour-demo'): solo foto e video d'esempio, filtrati qui come fa il server
  const [tour, setTour] = useState(false);
  const [demo, setDemo] = useState<MediaItem[] | null>(null);
  useEffect(() => {
    const on = () => setTour(true);
    window.addEventListener('agenteimmo:tour-demo', on);
    return () => window.removeEventListener('agenteimmo:tour-demo', on);
  }, []);
  useEffect(() => {
    if (!tour) return;
    const id = setTimeout(() => { setDemo([...FAKE_MEDIA].sort(byRecent)); setProjects(FAKE_PROPERTIES.slice(0, 4)); }, 0);
    return () => clearTimeout(id);
  }, [tour]);
  useEffect(() => { if (!tour) void fetchProjects().then(setProjects); }, [tour]);
  useEffect(() => { const id = setTimeout(() => setQq(q), 300); return () => clearTimeout(id); }, [q]);

  const filters = useMemo<MediaFilters>(() => {
    const days = PERIODS.find(p => p.value === period)!.days;
    return { q: qq, casa, tipo, since: days ? now - days * 86_400_000 : 0 };
  }, [qq, casa, tipo, period, now]);
  const getPage = (before: string | null, limit: number) => (demo ? Promise.resolve(pageMedia(demo, filters, projects, before, limit)) : fetchMediaPage(filters, before, limit));
  // richiesta in corso: una risposta vecchia (filtri gia' cambiati) non deve coprire quella nuova
  const req = useRef(0);
  const apply = (d: MediaPage, append: boolean) => {
    setItems(cur => (append && cur ? [...cur, ...d.items.filter(m => !cur.some(x => x.id === m.id))] : d.items));
    setNext(d.next); setTotal(d.total); setCounts(d.counts); setCasas(d.casas);
  };
  // prima pagina: all'apertura, a filtri cambiati, dopo una cancellazione o a video finito
  useEffect(() => {
    if (tour && !demo) return;
    const id = ++req.current;
    void getPage(null, PAGE).then(d => { if (id === req.current) { if (d) apply(d, false); else setItems(cur => cur ?? []); } });
  }, [filters, demo, tour, reload]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadMore = async () => {
    if (!next || more) return;
    const id = req.current;
    setMore(true);
    const d = await getPage(next, PAGE);
    if (id === req.current && d) apply(d, true);
    setMore(false);
  };
  // "Seleziona tutte": prima arrivano le pagine che mancano, poi si seleziona tutto quello che i filtri mostrano
  const selectAll = async () => {
    const id = req.current;
    let cur = next, ids = (items ?? []).map(m => m.id);
    while (cur && id === req.current) {
      const d = await getPage(cur, 200);
      if (!d) break;
      ids = [...ids, ...d.items.map(m => m.id)];
      cur = d.next;
      apply(d, true);
    }
    setSel(new Set(ids));
  };

  const remove = async () => {
    setDeleting(true);
    const chosen = (items ?? []).filter(m => sel.has(m.id));
    const keys = chosen.flatMap(m => m.keys); // le foto d'esempio non hanno chiavi: si tolgono solo dalla lista
    const r = keys.length ? await authFetch('/api/platform/media', { method: 'DELETE', body: JSON.stringify({ keys }) }).catch(() => null) : null;
    const d = keys.length ? (r?.ok ? await r.json() : null) : { kept: 0 };
    setDeleting(false); setConfirm(false);
    if (!d) { setNote(tr('Non sono riuscito a eliminarle, riprova.', "Couldn't delete them, please try again.")); return; }
    if (demo) setDemo(list => (list ?? []).filter(m => m.keys.length || !sel.has(m.id)));
    // si ricarica dall'inizio quanto c'era gia' in pagina (le cancellate spariscono, quelle tenute restano)
    const id = ++req.current;
    const fresh = demo ? null : await fetchMediaPage(filters, null, Math.min(200, Math.max(PAGE, items?.length ?? 0)));
    if (fresh && id === req.current) apply(fresh, false);
    setNote(d.kept ? tr(`Alcune foto sono usate in un immobile e sono rimaste: toglile prima dall'immobile.`, 'Some photos are used in a property and were kept: remove them from the property first.') : '');
    stopSelecting();
  };
  // video in lavorazione (chat persa o chiusa): si segue il lavoro da qui, a video pronto si ricarica la lista
  useEffect(() => {
    const jobs = (items ?? []).filter(m => m.pending && m.job).map(m => m.job!);
    if (!jobs.length) return;
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      for (const job of jobs) {
        const r = await authFetch(jobUrl(job)).catch(() => null);
        const v = r ? await r.json().catch(() => ({})) : {};
        if (v.url || v.error) { if (!stop) setReload(n => n + 1); return; }
      }
      if (!stop) t = setTimeout(tick, 8000);
    };
    t = setTimeout(tick, 8000);
    return () => { stop = true; clearTimeout(t); };
  }, [items]);

  const nameOf = (id: string | null) => {
    const p = id ? projects.find(x => x.id === id) : null;
    return p ? p.titolo || p.nome || p.addr : tr('Senza immobile', 'No property');
  };
  // scorrimento infinito: quando il fondo si avvicina arriva la pagina dopo
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) void loadMore(); }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [next, more, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // gruppi per immobile, nell'ordine della foto piu' recente
  const groups = useMemo(() => {
    const g = new Map<string, MediaItem[]>();
    for (const m of items ?? []) g.set(m.casa ?? 'nessuna', [...(g.get(m.casa ?? 'nessuna') ?? []), m]);
    return [...g.entries()];
  }, [items]);
  const count = (k: string) => counts[k] ?? 0;
  const empty = items !== null && !casas.length; // nessuna foto nell'account (filtri a parte)
  const casaOptions = [{ value: 'tutte', label: tr('Tutti gli immobili', 'All properties') }, ...casas.map(id => ({ value: id, label: id === 'nessuna' ? tr('Senza immobile', 'No property') : nameOf(id) }))];
  const pill = 'h-10 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-line';

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{tr('Galleria', 'Gallery')}</h1>
          <p className="pt-1 text-sm text-muted"><span className="sm:hidden">{tr("Foto e video creati con l'AI. Aprili per tutti i passaggi.", 'Photos and videos made with AI. Open one for every step.')}</span><span className="max-sm:hidden">{tr("Le foto create con l'AI, all'ultima versione. Passa sopra per vedere com'era, aprila per tutti i passaggi.", 'Your AI photos, latest version. Hover to see the original, open one to see every step.')}</span></p>{/* telefono: niente "passa sopra" */}
        </div>
        <a href="#/staging" onClick={() => { try { sessionStorage.removeItem('gnm-staging-chat'); } catch { /* niente */ } }} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90"><Wand2 size={15} /> {tr('Nuova foto', 'New photo')}</a>
      </div>

      {demo && (
        <div className="blur-in mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5">
          <div>
            <div className="font-semibold">{tr('Queste sono foto e video di esempio', 'These are sample photos and videos')}</div>
            <p className="mt-0.5 text-sm text-muted">{tr('Arreda la tua prima stanza: qui trovi tutto quello che crei.', 'Stage your first room: everything you create will show up here.')}</p>
          </div>
          <a href="#/staging" className="flex h-10 items-center justify-center rounded-full bg-brand px-5 max-sm:w-full text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Arreda una stanza', 'Stage a room')}</a>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-6">
        <label className="flex h-10 min-w-0 flex-1 items-center max-sm:basis-full gap-2 rounded-full bg-white px-4 ring-1 ring-line ease-smooth transition-shadow focus-within:ring-ink/25 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr('Cerca per stanza, casa o richiesta', 'Search by room, property or request')} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
        </label>
        <Dropdown value={tipo} options={[{ value: 'tutto', label: tr('Foto e video', 'Photos and videos') }, { value: 'foto', label: tr('Solo foto', 'Photos only') }, { value: 'video', label: tr('Solo video', 'Videos only') }]} onChange={setTipo} className={pill} />
        <Dropdown value={casa} options={casaOptions} onChange={setCasa} className={pill} />
        <Dropdown value={period} options={PERIODS.map(p => ({ value: p.value, label: p.label }))} onChange={setPeriod} className={pill} />
        {items && <span className="ml-auto text-sm text-muted">{total} {tipo === 'video' ? tr('video', 'videos') : tipo === 'foto' ? tr('foto', 'photos') : tr('elementi', 'items')}</span>}
        {!!items && !empty && <button type="button" onClick={() => (selecting ? stopSelecting() : setSelecting(true))} className={`h-10 rounded-full px-4 text-sm font-medium outline-none ring-1 ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 ${selecting ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:bg-canvas'}`}>{selecting ? tr('Annulla', 'Cancel') : tr('Seleziona', 'Select')}</button>}
      </div>

      {note && <p className="blur-in pt-4 text-sm text-rose-600">{note}</p>}
      {items === null ? (
        // scheletro con la forma delle card (foto 4:3 + riga data e Scarica), non la rotellina
        <div aria-busy className="mt-8 grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`rounded-3xl bg-white p-2 ${CARD_SHADOW}`}>
              <div className="aspect-[4/3] rounded-2xl bg-line/60" />
              <div className="flex h-12 items-center justify-between px-2 pt-2"><div className="h-3 w-24 rounded-full bg-line/60" /><div className="h-6 w-20 rounded-full bg-line/50" /></div>
            </div>
          ))}
        </div>
      ) : empty ? (
        <p className="flex h-64 items-center justify-center text-sm text-muted">{tr('Qui finiranno le foto che crei nella chat di home staging.', 'Photos you create in the home staging chat will show up here.')}</p>
      ) : !items.length ? (
        <p className="flex h-64 items-center justify-center text-sm text-muted">{tr('Niente con questi filtri.', 'Nothing matches these filters.')}</p>
      ) : (
        <div className={`space-y-10 pt-8 ${selecting ? 'pb-28' : ''}`}>
          {groups.map(([k, list]) => (
            <section key={k}>
              <h2 className="flex items-baseline gap-2 pb-4 font-semibold">{nameOf(k === 'nessuna' ? null : k)} <span className="text-sm font-normal text-muted">{count(k)} {tipo === 'video' ? tr('video', 'videos') : tipo === 'foto' ? tr('foto', 'photos') : tr('elementi', 'items')}</span></h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(m => (
                  <div key={m.id} className={`blur-in group rounded-3xl bg-white p-2 ease-smooth transition-shadow ${CARD_SHADOW} ${sel.has(m.id) ? '!ring-2 !ring-brand' : ''}`}
                    // il video si scarica solo qui, al primo passaggio del mouse (all'apertura della pagina niente mp4)
                    onMouseEnter={m.video ? e => { const v = e.currentTarget.querySelector<HTMLVideoElement>('video[data-play]'); if (v) { if (!v.getAttribute('src')) v.src = m.video!; v.currentTime = 0; v.play().catch(() => {}); } } : undefined}
                    onMouseLeave={m.video ? e => { const v = e.currentTarget.querySelector<HTMLVideoElement>('video[data-play]'); const c = e.currentTarget.querySelector<HTMLElement>('[data-cover]'); if (c) c.style.opacity = ''; setTimeout(() => { if (v && !v.closest('.group')?.matches(':hover')) v.pause(); }, 600); /* si ferma a fine dissolvenza, se nel frattempo non si e' tornati sopra */ } : undefined}>
                    <button type="button" onClick={() => (selecting ? toggle(m.id) : setViewer(m))} className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-canvas ${selecting ? 'cursor-pointer' : 'cursor-zoom-in'}`}>
                      {selecting && (
                        <span className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full ring-2 ease-smooth transition-colors ${sel.has(m.id) ? 'bg-brand text-white ring-brand' : 'bg-white/80 text-transparent ring-white'}`}><Check size={15} strokeWidth={3} /></span>
                      )}
                      {/* video: copertina ferma, parte al passaggio del mouse */}
                      {m.video
                        // due strati: sopra la copertina ferma (anteprima leggera della foto da cui e' nato), sotto il video
                        // senza sorgente finche' non ci si passa sopra; la copertina sfuma (600 ms) quando il video parte davvero
                        ? <>
                          <video data-play muted loop playsInline preload="none" onPlaying={e => { const c = e.currentTarget.parentElement?.querySelector<HTMLElement>('[data-cover]'); if (c && e.currentTarget.closest('.group')?.matches(':hover')) c.style.opacity = '0'; }} className="absolute inset-0 h-full w-full object-cover" />
                          {m.dopo && <img data-cover src={thumb(m.dopo, 480)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover ease-smooth transition-opacity duration-[600ms]" />}
                        </>
                        : m.pending
                        ? <>
                          {m.dopo && <img src={thumb(m.dopo, 320)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-105 object-cover blur-md" />}
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 text-white"><Loader2 size={22} className="animate-spin" /><span className="text-xs font-medium">{tr('Video in lavorazione', 'Video in progress')}</span></span>
                        </>
                        : <img src={thumb(m.dopo, 480)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
                      {m.video && <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"><Clapperboard size={12} /> Video</span>}
                      {m.prima && <img src={thumb(m.prima, 480)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0 ease-smooth transition-opacity group-hover:opacity-100" />}
                      <span className="absolute bottom-3 left-3 flex items-center gap-2">
                        {m.prima && <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur"><span className="group-hover:hidden">{tr('Dopo', 'After')}</span><span className="hidden group-hover:inline">{tr('Prima', 'Before')}</span></span>}
                        {m.steps.length > 1 && <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"><Layers size={12} /> {m.steps.length}</span>}
                      </span>
                    </button>
                    <div className="flex min-h-12 items-center gap-3 px-2 pt-2 text-xs text-muted">
                      <span className="min-w-0 flex-1 truncate">{DAY.format(m.at)}</span>
                      <button type="button" onClick={() => void dl(m)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium leading-none text-ink hover:bg-canvas">{got === m.id ? <><Check size={14} className="text-emerald-600" /> {tr('Scaricata', 'Downloaded')}</> : <><Download size={14} className="translate-y-px" /> {tr('Scarica', 'Download')}</>}</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {next && <div ref={sentinel} className="flex h-16 items-center justify-center text-muted"><Loader2 size={18} className="animate-spin" /></div>}
        </div>
      )}
      {/* barra della selezione: in basso, fissa. In un portal: dentro la pagina un antenato con transform
          (animazione d'ingresso) la ancorava al fondo del contenuto invece che dello schermo */}
      {selecting && createPortal(
        <div className="blur-in pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-6 pt-16">
          {/* sfumatura progressiva sotto la barra: le foto scorrono dietro e la barra resta leggibile */}
          <div className="absolute inset-0"><ProgressiveBlur side="bottom" fade={24} /></div>
          <div className={`pointer-events-auto relative flex items-center gap-2 rounded-full bg-white p-2 pl-5 text-sm ${CARD_SHADOW}`}>
            <span className="font-medium">{sel.size} {sel.size === 1 ? tr('selezionata', 'selected') : tr('selezionate', 'selected')}</span>
            <button type="button" onClick={() => void selectAll()} className="h-9 rounded-full px-3 font-medium text-muted hover:bg-canvas hover:text-ink">{tr('Seleziona tutte', 'Select all')}</button>
            <button type="button" disabled={!sel.size || dlAll} onClick={() => void downloadSel()} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 font-semibold text-white ease-smooth transition-opacity hover:bg-black disabled:opacity-40">{dlAll ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {tr('Scarica', 'Download')}</button>
            <button type="button" disabled={!sel.size} onClick={() => setConfirm(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-rose-600 px-4 font-semibold text-white ease-smooth transition-opacity hover:bg-rose-700 disabled:opacity-40"><Trash2 size={14} /> {tr('Elimina', 'Delete')}</button>
          </div>
        </div>,
        document.body,
      )}
      {confirm && createPortal(
        <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => !deleting && setConfirm(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">{tr(`Eliminare ${sel.size} foto?`, `Delete ${sel.size} ${sel.size === 1 ? 'photo' : 'photos'}?`)}</h2>
            <p className="pt-1 text-sm text-muted">{tr('Si cancellano anche il prima e tutti i passaggi. Non si può annullare.', 'The original and all steps will be deleted too. This cannot be undone.')}</p>
            <div className="flex justify-end gap-2 pt-6">
              <button type="button" disabled={deleting} onClick={() => setConfirm(false)} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-brand/10 text-brand">{tr('Annulla', 'Cancel')}</button>
              <button type="button" disabled={deleting} onClick={remove} className="flex h-10 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {tr('Elimina', 'Delete')}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {viewer && <PhotoViewer src={viewer.dopo} steps={stepsOf(viewer)} video={viewer.video} onClose={() => setViewer(null)} />}
    </div>
  );
}
