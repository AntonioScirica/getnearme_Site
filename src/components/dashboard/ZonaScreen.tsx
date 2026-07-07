'use client';

// Analisi di zona: input indirizzo (geocoding Nominatim) → mappa Leaflet +
// categorie POI vicine (Overpass), come nell'estensione.
// Free: 5 analisi (localStorage). Piani a pagamento: illimitate.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup, Marker } from 'leaflet';
import { s, Box, Icon } from './ui';
import type { Project } from './types';
import type { BrandSettings } from '@/lib/brand';
import {
  POI_CATEGORIES, RADIUS_OPTIONS, DEFAULT_RADIUS,
  geocodeAddress, reverseGeocode, searchAddresses, fetchZona, fetchZonaArea, centroid, formatDistance,
  type ZonaResult, type Poi, type GeocodeHit, type LatLng,
} from '@/lib/poi';
import { getGeoEnabled } from '@/lib/prefs';
import { trackExport } from '@/lib/staging';
import { supabase } from '@/lib/supabase';

const FREE_LIMIT = 5;

// Zoom oltre il quale i marker POI mostrano l'icona della categoria (come estensione).
const ICON_ZOOM = 15;
// SVG (inner) per le icone categoria nei marker ravvicinati. Stroke = currentColor.
const POI_ICON_SVG: Record<string, string> = {
  'train-front': '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19l-2 3"/><path d="m15 19 2 3"/><rect width="18" height="14" x="3" y="3" rx="2"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  school: '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
  'tree-pine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  dog: '<path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
};

// Conteggio per-account: il quota free NON deve sbordare tra account sullo
// stesso browser. Chiave generica solo come fallback pre-login.
function getUsage(key: string): number {
  if (typeof window === 'undefined') return 0;
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch { return 0; }
}
function bumpUsage(key: string): number {
  const n = getUsage(key) + 1;
  try { localStorage.setItem(key, String(n)); } catch { /* ignore */ }
  return n;
}

