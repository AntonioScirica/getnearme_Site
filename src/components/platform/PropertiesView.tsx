'use client';

import { deleteProject } from '@/lib/projects';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { ArrowUpRight, Bath, BedDouble, Building2, Footprints, GraduationCap, Hospital, Loader2, MapPin, Maximize2, Pill, School, Search, ShoppingCart, Train, TrainFront, TramFront, Trees, X, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Poi } from '@/lib/zone';
import type { ProjectData } from '@/lib/projects';
import { FAKE_GEO, FAKE_PROPERTIES } from '@/lib/fakeProperties';
import { addFitButton } from '@/components/ui/LeafletMap';
import { authFetch, CARD_SHADOW, formatPrice, go } from './api';
import { pageLocale, tr } from './i18n';

// Pagina Immobili: in alto la mappa con tutti gli immobili (pin con la foto, clic = scheda),
// sotto la lista. Le coordinate arrivano dall'indirizzo (Nominatim) e restano in cache nel browser.

type LatLon = [number, number];
type Filter = 'tutti' | 'vetrina' | 'bozze';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'tutti', label: tr('Tutti', 'All') },
  { id: 'vetrina', label: tr('In vetrina', 'Live') },
  { id: 'bozze', label: tr('Non pubblicati', 'Unpublished') },
];

const place = (p: ProjectData) => p.addr?.split(',').map(s => s.trim()).filter(Boolean).slice(-2).join(', ') || tr('Indirizzo n.d.', 'No address');
const title = (p: ProjectData) => p.titolo || p.nome || tr('Immobile', 'Property');

