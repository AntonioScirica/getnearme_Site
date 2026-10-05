// Dalla pianta riconosciuta (modificabile) alla pianta del visore. Porting di apply_fix.py, senza dipendenze:
// gira sul server e nel browser (schermata di correzione). Le correzioni (Claude o agente) si applicano alla
// pianta riconosciuta; il visore riceve muri come poligoni, porte e finestre come rettangoli con asse, stanze
// con tipo e rettangolo utile per i mobili.
import { OUTDOOR, type Fix, type OpType, type Pt, type RawOpening, type RawPlan, type ViewerPlan } from './types'

const OUT_TYPES = new Set(['esterno'])
const r3 = (v: number) => Math.round(v * 1000) / 1000

export const inPoly = (x: number, z: number, pts: Pt[]) => {
  let ins = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins
  }
  return ins
}
export const clone = (p: RawPlan): RawPlan => JSON.parse(JSON.stringify(p))

const frame = (a: Pt, b: Pt) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), d: Pt = [(b[0] - a[0]) / (L || 1e-6), (b[1] - a[1]) / (L || 1e-6)]
  return { L, d, n: [-d[1], d[0]] as Pt }
}
export const quad = (a: Pt, b: Pt, t: number): Pt[] => {
  const { d } = frame(a, b), n: Pt = [-d[1] * t / 2, d[0] * t / 2]
  return [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]]
}

function roomFinder(plan: RawPlan) {
  const keep = new Set(plan.rooms.filter(r => !OUT_TYPES.has(r.type)).map(r => r.id))
  return (x: number, z: number) => { for (const r of plan.rooms) if (inPoly(x, z, r.poly)) return keep.has(r.id) ? r.id : -1; return -1 }
}

// tratto piu' lungo del muro con ai due lati le stanze want (-1 = fuori)
function sharedRun(plan: RawPlan, w: { a: Pt; b: Pt; t: number }, want: Set<number>): [number, number] | null {
  const roomAt = roomFinder(plan), { L, d, n } = frame(w.a, w.b)
  let best: [number, number] | null = null, cur: [number, number] | null = null
  for (let s = 0.05; s < L; s += 0.05) {
    const p: Pt = [w.a[0] + d[0] * s, w.a[1] + d[1] * s], off = w.t / 2 + 0.25
    const sides = new Set([roomAt(p[0] + n[0] * off, p[1] + n[1] * off), roomAt(p[0] - n[0] * off, p[1] - n[1] * off)])
    if (sides.size === want.size && [...sides].every(x => want.has(x))) {
      cur = cur ? [cur[0], s] : [s, s]
      if (!best || cur[1] - cur[0] > best[1] - best[0]) best = [...cur] as [number, number]
    } else cur = null
  }
  return best
}

