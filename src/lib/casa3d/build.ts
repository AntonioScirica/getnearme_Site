// Dalla pianta riconosciuta (modificabile) alla pianta del visore. Porting di apply_fix.py, senza dipendenze:
// gira sul server e nel browser (schermata di correzione). Le correzioni (Claude o agente) si applicano alla
// pianta riconosciuta; il visore riceve muri come poligoni, porte e finestre come rettangoli con asse, stanze
// con tipo e rettangolo utile per i mobili.
import { fillPoly, simplifyRing, traceContour } from './raster'
import { GROUND, OUTDOOR, exteriorType, type Fix, type OpType, type Pt, type RawOpening, type RawPlan, type RawRoom, type ViewerPlan } from './types'

const OUT_TYPES = new Set(['esterno'])
const hex = (x?: string) => (typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x) ? x : undefined)
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

export const frame = (a: Pt, b: Pt) => {
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
// passaggio "ponte": il vettorizzatore unisce due muri allineati scavalcando un corridoio, e il passaggio va da un muro
// di traverso all'altro senza muro proprio ai lati. Non separa niente: toglierlo unisce gli spazi, non fa un muro.
export function isBridge(raw: RawPlan, o: { a: Pt; b: Pt; t: number }): boolean {
  const { d } = frame(o.a, o.b)
  const segDist = (q: Pt, a: Pt, b: Pt) => { const f = frame(a, b), s = (q[0] - a[0]) * f.d[0] + (q[1] - a[1]) * f.d[1], c = Math.max(0, Math.min(f.L, s)); return { dist: Math.hypot(q[0] - a[0] - f.d[0] * c, q[1] - a[1] - f.d[1] * c), over: Math.max(0, -s, s - f.L) } }
  const crossAt = (q: Pt) => [...raw.walls, ...raw.openings].some(x => {
    if (x === o || /^parapetto-/.test(x.label ?? '')) return false
    const f = frame(x.a, x.b); if (Math.abs(f.d[0] * d[0] + f.d[1] * d[1]) > 0.3) return false
    const { dist, over } = segDist(q, x.a, x.b); return over <= 0.15 && dist <= x.t / 2 + 0.12
  })
  return crossAt(o.a) && crossAt(o.b)
}
export function removeOpening(raw: RawPlan, idx: number): RawPlan {
  const p = clone(raw), o = p.openings[idx]
  if (!o) return p
  if (o.type === 'varco' && o.rooms[0] > 0 && o.rooms[1] > 0 && o.rooms[0] !== o.rooms[1] && isBridge(p, o)) { p.openings.splice(idx, 1); return mergeRooms(p, o.rooms[0], o.rooms[1]) }
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
  const p = clone(raw), cur = totalArea(p)
  if (!(cur > 0 && totalM2 > 5)) return p
  const k = Math.sqrt(totalM2 / cur), S = (q: Pt): Pt => [r3(q[0] * k), r3(q[1] * k)]
  for (const w of p.walls) { w.a = S(w.a); w.b = S(w.b) } // gli spessori restano veri
  for (const o of p.openings) { o.a = S(o.a); o.b = S(o.b); o.width = r3(o.width * k) }
  for (const r of p.rooms) { r.poly = r.poly.map(S); r.center = S(r.center); r.area = Math.round(r.area * k * k * 10) / 10 }
  const t = p.source.toImage, inv = 1 / k
  p.source = { ...p.source, m_per_px: p.source.m_per_px * k, scale_from: 'manuale', scale_warn: false, toImage: [t[0] * inv, t[1] * inv, t[2] * inv, t[3] * inv, t[4], t[5]] }
  return p
}
// superficie della casa: senza terrazzi e balconi (non sono mq interni)
export const totalArea = (raw: RawPlan) => Math.round(raw.rooms.filter(r => !openAir(r)).reduce((a, r) => a + r.area, 0) * 10) / 10
// stanze all'aperto: terrazzi, balconi, giardini, cortili, scale esterne, e quelle che non sono della casa
export const openAir = (r: Pick<RawRoom, 'type' | 'stair'>) => OUT_TYPES.has(r.type) || OUTDOOR.has(r.type) || GROUND.has(r.type) || !!r.stair?.outdoor

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

export function buildViewerPlan(raw: RawPlan, name?: string, opt: { lawn?: boolean } = {}): ViewerPlan {
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
  // all'aperto: terrazzi e balconi (parapetti), giardini e cortili (confini bassi), scale esterne (niente muri attorno)
  const outdoor = new Set(plan.rooms.filter(r => openAir(r) && !OUT_TYPES.has(r.type)).map(r => r.id))
  const terrace = new Set(plan.rooms.filter(r => OUTDOOR.has(r.type)).map(r => r.id))
  const ground = new Map(plan.rooms.filter(r => GROUND.has(r.type)).map(r => [r.id, r.type]))
  const indoor = (id: number) => id > 0 && !outdoor.has(id)
  const windows: ViewerPlan['windows'] = [], doors: ViewerPlan['doors'] = [], openFills: { room: number; poly: Pt[] }[] = []
  for (const o of plan.openings) {
    // le aperture solo diagonali non si possono fare nel visore (rettangoli con asse): restano muro
    const { L, d } = frame(o.a, o.b)
    if (L < 0.2 || Math.min(Math.abs(d[0]), Math.abs(d[1])) > 0.2) continue
    const { rect, ax } = rectAxis(o), { s1, s2, n } = sidesOf(o)
    if (s1 === -1 && s2 === -1) continue
    if (!indoor(s1) && !indoor(s2)) { // tra due esterni (scala esterna e cortile, cortile e strada): niente porta, pavimento
      const id = [s1, s2].find(x => outdoor.has(x)); if (id) openFills.push({ room: id, poly: quad(o.a, o.b, o.t + 0.02).map(p => [r3(p[0]), r3(p[1])] as Pt) })
      continue
    }
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
      if (typeOf.get(swing) === 'scala' && b_) swing = a_ === swing ? b_ : a_ // porta sulla scala: l'anta mai sopra i gradini
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
    // pavimento e muri: scelta dell'agente, poi quelli letti dalle foto per quel tipo di stanza, se no quelli del visore
    const mt = plan.materials?.rooms?.[r.type]
    const floor = r.floor ?? mt?.floor, wall = hex(r.wall) ?? hex(mt?.wall)
    rooms.push({ id: r.id, type: r.type, area: r.area, center: r.center, poly: r.poly, rect, ...(floor ? { floor } : {}), ...(wall ? { wall } : {}), ...(r.stair && r.type === 'scala' ? { stair: r.stair } : {}) })
  }
  // muri senza stanze interne ai lati: verso un terrazzo o un balcone parapetto basso; tra un giardino o un cortile e
  // il fuori (linee del lotto) siepe o muretto; altrimenti (tra esterni, attorno alle scale esterne, linee fuori casa) niente
  const roomAtAll = (x: number, z: number) => { for (const r of plan.rooms) if (inPoly(x, z, r.poly)) return r.type === 'esterno' ? -2 : r.id; return -1 } // -2 = non e' della casa
  const kindOf = (w: (typeof plan.walls)[number]): 'wall' | 'parapet' | 'siepe' | 'muretto' | 'none' => {
    const { L, d, n } = frame(w.a, w.b)
    let terr = false, lot: string | null = null, ext = false
    for (const k of [0.2, 0.5, 0.8]) {
      const ids = [1, -1].map(sg => { const off = w.t / 2 + 0.25; return roomAtAll(w.a[0] + d[0] * L * k + sg * n[0] * off, w.a[1] + d[1] * L * k + sg * n[1] * off) })
      if (ids.some(indoor)) return 'wall'
      if (ids.some(id => terrace.has(id))) terr = true
      if (ids.some(id => id === -2 || outdoor.has(id))) ext = true
      const g = ids.find(id => ground.has(id)), other = ids.find(id => id !== g)
      if (g !== undefined && (other === -1 || other === -2)) lot = ground.get(g)!
    }
    // solo fuori da entrambi i lati (pezzi di muro, pilastri non riconosciuti): restano muri come prima
    return terr ? 'parapet' : lot ? (lot === 'giardino' ? 'siepe' : 'muretto') : ext ? 'none' : 'wall'
  }
  const kinds = plan.walls.map(kindOf)
  const poly = (w: (typeof plan.walls)[number]) => ({ outer: quad(w.a, w.b, w.t).map(p => [r3(p[0]), r3(p[1])] as Pt), holes: [] as Pt[][] })
  const walls = plan.walls.filter((_, i) => kinds[i] === 'wall').map(poly)
  const parapets = plan.walls.filter((_, i) => kinds[i] === 'parapet').map(poly)
  const boundaries = plan.walls.flatMap((w, i) => (kinds[i] === 'siepe' || kinds[i] === 'muretto' ? [{ a: [r3(w.a[0]), r3(w.a[1])] as Pt, b: [r3(w.b[0]), r3(w.b[1])] as Pt, kind: kinds[i] as 'siepe' | 'muretto' }] : []))
  // muri tolti tra esterni: la loro striscia diventa pavimento dell'esterno accanto (niente fessure nel cortile)
  const fills = plan.walls.flatMap((w, i) => {
    if (kinds[i] !== 'none') return []
    const { L, d, n } = frame(w.a, w.b), off = w.t / 2 + 0.2
    const id = [1, -1].map(sg => roomAtAll(w.a[0] + d[0] * L / 2 + sg * n[0] * off, w.a[1] + d[1] * L / 2 + sg * n[1] * off)).find(x => x > 0 && outdoor.has(x))
    return id ? [{ room: id, poly: quad(w.a, w.b, w.t + 0.02).map(p => [r3(p[0]), r3(p[1])] as Pt) }] : []
  }).concat(openFills)
  const all = [...walls.flatMap(w => w.outer), ...parapets.flatMap(w => w.outer), ...rooms.flatMap(r => r.poly)]
  const X0 = Math.min(...all.map(p => p[0])), Z0 = Math.min(...all.map(p => p[1])), X1 = Math.max(...all.map(p => p[0])), Z1 = Math.max(...all.map(p => p[1]))
  const furniture: NonNullable<ViewerPlan['furniture']> = []
  for (const it of plan.furniture ?? []) {
    const m = drawnToViewer(it), room = rooms.find(r => inPoly(it.at[0], it.at[1], r.poly))
    if (m && room) furniture.push({ kind: m.kind, x: it.at[0], z: it.at[1], rot: it.rot, w: m.w, d: m.d, room: room.id, opts: m.opts })
  }
  return { version: 3, units: 'm', height: plan.height || 2.7, outline: [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]], ...(furniture.length ? { furniture } : {}), image: { toImage: [...plan.source.toImage], w: plan.source.imgW, h: plan.source.imgH }, ...(plan.materials ? { materials: { frames: hex(plan.materials.frames) ?? '#f7f6f3', doors: hex(plan.materials.doors) ?? '#f3f1ec', facade: { kind: plan.materials.facade?.kind ?? 'intonaco', color: hex(plan.materials.facade?.color) ?? '#efe6d6' }, roof: plan.materials.roof, shutters: hex(plan.materials.shutters) ?? '' } } : {}), walls, ...(parapets.length ? { parapets } : {}), ...(boundaries.length ? { boundaries } : {}), ...(fills.length ? { fills } : {}), windows, doors, rooms, ...(plan.rooms.some(r => OUT_TYPES.has(r.type) || OUTDOOR.has(r.type) || GROUND.has(r.type)) ? { garden: true } : {}), ...(opt.lawn ? { lawn: true } : {}), ...(name ? { name } : {}) }
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
    // W.C. o bagno scritto in una stanza grande (scritta a cavallo, pianta un po' spostata): va al vano piccolo vicino
    if (room && l.type === 'bagno' && room.area > 12) {
      const small = p.rooms.filter(r => r.area <= 8 && r.type !== 'esterno').map(r => ({ r, d: polyDist([x, y], r.poly) })).filter(q => q.d < 0.8).sort((u, v) => u.d - v.d)[0]
      if (small) room = small.r
    }
    if (!room && (l.type === 'terrazzo' || l.type === 'balcone')) { (p.outside_labels ??= []).push({ text: l.text.slice(0, 40), type: l.type, x: l.x, y: l.y, ...(l.mq > 0 ? { mq: l.mq } : {}) }); continue }
    if (!room) continue
    const cur = best.get(room.id)
    if (cur && exteriorType(cur.text)) continue // la scritta dell'esterno (resede, corte) vince sulle altre nella stessa zona
    if (exteriorType(l.text)) { best.set(room.id, { ...l, mq: l.mq || cur?.mq || 0 }); continue }
    // nella stessa stanza: prima il nome della stanza, poi i mq
    if (!cur || (cur.type === 'altro' && l.type !== 'altro') || (!cur.mq && l.mq && (l.type !== 'altro' || cur.type === 'altro'))) best.set(room.id, { ...l, mq: l.mq || cur?.mq || 0, type: l.type !== 'altro' ? l.type : cur?.type ?? 'altro' })
  }
  for (const r of p.rooms) {
    const l = best.get(r.id)
    if (!l) continue
    const ext = exteriorType(l.text) // resede, corte, giardino: esterno della casa, mai una stanza
    if (ext) { r.type = ext; r.label = l.text.slice(0, 40) }
    else if (l.type !== 'altro' && l.type !== 'esterno') { r.type = l.type; r.label = l.text.slice(0, 40) }
    if (l.mq > 0.5 && l.mq < 300) r.written_mq = l.mq
  }
  p = scaleFromWritten(p)
  if (hs.length) { hs.sort((u, v) => u - v); p.height = Math.round(hs[Math.floor(hs.length / 2)] * 100) / 100 }
  return p
}

