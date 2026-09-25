import type { ReactNode } from 'react';

// Tooltip della piattaforma: etichetta scura sopra l'elemento, compare in hover e con il fuoco da tastiera.
// Uno solo alla volta: sparisce subito quando esci (niente dissolvenza in uscita che si sovrappone al prossimo)
// e il fuoco lasciato dal clic non lo tiene aperto (solo :focus-visible, cioe' tastiera).
export default function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ease-smooth group-hover/tip:opacity-100 group-hover/tip:transition-opacity group-has-[:focus-visible]/tip:opacity-100 ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
        {label}
      </span>
    </span>
  );
}
