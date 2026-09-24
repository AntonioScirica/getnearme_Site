'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ImagePlus, Loader2, RotateCcw, SquareDashedMousePointer, X } from 'lucide-react';
import { fileToResizedDataUrl } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import { AiPhotoStage, QUICK_PRESETS, type EditRequest, type Region, type Reveal, type Suggestion } from './AiPhoto';
import { authFetch, CARD_SHADOW, warm } from './api';
import ProgressiveBlur from '@/components/ProgressiveBlur';

// Home staging come chat: l'agente carica una foto nella conversazione, scrive cosa vuole (in italiano,
// il servizio traduce), riceve il prima/dopo e continua a chiedere sull'ultimo risultato. Caricare
// un'altra foto riparte da quella. "Continua da qui" su un risultato vecchio lo rende la base.

type Scene = 'interno' | 'esterno' | 'giardino' | 'planimetria';
const ROOM_LABEL: Record<string, string> = { soggiorno: 'un soggiorno', cucina: 'una cucina', camera: 'una camera da letto', cameretta: 'una cameretta', bagno: 'un bagno', sala: 'una sala da pranzo', studio: 'uno studio', ingresso: 'un ingresso', corridoio: 'un corridoio', balcone: 'un balcone', cantina: 'una cantina', box: 'un box' };
const SCENE_LABEL: Record<Scene, string> = { interno: 'un interno', esterno: 'una facciata', giardino: 'un giardino', planimetria: 'una planimetria' };