// Inietta il CSS di Leaflet una sola volta (evita restrizioni CSS import di Next).
function ensureLeafletCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export default function ZonaScreen({
  projects = [],
  toast,
  locked = false,
  go,
}: {
  project?: Project;
  projects?: Project[];
  brand: BrandSettings;
  toast: (msg: string, icon?: string) => void;
  locked?: boolean;
  go?: (r: string) => void;
}) {
  const accent = '#3B83F6';

  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [geoEnabled, setGeoEnabledState] = useState(true);
  useEffect(() => { setGeoEnabledState(getGeoEnabled()); }, []);

  // Autocomplete indirizzo (Nominatim), debounce 350ms.
  const [addrSug, setAddrSug] = useState<GeocodeHit[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const sugBoxRef = useRef<HTMLDivElement>(null);
  const suppressSug = useRef(false); // salta la ricerca quando settiamo l'indirizzo via codice
  useEffect(() => {
    if (suppressSug.current) { suppressSug.current = false; return; }
    const q = address.trim();
    if (q.length < 3) { setAddrSug([]); setSugOpen(false); return; }
    let alive = true;
    const t = setTimeout(async () => {
      const hits = await searchAddresses(q, 5);
      if (!alive) return;
      setAddrSug(hits);
      setSugOpen(hits.length > 0);
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [address]);
  useEffect(() => {
    if (!sugOpen) return;
    const onDoc = (e: MouseEvent) => { if (sugBoxRef.current && !sugBoxRef.current.contains(e.target as Node)) setSugOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sugOpen]);
  const pickSuggestion = (hit: GeocodeHit) => {
    // Compila SOLO l'indirizzo: l'analisi parte quando l'utente preme la CTA.
    // (Solo la scelta di un immobile lancia l'analisi in automatico.)
    suppressSug.current = true;
    setAddress(hit.label);
    setSugOpen(false);
    setAddrSug([]);
  };

  // All'apertura: chiedi la geolocalizzazione e precompila con la mia via
  // (reverse geocode). Niente prefill della città a caso.
  const geoAsked = useRef(false);
  useEffect(() => {
    if (geoAsked.current) return;
    geoAsked.current = true;
    if (!getGeoEnabled()) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (addr) { suppressSug.current = true; setAddress((cur) => cur.trim() ? cur : addr); }
        } catch { /* ignore */ }
        finally { setLocating(false); }
      },
      () => { setLocating(false); /* permesso negato: lascia vuoto */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  // Dropdown immobili (ricercabile)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const propsWithAddr = useMemo(() => projects.filter((p) => p.addr && p.addr.trim()), [projects]);
  const filteredProps = useMemo(() => {
    const t = pickerQ.trim().toLowerCase();
    if (!t) return propsWithAddr;
    return propsWithAddr.filter((p) => `${p.nome} ${p.addr}`.toLowerCase().includes(t));
  }, [propsWithAddr, pickerQ]);
  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ZonaResult | null>(null);
  const [resultId, setResultId] = useState(0);
  const [center, setCenter] = useState<GeocodeHit | null>(null);
  const [addrCenter, setAddrCenter] = useState<GeocodeHit | null>(null); // ultimo centro da indirizzo (per ripristinare il cerchio)
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set(POI_CATEGORIES.map((c) => c.key)));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [zoom, setZoom] = useState(12);
  const [locating, setLocating] = useState(false);
  const [usage, setUsage] = useState(0);

  // Disegno area sulla mappa
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<LatLng[]>([]);
  const [area, setArea] = useState<LatLng[] | null>(null);

  const usageKeyRef = useRef('gnm-zona-used');
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const key = user?.id ? `gnm-zona-used:${user.id}` : 'gnm-zona-used';
      usageKeyRef.current = key;
      if (alive) setUsage(getUsage(key));
    })();
    return () => { alive = false; };
  }, []);
  const remaining = Math.max(0, FREE_LIMIT - usage);
  const blocked = locked && remaining <= 0;

  // ─── Leaflet map ────────────────────────────────────────────────────────────
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const drawLayerRef = useRef<LayerGroup | null>(null);
  const centerMarkerRef = useRef<Marker | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureLeafletCss();
    (async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'));
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L as typeof import('leaflet');
      const map = (L as typeof import('leaflet')).map(mapEl.current, { zoomControl: true, attributionControl: false })
        .setView([41.9028, 12.4964], 12);
      (L as typeof import('leaflet')).tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20, subdomains: 'abcd',
      }).addTo(map);
      markersRef.current = (L as typeof import('leaflet')).layerGroup().addTo(map);
      drawLayerRef.current = (L as typeof import('leaflet')).layerGroup().addTo(map);
      mapRef.current = map;
      setZoom(map.getZoom());
      map.on('zoomend', () => setZoom(map.getZoom()));
      // fix dimensioni dopo il mount
      setTimeout(() => map.invalidateSize(), 100);
    })();
    // Il container cambia dimensione (es. mappa 16:9 su mobile) → ricalibra i tile.
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const colorOf = useCallback((key: string) => POI_CATEGORIES.find((c) => c.key === key)?.color || accent, []);
  const removeAreaRef = useRef<() => void>(() => {});
  const lastFitRef = useRef(-1); // ultimo resultId su cui abbiamo fatto auto-fit

  // Ridisegna i marker quando cambiano risultati / filtri.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const group = markersRef.current;
    if (!L || !map || !group) return;
    group.clearLayers();

    if (area && area.length >= 3) {
      // area disegnata: poligono NON interattivo (i click sulla mappa restano per
      // pan/zoom; la rimozione avviene dal bottone dedicato). Durante l'analisi
      // la forma pulsa con effetto AI (className zona-analyzing).
      L.polygon(area.map((p) => [p.lat, p.lng]), { color: accent, weight: 2, opacity: 0.7, fillOpacity: 0.06, interactive: false, className: loading ? 'zona-analyzing' : '' }).addTo(group);
    } else if (center && !drawMode) {
      // marker centro (immobile/indirizzo) + cerchio raggio (nascosto durante il disegno)
      const html = `<div style="width:20px;height:20px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`;
      const icon = L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
      centerMarkerRef.current = L.marker([center.lat, center.lng], { icon, zIndexOffset: 1000 }).addTo(group);
      L.circle([center.lat, center.lng], { radius, color: accent, weight: 1, opacity: 0.4, fillOpacity: 0.05 }).addTo(group);
    }

    const bounds: [number, number][] = [];
    if (area && area.length >= 3) for (const p of area) bounds.push([p.lat, p.lng]);
    else if (center) bounds.push([center.lat, center.lng]);
    if (result) {
      const showIcons = zoom >= ICON_ZOOM;
      for (const cat of POI_CATEGORIES) {
        if (!activeCats.has(cat.key)) continue;
        const svg = POI_ICON_SVG[cat.icon];
        for (const poi of result[cat.key] || []) {
          // Lontano: pallino. Vicino (zoom): pin colorato con icona categoria (come estensione).
          const html = showIcons && svg
            ? `<div style="width:25px;height:25px;border-radius:50%;background:${cat.color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>`
            : `<div style="width:11px;height:11px;border-radius:50%;background:${cat.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
          const sz = showIcons && svg ? 25 : 11;
          const icon = L.divIcon({ html, className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] });
          const m = L.marker([poi.lat, poi.lng], { icon });
          m.bindTooltip(`${poi.name} · ${formatDistance(poi.distance)}`, { direction: 'top' });
          m.addTo(group);
          bounds.push([poi.lat, poi.lng]);
        }
      }
    }
    // Auto-fit SOLO ad ogni nuova analisi (resultId), non ad ogni re-render (es.
    // cambio zoom per le icone) -> altrimenti l'utente non potrebbe zoomare.
    if (!drawMode && lastFitRef.current !== resultId) {
      lastFitRef.current = resultId;
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      else if (center) map.setView([center.lat, center.lng], 15);
    }
  }, [result, center, activeCats, radius, area, drawMode, colorOf, loading, zoom]);

  // ─── Disegno area: gestione click sulla mappa ────────────────────────────────
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = drawLayerRef.current;
    if (!L || !map || !layer) return;

    // ridisegna i punti correnti del disegno
    layer.clearLayers();
    if (drawMode && drawPoints.length > 0) {
      if (drawPoints.length >= 2) {
        L.polyline(drawPoints.map((p) => [p.lat, p.lng]), { color: accent, weight: 2, dashArray: '5,5', interactive: false }).addTo(layer);
      }
      drawPoints.forEach((p, i) => {
        // Primo punto evidenziato quando il poligono è chiudibile (≥3 punti).
        const canClose = i === 0 && drawPoints.length >= 3;
        const sz = canClose ? 16 : 13;
        const html = canClose
          ? `<div style="width:16px;height:16px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`
          : `<div style="width:13px;height:13px;border-radius:50%;background:#fff;border:3px solid ${accent};box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
        // interactive:false → il click arriva alla mappa (così il check "vicino al
        // primo punto" chiude il poligono; un marker interattivo lo bloccherebbe).
        const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ html, className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] }), zIndexOffset: 2000 + i, interactive: false });
        if (canClose) m.bindTooltip('Clicca per chiudere e analizzare', { direction: 'top' });
        m.addTo(layer);
      });
    }

    if (!drawMode) {
      map.getContainer().style.cursor = '';
      return;
    }
    map.getContainer().style.cursor = 'crosshair';
    const onClick = (e: { latlng: { lat: number; lng: number } }) => {
      // Click vicino al primo punto (≥3 punti) → chiudi il poligono e analizza.
      if (drawPoints.length >= 3) {
        const first = map.latLngToContainerPoint([drawPoints[0].lat, drawPoints[0].lng]);
        const click = map.latLngToContainerPoint([e.latlng.lat, e.latlng.lng]);
        if (first.distanceTo(click) <= 16) { runAreaRef.current(drawPoints); return; }
      }
      setDrawPoints((prev) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    };
    map.on('click', onClick);
    return () => { map.off('click', onClick); map.getContainer().style.cursor = ''; };
  }, [drawMode, drawPoints]);

  // ─── Analisi ─────────────────────────────────────────────────────────────────
  const runAnalysis = async (overrideAddr?: string) => {
    const addr = (overrideAddr ?? address).trim();
    if (!addr) { toast('Inserisci un indirizzo', 'x'); return; }
    if (blocked) { toast('Hai esaurito le analisi gratuite', 'lock'); return; }
    setLoading(true);
    try {
      const hit = await geocodeAddress(addr);
      if (!hit) { toast('Indirizzo non trovato', 'x'); setLoading(false); return; }
      setArea(null);
      setAddrCenter(hit);
      setCenter(hit);
      const data = await fetchZona(hit.lat, hit.lng, radius);
      setResult(data);
      setResultId((n) => n + 1);
      void trackExport({ export_type: 'zone_analysis' });
      const firstNonEmpty = POI_CATEGORIES.find((c) => (data[c.key] || []).length > 0);
      setExpanded(firstNonEmpty?.key || null);
      if (locked) setUsage(bumpUsage(usageKeyRef.current));
    } catch (e) {
      const msg = e instanceof Error && e.message === 'overpass_unreachable'
        ? 'Servizio dati temporaneamente non disponibile, riprova'
        : 'Errore durante l\'analisi';
      toast(msg, 'x');
    } finally {
      setLoading(false);
    }
  };

  // Usa la posizione attuale: reverse geocode → compila SOLO l'indirizzo.
  // NON analizza in automatico: l'utente preme la CTA quando vuole.
  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { toast('Geolocalizzazione non disponibile', 'x'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (addr) { suppressSug.current = true; setAddress(addr); }
          else toast('Posizione non trovata', 'x');
        } catch { toast('Errore posizione', 'x'); }
        finally { setLocating(false); }
      },
      () => { toast('Permesso posizione negato', 'x'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Rimuove l'area disegnata e i suoi POI. NON rifà l'analisi: ripristina solo
  // il pin/cerchio dell'ultimo indirizzo (l'utente rilancia a mano se vuole).
  const removeArea = () => {
    setArea(null);
    setDrawPoints([]);
    setResult(null);
    setCenter(addrCenter ?? null);
  };
  removeAreaRef.current = removeArea;

  // Analisi dell'area disegnata. La via centrale (reverse geocode del centroide)
  // diventa l'indirizzo, e si analizza con un raggio che copre l'area disegnata.
  const runAreaAnalysis = async (pts?: LatLng[]) => {
    const points = pts ?? drawPoints;
    if (points.length < 3) { toast('Disegna almeno 3 punti', 'x'); return; }
    if (blocked) { toast('Hai esaurito le analisi gratuite', 'lock'); return; }
    setLoading(true);
    setDrawMode(false);
    // La forma resta visibile durante l'analisi (con effetto AI dentro), non sparisce.
    setArea(points);
    try {
      const c = centroid(points);
      // Analisi SOLO dentro il poligono disegnato (filtro poly Overpass).
      const data = await fetchZonaArea(points);
      let label = 'Area selezionata';
      try { const addr = await reverseGeocode(c.lat, c.lng); if (addr) label = addr; } catch { /* ignore */ }
      const hit = { lat: c.lat, lng: c.lng, label };
      suppressSug.current = true;
      setAddress(label);
      setAddrCenter(hit);
      setCenter(hit);
      setResult(data);
      setResultId((n) => n + 1);
      void trackExport({ export_type: 'zone_analysis' });
      const firstNonEmpty = POI_CATEGORIES.find((cat) => (data[cat.key] || []).length > 0);
      setExpanded(firstNonEmpty?.key || null);
      if (locked) setUsage(bumpUsage(usageKeyRef.current));
    } catch (e) {
      const msg = e instanceof Error && e.message === 'overpass_unreachable'
        ? 'Servizio dati temporaneamente non disponibile, riprova'
        : 'Errore durante l\'analisi';
      toast(msg, 'x');
    } finally {
      setLoading(false);
    }
  };
  const runAreaRef = useRef<(pts?: LatLng[]) => void>(() => {});
  runAreaRef.current = runAreaAnalysis;

  const startDraw = () => { setArea(null); setDrawPoints([]); setDrawMode(true); };
  const cancelDraw = () => { setDrawMode(false); setDrawPoints([]); };
  const undoPoint = () => setDrawPoints((prev) => prev.slice(0, -1));

  const totalFound = useMemo(() => {
    if (!result) return 0;
    return POI_CATEGORIES.reduce((sum, c) => sum + (result[c.key]?.length || 0), 0);
  }, [result]);

  // PDF: stessa estetica del report (reportHtml.ts) — pagina HTML stilizzata
  // stampata via iframe nascosto. Card chiare, badge icona su tint, 3 colonne,
  // font Inter. Il browser stampa SVG reali → niente icone rasterizzate.
  const [pdfBusy, setPdfBusy] = useState(false);
  const downloadPdf = async () => {
    if (!result || pdfBusy) return;
    setPdfBusy(true);
    try {
      // 1. Cattura mappa (rettangolo, zoom stretto, senza controlli +/-).
      let mapDataUrl = '';
      const node = mapEl.current, map = mapRef.current, L = LRef.current;
      if (node && map && L) {
        const prevH = node.style.height, prevCenter = map.getCenter(), prevZoom = map.getZoom();
        try {
          node.style.height = Math.round(node.clientWidth / 3) + 'px';
          map.invalidateSize();
          const pts: [number, number][] = [];
          for (const c of POI_CATEGORIES) for (const poi of (result[c.key] || [])) pts.push([poi.lat, poi.lng]);
          if (center) pts.push([center.lat, center.lng]);
          if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [18, 18], maxZoom: 17 });
          await new Promise((r) => setTimeout(r, 650));
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(node, {
            useCORS: true, backgroundColor: '#e8ebef', scale: 2,
            ignoreElements: (el) => !!(el as HTMLElement).classList?.contains('leaflet-control-container'),
          });
          mapDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        } catch { /* mappa non catturabile: salta */ }
        finally { node.style.height = prevH; map.invalidateSize(); map.setView(prevCenter, prevZoom); }
      }

      // 2. Token identici al report (reportHtml.ts).
      const CAT_STYLE: Record<string, { bg: string; color: string }> = {
        transport: { bg: '#EEF2FF', color: '#6366F1' }, supermarkets: { bg: '#FFFBEB', color: '#F59E0B' },
        pharmacies: { bg: '#ECFDF5', color: '#10B981' }, healthcare: { bg: '#FEF2F2', color: '#EF4444' },
        schools: { bg: '#F5F3FF', color: '#8B5CF6' }, parks: { bg: '#F0FDF4', color: '#22C55E' },
        restaurants: { bg: '#FFF7ED', color: '#F97316' }, dogAreas: { bg: '#FAF5FF', color: '#A855F7' },
        nightlife: { bg: '#FDF2F8', color: '#EC4899' },
      };
      const CAT_SVG: Record<string, string> = {
        transport: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
        supermarkets: '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
        pharmacies: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        healthcare: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
        schools: '<path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M18 5v16"/><path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6"/><path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11"/><path d="M6 5v16"/><circle cx="12" cy="9" r="2"/>',
        parks: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
        restaurants: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
        dogAreas: '<path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>',
        nightlife: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      };
      const pin = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
      const esc = (s: string) => (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
      const ac = accent.startsWith('#') ? accent : '#3B83F6';
      const radiusLabel = RADIUS_OPTIONS.find((o) => o.value === radius)?.label || `${radius} m`;
      const sub = (address || '').trim();

      const cats = POI_CATEGORIES.filter((c) => (result[c.key] || []).length);
      const card = (c: typeof POI_CATEGORIES[number]) => {
        const st = CAT_STYLE[c.key] || { bg: '#EEF2FF', color: c.color };
        const pois = result[c.key] || [];
        const shown = pois.slice(0, 8);
        const rest = pois.length - shown.length;
        const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${st.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CAT_SVG[c.key] || ''}</svg>`;
        return `<div class="poi-single-card"><div class="poi-single-card-head"><div class="poi-cat-icon" style="background:${st.bg};color:${st.color}">${icon}</div><span class="poi-single-card-label">${esc(c.label)}</span><span class="poi-single-card-count">${pois.length}</span></div>${shown.map((p) => `<div class="poi-single-row"><span class="poi-single-name">${esc(p.name)}</span><span class="poi-single-dist">${formatDistance(p.distance)}</span></div>`).join('')}${rest > 0 ? `<div class="poi-single-more">+${rest} altri</div>` : ''}</div>`;
      };
      // Righe da 2 card (look a 2 colonne, ma impaginabili per riga).
      const rows: string[] = [];
      for (let i = 0; i < cats.length; i += 2) {
        rows.push(`<div class="poi-row"><div class="poi-col">${card(cats[i])}</div><div class="poi-col">${cats[i + 1] ? card(cats[i + 1]) : ''}</div></div>`);
      }
      const headerHtml = `<div class="poi-header"><div><h1 class="poi-title">Cosa c'è in zona</h1><p class="poi-subtitle">${sub ? esc(sub) + ' — ' : ''}${totalFound} luoghi entro ${radiusLabel}</p></div><div class="poi-radius-badge">${pin} Raggio ${radiusLabel}</div></div>`;
      const mapHtml = mapDataUrl ? `<img class="poi-map" src="${mapDataUrl}">` : '';
      const footerHtml = `<div class="poi-footer"><p class="poi-disclaimer">Dati OpenStreetMap (Overpass API). Distanze in linea d'aria dal punto indicato.</p></div>`;

      // CSS condiviso. Margini su OGNI pagina via padding del foglio fisso A4
      // (indipendente dall'impostazione "Margini" del dialogo di stampa).
      const PAD = 14; // mm
      const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; background: #fff; }
.sheet { width: 210mm; min-height: 297mm; padding: ${PAD}mm; background: #fff; page-break-after: always; }
.sheet:last-child { page-break-after: auto; }
.poi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.poi-title { font-weight: 700; font-size: 20px; color: #111827; margin: 0 0 4px; }
.poi-subtitle { font-weight: 400; font-size: 11px; color: #6B7280; margin: 0; }
.poi-radius-badge { display: flex; align-items: center; gap: 4px; background: ${ac}0f; border: 1px solid ${ac}26; border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 500; color: ${ac}; white-space: nowrap; }
.poi-map { width: 100%; height: 230px; object-fit: cover; border-radius: 12px; border: 1px solid #E5E7EB; margin-bottom: 16px; display: block; }
.poi-row { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 12px; }
.poi-col { flex: 1; min-width: 0; }
.poi-single-card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px; }
.poi-single-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.poi-cat-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.poi-single-card-label { font-size: 11px; font-weight: 600; color: #374151; }
.poi-single-card-count { margin-left: auto; font-size: 10px; font-weight: 700; color: ${ac}; background: ${ac}14; border-radius: 10px; padding: 2px 8px; }
.poi-single-row { display: flex; justify-content: space-between; padding: 3px 0; }
.poi-single-name { font-size: 9px; color: #4B5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.poi-single-dist { font-size: 9px; font-weight: 500; color: #9CA3AF; flex-shrink: 0; margin-left: 12px; }
.poi-single-more { font-size: 8px; color: #9CA3AF; font-style: italic; margin-top: 4px; }
.poi-footer { margin-top: 14px; }
.poi-disclaimer { font-size: 8px; color: #9CA3AF; margin: 0; }`;

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument;
      if (!idoc) { iframe.remove(); return; }

      // Pass 1: misura altezze di header/mappa/righe in un foglio reale.
      idoc.open();
      idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body><div class="sheet" id="m">${headerHtml}${mapHtml}${rows.join('')}<div id="probe" style="width:100mm"></div></div></body></html>`);
      idoc.close();
      await new Promise((r) => setTimeout(r, 450));
      const mimgs = Array.from(idoc.images);
      if (mimgs.length) await Promise.all(mimgs.map((im) => im.complete ? Promise.resolve() : new Promise((res) => { im.onload = im.onerror = () => res(null); })));
      const pxPerMm = (idoc.getElementById('probe')?.getBoundingClientRect().width || 378) / 100;
      const innerPx = (297 - PAD * 2) * pxPerMm;
      const hH = (idoc.querySelector('.poi-header') as HTMLElement)?.offsetHeight || 0;
      const mH = (idoc.querySelector('.poi-map') as HTMLElement)?.offsetHeight || 0;
      const rowEls = Array.from(idoc.querySelectorAll('.poi-row')) as HTMLElement[];
      const rowH = rowEls.map((el) => el.offsetHeight + 12);

      // Pack righe nei fogli (riserva header+mappa sul primo).
      const pages: string[][] = [];
      let cur: string[] = [];
      let used = hH + 16 + (mH ? mH + 16 : 0);
      for (let i = 0; i < rows.length; i++) {
        if (cur.length && used + rowH[i] > innerPx) { pages.push(cur); cur = []; used = 0; }
        cur.push(rows[i]); used += rowH[i];
      }
      if (cur.length || !pages.length) pages.push(cur);

      const sheets = pages.map((pg, idx) =>
        `<div class="sheet">${idx === 0 ? headerHtml + mapHtml : ''}${pg.join('')}${idx === pages.length - 1 ? footerHtml : ''}</div>`
      ).join('');

      // Pass 2: documento finale paginato → stampa.
      idoc.open();
      idoc.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Analisi di zona${sub ? ' - ' + esc(sub) : ''}</title><style>${css}</style></head><body>${sheets}</body></html>`);
      idoc.close();
      await new Promise((r) => setTimeout(r, 450));
      const fimgs = Array.from(idoc.images);
      if (fimgs.length) await Promise.all(fimgs.map((im) => im.complete ? Promise.resolve() : new Promise((res) => { im.onload = im.onerror = () => res(null); })));
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    } finally {
      setPdfBusy(false);
    }
  };

  const toggleCat = (key: string) => setActiveCats((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const openDirections = (poi: Poi) => {
    if (!center) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${center.lat},${center.lng}&destination=${poi.lat},${poi.lng}`;
    window.open(url, '_blank', 'noopener');
  };

  const labelStyle = s('display:block;font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 9px');

  return (
    <div className="max-md:!flex-col" style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes zfadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .zona-card { animation: zfadein .38s ease both; } .leaflet-container { font: inherit; } @keyframes zona-ai-pulse { 0%,100% { fill-opacity: .06; stroke-opacity: .6; stroke-width: 2; } 50% { fill-opacity: .26; stroke-opacity: 1; stroke-width: 3.5; } } .zona-analyzing { animation: zona-ai-pulse 1.3s ease-in-out infinite; fill: ${accent}; stroke: ${accent}; filter: drop-shadow(0 0 6px ${accent}aa); }`}</style>
      {/* LEFT: ricerca + risultati */}
      <div className="max-md:!w-full max-md:!border-r-0 max-md:!order-2" style={{ width: 342, flexShrink: 0, borderRight: '1px solid #ece9e2', background: '#faf9f7', overflowY: 'auto', padding: '22px 16px 36px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={s('margin:0 0 4px;font-size:18px;font-weight:800;letter-spacing:-.3px')}>Analisi di zona</h1>
        <div style={s('color:#8c867d;font-size:12px;margin-bottom:18px')}>Inserisci un indirizzo e scopri cosa c&apos;è in zona.</div>

        {locked && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 9, padding: '9px 11px', marginBottom: 14 }}>
            <Icon name="info" size={14} color="#1d5fd0" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 11, lineHeight: 1.45, color: '#1d5fd0', fontWeight: 600 }}>
              {blocked
                ? <>
                    <div>Hai usato tutte le {FREE_LIMIT} analisi gratuite, i piani Agency le hanno illimitate.</div>
                    <Box as="button" onClick={() => go?.('account')} style={s('border:none;background:#3B83F6;color:#fff;font-size:11px;font-weight:700;padding:7px 13px;border-radius:7px;cursor:pointer;margin-top:7px;display:inline-flex;align-items:center')} hover={s('background:#2563EB')}>Passa a un piano</Box>
                  </>
                : <>Piano Free: {remaining} analisi di zona rimaste su {FREE_LIMIT}. I piani Agency le hanno illimitate.</>}
            </div>
          </div>
        )}

        {/* Dropdown immobili (ricercabile) */}
        {propsWithAddr.length > 0 && (
          <>
            <div style={labelStyle}>Scegli un immobile</div>
            <div ref={pickerRef} style={{ position: 'relative', marginBottom: 13 }}>
              <Box onClick={() => { setPickerOpen((o) => !o); setPickerQ(''); }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${pickerOpen ? accent : '#e4e1da'}`, borderRadius: 9, padding: '9px 11px', cursor: 'pointer' }} hover={{ borderColor: accent }}>
                <Icon name="building-2" size={14} color="#b3aca1" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Seleziona dai tuoi immobili</span>
                <Icon name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#b3aca1" />
              </Box>
              {pickerOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid #e4e1da', borderRadius: 11, boxShadow: '0 8px 28px rgba(0,0,0,.12)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderBottom: '1px solid #f0ede7' }}>
                    <Icon name="search" size={13} color="#b3aca1" />
                    <input autoFocus value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Cerca immobile…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, width: '100%', color: '#211f1c' }} />
                  </div>
                  <div style={{ maxHeight: 216, overflowY: 'auto' }}>
                    {filteredProps.length === 0 && <div style={{ fontSize: 12, color: '#b3aca1', padding: '11px 13px' }}>Nessun risultato.</div>}
                    {filteredProps.map((p) => (
                      <Box key={p.id} onClick={() => { suppressSug.current = true; setAddress(p.addr); setPickerOpen(false); if (!loading && !blocked) runAnalysis(p.addr); }} style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '8px 13px', cursor: 'pointer', borderBottom: '1px solid #f6f4f0' }} hover={{ background: '#faf9f7' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</span>
                        <span style={{ fontSize: 10.5, color: '#b3aca1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.addr}</span>
                      </Box>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Input indirizzo */}
        <div style={labelStyle}>{propsWithAddr.length > 0 ? 'Oppure inserisci un indirizzo' : 'Indirizzo'}</div>
        <div ref={sugBoxRef} style={{ position: 'relative', marginBottom: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${sugOpen ? accent : '#e4e1da'}`, borderRadius: 9, padding: '9px 11px' }}>
            <Icon name="map-pin" size={14} color="#b3aca1" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => { if (addrSug.length) setSugOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading && address.trim()) { setSugOpen(false); runAnalysis(); } if (e.key === 'Escape') setSugOpen(false); }}
              placeholder="Es. Via Fiori Chiari 12, Milano"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#211f1c' }}
            />
            {address && <span onClick={() => { suppressSug.current = true; setAddress(''); setAddrSug([]); setSugOpen(false); }} style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={13} color="#b3aca1" /></span>}
            {geoEnabled && (
              <span onClick={() => { if (!locating) useMyLocation(); }} title="Usa la mia posizione" style={{ cursor: locating ? 'default' : 'pointer', display: 'flex', paddingLeft: 4, borderLeft: '1px solid #f0ede7' }}>
                {locating
                  ? <span style={{ width: 14, height: 14, border: `2px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  : <Icon name="crosshair" size={15} color={accent} />}
              </span>
            )}
          </div>
          {sugOpen && addrSug.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e4e1da', borderRadius: 9, boxShadow: '0 12px 32px rgba(33,31,28,.12)', zIndex: 30, overflow: 'hidden' }}>
              {addrSug.map((hit, i) => (
                <Box key={`${hit.lat},${hit.lng},${i}`} onClick={() => pickSuggestion(hit)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', cursor: 'pointer', borderBottom: i < addrSug.length - 1 ? '1px solid #f6f4f0' : 'none' }} hover={{ background: '#faf9f7' }}>
                  <Icon name="map-pin" size={13} color="#b3aca1" />
                  <span style={{ fontSize: 12, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hit.label}</span>
                </Box>
              ))}
            </div>
          )}
        </div>

        {/* Raggio */}
        <div style={labelStyle}>Raggio</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {RADIUS_OPTIONS.map((opt) => {
            const on = radius === opt.value;
            return (
              <Box key={opt.value} onClick={() => setRadius(opt.value)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, border: `1.5px solid ${on ? accent : '#e4e1da'}`, background: on ? '#eef4fe' : '#fff', color: on ? accent : '#8c867d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} hover={{ borderColor: accent }}>
                {opt.label}
              </Box>
            );
          })}
        </div>

        {/* CTA analizza */}
        {(() => {
          const disabled = loading || blocked || !address.trim();
          return (
            <Box as="button" onClick={() => runAnalysis()} disabled={disabled} style={{ border: 'none', background: disabled ? '#d8d4cb' : accent, color: '#fff', fontSize: 13, fontWeight: 700, padding: '11px 16px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 20, opacity: loading ? 0.7 : 1, transition: 'background .15s' }} hover={disabled ? {} : { background: '#2563EB' }}>
              {loading ? <><span style={{ width: 13.5, height: 13.5, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />Analisi…</> : <><Icon name="navigation" size={14} color="#fff" />Analizza zona</>}
            </Box>
          );
        })()}

        {/* Secondary: scarica PDF dell'analisi (sotto Analizza zona) */}
        {result && (
          <div style={{ marginTop: -11, marginBottom: 20 }}>
            <Box as="button" onClick={downloadPdf} disabled={pdfBusy} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${accent}`, background: '#fff', color: accent, fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 10, cursor: pdfBusy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pdfBusy ? 0.6 : 1, transition: 'background .15s' }} hover={pdfBusy ? {} : { background: '#eef4fe' }}>
              <Icon name="download" size={14} color={accent} />{pdfBusy ? 'Preparo il PDF…' : 'Scarica PDF'}
            </Box>
          </div>
        )}

        {/* Risultati */}
        {result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={labelStyle}>Cosa c&apos;è in zona</div>
              <span style={{ fontSize: 11, color: '#8c867d', fontWeight: 600 }}>{totalFound} luoghi</span>
            </div>
            <div key={resultId} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {POI_CATEGORIES.filter((cat) => (result[cat.key] || []).length > 0).map((cat, idx) => {
                const pois = result[cat.key] || [];
                const isOpen = expanded === cat.key;
                const isActive = activeCats.has(cat.key);
                const nearest = pois[0];
                return (
                  <div key={cat.key} className="zona-card" style={{ animationDelay: `${idx * 70}ms`, background: '#fff', border: '1px solid #e4e1da', borderRadius: 11, overflow: 'hidden', opacity: isActive ? 1 : 0.45, transition: 'opacity .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : cat.key)}>
                      <span onClick={(e) => { e.stopPropagation(); toggleCat(cat.key); }} title={isActive ? 'Nascondi sulla mappa' : 'Mostra sulla mappa'} style={{ width: 27, height: 27, borderRadius: 7, flexShrink: 0, background: isActive ? cat.color : '#f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon name={cat.icon} size={14} color={isActive ? '#fff' : '#b3aca1'} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#211f1c' }}>{cat.label}</div>
                        <div style={{ fontSize: 10.5, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nearest ? `Più vicino: ${formatDistance(nearest.distance)}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent, minWidth: 20, textAlign: 'right' }}>{pois.length}</span>
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={13.5} color="#b3aca1" />
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #f0ede7', maxHeight: 216, overflowY: 'auto' }}>
                        {pois.slice(0, 30).map((poi) => (
                          <Box key={`${poi.id}`} onClick={() => openDirections(poi)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px 7px 47px', borderBottom: '1px solid #f6f4f0', cursor: 'pointer' }} hover={{ background: '#faf9f7' }}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{poi.name}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#8c867d', flexShrink: 0 }}>{formatDistance(poi.distance)}</div>
                          </Box>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* RIGHT: mappa — isolata: i z-index interni di Leaflet (fino a ~1000) restano
          contenuti qui e non sfondano sopra l'header/tray dell'app. */}
      <div className="max-md:!order-1 max-md:!flex-none max-md:!w-full max-md:!aspect-video" style={{ flex: 1, minWidth: 0, position: 'relative', background: '#e8ebef', isolation: 'isolate', zIndex: 0 }}>
        <div ref={mapEl} style={{ position: 'absolute', inset: 0 }} />

        {/* Controlli disegno area (in alto a destra) */}
        <div style={{ position: 'absolute', top: 13, right: 13, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
          {!drawMode ? (
            <div style={{ display: 'flex', gap: 7 }}>
              {area && (
                <Box as="button" onClick={() => removeAreaRef.current()} title="Rimuovi area" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 9, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.10)' }} hover={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  <Icon name="x" size={13.5} color="currentColor" />Rimuovi area
                </Box>
              )}
              <Box as="button" onClick={startDraw} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: area ? accent : '#fff', color: area ? '#fff' : '#211f1c', border: `1px solid ${area ? accent : '#e4e1da'}`, borderRadius: 9, padding: '8px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.10)' }} hover={{ borderColor: accent }}>
                <Icon name="navigation" size={13.5} color={area ? '#fff' : accent} />{area ? 'Ridisegna area' : 'Disegna area'}
              </Box>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 11, padding: 11, boxShadow: '0 4px 18px rgba(0,0,0,.12)', width: 207 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#211f1c', marginBottom: 4 }}>Disegna l&apos;area</div>
              <div style={{ fontSize: 10.5, color: '#8c867d', lineHeight: 1.4, marginBottom: 9 }}>Clicca sulla mappa per aggiungere i vertici ({drawPoints.length}).</div>
              <Box as="button" onClick={() => runAreaAnalysis()} disabled={drawPoints.length < 3 || loading} style={{ width: '100%', textAlign: 'center', background: drawPoints.length < 3 ? '#d8d4cb' : accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: drawPoints.length < 3 ? 'not-allowed' : 'pointer', marginBottom: 5 }} hover={drawPoints.length < 3 ? {} : { background: '#2563EB' }}>
                Analizza area
              </Box>
              <div style={{ display: 'flex', gap: 5 }}>
                <Box as="button" onClick={undoPoint} disabled={!drawPoints.length} style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 8, padding: '6px 0', fontSize: 11.5, fontWeight: 600, cursor: drawPoints.length ? 'pointer' : 'not-allowed' }} hover={{ borderColor: '#211f1c', color: '#211f1c' }}>
                  Annulla punto
                </Box>
                <Box as="button" onClick={cancelDraw} style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 8, padding: '6px 0', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }} hover={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  Esci
                </Box>
              </div>
            </div>
          )}
        </div>

        {!result && !loading && !drawMode && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.92)', borderRadius: 13, padding: '18px 23px', textAlign: 'center', boxShadow: '0 4px 18px rgba(0,0,0,.08)' }}>
              <div style={{ width: 43, height: 43, borderRadius: 13, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 9px' }}><Icon name="map-pin" size={20} color={accent} /></div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Analizza una zona</div>
              <div style={{ fontSize: 12, color: '#8c867d', maxWidth: 234 }}>Inserisci un indirizzo, oppure disegna un&apos;area sulla mappa per vedere i servizi.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
