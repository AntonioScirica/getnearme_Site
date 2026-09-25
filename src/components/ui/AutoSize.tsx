'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// Contenitore che cambia dimensione con un'animazione invece di scattare: misura il contenuto e
// porta altezza (e larghezza se `width`) al valore nuovo in 600 ms. Il contenuto nuovo entra in
// dissolvenza (chi lo usa mette `blur-in` sugli elementi che compaiono).
// misura con i decimali arrotondati per eccesso: offsetHeight arrotonda per difetto e tagliava l'ultimo mezzo pixel
export default function AutoSize({ children, width, className = '' }: { children: ReactNode; width?: boolean; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = inner.current!;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setSize({ w: Math.ceil(r.width), h: Math.ceil(r.height) }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={`overflow-hidden ease-smooth transition-[height,width] ${className}`}
      style={size ? { height: size.h, ...(width ? { width: size.w } : {}) } : undefined}>
      <div ref={inner} className={width ? 'w-max max-w-full' : ''}>{children}</div>
    </div>
  );
}
