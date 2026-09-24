'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Loader2, Wand2, X } from 'lucide-react';
import { platformFontVars } from '@/lib/platformFonts';
import { downloadImage } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import InlineSlider from '@/components/InlineSlider';
import { authFetch, CARD_SHADOW, warm } from './api';

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

// ---------------------------------------------------------------------------
// Pannello di modifica di una foto, sopra la pagina: foto grande, azioni rapide (preset di home
// staging), testo libero, poi prima/dopo. Usato da "Sistema con AI" (Migliora) e da Crea da zero.
// `actions` = bottoni dopo il risultato (es. Finito, oppure Tieni entrambe / Usa questa).
// ---------------------------------------------------------------------------
export type Preset = { id: string; label: string; req: Partial<EditRequest> };
export const QUICK_PRESETS: Preset[] = [
  { id: 'modern', label: 'Arreda', req: { style: 'modern' } },
  { id: 'empty', label: 'Svuota', req: { style: 'empty' } },
  { id: 'day', label: 'Più luce', req: { angle: 'day' } },
  { id: 'daynight', label: 'Giorno e notte', req: { style: 'daynight' } },
];

export function PhotoEditModal({ src, title, subtitle = 'Scegli un\'azione o descrivi la modifica, l\'AI la applica alla foto.', initialPrompt = '', presets = [], actions, onClose, onDownload }: {
  src: string; title: string; subtitle?: string; initialPrompt?: string; presets?: Preset[];
  actions: { label: string; primary?: boolean; onClick: (url: string) => void }[];
  onClose: () => void; onDownload?: (url: string) => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [preset, setPreset] = useState<string | null>(null);
  const ai = useAiPhoto();
  useKeepPhotoGpu(); // GPU accesa finche' il pannello e' aperto

  useEffect(() => {
    // capture + stop: Esc chiude solo il pannello, non la pagina sotto
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [onClose]);

  const image = src.startsWith('data:') ? { imageBase64: src } : { imageUrl: src };
  const p = presets.find(x => x.id === preset);
  const canRun = !ai.busy && !!(prompt.trim() || p);
  const run = () => { if (canRun) ai.run({ ...image, ...(prompt.trim() ? { prompt: prompt.trim() } : p!.req) }); };
  const { busy, out } = ai;
  const btn = (primary?: boolean) => `flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold ease-smooth transition-[background-color,opacity,transform] active:scale-[0.97] disabled:opacity-40 ${primary ? 'bg-brand text-white hover:bg-brand/90' : 'bg-white ring-1 ring-black/10 hover:bg-canvas'}`;

  // Portal su body: un antenato con transform (animazioni di ingresso) farebbe da contenitore al fixed.
  return createPortal(
    <div role="dialog" aria-modal="true" className={`${platformFontVars} fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 font-body text-ink backdrop-blur-sm`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`rise relative w-full max-w-3xl rounded-[28px] bg-white p-5 text-left ${CARD_SHADOW}`}>
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight first-letter:uppercase">{title}</h3>
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>

        <div className="mt-4">
          <AiPhotoStage src={src} busy={busy} out={out} reveal={ai.reveal} msg={ai.msg} onDownload={onDownload}
            fileName={`${title.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'foto'}-ai.jpg`} />
        </div>

        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {presets.map(x => (
              <button key={x.id} onClick={() => { setPreset(x.id); setPrompt(''); }}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ease-smooth transition-colors ${preset === x.id && !prompt.trim() ? 'bg-ink text-white' : 'bg-canvas text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-white'}`}>{x.label}</button>
            ))}
          </div>
        )}

        {/* Campo modifica stile home: testo + bottoni nello stesso contenitore */}
        <div className="mt-3 flex items-center gap-2 rounded-[22px] bg-canvas p-2 pl-4 ease-smooth transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/15">
          <textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Oppure descrivi tu la modifica, es. togli gli oggetti dal tavolo"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
            className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted/60" />
          {out && !busy ? (
            <>
              <button onClick={run} disabled={!canRun} className={btn()}><Wand2 size={14} /> Rigenera</button>
              {actions.map(a => <button key={a.label} onClick={() => a.onClick(out)} className={btn(a.primary)}>{a.primary && <Check size={14} strokeWidth={3} />} {a.label}</button>)}
            </>
          ) : (
            <button onClick={run} disabled={!canRun} className={btn(true)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {busy ? <>Modifico <Elapsed className="text-white/80" /></> : 'Genera'}
            </button>
          )}
        </div>
        {ai.err && <p className="mt-2 px-1 text-sm text-rose-600">{ai.err}</p>}
      </div>
    </div>,
    document.body,
  );
}
