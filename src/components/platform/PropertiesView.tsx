'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { ArrowUpRight, Bath, BedDouble, Building2, Loader2, MapPin, Maximize2, Search, X } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import { CARD_SHADOW, formatPrice, go } from './api';

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

export default function PropertiesView({ projects }: { projects: ProjectData[] | null }) {
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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

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
      m.attributionControl.setPrefix(false).setPosition('bottomleft');
      // OpenStreetMap (gratis, senza chiave) in scala di grigi e schiarita via CSS
      Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'map-grey', attribution: '© OpenStreetMap' }).addTo(m);
      Lf.control.zoom({ position: 'bottomright', zoomInTitle: 'Avvicina', zoomOutTitle: 'Allontana' }).addTo(m);
      // + e - sopra la parte sfumata
      m.getContainer().querySelector<HTMLElement>('.leaflet-bottom.leaflet-right')!.style.bottom = '28%';
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

  // La scheda sta sopra il pin selezionato e lo segue durante lo spostamento
  useEffect(() => {
    const m = map.current;
    if (!m || !selected) { setPos(null); return; }
    const ll = geo[selected.addr.trim()] as LatLon;
    const follow = () => { const pt = m.latLngToContainerPoint(ll); setPos({ x: pt.x, y: pt.y }); };
    // porta il pin in basso al centro, cosi' la scheda sopra ha spazio
    const size = m.getSize();
    m.panBy(m.latLngToContainerPoint(ll).subtract([size.x / 2, size.y * 0.68]), { duration: 0.6, easeLinearity: 0.3 });
    follow();
    m.on('move zoom', follow);
    return () => { m.off('move zoom', follow); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const waiting = loading || projects.some(p => p.addr?.trim() && !(p.addr.trim() in geo));

  return (
    <div className="relative isolate h-[max(560px,72vh)] [&_.map-grey]:[filter:grayscale(1)_brightness(1.06)_contrast(.88)] overflow-hidden">
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
      {selected && pos && (
        <div className="absolute z-[500] w-[280px]" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, calc(-100% - 34px))' }}>
          <div className="blur-in overflow-hidden rounded-[22px] bg-white shadow-[0_18px_50px_rgba(0,0,0,.22)] ring-1 ring-black/5">
            <button onClick={() => go(`/immobile/${selected.id}`)} className="relative block aspect-[2/1] w-full overflow-hidden bg-canvas">
              {selected.cover && <img src={selected.cover} alt="" className="h-full w-full object-cover ease-smooth transition-transform hover:scale-[1.04]" />}
              {selected.is_public && <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-md">In vetrina</span>}
            </button>
            <button onClick={() => setSel(null)} aria-label="Chiudi" className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm backdrop-blur-md hover:text-ink"><X size={14} /></button>
            <div className="p-4">
              <div className="line-clamp-2 text-[15px] font-semibold leading-snug">{title(selected)}</div>
              <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted"><MapPin size={12} className="shrink-0" />{place(selected)}</div>
              <Facts p={selected} className="mt-2.5" />
              <div className="mt-3.5 flex items-center justify-between gap-3">
                <span className="font-display text-lg font-bold">{formatPrice(selected.prezzo)}</span>
                <button onClick={() => go(`/immobile/${selected.id}`)} className="flex h-9 items-center gap-1 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,transform] hover:bg-brand/90 active:scale-[0.97]">Apri <ArrowUpRight size={14} /></button>
              </div>
            </div>
          </div>
          {/* punta verso il pin */}
          <div className="mx-auto -mt-1.5 h-3 w-3 rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,.08)]" />
        </div>
      )}
    </div>
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
