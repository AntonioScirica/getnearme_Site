import type { ReactNode } from 'react';

// Tooltip della piattaforma: etichetta scura sopra l'elemento, compare in hover e con il focus da tastiera.
export default function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ease-smooth transition-[opacity,transform] group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${side === 'top' ? 'bottom-full mb-2 translate-y-1 group-hover/tip:translate-y-0' : 'top-full mt-2 -translate-y-1 group-hover/tip:translate-y-0'}`}>
        {label}
      </span>
    </span>
  );
}
