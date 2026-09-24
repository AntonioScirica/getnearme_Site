'use client';

import { useEffect, useState } from 'react';

// Numero che sale da 0 al valore in ~700 ms (score, completezza). Rispetta prefers-reduced-motion.
export default function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / duration); setN(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return <>{n}</>;
}
