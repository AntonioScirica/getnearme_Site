'use client';

// Casa 3D dalla planimetria: riconoscimento (un piano alla volta), schermata di correzione a tocchi semplici e
// costruzione. Usata dalla chat (planimetria caricata) e dalla scheda immobile (planimetrie dell'immobile).
// Correzione pensata per agenti poco digitali: tocca una stanza = scegli il tipo; tocca un muro = metti una porta o
// una finestra; tocca una porta o una finestra = togli o cambia; superficie totale in mq. Una scheda per piano.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Check, DoorOpen, Loader2, Minus, Pencil, RotateCcw, Square, Trash2, X } from 'lucide-react';
import { CREDIT_COST } from '@/lib/pricing';
import { addOpening, removeOpening, rescaleTo, setRoomType, totalArea } from '@/lib/casa3d/build';
import { ROOM_LABEL_EN, ROOM_LABEL_IT, ROOM_TYPES, VIEWER_PATH, type Casa3d, type OpType, type Pt, type RawPlan } from '@/lib/casa3d/types';
import { authFetch } from './api';
import { pageLang, tr } from './i18n';

export type PlanSource = { src: string; name?: string };
type Floor = { name: string; raw: RawPlan; image: string; history: RawPlan[] };
type Sel = { kind: 'room'; id: number } | { kind: 'wall'; idx: number; at: Pt } | { kind: 'op'; idx: number } | null;