// scala dai mq scritti per le stanze (written_mq): gruppo piu' numeroso di rapporti coerenti (entro il 25%), cosi' una
// cifra letta male (15,19 letto 5,19) non rovina la scala; almeno 2 stanze, o 1 con le misure gia' dubbie
export function scaleFromWritten(raw: RawPlan): RawPlan {
  let p = raw
  const ratios = p.rooms.filter(r => r.written_mq && r.area > 0.5).map(r => r.written_mq! / r.area).sort((u, v) => u - v)
  if (!ratios.length) return p
  const groups = ratios.map(q => ratios.filter(x => Math.abs(x / q - 1) < 0.25))
  const grp = groups.reduce((m, g) => (g.length > m.length ? g : m), [] as number[])
  const med = grp[Math.floor(grp.length / 2)]
  const coherent = grp.length >= Math.max(1, Math.ceil(ratios.length / 2))
  if (coherent && (grp.length >= 2 || p.source.scale_warn) && Math.abs(med - 1) > 0.12 && med > 0.25 && med < 4) {
    p = rescaleTo(p, totalArea(p) * med)
    p.source = { ...p.source, scale_from: 'scritte', scale_note: `scala dai mq scritti sulla planimetria (${grp.length} stanze su ${ratios.length}, fattore area ${med.toFixed(2)})` }
  }
  return p
}