// ponytail: geocoding dal browser, uno al secondo (limite Nominatim); salvare lat/lon sul progetto se gli immobili diventano centinaia
const GEO_KEY = 'gnm-geo-2'; // -2: posizioni rifatte con la ricerca dentro la citta' (01/10/2026)
function useGeo(projects: ProjectData[] | null) {
  // null finche' non leggo la cache: localStorage solo dopo il montaggio (altrimenti errore di idratazione)
  const [geo, setGeo] = useState<Record<string, LatLon | 0> | null>(null);
  useEffect(() => {
    let cached = {};
    try { cached = JSON.parse(localStorage.getItem(GEO_KEY) || '{}'); } catch {}
    setGeo({ ...cached, ...FAKE_GEO }); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  useEffect(() => {
    if (!geo) return;
    const todo = [...new Set((projects ?? []).map(p => p.addr?.trim()).filter(a => a && !(a in geo)))] as string[];
    if (!todo.length) return;
    let stop = false;
    (async () => {
      for (const addr of todo) {
        if (stop) return;
        // dal nostro server (Nominatim dal browser va in errore CORS; il server cerca la via dentro la citta')
        const res = await fetch(`/api/site/geocode?q=${encodeURIComponent(addr)}`).catch(() => null);
        const r = res && (res.ok || res.status === 404) ? await res.json().catch(() => null) as { lat?: number; lon?: number } | null : null;
        if (stop) return;
        if (r) setGeo(g => {
          const next = { ...g!, [addr]: r.lat !== undefined && r.lon !== undefined ? [r.lat, r.lon] as LatLon : 0 as const };
          localStorage.setItem(GEO_KEY, JSON.stringify(next));
          return next;
        });
        await new Promise(res => setTimeout(res, 1100));
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, !!geo]);
  return geo ?? {};
}

function ensureLeafletCss() {
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = '/vendor/leaflet/leaflet.css';
  document.head.appendChild(link);
}

export default function PropertiesView({ projects: real, onChange }: { projects: ProjectData[] | null; onChange?: () => void }) {
  // nessun immobile ancora: case d'esempio a Roma (mappa e lista piene), con l'invito a mettere in vetrina la prima.
  // ponytail: in sviluppo si aggiungono sempre i finti
  // durante il tour solo le case d'esempio (evento 'agenteimmo:tour-demo' dal Tour)
  const [tour, setTour] = useState(false);
  useEffect(() => {
    const on = () => setTour(true);
    window.addEventListener('agenteimmo:tour-demo', on);
    return () => window.removeEventListener('agenteimmo:tour-demo', on);
  }, []);
  const demo = tour; // case d'esempio solo nel tour
  const empty = !tour && real?.length === 0;
  const projects = useMemo(() => (tour ? FAKE_PROPERTIES : real), [real, tour]); // esempi solo nel tour guidato: ogni account vede solo i suoi
  const [filter, setFilter] = useState<Filter>('tutti');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const geo = useGeo(projects);

  const shown = useMemo(() => (projects ?? []).filter(p =>
    (filter === 'tutti' || (filter === 'vetrina') === !!p.is_public) &&
    (!q.trim() || `${title(p)} ${p.addr} ${p.riferimento ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [projects, filter, q]);

  return (
    <div className="pb-16">
      {/* Mappa a tutta larghezza, anche sotto la navbar; in basso sfuma nello sfondo */}
      {/* senza immobili niente mappa: la sua sfumatura dietro la card vuota sembrava un'ombra sporca */}
      {!empty && <PropertyMap projects={shown} geo={geo} hover={hover} loading={!projects} />}

      <div className={`relative z-10 mx-auto max-w-6xl px-6 ${empty ? 'pt-32' : '-mt-24'}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="blur-in font-display text-4xl font-bold leading-[1.2] tracking-tight">
          {tr('Immobili', 'Properties')}{projects && !demo && <span className="ml-3 align-middle text-2xl font-semibold text-muted/60">{projects.length}</span>}
        </h1>
        {/* Filtri: stato e ricerca */}
        {/* telefono: filtri su una riga, sotto la ricerca a tutta larghezza col + accanto */}
        <div className="blur-in flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap" style={{ animationDelay: '.08s' }}>
          <div className="flex max-w-full overflow-x-auto rounded-full bg-white p-1 ring-1 ring-black/10 [scrollbar-width:none]">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium ease-smooth transition-colors md:py-1.5 ${filter === f.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{f.label}</button>
            ))}
          </div>
          <label className="flex h-10 min-w-0 flex-1 basis-[calc(100%-48px)] items-center gap-2 rounded-full bg-white px-3.5 ring-1 ring-black/10 ease-smooth transition-shadow focus-within:ring-ink/30 md:flex-none md:basis-auto">
            <Search size={15} className="text-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={tr('Cerca via, città, rif.', 'Search street, city, ref.')} className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted/60 md:w-40" />
          </label>
          {/* in alto solo se c'e' gia' qualche immobile: con la lista vuota c'e' la card sotto */}
          {!empty && !demo && <a href="#/nuovo" aria-label={tr('Aggiungi immobile', 'Add property')} className="flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-black md:w-auto md:px-4"><Plus size={15} /> <span className="hidden md:inline">{tr('Aggiungi immobile', 'Add property')}</span></a>}
        </div>
      </div>

      {(demo || empty) && (
        <div className="blur-in mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5">
          <div>
            <div className="font-semibold">{demo ? tr('Queste sono case di esempio', 'These are sample properties') : tr('Non hai ancora immobili', 'No properties yet')}</div>
            <p className="mt-0.5 text-sm text-muted">{tr('Aggiungi il tuo primo immobile: qui e sulla mappa vedrai i tuoi.', 'Add your first property: your listings will show up here and on the map.')}</p>
          </div>
          <a href="#/nuovo" className="flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Aggiungi immobile', 'Add property')}</a>
        </div>
      )}
      {!projects ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] animate-pulse rounded-[24px] bg-canvas" />)}
        </div>
      ) : shown.length ? (
        <div className="stagger mt-10 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(p => <PropertyCard key={p.id} p={p} demo={demo} onChange={onChange} onHover={on => setHover(on ? p.id : null)} />)}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-muted">{tr('Nessun immobile con questi filtri.', 'No properties match these filters.')}</p>
      )}
      </div>
    </div>
  );
}

function Facts({ p, className = '' }: { p: ProjectData; className?: string }) {
  const items = [
    p.mq ? { icon: Maximize2, v: `${p.mq} m²` } : null,
    p.camere ? { icon: BedDouble, v: `${p.camere} ${p.camere === 1 ? tr('camera', 'bedroom') : tr('camere', 'bedrooms')}` } : p.locali ? { icon: BedDouble, v: `${p.locali} ${tr('locali', 'rooms')}` } : null,
    p.bagni ? { icon: Bath, v: `${p.bagni} ${p.bagni === 1 ? tr('bagno', 'bathroom') : tr('bagni', 'bathrooms')}` } : null,
  ].filter(Boolean) as { icon: typeof Bath; v: string }[];
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted ${className}`}>
      {items.map(({ icon: I, v }) => <span key={v} className="flex items-center gap-1.5"><I size={14} className="text-ink/50" />{v}</span>)}
    </div>
  );
}

function PropertyCard({ p, demo, onHover, onChange }: { p: ProjectData; demo?: boolean; onHover: (on: boolean) => void; onChange?: () => void }) {
  const score = (p.import_data as { score?: number } | undefined)?.score;
  const [menu, setMenu] = useState(false);
  const [up, setUp] = useState(false); // menu verso l'alto se sotto non c'e' posto (fondo della pagina o barra in basso)
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, [menu]);
  const remove = async () => {
    setMenu(false);
    if (!confirm(tr(`Eliminare “${title(p)}”? Si cancella anche dal tuo sito. Non si può annullare.`, `Delete “${title(p)}”? It will also be removed from your website. This cannot be undone.`))) return;
    setBusy(true);
    if (await deleteProject(p.id)) onChange?.(); else { setBusy(false); alert(tr('Non sono riuscito a eliminare l’immobile, riprova.', 'Couldn’t delete the property, please try again.')); }
  };
  return (
    // i tre puntini stanno fuori dal link (un bottone dentro un link non va bene): menu con Modifica ed Elimina
    <div ref={box} className={`group/card relative ${busy ? 'pointer-events-none' : ''}`}>
    {/* eliminazione in corso: rotellina sulla card */}
    {busy && <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[24px] bg-white/60 backdrop-blur-[2px]"><Loader2 size={22} className="animate-spin text-muted" /></div>}
    {!demo && (
      <div className="absolute right-3 top-3 z-20 ease-smooth transition-transform group-hover/card:-translate-y-1">{/* sale con la card */}
        <button type="button" onClick={e => { const r = e.currentTarget.getBoundingClientRect(), b = e.currentTarget.closest('main')?.getBoundingClientRect().bottom ?? innerHeight; setUp(b - r.bottom < 112); setMenu(m => !m); }} aria-label={tr('Altre azioni', 'More actions')} aria-expanded={menu} className="flex h-10 w-10 items-center md:h-8 md:w-8 justify-center rounded-full bg-white/90 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-white"><MoreHorizontal size={16} /></button>
        {menu && (
          <div className={`blur-in absolute right-0 ${up ? 'bottom-12 md:bottom-10' : 'top-12 md:top-10'} w-44 rounded-2xl bg-white p-1.5 text-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5`}>
            <a href={`#/immobile/${p.id}`} className="flex h-11 items-center md:h-9 gap-2 rounded-xl px-3 font-medium hover:bg-canvas"><Pencil size={14} /> {tr('Modifica', 'Edit')}</a>
            <button type="button" onClick={remove} className="flex h-11 w-full items-center md:h-9 gap-2 rounded-xl px-3 font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> {tr('Elimina', 'Delete')}</button>
          </div>
        )}
      </div>
    )}
    <a href={demo ? '#/nuovo' : `#/immobile/${p.id}`} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} className="group block">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[24px] bg-canvas ${CARD_SHADOW} ease-smooth transition-transform group-hover/card:-translate-y-1`}>
        {p.cover
          ? <img src={p.cover} alt="" className="h-full w-full object-cover ease-smooth transition-transform group-hover:scale-[1.04]" />
          : <div className="flex h-full items-center justify-center text-muted/40"><Building2 size={36} /></div>}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 right-16 top-3 flex min-w-0 gap-1.5">
          {demo && <span className="shrink-0 whitespace-nowrap rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">{tr('Esempio', 'Sample')}</span>}
          {p.is_public && <span className="shrink-0 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md">{tr('In vetrina', 'Live')}</span>}
          {p.tipologia && <span className="min-w-0 truncate rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">{p.tipologia.split('|')[0].trim()}</span>}
        </div>
        <span className="absolute bottom-3 left-4 font-display text-xl font-bold text-white drop-shadow">{formatPrice(p.prezzo)}</span>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow ease-smooth transition-[opacity,transform] group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
      </div>
      <div className="mt-3.5 px-1">
        <div className="line-clamp-2 font-semibold leading-snug">{title(p)}</div>
        <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-muted"><MapPin size={13} className="shrink-0" />{place(p)}</div>
        <Facts p={p} className="mt-2" />
      </div>
    </a>
    </div>
  );
}

// Mappa con i pin foto. Clic sul pin = scheda sopra il pin; la scheda segue la mappa quando si sposta.
function PropertyMap({ projects, geo, hover, loading }: { projects: ProjectData[]; geo: Record<string, LatLon | 0>; hover: string | null; loading: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const L = useRef<typeof import('leaflet') | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const fit = useRef<(() => void) | null>(null); // torna alla vista con tutti gli immobili (pulsante Centra)
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

  const pinned = projects.filter(p => geo[p.addr?.trim()]);
  const selected = pinned.find(p => p.id === sel) ?? null;
  const key = pinned.map(p => p.id).join();

  useEffect(() => {
    ensureLeafletCss();
    let cancelled = false;
    (async () => {
      const mod = await import('leaflet');
      const Lf = (mod.default ?? mod) as typeof import('leaflet');
      if (cancelled || !el.current || map.current) return;
      L.current = Lf;
      const m = Lf.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0, zoomDelta: 0.5 }).setView([42.5, 12.5], 6);
      m.attributionControl.setPrefix(false).setPosition('bottomright');
      // Esri Light Gray (gratis, senza chiave): grigia e senza punti di interesse (negozi, ristoranti...);
      // sopra solo i nomi di vie e quartieri
      const esri = (l: string) => `/api/site/tiles/${l.toLowerCase()}/{z}/{y}/{x}`;
      Lf.tileLayer(esri('Base'), { maxNativeZoom: 16, maxZoom: 19, attribution: '© Esri, OpenStreetMap' }).addTo(m);
      Lf.tileLayer(esri('Reference'), { maxNativeZoom: 16, maxZoom: 19 }).addTo(m);
      Lf.control.zoom({ position: 'bottomleft', zoomInTitle: tr('Avvicina', 'Zoom in'), zoomOutTitle: tr('Allontana', 'Zoom out') }).addTo(m);
      // + e - in basso a sinistra, sopra la parte sfumata e il titolo
      Object.assign(m.getContainer().querySelector<HTMLElement>('.leaflet-bottom.leaflet-left')!.style, { bottom: '34%', left: '12px' });
      // stile come il resto della pagina (il CSS di Leaflet, caricato dopo, vincerebbe sulle classi)
      const bar = m.getContainer().querySelector<HTMLElement>('.leaflet-control-zoom')!;
      Object.assign(bar.style, { border: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,.12)' });
      bar.querySelectorAll<HTMLElement>('a').forEach(a => Object.assign(a.style, { width: '36px', height: '36px', lineHeight: '36px', color: '#111', border: '0' }));
      addFitButton(bar, () => fit.current?.());
      // Pizzico sul trackpad (arriva come rotella con ctrlKey): zoom fluido sotto le dita. Lo scorrimento
      // normale con due dita resta alla pagina, cosi' la mappa non blocca lo scroll.
      m.getContainer().addEventListener('wheel', e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() - e.deltaY * 0.012, { animate: false });
      }, { passive: false });
      m.on('click', () => setSel(null));
      map.current = m;
      setReady(true);
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);

  // Pin: foto tonda con bordo bianco; al cambio degli immobili mostrati si rifanno e la mappa li inquadra
  useEffect(() => {
    const m = map.current, Lf = L.current;
    if (!ready || !m || !Lf) return;
    Object.values(markers.current).forEach(x => x.remove());
    markers.current = {};
    for (const p of pinned) {
      const ll = geo[p.addr.trim()] as LatLon;
      // foto come sfondo (cover): riempie sempre il cerchio, anche con le regole di Leaflet sulle <img> dei marker
      const html = `<div class="pin transition-transform duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-110" style="width:48px;height:48px;border-radius:9999px;border:3px solid #fff;box-shadow:${PIN_SHADOW};background:#f4f4f5 ${p.cover ? `url('${encodeURI(p.cover)}')` : ''} center/cover no-repeat;box-sizing:border-box"></div>`;
      const mk = Lf.marker(ll, { icon: Lf.divIcon({ html, className: '', iconSize: [48, 48], iconAnchor: [24, 24] }), riseOnHover: true })
        .on('click', e => { Lf.DomEvent.stopPropagation(e); setSel(p.id); })
        .addTo(m);
      markers.current[p.id] = mk;
    }
    if (pinned.length) {
      const b = Lf.latLngBounds(pinned.map(p => geo[p.addr.trim()] as LatLon));
      // una sola vista con tutti gli immobili, il piu' vicino possibile (spazio per navbar e sfumatura)
      m.setMinZoom(0); m.setMaxZoom(19);
      m.fitBounds(b, { paddingTopLeft: [60, 110], paddingBottomRight: [60, 220], maxZoom: 16, animate: false });
      // "Centra": torna a questa vista con tutti gli immobili
      fit.current = () => m.flyToBounds(b, { paddingTopLeft: [60, 110], paddingBottomRight: [60, 220], maxZoom: 16, duration: 0.6 });
      // + e - muovono solo di poco attorno a quella vista
      const z = m.getZoom();
      m.setMinZoom(z - 1.5); m.setMaxZoom(Math.min(19, z + 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  // Hover sulla card della lista: il pin corrispondente si ingrandisce e va sopra gli altri
  useEffect(() => {
    Object.entries(markers.current).forEach(([id, mk]) => {
      const pin = mk.getElement()?.querySelector<HTMLElement>('.pin');
      if (pin) { pin.style.transform = id === hover ? 'scale(1.25)' : ''; pin.style.boxShadow = id === hover ? '0 0 0 3px var(--color-brand, #2563eb), 0 8px 20px rgba(0,0,0,.3)' : PIN_SHADOW; }
      mk.setZIndexOffset(id === hover ? 1000 : 0);
    });
  }, [hover]);

  // Pin selezionato: evidenziato e spostato al centro della parte di mappa libera (a destra c'e' la sidebar)
  useEffect(() => {
    const m = map.current;
    Object.entries(markers.current).forEach(([id, mk]) => {
      const pin = mk.getElement()?.querySelector<HTMLElement>('.pin');
      if (pin) pin.style.boxShadow = id === sel ? '0 0 0 3px #2563eb, 0 8px 20px rgba(0,0,0,.3)' : PIN_SHADOW;
    });
    if (!m || !selected) return;
    const size = m.getSize();
    m.panBy(m.latLngToContainerPoint(geo[selected.addr.trim()] as LatLon).subtract([(size.x - 400) / 2, size.y * 0.4]), { duration: 0.6, easeLinearity: 0.3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const waiting = loading || projects.some(p => p.addr?.trim() && !(p.addr.trim() in geo));

  return (
    <div className="relative isolate h-[max(560px,72vh)] overflow-hidden">
      <div ref={el} className="absolute inset-0 z-0 bg-canvas" style={{ maskImage: 'linear-gradient(to bottom, #000 62%, transparent 97%)', WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 97%)' }} />
      {/* sfumatura in alto: la navbar resta leggibile sopra la mappa */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] h-44" style={{ background: 'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,.92) 35%, rgba(255,255,255,.55) 65%, transparent)' }} />
      {/* sfumatura in basso: blur progressivo sopra la dissolvenza */}
      {[2, 6, 12].map((b, i) => {
        const m = `linear-gradient(to bottom, transparent ${i * 20}%, #000 ${40 + i * 20}%)`;
        return <div key={b} className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-56" style={{ backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: m, WebkitMaskImage: m }} />;
      })}
      {!pinned.length && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-muted shadow-sm ring-1 ring-black/5 backdrop-blur-md">
            {waiting ? <><Loader2 size={14} className="animate-spin" /> {tr('Metto gli immobili sulla mappa…', 'Placing your properties on the map…')}</> : tr('Aggiungi l’indirizzo agli immobili per vederli sulla mappa', 'Add an address to your properties to see them on the map')}
          </span>
        </div>
      )}
      {selected && <NearbySidebar key={selected.id} p={selected} onClose={() => setSel(null)} />}
    </div>
  );
}

