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
  geocodeAddress, reverseGeocode, fetchZona, fetchZonaArea, centroid, formatDistance,
  type ZonaResult, type Poi, type GeocodeHit, type LatLng,
} from '@/lib/poi';
import { getGeoEnabled } from '@/lib/prefs';

const FREE_LIMIT = 5;
const USAGE_KEY = 'gnm-zona-used';

function getUsage(): number {
  if (typeof window === 'undefined') return 0;
  try { return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10) || 0; } catch { return 0; }
}
function bumpUsage(): number {
  const n = getUsage() + 1;
  try { localStorage.setItem(USAGE_KEY, String(n)); } catch { /* ignore */ }
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

  // All'apertura: chiedi la geolocalizzazione e precompila con la mia via
  // (reverse geocode). Niente prefill della città a caso.
  const geoAsked = useRef(false);
  useEffect(() => {
    if (geoAsked.current) return;
    geoAsked.current = true;
    if (!getGeoEnabled()) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (addr) setAddress((cur) => cur.trim() ? cur : addr);
        } catch { /* ignore */ }
      },
      () => { /* permesso negato: lascia vuoto */ },
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
  const [usage, setUsage] = useState(0);

  // Disegno area sulla mappa
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<LatLng[]>([]);
  const [area, setArea] = useState<LatLng[] | null>(null);

  useEffect(() => { setUsage(getUsage()); }, []);
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
      // fix dimensioni dopo il mount
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const colorOf = useCallback((key: string) => POI_CATEGORIES.find((c) => c.key === key)?.color || accent, []);
  const removeAreaRef = useRef<() => void>(() => {});

  // Ridisegna i marker quando cambiano risultati / filtri.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const group = markersRef.current;
    if (!L || !map || !group) return;
    group.clearLayers();

    if (area && area.length >= 3) {
      // area disegnata: poligono NON interattivo (i click sulla mappa restano per
      // pan/zoom; la rimozione avviene dal bottone dedicato).
      L.polygon(area.map((p) => [p.lat, p.lng]), { color: accent, weight: 2, opacity: 0.7, fillOpacity: 0.06, interactive: false }).addTo(group);
    } else if (center && !drawMode) {
      // marker centro (immobile/indirizzo) + cerchio raggio (nascosto durante il disegno)
      const html = `<div style="width:22px;height:22px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`;
      const icon = L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
      centerMarkerRef.current = L.marker([center.lat, center.lng], { icon, zIndexOffset: 1000 }).addTo(group);
      L.circle([center.lat, center.lng], { radius, color: accent, weight: 1, opacity: 0.4, fillOpacity: 0.05 }).addTo(group);
    }

    const bounds: [number, number][] = [];
    if (area && area.length >= 3) for (const p of area) bounds.push([p.lat, p.lng]);
    else if (center) bounds.push([center.lat, center.lng]);
    if (result) {
      for (const cat of POI_CATEGORIES) {
        if (!activeCats.has(cat.key)) continue;
        for (const poi of result[cat.key] || []) {
          const html = `<div style="width:12px;height:12px;border-radius:50%;background:${cat.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
          const icon = L.divIcon({ html, className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
          const m = L.marker([poi.lat, poi.lng], { icon });
          m.bindTooltip(`${poi.name} · ${formatDistance(poi.distance)}`, { direction: 'top' });
          m.addTo(group);
          bounds.push([poi.lat, poi.lng]);
        }
      }
    }
    if (!drawMode) {
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      else if (center) map.setView([center.lat, center.lng], 15);
    }
  }, [result, center, activeCats, radius, area, drawMode, colorOf]);

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
        const sz = canClose ? 18 : 14;
        const html = canClose
          ? `<div style="width:18px;height:18px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`
          : `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${accent};box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;
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
      const firstNonEmpty = POI_CATEGORIES.find((c) => (data[c.key] || []).length > 0);
      setExpanded(firstNonEmpty?.key || null);
      if (locked) setUsage(bumpUsage());
    } catch (e) {
      const msg = e instanceof Error && e.message === 'overpass_unreachable'
        ? 'Servizio dati temporaneamente non disponibile, riprova'
        : 'Errore durante l\'analisi';
      toast(msg, 'x');
    } finally {
      setLoading(false);
    }
  };

  // Usa la posizione attuale: reverse geocode → indirizzo → analizza.
  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { toast('Geolocalizzazione non disponibile', 'x'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (addr) { setAddress(addr); await runAnalysis(addr); }
          else { toast('Posizione non trovata', 'x'); setLoading(false); }
        } catch { toast('Errore posizione', 'x'); setLoading(false); }
      },
      () => { toast('Permesso posizione negato', 'x'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Rimuove l'area disegnata e ripristina il cerchio attorno all'ultimo indirizzo.
  const removeArea = async () => {
    setArea(null);
    setDrawPoints([]);
    if (!addrCenter) { setCenter(null); setResult(null); return; }
    setCenter(addrCenter);
    setLoading(true);
    try {
      const data = await fetchZona(addrCenter.lat, addrCenter.lng, radius);
      setResult(data);
      setResultId((n) => n + 1);
      const firstNonEmpty = POI_CATEGORIES.find((c) => (data[c.key] || []).length > 0);
      setExpanded(firstNonEmpty?.key || null);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
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
    try {
      const c = centroid(points);
      // Analisi SOLO dentro il poligono disegnato (filtro poly Overpass).
      const data = await fetchZonaArea(points);
      let label = 'Area selezionata';
      try { const addr = await reverseGeocode(c.lat, c.lng); if (addr) label = addr; } catch { /* ignore */ }
      const hit = { lat: c.lat, lng: c.lng, label };
      setArea(points);
      setAddress(label);
      setAddrCenter(hit);
      setCenter(hit);
      setResult(data);
      setResultId((n) => n + 1);
      const firstNonEmpty = POI_CATEGORIES.find((cat) => (data[cat.key] || []).length > 0);
      setExpanded(firstNonEmpty?.key || null);
      if (locked) setUsage(bumpUsage());
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

  const labelStyle = s('display:block;font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px');

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes zfadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .zona-card { animation: zfadein .38s ease both; } .leaflet-container { font: inherit; }`}</style>
      {/* LEFT: ricerca + risultati */}
      <div className="max-md:!hidden" style={{ width: 380, flexShrink: 0, borderRight: '1px solid #ece9e2', background: '#faf9f7', overflowY: 'auto', padding: '24px 18px 40px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={s('margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:-.3px')}>Analisi di zona</h1>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:20px')}>Inserisci un indirizzo e scopri cosa c&apos;è in zona.</div>

        {locked && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <Icon name="info" size={15} color="#1d5fd0" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 12, lineHeight: 1.45, color: '#1d5fd0', fontWeight: 600 }}>
              {blocked
                ? <>Hai usato tutte le {FREE_LIMIT} analisi gratuite. <span onClick={() => go?.('account')} style={{ textDecoration: 'underline', fontWeight: 800, cursor: 'pointer' }}>Passa a un piano</span> per analisi illimitate.</>
                : <>Piano Free: {remaining} analisi di zona rimaste su {FREE_LIMIT}. I piani Agency le hanno illimitate.</>}
            </div>
          </div>
        )}

        {/* Dropdown immobili (ricercabile) */}
        {propsWithAddr.length > 0 && (
          <>
            <div style={labelStyle}>Scegli un immobile</div>
            <div ref={pickerRef} style={{ position: 'relative', marginBottom: 14 }}>
              <Box onClick={() => { setPickerOpen((o) => !o); setPickerQ(''); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${pickerOpen ? accent : '#e4e1da'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }} hover={{ borderColor: accent }}>
                <Icon name="building-2" size={16} color="#b3aca1" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Seleziona dai tuoi immobili</span>
                <Icon name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#b3aca1" />
              </Box>
              {pickerOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid #e4e1da', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,.12)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid #f0ede7' }}>
                    <Icon name="search" size={14} color="#b3aca1" />
                    <input autoFocus value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Cerca immobile…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#211f1c' }} />
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {filteredProps.length === 0 && <div style={{ fontSize: 13, color: '#b3aca1', padding: '12px 14px' }}>Nessun risultato.</div>}
                    {filteredProps.map((p) => (
                      <Box key={p.id} onClick={() => { setAddress(p.addr); setPickerOpen(false); if (!loading && !blocked) runAnalysis(p.addr); }} style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f6f4f0' }} hover={{ background: '#faf9f7' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</span>
                        <span style={{ fontSize: 11.5, color: '#b3aca1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.addr}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          <Icon name="map-pin" size={16} color="#b3aca1" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && address.trim()) runAnalysis(); }}
            placeholder="Es. Via Fiori Chiari 12, Milano"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, width: '100%', color: '#211f1c' }}
          />
          {address && <span onClick={() => setAddress('')} style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={14} color="#b3aca1" /></span>}
          {geoEnabled && (
            <span onClick={useMyLocation} title="Usa la mia posizione" style={{ cursor: 'pointer', display: 'flex', paddingLeft: 4, borderLeft: '1px solid #f0ede7' }}>
              <Icon name="crosshair" size={17} color={accent} />
            </span>
          )}
        </div>

        {/* Raggio */}
        <div style={labelStyle}>Raggio</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {RADIUS_OPTIONS.map((opt) => {
            const on = radius === opt.value;
            return (
              <Box key={opt.value} onClick={() => setRadius(opt.value)} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, border: `1.5px solid ${on ? accent : '#e4e1da'}`, background: on ? '#eef4fe' : '#fff', color: on ? accent : '#8c867d', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} hover={{ borderColor: accent }}>
                {opt.label}
              </Box>
            );
          })}
        </div>

        {/* CTA analizza */}
        {(() => {
          const disabled = loading || blocked || !address.trim();
          return (
            <Box as="button" onClick={() => runAnalysis()} disabled={disabled} style={{ border: 'none', background: disabled ? '#d8d4cb' : accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 18px', borderRadius: 11, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22, opacity: loading ? 0.7 : 1, transition: 'background .15s' }} hover={disabled ? {} : { background: '#2563EB' }}>
              {loading ? <><span style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />Analisi…</> : <><Icon name="navigation" size={16} color="#fff" />Analizza zona</>}
            </Box>
          );
        })()}

        {/* Risultati */}
        {result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={labelStyle}>Cosa c&apos;è in zona</div>
              <span style={{ fontSize: 12, color: '#8c867d', fontWeight: 600 }}>{totalFound} luoghi</span>
            </div>
            <div key={resultId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POI_CATEGORIES.filter((cat) => (result[cat.key] || []).length > 0).map((cat, idx) => {
                const pois = result[cat.key] || [];
                const isOpen = expanded === cat.key;
                const isActive = activeCats.has(cat.key);
                const nearest = pois[0];
                return (
                  <div key={cat.key} className="zona-card" style={{ animationDelay: `${idx * 70}ms`, background: '#fff', border: '1px solid #e4e1da', borderRadius: 12, overflow: 'hidden', opacity: isActive ? 1 : 0.45, transition: 'opacity .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : cat.key)}>
                      <span onClick={(e) => { e.stopPropagation(); toggleCat(cat.key); }} title={isActive ? 'Nascondi sulla mappa' : 'Mostra sulla mappa'} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: isActive ? cat.color : '#f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon name={cat.icon} size={16} color={isActive ? '#fff' : '#b3aca1'} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#211f1c' }}>{cat.label}</div>
                        <div style={{ fontSize: 11.5, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nearest ? `Più vicino: ${formatDistance(nearest.distance)}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: accent, minWidth: 22, textAlign: 'right' }}>{pois.length}</span>
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#b3aca1" />
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #f0ede7', maxHeight: 240, overflowY: 'auto' }}>
                        {pois.slice(0, 30).map((poi) => (
                          <Box key={`${poi.id}`} onClick={() => openDirections(poi)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 52px', borderBottom: '1px solid #f6f4f0', cursor: 'pointer' }} hover={{ background: '#faf9f7' }}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{poi.name}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8c867d', flexShrink: 0 }}>{formatDistance(poi.distance)}</div>
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

      {/* RIGHT: mappa */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', background: '#e8ebef' }}>
        <div ref={mapEl} style={{ position: 'absolute', inset: 0 }} />

        {/* Controlli disegno area (in alto a destra) */}
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {!drawMode ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {area && (
                <Box as="button" onClick={() => removeAreaRef.current()} title="Rimuovi area" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.10)' }} hover={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  <Icon name="x" size={15} color="currentColor" />Rimuovi area
                </Box>
              )}
              <Box as="button" onClick={startDraw} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: area ? accent : '#fff', color: area ? '#fff' : '#211f1c', border: `1px solid ${area ? accent : '#e4e1da'}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.10)' }} hover={{ borderColor: accent }}>
                <Icon name="navigation" size={15} color={area ? '#fff' : accent} />{area ? 'Ridisegna area' : 'Disegna area'}
              </Box>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 12, padding: 12, boxShadow: '0 4px 18px rgba(0,0,0,.12)', width: 230 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#211f1c', marginBottom: 4 }}>Disegna l&apos;area</div>
              <div style={{ fontSize: 11.5, color: '#8c867d', lineHeight: 1.4, marginBottom: 10 }}>Clicca sulla mappa per aggiungere i vertici ({drawPoints.length}).</div>
              <Box as="button" onClick={() => runAreaAnalysis()} disabled={drawPoints.length < 3 || loading} style={{ width: '100%', textAlign: 'center', background: drawPoints.length < 3 ? '#d8d4cb' : accent, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: drawPoints.length < 3 ? 'not-allowed' : 'pointer', marginBottom: 6 }} hover={drawPoints.length < 3 ? {} : { background: '#2563EB' }}>
                Analizza area
              </Box>
              <div style={{ display: 'flex', gap: 6 }}>
                <Box as="button" onClick={undoPoint} disabled={!drawPoints.length} style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 9, padding: '7px 0', fontSize: 12.5, fontWeight: 600, cursor: drawPoints.length ? 'pointer' : 'not-allowed' }} hover={{ borderColor: '#211f1c', color: '#211f1c' }}>
                  Annulla punto
                </Box>
                <Box as="button" onClick={cancelDraw} style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#8c867d', border: '1px solid #e4e1da', borderRadius: 9, padding: '7px 0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  Esci
                </Box>
              </div>
            </div>
          )}
        </div>

        {!result && !loading && !drawMode && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.92)', borderRadius: 14, padding: '20px 26px', textAlign: 'center', boxShadow: '0 4px 18px rgba(0,0,0,.08)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon name="map-pin" size={22} color={accent} /></div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Analizza una zona</div>
              <div style={{ fontSize: 13, color: '#8c867d', maxWidth: 260 }}>Inserisci un indirizzo, oppure disegna un&apos;area sulla mappa per vedere i servizi.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