// distanza di un punto dal contorno di una stanza (0 se dentro)
export function polyDist(q: Pt, poly: Pt[]): number {
  if (inPoly(q[0], q[1], poly)) return 0
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], { L, d } = frame(a, b), s = Math.max(0, Math.min(L, (q[0] - a[0]) * d[0] + (q[1] - a[1]) * d[1]))
    best = Math.min(best, Math.hypot(q[0] - a[0] - d[0] * s, q[1] - a[1] - d[1] * s))
  }
  return best
}

// Tipi plausibili, senza AI (dopo le scritte, prima di guessRoomTypes). Un bagno senza scritta e senza sanitari disegnati
// e' sospetto se supera 12 m2, o da 6 m2 in su quando la pianta scrive i bagni altrove (catastali: W.C. e Bagno scritti,
// vani principali senza nome): torna 'stanza' e il tipo lo decide guessRoomTypes. Le porte di un bagno verso fuori sono
// finestre (sulle catastali la finestra del W.C. sul resede veniva letta come porta d'ingresso).
export function checkRoomTypes(raw: RawPlan): RawPlan {
  const p = clone(raw)
  const written = p.rooms.some(r => r.type === 'bagno' && r.label)
  const fixtures = (r: (typeof p.rooms)[number]) => (p.furniture ?? []).some(f => ['wc', 'shower', 'bathtub'].includes(f.kind) && inPoly(f.at[0], f.at[1], r.poly))
  for (const r of p.rooms) if (r.type === 'bagno' && !r.label && !fixtures(r) && (r.area > 12 || (written && r.area >= 6))) r.type = 'stanza'
  // lati dell'apertura guardati sulla pianta (gli id salvati possono essere di prima di divisioni e unioni)
  const at = (q: Pt) => p.rooms.find(r => inPoly(q[0], q[1], r.poly))
  for (const o of p.openings) {
    if (o.type !== 'door' && o.type !== 'entrance') continue
    const { n } = frame(o.a, o.b), m: Pt = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2], off = o.t / 2 + 0.25
    const [a, b] = [1, -1].map(sg => at([m[0] + sg * n[0] * off, m[1] + sg * n[1] * off]))
    const out = (r?: (typeof p.rooms)[number]) => !r || OUT_TYPES.has(r.type)
    if ((a?.type === 'bagno' && out(b)) || (b?.type === 'bagno' && out(a))) o.type = 'window'
  }
  return p
}