// correzioni puntuali (formato del controllo Claude) sulla pianta riconosciuta
export function applyFix(raw: RawPlan, fix: Fix): RawPlan {
  const plan = clone(raw)
  for (const r of plan.rooms) { const t = fix.room_types?.[String(r.id)]; if (t) r.type = t }
  const rm = new Set(fix.remove_openings ?? [])
  for (const o of plan.openings) if (o.label && rm.has(o.label)) plan.walls.push({ a: o.a, b: o.b, t: o.t, label: `chiusa-${o.label}` })
  plan.openings = plan.openings.filter(o => !(o.label && rm.has(o.label)))
  for (const ch of fix.change_openings ?? []) for (const o of plan.openings) if (o.label === ch.label && ['door', 'entrance', 'window', 'varco'].includes(ch.type)) o.type = ch.type
  const keep = new Set(plan.rooms.filter(r => !OUT_TYPES.has(r.type)).map(r => r.id))
  let k = 0
  for (const ad of fix.add_doors ?? []) {
    const want = new Set(ad.between.map(i => Number(i)).map(i => (i === -1 || !keep.has(i) ? -1 : i)))
    if (want.size !== 2) continue
    const cands = plan.walls.map(w => ({ run: sharedRun(plan, w, want), w })).filter(c => c.run && c.run[1] - c.run[0] > 0.6)
    if (!cands.length) continue
    const { run, w } = cands.reduce((a, c) => (c.run![1] - c.run![0] > a.run![1] - a.run![0] ? c : a))
    const { d } = frame(w.a, w.b), mid = (run![0] + run![1]) / 2, wd = Math.min(ad.entrance ? 0.9 : 0.8, run![1] - run![0] - 0.1)
    plan.openings.push({ type: ad.entrance || want.has(-1) ? 'entrance' : 'door', a: [r3(w.a[0] + d[0] * (mid - wd / 2)), r3(w.a[1] + d[1] * (mid - wd / 2))], b: [r3(w.a[0] + d[0] * (mid + wd / 2)), r3(w.a[1] + d[1] * (mid + wd / 2))], t: w.t, width: r3(wd), rooms: [...want], suspect: false, label: `A${++k}`, added: true })
  }
  for (const aw of fix.add_windows ?? []) {
    const w = plan.walls.find(x => x.label === aw.wall)
    if (!w) continue
    const run = sharedRun(plan, w, new Set([Number(aw.room), -1]))
    if (!run || run[1] - run[0] < 0.7) continue
    const { d } = frame(w.a, w.b), mid = (run[0] + run[1]) / 2, wd = Math.min(1.2, run[1] - run[0] - 0.3)
    plan.openings.push({ type: 'window', a: [r3(w.a[0] + d[0] * (mid - wd / 2)), r3(w.a[1] + d[1] * (mid - wd / 2))], b: [r3(w.a[0] + d[0] * (mid + wd / 2)), r3(w.a[1] + d[1] * (mid + wd / 2))], t: w.t, width: r3(wd), rooms: [Number(aw.room), -1], suspect: false, label: `A${++k}`, added: true })
  }
  return plan
}

// --- modifiche dell'agente (schermata di correzione) ---
export function setRoomType(raw: RawPlan, id: number, type: string): RawPlan { const p = clone(raw); const r = p.rooms.find(x => x.id === id); if (r) { r.type = type; delete r.label } return p } // scelta dell'agente: non e' piu' quella letta
export function removeOpening(raw: RawPlan, idx: number): RawPlan {
  const p = clone(raw), o = p.openings[idx]
  if (!o) return p
  p.walls.push({ a: o.a, b: o.b, t: o.t, label: `chiusa-${o.label ?? idx}` })
  p.openings.splice(idx, 1)
  return p
}
// apertura nuova sul muro wi, centrata nel punto toccato (proiettato sul muro), dentro il muro
export function addOpening(raw: RawPlan, wi: number, at: Pt, type: OpType): RawPlan {
  const p = clone(raw), w = p.walls[wi]
  if (!w) return p
  const { L, d } = frame(w.a, w.b)
  const width = Math.min(type === 'window' ? 1.2 : type === 'entrance' ? 0.9 : 0.8, Math.max(0.4, L - 0.1))
  let s = (at[0] - w.a[0]) * d[0] + (at[1] - w.a[1]) * d[1]
  s = Math.max(width / 2 + 0.05, Math.min(L - width / 2 - 0.05, s))
  const a: Pt = [r3(w.a[0] + d[0] * (s - width / 2)), r3(w.a[1] + d[1] * (s - width / 2))], b: Pt = [r3(w.a[0] + d[0] * (s + width / 2)), r3(w.a[1] + d[1] * (s + width / 2))]
  const n = p.openings.filter(o => o.added).length + 1
  p.openings.push({ type, a, b, t: w.t, width: r3(width), rooms: [], suspect: false, label: `N${n}`, added: true })
  return p
}
// superficie totale corretta: tutto scalato attorno al centro (le aree vanno col quadrato)
export function rescaleTo(raw: RawPlan, totalM2: number): RawPlan {
  const p = clone(raw), cur = p.rooms.filter(r => !OUT_TYPES.has(r.type)).reduce((a, r) => a + r.area, 0)
  if (!(cur > 0 && totalM2 > 5)) return p
  const k = Math.sqrt(totalM2 / cur), S = (q: Pt): Pt => [r3(q[0] * k), r3(q[1] * k)]
  for (const w of p.walls) { w.a = S(w.a); w.b = S(w.b) } // gli spessori restano veri
  for (const o of p.openings) { o.a = S(o.a); o.b = S(o.b); o.width = r3(o.width * k) }
  for (const r of p.rooms) { r.poly = r.poly.map(S); r.center = S(r.center); r.area = Math.round(r.area * k * k * 10) / 10 }
  const t = p.source.toImage, inv = 1 / k
  p.source = { ...p.source, m_per_px: p.source.m_per_px * k, scale_from: 'manuale', scale_warn: false, toImage: [t[0] * inv, t[1] * inv, t[2] * inv, t[3] * inv, t[4], t[5]] }
  return p
}
export const totalArea = (raw: RawPlan) => Math.round(raw.rooms.filter(r => !OUT_TYPES.has(r.type)).reduce((a, r) => a + r.area, 0) * 10) / 10

