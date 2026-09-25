'use client';

import { useEffect, useRef, useState } from 'react';

// Mappa di un indirizzo, sempre Leaflet (gratis, niente chiavi): mappa grigia Esri senza negozi e locali,
// indirizzo cercato su Nominatim (con 700 ms di attesa mentre si scrive, per non chiamarlo a ogni lettera).
// `circle`: zona indicativa (cerchio di 250 m) invece del punto esatto.
// Stessa mappa della pagina Immobili: + e - in basso a sinistra (angoli 16, ombra), pizzico del trackpad per lo zoom,
// `photo`: pin con la foto tonda come nella pagina Immobili.
export default function LeafletMap({ addr, className = '', circle, color = '#2563eb', photo, onMissing }: { addr: string; className?: string; circle?: boolean; color?: string; photo?: string; onMissing?: () => void }) {
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
      const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0, zoomDelta: 0.5 }).setView(ll, 15);
      map = m;
      m.attributionControl.setPrefix(false).setPosition('bottomright');
      const esri = (l: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_${l}/MapServer/tile/{z}/{y}/{x}`;
      L.tileLayer(esri('Base'), { maxNativeZoom: 16, maxZoom: 19, attribution: '© Esri, OpenStreetMap' }).addTo(m);
      L.tileLayer(esri('Reference'), { maxNativeZoom: 16, maxZoom: 19 }).addTo(m);
      L.control.zoom({ position: 'bottomleft', zoomInTitle: 'Avvicina', zoomOutTitle: 'Allontana' }).addTo(m);
      // stile come nella pagina Immobili (il CSS di Leaflet, caricato dopo, vincerebbe sulle classi)
      const bar = m.getContainer().querySelector<HTMLElement>('.leaflet-control-zoom')!;
      Object.assign(bar.style, { border: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,.12)' });
      bar.querySelectorAll<HTMLElement>('a').forEach(a => Object.assign(a.style, { width: '36px', height: '36px', lineHeight: '36px', color: '#111', border: '0' }));
      // pizzico sul trackpad (rotella con ctrlKey): zoom sotto le dita; lo scorrimento normale resta alla pagina
      m.getContainer().addEventListener('wheel', e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() - e.deltaY * 0.012, { animate: false });
      }, { passive: false });
      const c = getComputedStyle(el.current).getPropertyValue('--c').trim() || color;
      if (circle) L.circle(ll, { radius: 250, color: c, fillColor: c, fillOpacity: 0.18, weight: 2 }).addTo(m);
      else if (photo) L.marker(ll, { icon: L.divIcon({ html: `<div style="width:48px;height:48px;border-radius:9999px;overflow:hidden;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25);background:#eee"><img src="${encodeURI(photo)}" alt="" style="width:100%;height:100%;object-fit:cover" /></div>`, className: '', iconSize: [48, 48], iconAnchor: [24, 24] }) }).addTo(m);
      else L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: c, fillOpacity: 1 }).addTo(m);
    }, 700);
    return () => { stop = true; clearTimeout(t); map?.remove(); };
  }, [addr, circle, color, photo, onMissing]);
  if (missing && onMissing) return null;
  return <div ref={el} className={`relative z-0 overflow-hidden ${className}`} />;
}