// Mobili disegnati sull'originale -> metri sulla pianta (stessa inversa di toImage delle scritte)
const DRAWN_KINDS = new Set(['bed_double', 'bed_single', 'sofa', 'armchair', 'dining_table', 'desk', 'wardrobe', 'kitchen', 'wc', 'sink', 'shower', 'bathtub', 'tv_unit'])
export function applyFurniture(raw: RawPlan, items: NonNullable<Fix['furniture']>): RawPlan {
  const p = clone(raw)
  const [a, b, c, d, e, f] = p.source.toImage, det = a * d - b * c, ppm = Math.sqrt(Math.abs(det))
  const toM = (px: number, py: number): Pt => [(d * (px - e) - c * (py - f)) / det, (-b * (px - e) + a * (py - f)) / det]
  p.furniture = []
  for (const it of items ?? []) {
    // solo i mobili disegnati con sicurezza (confidenza dal controllo; senza, li verifica l'inchiostro in pipeline)
    if (!DRAWN_KINDS.has(it.kind) || !(it.x >= 0 && it.x <= 1 && it.y >= 0 && it.y <= 1) || (typeof it.confidence === 'number' && it.confidence < 0.5)) continue // la soglia vera (0,6 / 0,75 per letti e divani) e' in verifyFurniture
    const at = toM(it.x * p.source.imgW, it.y * p.source.imgH)
    if (!p.rooms.some(r => inPoly(at[0], at[1], r.poly))) continue
    const vx = Math.cos(it.back * Math.PI / 180), vy = Math.sin(it.back * Math.PI / 180)
    const bx = (d * vx - c * vy) / det, bz = (-b * vx + a * vy) / det
    // i muri della pianta sono dritti: il verso letto (spesso approssimato sull'originale ruotato) si aggancia al quarto di giro
    const rot = Math.round(Math.atan2(-bx, -bz) / (Math.PI / 2)) * (Math.PI / 2)
    p.furniture.push({ kind: it.kind, at: [r3(at[0]), r3(at[1])], rot: Math.round(rot * 1000) / 1000, len: r3(it.len * p.source.imgW / ppm), depth: r3(it.depth * p.source.imgW / ppm), ...(typeof it.confidence === 'number' ? { conf: it.confidence } : {}) })
  }
  return p
}
const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v || lo))
// mobile disegnato -> modello del catalogo del visore con le misure (w lungo x locale, d lungo z)
export function drawnToViewer(it: NonNullable<RawPlan['furniture']>[number]): { kind: string; w: number; d: number; opts: Record<string, number> } | null {
  const L = it.len, D = it.depth
  switch (it.kind) {
    case 'bed_double': { const w = cl(D, 1.4, 1.9), l = cl(L, 1.9, 2.2); return { kind: 'bed', w, d: l, opts: { w, l } } }
    case 'bed_single': { const w = cl(D, 0.8, 1.2), l = cl(L, 1.9, 2.1); return { kind: 'bed', w, d: l, opts: { w, l } } }
    case 'sofa': { const w = cl(L, 1.4, 3.2); return { kind: 'sofa', w, d: 0.95, opts: { w } } }
    case 'armchair': return { kind: 'armchair', w: 0.82, d: 0.85, opts: {} }
    case 'dining_table': { const w = cl(L, 0.8, 2.4), dd = cl(D, 0.7, 1.2); return { kind: 'table', w, d: dd, opts: { w, d: dd } } }
    case 'desk': { const w = cl(L, 0.8, 2), dd = cl(D, 0.5, 0.9); return { kind: 'desk', w, d: dd, opts: { w, d: dd } } }
    case 'wardrobe': { const w = cl(L, 0.8, 3.6); return { kind: 'wardrobe', w, d: 0.62, opts: { w } } }
    case 'kitchen': { const w = cl(L, 1.2, 5); return { kind: 'kitchen', w, d: 0.64, opts: { w } } }
    case 'wc': return { kind: 'wc', w: 0.4, d: 0.6, opts: {} }
    case 'sink': return { kind: 'sink', w: 0.6, d: 0.5, opts: {} }
    case 'bathtub': { const w = cl(L, 1.4, 1.9), dd = cl(D, 0.65, 0.9); return { kind: 'bathtub', w, d: dd, opts: { w, d: dd } } }
    case 'shower': { const w = cl(L, 0.7, 1.4), dd = cl(D, 0.7, 1.2); return { kind: 'shower', w, d: dd, opts: { w, d: dd } } }
    case 'tv_unit': { const w = cl(L, 1, 2.4); return { kind: 'tvcab', w, d: 0.42, opts: { w } } }
  }
  return null
}