// rettangolo utile piu' grande dentro una maschera (istogramma per righe)
function largestRect(mask: Uint8Array, w: number, h: number): [number, number, number, number] | null {
  const hist = new Int32Array(w)
  let best = 0, br: [number, number, number, number] | null = null
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) hist[x] = mask[y * w + x] ? hist[x] + 1 : 0
    const st: [number, number][] = []
    for (let x = 0; x <= w; x++) {
      const hg = x < w ? hist[x] : 0
      let start = x
      while (st.length && st[st.length - 1][1] >= hg) {
        const [s0, h0] = st.pop()!
        if (h0 * (x - s0) > best) { best = h0 * (x - s0); br = [s0, y - h0 + 1, x, y + 1] }
        start = s0
      }
      st.push([start, hg])
    }
  }
  return br
}

export function buildViewerPlan(raw: RawPlan, name?: string): ViewerPlan {
  const plan = raw
  const keep = new Set(plan.rooms.filter(r => !OUT_TYPES.has(r.type)).map(r => r.id))
  const roomAt = roomFinder(plan)
  const typeOf = new Map(plan.rooms.map(r => [r.id, r.type]))
  const rectAxis = (o: RawOpening) => {
    const ax: 'x' | 'z' = Math.abs(o.b[0] - o.a[0]) >= Math.abs(o.b[1] - o.a[1]) ? 'x' : 'z'
    const q = quad(o.a, o.b, o.t), xs = q.map(p => p[0]), zs = q.map(p => p[1])
    return { rect: [r3(Math.min(...xs)), r3(Math.min(...zs)), r3(Math.max(...xs)), r3(Math.max(...zs))] as [number, number, number, number], ax }
  }
  const sidesOf = (o: RawOpening) => {
    const m: Pt = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2], { n } = frame(o.a, o.b), out: number[] = []
    for (const sg of [1, -1]) {
      let rid = -1
      for (const k of [0.2, 0.4, 0.7]) { const r = roomAt(m[0] + sg * n[0] * (o.t / 2 + k), m[1] + sg * n[1] * (o.t / 2 + k)); if (r !== -1) { rid = r; break } }
      out.push(rid)
    }
    return { s1: out[0], s2: out[1], n }
  }
  const outdoor = new Set(plan.rooms.filter(r => OUTDOOR.has(r.type)).map(r => r.id))
  const indoor = (id: number) => id > 0 && !outdoor.has(id)
  const windows: ViewerPlan['windows'] = [], doors: ViewerPlan['doors'] = []
  for (const o of plan.openings) {
    // le aperture solo diagonali non si possono fare nel visore (rettangoli con asse): restano muro
    const { L, d } = frame(o.a, o.b)
    if (L < 0.2 || Math.min(Math.abs(d[0]), Math.abs(d[1])) > 0.2) continue
    const { rect, ax } = rectAxis(o), { s1, s2, n } = sidesOf(o)
    if (s1 === -1 && s2 === -1) continue
    if (o.type === 'window') {
      // la finestra appartiene alla stanza interna (verso un terrazzo il terrazzo e' "fuori")
      if (!indoor(s1) && !indoor(s2)) continue
      const first = indoor(s1)
      const room = first ? s1 : s2
      const inn = first ? n : [-n[0], -n[1]]
      windows.push({ rect, axis: ax, room, in: ax === 'x' ? [0, inn[1] > 0 ? 1 : -1] : [inn[0] > 0 ? 1 : -1, 0] })
    } else {
      const ent = o.type === 'entrance' || s1 === -1 || s2 === -1
      const rs = [s1, s2].filter(x => x > 0)
      const a_ = rs[0], b_ = rs[1] ?? 0
      let swing = ent ? a_ : (['ingresso', 'corridoio'].includes(typeOf.get(a_) ?? '') && b_ ? b_ : a_)
      if (outdoor.has(swing) && b_ && indoor(a_ === swing ? b_ : a_)) swing = a_ === swing ? b_ : a_ // porta del terrazzo: si apre verso casa
      doors.push({ axis: ax, rooms: [a_, b_], rect, swing, ...(ent ? { entrance: true } : {}), ...(o.type === 'varco' ? { varco: true } : {}) })
    }
  }
  // rettangolo utile di ogni stanza (griglia 5 cm, erosa di una cella)
  const C = 0.05
  const rooms: ViewerPlan['rooms'] = []
  for (const r of plan.rooms) {
    if (!keep.has(r.id)) continue
    const xs = r.poly.map(p => p[0]), zs = r.poly.map(p => p[1])
    const x0 = Math.min(...xs) - 0.1, z0 = Math.min(...zs) - 0.1
    const w = Math.floor((Math.max(...xs) - x0) / C) + 3, h = Math.floor((Math.max(...zs) - z0) / C) + 3
    const m = new Uint8Array(w * h)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) m[j * w + i] = inPoly(x0 + (i + 0.5) * C, z0 + (j + 0.5) * C, r.poly) ? 1 : 0
    const e = new Uint8Array(w * h)
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
      let ok = 1
      for (let dj = -1; dj <= 1 && ok; dj++) for (let di = -1; di <= 1; di++) if (!m[(j + dj) * w + i + di]) { ok = 0; break }
      e[j * w + i] = ok
    }
    const lr = largestRect(e, w, h)
    const rect: [number, number, number, number] = lr ? [r3(x0 + lr[0] * C), r3(z0 + lr[1] * C), r3(x0 + lr[2] * C), r3(z0 + lr[3] * C)] : [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]
    rooms.push({ id: r.id, type: r.type, area: r.area, center: r.center, poly: r.poly, rect })
  }
  // muri del terrazzo e del balcone verso fuori: parapetto basso (nessun lato su una stanza interna, almeno uno sul terrazzo)
  const roomAtAll = (x: number, z: number) => { for (const r of plan.rooms) if (inPoly(x, z, r.poly)) return r.type === 'esterno' ? -1 : r.id; return -1 }
  const isParapet = (w: (typeof plan.walls)[number]) => {
    if (!outdoor.size) return false
    const { L, d, n } = frame(w.a, w.b)
    let terr = false
    for (const k of [0.2, 0.5, 0.8]) for (const sg of [1, -1]) {
      const off = w.t / 2 + 0.25, q: Pt = [w.a[0] + d[0] * L * k + sg * n[0] * off, w.a[1] + d[1] * L * k + sg * n[1] * off], id = roomAtAll(q[0], q[1])
      if (indoor(id)) return false
      if (outdoor.has(id)) terr = true
    }
    return terr
  }
  const poly = (w: (typeof plan.walls)[number]) => ({ outer: quad(w.a, w.b, w.t).map(p => [r3(p[0]), r3(p[1])] as Pt), holes: [] as Pt[][] })
  const walls = plan.walls.filter(w => !isParapet(w)).map(poly)
  const parapets = plan.walls.filter(isParapet).map(poly)
  const all = [...walls.flatMap(w => w.outer), ...parapets.flatMap(w => w.outer), ...rooms.flatMap(r => r.poly)]
  const X0 = Math.min(...all.map(p => p[0])), Z0 = Math.min(...all.map(p => p[1])), X1 = Math.max(...all.map(p => p[0])), Z1 = Math.max(...all.map(p => p[1]))
  return { version: 3, units: 'm', height: plan.height || 2.7, outline: [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]], walls, ...(parapets.length ? { parapets } : {}), windows, doors, rooms, ...(name ? { name } : {}) }
}

