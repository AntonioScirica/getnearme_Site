// Caricamento di pagina di Agente Immo: il marchio che respira e sotto tre puntini a onda (niente cerchio che gira).
// size: 'page' al centro dello schermo, 'block' dentro un riquadro.
export default function ImmoLoader({ size = 'page', label = 'Caricamento' }: { size?: 'page' | 'block'; label?: string }) {
  const [tile, mark] = size === 'page' ? ['rounded-[20px] p-2.5', 'h-11 w-11'] : ['rounded-2xl p-2', 'h-8 w-8'];
  return (
    <div role="status" aria-label={label} className="flex flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className={`immo-breathe bg-white shadow-[0_12px_32px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5 ${tile}`}><img src="/immo/logo-mark.png" alt="" className={`block ${mark}`} /></span>
      <span className="flex gap-1.5">
        {[0, 1, 2].map(i => <span key={i} className="immo-dot h-1.5 w-1.5 rounded-full bg-brand" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </span>
    </div>
  );
}
