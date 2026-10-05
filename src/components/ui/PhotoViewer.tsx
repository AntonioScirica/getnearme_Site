'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronsLeftRight, Download, Layers, X } from 'lucide-react';
import { downloadImage } from '@/lib/staging';
import { tr } from '@/components/platform/i18n';

type Step = { src: string; label: string };
// miniature della fascia dei passaggi: anteprima leggera (api/thumb) per le foto https, le altre come sono
const mini = (u: string) => (/^https:\/\//.test(u) ? `/api/thumb?w=160&u=${encodeURIComponent(u)}` : u);

// Foto a tutto schermo. Con `before` (risultati AI) si apre sul confronto con il cursore, e si passa a Prima o Dopo; con `steps` (Galleria)
// si possono aprire tutti i passaggi dall'originale all'ultima versione. Con `video` (Galleria) mostra il video con
// il pulsante Scarica. Frecce, Esc o clic fuori chiude.
export default function PhotoViewer({ src, before, steps, video, onClose }: { src: string; before?: string; steps?: Step[]; video?: string; onClose: () => void }) {
  const list: Step[] = steps?.length ? steps : [...(before ? [{ src: before, label: tr('Prima', 'Before') }] : []), { src, label: tr('Dopo', 'After') }];
  const [i, setI] = useState(list.length - 1);
  const [all, setAll] = useState(false); // passaggi intermedi visibili
  // confronto con il cursore (prima a sinistra, dopo a destra): si apre cosi' quando c'e' un prima
  const [cmp, setCmp] = useState(list.length > 1);
  const [pos, setPos] = useState(50);
  const drag = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))); };
  // senza i passaggi aperti si salta tra il primo (prima) e l'ultimo (dopo)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      setCmp(false);
      setI(v => (all ? Math.min(list.length - 1, Math.max(0, v + d)) : v === 0 ? list.length - 1 : 0));
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [all, list.length, onClose]);
  const cur = list[i] ?? list[list.length - 1];

  return createPortal(
    <div className="blur-in fixed inset-0 z-[250] flex flex-col items-center gap-4 bg-black/85 p-6 backdrop-blur-sm" onClick={onClose}>
      {/* area foto a misura fissa (tutto lo spazio sopra i controlli): cambiando passaggio la foto non si sposta */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {video
          ? <video src={video} autoPlay muted controls playsInline onClick={e => e.stopPropagation()} className="blur-in max-h-full max-w-[92vw] rounded-2xl bg-black shadow-2xl" />
          : cmp && list.length > 1
            ? <div onClick={e => e.stopPropagation()} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={e => { if (e.buttons) drag(e); }}
                className="blur-in relative cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl shadow-2xl">
                <img src={list[0].src} alt={tr('Prima', 'Before')} draggable={false} className="block max-h-[calc(100svh-13rem)] max-w-[92vw] object-contain sm:max-h-[calc(100vh-9rem)]" />
                <img src={list[list.length - 1].src} alt={tr('Dopo', 'After')} draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
                <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,.4)]" style={{ left: `${pos}%` }} />
                <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg" style={{ left: `${pos}%` }}><ChevronsLeftRight size={18} /></span>
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">{tr('Prima', 'Before')}</span>
                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">{tr('Dopo', 'After')}</span>
              </div>
            : <img key={cur.src} src={cur.src} alt="" onClick={e => e.stopPropagation()}
            className="blur-in max-h-full max-w-[92vw] rounded-2xl object-contain shadow-2xl" />}
      </div>
      {video && (
        <button onClick={e => { e.stopPropagation(); downloadImage(video, 'agenteimmo-video.mp4'); }}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ease-smooth transition-colors hover:bg-white/90"><Download size={16} /> {tr('Scarica', 'Download')}</button>
      )}
      <button onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ease-smooth transition-colors hover:bg-white/25"><X size={20} /></button>
      {!video && list.length > 1 && (
        <div className="flex max-w-full shrink-0 flex-col items-center" onClick={e => e.stopPropagation()}>
          {/* passaggi: chiusi non occupano spazio; aprendoli la fascia cresce (righe della griglia 0fr -> 1fr)
              e la foto si rimpicciolisce insieme, senza scatti */}
          {list.length > 2 && (
            <div className={`grid ease-smooth transition-[grid-template-rows,opacity] ${all ? 'grid-rows-[1fr]' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}>
            <div className="min-h-0 overflow-hidden"><div className="flex flex-col items-center gap-3 pb-3">
            <div className="flex max-w-[92vw] gap-2 overflow-x-auto rounded-2xl bg-white/10 p-2 [scrollbar-width:none]">
              {list.map((s, j) => (
                <button key={s.src} onClick={() => { setCmp(false); setI(j); }} title={s.label} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ease-smooth transition-[box-shadow,opacity] ${j === i ? 'ring-white' : 'opacity-60 ring-transparent hover:opacity-100'}`}>
                  <img src={mini(s.src)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">{j === 0 ? tr('Prima', 'Before') : `${j}. ${s.label}`}</span>
                </button>
              ))}
            </div>
            <p className="h-5 max-w-[80vw] truncate text-sm text-white/80">{i > 0 && i < list.length - 1 ? cur.label : ''}</p>
            </div></div>
            </div>
          )}
          {/* telefono: segmenti piu' stretti e Tutti i passaggi va a capo sotto, tutto dentro lo schermo */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex rounded-full bg-white/15 p-1 backdrop-blur">
              {([[tr('Prima', 'Before'), 0], [tr('Prima/Dopo', 'Before/After'), -1], [tr('Dopo', 'After'), list.length - 1]] as const).map(([l, j]) => {
                const on = j < 0 ? cmp : !cmp && i === j;
                return <button key={l} onClick={() => { if (j < 0) setCmp(true); else { setCmp(false); setI(j); } }} className={`h-10 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ease-smooth sm:h-9 sm:px-5 transition-colors ${on ? 'bg-white text-ink' : 'text-white hover:bg-white/10'}`}>{l}</button>;
              })}
            </div>
            {list.length > 2 && (
              <button onClick={() => setAll(v => !v)} aria-pressed={all} className={`flex h-11 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-white/60 items-center gap-2 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${all ? 'bg-white text-ink' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                <Layers size={15} /> {tr('Tutti i passaggi', 'All steps')} ({list.length - 1})
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
