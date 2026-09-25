'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Layers, Loader2, Search, Trash2, Wand2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import PhotoViewer from '@/components/ui/PhotoViewer';
import Dropdown from '@/components/ui/Dropdown';
import { downloadImage } from '@/lib/staging';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import { authFetch, CARD_SHADOW } from './api';

// Una voce = una foto di partenza: ultima versione (dopo), originale (prima) e i passaggi in mezzo.
export type MediaItem = { dopo: string; prima: string | null; at: number; casa: string | null; text: string; room: string; steps: { url: string; text: string }[]; all: string; keys: string[] };

export async function fetchMedia(): Promise<MediaItem[]> {
  const r = await authFetch('/api/platform/media').catch(() => null);
  const d = r?.ok ? await r.json() : null;
  return d?.items ?? [];
}

const DAY = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const PERIODS = [
  { value: 'tutto', label: 'Sempre', days: 0 },
  { value: 'oggi', label: 'Oggi', days: 1 },
  { value: '7', label: 'Ultimi 7 giorni', days: 7 },
  { value: '30', label: 'Ultimi 30 giorni', days: 30 },
] as const;
type Period = (typeof PERIODS)[number]['value'];
const PAGE = 24;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const stepsOf = (m: MediaItem) => [...(m.prima ? [{ src: m.prima, label: 'Prima' }] : []), ...m.steps.map(s => ({ src: s.url, label: s.text || 'Modifica' }))];