export function planCounts(p: ViewerPlan) {
  return {
    muri: p.walls.length, porte: p.doors.filter(d => !d.entrance && !d.varco).length, ingressi: p.doors.filter(d => d.entrance).length,
    varchi: p.doors.filter(d => d.varco).length, finestre: p.windows.length, stanze: p.rooms.length, mq: Math.round(p.rooms.reduce((a, r) => a + r.area, 0) * 10) / 10,
  }
}

// Tipi delle stanze rimaste senza tipo ('stanza'), senza AI: area, forma, finestre, ingresso e vicinanze.
// Serve quando il controllo di Claude manca o salta una stanza: l'agente li conferma nella schermata di correzione.
export function guessRoomTypes(raw: RawPlan): RawPlan {
  const p = clone(raw)
  const todo = p.rooms.filter(r => r.type === 'stanza' || !r.type)
  if (!todo.length) return p
  const has = (id: number, t: OpType) => p.openings.some(o => o.type === t && o.rooms.includes(id))
  const near = (a: number, b: number) => p.openings.some(o => o.type !== 'window' && o.rooms.includes(a) && o.rooms.includes(b))
  const box = (r: (typeof p.rooms)[number]) => { const xs = r.poly.map(q => q[0]), ys = r.poly.map(q => q[1]); const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys); return { lo: Math.min(w, h), hi: Math.max(w, h) } }
  const set = (r: (typeof p.rooms)[number], t: string) => { r.type = t; todo.splice(todo.indexOf(r), 1) }
  const taken = (t: string) => p.rooms.some(r => r.type === t)
  for (const r of [...todo]) { const b = box(r); if (b.lo < 1.5 && b.hi / Math.max(b.lo, 0.1) > 2.2 && r.area < 12) set(r, 'corridoio') }
  for (const r of [...todo]) if (r.area < 2.5) set(r, 'ripostiglio')
  for (const r of [...todo]) if (!taken('ingresso') && has(r.id, 'entrance') && r.area < 10) set(r, 'ingresso')
  if (!taken('soggiorno')) { const big = [...todo].sort((a, b) => b.area - a.area)[0]; if (big && big.area >= 10) set(big, 'soggiorno') }
  const living = p.rooms.find(r => r.type === 'soggiorno')
  if (!taken('cucina')) {
    const c = todo.filter(r => r.area >= 4.5 && r.area <= 16).sort((a, b) => Number(!!living && near(b.id, living.id)) - Number(!!living && near(a.id, living.id)) || Number(has(b.id, 'window')) - Number(has(a.id, 'window')) || a.area - b.area)[0]
    if (c) set(c, 'cucina')
  }
  const nBagni = p.rooms.length >= 7 ? 2 : 1
  for (const r of todo.filter(r => r.area >= 2.5 && r.area <= 7.5).sort((a, b) => a.area - b.area).slice(0, Math.max(0, nBagni - p.rooms.filter(x => x.type === 'bagno').length))) set(r, 'bagno')
  for (const r of [...todo]) set(r, r.area >= 9 ? 'camera' : r.area >= 6 ? 'cameretta' : r.area >= 4 && has(r.id, 'window') ? 'studio' : 'ripostiglio')
  return p
}

