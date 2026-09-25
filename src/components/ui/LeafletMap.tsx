'use client';

import { useEffect, useRef, useState } from 'react';

// Mappa di un indirizzo, sempre Leaflet (gratis, niente chiavi): mappa grigia Esri senza negozi e locali,
// indirizzo cercato su Nominatim (con 700 ms di attesa mentre si scrive, per non chiamarlo a ogni lettera).
// `circle`: zona indicativa (cerchio di 250 m) invece del punto esatto.
export default function LeafletMap({ addr, className = '', circle, color = '#2563eb', onMissing }: { addr: string; className?: string; circle?: boolean; color?: string; onMissing?: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let map: import('leaflet').Map | null = null, stop = false;
    const t = setTimeout(async () => {
      if (!document.getElementById('leaflet-css')) Object.assign(document.head.appendChild(document.createElement('link')), { id: 'leaflet-css', rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' });
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(addr)}`).then(x => x.json()).catch(() => null) as { lat: string; lon: string }[] | null;
      if (stop || !el.current) return;
      if (!r?.[0]) { setMissing(true); onMissing?.(); return; }
      setMissing(false);
      const mod = await import('leaflet'); const L = (mod.default ?? mod) as typeof import('leaflet');
      if (stop || !el.current) return;
      const ll: [number, number] = [Number(r[0].lat), Number(r[0].lon)];
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView(ll, 15);
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18, attribution: '© Esri, OpenStreetMap' }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18 }).addTo(map);
      const c = getComputedStyle(el.current).getPropertyValue('--c').trim() || color;
      if (circle) L.circle(ll, { radius: 250, color: c, fillColor: c, fillOpacity: 0.18, weight: 2 }).addTo(map);
      else L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: c, fillOpacity: 1 }).addTo(map);
    }, 700);
    return () => { stop = true; clearTimeout(t); map?.remove(); };
  }, [addr, circle, color, onMissing]);
  if (missing && onMissing) return null;
  return <div ref={el} className={`relative z-0 overflow-hidden ${className}`} />;
}