export function setRoomLook(raw: RawPlan, id: number, look: { floor?: RawPlan['rooms'][number]['floor']; wall?: string }): RawPlan {
  const p = clone(raw), r = p.rooms.find(x => x.id === id)
  if (r) Object.assign(r, look)
  return p
}
export function setFacade(raw: RawPlan, color: string): RawPlan {
  const p = clone(raw)
  p.materials = { rooms: {}, frames: '#f7f6f3', doors: '#f3f1ec', roof: 'non_visibile', shutters: '', from: 0, ...p.materials, facade: { kind: p.materials?.facade?.kind ?? 'intonaco', color } }
  return p
}

// --- dividi e unisci stanze (schermata di correzione) ---
export const shoelace = (P: Pt[]) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1] } return a / 2 }
const centerOf = (P: Pt[]): Pt => {
  const A = shoelace(P); let cx = 0, cy = 0
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], k = p[0] * q[1] - q[0] * p[1]; cx += (p[0] + q[0]) * k; cy += (p[1] + q[1]) * k }
  const c: Pt = A ? [cx / (6 * A), cy / (6 * A)] : P[0]
  if (inPoly(c[0], c[1], P)) return [r3(c[0]), r3(c[1])]
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]); return [r3((Math.min(...xs) + Math.max(...xs)) / 2), r3((Math.min(...ys) + Math.max(...ys)) / 2)]
}
// semipiano a sinistra della retta (o, d): Sutherland-Hodgman
function clipHalf(P: Pt[], o: Pt, d: Pt, keepLeft: boolean): Pt[] {
  const side = (p: Pt) => (d[0] * (p[1] - o[1]) - d[1] * (p[0] - o[0])) * (keepLeft ? 1 : -1)
  const out: Pt[] = []
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], sa = side(a), sb = side(b)
    if (sa >= 0) out.push(a)
    if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
  }
  return out
}
// p1, p2: punti toccati; la linea si raddrizza se e' quasi orizzontale o verticale
export function splitRoom(raw: RawPlan, id: number, p1: Pt, p2: Pt, mode: 'muro' | 'porta' | 'passaggio', minArea = 0.5): RawPlan {
  const p = clone(raw), r = p.rooms.find(x => x.id === id)
  if (!r) return p
  let d: Pt = [p2[0] - p1[0], p2[1] - p1[1]]
  const L = Math.hypot(d[0], d[1]); if (L < 0.2) return p
  d = [d[0] / L, d[1] / L]
  const o: Pt = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
  if (Math.abs(d[1]) < 0.17) d = [Math.sign(d[0]) || 1, 0]; else if (Math.abs(d[0]) < 0.17) d = [0, Math.sign(d[1]) || 1]
  const A = clipHalf(r.poly, o, d, true), B = clipHalf(r.poly, o, d, false)
  const aA = Math.abs(shoelace(A)), aB = Math.abs(shoelace(B))
  if (A.length < 3 || B.length < 3 || aA < minArea || aB < minArea) return p
  // corda: intersezioni della retta col contorno, le piu' vicine al punto di mezzo da una parte e dall'altra
  const ts: number[] = []
  for (let i = 0; i < r.poly.length; i++) {
    const a = r.poly[i], b = r.poly[(i + 1) % r.poly.length], e: Pt = [b[0] - a[0], b[1] - a[1]]
    const den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-9) continue
    const t = ((a[0] - o[0]) * e[1] - (a[1] - o[1]) * e[0]) / den, u = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den
    if (u >= -1e-6 && u <= 1 + 1e-6) ts.push(t)
  }
  const t0 = Math.max(...ts.filter(t => t <= 0), -50), t1 = Math.min(...ts.filter(t => t >= 0), 50)
  const ca: Pt = [r3(o[0] + d[0] * t0), r3(o[1] + d[1] * t0)], cb: Pt = [r3(o[0] + d[0] * t1), r3(o[1] + d[1] * t1)]
  const nid = Math.max(...p.rooms.map(x => x.id)) + 1
  const mk = (P: Pt[], id2: number) => ({ ...r, id: id2, poly: P.map(q => [r3(q[0]), r3(q[1])] as Pt), area: Math.round(Math.abs(shoelace(P)) * 10) / 10, center: centerOf(P), written_mq: undefined })
  p.rooms = p.rooms.flatMap(x => (x.id === id ? [mk(A, id), { ...mk(B, nid), label: undefined }] : [x]))
  if (mode !== 'passaggio') p.walls.push({ a: ca, b: cb, t: 0.1, label: `divisione-${nid}` })
  if (mode === 'porta') {
    const cl = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]), w = Math.min(0.8, cl - 0.2), m = (cl - w) / 2
    if (w > 0.5) p.openings.push({ type: 'door', a: [r3(ca[0] + d[0] * m), r3(ca[1] + d[1] * m)], b: [r3(ca[0] + d[0] * (m + w)), r3(ca[1] + d[1] * (m + w))], t: 0.1, width: r3(w), rooms: [id, nid], suspect: false, label: `D${nid}`, added: true })
  }
  return p
}
// due stanze che si toccano "nell'aria": almeno 50 cm continui di contorno di A a meno di 40 cm da B, senza muri ne' aperture
// in mezzo (resti di passaggi finti o di vani lasciati aperti dal ridisegno)
export function touchAir(raw: RawPlan, idA: number, idB: number): boolean {
  const A = raw.rooms.find(x => x.id === idA), B = raw.rooms.find(x => x.id === idB)
  if (!A || !B) return false
  const blocked = [...raw.walls, ...raw.openings].map(w => quad(w.a, w.b, w.t + 0.02))
  const free = (q: Pt) => !blocked.some(P => inPoly(q[0], q[1], P))
  // tratto continuo di almeno 50 cm: i buchi tra stipite e muro (pochi cm) non contano
  let best = 0
  for (let i = 0; i < A.poly.length; i++) {
    const a = A.poly[i], b = A.poly[(i + 1) % A.poly.length], { L, d } = frame(a, b)
    let run = 0
    for (let s = 0.025; s < L; s += 0.05) {
      const q: Pt = [a[0] + d[0] * s, a[1] + d[1] * s]
      const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
        for (let k = 0; k <= 0.4001; k += 0.02) { if (!free([q[0] + dx * k, q[1] + dz * k])) return false; if (k > 0 && inPoly(q[0] + dx * k, q[1] + dz * k, B.poly)) return true }
        return false
      })
      run = ok ? run + 0.05 : 0; best = Math.max(best, run)
    }
  }
  return best >= 0.5
}
// unisce due stanze vicine: via i muri (e le loro aperture) che stanno solo tra le due; contorno nuovo su griglia di 5 cm
// close: celle (5 cm) di chiusura del contorno; nell'aria di default 5 (chiude il vano fino a 50 cm tra le due)
export function mergeRooms(raw: RawPlan, idA: number, idB: number, opt: { close?: number } = {}): RawPlan {
  const p = clone(raw), A = p.rooms.find(x => x.id === idA), B = p.rooms.find(x => x.id === idB)
  if (!A || !B || idA === idB) return p
  const at = (x: number, z: number) => (inPoly(x, z, A.poly) ? idA : inPoly(x, z, B.poly) ? idB : 0)
  // tratto di ogni muro che ha A da una parte e B dall'altra: si toglie quel tratto (il resto del muro resta)
  const gone: { a: Pt; b: Pt; t: number }[] = [], keepW: typeof p.walls = []
  for (const w of p.walls) {
    const { L, d, n } = frame(w.a, w.b), off = w.t / 2 + 0.2
    let s0 = -1, s1 = -1
    for (let s = 0.025; s < L; s += 0.05) {
      const q: Pt = [w.a[0] + d[0] * s, w.a[1] + d[1] * s]
      const sides = new Set([at(q[0] + n[0] * off, q[1] + n[1] * off), at(q[0] - n[0] * off, q[1] - n[1] * off)])
      if (sides.has(idA) && sides.has(idB)) { if (s0 < 0) s0 = s; s1 = s }
    }
    if (s0 < 0 || s1 - s0 < 0.2) { keepW.push(w); continue }
    const P = (s: number): Pt => [r3(w.a[0] + d[0] * s), r3(w.a[1] + d[1] * s)]
    const c0 = Math.max(0, s0 - 0.05), c1 = Math.min(L, s1 + 0.05)
    gone.push({ a: P(c0), b: P(c1), t: w.t })
    if (c0 > 0.15) keepW.push({ ...w, b: P(c0) })
    if (L - c1 > 0.15) keepW.push({ ...w, a: P(c1) })
  }
  const air = !gone.length
  if (air && !touchAir(raw, idA, idB)) return p // non sono vicine
  const onGone = (o: RawOpening) => gone.some(w => { const m: Pt = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]; return inPoly(m[0], m[1], quad(w.a, w.b, w.t + 0.04)) })
  p.openings = p.openings.filter(o => !onGone(o))
  p.walls = keepW
  // contorno: stanze + muri tolti su una griglia, chiusura di una cella, contorno esterno
  const C = 0.05, all = [...A.poly, ...B.poly, ...gone.flatMap(w => quad(w.a, w.b, w.t))]
  const x0 = Math.min(...all.map(q => q[0])) - 0.4, z0 = Math.min(...all.map(q => q[1])) - 0.4
  const W = Math.ceil((Math.max(...all.map(q => q[0])) + 0.4 - x0) / C), H = Math.ceil((Math.max(...all.map(q => q[1])) + 0.4 - z0) / C)
  const toG = (P: Pt[]) => P.map(q => [(q[0] - x0) / C, (q[1] - z0) / C] as [number, number])
  let m: Uint8Array = new Uint8Array(W * H)
  fillPolyMask(m, W, H, toG(A.poly)); fillPolyMask(m, W, H, toG(B.poly)); for (const w of gone) fillPolyMask(m, W, H, toG(quad(w.a, w.b, w.t + 0.02)))
  m = closeGrid(m, W, H, opt.close ?? (air ? 5 : 1)) // nell'aria si chiude anche il vano (fino a 50 cm) tra le due stanze
  const lab = new Int32Array(W * H); for (let i = 0; i < m.length; i++) lab[i] = m[i]
  const ring = simplifyRing(traceContour(lab, 1, W, H).map(([x, y]) => [x + 0.5, y + 0.5] as [number, number]), 1.2)
  const poly = ring.map(([x, y]) => [r3(x0 + x * C), r3(z0 + y * C)] as Pt)
  const merged = { ...A, poly, area: Math.round(Math.abs(shoelace(poly)) * 10) / 10, center: centerOf(poly), written_mq: undefined }
  p.rooms = p.rooms.filter(x => x.id !== idB).map(x => (x.id === idA ? merged : x))
  return p
}
function fillPolyMask(m: Uint8Array, w: number, h: number, poly: [number, number][]) { fillPoly(m, w, h, poly) }
function closeGrid(m0: Uint8Array, w: number, h: number, r = 1): Uint8Array {
  if (r > 1) { let m = m0; for (let i = 0; i < r; i++) m = morph(m, w, h, 1); for (let i = 0; i < r; i++) m = morph(m, w, h, 0); return m }
  return morph(morph(m0, w, h, 1), w, h, 0)
}
function morph(m: Uint8Array, w: number, h: number, grow: number) { // grow 1: dilatazione 3x3, 0: erosione 3x3
  const o = new Uint8Array(m.length)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = grow ? 0 : 1; for (let dy = -1; dy <= 1 && v !== grow; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy, on = xx >= 0 && yy >= 0 && xx < w && yy < h && m[yy * w + xx]; if (grow ? on : !on) { v = grow; break } } o[y * w + x] = v }
  return o
}