const PIN_SHADOW = '0 6px 16px rgba(0,0,0,.25)';
const POI_ICON: Record<string, typeof Train> = { Metro: TrainFront, Stazione: Train, Tram: TramFront, Supermercato: ShoppingCart, Scuola: School, 'Università': GraduationCap, Parco: Trees, Ospedale: Hospital, Farmacia: Pill };
// nome della categoria da mostrare (le categorie arrivano in italiano da lib/zone)
const POI_EN: Record<string, string> = { Metro: 'Metro', Stazione: 'Station', Tram: 'Tram', Supermercato: 'Supermarket', Scuola: 'School', 'Università': 'University', Parco: 'Park', Ospedale: 'Hospital', Farmacia: 'Pharmacy' };
const catLabel = (c: string) => tr(c, POI_EN[c] ?? c);
const zoneCache: Record<string, Poi[]> = {};
const km = (m: number) => (m >= 1000 ? `${(m / 1000).toLocaleString(pageLocale(), { maximumFractionDigits: 1 })} km` : `${m} m`);

// Sidebar a destra sulla mappa: l'immobile e cosa c'e' vicino (stessa fonte dell'estensione: OpenStreetMap).
// Se l'immobile ha gia' la zona salvata (import_data.zona) la uso, se no la chiedo a /api/platform/zone.
function NearbySidebar({ p, onClose }: { p: ProjectData; onClose: () => void }) {
  const saved = (p.import_data as { zona?: Poi[] } | undefined)?.zona;
  const [radius, setRadius] = useState(1000);
  const ck = `${p.id}:${radius}`;
  // la zona salvata con l'immobile e' quella a 1 km
  const [pois, setPois] = useState<Poi[] | 'err' | null>(Array.isArray(saved) && saved.length ? (zoneCache[ck] = saved) : zoneCache[ck] ?? null);
  useEffect(() => {
    if (zoneCache[ck]) { setPois(zoneCache[ck]); return; }
    if (!p.addr?.trim()) { setPois([]); return; }
    setPois(null);
    let stop = false;
    authFetch(`/api/platform/zone?address=${encodeURIComponent(p.addr)}&radius=${radius}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: { pois?: Poi[] }) => { zoneCache[ck] = d.pois ?? []; if (!stop) setPois(zoneCache[ck]); })
      .catch(() => { if (!stop) setPois('err'); });
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ck]);
  const groups = (Array.isArray(pois) ? pois : []).reduce<Record<string, Poi[]>>((g, x) => ((g[x.categoria] ??= []).push(x), g), {});

  return (
    <aside className="blur-in absolute bottom-28 right-5 top-24 z-[500] flex w-[360px] flex-col overflow-hidden rounded-[28px] bg-white/95 shadow-[0_18px_50px_rgba(0,0,0,.18)] ring-1 ring-black/5 backdrop-blur-xl">
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative aspect-[2/1] shrink-0 bg-canvas">
          {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
          <button onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm backdrop-blur-md hover:text-ink"><X size={15} /></button>
          <span className="absolute bottom-3 left-4 font-display text-xl font-bold text-white drop-shadow">{formatPrice(p.prezzo)}</span>
        </div>
        <div className="p-5">
          <div className="line-clamp-2 font-semibold leading-snug">{title(p)}</div>
          <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-muted"><MapPin size={13} className="shrink-0" />{p.addr || tr('Indirizzo n.d.', 'No address')}</div>
          <Facts p={p} className="mt-2.5" />

          <div className="mt-6 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold">{tr('Nelle vicinanze', 'Nearby')}</span>
            {/* raggio della ricerca */}
            <div className="flex rounded-full bg-canvas p-0.5">
              {[500, 1000, 2000, 5000].map(r => (
                <button key={r} onClick={() => setRadius(r)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ease-smooth transition-colors ${radius === r ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{km(r)}</button>
              ))}
            </div>
          </div>
          {pois === 'err' ? (
            <p className="mt-2 text-[13px] text-muted">{tr('Non riesco a caricare i servizi, riprova tra poco.', 'Couldn’t load nearby places, try again shortly.')}</p>
          ) : !pois ? (
            <div className="mt-3 space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-11 animate-pulse rounded-2xl bg-canvas" />)}</div>
          ) : !pois.length ? (
            <p className="mt-2 text-[13px] text-muted">{tr('Nessun servizio trovato entro', 'Nothing found within')} {km(radius)}.</p>
          ) : (
            <div className="stagger mt-2 space-y-1">
              {Object.entries(groups).map(([cat, list]) => {
                const I = POI_ICON[cat] ?? MapPin;
                return list.map((x, k) => (
                  <div key={`${cat}${k}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 ease-smooth transition-colors hover:bg-canvas">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink/70"><I size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{x.nome !== cat ? x.nome : catLabel(cat)}</div>
                      <div className="text-[11px] text-muted">{catLabel(cat)}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[13px] font-semibold">{km(x.distanza)}</div>
                      <div className="flex items-center justify-end gap-0.5 text-[11px] text-muted"><Footprints size={11} />{Math.max(1, Math.round(x.distanza / 80))} min</div>
                    </div>
                  </div>
                ));
              })}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-black/5 p-3">
        <button onClick={() => go(`/immobile/${p.id}`)} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-semibold text-white ease-smooth transition-[background-color,transform] hover:bg-brand/90 active:scale-[0.98]">{tr('Apri immobile', 'Open property')} <ArrowUpRight size={15} /></button>
      </div>
    </aside>
  );
}

