'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Tooltip della piattaforma: etichetta scura sopra l'elemento, compare in hover e con il fuoco da tastiera.
// In un portal (fixed sul body): nessun contenitore con overflow o foto sopra lo copre o lo taglia.
// Uno solo alla volta: sparisce subito quando esci e il fuoco lasciato dal clic non lo tiene aperto.
export default function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setAt({ x: r.left + r.width / 2, y: side === 'top' ? r.top - 8 : r.bottom + 8 });
  };
  return (
    <span className="relative inline-flex"
      onPointerEnter={e => show(e.currentTarget)} onPointerLeave={() => setAt(null)}
      onFocus={e => { if (e.target.matches(':focus-visible')) show(e.currentTarget); }} onBlur={() => setAt(null)}
      onPointerDown={() => setAt(null)}>
      {children}
      {at && createPortal(
        <span role="tooltip" className="pointer-events-none fixed z-[300] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{ left: at.x, top: at.y, transform: `translate(-50%, ${side === 'top' ? '-100%' : '0'})`, animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) both' }}>
          {label}
        </span>,
        document.body,
      )}
    </span>
  );
}