// --- mobili nella correzione: togli, ruota, aggiungi (pill semplici) ---
export const removeFurniture = (raw: RawPlan, i: number): RawPlan => { const p = clone(raw); p.furniture = (p.furniture ?? []).filter((_, k) => k !== i); return p }
export const rotateFurniture = (raw: RawPlan, i: number): RawPlan => { const p = clone(raw); const f = p.furniture?.[i]; if (f) f.rot = r3(((f.rot + Math.PI / 2) % (2 * Math.PI))); return p }
const ADD: Record<string, { kind: string; len: number; depth: number }[]> = {
  letto: [{ kind: 'bed_double', len: 2.0, depth: 1.6 }], divano: [{ kind: 'sofa', len: 2.1, depth: 0.95 }], tavolo: [{ kind: 'dining_table', len: 1.4, depth: 0.85 }],
  armadio: [{ kind: 'wardrobe', len: 1.8, depth: 0.6 }], cucina: [{ kind: 'kitchen', len: 2.4, depth: 0.64 }], bagno: [{ kind: 'wc', len: 0.4, depth: 0.6 }, { kind: 'sink', len: 0.6, depth: 0.5 }],
}
export function addFurniture(raw: RawPlan, roomId: number, what: keyof typeof ADD | string): RawPlan {
  const p = clone(raw), r = p.rooms.find(x => x.id === roomId), list = ADD[what]
  if (!r || !list) return p
  // al centro della stanza (o accanto, per i pezzi del bagno), dritti; l'agente li ruota col tocco
  const c = r.center
  list.forEach((it, k) => (p.furniture ??= []).push({ kind: it.kind, at: [r3(c[0] + (k - (list.length - 1) / 2) * 0.8), r3(c[1])], rot: 0, len: it.len, depth: it.depth, conf: 1, added: true }))
  return p
}

