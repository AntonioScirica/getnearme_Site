// Sfocatura progressiva dietro barre fisse/sticky (navbar, barre in basso): il contenuto che
// scorre sotto si sfoca sempre di piu' verso il bordo della barra, senza linea netta.
// Va dentro un genitore relative; sborda di `fade` px oltre la barra per sfumare.
// ponytail: 4 livelli di backdrop-filter, bastano per l'effetto; piu' livelli = piu' costo GPU.
const LAYERS = [
  { blur: 1, solid: 75, clear: 100 },
  { blur: 2, solid: 50, clear: 75 },
  { blur: 4, solid: 37.5, clear: 62.5 },
  { blur: 8, solid: 25, clear: 50 },
];

export default function ProgressiveBlur({ side = 'top', fade = 32 }: { side?: 'top' | 'bottom'; fade?: number }) {
  const dir = side === 'top' ? 'to bottom' : 'to top';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -z-10" style={side === 'top' ? { top: 0, bottom: -fade } : { bottom: 0, top: -fade }}>
      {LAYERS.map(l => {
        const mask = `linear-gradient(${dir}, #000 ${l.solid}%, transparent ${l.clear}%)`;
        return <div key={l.blur} className="absolute inset-0" style={{ backdropFilter: `blur(${l.blur}px)`, WebkitBackdropFilter: `blur(${l.blur}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
      })}
      {/* velo bianco per la leggibilita', sfuma con la sfocatura */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(${dir}, rgba(255,255,255,.85), rgba(255,255,255,.55) 60%, transparent)` }} />
    </div>
  );
}
