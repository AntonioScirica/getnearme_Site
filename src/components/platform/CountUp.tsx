'use client';

import { useEffect, useRef, useState } from 'react';

// Numero che sale al valore in ~700 ms (score, completezza). Rispetta prefers-reduced-motion.
// Parte dal valore mostrato (non da 0): cambiando un dato la completezza scorre dal numero di prima, non riparte da zero.
// Pagina nascosta (requestAnimationFrame fermo): il valore arriva subito, prima restava a 0.
export default function CountUp({ value, duration = 700, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduced ? value : 0);
  const shown = useRef(n);
  useEffect(() => {
    if (reduced || document.hidden) { shown.current = value; setN(value); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const from = shown.current, t0 = performance.now() + delay; let raf = 0;
    const tick = (t: number) => {
      const k = Math.max(0, Math.min(1, (t - t0) / duration));
      shown.current = Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)));
      setN(shown.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay, reduced]);
  return <>{n}</>;
}
