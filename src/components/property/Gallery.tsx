'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Grid2x2, Share2, X, Check } from 'lucide-react';

// Galleria della pagina casa: mosaico su desktop, carosello a scorrimento su mobile,
// visualizzazione a schermo intero con frecce, tastiera e contatore.
export default function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((dir: number) => setOpen(i => (i === null ? i : (i + dir + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, close, go]);

  if (!photos.length) return <div className="aspect-[16/7] rounded-3xl bg-canvas" />;

  return (
    <>
      {/* Mobile: carosello */}
      <div className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 md:hidden">
        {photos.map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl">
            <img src={src} alt={`${title}, foto ${i + 1}`} loading={i ? 'lazy' : 'eager'} className="h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1}/{photos.length}</span>
          </button>
        ))}
      </div>

      {/* Desktop: mosaico 1 grande + 4 */}
      <div className="relative hidden h-[480px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
        {photos.slice(0, 5).map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className={`group overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''} ${photos.length === 1 ? 'col-span-4' : ''}`}>
            <img src={src} alt={`${title}, foto ${i + 1}`} loading={i ? 'lazy' : 'eager'} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          </button>
        ))}
        {photos.length > 1 && (
          <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-lg hover:bg-canvas">
            <Grid2x2 size={16} /> Tutte le {photos.length} foto
          </button>
        )}
      </div>

      {/* Schermo intero */}
      {open !== null && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" onClick={close}>
          <div className="flex items-center justify-between px-5 py-4 text-sm" onClick={e => e.stopPropagation()}>
            <span>{open + 1} / {photos.length}</span>
            <button onClick={close} aria-label="Chiudi" className="rounded-full p-2 hover:bg-white/10"><X size={22} /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={e => e.stopPropagation()}>
            <img src={photos[open]} alt={`${title}, foto ${open + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
            {photos.length > 1 && (
              <>
                <button onClick={() => go(-1)} aria-label="Foto precedente" className="absolute left-4 rounded-full bg-white/10 p-3 hover:bg-white/20"><ChevronLeft size={24} /></button>
                <button onClick={() => go(1)} aria-label="Foto successiva" className="absolute right-4 rounded-full bg-white/10 p-3 hover:bg-white/20"><ChevronRight size={24} /></button>
              </>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-5" onClick={e => e.stopPropagation()}>
            {photos.map((src, i) => (
              <button key={src} onClick={() => setOpen(i)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 ${i === open ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100'}`}>
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { /* annullato */ } }
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={share} className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-canvas">
      {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />} {copied ? 'Link copiato' : 'Condividi'}
    </button>
  );
}
