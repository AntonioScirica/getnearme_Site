'use client';

import { useEffect, useRef, useState } from 'react';

// Condiviso: Foto AI (dashboard) e Sistema con AI (piattaforma). Keyframes gnm-slider-* in globals.css.
// ── Inline slider overlay (renders inside the photo container during reveal) ──
// Two-phase: line sweeps top→bottom + handle pops (showImages=false), then the
// before/after images fade in (showImages=true). Stays mounted across the
// transition so the line/handle CSS animations play once and don't replay.
export default function InlineSlider({ before, after, isVertical, showImages, interactive }: { before: string; after: string; isVertical: boolean; showImages: boolean; interactive: boolean }) {
  const [pos, setPos] = useState(50);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const userTouched = useRef(false);

  const updateFromEvent = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    userTouched.current = true;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };

  useEffect(() => {
    if (!interactive) return;
    const move = (e: MouseEvent) => { if (dragging.current) updateFromEvent(e.clientX); };
    const up = () => { dragging.current = false; };
    const tmove = (e: TouchEvent) => { if (dragging.current && e.touches[0]) updateFromEvent(e.touches[0].clientX); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', tmove);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', tmove); window.removeEventListener('touchend', up); };
  }, [interactive]);

  useEffect(() => {
    if (!showImages) return;
    let raf: number;
    let start = 0;
    const delay = setTimeout(() => {
      if (userTouched.current) return;
      const tick = (t: number) => {
        if (userTouched.current) return;
        if (!start) start = t;
        const elapsed = (t - start) / 1000;
        setPos(50 + Math.sin(elapsed * 0.8) * 18);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 1100);
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); };
  }, [showImages]);

  return (
    <div
      ref={boxRef}
      onMouseDown={interactive ? e => { e.stopPropagation(); dragging.current = true; updateFromEvent(e.clientX); } : undefined}
      onTouchStart={interactive ? e => { e.stopPropagation(); dragging.current = true; if (e.touches[0]) updateFromEvent(e.touches[0].clientX); } : undefined}
      style={{ position: 'absolute', inset: 0, zIndex: 11, cursor: interactive ? 'col-resize' : 'default', userSelect: 'none', pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {/* Before/after images — montate SUBITO a opacità 0 (così l'immagine AI si
          carica durante lo sweep della linea), poi transizione liscia 0→1 quando
          la linea è pronta (showImages=true). Niente jank di caricamento. */}
      <div style={{ position: 'absolute', inset: 0, opacity: showImages ? 1 : 0, transition: 'opacity .9s cubic-bezier(.4,0,.2,1)' }}>
        {/* After image (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="Dopo" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: isVertical ? 'contain' : 'cover', display: 'block' }} />
        {/* Before image (clipped) */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Prima" draggable={false} style={{ width: '100%', height: '100%', objectFit: isVertical ? 'contain' : 'cover', display: 'block' }} />
        </div>
      </div>
      {/* Divider line — sweeps top to bottom on mount (slow) */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#fff', transform: 'translateX(-1px)', boxShadow: '0 0 8px rgba(0,0,0,.35)', animation: 'gnm-slider-sweep .65s cubic-bezier(.45,.05,.35,1) both' }} />
      {/* Handle circle — separate element (not clipped by the line sweep), pops in once the line lands */}
      <div style={{ position: 'absolute', top: '50%', left: `${pos}%`, transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.25)', opacity: 0, animation: 'gnm-slider-pop .4s cubic-bezier(.34,1.56,.64,1) .5s forwards' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#211f1c" strokeWidth="2.5"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
      </div>
    </div>
  );
}