// Galleria: divisa per immobile, con ricerca (stanza, casa, richiesta), filtri e caricamento a scorrimento
// (24 alla volta). Passando sopra una foto si vede com'era all'inizio.
export default function MediaView() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [viewer, setViewer] = useState<MediaItem | null>(null);
  const [q, setQ] = useState('');
  const [casa, setCasa] = useState('tutte');
  const [period, setPeriod] = useState<Period>('tutto');
  const [shown, setShown] = useState(PAGE);
  // selezione multipla per cancellare
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState('');
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const stopSelecting = () => { setSelecting(false); setSel(new Set()); };
  const remove = async () => {
    setDeleting(true);
    const chosen = (items ?? []).filter(m => sel.has(m.dopo));
    const r = await authFetch('/api/platform/media', { method: 'DELETE', body: JSON.stringify({ keys: chosen.flatMap(m => m.keys) }) }).catch(() => null);
    const d = r?.ok ? await r.json() : null;
    setDeleting(false); setConfirm(false);
    if (!d) { setNote('Non sono riuscito a eliminarle, riprova.'); return; }
    setItems(await fetchMedia());
    setNote(d.kept ? `Alcune foto sono usate in un immobile e sono rimaste: toglile prima dall'immobile.` : '');
    stopSelecting();
  };
  const [now] = useState(() => Date.now()); // riferimento per i periodi (Oggi, 7 giorni...)
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => { fetchMedia().then(setItems); fetchProjects().then(setProjects); }, []);

  const nameOf = (id: string | null) => {
    const p = id ? projects.find(x => x.id === id) : null;
    return p ? p.titolo || p.nome || p.addr : 'Senza immobile';
  };
  const filtered = useMemo(() => {
    if (!items) return [];
    const words = norm(q).split(/\s+/).filter(Boolean);
    const days = PERIODS.find(p => p.value === period)!.days;
    const since = days ? now - days * 86_400_000 : 0;
    return items.filter(m => {
      if (casa !== 'tutte' && (m.casa ?? 'nessuna') !== casa) return false;
      if (m.at < since) return false;
      if (!words.length) return true;
      const p = m.casa ? projects.find(x => x.id === m.casa) : null;
      const hay = norm([m.room, m.all, p?.titolo, p?.nome, p?.addr].filter(Boolean).join(' '));
      return words.every(w => hay.includes(w));
    });
  }, [items, projects, q, casa, period, now]);
  // filtri cambiati: si riparte dalla prima pagina
  const key = `${q}|${casa}|${period}`;
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) { setPrevKey(key); setShown(PAGE); }

  // scorrimento infinito: quando il fondo si avvicina si mostrano altre 24 foto
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown(n => n + PAGE); }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, shown]);

  // gruppi per immobile, nell'ordine della foto piu' recente
  const groups = useMemo(() => {
    const g = new Map<string, MediaItem[]>();
    for (const m of filtered.slice(0, shown)) g.set(m.casa ?? 'nessuna', [...(g.get(m.casa ?? 'nessuna') ?? []), m]);
    return [...g.entries()];
  }, [filtered, shown]);
  const count = (k: string) => filtered.filter(m => (m.casa ?? 'nessuna') === k).length;
  const casaOptions = [{ value: 'tutte', label: 'Tutti gli immobili' }, ...[...new Set((items ?? []).map(m => m.casa ?? 'nessuna'))].map(id => ({ value: id, label: id === 'nessuna' ? 'Senza immobile' : nameOf(id) }))];
  const pill = 'h-10 rounded-full bg-white px-4 text-sm font-medium ring-1 ring-line';

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Galleria</h1>
          <p className="pt-1 text-sm text-muted">Le foto create con l&apos;AI, all&apos;ultima versione. Passa sopra per vedere com&apos;era, aprila per tutti i passaggi.</p>
        </div>
        <a href="#/staging" className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90"><Wand2 size={15} /> Nuova foto</a>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-6">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line ease-smooth transition-shadow focus-within:ring-ink/25 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca per stanza, casa o richiesta" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
        </label>
        <Dropdown value={casa} options={casaOptions} onChange={setCasa} className={pill} />
        <Dropdown value={period} options={PERIODS.map(p => ({ value: p.value, label: p.label }))} onChange={setPeriod} className={pill} />
        {items && <span className="ml-auto text-sm text-muted">{filtered.length} foto</span>}
        {!!items?.length && <button type="button" onClick={() => (selecting ? stopSelecting() : setSelecting(true))} className={`h-10 rounded-full px-4 text-sm font-medium outline-none ring-1 ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 ${selecting ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:bg-canvas'}`}>{selecting ? 'Annulla' : 'Seleziona'}</button>}
      </div>

      {note && <p className="blur-in pt-4 text-sm text-rose-600">{note}</p>}
      {items === null ? (
        <div className="flex h-64 items-center justify-center text-muted"><Loader2 size={20} className="animate-spin" /></div>
      ) : !items.length ? (
        <p className="flex h-64 items-center justify-center text-sm text-muted">Qui finiranno le foto che crei nella chat di home staging.</p>
      ) : !filtered.length ? (
        <p className="flex h-64 items-center justify-center text-sm text-muted">Nessuna foto con questi filtri.</p>
      ) : (
        <div className="space-y-10 pt-8">
          {groups.map(([k, list]) => (
            <section key={k}>
              <h2 className="flex items-baseline gap-2 pb-4 font-semibold">{nameOf(k === 'nessuna' ? null : k)} <span className="text-sm font-normal text-muted">{count(k)} foto</span></h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(m => (
                  <div key={m.dopo} className={`blur-in group rounded-3xl bg-white p-2 ease-smooth transition-shadow ${CARD_SHADOW} ${sel.has(m.dopo) ? '!ring-2 !ring-brand' : ''}`}>
                    <button type="button" onClick={() => (selecting ? toggle(m.dopo) : setViewer(m))} className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-canvas ${selecting ? 'cursor-pointer' : 'cursor-zoom-in'}`}>
                      {selecting && (
                        <span className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full ring-2 ease-smooth transition-colors ${sel.has(m.dopo) ? 'bg-brand text-white ring-brand' : 'bg-white/80 text-transparent ring-white'}`}><Check size={15} strokeWidth={3} /></span>
                      )}
                      <img src={m.dopo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      {m.prima && <img src={m.prima} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 ease-smooth transition-opacity group-hover:opacity-100" />}
                      <span className="absolute bottom-3 left-3 flex items-center gap-2">
                        {m.prima && <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur"><span className="group-hover:hidden">Dopo</span><span className="hidden group-hover:inline">Prima</span></span>}
                        {m.steps.length > 1 && <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"><Layers size={12} /> {m.steps.length}</span>}
                      </span>
                    </button>
                    <div className="flex min-h-12 items-center gap-3 px-2 pt-2 text-xs text-muted">
                      <span className="min-w-0 flex-1 truncate">{m.text ? <><span className="text-ink">{m.text}</span> · </> : null}{DAY.format(m.at)}</span>
                      <button type="button" onClick={() => downloadImage(m.dopo, 'agenteimmo.jpg')} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium leading-none text-ink hover:bg-canvas"><Download size={14} className="translate-y-px" /> Scarica</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {shown < filtered.length && <div ref={sentinel} className="flex h-16 items-center justify-center text-muted"><Loader2 size={18} className="animate-spin" /></div>}
        </div>
      )}
      {/* barra della selezione: in basso, fissa */}
      {selecting && (
        <div className="blur-in fixed inset-x-0 bottom-6 z-40 flex justify-center px-6">
          <div className={`flex items-center gap-2 rounded-full bg-white p-2 pl-5 text-sm ${CARD_SHADOW}`}>
            <span className="font-medium">{sel.size} selezionate</span>
            <button type="button" onClick={() => setSel(new Set(filtered.map(m => m.dopo)))} className="h-9 rounded-full px-3 font-medium text-muted hover:bg-canvas hover:text-ink">Seleziona tutte</button>
            <button type="button" disabled={!sel.size} onClick={() => setConfirm(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-rose-600 px-4 font-semibold text-white ease-smooth transition-opacity hover:bg-rose-700 disabled:opacity-40"><Trash2 size={14} /> Elimina</button>
          </div>
        </div>
      )}
      {confirm && createPortal(
        <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => !deleting && setConfirm(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Eliminare {sel.size} foto?</h2>
            <p className="pt-1 text-sm text-muted">Si cancellano anche il prima e tutti i passaggi. Non si può annullare.</p>
            <div className="flex justify-end gap-2 pt-6">
              <button type="button" disabled={deleting} onClick={() => setConfirm(false)} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-canvas">Annulla</button>
              <button type="button" disabled={deleting} onClick={remove} className="flex h-10 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Elimina</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {viewer && <PhotoViewer src={viewer.dopo} steps={stepsOf(viewer)} onClose={() => setViewer(null)} />}
    </div>
  );
}
