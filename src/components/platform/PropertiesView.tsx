'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { ArrowUpRight, Bath, BedDouble, Building2, Footprints, GraduationCap, Hospital, Loader2, MapPin, Maximize2, Pill, School, Search, ShoppingCart, Train, TrainFront, TramFront, Trees, X } from 'lucide-react';
import type { Poi } from '@/lib/zone';
import type { ProjectData } from '@/lib/projects';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';
import { authFetch, CARD_SHADOW, formatPrice, go } from './api';

// Pagina Immobili: in alto la mappa con tutti gli immobili (pin con la foto, clic = scheda),
// sotto la lista. Le coordinate arrivano dall'indirizzo (Nominatim) e restano in cache nel browser.

type LatLon = [number, number];
type Filter = 'tutti' | 'vetrina' | 'bozze';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'vetrina', label: 'In vetrina' },
  { id: 'bozze', label: 'Non pubblicati' },
];

const place = (p: ProjectData) => p.addr?.split(',').map(s => s.trim()).filter(Boolean).slice(-2).join(', ') || 'Indirizzo n.d.';
const title = (p: ProjectData) => p.titolo || p.nome || 'Immobile';

// ponytail: geocoding dal browser, uno al secondo (limite Nominatim); salvare lat/lon sul progetto se gli immobili diventano centinaia
const GEO_KEY = 'gnm-geo';
function useGeo(projects: ProjectData[] | null) {
  // null finche' non leggo la cache: localStorage solo dopo il montaggio (altrimenti errore di idratazione)
  const [geo, setGeo] = useState<Record<string, LatLon | 0> | null>(null);
  useEffect(() => {
    let cached = {};
    try { cached = JSON.parse(localStorage.getItem(GEO_KEY) || '{}'); } catch {}
    setGeo(cached); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  useEffect(() => {
    if (!geo) return;
    const todo = [...new Set((projects ?? []).map(p => p.addr?.trim()).filter(a => a && !(a in geo)))] as string[];
    if (!todo.length) return;
    let stop = false;
    (async () => {
      for (const addr of todo) {
        if (stop) return;
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(addr)}`, { headers: { 'Accept-Language': 'it' } })
          .then(x => x.json()).catch(() => null) as { lat: string; lon: string }[] | null;
        if (stop) return;
        if (r) setGeo(g => {
          const next = { ...g!, [addr]: r[0] ? [Number(r[0].lat), Number(r[0].lon)] as LatLon : 0 as const };
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
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export default function PropertiesView({ projects: real }: { projects: ProjectData[] | null }) {
  // ponytail: in sviluppo si aggiungono 10 immobili finti (mappa e lista piene); in produzione mai
  const projects = useMemo(() => (real && process.env.NODE_ENV === 'development' ? [...real, ...FAKE_PROPERTIES] : real), [real]);
  const [filter, setFilter] = useState<Filter>('tutti');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const geo = useGeo(projects);

  const shown = useMemo(() => (projects ?? []).filter(p =>
    (filter === 'tutti' || (filter === 'vetrina') === !!p.is_public) &&
    (!q.trim() || `${title(p)} ${p.addr} ${p.riferimento ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [projects, filter, q]);

  if (projects && !projects.length) return <Empty />;

  return (
    <div className="pb-16">
      {/* Mappa a tutta larghezza, anche sotto la navbar; in basso sfuma nello sfondo */}
      <PropertyMap projects={shown} geo={geo} hover={hover} loading={!projects} />

      <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="blur-in font-display text-4xl font-bold leading-[1.2] tracking-tight">
          Immobili{projects && <span className="ml-3 align-middle text-2xl font-semibold text-muted/60">{projects.length}</span>}
        </h1>
        {/* Filtri: stato e ricerca */}
        <div className="blur-in flex items-center gap-2" style={{ animationDelay: '.08s' }}>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-black/10">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ease-smooth transition-colors ${filter === f.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{f.label}</button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-full bg-white px-3.5 ring-1 ring-black/10 ease-smooth transition-shadow focus-within:ring-ink/30">
            <Search size={15} className="text-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca via, città, rif." className="w-40 bg-transparent text-[13px] outline-none placeholder:text-muted/60" />
          </label>
        </div>
      </div>

      {!projects ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] animate-pulse rounded-[24px] bg-canvas" />)}
        </div>
      ) : shown.length ? (
        <div className="stagger mt-10 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(p => <PropertyCard key={p.id} p={p} onHover={on => setHover(on ? p.id : null)} />)}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-muted">Nessun immobile con questi filtri.</p>
      )}
      </div>
    </div>
  );
}

function Facts({ p, className = '' }: { p: ProjectData; className?: string }) {
  const items = [
    p.mq ? { icon: Maximize2, v: `${p.mq} m²` } : null,
    p.camere ? { icon: BedDouble, v: `${p.camere} ${p.camere === 1 ? 'camera' : 'camere'}` } : p.locali ? { icon: BedDouble, v: `${p.locali} locali` } : null,
    p.bagni ? { icon: Bath, v: `${p.bagni} ${p.bagni === 1 ? 'bagno' : 'bagni'}` } : null,
  ].filter(Boolean) as { icon: typeof Bath; v: string }[];
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted ${className}`}>
      {items.map(({ icon: I, v }) => <span key={v} className="flex items-center gap-1.5"><I size={14} className="text-ink/50" />{v}</span>)}
    </div>
  );
}

function PropertyCard({ p, onHover }: { p: ProjectData; onHover: (on: boolean) => void }) {
  const score = (p.import_data as { score?: number } | undefined)?.score;
  return (
    <a href={`#/immobile/${p.id}`} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} className="group block">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[24px] bg-canvas ${CARD_SHADOW} ease-smooth transition-transform group-hover:-translate-y-1`}>
        {p.cover
          ? <img src={p.cover} alt="" className="h-full w-full object-cover ease-smooth transition-transform group-hover:scale-[1.04]" />
          : <div className="flex h-full items-center justify-center text-muted/40"><Building2 size={36} /></div>}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 right-16 top-3 flex min-w-0 gap-1.5">
          {p.is_public && <span className="shrink-0 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md">In vetrina</span>}
          {p.tipologia && <span className="min-w-0 truncate rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">{p.tipologia.split('|')[0].trim()}</span>}
        </div>
        {typeof score === 'number' && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold shadow-sm ring-1 ring-black/5 backdrop-blur-md">{score}/100</span>}
        <span className="absolute bottom-3 left-4 font-display text-xl font-bold text-white drop-shadow">{formatPrice(p.prezzo)}</span>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow ease-smooth transition-[opacity,transform] group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
      </div>
      <div className="mt-3.5 px-1">
        <div className="line-clamp-2 font-semibold leading-snug">{title(p)}</div>
        <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-muted"><MapPin size={13} className="shrink-0" />{place(p)}</div>
        <Facts p={p} className="mt-2" />
      </div>
    </a>
  );
}

// Mappa con i pin foto. Clic sul pin = scheda sopra il pin; la scheda segue la mappa quando si sposta.
function PropertyMap({ projects, geo, hover, loading }: { projects: ProjectData[]; geo: Record<string, LatLon | 0>; hover: string | null; loading: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const L = useRef<typeof import('leaflet') | null>(null);
  const markers = useRef<Record<string, Marker>>({});
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
      const m = Lf.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25, zoomDelta: 0.5 }).setView([42.5, 12.5], 6);
      m.attributionControl.setPrefix(false).setPosition('bottomright');
      // Esri Light Gray (gratis, senza chiave): grigia e senza punti di interesse (negozi, ristoranti...);
      // sopra solo i nomi di vie e quartieri
      const esri = (l: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_${l}/MapServer/tile/{z}/{y}/{x}`;
      Lf.tileLayer(esri('Base'), { maxNativeZoom: 16, maxZoom: 19, attribution: '© Esri, OpenStreetMap' }).addTo(m);
      Lf.tileLayer(esri('Reference'), { maxNativeZoom: 16, maxZoom: 19 }).addTo(m);
      Lf.control.zoom({ position: 'bottomleft', zoomInTitle: 'Avvicina', zoomOutTitle: 'Allontana' }).addTo(m);
      // + e - in basso a sinistra, sopra la parte sfumata e il titolo
      Object.assign(m.getContainer().querySelector<HTMLElement>('.leaflet-bottom.leaflet-left')!.style, { bottom: '34%', left: '12px' });
      // stile come il resto della pagina (il CSS di Leaflet, caricato dopo, vincerebbe sulle classi)
      const bar = m.getContainer().querySelector<HTMLElement>('.leaflet-control-zoom')!;
      Object.assign(bar.style, { border: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,.12)' });
      bar.querySelectorAll<HTMLElement>('a').forEach(a => Object.assign(a.style, { width: '36px', height: '36px', lineHeight: '36px', color: '#111', border: '0' }));
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
      const html = `<div class="pin h-12 w-12 overflow-hidden rounded-full bg-canvas ring-[3px] ring-white shadow-[0_6px_16px_rgba(0,0,0,.25)] transition-transform duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-110">${p.cover ? `<img src="${encodeURI(p.cover)}" alt="" class="h-full w-full object-cover" />` : ''}</div>`;
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
      if (pin) { pin.style.transform = id === hover ? 'scale(1.25)' : ''; pin.style.boxShadow = id === hover ? '0 0 0 3px var(--color-brand, #2563eb), 0 8px 20px rgba(0,0,0,.3)' : ''; }
      mk.setZIndexOffset(id === hover ? 1000 : 0);
    });
  }, [hover]);

  // Pin selezionato: evidenziato e spostato al centro della parte di mappa libera (a destra c'e' la sidebar)
  useEffect(() => {
    const m = map.current;
    Object.entries(markers.current).forEach(([id, mk]) => {
      const pin = mk.getElement()?.querySelector<HTMLElement>('.pin');
      if (pin) pin.style.boxShadow = id === sel ? '0 0 0 3px #2563eb, 0 8px 20px rgba(0,0,0,.3)' : '';
    });
    if (!m || !selected) return;
    const size = m.getSize();
    m.panBy(m.latLngToContainerPoint(geo[selected.addr.trim()] as LatLon).subtract([(size.x - 400) / 2, size.y * 0.4]), { duration: 0.6, easeLinearity: 0.3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const waiting = loading || projects.some(p => p.addr?.trim() && !(p.addr.trim() in geo));

  return (
    <div className="relative isolate h-[max(680px,86vh)] overflow-hidden">
      <div ref={el} className="absolute inset-0 z-0 bg-canvas" style={{ maskImage: 'linear-gradient(to bottom, #000 62%, transparent 97%)', WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 97%)' }} />
      {/* sfumatura in basso: blur progressivo sopra la dissolvenza */}
      {[2, 6, 12].map((b, i) => {
        const m = `linear-gradient(to bottom, transparent ${i * 20}%, #000 ${40 + i * 20}%)`;
        return <div key={b} className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-56" style={{ backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: m, WebkitMaskImage: m }} />;
      })}
      {!pinned.length && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-muted shadow-sm ring-1 ring-black/5 backdrop-blur-md">
            {waiting ? <><Loader2 size={14} className="animate-spin" /> Metto gli immobili sulla mappa…</> : 'Aggiungi l’indirizzo agli immobili per vederli sulla mappa'}
          </span>
        </div>
      )}
      {selected && <NearbySidebar key={selected.id} p={selected} onClose={() => setSel(null)} />}
    </div>
  );
}