// terrazzo disegnato dall'agente (tocchi sugli angoli): stanza esterna; i lati lontani dalla casa (oltre 40 cm dai muri)
// diventano parapetti. replace: il terrazzo trovato da sostituire (e i suoi parapetti)
export function drawOutdoor(raw: RawPlan, pts: Pt[], replace?: number): RawPlan {
  let p = clone(raw)
  if (pts.length < 3) return p
  const old = replace ? p.rooms.find(r => r.id === replace) : undefined
  if (old) { p.rooms = p.rooms.filter(r => r !== old); p.walls = p.walls.filter(w => w.label !== `parapetto-${old.id}`) }
  const poly = pts.map(q => [r3(q[0]), r3(q[1])] as Pt)
  const area = Math.round(Math.abs(shoelace(poly)) * 10) / 10
  const id = old?.id ?? Math.max(0, ...p.rooms.map(r => r.id)) + 1
  p.rooms.push({ id, area, center: centerOf(poly), poly, type: old?.type ?? 'terrazzo', ...(old?.label ? { label: old.label } : {}), ...(old?.written_mq ? { written_mq: old.written_mq } : {}) })
  const distToWalls = (m: Pt) => Math.min(...p.walls.map(w => { const { L, d } = frame(w.a, w.b), dx = m[0] - w.a[0], dy = m[1] - w.a[1], t = Math.max(0, Math.min(L, dx * d[0] + dy * d[1])); return Math.hypot(dx - d[0] * t, dy - d[1] * t) - w.t / 2 }))
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.3 || distToWalls(m) < 0.4) continue
    p.walls.push({ a, b, t: 0.12, label: `parapetto-${id}` })
  }
  if (p.source.outdoor_short) p = { ...p, source: { ...p.source, outdoor_short: p.source.outdoor_short.filter(x => x.room !== replace) } }
  return p
}

