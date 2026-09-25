'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Foto a tutto schermo. Con `before` (risultati AI) si passa tra Prima e Dopo; Esc o clic fuori chiude.
export default function PhotoViewer({ src, before, onClose }: { src: string; before?: string; onClose: () => void }) {
  const [show, setShow] = useState<'dopo' | 'prima'>('dopo');
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (before && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) setShow(v => (v === 'dopo' ? 'prima' : 'dopo'));
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [before, onClose]);

  return createPortal(
    <div className="blur-in fixed inset-0 z-[250] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm" onClick={onClose}>
      <img key={show} src={show === 'prima' && before ? before : src} alt="" onClick={e => e.stopPropagation()}
        className="blur-in max-h-[86vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
      <button onClick={onClose} aria-label="Chiudi" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ease-smooth transition-colors hover:bg-white/25"><X size={20} /></button>
      {before && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 rounded-full bg-white/15 p-1 backdrop-blur" onClick={e => e.stopPropagation()}>
          {(['prima', 'dopo'] as const).map(v => (
            <button key={v} onClick={() => setShow(v)} className={`h-9 rounded-full px-5 text-sm font-semibold capitalize ease-smooth transition-colors ${show === v ? 'bg-white text-ink' : 'text-white hover:bg-white/10'}`}>{v}</button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
