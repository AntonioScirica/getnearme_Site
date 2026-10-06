'use client';

// Casa 3D dalla planimetria: riconoscimento (un piano alla volta), schermata di correzione a tocchi semplici e
// costruzione. Usata dalla chat (planimetria caricata) e dalla scheda immobile (planimetrie dell'immobile).
// Correzione pensata per agenti poco digitali: tocca una stanza = scegli il tipo; tocca un muro = metti una porta o
// una finestra; tocca una porta o una finestra = togli o cambia; superficie totale in mq. Una scheda per piano.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Check, Combine, DoorOpen, Info, Loader2, Minus, Pencil, Rainbow, RotateCcw, ScanText, Scissors, Sofa, Square, Trash2, X } from 'lucide-react';
import { CREDIT_COST } from '@/lib/pricing';
import { addFurniture, addOpening, drawOutdoor, inPoly, mergeRooms, normalizeExterior, removeFurniture, rotateFurniture, removeOpening, rescaleTo, setFacade, setRoomLook, setRoomType, splitRoom, totalArea } from '@/lib/casa3d/build';
import { CASA3D_STYLES, FACADE_COLORS, FLOOR_KINDS, FLOOR_LABEL, ROOM_LABEL_EN, ROOM_LABEL_IT, ROOM_TYPES, STYLE_LABEL, VIEWER_PATH, WALL_COLORS, glossaryOf, isStyle, type Casa3d, type Casa3dStyle, type OpType, type Pt, type RawPlan } from '@/lib/casa3d/types';
import { authFetch } from './api';
import { pageLang, tr } from './i18n';

export type PlanSource = { src: string; name?: string };
type Floor = { name: string; raw: RawPlan; image: string; history: RawPlan[] };
type Sel = { kind: 'room'; id: number } | { kind: 'wall'; idx: number; at: Pt } | { kind: 'op'; idx: number } | { kind: 'furn'; idx: number } | null;

