'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// Menu a tendina della piattaforma, uguale ovunque: card bianca raggio 16, voci raggio 8 (16 - padding 8),
// spunta sulla voce scelta, gruppi con titolo. Si apre sotto (o sopra se manca spazio), in un portal
// cosi' nessun contenitore lo taglia. Tastiera: frecce, Invio, Esc.

// style: aspetto della voce (es. il carattere di un font), usato anche nel pulsante quando e' scelta
export type DropdownOption<T extends string> = { value: T; label: string; group?: string; style?: CSSProperties };

export default function Dropdown<T extends string>({ value, options, onChange, children, className = '', align = 'start' }: {
  value: T; options: DropdownOption<T>[]; onChange: (v: T) => void;
  // contenuto del pulsante (se assente: etichetta della voce scelta)
  children?: ReactNode; className?: string; align?: 'start' | 'end';
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean; max: number; w: number } | null>(null);
  const [active, setActive] = useState(0);
  const current = options.find(o => o.value === value);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const place = () => {
      const r = btn.current!.getBoundingClientRect();
      // si apre dalla parte con piu' spazio e non esce mai dallo schermo (si accorcia e scorre)
      const h = Math.min(360, options.length * 40 + 40);
      const below = window.innerHeight - r.bottom - 24, above = r.top - 24;
      const up = below < h && above > below;
      // larghezza del menu (w-60 o quanto il pulsante): non esce mai dallo schermo a destra o a sinistra
      const vw = window.innerWidth, mw = Math.min(Math.max(240, r.width), vw - 32);
      const left = align === 'end' ? Math.max(r.right, 16 + mw) : Math.min(r.left, vw - 16 - mw);
      setPos({ left, top: up ? r.top - 8 : r.bottom + 8, up, max: Math.max(120, Math.min(360, up ? above : below)), w: r.width });
    };
    place();
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [open, options.length, align]);

  useEffect(() => {
    if (!open) return;
    const out = (e: PointerEvent) => { if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(options.length - 1, a + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      if (e.key === 'Enter') { e.preventDefault(); onChange(options[active].value); setOpen(false); btn.current?.focus(); }
    };
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key); };
  }, [open, active, options, onChange]);

  // una sola tendina aperta: aprendone una, le altre si chiudono (anche senza pointerdown, es. tastiera)
  useEffect(() => {
    if (!open) return;
    const other = (e: Event) => { if ((e as CustomEvent).detail !== btn.current) setOpen(false); };
    window.addEventListener('agenteimmo:dropdown', other);
    return () => window.removeEventListener('agenteimmo:dropdown', other);
  }, [open]);
  const toggle = () => {
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    if (!open) window.dispatchEvent(new CustomEvent('agenteimmo:dropdown', { detail: btn.current }));
    setOpen(v => !v);
  };

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} aria-haspopup="listbox" aria-expanded={open}
        className={`inline-flex items-center gap-0.5 rounded-full outline-none ease-smooth transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}>
        {/* nomi lunghi: una riga sola con i puntini, sia nel pulsante sia nelle voci */}
        {children ?? <span className="max-w-[16rem] truncate" style={current?.style}>{current?.label}</span>}
        <ChevronDown size={14} strokeWidth={2.5} className={`shrink-0 translate-y-px ease-smooth transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* sopra tutto, anche alle finestre (z 260-400) da cui si apre; largo almeno quanto il pulsante */}
      {open && pos && createPortal(
        <div ref={menu} role="listbox" className="blur-in fixed z-[600] max-h-[360px] w-60 overflow-y-auto rounded-2xl bg-white p-2 text-sm text-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5 [scrollbar-width:none]"
          style={{ left: pos.left, top: pos.top, maxHeight: pos.max, minWidth: Math.min(pos.w, window.innerWidth - 32), maxWidth: window.innerWidth - 32, transform: `translate(${align === 'end' ? '-100%' : '0'}, ${pos.up ? '-100%' : '0'})` }}>
          {options.map((o, i) => {
            const head = o.group && o.group !== options[i - 1]?.group ? o.group : null;
            return (
              <div key={o.value}>
                {head && <div className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted ${i ? 'pt-3' : 'pt-1'}`}>{head}</div>}
                <button type="button" role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)}
                  onClick={() => { onChange(o.value); setOpen(false); btn.current?.focus(); }}
                  className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg px-3 sm:h-10 text-left ease-smooth transition-colors ${i === active ? 'bg-canvas' : ''} ${o.value === value ? 'font-semibold' : ''}`}>
                  <span className="min-w-0 truncate" title={o.label} style={o.style}>{o.label}</span>{o.value === value && <Check size={15} className="shrink-0 text-brand" />}
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
