'use client';

import { useEffect, useRef, useState } from 'react';
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

export type Region = { x: number; y: number; w: number; h: number; poly?: { x: number; y: number }[] };
export type EditRequest = { imageUrl?: string; imageBase64?: string; prompt?: string; style?: string; angle?: string; scene?: string; planimetria?: boolean; region?: Region; points?: { x: number; y: number }[]; projectId?: string; room?: string; variant?: number; reference?: string; styleRef?: string; edits?: number };
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
export function AiPhotoStage({ src, busy, out, reveal, msg, fileName, onDownload, parked, onUnpark, className = 'aspect-[3/2] max-h-[60vh]' }: {
  src: string; busy: boolean; out: string | null; reveal: Reveal; msg: number; fileName: string; onDownload?: (url: string) => void; parked?: boolean; onUnpark?: () => void; className?: string;
}) {
  const [saved, setSaved] = useState(false);
  // larghezza vera dell'etichetta (Scarica / Scaricato): serve un numero per animare il passaggio a cerchio
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = useState<number>();
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLabelW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [reveal, out]);
  const savedT = useRef<ReturnType<typeof setTimeout>>(undefined);
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
        <InlineSlider before={src} after={out} isVertical={false} showImages={reveal === 'slider'} interactive={reveal === 'slider'} parked={parked} />
      )}
      {reveal === 'slider' && out && (
        <>
          <span className={`blur-in bottom-3 left-3 ${tag}`}>Prima</span>
          <span className={`blur-in bottom-3 right-3 ${tag}`}>Dopo</span>
          {/* un solo pulsante: Scarica (dopo il clic "Scaricato" per 2 s); con `parked` (Modifica aperta) si stringe e diventa la X.
              Sta sopra la selezione (z-30) cosi' non ci sono mai due pulsanti uno sull'altro. */}
          <button onPointerDown={e => e.stopPropagation()} aria-label={parked ? 'Annulla selezione' : 'Scarica'}
            onClick={() => { if (parked) { onUnpark?.(); return; } downloadImage(out, fileName); onDownload?.(out); setSaved(true); clearTimeout(savedT.current); savedT.current = setTimeout(() => setSaved(false), 2000); }}
            style={{ width: parked ? 36 : labelW }}
            className="blur-in absolute right-3 top-3 z-30 flex h-9 items-center justify-center overflow-hidden rounded-full bg-white/85 text-xs font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md ease-smooth transition-[width,background-color] hover:bg-white">
            <span ref={labelRef} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 ease-smooth transition-opacity ${parked ? 'opacity-0' : ''}`}>
              {saved ? <span key="ok" className="blur-in flex items-center gap-1.5 text-emerald-700"><Check size={14} /> Scaricato</span> : <span key="dl" className="blur-in flex items-center gap-1.5"><Download size={14} /> Scarica</span>}
            </span>
            <X size={16} className={`absolute ease-smooth transition-opacity ${parked ? '' : 'opacity-0'}`} />
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modifica a chat di una foto: l'agente scrive cosa vuole (in italiano, il servizio lo traduce), vede il
// prima/dopo, poi continua a chiedere sulla versione ottenuta ("ora piu' moderno", "pareti bianche").
// Ogni richiesta ha un seme nuovo: la stessa frase ripetuta da' un risultato diverso. Le versioni restano
// in fila e si puo' ripartire da una qualsiasi. I suggerimenti scrivono nel campo; se il testo resta quello
// del suggerimento si usa il prompt gia' calibrato (preset), altrimenti il testo dell'agente.
// ---------------------------------------------------------------------------
export type Suggestion = { id: string; label: string; req: Partial<EditRequest> };
export const QUICK_PRESETS: Suggestion[] = [
  { id: 'modern', label: 'Arreda moderno', req: { style: 'modern' } },
  { id: 'nordic', label: 'Arreda nordico', req: { style: 'nordic' } },
  { id: 'empty', label: 'Svuota la stanza', req: { style: 'empty' } },
  { id: 'day', label: 'Luminoso', req: { angle: 'day' } },
  { id: 'tidy', label: 'Togli il disordine', req: { prompt: 'Togli gli oggetti in giro e il disordine, lascia i mobili' } },
];
type Version = { url: string; text: string };

export function PhotoChat({ original, scene, fileName, actions = [], className, initialText = '' }: {
  original: string; scene?: string; fileName: string; className?: string; initialText?: string;
  actions?: { label: string; primary?: boolean; onClick: (url: string) => void }[];
}) {
  const [versions, setVersions] = useState<Version[]>([{ url: original, text: '' }]);
  const [cur, setCur] = useState(0);
  const [text, setText] = useState(initialText);
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [runBase, setRunBase] = useState(original);
  const [pending, setPending] = useState('');
  const ai = useAiPhoto();
  useKeepPhotoGpu();

  // risultato arrivato: diventa una nuova versione e quella corrente
  useEffect(() => {
    if (!ai.out) return;
    const t = setTimeout(() => { setVersions(v => { setCur(v.length); return [...v, { url: ai.out!, text: pending }]; }); }, 0);
    return () => clearTimeout(t);
  }, [ai.out]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    const t = text.trim();
    if (ai.busy || !t) return;
    const base = versions[cur].url;
    const img = base.startsWith('data:') ? { imageBase64: base } : { imageUrl: base };
    const useSuggestion = picked && t === picked.label && !picked.req.prompt;
    setRunBase(base); setPending(t); setText(''); setPicked(null);
    ai.run({ ...img, ...(scene ? { scene } : {}), ...(useSuggestion ? picked!.req : { prompt: picked?.req.prompt && t === picked.label ? picked.req.prompt : t }) });
  };
  const current = versions[cur];
  const showing = ai.busy || ai.out ? { src: runBase, out: ai.out } : { src: current.url, out: null };

  return (
    <div className={className}>
      <AiPhotoStage src={showing.src} busy={ai.busy} out={showing.out} reveal={ai.reveal} msg={ai.msg} fileName={fileName} />

      {/* Versioni: si riparte da una qualsiasi */}
      {versions.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {versions.map((v, i) => (
            <button key={v.url} title={v.text || 'Originale'} onClick={() => { if (!ai.busy) { ai.reset(); setCur(i); } }}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ease-smooth transition ${i === cur ? 'ring-brand' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
              <img src={v.url} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded-full bg-ink/75 px-1.5 text-[10px] font-semibold text-white">{i === 0 ? 'Orig.' : i}</span>
            </button>
          ))}
        </div>
      )}
      {cur > 0 && !ai.busy && <p className="mt-1 px-1 text-xs text-muted">Versione {cur}: «{current.text}». Scrivi un&apos;altra richiesta per continuare da qui.</p>}

      {/* Suggerimenti: scrivono nel campo, poi si possono cambiare */}
      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {QUICK_PRESETS.map(x => (
          <button key={x.id} onClick={() => { setText(x.label); setPicked(x); }}
            className="rounded-full bg-canvas px-3.5 py-1.5 text-[13px] font-medium text-ink/80 ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-white">{x.label}</button>
        ))}
      </div>

      {/* Campo stile home: richiesta + bottoni nello stesso contenitore */}
      <div className="mt-3 flex items-center gap-2 rounded-[22px] bg-canvas p-2 pl-4 ease-smooth transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/15">
        <textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder={cur ? 'Cosa cambiamo ancora? Es. più moderno, pareti bianche' : 'Cosa vuoi cambiare? Es. togli il divano e metti un tavolo da pranzo'}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted/60" />
        {cur > 0 && !ai.busy && actions.map(a => (
          <button key={a.label} onClick={() => a.onClick(current.url)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold ease-smooth transition-colors ${a.primary ? 'bg-brand text-white hover:bg-brand/90' : 'bg-white ring-1 ring-black/10 hover:bg-canvas'}`}>
            {a.primary && <Check size={14} strokeWidth={3} />} {a.label}
          </button>
        ))}
        <button onClick={send} disabled={ai.busy || !text.trim()} aria-label="Invia"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40">
          {ai.busy ? <><Loader2 size={14} className="animate-spin" /> <Elapsed className="text-white/80" /></> : <><Wand2 size={14} /> {cur ? 'Continua' : 'Genera'}</>}
        </button>
      </div>
      {ai.err && <p className="mt-2 px-1 text-sm text-rose-600">{ai.err}</p>}
    </div>
  );
}

// Pannello sopra la pagina con la modifica a chat. `actions` agiscono sulla versione corrente.
export function PhotoEditModal({ src, title, subtitle = 'Scrivi cosa vuoi cambiare, poi continua a chiedere finché non ti piace.', initialText, actions, onClose }: {
  src: string; title: string; subtitle?: string; initialText?: string;
  actions: { label: string; primary?: boolean; onClick: (url: string) => void }[];
  onClose: () => void;
}) {
  useEffect(() => {
    // capture + stop: Esc chiude solo il pannello, non la pagina sotto
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [onClose]);

  // Portal su body: un antenato con transform (animazioni di ingresso) farebbe da contenitore al fixed.
  return createPortal(
    <div role="dialog" aria-modal="true" className={`${platformFontVars} fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/30 p-4 font-body text-ink backdrop-blur-sm`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`rise relative w-full max-w-3xl rounded-[28px] bg-white p-5 text-left ${CARD_SHADOW}`}>
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight first-letter:uppercase">{title}</h3>
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>
        <PhotoChat className="mt-4" original={src} initialText={initialText} actions={actions} fileName={`${title.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'foto'}-ai.jpg`} />
      </div>
    </div>,
    document.body,
  );
}