const BRAND = '#537eec';
const FURN_LABEL: Record<string, string> = { bed_double: tr('Letto matrimoniale', 'Double bed'), bed_single: tr('Letto singolo', 'Single bed'), sofa: tr('Divano', 'Sofa'), armchair: tr('Poltrona', 'Armchair'), dining_table: tr('Tavolo', 'Table'), desk: tr('Scrivania', 'Desk'), wardrobe: tr('Armadio', 'Wardrobe'), kitchen: tr('Cucina', 'Kitchen'), wc: 'WC', sink: tr('Lavabo', 'Sink'), shower: tr('Doccia', 'Shower'), bathtub: tr('Vasca', 'Bathtub'), tv_unit: tr('Mobile TV', 'TV unit') };
const ROOM_FILL: Record<string, string> = {
  soggiorno: '#dfe8fd', cucina: '#fde9d6', camera: '#e7e1fb', cameretta: '#efe6fb', bagno: '#d9f1f2', ingresso: '#eef0f3', corridoio: '#eef0f3',
  studio: '#e3f1df', ripostiglio: '#f1ece4', balcone: '#e6f3e1', terrazzo: '#e6f3e1', scala: '#ececec', lavanderia: '#d9f1f2', esterno: '#ffffff', stanza: '#f4f4f2',
  giardino: '#dcefcf', cortile: '#ebe5da',
};
// colori dei tondi degli stili (legno, tessuto, accento): come nel visore (public/casa3d/v1/viewer/styles.js)
const STYLE_SWATCH: Record<Casa3dStyle, string[]> = {
  moderno: ['#b08a63', '#d8d2c8', '#9a8f7f'], nordico: ['#dcb98e', '#e6e3dd', '#9fb0b5'], classico: ['#4c3020', '#b88f6a', '#7a2e2a'],
  industriale: ['#3f2b1e', '#7a4626', '#55595c'], lusso: ['#33201a', '#2f5048', '#c6a15b'], boho: ['#be7a3d', '#d9c6a5', '#b5532e'], vuota: ['#f1ece4', '#e7e2da'],
};
const OP_COLOR: Record<OpType, string> = { door: '#f08a24', entrance: '#e5484d', varco: '#a35bd6', window: BRAND };
const OP_LABEL = (t: OpType) => ({ door: tr('Porta', 'Door'), entrance: tr('Ingresso', 'Entrance'), varco: tr('Passaggio', 'Opening'), window: tr('Finestra', 'Window') })[t];
const roomName = (t: string) => (pageLang() === 'en' ? ROOM_LABEL_EN : ROOM_LABEL_IT)[t] ?? t;
const floorName = (i: number) => [tr('Piano terra', 'Ground floor'), tr('Primo piano', 'First floor'), tr('Secondo piano', 'Second floor'), tr('Terzo piano', 'Third floor')][i] ?? `${tr('Piano', 'Floor')} ${i + 1}`;
const newKey = () => `c3d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const viewerUrl = (manifest: string, extra = '') => `${VIEWER_PATH}?src=${encodeURIComponent(manifest)}${extra}`;

// fasi del riconoscimento di una pianta, con i tempi misurati (per l'attesa: niente rotellina muta)
const PHASES: [number, string, string, string, string][] = [
  [0, 'Ritaglio la pianta', 'Cropping the plan', 'Tengo solo la casa, via cornici e scritte del foglio', 'Keeping only the home, no sheet borders or captions'],
  [3, 'Ridisegno la pianta pulita', 'Redrawing a clean plan', 'Muri pieni, porte e finestre ben visibili', 'Solid walls, clear doors and windows'],
  [25, 'Riconosco muri, porte e finestre', 'Finding walls, doors and windows', 'Misuro le stanze e leggo le scritte', 'Measuring rooms and reading the labels'],
  [33, 'Controllo stanze e aperture', 'Checking rooms and openings', 'Ultimo controllo prima di mostrarti la pianta', 'Last check before showing you the plan'],
];
const EXPECTED = 50; // misurato il 05/10 su una catastale nuova: ritaglio 1,7 s, ridisegno 19 s, riconoscimento ~5 s, controllo 6 s

export default function Casa3DFlow({ plans, projectId, areaM2, existing, reuseKey, onClose, onDone }: {
  plans: PlanSource[]; projectId?: string; areaM2?: number; existing?: Casa3d | null; reuseKey?: string; onClose: () => void; onDone?: (c: Casa3d) => void;
}) {
  // stessa chiave = stessa casa: rifare o correggere non costa altri crediti
  const [key] = useState(() => existing?.key ?? reuseKey ?? newKey());
  const [step, setStep] = useState<'work' | 'edit' | 'build' | 'done' | 'error'>(existing ? 'edit' : 'work');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [cur, setCur] = useState(0);
  const [err, setErr] = useState<'no_credits' | 'failed' | 'no_rooms' | 'limit' | null>(null);
  const [work, setWork] = useState({ i: 0, t0: 0 });
  const [now, setNow] = useState(0);
  const [casa, setCasa] = useState<Casa3d | null>(existing ?? null);
  const [style, setStyle] = useState<Casa3dStyle>(existing?.style ?? 'moderno'); // stile d'arredo (si salva nella casa)
  const [shown, setShown] = useState(''); // manifest nel visore: resta quello, il cambio di stile dal visore non lo ricarica
  const started = useRef(false);
  const casaRef = useRef(casa);
  useEffect(() => { casaRef.current = casa }, [casa]);

  // riconoscimento, un piano dopo l'altro (o le piante gia' corrette, per modificare una casa fatta)
  const run = async (from = 0) => {
    setStep('work'); setErr(null)
    const out = floors.slice(0, from)
    for (let i = from; i < plans.length; i++) {
      setWork({ i, t0: Date.now() })
      const r = await authFetch('/api/platform/casa3d', {
        method: 'POST', headers: { 'x-no-modal': '1' },
        body: JSON.stringify({ action: 'recognize', key, floor: i, image: plans[i].src, projectId, ...(plans.length === 1 && areaM2 ? { areaM2 } : {}) }),
      }).catch(() => null)
      const d = await r?.json().catch(() => null) as { raw?: RawPlan; image?: string; error?: string } | null
      if (!r?.ok || !d?.raw) { setErr(d?.error === 'no_credits' ? 'no_credits' : d?.error === 'no_rooms' ? 'no_rooms' : d?.error === 'limit' ? 'limit' : 'failed'); setFloors(out); setStep('error'); return }
      window.dispatchEvent(new Event('agenteimmo:credits'))
      out.push({ name: plans[i].name || floorName(i), raw: d.raw, image: d.image ?? plans[i].src, history: [] })
      setFloors([...out])
    }
    setCur(0); setStep('edit')
  }
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (existing) {
      Promise.all(existing.floors.map(async (f, i) => ({ name: f.name || floorName(i), raw: normalizeExterior(await (await fetch(f.raw)).json() as RawPlan), image: f.image, history: [] })))
        .then(fs => { setFloors(fs); setStep('edit') }).catch(() => { setErr('failed'); setStep('error') })
    } else void run(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (step !== 'work') return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t) }, [step])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'build') onClose() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [step, onClose])

  const edit = (fn: (r: RawPlan) => RawPlan) => setFloors(fs => fs.map((f, i) => (i === cur ? { ...f, history: [...f.history.slice(-30), f.raw], raw: fn(f.raw) } : f)))
  const undo = () => setFloors(fs => fs.map((f, i) => (i === cur && f.history.length ? { ...f, raw: f.history[f.history.length - 1], history: f.history.slice(0, -1) } : f)))

  const build = async () => {
    setStep('build')
    const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'build', key, projectId, style, floors: floors.map(f => ({ name: f.name, raw: f.raw, image: f.image })) }) }).catch(() => null)
    const d = await r?.json().catch(() => null) as { casa3d?: Casa3d } | null
    if (!d?.casa3d) { setErr('failed'); setStep('error'); return }
    setCasa(d.casa3d); setShown(d.casa3d.manifest); setStep('done')
    onDone?.(d.casa3d)
  }
  // poster: il visore (nascosto) manda la vista dall'alto del primo piano
  useEffect(() => {
    if (step !== 'done' || !casa) return
    const on = async (e: MessageEvent) => {
      if (e.origin !== location.origin || typeof e.data?.casa3dPoster !== 'string') return
      window.removeEventListener('message', on)
      const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'poster', key: casa.key, projectId, image: e.data.casa3dPoster }) }).catch(() => null)
      const d = await r?.json().catch(() => null) as { poster?: string } | null
      const last = casaRef.current
      if (d?.poster && last) { const c = { ...last, poster: d.poster }; setCasa(c); onDone?.(c) }
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, shown])
  // stile cambiato nel visore: si salva nella casa (manifest nuovo), il visore aperto resta com'e'
  useEffect(() => {
    if (step !== 'done' || !casa || !projectId) return
    const on = async (e: MessageEvent) => {
      if (e.origin !== location.origin || !isStyle(e.data?.casa3dStyle)) return
      setStyle(e.data.casa3dStyle)
      const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'style', key: casa.key, projectId, style: e.data.casa3dStyle }) }).catch(() => null)
      const d = await r?.json().catch(() => null) as { casa3d?: Casa3d } | null
      if (d?.casa3d) { setCasa(c => (c ? { ...d.casa3d!, poster: c.poster ?? d.casa3d!.poster } : d.casa3d!)); onDone?.(d.casa3d) }
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, casa?.key, projectId])

  const f = floors[cur]
  const elapsed = work.t0 ? (now - work.t0) / 1000 : 0
  const phase = [...PHASES].reverse().find(p => elapsed >= p[0]) ?? PHASES[0]
  const pct = Math.min(96, (elapsed / EXPECTED) * 100)

  // nel body: dentro pannelli con transform o blur il fixed resterebbe chiuso nel pannello
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4" onClick={() => step !== 'build' && step !== 'work' && onClose()}>
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-y-auto overscroll-contain rounded-[32px] bg-white p-4 shadow-2xl sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight">{step === 'done' ? tr('La casa 3D è pronta', 'The 3D home is ready') : step === 'edit' ? tr('Controlla la pianta', 'Check the plan') : tr('Casa 3D', '3D home')}</h2>
            <p className="mt-1 text-sm text-muted">
              {step === 'edit' ? tr('Tocca una stanza per cambiarne il tipo, un muro per mettere una porta o una finestra, una porta o finestra per toglierla.', 'Tap a room to change its type, a wall to add a door or window, a door or window to remove it.')
                : step === 'done' ? tr('Girala dall’alto, entra nelle stanze, accendi la notte.', 'Orbit it, walk into the rooms, switch to night.')
                : step === 'work' ? (plans.length > 1 ? `${tr('Piano', 'Floor')} ${work.i + 1} ${tr('di', 'of')} ${plans.length}, ${tr('circa un minuto a piano', 'about a minute per floor')}` : tr('Circa un minuto, puoi restare qui', 'About a minute, you can stay here'))
                : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={step === 'build'} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>

        {step === 'work' && (
          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:items-stretch">
            {/* la planimetria su carta da progetto, con il fascio blu che la scorre: si vede che la sta leggendo */}
            <div className="relative overflow-hidden rounded-[24px] bg-[#f4f6fb] p-4" style={{ backgroundImage: 'linear-gradient(rgba(83,126,236,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(83,126,236,.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <div className="relative flex h-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={plans[work.i]?.src} alt="" className={`block max-h-[44vh] w-auto max-w-full rounded-[16px] mix-blend-multiply transition-[filter] duration-[600ms] ${elapsed >= PHASES[2][0] ? '[filter:sepia(1)_hue-rotate(185deg)_saturate(3)_brightness(.95)]' : 'grayscale'}`} />
                <div className="pointer-events-none absolute inset-x-0 -bottom-6 -top-6" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
                  <div className="absolute inset-x-0 bottom-6 top-6 will-change-transform" style={{ animation: 'gnm-scan 2.2s ease-in-out infinite alternate' }}>
                    <div className="absolute inset-x-0 top-0 h-20 -translate-y-1/2 bg-gradient-to-b from-transparent via-brand/15 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-0.5 -translate-y-1/2 bg-brand shadow-[0_0_14px_3px] shadow-brand/50" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-4 bottom-4 h-1.5 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-brand transition-[width] duration-[600ms]" style={{ width: `${pct}%` }} /></div>
            </div>
            {/* i passi come una linea del tempo: fatto, in corso (anello che pulsa), da fare */}
            <div className="flex flex-col justify-center rounded-[24px] bg-canvas p-5">
              <ol className="relative">
                {PHASES.map((p, k) => {
                  const done = elapsed >= p[0] && p !== phase, now = p === phase, en = pageLang() === 'en';
                  return (
                    <li key={p[1]} className="relative flex gap-3 pb-5 last:pb-0">
                      {k < PHASES.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full transition-colors duration-[600ms] ${done ? 'bg-brand' : 'bg-black/10'}`} aria-hidden />}
                      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-[600ms] ${done ? 'bg-brand text-white' : now ? 'bg-white text-brand ring-2 ring-brand' : 'bg-white text-muted ring-1 ring-black/10'}`}>
                        {done ? <Check size={15} /> : now ? <Loader2 size={15} className="animate-spin" /> : k + 1}
                        {now && <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-brand/40" aria-hidden />}
                      </span>
                      <span className="min-w-0 pt-1">
                        <span className={`block text-[15px] font-semibold leading-tight ${done || now ? 'text-ink' : 'text-muted'}`}>{en ? p[2] : p[1]}</span>
                        {now && <span className="blur-in mt-1 block text-[13px] leading-snug text-muted">{en ? p[4] : p[3]}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 border-t border-black/5 pt-4 text-[13px] text-muted">
                <span className="font-semibold tabular-nums text-ink">{Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')}</span> · {tr('poi controlli la pianta e crei la casa', 'then you check the plan and create the home')}
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="mt-6 rounded-[24px] bg-canvas p-6 text-center">
            <p className="text-[15px]">{err === 'no_credits' ? tr(`Servono ${CREDIT_COST.casa3d} crediti per la casa 3D.`, `The 3D home needs ${CREDIT_COST.casa3d} credits.`) : err === 'limit' ? tr('Questa casa è già stata rifatta più volte: correggi la pianta a mano oppure crea una casa nuova.', 'This home has been redone several times already: fix the plan by hand or create a new home.') : err === 'no_rooms' ? tr('Non trovo stanze chiuse in questa immagine: serve una planimetria con i muri ben visibili.', 'I cannot find closed rooms in this image: a floor plan with clear walls is needed.') : tr('Non sono riuscito a leggere la planimetria, riprova.', 'I could not read the floor plan, please try again.')}</p>
            <div className="mt-4 flex justify-center gap-2">
              {err === 'no_credits'
                ? <button type="button" onClick={() => window.dispatchEvent(new Event('agenteimmo:no-credits'))} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-brand">{tr('Vedi i piani', 'See plans')}</button>
                : err !== 'no_rooms' && err !== 'limit' && <button type="button" onClick={() => (existing && !floors.length ? onClose() : void run(floors.length))} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-brand">{tr('Riprova', 'Try again')}</button>}
            </div>
          </div>
        )}

        {(step === 'edit' || step === 'build') && f && (
          <>
            {floors.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {floors.map((x, i) => (
                  <button key={i} type="button" onClick={() => setCur(i)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-[600ms] ${i === cur ? 'bg-brand text-white' : 'bg-canvas text-ink/80 hover:bg-black/[0.06]'}`}>{x.name}</button>
                ))}
              </div>
            )}
            <PlanEditor key={cur} floor={f} onEdit={edit} onUndo={undo} onRename={name => setFloors(fs => fs.map((x, i) => (i === cur ? { ...x, name } : x)))} multi={floors.length > 1} style={style} onStyle={setStyle} />
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <span className="mr-auto text-xs text-muted">{existing ? tr('Correggere e ricostruire è gratis.', 'Fixing and rebuilding is free.') : tr('Le correzioni non costano crediti.', 'Corrections cost no credits.')}</span>
              <button type="button" onClick={() => void build()} disabled={step === 'build'} className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-60">
                {step === 'build' ? <Loader2 size={16} className="animate-spin" /> : <Box size={16} />} {tr('Crea la casa 3D', 'Create the 3D home')}
              </button>
            </div>
          </>
        )}

        {step === 'done' && casa && (
          <>
            <div className="mt-4 overflow-hidden rounded-[24px] bg-canvas">
              <iframe title={tr('Casa 3D', '3D home')} src={viewerUrl(shown || casa.manifest)} className="block h-[62vh] w-full border-0" allow="fullscreen" />
            </div>
            {/* vista dall'alto per il poster dell'immobile */}
            <iframe title="" aria-hidden src={viewerUrl(shown || casa.manifest, '&poster=1')} className="pointer-events-none fixed -left-[2000px] top-0 h-[720px] w-[1280px] border-0 opacity-0" tabIndex={-1} />
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={() => setStep('edit')} className="flex h-11 items-center gap-2 rounded-full bg-canvas px-5 text-sm font-semibold text-ink hover:bg-black/[0.06]"><Pencil size={15} /> {tr('Correggi la pianta', 'Fix the plan')}</button>
              <a href={viewerUrl(casa.manifest)} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-full bg-canvas px-5 text-sm font-semibold text-ink hover:bg-black/[0.06]">{tr('Apri a schermo intero', 'Open full screen')}</a>
              <button type="button" onClick={onClose} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-brand"><Check size={16} /> {tr('Fatto', 'Done')}</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ---- schermata di correzione di un piano ----
function PlanEditor({ floor, onEdit, onUndo, onRename, multi, style, onStyle }: { floor: Floor; onEdit: (fn: (r: RawPlan) => RawPlan) => void; onUndo: () => void; onRename: (n: string) => void; multi: boolean; style: Casa3dStyle; onStyle: (s: Casa3dStyle) => void }) {
  const raw = floor.raw
  const svg = useRef<SVGSVGElement>(null)
  const [sel, setSel] = useState<Sel>(null)
  // strumenti sulle stanze: dividi (due tocchi per la linea) e unisci (tocca la stanza vicina)
  const [tool, setTool] = useState<{ kind: 'split'; id: number; pts: Pt[] } | { kind: 'merge'; id: number } | { kind: 'draw'; replace?: number; pts: Pt[] } | null>(null)
  // opacita' dell'originale sotto la pianta (cursore): se il ridisegno non combacia si parte a meta' per confrontare
  const diverge = !!raw.source.fit?.diverge
  const [origOp, setOrigOp] = useState(diverge ? 50 : 15)
  const [area, setArea] = useState('')
  const total = totalArea(raw)
  // riquadro della pianta in metri, con margine
  const vb = useMemo(() => {
    const pts = [...raw.walls.flatMap(w => [w.a, w.b]), ...raw.rooms.flatMap(r => r.poly)]
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), m = 0.8
    const x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m
    return [x0, y0, Math.max(...xs) + m - x0, Math.max(...ys) + m - y0]
  }, [raw])
  // immagine di partenza portata in metri (inversa di toImage)
  const imgM = useMemo(() => {
    const [a, b, c, d, e, f] = raw.source.toImage, det = a * d - b * c
    return `matrix(${d / det} ${-b / det} ${-c / det} ${a / det} ${(c * f - d * e) / det} ${(b * e - a * f) / det})`
  }, [raw.source.toImage])
  const toM = (ev: React.PointerEvent | React.MouseEvent): Pt => {
    const s = svg.current!, p = s.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY
    const q = p.matrixTransform(s.getScreenCTM()!.inverse()); return [q.x, q.y]
  }
  const quadPts = (a: Pt, b: Pt, t: number) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, nx = -(b[1] - a[1]) / L * t / 2, ny = (b[0] - a[0]) / L * t / 2
    return `${a[0] + nx},${a[1] + ny} ${b[0] + nx},${b[1] + ny} ${b[0] - nx},${b[1] - ny} ${a[0] - nx},${a[1] - ny}`
  }
  const fs = Math.max(0.22, Math.min(0.42, vb[2] / 38))
  const pill = (on: boolean) => `rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors duration-[600ms] ${on ? 'bg-ink text-white' : 'bg-white text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-canvas'}`
  const selRoom = sel?.kind === 'room' ? raw.rooms.find(r => r.id === sel.id) : null
  // etichette senza sovrapposizioni: le stanze piu' grandi prima; una che tocca quelle gia' messe prova sopra o sotto,
  // se no si vede solo quando la stanza e' toccata
  const labelPos = useMemo(() => {
    const out = new Map<number, number | null>(), placed: [number, number, number, number][] = []
    for (const r of [...raw.rooms].filter(x => x.type !== 'esterno').sort((a, b) => b.area - a.area)) {
      const lines = r.label ? 3 : 2, w = Math.max(roomName(r.type).length, 7, r.label ? 17 : 0) * fs * 0.58, h = lines * fs * 1.2
      const box = (dy: number): [number, number, number, number] => [r.center[0] - w / 2, r.center[1] - fs + dy, r.center[0] + w / 2, r.center[1] - fs + dy + h]
      const hit = (b: number[]) => placed.some(q => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])
      const dy = [0, -h * 0.75, h * 0.75].find(d => !hit(box(d)))
      if (dy === undefined) { out.set(r.id, null); continue }
      placed.push(box(dy)); out.set(r.id, dy)
    }
    return out
  }, [raw.rooms, fs])
  const selOp = sel?.kind === 'op' ? raw.openings[sel.idx] : null

  return (
    <div className="mt-4 grid min-h-0 gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative min-h-0 overflow-hidden rounded-[24px] bg-canvas p-2">
        <svg ref={svg} viewBox={vb.join(' ')} className="block h-[44vh] w-full touch-manipulation select-none sm:h-[52vh]" style={{ overflow: 'hidden' }} onClick={() => setSel(null)}>
          {floor.image && <image href={floor.image} width={raw.source.imgW} height={raw.source.imgH} transform={imgM} opacity={origOp / 100} preserveAspectRatio="none" />}
          <g opacity={1 - (origOp / 100) * 0.7}>
            {raw.rooms.map(r => (
              <polygon key={r.id} points={r.poly.map(p => p.join(',')).join(' ')} fill={ROOM_FILL[r.type] ?? ROOM_FILL.stanza} stroke={sel?.kind === 'room' && sel.id === r.id ? BRAND : 'none'} strokeWidth={0.08}
                className="cursor-pointer" onClick={e => { e.stopPropagation(); setSel({ kind: 'room', id: r.id }) }} />
            ))}
            {raw.walls.map((w, i) => (
              <g key={i} className="cursor-pointer" onClick={e => { e.stopPropagation(); setSel({ kind: 'wall', idx: i, at: toM(e) }) }}>
                <polygon points={quadPts(w.a, w.b, w.t)} fill={sel?.kind === 'wall' && sel.idx === i ? BRAND : '#2b2b2b'} />
                {/* area di tocco piu' larga dei tramezzi sottili */}
                <polygon points={quadPts(w.a, w.b, Math.max(w.t, 0.34))} fill="transparent" />
              </g>
            ))}
            {raw.openings.map((o, i) => (
              <g key={i} className="cursor-pointer" onClick={e => { e.stopPropagation(); setSel({ kind: 'op', idx: i }) }}>
                <polygon points={quadPts(o.a, o.b, o.t + 0.06)} fill={OP_COLOR[o.type]} stroke={sel?.kind === 'op' && sel.idx === i ? '#1d1d1b' : o.suspect ? '#fff' : 'none'} strokeWidth={0.06} strokeDasharray={o.suspect && !(sel?.kind === 'op' && sel.idx === i) ? '0.12 0.08' : undefined} />
                <polygon points={quadPts(o.a, o.b, Math.max(o.t + 0.06, 0.4))} fill="transparent" />
              </g>
            ))}
            {/* scale lette dalla planimetria: rampa con i gradini e pianerottolo, come verranno nel 3D */}
            {raw.rooms.filter(r => r.stair?.flight).map(r => {
              const [x0, z0, x1, z1] = r.stair!.flight!, n = r.stair!.treads ?? 0, alongX = r.stair!.axis !== 'z', l = r.stair!.landing
              return (
                <g key={`s${r.id}`} pointerEvents="none" stroke="#6b6b66" strokeWidth={0.025} fill="none">
                  <rect x={x0} y={z0} width={x1 - x0} height={z1 - z0} fill="rgba(255,255,255,.55)" />
                  {Array.from({ length: Math.max(0, n - 1) }, (_, k) => { const t = (k + 1) / n; return alongX ? <line key={k} x1={x0 + (x1 - x0) * t} y1={z0} x2={x0 + (x1 - x0) * t} y2={z1} /> : <line key={k} x1={x0} y1={z0 + (z1 - z0) * t} x2={x1} y2={z0 + (z1 - z0) * t} /> })}
                  {l && <rect x={l[0]} y={l[1]} width={l[2] - l[0]} height={l[3] - l[1]} fill="rgba(255,255,255,.55)" strokeDasharray="0.08 0.06" />}
                </g>
              )
            })}
            {(raw.furniture ?? []).map((f, i) => (
              <rect key={`f${i}`} x={f.at[0] - f.len / 2} y={f.at[1] - f.depth / 2} width={f.len} height={f.depth} rx={0.05} fill={sel?.kind === 'furn' && sel.idx === i ? 'rgba(83,126,236,.25)' : 'rgba(0,0,0,.08)'} stroke={sel?.kind === 'furn' && sel.idx === i ? BRAND : '#8a8a85'} strokeWidth={0.03}
                transform={`rotate(${-f.rot * 180 / Math.PI} ${f.at[0]} ${f.at[1]})`} className="cursor-pointer" onClick={e => { e.stopPropagation(); setSel({ kind: 'furn', idx: i }) }} />
            ))}
            {raw.rooms.filter(r => r.type !== 'esterno' && (labelPos.get(r.id) != null || (sel?.kind === 'room' && sel.id === r.id))).map(r => (
              <text key={r.id} x={r.center[0]} y={r.center[1] + (labelPos.get(r.id) ?? 0)} textAnchor="middle" fontSize={fs} fontWeight={700} fill="#1d1d1b" pointerEvents="none" style={{ fontFamily: 'inherit', paintOrder: 'stroke', stroke: 'rgba(255,255,255,.85)', strokeWidth: fs * 0.18, strokeLinejoin: 'round' }}>
                <tspan x={r.center[0]} dy={0}>{r.type === 'scala' && r.stair?.outdoor ? tr('Scala esterna', 'Outdoor stairs') : roomName(r.type)}</tspan>
                <tspan x={r.center[0]} dy={fs * 1.2} fontWeight={500} fill="#6b6b66">{String(r.area).replace('.', ',')} m²</tspan>
                {r.label && <tspan x={r.center[0]} dy={fs * 1.15} fontSize={fs * 0.8} fontWeight={600} fill={BRAND}>{tr('letto dalla planimetria', 'read from the plan')}</tspan>}
              </text>
            ))}
          </g>
          {tool && (
            <>
              {tool.kind !== 'merge' && tool.pts.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={0.12} fill={BRAND} />)}
              {tool.kind === 'draw' && tool.pts.length > 1 && <polygon points={tool.pts.map(q => q.join(',')).join(' ')} fill="rgba(83,126,236,.18)" stroke={BRAND} strokeWidth={0.06} />}
              {tool.kind === 'split' && tool.pts.length === 2 && <line x1={tool.pts[0][0]} y1={tool.pts[0][1]} x2={tool.pts[1][0]} y2={tool.pts[1][1]} stroke={BRAND} strokeWidth={0.08} strokeDasharray="0.2 0.12" />}
              <rect x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} fill="transparent" className="cursor-crosshair" onClick={e => {
                e.stopPropagation()
                const q = toM(e)
                if (tool.kind === 'split') { if (tool.pts.length < 2) setTool({ ...tool, pts: [...tool.pts, q] }) }
                else if (tool.kind === 'draw') setTool({ ...tool, pts: [...tool.pts, q] })
                else { const other = raw.rooms.find(r => r.id !== tool.id && inPoly(q[0], q[1], r.poly)); if (other) { onEdit(r => mergeRooms(r, tool.id, other.id)); setTool(null); setSel(null) } }
              }} />
            </>
          )}
        </svg>
        <div className="absolute left-4 top-4 flex gap-2">
          <label className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/80 ring-1 ring-inset ring-black/10">
            {tr('Originale', 'Original')}
            <input type="range" min={0} max={100} value={origOp} onChange={e => setOrigOp(Number(e.target.value))} aria-label={tr('Opacità della planimetria originale', 'Original plan opacity')} className="w-24 accent-[#537eec]" />
          </label>
          {floor.history.length > 0 && <button type="button" onClick={() => { onUndo(); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><RotateCcw size={13} /> {tr('Annulla', 'Undo')}</button>}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:h-[calc(52vh+16px)]">
        {(raw.source.outdoor_short ?? []).map(o => (
          <div key={o.room} className="rounded-[24px] bg-brand/10 p-4 text-sm font-medium text-brand">
            {tr(`Terrazzo: trovati ${String(o.found).replace('.', ',')} m² sui ${String(o.written).replace('.', ',')} scritti. Disegnalo toccando gli angoli.`, `Terrace: found ${o.found} m² of the ${o.written} written. Draw it by tapping its corners.`)}
            <button type="button" onClick={() => { setSel(null); setTool({ kind: 'draw', replace: o.room, pts: [] }) }} className="mt-3 block rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white">{tr('Disegna terrazzo', 'Draw terrace')}</button>
          </div>
        ))}
        {diverge && <p className="rounded-[24px] bg-brand/10 p-4 text-sm font-medium text-brand">{tr('In alcuni punti il disegno si discosta dall’originale: muovi il cursore Originale per confrontare e correggi le stanze che non tornano.', 'In some spots the drawing differs from the original: move the Original slider to compare and fix rooms that do not match.')}</p>}{/* alta come la pianta: la finestra non cambia misura a ogni tocco */}
        {multi && (
          <label className="block text-sm">
            <span className="text-muted">{tr('Nome del piano', 'Floor name')}</span>
            <input value={floor.name} onChange={e => onRename(e.target.value.slice(0, 40))} className="mt-1 h-11 w-full rounded-2xl bg-canvas px-4 text-[15px] outline-none focus:ring-2 focus:ring-brand/40" />
          </label>
        )}
        {/* azione sull'elemento toccato */}
        <div className="rounded-[24px] bg-canvas p-4">
          {tool && (
            <div>
              <p className="text-sm font-semibold">{tool.kind === 'draw' ? tr(`Tocca gli angoli del terrazzo uno dopo l’altro (${tool.pts.length})`, `Tap the terrace corners one after another (${tool.pts.length})`) : tool.kind === 'split' ? (tool.pts.length < 2 ? tr(`Tocca due punti sui muri per tracciare la divisione (${tool.pts.length} di 2)`, `Tap two points on the walls to draw the split (${tool.pts.length} of 2)`) : tr('Cosa c’è sulla linea?', 'What is on the line?')) : tr('Tocca la stanza vicina da unire', 'Tap the neighbouring room to merge')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.kind === 'split' && tool.pts.length === 2 && ([['muro', tr('Muro', 'Wall')], ['porta', tr('Muro con porta', 'Wall with door')], ['passaggio', tr('Passaggio aperto', 'Open passage')]] as const).map(([m, l]) => (
                  <button key={m} type="button" onClick={() => { onEdit(r => splitRoom(r, tool.id, tool.pts[0], tool.pts[1], m)); setTool(null); setSel(null) }} className={pill(false)}>{l}</button>
                ))}
                {tool.kind === 'draw' && tool.pts.length >= 3 && <button type="button" onClick={() => { onEdit(r => drawOutdoor(r, tool.pts, tool.replace)); setTool(null); setSel(null) }} className={pill(true)}>{tr('Fine', 'Done')}</button>}
                <button type="button" onClick={() => setTool(null)} className={pill(false)}>{tr('Annulla', 'Cancel')}</button>
              </div>
            </div>
          )}
          {!tool && !sel && <p className="text-sm text-muted">{tr('Tocca un elemento della pianta.', 'Tap an element of the plan.')}</p>}
          {!tool && !sel && (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><Sofa size={14} /> {tr('Stile d’arredo', 'Furniture style')}</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {CASA3D_STYLES.map(id => (
                  <button key={id} type="button" onClick={() => onStyle(id)} aria-pressed={style === id}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] font-semibold transition-colors duration-[600ms] ${style === id ? 'bg-white text-ink ring-2 ring-brand' : 'bg-white/60 text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-white'}`}>
                    <span className="flex">{STYLE_SWATCH[id].map((c, k) => <i key={k} className="-mr-1 h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c }} />)}</span>
                    {tr(...STYLE_LABEL[id])}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold">{tr('Facciata', 'Facade')}{raw.materials?.from ? <span className="ml-1.5 text-xs font-medium text-brand">{tr('dalle foto', 'from photos')}</span> : null}</p>
              <Swatches colors={[...new Set([raw.materials?.facade?.color, ...FACADE_COLORS].filter((x): x is string => !!x))]} value={raw.materials?.facade?.color} onPick={c => onEdit(r => setFacade(r, c))} />
              <button type="button" onClick={() => setTool({ kind: 'draw', pts: [] })} className={`${pill(false)} mt-4`}>{tr('Disegna terrazzo o balcone', 'Draw terrace or balcony')}</button>
            </div>
          )}
          {selRoom && !tool && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setTool({ kind: 'split', id: selRoom.id, pts: [] })} className={`${pill(false)} flex items-center gap-1.5`}><Scissors size={14} /> {tr('Dividi', 'Split')}</button>
                <button type="button" onClick={() => setTool({ kind: 'merge', id: selRoom.id })} className={`${pill(false)} flex items-center gap-1.5`}><Combine size={14} /> {tr('Unisci', 'Merge')}</button>
              </div>
              <p className="mb-2 text-sm font-semibold">{tr('Aggiungi mobile', 'Add furniture')}</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {([['letto', tr('Letto', 'Bed')], ['divano', tr('Divano', 'Sofa')], ['tavolo', tr('Tavolo', 'Table')], ['armadio', tr('Armadio', 'Wardrobe')], ['cucina', tr('Cucina', 'Kitchen')], ['bagno', tr('Bagno', 'Bathroom')]] as const).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => onEdit(r => addFurniture(r, selRoom.id, k))} className={`${pill(false)} !px-3 !py-1.5 !text-xs`}>+ {l}</button>
                ))}
              </div>
              <p className="text-sm font-semibold">{tr('Che stanza è?', 'Which room is it?')} <span className="font-normal text-muted">{String(selRoom.area).replace('.', ',')} m²</span></p>
              {selRoom.label && <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand"><ScanText size={13} /> {tr('Letto dalla planimetria', 'Read from the plan')}: «{selRoom.label}»{selRoom.written_mq ? `, ${String(selRoom.written_mq).replace('.', ',')} m²` : ''}</p>}
              {glossaryOf(selRoom.label, pageLang() === 'en') && <p className="blur-in mt-2 flex items-start gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs text-ink/80 ring-1 ring-inset ring-black/5"><Info size={13} className="mt-px shrink-0 text-brand" /> {glossaryOf(selRoom.label, pageLang() === 'en')}</p>}
              {selRoom.type === 'scala' && selRoom.stair?.outdoor && <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs text-ink/80 ring-1 ring-inset ring-black/5"><Info size={13} className="mt-px shrink-0 text-brand" /> {tr('Scala esterna: nel 3D è una rampa all’aperto, senza muri attorno.', 'Outdoor stairs: in 3D an open-air flight, no walls around.')}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {ROOM_TYPES.map(t => <button key={t} type="button" onClick={() => onEdit(r => setRoomType(r, selRoom.id, t))} className={pill(selRoom.type === t)}>{roomName(t)}</button>)}
                <button type="button" onClick={() => onEdit(r => setRoomType(r, selRoom.id, 'esterno'))} className={pill(selRoom.type === 'esterno')}>{tr('Non è della casa', 'Not part of the home')}</button>
              </div>
              {(() => {
                const mt = raw.materials?.rooms?.[selRoom.type], floor = selRoom.floor ?? mt?.floor, wall = selRoom.wall ?? mt?.wall
                return (
                  <>
                    <p className="mt-4 text-sm font-semibold">{tr('Pavimento', 'Floor')}{mt && !selRoom.floor ? <span className="ml-1.5 text-xs font-medium text-brand">{tr('dalle foto', 'from photos')}</span> : null}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{FLOOR_KINDS.map(f => <button key={f} type="button" onClick={() => onEdit(r => setRoomLook(r, selRoom.id, { floor: f }))} className={`${pill(floor === f)} !px-3 !py-1.5 !text-xs`}>{tr(...FLOOR_LABEL[f])}</button>)}</div>
                    <p className="mt-4 text-sm font-semibold">{tr('Colore dei muri', 'Wall colour')}{mt && !selRoom.wall ? <span className="ml-1.5 text-xs font-medium text-brand">{tr('dalle foto', 'from photos')}</span> : null}</p>
                    <Swatches colors={[...new Set([mt?.wall, ...WALL_COLORS].filter((x): x is string => !!x))]} value={wall} onPick={c => onEdit(r => setRoomLook(r, selRoom.id, { wall: c }))} />
                  </>
                )
              })()}
            </>
          )}
          {sel?.kind === 'wall' && (
            <>
              <p className="text-sm font-semibold">{tr('Muro', 'Wall')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => { onEdit(r => addOpening(r, sel.idx, sel.at, 'door')); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><DoorOpen size={14} /> {tr('Metti una porta', 'Add a door')}</button>
                <button type="button" onClick={() => { onEdit(r => addOpening(r, sel.idx, sel.at, 'window')); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><Square size={14} /> {tr('Metti una finestra', 'Add a window')}</button>
              </div>
            </>
          )}
          {sel?.kind === 'furn' && raw.furniture?.[sel.idx] && (
            <>
              <p className="text-sm font-semibold">{FURN_LABEL[raw.furniture[sel.idx].kind] ?? tr('Mobile', 'Furniture')} <span className="font-normal text-muted">{raw.furniture[sel.idx].added ? tr('aggiunto da te', 'added by you') : tr('letto dalla planimetria', 'read from the plan')}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => { onEdit(r => removeFurniture(r, sel.idx)); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><Trash2 size={14} /> {tr('Togli', 'Remove')}</button>
                <button type="button" onClick={() => onEdit(r => rotateFurniture(r, sel.idx))} className={`${pill(false)} flex items-center gap-1.5`}><RotateCcw size={14} /> {tr('Ruota', 'Rotate')}</button>
              </div>
            </>
          )}
          {selOp && sel?.kind === 'op' && (
            <>
              <p className="text-sm font-semibold">{selOp.shape === 'arch' ? tr('Arco', 'Arch') : OP_LABEL(selOp.type)} <span className="font-normal text-muted">{String(selOp.width).replace('.', ',')} m</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selOp.type === 'varco' || selOp.type === 'door') && (
                  // arco si'/no: un arco e' un passaggio senza porta, col muro sopra a semicerchio
                  <button type="button" aria-pressed={selOp.shape === 'arch'} onClick={() => onEdit(r => ({ ...r, openings: r.openings.map((o, i) => { if (i !== sel.idx) return o; if (o.shape === 'arch') { const { shape: _s, ...rest } = o; void _s; return rest } return { ...o, type: 'varco' as OpType, shape: 'arch' as const, suspect: false } }) }))} className={`${pill(selOp.shape === 'arch')} flex items-center gap-1.5`}><Rainbow size={14} /> {selOp.shape === 'arch' ? tr('Arco: sì', 'Arch: yes') : tr('Arco: no', 'Arch: no')}</button>
                )}
                <button type="button" onClick={() => { onEdit(r => removeOpening(r, sel.idx)); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><Trash2 size={14} /> {tr('Togli', 'Remove')}</button>
                {(['door', 'window', 'entrance', 'varco'] as OpType[]).filter(t => t !== selOp.type).map(t => (
                  <button key={t} type="button" onClick={() => onEdit(r => ({ ...r, openings: r.openings.map((o, i) => (i === sel.idx ? { ...o, type: t, suspect: false } : o)) }))} className={pill(false)}>{OP_LABEL(t)}</button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className={`rounded-[24px] p-4 transition-colors duration-[600ms] ${raw.source.scale_warn ? 'bg-brand/10 ring-2 ring-brand' : 'bg-canvas'}`}>
          {raw.source.scale_warn && <p className="mb-2 text-sm font-semibold text-brand">{tr('Le misure sembrano piccole, scrivi i mq della casa', 'Sizes look small, type the home m²')}</p>}
          <p className="text-sm font-semibold">{tr('Superficie della casa', 'Home surface')}</p>
          <p className="mt-1 text-xs text-muted">{tr('Somma delle stanze. Se non torna, scrivi i mq giusti e le misure si adattano.', 'Sum of the rooms. If it is wrong, type the right m² and sizes adapt.')}</p>
          <div className="mt-3 flex gap-2">
            <input inputMode="decimal" placeholder={String(total).replace('.', ',')} value={area} onChange={e => setArea(e.target.value.replace(/[^\d.,]/g, ''))} className="h-11 min-w-0 flex-1 rounded-2xl bg-white px-4 text-[15px] outline-none ring-1 ring-inset ring-black/10 focus:ring-2 focus:ring-brand/40" />
            <button type="button" disabled={!(Number(area.replace(',', '.')) > 5)} onClick={() => { const v = Number(area.replace(',', '.')); onEdit(r => rescaleTo(r, v)); setArea('') }} className="h-11 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-brand disabled:opacity-40">{tr('Cambia', 'Apply')}</button>
          </div>
          {raw.source.scale_from === 'mq' && <p className="mt-2 text-xs text-muted">{tr('Misure prese dai mq dell’annuncio.', 'Sizes taken from the listing m².')}</p>}
        </div>
        <div className="flex flex-wrap gap-3 px-1 text-xs text-muted">
          {(['door', 'entrance', 'window', 'varco'] as OpType[]).map(t => <span key={t} className="flex items-center gap-1.5"><Minus size={14} strokeWidth={5} style={{ color: OP_COLOR[t] }} /> {OP_LABEL(t)}</span>)}
          <span className="flex items-center gap-1.5"><Minus size={14} strokeWidth={5} className="text-black/30" style={{ strokeDasharray: '3 3' }} /> {tr('Da controllare', 'To check')}</span>
        </div>
      </div>
    </div>
  )
}

// tondi di colore toccabili (muri, facciata)
function Swatches({ colors, value, onPick }: { colors: string[]; value?: string; onPick: (c: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {colors.slice(0, 10).map(c => (
        <button key={c} type="button" onClick={() => onPick(c)} aria-label={c} style={{ background: c }}
          className={`h-8 w-8 rounded-full ring-1 ring-inset ring-black/15 transition-shadow duration-[600ms] ${value?.toLowerCase() === c.toLowerCase() ? 'outline outline-2 outline-offset-2 outline-brand' : ''}`} />
      ))}
    </div>
  )
}
