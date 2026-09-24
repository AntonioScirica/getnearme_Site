'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ImagePlus, Loader2, RotateCcw } from 'lucide-react';
import { fileToResizedDataUrl } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import { AiPhotoStage, QUICK_PRESETS, useKeepPhotoGpu, type EditRequest, type Reveal, type Suggestion } from './AiPhoto';
import { authFetch, CARD_SHADOW } from './api';

// Home staging come chat: l'agente carica una foto nella conversazione, scrive cosa vuole (in italiano,
// il servizio traduce), riceve il prima/dopo e continua a chiedere sull'ultimo risultato. Caricare
// un'altra foto riparte da quella. "Continua da qui" su un risultato vecchio lo rende la base.

type Scene = 'interno' | 'esterno' | 'giardino' | 'planimetria';
type Msg =
  | { id: string; role: 'user'; text?: string; image?: string }
  | { id: string; role: 'ai'; before: string; out: string | null; busy: boolean; reveal: Reveal; err?: string; text: string };

const SCENES: { id: Scene; label: string }[] = [
  { id: 'interno', label: 'Interno' }, { id: 'esterno', label: 'Facciata' }, { id: 'giardino', label: 'Giardino' }, { id: 'planimetria', label: 'Planimetria' },
];
const uid = () => Math.random().toString(36).slice(2, 10);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
// planimetria: rendering con regole sue, dal testo prendo solo lo stile dell'arredo
const planStyle = (t: string) => (/nordic|scandinav/i.test(t) ? 'nordic' : /lusso|luxury|elegan/i.test(t) ? 'industrial' : /boho/i.test(t) ? 'boho' : 'modern');

function KeepGpu() { useKeepPhotoGpu(); return null; }

export default function StagingChat({ onMany }: { onMany: (files: FileList) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [base, setBase] = useState<string | null>(null); // immagine su cui lavora la prossima richiesta
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [scene, setScene] = useState<Scene>('interno');
  const [tick, setTick] = useState(0); // messaggi a rotazione durante la generazione
  const [drag, setDrag] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const busy = msgs.some(m => m.role === 'ai' && m.busy);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs.length]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick(x => x + 1), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const patch = (id: string, p: Partial<Extract<Msg, { role: 'ai' }>>) => setMsgs(ms => ms.map(m => (m.id === id && m.role === 'ai' ? { ...m, ...p } : m)));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (files.length > 1) { onMany(files); return; } // piu' foto insieme: vista a griglia
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    const img = await fileToResizedDataUrl(f, 1500);
    setMsgs(ms => [...ms, { id: uid(), role: 'user', image: img }]);
    setBase(img);
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !base || busy) return;
    const id = uid();
    const before = base;
    setMsgs(ms => [...ms, { id: uid(), role: 'user', text: t }, { id, role: 'ai', before, out: null, busy: true, reveal: null, text: t }]);
    setText(''); setPicked(null);
    const req: EditRequest = {
      ...(before.startsWith('data:') ? { imageBase64: before } : { imageUrl: before }),
      ...(scene === 'planimetria'
        ? { planimetria: true, style: planStyle(t) }
        : { scene, ...(picked && t === picked.label && !picked.req.prompt ? picked.req : { prompt: picked?.req.prompt && t === picked.label ? picked.req.prompt : t }) }),
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

  const empty = msgs.length === 0;
  const picker = <input type="file" accept="image/*" multiple className="hidden" onChange={e => { upload(e.target.files); e.target.value = ''; }} />;

  return (
    <div className={`mx-auto flex max-w-3xl flex-col ${empty ? 'min-h-[calc(100vh-12rem)] justify-center' : ''} pb-8 pt-6`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
      {base && <KeepGpu />}

      {empty && (
        <h1 className="mb-8 text-center font-display text-4xl font-bold tracking-tight md:text-5xl">
          <span className="blur-in inline-block">Home staging</span>
          <span className="blur-in block text-muted/70" style={{ animationDelay: '.1s' }}>Carica una foto e chiedi quello che vuoi.</span>
        </h1>
      )}

      {/* Conversazione */}
      <div className="space-y-4">
        {msgs.map(m => m.role === 'user' ? (
          <div key={m.id} className="blur-in flex justify-end">
            {m.image
              ? <img src={m.image} alt="" className="max-h-72 max-w-[75%] rounded-3xl object-cover ring-1 ring-black/5" />
              : <div className="max-w-[75%] rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-sm text-white">{m.text}</div>}
          </div>
        ) : (
          <div key={m.id} className={`blur-in rounded-[24px] bg-white p-2.5 ${CARD_SHADOW}`}>
            <AiPhotoStage src={m.before} busy={m.busy} out={m.out} reveal={m.reveal} msg={tick % 5} fileName="home-staging.jpg" className="aspect-[3/2] max-h-[60vh]" />
            {m.err && <p className="px-2 pt-2 text-sm text-rose-600">{m.err}</p>}
            {m.out && !m.busy && (
              <div className="flex items-center justify-between gap-2 px-2 pt-2 text-xs text-muted">
                <span className="truncate">«{m.text}»</span>
                {base !== m.out
                  ? <button onClick={() => setBase(m.out)} className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium text-brand hover:bg-brand/5"><RotateCcw size={12} /> Continua da questa</button>
                  : <span className="shrink-0 font-medium text-emerald-600">Si continua da qui</span>}
              </div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>

      {/* Composer: sempre in basso, stile home */}
      <div className={`${empty ? '' : 'sticky bottom-4 mt-6'} z-20`}>
        {base && !busy && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(scene === 'planimetria' ? [] : QUICK_PRESETS).map(x => (
              <button key={x.id} onClick={() => { setText(x.label); setPicked(x); }}
                className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink/80 ring-1 ring-inset ring-black/10 backdrop-blur ease-smooth transition-colors hover:bg-white">{x.label}</button>
            ))}
          </div>
        )}
        <div className={`rounded-[26px] bg-white p-2 ${CARD_SHADOW} ${drag ? 'ring-2 ring-brand' : ''}`}>
          <div className="flex items-end gap-2">
            <label title="Carica una foto" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-canvas text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-white">
              <ImagePlus size={18} />{picker}
            </label>
            <textarea rows={1} value={text} onChange={e => setText(e.target.value)} disabled={!base}
              placeholder={!base ? 'Carica o trascina una foto per iniziare' : scene === 'planimetria' ? 'Che stile di arredo? Es. moderno, nordico' : 'Cosa vuoi cambiare? Es. togli il divano e metti un tavolo da pranzo'}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-muted/60 disabled:cursor-not-allowed" />
            <button onClick={send} disabled={!text.trim() || !base || busy} aria-label="Invia"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-95 disabled:opacity-40">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1 px-1">
            {SCENES.map(s => (
              <button key={s.id} onClick={() => setScene(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ease-smooth transition-colors ${scene === s.id ? 'bg-canvas text-ink ring-1 ring-inset ring-black/10' : 'text-muted hover:text-ink'}`}>{s.label}</button>
            ))}
            <span className="ml-auto hidden text-[11px] text-muted sm:block">Più foto insieme? Caricale tutte: le fai in blocco.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
