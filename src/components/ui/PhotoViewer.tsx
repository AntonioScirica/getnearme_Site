'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X } from 'lucide-react';

type Step = { src: string; label: string };

// Foto a tutto schermo. Con `before` (risultati AI) si passa tra Prima e Dopo; con `steps` (Galleria)
// si possono aprire tutti i passaggi dall'originale all'ultima versione. Frecce, Esc o clic fuori chiude.
export default function PhotoViewer({ src, before, steps, onClose }: { src: string; before?: string; steps?: Step[]; onClose: () => void }) {
  const list: Step[] = steps?.length ? steps : [...(before ? [{ src: before, label: 'Prima' }] : []), { src, label: 'Dopo' }];
  const [i, setI] = useState(list.length - 1);
  const [all, setAll] = useState(false); // passaggi intermedi visibili
  // senza i passaggi aperti si salta tra il primo (prima) e l'ultimo (dopo)
  const ends = [0, list.length - 1];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      setI(v => (all ? Math.min(list.length - 1, Math.max(0, v + d)) : v === 0 ? list.length - 1 : 0));
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [all, list.length, onClose]);
  const cur = list[i] ?? list[list.length - 1];

  return createPortal(
    <div className="blur-in fixed inset-0 z-[250] flex flex-col items-center justify-center gap-4 bg-black/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <img key={cur.src} src={cur.src} alt="" onClick={e => e.stopPropagation()}
        className={`blur-in max-w-[92vw] rounded-2xl object-contain shadow-2xl ${all ? 'max-h-[70vh]' : 'max-h-[82vh]'}`} />
      <button onClick={onClose} aria-label="Chiudi" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ease-smooth transition-colors hover:bg-white/25"><X size={20} /></button>
      {list.length > 1 && (
        <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
          {/* tutti i passaggi: miniature dall'originale all'ultima versione */}
          {all && (
            <div className="blur-in flex max-w-[92vw] gap-2 overflow-x-auto rounded-2xl bg-white/10 p-2 [scrollbar-width:none]">
              {list.map((s, j) => (
                <button key={s.src} onClick={() => setI(j)} title={s.label} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ease-smooth transition-[box-shadow,opacity] ${j === i ? 'ring-white' : 'opacity-60 ring-transparent hover:opacity-100'}`}>
                  <img src={s.src} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">{j === 0 ? 'Prima' : `${j}. ${s.label}`}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white/15 p-1 backdrop-blur">
              {ends.map((j, n) => (
                <button key={n} onClick={() => setI(j)} className={`h-9 rounded-full px-5 text-sm font-semibold ease-smooth transition-colors ${i === j ? 'bg-white text-ink' : 'text-white hover:bg-white/10'}`}>{n ? 'Dopo' : 'Prima'}</button>
              ))}
            </div>
            {list.length > 2 && (
              <button onClick={() => setAll(v => !v)} aria-pressed={all} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${all ? 'bg-white text-ink' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                <Layers size={15} /> Tutti i passaggi ({list.length - 1})
              </button>
            )}
          </div>
          {all && i > 0 && i < list.length - 1 && <p className="text-sm text-white/80">{cur.label}</p>}
        </div>
      )}
    </div>,
    document.body,
  );
}
