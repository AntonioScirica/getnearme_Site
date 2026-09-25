'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// Menu a tendina della piattaforma, uguale ovunque: card bianca raggio 16, voci raggio 8 (16 - padding 8),
// spunta sulla voce scelta, gruppi con titolo. Si apre sotto (o sopra se manca spazio), in un portal
// cosi' nessun contenitore lo taglia. Tastiera: frecce, Invio, Esc.

export type DropdownOption<T extends string> = { value: T; label: string; group?: string };

export default function Dropdown<T extends string>({ value, options, onChange, children, className = '', align = 'start' }: {
  value: T; options: DropdownOption<T>[]; onChange: (v: T) => void;
  // contenuto del pulsante (se assente: etichetta della voce scelta)
  children?: ReactNode; className?: string; align?: 'start' | 'end';
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const current = options.find(o => o.value === value);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const place = () => {
      const r = btn.current!.getBoundingClientRect();
      const h = Math.min(360, options.length * 40 + 40);
      const up = window.innerHeight - r.bottom < h + 16 && r.top > h;
      setPos({ left: align === 'end' ? r.right : r.left, top: up ? r.top - 8 : r.bottom + 8, up });
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

  const toggle = () => { setActive(Math.max(0, options.findIndex(o => o.value === value))); setOpen(v => !v); };

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} aria-haspopup="listbox" aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-lg outline-none ease-smooth transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}>
        {children ?? current?.label}
        <ChevronDown size={15} className={`shrink-0 ease-smooth transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div ref={menu} role="listbox" className="blur-in fixed z-[200] max-h-[360px] w-60 overflow-y-auto rounded-2xl bg-white p-2 text-sm text-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5 [scrollbar-width:none]"
          style={{ left: pos.left, top: pos.top, transform: `translate(${align === 'end' ? '-100%' : '0'}, ${pos.up ? '-100%' : '0'})` }}>
          {options.map((o, i) => {
            const head = o.group && o.group !== options[i - 1]?.group ? o.group : null;
            return (
              <div key={o.value}>
                {head && <div className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted ${i ? 'pt-3' : 'pt-1'}`}>{head}</div>}
                <button type="button" role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)}
                  onClick={() => { onChange(o.value); setOpen(false); btn.current?.focus(); }}
                  className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left ease-smooth transition-colors ${i === active ? 'bg-canvas' : ''} ${o.value === value ? 'font-semibold' : ''}`}>
                  {o.label}{o.value === value && <Check size={15} className="shrink-0 text-brand" />}
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
