'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// Cambio di testo con una passata di luce blu: il vecchio resta davanti alla banda, il nuovo esce dietro.
// `swapKey` cambia = parte l'effetto. Il vecchio e' solo decorativo (niente clic, nascosto ai lettori di schermo).
export default function LightSwap({ swapKey, children, className = '' }: { swapKey: string; children: ReactNode; className?: string }) {
  const prev = useRef<{ key: string; node: ReactNode }>({ key: swapKey, node: children });
  const [old, setOld] = useState<{ key: string; node: ReactNode } | null>(null);

  useEffect(() => {
    if (prev.current.key !== swapKey) {
      setOld(prev.current);
      const t = setTimeout(() => setOld(null), 1100);
      prev.current = { key: swapKey, node: children };
      return () => clearTimeout(t);
    }
    prev.current = { key: swapKey, node: children };
  }, [swapKey, children]);

  if (!old) return <div className={className}>{children}</div>;
  return (
    <div className={`relative grid ${className}`}>
      <div aria-hidden className="swap-old pointer-events-none [grid-area:1/1]">{old.node}</div>
      <div key={swapKey} className="swap-new [grid-area:1/1]">{children}</div>
      <span className="swap-glow" aria-hidden />
    </div>
  );
}
