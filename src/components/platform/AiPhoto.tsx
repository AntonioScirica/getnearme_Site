'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { downloadImage } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import InlineSlider from '@/components/InlineSlider';
import { authFetch, warm } from './api';

// Modifica foto con Qwen-Image, condivisa da "Sistema con AI" (Migliora annuncio) e Home staging:
// stato della generazione, riquadro con alone mentre lavora e slider prima/dopo alla fine.

// Tempo trascorso (m:ss): analisi e modifiche su GPU durano da secondi a minuti, cosi' si vede che va avanti.
export function Elapsed({ className = 'text-muted' }: { className?: string }) {
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(t); }, []);
  return <span className={`tabular-nums ${className}`}>{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

const MSGS = ['Guardo la foto', 'Applico la modifica', 'Sistemo luce e dettagli', 'Rifinisco i bordi', 'Quasi pronta'];
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export type EditRequest = { imageUrl?: string; imageBase64?: string; prompt?: string; style?: string; angle?: string; scene?: string; planimetria?: boolean };
export type Reveal = 'burst' | 'line' | 'slider' | null;

// GPU accesa finche' il componente che la usa e' a schermo (segnale ogni 50 s, spegnimento a 60 s).
export function useKeepPhotoGpu() {
  useEffect(() => {
    warm('photo');
    const t = setInterval(() => warm('photo'), 50_000);
    return () => clearInterval(t);
  }, []);
}

export function useAiPhoto() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  // Rivelazione come Foto AI: burst (l'alone sfuma) -> line (linea + maniglia) -> slider (prima/dopo)
  const [reveal, setReveal] = useState<Reveal>(null);
  const [msg, setMsg] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setMsg(m => (m + 1) % MSGS.length), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const run = async (req: EditRequest) => {
    if (busy) return;
    setBusy(true); setErr(null); setMsg(0); setReveal(null); setOut(null);
    const res = await authFetch('/api/platform/photo-edit', { method: 'POST', body: JSON.stringify(req) }).catch(() => null);
    let d = res ? await res.json().catch(() => ({})) : {};
    // ponytail: demo senza login (anteprima) in modalita' finta: stessa foto dopo qualche secondo
    if (AI_MOCK && res?.status === 401) { await wait(5000); d = { url: req.imageUrl || req.imageBase64 }; }
    setBusy(false);
    if (!d.url) { setErr(d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Modifica non riuscita, riprova.'); return; }
    setOut(d.url); setReveal('burst');
    setTimeout(() => setReveal('line'), 600);
    setTimeout(() => setReveal('slider'), 1450);
  };
  const reset = () => { setOut(null); setReveal(null); setErr(null); };

  return { busy, out, reveal, msg, err, run, reset };
}

// Riquadro foto: originale con alone blu mentre lavora, poi slider prima/dopo con Scarica.
export function AiPhotoStage({ src, busy, out, reveal, msg, fileName, onDownload, className = 'aspect-[3/2] max-h-[60vh]' }: {
  src: string; busy: boolean; out: string | null; reveal: Reveal; msg: number; fileName: string; onDownload?: (url: string) => void; className?: string;
}) {
  const aurora = busy || reveal === 'burst';
  const tag = 'absolute z-[12] rounded-full bg-[rgba(33,31,28,.72)] px-3 py-1.5 text-[11px] font-bold text-white';
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-canvas ${className}`}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {aurora && (
        <div className="pointer-events-none absolute inset-0 z-[6]" style={{ animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) both' }}>
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 86% 76% at 50% 50%, rgba(83,126,236,0) 46%, rgba(83,126,236,.5) 76%, rgba(83,126,236,.95) 100%)',
            animation: reveal === 'burst' ? 'gnm-aurora-burst .6s ease-out forwards' : 'gnm-aurora-edge 2.4s ease-in-out infinite',
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 40% 120% at 0% 50%, rgba(83,126,236,.85) 0%, transparent 55%), radial-gradient(ellipse 40% 120% at 100% 50%, rgba(83,126,236,.85) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 0%, rgba(83,126,236,.7) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 100%, rgba(83,126,236,.7) 0%, transparent 55%)',
            backgroundSize: '200% 200%', mixBlendMode: 'screen',
            animation: reveal === 'burst' ? 'gnm-aurora-burst .6s ease-out forwards' : 'gnm-aurora-shift 3s ease-in-out infinite, gnm-aurora-pulse 4s ease-in-out infinite',
          }} />
          {busy && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-xl">
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span key={msg} className="blur-in bg-clip-text text-xs font-bold text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #dbe5fb 20%, #537eec 50%, #dbe5fb 80%)', backgroundSize: '200% auto', animation: 'gnm-shimmer-text 2.5s linear infinite' }}>{MSGS[msg]}...</span>
              <Elapsed className="text-xs font-bold text-white/70" />
            </div>
          )}
        </div>
      )}
      {out && (reveal === 'line' || reveal === 'slider') && (
        <InlineSlider before={src} after={out} isVertical={false} showImages={reveal === 'slider'} interactive={reveal === 'slider'} />
      )}
      {reveal === 'slider' && out && (
        <>
          <span className={`blur-in bottom-3 left-3 ${tag}`}>Prima</span>
          <span className={`blur-in bottom-3 right-3 ${tag}`}>Dopo</span>
          <button onClick={() => { downloadImage(out, fileName); onDownload?.(out); }}
            className="blur-in absolute right-3 top-3 z-[12] flex h-9 items-center gap-1.5 rounded-full bg-white/85 px-3.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-white"><Download size={14} /> Scarica</button>
        </>
      )}
    </div>
  );
}