type Msg =
  | { id: string; role: 'divider'; image: string }
  | { id: string; role: 'user'; text?: string; image?: string; seen?: string | null; region?: Region }
  | { id: string; role: 'ai'; before: string; out: string | null; busy: boolean; reveal: Reveal; err?: string; text: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
// planimetria: rendering con regole sue, dal testo prendo solo lo stile dell'arredo
const planStyle = (t: string) => (/nordic|scandinav/i.test(t) ? 'nordic' : /lusso|luxury|elegan/i.test(t) ? 'industrial' : /boho/i.test(t) ? 'boho' : 'modern');


export default function StagingChat({ onMany }: { onMany: (files: FileList) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [base, setBase] = useState<string | null>(null); // immagine su cui lavora la prossima richiesta
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [scene, setScene] = useState<Scene>('interno');
  const [tick, setTick] = useState(0); // messaggi a rotazione durante la generazione
  const [drag, setDrag] = useState(false);
  const [faded, setFaded] = useState<Set<string>>(new Set()); // messaggi dopo un "Ricomincia da qui"
  const [selecting, setSelecting] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const busy = msgs.some(m => m.role === 'ai' && m.busy);

  // GPU: si accende appena entri nella chat e resta accesa finche' la usi (segnale ogni 50 s, spegnimento
  // a 60 s). Dopo 5 minuti senza scrivere, caricare o generare non la teniamo piu' accesa; uscendo dalla
  // pagina si spegne da sola. Qualsiasi attivita' la riaccende.
  const lastActive = useRef(0);
  const touch = useCallback(() => { const now = Date.now(); if (now - lastActive.current > 5 * 60_000) warm('photo'); lastActive.current = now; }, []);
  useEffect(() => {
    lastActive.current = Date.now();
    warm('photo');
    const t = setInterval(() => { if (Date.now() - lastActive.current < 5 * 60_000) warm('photo'); }, 50_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick(x => x + 1), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const patch = (id: string, p: Partial<Extract<Msg, { role: 'ai' }>>) => setMsgs(ms => ms.map(m => (m.id === id && m.role === 'ai' ? { ...m, ...p } : m)));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    touch();
    if (files.length > 1) { onMany(files); return; } // piu' foto insieme: vista a griglia
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    const img = await fileToResizedDataUrl(f, 1500);
    const id = uid();
    setMsgs(ms => [...ms, { id, role: 'user', image: img, seen: null }]);
    setBase(img);
    // Riconoscimento del tipo di foto e della stanza: imposta il tipo da solo e lo dice nel messaggio guida
    try {
      const r = await authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageBase64: img }) });
      const c = r.ok ? await r.json() : null;
      if (c?.scene) {
        setScene(c.scene);
        const what = c.scene === 'interno' ? (ROOM_LABEL[c.room] ?? 'un interno') : SCENE_LABEL[c.scene as Scene];
        setMsgs(ms => ms.map(m => (m.id === id && m.role === 'user' ? { ...m, seen: what } : m)));
      }
    } catch { /* senza riconoscimento resta il tipo scelto a mano */ }
  };

  const send = async (given?: string, sug?: Suggestion | null) => {
    const t = (given ?? text).trim();
    const pk = given ? sug ?? null : picked;
    if (!t || !base || busy) return;
    touch();
    const id = uid();
    const before = base;
    const zone = region;
    setMsgs(ms => [...ms, { id: uid(), role: 'user', text: t, region: zone ?? undefined }, { id, role: 'ai', before, out: null, busy: true, reveal: null, text: t }]);
    setText(''); setPicked(null); setRegion(null); setSelecting(false);
    const req: EditRequest = {
      ...(before.startsWith('data:') ? { imageBase64: before } : { imageUrl: before }),
      ...(scene === 'planimetria'
        ? { planimetria: true, style: planStyle(t) }
        : { scene, ...(zone ? { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t, region: zone } : pk && t === pk.label && !pk.req.prompt ? pk.req : { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t }) }),
    };
    const res = await authFetch('/api/platform/photo-edit', { method: 'POST', body: JSON.stringify(req) }).catch(() => null);
    let d = res ? await res.json().catch(() => ({})) : {};
    if (AI_MOCK && res?.status === 401) { await wait(4000); d = { url: before }; } // anteprima senza login
    if (!d.url) { patch(id, { busy: false, err: d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Modifica non riuscita, riprova.' }); return; }
    patch(id, { busy: false, out: d.url, reveal: 'burst' });
    setBase(d.url); // la prossima richiesta continua da qui
    setTimeout(() => patch(id, { reveal: 'line' }), 600);
    setTimeout(() => patch(id, { reveal: 'slider' }), 1450);
  };

  // Ricomincia da qui: i messaggi successivi restano (si puo' ripartire anche da li') ma sbiaditi,
  // e in fondo un divisore con la versione da cui si riparte
  const restartFrom = (i: number, url: string) => {
    setFaded(f => new Set([...f, ...msgs.slice(i + 1).map(x => x.id)]));
    setMsgs(ms => [...ms, { id: uid(), role: 'divider', image: url }]);
    setBase(url); setRegion(null); setSelecting(false);
  };
  const empty = msgs.length === 0;
  const picker = <input type="file" accept="image/*" multiple className="hidden" onChange={e => { upload(e.target.files); e.target.value = ''; }} />;
  // i suggerimenti partono subito, senza passare dal campo
  const chips = (scene === 'planimetria' ? [] : QUICK_PRESETS).map(x => (
    <button key={x.id} disabled={busy} onClick={() => send(x.label, x)}
      className="shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-brand hover:text-white disabled:opacity-40">{x.label}</button>
  ));

  return (
    // Tutta l'altezza disponibile: la conversazione scorre da sola, il campo e' sempre in fondo alla pagina
    <div className="relative -mx-6 h-full" onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
      <div className="absolute inset-0 overflow-y-auto px-6 pb-36 pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Vuota: un solo invito, grande e al centro, per caricare la foto */}
          {empty && (
            <div className="flex min-h-[calc(100vh-22rem)] flex-col items-center justify-center">
              <h1 className="text-center font-display text-4xl font-bold leading-[1.2] tracking-tight md:text-5xl md:leading-[1.2]">
                <span className="blur-in inline-block">Home staging</span>
                <span className="blur-in block text-muted/70" style={{ animationDelay: '.1s' }}>Carica una foto e chiedi.</span>
              </h1>
              <label className={`rise mt-10 flex w-full max-w-xl cursor-pointer flex-col items-center gap-4 rounded-[28px] border-2 border-dashed bg-white px-8 py-12 text-center ease-smooth transition-colors ${drag ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/60'} ${CARD_SHADOW}`} style={{ animationDelay: '.2s' }}>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"><ImagePlus size={30} /></span>
                <span className="text-lg font-semibold">Carica la foto della stanza</span>
                <span className="text-sm text-muted">Trascinala qui oppure clicca il pulsante. Va bene anche una facciata, un giardino o una planimetria: la riconosco da solo.</span>
                <span className="mt-1 flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-transform hover:scale-[1.03]"><ImagePlus size={16} /> Scegli una foto</span>
                {picker}
              </label>
            </div>
          )}

          {/* Conversazione: le foto sono messaggi, quelle di AgenteImmo a sinistra e piu' piccole */}
          {msgs.map((m, i) => m.role === 'divider' ? (
            <div key={m.id} className="blur-in flex items-center gap-3 py-2 text-xs font-medium text-muted">
              <span className="h-px flex-1 bg-line" />
              <img src={m.image} alt="" className="h-8 w-12 rounded-lg object-cover ring-1 ring-black/5" /> Ripreso da questa versione
              <span className="h-px flex-1 bg-line" />
            </div>
          ) : m.role === 'user' ? (
            <div key={m.id} className={`blur-in ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className="flex justify-end">
                {m.image
                  ? <img src={m.image} alt="" className="max-h-56 max-w-[60%] rounded-3xl rounded-br-lg object-cover ring-1 ring-black/5" />
                  : <div className="max-w-[75%] rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-sm text-white">{m.region && <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px]"><SquareDashedMousePointer size={11} /> zona</span>}{m.text}</div>}
              </div>
              {m.image && i === msgs.length - 1 && !busy && (
                <div className="blur-in mt-6 max-w-[85%] rounded-3xl rounded-bl-lg bg-canvas px-4 py-3 text-sm" style={{ animationDelay: '.3s' }}>
                  <p>{m.seen ? <>Sembra <b>{m.seen}</b>. </> : 'Foto caricata. '}Cosa vuoi cambiare? Scrivilo qui sotto o tocca un suggerimento.</p>
                </div>
              )}
            </div>
          ) : (
            <div key={m.id} className={`blur-in flex justify-start ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className={`w-full max-w-[560px] rounded-3xl rounded-bl-lg bg-white p-2 ${CARD_SHADOW}`}>
                <AiPhotoStage src={m.before} busy={m.busy} out={m.out} reveal={m.reveal} msg={tick % 5} fileName="home-staging.jpg" className="aspect-[3/2]" />
                {m.err && <p className="px-2 pt-2 text-sm text-rose-600">{m.err}</p>}
                {m.out && !m.busy && (
                  <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-2 text-xs text-muted">
                    <span className="truncate">«{m.text}»</span>
                    {/* Modifica: seleziona una zona su questa foto e scrivi cosa fare li' */}
                    <button onClick={() => { if (base !== m.out) restartFrom(i, m.out!); setSelecting(true); }}
                      className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium text-ink hover:bg-canvas"><SquareDashedMousePointer size={12} /> Modifica</button>
                    {base !== m.out
                      ? <button onClick={() => restartFrom(i, m.out!)} className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium text-brand hover:bg-brand/5"><RotateCcw size={12} /> Ricomincia da qui</button>
                      : <span className="shrink-0 font-medium text-emerald-600">Si continua da qui</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
      </div>

      {/* Sfumatura progressiva in alto e in basso: la conversazione scorre sotto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6"><ProgressiveBlur side="top" fade={24} /></div>

      {/* Campo della chat: sempre in fondo alla pagina, sopra la conversazione */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-5 pt-10">
        <div className="pointer-events-none absolute inset-0"><ProgressiveBlur side="bottom" fade={24} /></div>
        <div className="relative mx-auto max-w-3xl">
          {/* Selezione di una zona: trascina sulla foto per disegnare il rettangolo */}
          {selecting && base && <ZonePicker src={base} region={region} onChange={setRegion} onClose={() => setSelecting(false)} />}
          {region && !selecting && (
            <div className="blur-in mb-2 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-700/20"><SquareDashedMousePointer size={13} /> Zona selezionata: scrivi cosa fare lì</span>
              <button onClick={() => setSelecting(true)} className="font-medium text-muted hover:text-ink">Cambia</button>
              <button onClick={() => setRegion(null)} aria-label="Togli zona" className="text-muted hover:text-ink"><X size={14} /></button>
            </div>
          )}
          {/* Suggerimenti: una riga sola sopra il campo, scorre di lato; toccati partono subito */}
          {base && !busy && (
            <div className="blur-in -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ maskImage: 'linear-gradient(90deg, #000 90%, transparent)' }}>{chips}</div>
          )}
          <div className={`flex items-center gap-1.5 rounded-[26px] bg-white p-2 pl-2.5 ${CARD_SHADOW} ${drag ? 'ring-2 ring-brand' : ''}`}>
            {/* Foto: icona come nelle chat, a sinistra del testo */}
            <label title={base ? 'Carica un\'altra foto' : 'Carica una foto'} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">
              <ImagePlus size={20} />{picker}
            </label>
            {base && (
              <button onClick={() => setSelecting(v => !v)} title="Seleziona una zona della foto" aria-pressed={selecting}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ease-smooth transition-colors ${selecting || region ? 'bg-rose-50 text-rose-600' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
                <SquareDashedMousePointer size={19} />
              </button>
            )}
            <textarea rows={1} value={text} onChange={e => { setText(e.target.value); touch(); }} disabled={!base}
              placeholder={!base ? 'Prima carica una foto, poi scrivi qui cosa cambiare' : region ? 'Cosa faccio nella zona? Es. togli il letto' : 'Cosa vuoi cambiare? Es. togli il divano e metti un tavolo da pranzo'}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="block h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted/60 disabled:cursor-not-allowed" />
            <button onClick={() => send()} disabled={!text.trim() || !base || busy} aria-label="Invia"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-95 disabled:opacity-40">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disegno della zona sulla foto corrente: si trascina un rettangolo (bordo rosso tratteggiato).
function ZonePicker({ src, region, onChange, onClose }: { src: string; region: Region | null; onChange: (r: Region | null) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const at = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current) return;
    const p = at(e), s = start.current;
    onChange({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  return (
    <div className={`blur-in mb-2 rounded-[22px] bg-white p-2 ${CARD_SHADOW}`}>
      <div className="mb-2 flex items-center justify-between px-1 text-xs">
        <span className="font-medium">Trascina sulla foto per selezionare la zona da modificare</span>
        <button onClick={onClose} className="rounded-full bg-ink px-3 py-1 font-semibold text-white">{region && region.w > 0.02 ? 'Fatto' : 'Chiudi'}</button>
      </div>
      <div ref={box} className="relative mx-auto max-h-[45vh] w-fit cursor-crosshair touch-none select-none overflow-hidden rounded-2xl"
        onPointerDown={e => { (e.target as HTMLElement).setPointerCapture(e.pointerId); start.current = at(e); onChange(null); }}
        onPointerMove={move} onPointerUp={() => { start.current = null; }}>
        <img src={src} alt="" draggable={false} className="block max-h-[45vh] w-auto" />
        {region && (
          <div className="pointer-events-none absolute border-2 border-dashed border-rose-500 bg-rose-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,.35)]"
            style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%` }} />
        )}
      </div>
    </div>
  );
}
