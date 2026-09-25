'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Trasformazione di un contenitore in un altro, come in home tra "Miglioralo" e il campo link:
// si vede il contenitore che cambia forma (posizione, dimensione, angoli), poi il contenuto nuovo appare.
//   1. al clic: morphFrom(elementoDiPartenza, 'id')
//   2. il contenitore di arrivo e' un <MorphTarget id="id">: quando compare, una sagoma della card
//      (stesso fondo, ombra e angoli) va dalla partenza all'arrivo in 600 ms; poi il contenuto entra in dissolvenza.
type Pending = { id: string; rect: DOMRect; radius: string; bg: string };
let pending: Pending | null = null;

export function morphFrom(el: Element | null | undefined, id: string) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cs = getComputedStyle(el);
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : cs.backgroundColor;
  pending = { id, rect: el.getBoundingClientRect(), radius: cs.borderRadius, bg };
  setTimeout(() => { if (pending?.id === id) pending = null; }, 1500); // se l'arrivo non compare, si dimentica
}

type Ghost = { from: DOMRect; to: DOMRect; rf: string; rt: string; bg: string; go: boolean };

export function MorphTarget({ id, children, className = '', style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [hidden, setHidden] = useState(() => pending?.id === id);
  const [revealed, setRevealed] = useState(false);
  // la partenza si legge una volta e si tiene: in sviluppo React esegue gli effetti due volte
  const start = useRef<Pending | false | null>(null);
  if (start.current == null) { start.current = pending?.id === id ? pending : false; }

  useLayoutEffect(() => {
    const p = start.current;
    if (!p || !ref.current) return;
    if (pending?.id === id) pending = null;
    const to = ref.current.getBoundingClientRect();
    setGhost({ from: p.rect, to, rf: p.radius, rt: getComputedStyle(ref.current).borderRadius, bg: p.bg, go: false });
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setGhost(g => (g ? { ...g, go: true } : g))); });
    const t = setTimeout(() => { start.current = false; setGhost(null); setHidden(false); setRevealed(true); }, 600);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, [id]);

  const g = ghost;
  const box = g && (g.go ? { left: g.to.left, top: g.to.top, width: g.to.width, height: g.to.height, borderRadius: g.rt } : { left: g.from.left, top: g.from.top, width: g.from.width, height: g.from.height, borderRadius: g.rf });
  return (
    <>
      <div ref={ref} className={className} style={{ ...style, ...(hidden ? { visibility: 'hidden' } : {}) }}>
        {/* il contenuto entra in dissolvenza solo dopo la trasformazione */}
        <div className={revealed ? 'blur-in' : ''}>{children}</div>
      </div>
      {g && box && createPortal(
        <div aria-hidden className="pointer-events-none fixed z-[300] ease-smooth transition-[left,top,width,height,border-radius]"
          style={{ ...box, background: g.bg, boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 16px 40px -22px rgba(0,0,0,.18)' }} />,
        document.body,
      )}
    </>
  );
}
