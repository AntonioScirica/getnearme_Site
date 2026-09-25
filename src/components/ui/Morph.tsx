'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Trasformazione di un contenitore in un altro, come in home tra "Miglioralo" e il campo link:
// si vede il contenitore che cambia forma (posizione, dimensione, angoli, ombra) e il contenuto cambia dentro.
//   1. al clic: morphFrom(elementoDiPartenza, 'id')
//   2. il contenitore di arrivo e' un <MorphTarget id="id">.
// Durante i 600 ms un "contenitore ponte" parte dalla forma della partenza, con dentro una copia del suo
// contenuto che sfuma, e arriva sulla forma dell'arrivo. L'arrivo si misura a ogni fotogramma, cosi' segue
// scorrimenti e cambi di impaginazione. Alla fine il ponte sparisce e il contenuto vero entra in dissolvenza.

type Look = { radius: number; bg: string; shadow: string };
type Pending = { id: string; rect: DOMRect; look: Look; clone: HTMLElement };
let pending: Pending | null = null;

const DUR = 600;
// cubic-bezier(.22, 1, .36, 1), la curva di tutte le animazioni (--gnm-ease)
function ease(t: number) {
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
  const bx = (u: number) => 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3;
  const by = (u: number) => 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 24; i++) { u = (lo + hi) / 2; if (bx(u) < t) lo = u; else hi = u; }
  return by(u);
}
const lookOf = (el: Element): Look => {
  const cs = getComputedStyle(el);
  return { radius: parseFloat(cs.borderTopLeftRadius) || 0, bg: cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : cs.backgroundColor, shadow: cs.boxShadow === 'none' ? '0 1px 3px rgba(0,0,0,.04), 0 16px 40px -22px rgba(0,0,0,.18)' : cs.boxShadow };
};

export function morphFrom(el: Element | null | undefined, id: string) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = el.getBoundingClientRect();
  // copia del contenuto di partenza, alla sua misura: sfuma mentre il contenitore si trasforma
  const clone = el.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { position: 'absolute', left: '0', top: '0', width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', transform: 'none', pointerEvents: 'none' });
  pending = { id, rect, look: lookOf(el), clone };
  setTimeout(() => { if (pending?.id === id) pending = null; }, 1500); // se l'arrivo non compare, si dimentica
}

export function MorphTarget({ id, children, className = '', style }: { id: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(() => pending?.id === id);
  const [revealed, setRevealed] = useState(false);
  // la partenza si legge una volta e si tiene: in sviluppo React esegue gli effetti due volte
  const start = useRef<Pending | false | null>(null);
  if (start.current == null) { start.current = pending?.id === id ? pending : false; }

  useLayoutEffect(() => {
    const p = start.current;
    const el = ref.current;
    if (!p || !el) return;
    if (pending?.id === id) pending = null;
    // la forma vera dell'arrivo: il primo elemento con gli angoli arrotondati (il contenitore esterno spesso non li ha)
    const shape = [el, el.firstElementChild, el.firstElementChild?.firstElementChild].find(x => x && parseFloat(getComputedStyle(x).borderTopLeftRadius) > 0) ?? el;
    const to0 = lookOf(shape);
    // ponte: contenitore con la forma della partenza e dentro la copia del suo contenuto
    const bridge = document.createElement('div');
    Object.assign(bridge.style, { position: 'fixed', zIndex: '300', pointerEvents: 'none', overflow: 'hidden', willChange: 'left, top, width, height' });
    bridge.appendChild(p.clone);
    document.body.appendChild(bridge);
    const t0 = performance.now();
    let raf = 0, done = false;
    const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); bridge.remove(); start.current = false; setHidden(false); setRevealed(true); };
    // sicurezza: con la scheda nascosta i fotogrammi non partono, si chiude comunque
    const safety = setTimeout(finish, DUR + 300);
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const frame = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / DUR)), e = ease(k);
      const to = shape.getBoundingClientRect(); // l'arrivo a ogni fotogramma: segue lo scorrimento
      Object.assign(bridge.style, {
        left: `${lerp(p.rect.left, to.left, e)}px`, top: `${lerp(p.rect.top, to.top, e)}px`,
        width: `${lerp(p.rect.width, to.width, e)}px`, height: `${lerp(p.rect.height, to.height, e)}px`,
        borderRadius: `${lerp(p.look.radius, to0.radius, e)}px`,
        background: k < 0.5 ? p.look.bg : to0.bg,
        boxShadow: k < 0.5 ? p.look.shadow : to0.shadow,
      });
      p.clone.style.opacity = String(Math.max(0, 1 - k / 0.45)); // il contenuto vecchio sfuma nel primo tratto
      if (k < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
    return () => { clearTimeout(safety); cancelAnimationFrame(raf); bridge.remove(); };
  }, [id]);

  return (
    <div ref={ref} className={className} style={{ ...style, ...(hidden ? { visibility: 'hidden' } : {}) }}>
      {/* il contenuto vero entra in dissolvenza solo alla fine della trasformazione */}
      <div className={revealed ? 'blur-in' : ''}>{children}</div>
    </div>
  );
}