const BRAND = '#537eec';
const ROOM_FILL: Record<string, string> = {
  soggiorno: '#dfe8fd', cucina: '#fde9d6', camera: '#e7e1fb', cameretta: '#efe6fb', bagno: '#d9f1f2', ingresso: '#eef0f3', corridoio: '#eef0f3',
  studio: '#e3f1df', ripostiglio: '#f1ece4', balcone: '#e6f3e1', terrazzo: '#e6f3e1', scala: '#ececec', lavanderia: '#d9f1f2', esterno: '#ffffff', stanza: '#f4f4f2',
};
const OP_COLOR: Record<OpType, string> = { door: '#f08a24', entrance: '#e5484d', varco: '#a35bd6', window: BRAND };
const OP_LABEL = (t: OpType) => ({ door: tr('Porta', 'Door'), entrance: tr('Ingresso', 'Entrance'), varco: tr('Passaggio', 'Opening'), window: tr('Finestra', 'Window') })[t];
const roomName = (t: string) => (pageLang() === 'en' ? ROOM_LABEL_EN : ROOM_LABEL_IT)[t] ?? t;
const floorName = (i: number) => [tr('Piano terra', 'Ground floor'), tr('Primo piano', 'First floor'), tr('Secondo piano', 'Second floor'), tr('Terzo piano', 'Third floor')][i] ?? `${tr('Piano', 'Floor')} ${i + 1}`;
const newKey = () => `c3d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const viewerUrl = (manifest: string, extra = '') => `${VIEWER_PATH}?src=${encodeURIComponent(manifest)}${extra}`;

// fasi del riconoscimento di una pianta, con i tempi misurati (per l'attesa: niente rotellina muta)
const PHASES: [number, string, string][] = [
  [0, 'Ritaglio la pianta', 'Cropping the plan'],
  [3, 'Ridisegno la pianta pulita', 'Redrawing a clean plan'],
  [25, 'Riconosco muri, porte e finestre', 'Finding walls, doors and windows'],
  [33, 'Controllo stanze e aperture', 'Checking rooms and openings'],
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
  const started = useRef(false);

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
      Promise.all(existing.floors.map(async (f, i) => ({ name: f.name || floorName(i), raw: await (await fetch(f.raw)).json() as RawPlan, image: f.image, history: [] })))
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
    const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'build', key, projectId, floors: floors.map(f => ({ name: f.name, raw: f.raw, image: f.image })) }) }).catch(() => null)
    const d = await r?.json().catch(() => null) as { casa3d?: Casa3d } | null
    if (!d?.casa3d) { setErr('failed'); setStep('error'); return }
    setCasa(d.casa3d); setStep('done')
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
      if (d?.poster) { const c = { ...casa, poster: d.poster }; setCasa(c); onDone?.(c) }
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, casa?.manifest])

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
          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr] sm:items-center">
            <div className="flex justify-center rounded-[24px] bg-canvas p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={plans[work.i]?.src} alt="" className="block max-h-[46vh] w-auto max-w-full rounded-[16px] opacity-80" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-[15px] font-semibold"><Loader2 size={16} className="animate-spin text-brand" /> {pageLang() === 'en' ? phase[2] : phase[1]}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand transition-[width] duration-[600ms]" style={{ width: `${pct}%` }} /></div>
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {PHASES.map(p => <li key={p[1]} className={elapsed >= p[0] ? 'text-ink' : ''}>{elapsed > p[0] && p !== phase ? <Check size={14} className="mr-1.5 inline text-brand" /> : <span className="mr-1.5 inline-block w-[14px]" />}{pageLang() === 'en' ? p[2] : p[1]}</li>)}
              </ul>
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
            <PlanEditor key={cur} floor={f} onEdit={edit} onUndo={undo} onRename={name => setFloors(fs => fs.map((x, i) => (i === cur ? { ...x, name } : x)))} multi={floors.length > 1} />
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
              <iframe title={tr('Casa 3D', '3D home')} src={viewerUrl(casa.manifest)} className="block h-[62vh] w-full border-0" allow="fullscreen" />
            </div>
            {/* vista dall'alto per il poster dell'immobile */}
            <iframe title="" aria-hidden src={viewerUrl(casa.manifest, '&poster=1')} className="pointer-events-none fixed -left-[2000px] top-0 h-[720px] w-[1280px] border-0 opacity-0" tabIndex={-1} />
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
function PlanEditor({ floor, onEdit, onUndo, onRename, multi }: { floor: Floor; onEdit: (fn: (r: RawPlan) => RawPlan) => void; onUndo: () => void; onRename: (n: string) => void; multi: boolean }) {
  const raw = floor.raw
  const svg = useRef<SVGSVGElement>(null)
  const [sel, setSel] = useState<Sel>(null)
  const [orig, setOrig] = useState(false)
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
  const selOp = sel?.kind === 'op' ? raw.openings[sel.idx] : null

  return (
    <div className="mt-4 grid min-h-0 gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative min-h-0 overflow-hidden rounded-[24px] bg-canvas p-2">
        <svg ref={svg} viewBox={vb.join(' ')} className="block h-[44vh] w-full touch-manipulation select-none sm:h-[52vh]" style={{ overflow: 'hidden' }} onClick={() => setSel(null)}>
          {floor.image && <image href={floor.image} width={raw.source.imgW} height={raw.source.imgH} transform={imgM} opacity={orig ? 1 : 0.18} preserveAspectRatio="none" />}
          <g opacity={orig ? 0.25 : 1}>
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
            {raw.rooms.filter(r => r.type !== 'esterno').map(r => (
              <text key={r.id} x={r.center[0]} y={r.center[1]} textAnchor="middle" fontSize={fs} fontWeight={700} fill="#1d1d1b" pointerEvents="none" style={{ fontFamily: 'inherit' }}>
                <tspan x={r.center[0]} dy={0}>{roomName(r.type)}</tspan>
                <tspan x={r.center[0]} dy={fs * 1.2} fontWeight={500} fill="#6b6b66">{String(r.area).replace('.', ',')} m²</tspan>
              </text>
            ))}
          </g>
        </svg>
        <div className="absolute left-4 top-4 flex gap-2">
          <button type="button" onClick={() => setOrig(o => !o)} className={pill(orig)}>{orig ? tr('Pianta riconosciuta', 'Recognized plan') : tr('Originale', 'Original')}</button>
          {floor.history.length > 0 && <button type="button" onClick={() => { onUndo(); setSel(null) }} className={`${pill(false)} flex items-center gap-1.5`}><RotateCcw size={13} /> {tr('Annulla', 'Undo')}</button>}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:h-[calc(52vh+16px)]">{/* alta come la pianta: la finestra non cambia misura a ogni tocco */}
        {multi && (
          <label className="block text-sm">
            <span className="text-muted">{tr('Nome del piano', 'Floor name')}</span>
            <input value={floor.name} onChange={e => onRename(e.target.value.slice(0, 40))} className="mt-1 h-11 w-full rounded-2xl bg-canvas px-4 text-[15px] outline-none focus:ring-2 focus:ring-brand/40" />
          </label>
        )}
        {/* azione sull'elemento toccato */}
        <div className="rounded-[24px] bg-canvas p-4">
          {!sel && <p className="text-sm text-muted">{tr('Tocca un elemento della pianta.', 'Tap an element of the plan.')}</p>}
          {selRoom && (
            <>
              <p className="text-sm font-semibold">{tr('Che stanza è?', 'Which room is it?')} <span className="font-normal text-muted">{String(selRoom.area).replace('.', ',')} m²</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ROOM_TYPES.map(t => <button key={t} type="button" onClick={() => onEdit(r => setRoomType(r, selRoom.id, t))} className={pill(selRoom.type === t)}>{roomName(t)}</button>)}
                <button type="button" onClick={() => onEdit(r => setRoomType(r, selRoom.id, 'esterno'))} className={pill(selRoom.type === 'esterno')}>{tr('Non è della casa', 'Not part of the home')}</button>
              </div>
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
          {selOp && sel?.kind === 'op' && (
            <>
              <p className="text-sm font-semibold">{OP_LABEL(selOp.type)} <span className="font-normal text-muted">{String(selOp.width).replace('.', ',')} m</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
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