// --- esterni: resede e cortili, scale esterne (senza AI, idempotente: pipeline, build e correzione) ---
// stanze ai due lati di un'apertura, guardate sulla pianta (gli id salvati possono essere di prima di divisioni e unioni)
export function openingSides(p: RawPlan, o: RawOpening): (RawRoom | undefined)[] {
  const { n } = frame(o.a, o.b), m: Pt = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2], off = o.t / 2 + 0.25
  return [1, -1].map(sg => p.rooms.find(r => inPoly(m[0] + sg * n[0] * off, m[1] + sg * n[1] * off, r.poly)))
}
// 1. scritte resede/corte/giardino rimaste su stanze di altro tipo: esterni (giardino o cortile)
// 2. scala senza porte verso le stanze vere della casa e accanto a un esterno (o con aperture verso fuori): scala
//    esterna, una rampa all'aperto senza muri ne' soffitto (le scale disegnate nel resede non sono vani)
// 3. vani minuscoli (< 2 m2) senza scritta attaccati a una scala esterna, con aperture solo verso la scala o fuori:
//    frammenti accanto ai gradini, uniti alla scala (niente "ripostigli" inventati)
export function normalizeExterior(raw: RawPlan): RawPlan {
  let p = clone(raw)
  for (const r of p.rooms) { const t = r.label ? exteriorType(r.label) : null; if (t && !GROUND.has(r.type)) r.type = t }
  const main = (r?: RawRoom) => !!r && !openAir(r) && r.type !== 'scala' && r.area >= 3
  const near = (a: RawRoom, test: (r: RawRoom) => boolean) => p.rooms.some(b => b.id !== a.id && test(b) && (touchAir(p, a.id, b.id) || mergeRooms(p, a.id, b.id).rooms.length < p.rooms.length))
  for (const s of p.rooms.filter(r => r.type === 'scala' && !r.stair?.outdoor)) {
    const links = p.openings.map(o => openingSides(p, o)).filter(([a, b]) => a?.id === s.id || b?.id === s.id).map(([a, b]) => (a?.id === s.id ? b : a))
    if (links.some(main)) continue
    if (links.some(r => !r || openAir(r)) || near(s, r => GROUND.has(r.type) || r.type === 'esterno')) s.stair = { ...s.stair, outdoor: true }
  }
  for (const s of p.rooms.filter(r => r.type === 'scala' && r.stair?.outdoor)) {
    for (const t of p.rooms.filter(r => r.id !== s.id && r.area < 2 && !r.label && !openAir(r) && r.type !== 'scala')) {
      const links = p.openings.map(o => openingSides(p, o)).filter(([a, b]) => a?.id === t.id || b?.id === t.id).map(([a, b]) => (a?.id === t.id ? b : a))
      if (links.some(r => r && r.id !== s.id && !openAir(r))) continue // porta verso la casa: e' un vano vero
      const m = mergeRooms(p, s.id, t.id)
      if (m.rooms.length < p.rooms.length) p = m
    }
  }
  return p
}