// Scritte della planimetria originale (lette da Claude con la posizione 0-1 sull'originale): ogni scritta va nella
// stanza riconosciuta che la contiene (inversa di toImage: originale -> metri della pianta ridisegnata, stessa
// trasformazione della sovrapposizione), o nella piu' vicina entro 1,2 m. Il tipo scritto vince su Claude e
// sull'euristica; i mq scritti (almeno 2 coerenti, o 1 con le misure dubbie) correggono la scala; l'altezza scritta
// (H=2,90) diventa l'altezza dei piani.
export function applyLabels(raw: RawPlan, labels: NonNullable<Fix['labels']>): RawPlan {
  let p = clone(raw)
  if (!labels?.length) return p
  const [a, b, c, d, e, f] = p.source.toImage, det = a * d - b * c
  const toM = (px: number, py: number): Pt => [(d * (px - e) - c * (py - f)) / det, (-b * (px - e) + a * (py - f)) / det]
  const hs: number[] = []
  const best = new Map<number, (typeof labels)[number]>()
  for (const l of labels) {
    if (!(l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1)) continue
    const [x, y] = toM(l.x * p.source.imgW, l.y * p.source.imgH)
    let room = p.rooms.find(r => inPoly(x, y, r.poly))
    if (!room) {
      const near = p.rooms.map(r => ({ r, d: Math.hypot(r.center[0] - x, r.center[1] - y) })).sort((u, v) => u.d - v.d)[0]
      if (near && near.d < 1.2) room = near.r
    }
    if (l.h >= 2.2 && l.h <= 4.5) hs.push(l.h)
    if (!room) continue
    const cur = best.get(room.id)
    // nella stessa stanza: prima il nome della stanza, poi i mq
    if (!cur || (cur.type === 'altro' && l.type !== 'altro') || (!cur.mq && l.mq && (l.type !== 'altro' || cur.type === 'altro'))) best.set(room.id, { ...l, mq: l.mq || cur?.mq || 0, type: l.type !== 'altro' ? l.type : cur?.type ?? 'altro' })
  }
  for (const r of p.rooms) {
    const l = best.get(r.id)
    if (!l) continue
    if (l.type !== 'altro' && l.type !== 'esterno') { r.type = l.type; r.label = l.text.slice(0, 40) }
    if (l.mq > 0.5 && l.mq < 300) r.written_mq = l.mq
  }
  // scala dai mq scritti
  const ratios = p.rooms.filter(r => r.written_mq && r.area > 0.5).map(r => r.written_mq! / r.area).sort((u, v) => u - v)
  if (ratios.length) {
    // gruppo piu' numeroso di rapporti coerenti (entro il 25%): una cifra letta male (15,19 letto 5,19) non rovina la scala
    const groups = ratios.map(q => ratios.filter(x => Math.abs(x / q - 1) < 0.25))
    const grp = groups.reduce((m, g) => (g.length > m.length ? g : m), [] as number[])
    const med = grp[Math.floor(grp.length / 2)]
    const coherent = grp.length >= Math.max(1, Math.ceil(ratios.length / 2))
    if (coherent && (grp.length >= 2 || p.source.scale_warn) && Math.abs(med - 1) > 0.12 && med > 0.25 && med < 4) {
      p = rescaleTo(p, totalArea(p) * med)
      p.source = { ...p.source, scale_from: 'scritte', scale_note: `scala dai mq scritti sulla planimetria (${grp.length} stanze su ${ratios.length}, fattore area ${med.toFixed(2)})` }
    }
  }
  if (hs.length) { hs.sort((u, v) => u - v); p.height = Math.round(hs[Math.floor(hs.length / 2)] * 100) / 100 }
  return p
}
