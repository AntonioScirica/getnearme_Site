'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { CREDIT_COST } from '@/lib/pricing';
import { tr } from './i18n';

// "Foto da un punto" sulla planimetria: l'agente mette una fotocamera finta sulla pianta (tocco), la sposta trascinando
// il punto, la gira trascinando la maniglia in cima al cono e ne sceglie l'ampiezza. Coordinate normalizzate (0-1) sul
// disegno, angolo in gradi (0 = verso destra, senso orario come lo schermo): il server disegna lo stesso cono in rosso
// sulla pianta e chiede la foto vista da li' (api/platform/photo-edit, plan: 'camera').
export type PlanCam = { x: number; y: number; a: number; fov: number };
const STYLES = [['modern', tr('Moderno', 'Modern')], ['nordic', tr('Nordico', 'Nordic')], ['industrial', 'Luxury'], ['boho', 'Boho']] as const;

export default function PlanCamera({ src, onClose, onConfirm }: { src: string; onClose: () => void; onConfirm: (cam: PlanCam, style: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // la fotocamera c'e' gia' all'apertura: al centro della pianta, guarda in su (si sposta e si gira subito)
  const [cam, setCam] = useState<PlanCam | null>({ x: 0.5, y: 0.55, a: -90, fov: 70 });
  const [style, setStyle] = useState<string>('modern');
  const drag = useRef<'move' | 'turn' | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const pos = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const down = (e: React.PointerEvent) => {
    const p = pos(e);
    const t = (e.target as Element).getAttribute('data-h');
    e.currentTarget.setPointerCapture(e.pointerId);
    if (t === 'turn' || t === 'move') { drag.current = t; return; }
    // tocco sulla pianta: la fotocamera va li' (la prima volta guarda verso il centro del disegno)
    setCam(c => ({ x: p.x, y: p.y, a: c?.a ?? Math.round(Math.atan2(0.5 - p.y, 0.5 - p.x) * 180 / Math.PI), fov: c?.fov ?? 70 }));
    drag.current = 'move';
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !cam) return;
    const p = pos(e);
    if (drag.current === 'move') setCam({ ...cam, x: p.x, y: p.y });
    else setCam({ ...cam, a: Math.round(Math.atan2((p.y - cam.y) * size.h, (p.x - cam.x) * size.w) * 180 / Math.PI) });
  };

  // cono in pixel dello schermo: lungo un terzo del lato corto
  const L = Math.min(size.w, size.h) * 0.34;
  const cx = (cam?.x ?? 0) * size.w, cy = (cam?.y ?? 0) * size.h;
  const ray = (deg: number, len = L) => [cx + Math.cos(deg * Math.PI / 180) * len, cy + Math.sin(deg * Math.PI / 180) * len];
  const [l1x, l1y] = ray((cam?.a ?? 0) - (cam?.fov ?? 70) / 2), [l2x, l2y] = ray((cam?.a ?? 0) + (cam?.fov ?? 70) / 2), [hx, hy] = ray(cam?.a ?? 0, L * 0.92);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">{tr('Da dove scatti la foto?', 'Where do you take the photo from?')}</h2>
            <p className="mt-1 text-sm text-muted">{tr('Trascina la fotocamera dove ti metti, il cerchio bianco per girarla. Puoi anche toccare la pianta.', 'Drag the camera where you stand, the white circle to turn it. You can also tap the plan.')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>

        <div className="mt-4 flex min-h-0 justify-center rounded-[24px] bg-canvas p-2">
          <div ref={box} className="relative inline-block touch-none select-none" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} style={{ cursor: cam ? 'crosshair' : 'copy' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} className="block max-h-[52vh] w-auto max-w-full rounded-[16px]" onLoad={e => setSize({ w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight })} />
            {cam && size.w > 0 && (
              <svg className="absolute inset-0" width={size.w} height={size.h}>
                <path d={`M${cx},${cy} L${l1x},${l1y} A${L},${L} 0 0 1 ${l2x},${l2y} Z`} fill="rgba(83,126,236,.22)" stroke="#537eec" strokeWidth={2} />
                <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#537eec" strokeWidth={2} strokeDasharray="4 4" />
                <circle data-h="turn" cx={hx} cy={hy} r={11} fill="#fff" stroke="#537eec" strokeWidth={3} style={{ cursor: 'grab' }} />
                {/* fotocamera vista dall'alto, girata verso il cono: corpo e obiettivo */}
                <g transform={`translate(${cx} ${cy}) rotate(${cam.a})`} style={{ cursor: 'move' }} filter="drop-shadow(0 4px 8px rgba(0,0,0,.25))">
                  <rect data-h="move" x={-17} y={-13} width={26} height={26} rx={7} fill="#537eec" stroke="#fff" strokeWidth={2.5} />
                  <rect data-h="move" x={9} y={-7} width={9} height={14} rx={3} fill="#1d1d1f" stroke="#fff" strokeWidth={2} />
                  <circle data-h="move" cx={-4} cy={0} r={5} fill="#fff" />
                </g>
              </svg>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-muted">{tr('Ampiezza', 'Width')}</span>
              <input type="range" min={45} max={100} value={cam?.fov ?? 70} disabled={!cam} onChange={e => cam && setCam({ ...cam, fov: Number(e.target.value) })} className="w-full accent-[#537eec]" />
              <span className="w-10 text-right tabular-nums text-muted">{cam?.fov ?? 70}°</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-sm text-muted">{tr('Stile', 'Style')}</span>
              {STYLES.map(([id, l]) => (
                <button key={id} type="button" onClick={() => setStyle(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ease-smooth transition-colors ${style === id ? 'bg-ink text-white' : 'bg-white text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-canvas'}`}>{l}</button>
              ))}
            </div>
          </div>
          <button type="button" disabled={!cam} onClick={() => cam && onConfirm({ x: +cam.x.toFixed(4), y: +cam.y.toFixed(4), a: cam.a, fov: cam.fov }, style)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">
            <Camera size={16} /> {tr('Crea foto', 'Create photo')} <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{CREDIT_COST.arreda}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// La fotocamera scelta disegnata sulla pianta (stesso disegno del popup), sopra la planimetria mostrata intera
// (object-contain): viewBox con le proporzioni della pianta e "meet", cosi' combacia con l'immagine.
export function CamMark({ cam, ratio }: { cam: PlanCam; ratio: number }) {
  const W = 1000, H = W / ratio, L = Math.min(W, H) * 0.34, cx = cam.x * W, cy = cam.y * H, k = Math.min(W, H) / 400
  const ray = (d: number, len = L) => [cx + Math.cos(d * Math.PI / 180) * len, cy + Math.sin(d * Math.PI / 180) * len]
  const [x1, y1] = ray(cam.a - cam.fov / 2), [x2, y2] = ray(cam.a + cam.fov / 2)
  return (
    <svg className="pointer-events-none absolute inset-0 z-[7] h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <path d={`M${cx},${cy} L${x1},${y1} A${L},${L} 0 0 1 ${x2},${y2} Z`} fill="rgba(83,126,236,.22)" stroke="#537eec" strokeWidth={2 * k} />
      <g transform={`translate(${cx} ${cy}) rotate(${cam.a}) scale(${k})`}>
        <rect x={-17} y={-13} width={26} height={26} rx={7} fill="#537eec" stroke="#fff" strokeWidth={2.5} />
        <rect x={9} y={-7} width={9} height={14} rx={3} fill="#1d1d1f" stroke="#fff" strokeWidth={2} />
        <circle cx={-4} cy={0} r={5} fill="#fff" />
      </g>
    </svg>
  );
}