const POI_ICON: Record<string, typeof Train> = { Metro: TrainFront, Stazione: Train, Tram: TramFront, Supermercato: ShoppingCart, Scuola: School, 'Università': GraduationCap, Parco: Trees, Ospedale: Hospital, Farmacia: Pill };
const zoneCache: Record<string, Poi[]> = {};
const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

// Sidebar a destra sulla mappa: l'immobile e cosa c'e' vicino (stessa fonte dell'estensione: OpenStreetMap).
// Se l'immobile ha gia' la zona salvata (import_data.zona) la uso, se no la chiedo a /api/platform/zone.
function NearbySidebar({ p, onClose }: { p: ProjectData; onClose: () => void }) {
  const saved = (p.import_data as { zona?: Poi[] } | undefined)?.zona;
  const [pois, setPois] = useState<Poi[] | null>(Array.isArray(saved) && saved.length ? saved : zoneCache[p.id] ?? null);
  useEffect(() => {
    if (pois || !p.addr?.trim()) return;
    authFetch(`/api/platform/zone?address=${encodeURIComponent(p.addr)}`).then(r => r.json()).catch(() => ({}))
      .then((d: { pois?: Poi[] }) => { zoneCache[p.id] = d.pois ?? []; setPois(d.pois ?? []); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const groups = (pois ?? []).reduce<Record<string, Poi[]>>((g, x) => ((g[x.categoria] ??= []).push(x), g), {});

  return (
    <aside className="blur-in absolute bottom-28 right-5 top-24 z-[500] flex w-[360px] flex-col overflow-hidden rounded-[28px] bg-white/95 shadow-[0_18px_50px_rgba(0,0,0,.18)] ring-1 ring-black/5 backdrop-blur-xl">
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative aspect-[2/1] shrink-0 bg-canvas">
          {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
          <button onClick={onClose} aria-label="Chiudi" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm backdrop-blur-md hover:text-ink"><X size={15} /></button>
          <span className="absolute bottom-3 left-4 font-display text-xl font-bold text-white drop-shadow">{formatPrice(p.prezzo)}</span>
        </div>
        <div className="p-5">
          <div className="line-clamp-2 font-semibold leading-snug">{title(p)}</div>
          <div className="mt-1 flex items-center gap-1 truncate text-[13px] text-muted"><MapPin size={13} className="shrink-0" />{p.addr || 'Indirizzo n.d.'}</div>
          <Facts p={p} className="mt-2.5" />

          <div className="mt-6 text-[13px] font-semibold">Nelle vicinanze</div>
          {!pois ? (
            <div className="mt-3 space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-11 animate-pulse rounded-2xl bg-canvas" />)}</div>
          ) : !pois.length ? (
            <p className="mt-2 text-[13px] text-muted">Nessun servizio trovato entro 1 km.</p>
          ) : (
            <div className="stagger mt-2 space-y-1">
              {Object.entries(groups).map(([cat, list]) => {
                const I = POI_ICON[cat] ?? MapPin;
                return list.map((x, k) => (
                  <div key={`${cat}${k}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 ease-smooth transition-colors hover:bg-canvas">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink/70"><I size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{x.nome !== cat ? x.nome : cat}</div>
                      <div className="text-[11px] text-muted">{cat}</div>
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
        <button onClick={() => go(`/immobile/${p.id}`)} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-semibold text-white ease-smooth transition-[background-color,transform] hover:bg-brand/90 active:scale-[0.98]">Apri immobile <ArrowUpRight size={15} /></button>
      </div>
    </aside>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center px-6 pt-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-muted"><Building2 size={26} /></span>
      <p className="mt-5 font-display text-2xl font-bold tracking-tight">Ancora nessun immobile</p>
      <p className="mt-2 max-w-xs text-sm text-muted">Mettine uno in vetrina: comparirà qui e sulla mappa.</p>
      <a href="#/nuovo" className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">Metti in vetrina</a>
    </div>
  );
}
