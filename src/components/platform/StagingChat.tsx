'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Download, ImagePlus, LayoutGrid, Loader2, Monitor, MousePointerClick, RotateCcw, SquareDashed, SquareDashedMousePointer, X } from 'lucide-react';
import { fileToResizedDataUrl } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import { AiPhotoStage, QUICK_PRESETS, type EditRequest, type Region, type Reveal, type Suggestion } from './AiPhoto';
import { authFetch, CARD_SHADOW, warm } from './api';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import LightSwap from '@/components/ui/LightSwap';
import AutoSize from '@/components/ui/AutoSize';
import { MorphTarget, morphFrom } from '@/components/ui/Morph';
import PhotoViewer from '@/components/ui/PhotoViewer';
import LibraryPicker from './LibraryPicker';

// Home staging come chat: l'agente carica una foto nella conversazione, scrive cosa vuole (in italiano,
// il servizio traduce), riceve il prima/dopo e continua a chiedere sull'ultimo risultato. Caricare
// un'altra foto riparte da quella. "Continua da qui" su un risultato vecchio lo rende la base.

type Scene = 'interno' | 'esterno' | 'giardino' | 'planimetria';
const ROOM_LABEL: Record<string, string> = { soggiorno: 'un soggiorno', cucina: 'una cucina', camera: 'una camera da letto', cameretta: 'una cameretta', bagno: 'un bagno', sala: 'una sala da pranzo', studio: 'uno studio', ingresso: 'un ingresso', corridoio: 'un corridoio', balcone: 'un balcone', cantina: 'una cantina', box: 'un box' };
const SCENE_LABEL: Record<Scene, string> = { interno: 'un interno', esterno: 'una facciata', giardino: 'un giardino', planimetria: 'una planimetria' };
// Cosa sembra la foto: correggibile dal menu nel messaggio ("room:cucina" oppure "scene:esterno")
const SEEN_OPTIONS: DropdownOption<string>[] = [
  ...['soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'sala', 'studio', 'ingresso', 'corridoio', 'balcone', 'cantina', 'box'].map(r => ({ value: `room:${r}`, label: ROOM_LABEL[r], group: 'Interno' })),
  ...(['esterno', 'giardino', 'planimetria'] as const).map(x => ({ value: `scene:${x}`, label: SCENE_LABEL[x], group: 'Altro' })),
];
// Suggerimenti in base a cosa c'e' nella foto (la cucina non ha "Arreda nordico", la facciata non ha "Svuota la stanza")
const S = (id: string, label: string, req: Suggestion['req']): Suggestion => ({ id, label, req });
const EMPTY = S('empty', 'Svuota la stanza', { style: 'empty' }), LIGHT = S('day', 'Più luce naturale', { angle: 'day' }), TIDY = QUICK_PRESETS.find(x => x.id === 'tidy')!;
function suggestionsFor(kind: string | null): Suggestion[] {
  switch (kind) {
    case 'room:cucina': return [S('k-modern', 'Cucina moderna', { prompt: 'Rinnova la cucina in stile moderno: ante lisce, piano di lavoro chiaro, elettrodomestici da incasso' }), S('k-wood', 'Bianco e legno', { prompt: 'Rendi la cucina bianca con dettagli in legno chiaro' }), TIDY, LIGHT, EMPTY];
    case 'room:camera': return [S('b-modern', 'Camera moderna', { prompt: 'Arreda come camera da letto moderna: letto matrimoniale, comodini, armadio, tessili neutri' }), S('b-nordic', 'Camera accogliente', { prompt: 'Arreda come camera da letto accogliente in stile nordico, legno chiaro e tessili morbidi' }), TIDY, LIGHT, EMPTY];
    case 'room:cameretta': return [S('c-kids', 'Cameretta bambini', { prompt: 'Arreda come cameretta per bambini: lettino, scrivania, giochi ordinati, colori tenui' }), S('c-teen', 'Camera ragazzi', { prompt: 'Arreda come camera per ragazzi: letto singolo, scrivania, libreria' }), TIDY, LIGHT, EMPTY];
    case 'room:bagno': return [S('w-modern', 'Bagno moderno', { prompt: 'Rinnova il bagno in stile moderno: sanitari sospesi, doccia in vetro, piastrelle chiare grandi' }), S('w-light', 'Piastrelle chiare', { prompt: 'Cambia le piastrelle con piastrelle chiare moderne, lascia sanitari e disposizione' }), TIDY, LIGHT];
    case 'room:balcone': return [S('o-furnish', 'Arreda il balcone', { prompt: 'Arreda il balcone con un tavolino, due sedie da esterno e qualche pianta' }), S('o-plants', 'Aggiungi piante', { prompt: 'Aggiungi piante e fiori in vaso lungo il balcone' }), S('o-night', 'Giorno e notte', { style: 'daynight' }), TIDY];
    case 'scene:esterno': return [S('f-renew', 'Rinnova la facciata', { style: 'empty' }), S('f-modern', 'Facciata moderna', { style: 'modern' }), S('f-sky', 'Cielo azzurro', { prompt: 'Cielo azzurro limpido e luce di sole, senza cambiare l’edificio' }), S('f-night', 'Giorno e notte', { style: 'daynight' })];
    case 'scene:giardino': return [S('g-renew', 'Giardino curato', { style: 'empty' }), S('g-furnish', 'Arreda il giardino', { prompt: 'Aggiungi un tavolo con sedie da esterno e un ombrellone, lascia prato e piante' }), S('g-modern', 'Giardino moderno', { style: 'modern' }), S('g-night', 'Luci di sera', { style: 'daynight' })];
    case 'scene:planimetria': return [];
    default: return QUICK_PRESETS;
  }
}
const seenLabel = (k: string) => SEEN_OPTIONS.find(o => o.value === k)?.label ?? 'un interno';

type Msg =
  | { id: string; role: 'divider'; image: string }
  | { id: string; role: 'user'; text?: string; image?: string; seen?: string | null; region?: Region }
  | { id: string; role: 'ai'; before: string; out: string | null; busy: boolean; reveal: Reveal; err?: string; text: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
// planimetria: rendering con regole sue, dal testo prendo solo lo stile dell'arredo
const planStyle = (t: string) => (/nordic|scandinav/i.test(t) ? 'nordic' : /lusso|luxury|elegan/i.test(t) ? 'industrial' : /boho/i.test(t) ? 'boho' : 'modern');


export default function StagingChat({ onMany }: { onMany: (files: FileList | File[]) => void }) {
  const [library, setLibrary] = useState(false); // scelta foto: vetrina o computer
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [base, setBase] = useState<string | null>(null); // immagine su cui lavora la prossima richiesta
  const [resumed, setResumed] = useState<string | null>(null); // versione da cui si e' ripartiti a mano
  const [viewer, setViewer] = useState<{ src: string; before?: string } | null>(null); // foto a tutto schermo
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [scene, setScene] = useState<Scene>('interno');
  const [kind, setKind] = useState<string | null>(null); // es. "room:cucina", "scene:giardino": decide i suggerimenti
  const [tick, setTick] = useState(0); // messaggi a rotazione durante la generazione
  const [drag, setDrag] = useState(false);
  const [faded, setFaded] = useState<Set<string>>(new Set()); // messaggi dopo un "Ricomincia da qui"
  const [selecting, setSelecting] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  // Clic sugli oggetti: punti + maschera dell'oggetto riconosciuto (anteprima)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [mask, setMask] = useState<string | null>(null);
  const clearZone = () => { setRegion(null); setPoints([]); setMask(null); };
  const scroller = useRef<HTMLDivElement>(null);
  // in fondo davvero (padding compreso), cosi' l'ultimo messaggio non resta sotto il campo
  const toBottom = useCallback(() => requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })), []);
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

  useEffect(() => { toBottom(); }, [msgs.length, selecting, toBottom]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick(x => x + 1), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const patch = (id: string, p: Partial<Extract<Msg, { role: 'ai' }>>) => setMsgs(ms => ms.map(m => (m.id === id && m.role === 'ai' ? { ...m, ...p } : m)));

  const upload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    touch();
    if (files.length > 1) { onMany(files); return; } // piu' foto insieme: vista a griglia
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    // Riconoscimento su una copia piccola (448 px): parte subito, carica poco e il modello la legge in un terzo del tempo
    const small = await fileToResizedDataUrl(f, 448);
    const classified = authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageBase64: small }) }).catch(() => null);
    const img = await fileToResizedDataUrl(f, 1500);
    const id = uid();
    setMsgs(ms => [...ms, { id, role: 'user', image: img, seen: null }]);
    setKind(null); // nuova foto: suggerimenti generici finche' non la riconosce
    setBase(img);
    // Tipo di foto e stanza: imposta il tipo da solo e lo dice nel messaggio guida
    try {
      const r = await classified;
      if (!r) return;
      const c = r.ok ? await r.json() : null;
      if (c?.scene) {
        setScene(c.scene);
        const what = c.scene === 'interno' ? `room:${ROOM_LABEL[c.room] ? c.room : 'soggiorno'}` : `scene:${c.scene}`;
        setMsgs(ms => ms.map(m => (m.id === id && m.role === 'user' ? { ...m, seen: what } : m)));
        setKind(what);
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
    const pts = points;
    setMsgs(ms => [...ms, { id: uid(), role: 'user', text: t, region: zone ?? (pts.length ? { x: 0, y: 0, w: 0, h: 0 } : undefined) }, { id, role: 'ai', before, out: null, busy: true, reveal: null, text: t }]);
    setText(''); setPicked(null); clearZone(); setSelecting(false);
    const req: EditRequest = {
      ...(before.startsWith('data:') ? { imageBase64: before } : { imageUrl: before }),
      ...(scene === 'planimetria'
        ? { planimetria: true, style: planStyle(t) }
        : { scene, ...(zone || pts.length ? { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t, ...(pts.length ? { points: pts } : { region: zone! }) } : pk && t === pk.label && !pk.req.prompt ? pk.req : { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t }) }),
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
    setResumed(url);
    setFaded(f => new Set([...f, ...msgs.slice(i + 1).map(x => x.id)]));
    setMsgs(ms => [...ms, { id: uid(), role: 'divider', image: url }]);
    setBase(url); clearZone(); setSelecting(false);
  };
  // Clic su un oggetto: il worker (SAM) ritorna la maschera, mostrata sulla foto. Piu' clic = piu' oggetti.
  const pickAt = async (p: { x: number; y: number }) => {
    if (!base) return;
    touch();
    const pts = [...points, p];
    setRegion(null); setPoints(pts); setMask('loading');
    const res = await authFetch('/api/platform/photo-mask', { method: 'POST', body: JSON.stringify({ ...(base.startsWith('data:') ? { imageBase64: base } : { imageUrl: base }), points: pts }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setMask(d.mask ?? null);
  };
  // anteprima: maschera dell'oggetto sotto il mouse, senza confermarlo
  const previewAt = async (p: { x: number; y: number }): Promise<string | null> => {
    if (!base) return null;
    const res = await authFetch('/api/platform/photo-mask', { method: 'POST', body: JSON.stringify({ ...(base.startsWith('data:') ? { imageBase64: base } : { imageUrl: base }), points: [...points, p] }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    return d.mask ?? null;
  };
  // tutti gli oggetti della foto in una mappa (per l'anteprima istantanea); null se il worker non la sa fare
  const segmentsOf = async (): Promise<string | null> => {
    if (!base) return null;
    const res = await authFetch('/api/platform/photo-mask', { method: 'POST', body: JSON.stringify({ ...(base.startsWith('data:') ? { imageBase64: base } : { imageUrl: base }), segments: true }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    return d.segments ?? null;
  };
  const closeLibrary = useCallback(() => setLibrary(false), []);
  const empty = msgs.length === 0;
  const picker = <input type="file" accept="image/*" multiple className="hidden" onChange={e => { upload(e.target.files); e.target.value = ''; }} />;
  // i suggerimenti partono subito, senza passare dal campo
  const chips = suggestionsFor(kind).map(x => (
    <button key={x.id} disabled={busy} onClick={() => send(x.label, x)}
      className="shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-brand hover:text-white disabled:opacity-40">{x.label}</button>
  ));

  // proporzioni vere delle foto: il risultato segue la foto (verticale resta verticale)
  const [ratios, setRatios] = useState<Record<string, number>>({});
  // si misura la foto di lavoro appena scelta: quando arriva il messaggio del risultato ha gia' la forma giusta (niente saltino)
  useEffect(() => {
    const srcs = [base, ...msgs.map(m => (m.role === 'ai' ? m.before : null))].filter((x): x is string => !!x && !ratios[x]);
    for (const src of new Set(srcs)) {
      const img = new Image();
      img.onload = () => setRatios(r => ({ ...r, [src]: img.naturalWidth / img.naturalHeight }));
      img.src = src;
    }
  }, [base, msgs, ratios]);

  // selezione zona: prende il posto del messaggio che contiene la foto di lavoro, cosi' la card si trasforma sul posto
  const zoneOwner = selecting && base ? msgs.findLastIndex(m => (m.role === 'ai' && m.out === base) || (m.role === 'user' && m.image === base)) : -1;
  const zonePicker = (inline?: number) => selecting && base ? <ZonePicker inline={inline} src={base} region={region} points={points} mask={mask} onChange={r => { setRegion(r); setPoints([]); setMask(null); }} onPick={pickAt} onPreview={previewAt} onSegments={segmentsOf} onLoad={toBottom} busy={busy} onSubmit={t => send(t)} onCancel={() => { clearZone(); setSelecting(false); }} /> : null;

  return (
    // Tutta l'altezza disponibile: la conversazione scorre da sola, il campo e' sempre in fondo alla pagina
    <div className="relative -mx-6 h-full" onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
      <div ref={scroller} className="absolute inset-0 overflow-y-auto px-6 pb-48 pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                <span className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="flex h-11 items-center gap-2 rounded-full bg-canvas px-6 text-sm font-semibold text-ink ease-smooth transition-colors hover:bg-line"><Monitor size={16} /> Dal computer</span>
                  {/* dentro la label: senza preventDefault aprirebbe anche la scelta file */}
                  <button type="button" onClick={e => { e.preventDefault(); setLibrary(true); }} className="flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-transform hover:scale-[1.03]"><LayoutGrid size={16} /> Dalla tua vetrina</button>
                </span>
                {picker}
              </label>
            </div>
          )}

          {/* Conversazione: le foto sono messaggi, quelle di AgenteImmo a sinistra e piu' piccole */}
          {msgs.map((m, i) => i === zoneOwner && m.role === 'user' ? (
            // il messaggio con la foto su cui si lavora diventa lui stesso la selezione della zona (niente messaggio nuovo)
            <div key={m.id} className="flex justify-start">{zonePicker()}</div>
          ) : m.role === 'divider' ? (
            <div key={m.id} className="blur-in flex items-center gap-3 py-2 text-xs font-medium text-muted">
              <span className="h-px flex-1 bg-line" />
              <img src={m.image} alt="" className="h-8 w-12 rounded-lg object-cover ring-1 ring-black/5" /> Ripreso da questa versione
              <span className="h-px flex-1 bg-line" />
            </div>
          ) : m.role === 'user' ? (
            <div key={m.id} className={`blur-in ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className="flex justify-end">
                {m.image
                  ? <button type="button" onClick={() => setViewer({ src: m.image! })} className="max-w-[60%] cursor-zoom-in"><img src={m.image} alt="Foto caricata" data-base-photo={base === m.image ? '' : undefined} className="max-h-56 rounded-3xl rounded-br-2xl object-cover ring-1 ring-black/5 ease-smooth transition-transform hover:scale-[1.01]" /></button>
                  : <div className="max-w-[75%] rounded-3xl rounded-br-2xl bg-ink px-4 py-2.5 text-sm text-white">{m.region && <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px]"><SquareDashedMousePointer size={11} /> zona</span>}{m.text}</div>}
              </div>
              {m.image && i === msgs.length - 1 && !busy && (
                <div className="blur-in mt-6 max-w-[85%] rounded-3xl rounded-bl-2xl bg-canvas px-4 py-3 text-sm" style={{ animationDelay: '.3s' }}>
                  {/* quando riconosce la foto il messaggio si riscrive parola per parola (key = cosa ha visto) */}
                  <AutoSize><LightSwap swapKey={m.seen ?? 'caricata'}>
                    <p>{m.seen ? <>Sembra{' '}
                      <Dropdown value={m.seen} options={SEEN_OPTIONS} className="font-bold" onChange={v => {
                        setMsgs(ms => ms.map(x => (x.id === m.id && x.role === 'user' ? { ...x, seen: v } : x)));
                        setScene(v.startsWith('scene:') ? (v.slice(6) as Scene) : 'interno'); setKind(v);
                      }}>{seenLabel(m.seen)}</Dropdown>. </> : 'Foto caricata. '}Cosa vuoi cambiare? Scrivilo qui sotto o tocca un suggerimento.</p>
                  </LightSwap></AutoSize>
                </div>
              )}
            </div>
          ) : (
            <div key={m.id} className={`blur-in flex justify-start ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className={`w-full rounded-3xl rounded-bl-2xl bg-white p-2 ${CARD_SHADOW}`} style={{ maxWidth: `min(560px, calc(60vh * ${ratios[m.before] ?? 1.5} + 16px))` }}><AutoSize>
                {/* Modifica: la foto resta dov'e' e diventa selezionabile, sotto cambiano solo i pulsanti */}
                {/* raggio interno = esterno - padding: se la foto tocca l'angolo della coda (16px), 8px */}
                {/* clic sulla foto = a tutto schermo con prima/dopo (non se trascini il cursore prima/dopo o premi Scarica) */}
                <div className={`relative ${m.out && !m.busy ? 'cursor-zoom-in' : ''}`} style={{ aspectRatio: ratios[m.before] ?? 1.5 }} data-base-photo={m.out && m.out === base ? '' : undefined}
                  onPointerDown={e => { downAt.current = { x: e.clientX, y: e.clientY }; }}
                  onClick={e => {
                    const d = downAt.current;
                    if (!m.out || m.busy || (e.target as HTMLElement).closest('button, a')) return;
                    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
                    setViewer({ src: m.out, before: m.before });
                  }}><AiPhotoStage parked={i === zoneOwner} src={m.before} busy={m.busy} out={m.out} reveal={m.reveal} msg={tick % 5} fileName="home-staging.jpg" className={`h-full ${m.err || (m.out && !m.busy) ? '' : '!rounded-bl-[8px]'}`} />
                </div>
                {/* Modifica: la foto sotto resta montata e ferma, la selezione ci si appoggia sopra; sotto cambiano solo i controlli */}
                {i === zoneOwner ? zonePicker(ratios[m.before] ?? 1.5) : <>
                {m.err && <p className="blur-in px-2 pt-2 text-sm text-rose-600">{m.err}</p>}
                {m.out && !m.busy && (
                  <div className="blur-in flex min-h-12 items-center gap-3 px-2 pt-2 text-xs text-muted">
                    {/* alta quanto il campo di Modifica (8 + 40): aprendo e chiudendo la card non cambia altezza */}
                    <span className="min-w-0 flex-1 truncate">{m.text}</span>
                    {/* a destra: Modifica (zona su questa foto) e Ricomincia da qui; "Si continua da qui" solo dopo esserci tornati */}
                    <div className="flex shrink-0 items-center gap-1">
                      {resumed === m.out && base === m.out && <span className="flex h-8 items-center px-2 font-medium text-emerald-600">Si continua da qui</span>}
                      <button onClick={() => { if (base !== m.out) restartFrom(i, m.out!); setSelecting(true); }}
                        className="flex h-8 items-center gap-1.5 rounded-full px-3 font-medium leading-none text-ink hover:bg-canvas"><SquareDashedMousePointer size={14} className="translate-y-px" /> Modifica</button>
                      {base !== m.out && (
                        <>
                          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
                          <Tooltip label="Ricomincia da qui">
                            <button onClick={() => restartFrom(i, m.out!)} aria-label="Ricomincia da qui" className="flex h-8 w-8 items-center justify-center rounded-full text-brand hover:bg-brand/5"><RotateCcw size={15} /></button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                )}
                </>}
              </AutoSize></div>
            </div>
          ))}
          {/* Selezione di una zona: e' un messaggio della chat come gli altri, con i pulsanti sotto la foto */}
          {zoneOwner < 0 && zonePicker()}

        </div>
      </div>

      {library && <LibraryPicker onFiles={upload} onClose={closeLibrary} />}
      {viewer && <PhotoViewer src={viewer.src} before={viewer.before} onClose={() => setViewer(null)} />}
      {/* Sfumatura progressiva in alto e in basso: la conversazione scorre sotto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6"><ProgressiveBlur side="top" fade={24} /></div>

      {/* Campo della chat: sempre in fondo alla pagina, sopra la conversazione */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-5 pt-10">
        <div className="pointer-events-none absolute inset-0"><ProgressiveBlur side="bottom" fade={24} /></div>
        <div className="relative mx-auto max-w-3xl">
          {(region || points.length > 0) && !selecting && (
            <div className="blur-in mb-2 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-700/20"><SquareDashedMousePointer size={13} /> {points.length ? 'Oggetto selezionato' : 'Zona selezionata'}: scrivi cosa fare lì</span>
              <button onClick={() => { morphFrom(document.querySelector('[data-base-photo]'), 'zone'); setSelecting(true); }} className="font-medium text-muted hover:text-ink">Cambia</button>
              <button onClick={clearZone} aria-label="Togli zona" className="text-muted hover:text-ink"><X size={14} /></button>
            </div>
          )}
          {/* Suggerimenti: una riga sola sopra il campo, scorre di lato; toccati partono subito */}
          {base && !busy && (
            <div className="blur-in -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ maskImage: 'linear-gradient(90deg, #000 90%, transparent)' }}>{chips}</div>
          )}
          <div className={`flex items-center gap-1.5 rounded-[26px] bg-white p-2 pl-2.5 ${CARD_SHADOW} ${drag ? 'ring-2 ring-brand' : ''}`}>
            {/* foto e zona vicine, come un gruppo di strumenti */}
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => setLibrary(true)} title={base ? 'Carica un\'altra foto' : 'Carica una foto'} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">
                <ImagePlus size={20} />
              </button>
              {base && (
                <button onClick={() => { if (!selecting) morphFrom(document.querySelector('[data-base-photo]'), 'zone'); setSelecting(v => !v); }} title="Seleziona una zona della foto" aria-pressed={selecting}
                  className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-full ease-smooth transition-colors ${selecting || region || points.length ? 'bg-rose-50 text-rose-600' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
                  <SquareDashedMousePointer size={19} />
                </button>
              )}
            </div>
            <textarea rows={1} value={text} onChange={e => { setText(e.target.value); touch(); }} disabled={!base}
              placeholder={!base ? 'Prima carica una foto, poi scrivi qui cosa cambiare' : region || points.length ? 'Cosa faccio nella zona? Es. togli il letto' : 'Cosa vuoi cambiare? Es. togli il divano e metti un tavolo da pranzo'}
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

// Zona sulla foto corrente: clic su un oggetto = lo seleziona (maschera rossa), trascinare = rettangolo.
// Zona sulla foto: due strumenti. Rettangolo (di partenza): trascina. Oggetti: clicca; fermando il mouse
// su un oggetto compare l'anteprima di cosa verrebbe selezionato.
type Tool = 'rect' | 'points';
// cursore per selezionare gli oggetti: mirino tondo blu con il centro bianco
const TARGET_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="10" fill="rgba(37,99,235,.18)" stroke="#2563eb" stroke-width="2"/><circle cx="14" cy="14" r="3" fill="#fff" stroke="#2563eb" stroke-width="1.5"/></svg>')}") 14 14, pointer`;
function ZonePicker({ inline, src, region, points, mask, onChange, onPick, onPreview, onSegments, onLoad, busy, onSubmit, onCancel }: { inline?: number; src: string; region: Region | null; points: { x: number; y: number }[]; mask: string | null; onChange: (r: Region | null) => void; onPick: (p: { x: number; y: number }) => void; onPreview: (p: { x: number; y: number }) => Promise<string | null>; onSegments: () => Promise<string | null>; onLoad: () => void; busy: boolean; onSubmit: (text: string) => void; onCancel: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>('rect');
  const [hover, setHover] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cache = useRef(new Map<string, string | null>());
  // l'anteprima include i punti gia' scelti: se cambiano, quelle salvate non valgono piu'
  useEffect(() => { cache.current.clear(); }, [points.length]);
  // Mappa degli oggetti: chiesta una volta quando scegli "Oggetti", poi l'anteprima e' istantanea (niente rete)
  const seg = useRef<{ w: number; h: number; ids: Uint8ClampedArray; masks: Map<number, string> } | null>(null);
  const segAsked = useRef(false);
  const hoverId = useRef(0);
  useEffect(() => {
    if (tool !== 'points' || segAsked.current) return;
    segAsked.current = true;
    onSegments().then(url => {
      if (!url) return;
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const g = c.getContext('2d')!; g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const ids = new Uint8ClampedArray(c.width * c.height);
        for (let i = 0; i < ids.length; i++) ids[i] = d[i * 4];
        seg.current = { w: c.width, h: c.height, ids, masks: new Map() };
      };
      im.src = url;
    });
  }, [tool, onSegments]);
  const maskOf = (id: number) => {
    const s = seg.current!;
    const hit = s.masks.get(id); if (hit) return hit;
    const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
    const g = c.getContext('2d')!; const img = g.createImageData(s.w, s.h);
    for (let i = 0; i < s.ids.length; i++) { const v = s.ids[i] === id ? 255 : 0; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    const url = c.toDataURL(); s.masks.set(id, url); return url;
  };
  const at = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const pickTool = (t: Tool) => { setTool(t); setHover(null); onChange(null); };
  const down = (e: React.PointerEvent) => {
    if (tool === 'points') { setHover(null); onPick(at(e)); return; }
    (e.target as HTMLElement).setPointerCapture(e.pointerId); start.current = at(e);
  };
  const move = (e: React.PointerEvent) => {
    const p = at(e);
    if (tool === 'rect') {
      if (!start.current) return;
      const s = start.current;
      if (Math.hypot(p.x - s.x, p.y - s.y) < 0.02) return;
      onChange({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
      return;
    }
    // oggetti: con la mappa l'oggetto sotto il mouse si vede subito
    if (seg.current) {
      const s = seg.current;
      const id = s.ids[Math.min(s.h - 1, Math.floor(p.y * s.h)) * s.w + Math.min(s.w - 1, Math.floor(p.x * s.w))];
      if (id !== hoverId.current) { hoverId.current = id; setHover(id ? maskOf(id) : null); }
      return;
    }
    // senza mappa (worker vecchio): anteprima dal server dopo 120 ms di mouse fermo (posizioni gia' viste in memoria)
    if (timer.current) clearTimeout(timer.current);
    const key = `${Math.round(p.x * 33)}:${Math.round(p.y * 33)}`;
    if (cache.current.has(key)) { setHover(cache.current.get(key)!); return; }
    timer.current = setTimeout(async () => { const m = await onPreview(p); cache.current.set(key, m); setHover(m); }, 120);
  };
  const leave = () => { if (timer.current) clearTimeout(timer.current); hoverId.current = 0; setHover(null); };
  const up = () => { start.current = null; };
  const [text, setText] = useState('');
  // ponytail: larghezza di "Scarica" fissa (92px), misurarla se cambia il testo
  const [pill, setPill] = useState(!!inline);
  // chiusura al contrario: la X torna Scarica, selezione e campo sfumano, poi la card si riaccorcia
  const [closing, setClosing] = useState(false);
  const cancel = () => {
    if (!inline) { onCancel(); return; }
    setClosing(true); setPill(true);
    setTimeout(onCancel, 300); // meta' tempo: sfuma via e subito tornano i pulsanti (dissolvenza incrociata)
  };
  useEffect(() => { const t = setTimeout(() => setPill(false), 30); return () => clearTimeout(t); }, []);
  // fuoco sul campo senza far scorrere la chat (autoFocus e onLoad->in fondo facevano il saltino)
  const focused = useRef(false);
  const loading = mask === 'loading';
  const ready = (region && region.w > 0.02) || (points.length > 0 && !loading);
  const closeBtn = (
  <>
        {/* nella card del risultato il pulsante Scarica si stringe e diventa la X */}
        <button type="button" onPointerDown={e => e.stopPropagation()} onClick={cancel} aria-label="Annulla selezione" title="Annulla" style={{ width: pill ? 92 : 36, ...(closing ? { transitionDuration: '300ms' } : {}) }}
          className="pointer-events-auto absolute right-3 top-3 z-10 flex h-9 items-center justify-center overflow-hidden rounded-full bg-white/85 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur-md ease-smooth transition-[width,background-color] hover:bg-white">
          <span className={`absolute flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ease-smooth transition-opacity ${pill ? 'opacity-100' : 'opacity-0'}`}><Download size={14} /> Scarica</span>
          <X size={16} className={`ease-smooth transition-opacity ${pill ? 'opacity-0' : 'opacity-100'}`} />
        </button>
  </>
  );
  const photo = (
      <div ref={box} className={`touch-none ${inline ? `absolute inset-x-0 bottom-full z-20 ease-smooth transition-opacity ${closing ? 'pointer-events-none' : ''}` : 'relative mx-auto max-h-[calc(100vh-24rem)] w-fit'} select-none overflow-hidden rounded-2xl ${tool === 'rect' ? 'cursor-crosshair' : ''}`}
        style={{ ...(inline ? { aspectRatio: inline, ...(closing ? { opacity: 0, transitionDuration: '300ms' } : { animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) .45s both' }) } : {}), ...(tool === 'points' ? { cursor: TARGET_CURSOR } : {}) }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={leave}>
        <img src={src} alt="" draggable={false} onLoad={inline ? undefined : onLoad} className={inline ? 'block h-full w-full object-cover' : 'block max-h-[calc(100vh-24rem)] w-auto max-w-full'} />
        {!inline && closeBtn}
        {tool === 'points' && hover && !loading && (
          <div className="pointer-events-none absolute inset-0 bg-brand/35 ease-smooth transition-opacity"
            style={{ maskImage: `url(${hover})`, WebkitMaskImage: `url(${hover})`, maskMode: 'luminance', maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />
        )}
        {mask && !loading && (
          <div className="blur-in pointer-events-none absolute inset-0 bg-rose-500/50"
            style={{ maskImage: `url(${mask})`, WebkitMaskImage: `url(${mask})`, maskMode: 'luminance', maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />
        )}
        {points.map((p, i) => (
          <span key={i} className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 ring-2 ring-white ${loading ? 'animate-pulse' : ''}`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
        ))}
        {region && (
          <div className="pointer-events-none absolute border-2 border-dashed border-rose-500 bg-rose-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,.35)]"
            style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%` }} />
        )}
      </div>
  );
  // Richiesta direttamente qui: scrivi cosa fare nella zona e Modifica
  const form = (
      <form onSubmit={e => { e.preventDefault(); if (ready && text.trim() && !busy) onSubmit(text.trim()); }} className="flex w-0 min-w-full items-center gap-2 pt-2">
        {/* campo con dentro, a destra, gli strumenti di selezione (solo icone, nome nel tooltip) */}
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-transparent bg-canvas pl-4 pr-1 ease-smooth transition-colors focus-within:border-ink/15 focus-within:bg-white">
          <input ref={el => { if (el && !focused.current) { focused.current = true; el.focus({ preventScroll: true }); } }} value={text} onChange={e => setText(e.target.value)}
            placeholder={loading ? 'Riconosco l’oggetto…' : ready ? 'Cosa faccio qui? Es. togli la tv' : tool === 'rect' ? 'Trascina sulla foto per disegnare la zona' : 'Passa sopra un oggetto e cliccalo'}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
          {([['rect', 'Rettangolo: trascina per disegnare la zona', SquareDashed], ['points', 'Oggetti: clicca per selezionarli', MousePointerClick]] as const).map(([id, l, I]) => (
            <Tooltip key={id} label={l}>
              <button type="button" onClick={() => pickTool(id)} aria-label={l} aria-pressed={tool === id}
                className={`flex h-8 w-8 items-center justify-center rounded-full ease-smooth transition-colors ${tool === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}><I size={15} /></button>
            </Tooltip>
          ))}
        </div>
        <button type="submit" disabled={!ready || !text.trim() || busy}
          className="h-10 shrink-0 rounded-full bg-brand px-5 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40">Modifica</button>
      </form>
  );
  // dentro la card del risultato: stessa foto, stesso posto, cambiano solo i controlli sotto
  // prima la card si allunga (AutoSize), poi il campo compare: solo dissolvenza, uno spostamento verso il basso finiva tagliato dal bordo
  if (inline) return (
    <div className="relative">
      {photo}
      {/* la X sta fuori dalla foto che sfuma: in chiusura resta piena e si allarga fino a Scarica */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full z-30" style={{ aspectRatio: inline }}>{closeBtn}</div>
      {/* in chiusura l'animazione d'ingresso va tolta, altrimenti il suo "both" tiene l'opacita' a 1 e il campo sparisce di colpo */}
      <div className="duration-300 ease-smooth transition-opacity" style={closing ? { opacity: 0 } : { animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) .25s both' }}>{form}</div>
    </div>
  );
  return (
    <div className="flex justify-start">
    <MorphTarget id="zone" className={`w-fit max-w-[min(640px,100%)] rounded-3xl rounded-bl-2xl bg-white p-2 ${CARD_SHADOW}`}>
      <div className="w-fit max-w-full">
      {photo}
      {form}
      </div>
    </MorphTarget>
    </div>
  );
}
