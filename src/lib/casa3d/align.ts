// Fedelta' alla planimetria originale. Il ridisegno GPT semplifica e sposta un po' la geometria: qui la pianta
// riconosciuta (fatta sul ridisegno) si rimette sull'ORIGINALE.
//  1. allineamento globale (scala, rotazione piccola, traslazione) che porta le facce dei muri sull'inchiostro
//     dell'originale (distanza dal tratto nero piu' vicino, ricerca a griglia poi fine);
//  2. aggancio di ogni linea di muro: profilo di inchiostro di traverso al muro (+-30 cm) lungo il tratto centrale,
//     si prende la fascia scura (muro pieno) o la coppia di linee sottili (catastali) piu' vicina: posizione e spessore
//     dall'originale; i muri perpendicolari, le aperture e i lati delle stanze seguono la linea spostata;
//  3. misura: errore medio (cm) tra le facce dei muri e l'inchiostro dell'originale, prima e dopo, e muri senza
//     riscontro: se troppi, la schermata di correzione lo segnala (confronto con il cursore dell'originale).
import sharp from 'sharp'
import { dist0 } from './raster'
import { clone, inPoly } from './build'
import type { Pt, RawPlan } from './types'

type Img = { dark: Uint8Array; edge: Uint8Array; dt: Float32Array; w: number; h: number }
export type AlignMetrics = { before_cm: number; global_cm: number; after_cm: number; unsupported: number; walls: number; moved: number; global: { s: number; r: number; tx: number; ty: number } }

async function loadOriginal(orig: Buffer, w: number, h: number): Promise<Img> {
  const { data } = await sharp(orig).rotate().flatten({ background: '#ffffff' }).resize(w, h, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true })
  const dark = new Uint8Array(w * h), edge = new Uint8Array(w * h)
  for (let i = 0; i < dark.length; i++) dark[i] = data[i] < 150 ? 1 : 0
  // bordi (contrasto locale): le linee dei simboli si', i pavimenti colorati o grigi dei rendering no
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; edge[i] = Math.max(Math.abs(data[i + 1] - data[i - 1]), Math.abs(data[i + w] - data[i - w])) > 45 ? 1 : 0 }
  const notDark = new Uint8Array(w * h); for (let i = 0; i < dark.length; i++) notDark[i] = dark[i] ? 0 : 1
  return { dark, edge, dt: dist0(notDark, w, h), w, h } // dt = distanza (px) dal tratto scuro piu' vicino
}

const apply = (T: number[], p: Pt): Pt => [T[0] * p[0] + T[2] * p[1] + T[4], T[1] * p[0] + T[3] * p[1] + T[5]]
const compose = (S: number[], T: number[]) => [ // S dopo T (matrici SVG a b c d e f)
  S[0] * T[0] + S[2] * T[1], S[1] * T[0] + S[3] * T[1], S[0] * T[2] + S[2] * T[3], S[1] * T[2] + S[3] * T[3],
  S[0] * T[4] + S[2] * T[5] + S[4], S[1] * T[4] + S[3] * T[5] + S[5],
]
const frame = (a: Pt, b: Pt) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, d: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; return { L, d, n: [-d[1], d[0]] as Pt } }

// punti sulle due facce lunghe di ogni muro (metri), ogni 5 cm sul tratto centrale
function facePoints(raw: RawPlan, wi?: number) {
  const out: { p: Pt; w: number }[] = []
  raw.walls.forEach((w, i) => {
    if (wi !== undefined && i !== wi) return
    const { L, d, n } = frame(w.a, w.b)
    for (let s = 0.1 * L; s <= 0.9 * L; s += 0.05) for (const sg of [-1, 1])
      out.push({ p: [w.a[0] + d[0] * s + sg * n[0] * w.t / 2, w.a[1] + d[1] * s + sg * n[1] * w.t / 2], w: i })
  })
  return out
}
const CAP = 40
function meanDist(img: Img, T: number[], pts: Pt[]) {
  let s = 0
  for (const p of pts) {
    const [x, y] = apply(T, p), xi = Math.round(x), yi = Math.round(y)
    s += xi < 0 || yi < 0 || xi >= img.w || yi >= img.h ? CAP : Math.min(CAP, img.dt[yi * img.w + xi])
  }
  return pts.length ? s / pts.length : CAP
}
const pxPerM = (T: number[]) => Math.sqrt(Math.abs(T[0] * T[3] - T[1] * T[2]))

export async function alignToOriginal(raw0: RawPlan, original: Buffer): Promise<{ raw: RawPlan; metrics: AlignMetrics }> {
  const raw = clone(raw0)
  const { imgW: W, imgH: H } = raw.source
  const img = await loadOriginal(original, W, H)
  const T0 = raw.source.toImage as number[]
  const all = facePoints(raw).map(x => x.p)
  const sample = all.filter((_, i) => i % Math.max(1, Math.floor(all.length / 900)) === 0)
  const cmPerPx = 100 / pxPerM(T0)
  const before = meanDist(img, T0, all) * cmPerPx

  // 1. allineamento globale: similitudine attorno al centro dell'immagine
  const cx = W / 2, cy = H / 2
  const sim = (s: number, r: number, tx: number, ty: number) => {
    const c = Math.cos(r * Math.PI / 180) * s, si = Math.sin(r * Math.PI / 180) * s
    return [c, si, -si, c, cx - c * cx + si * cy + tx, cy - si * cx - c * cy + ty]
  }
  let best = { s: 1, r: 0, tx: 0, ty: 0, e: meanDist(img, T0, sample) }
  for (const r of [-1.5, -0.75, 0, 0.75, 1.5]) for (let s = 0.94; s <= 1.0601; s += 0.015) for (let tx = -48; tx <= 48; tx += 6) for (let ty = -48; ty <= 48; ty += 6) {
    const e = meanDist(img, compose(sim(s, r, tx, ty), T0), sample)
    if (e < best.e) best = { s, r, tx, ty, e }
  }
  for (let it = 0; it < 2; it++) {
    const b0 = { ...best }
    const k = it ? 1 : 2
    for (const dr of [-0.25, 0, 0.25]) for (let ds = -0.006; ds <= 0.0061; ds += 0.003) for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
      const e = meanDist(img, compose(sim(b0.s + ds, b0.r + dr, b0.tx + dx * k, b0.ty + dy * k), T0), sample)
      if (e < best.e) best = { s: b0.s + ds, r: b0.r + dr, tx: b0.tx + dx * k, ty: b0.ty + dy * k, e }
    }
  }
  const T = compose(sim(best.s, best.r, best.tx, best.ty), T0)
  const globalCm = meanDist(img, T, all) * cmPerPx
  // l'allineamento si tiene solo se migliora davvero (altrimenti il ridisegno era gia' a posto)
  const useT = globalCm < before * 0.9 ? T : T0
  raw.source = { ...raw.source, toImage: useT as RawPlan['source']['toImage'] }

  // 2. aggancio delle linee di muro all'inchiostro dell'originale
  const ppm = pxPerM(useT), step = 1 / ppm // un pixel in metri
  type Meas = { shift: number; t: number }
  const measure = (wi: number): Meas | null => {
    const w = raw.walls[wi], { L, d, n } = frame(w.a, w.b)
    if (L < 0.4 || Math.min(Math.abs(d[0]), Math.abs(d[1])) > 0.05) return null // solo muri dritti abbastanza lunghi
    const R = 0.3 + w.t / 2, prof: number[] = [], offs: number[] = []
    for (let o = -R; o <= R; o += step) {
      let dk = 0, nn = 0
      for (let s = 0.15 * L; s <= 0.85 * L; s += 0.04) {
        const [x, y] = apply(useT, [w.a[0] + d[0] * s + n[0] * o, w.a[1] + d[1] * s + n[1] * o]), xi = Math.round(x), yi = Math.round(y)
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue
        dk += img.dark[yi * W + xi]; nn++
      }
      offs.push(o); prof.push(nn ? dk / nn : 0)
    }
    // fasce scure (> 50%) lungo il profilo
    const runs: [number, number][] = []
    let st = -1
    prof.forEach((v, i) => { if (v > 0.5 && st < 0) st = i; if ((v <= 0.5 || i === prof.length - 1) && st >= 0) { runs.push([offs[st], offs[v > 0.5 ? i : i - 1]]); st = -1 } })
    if (!runs.length) return null
    let bestC: { lo: number; hi: number; score: number } | null = null
    for (let i = 0; i < runs.length; i++) for (let j = i; j < runs.length; j++) {
      const lo = runs[i][0] - step / 2, hi = runs[j][1] + step / 2, span = hi - lo
      if (span < 0.05 || span > 0.6) continue
      if (i === j && span < 0.05) continue
      const c = (lo + hi) / 2, score = Math.abs(c) * 2 + Math.abs(span - w.t) + (i === j ? 0 : 0.03 * (j - i - 1))
      if (!bestC || score < bestC.score) bestC = { lo, hi, score }
    }
    if (!bestC) return null
    const shift = (bestC.lo + bestC.hi) / 2
    if (Math.abs(shift) > 0.2) return null
    return { shift, t: Math.min(0.6, Math.max(0.06, bestC.hi - bestC.lo)) }
  }
  // linee: muri dritti con la stessa direzione e la stessa coordinata (entro 3 cm)
  const axisOf = (w: { a: Pt; b: Pt }) => (Math.abs(w.b[1] - w.a[1]) < 0.02 ? 'h' : Math.abs(w.b[0] - w.a[0]) < 0.02 ? 'v' : 'o')
  const coordOf = (w: { a: Pt; b: Pt }, ax: string) => (ax === 'h' ? (w.a[1] + w.b[1]) / 2 : (w.a[0] + w.b[0]) / 2)
  const meas = raw.walls.map((_, i) => measure(i))
  const lines: { ax: 'h' | 'v'; c: number; walls: number[] }[] = []
  raw.walls.forEach((w, i) => {
    const ax = axisOf(w); if (ax === 'o') return
    const c = coordOf(w, ax), l = lines.find(x => x.ax === ax && Math.abs(x.c - c) < 0.03)
    if (l) l.walls.push(i); else lines.push({ ax, c, walls: [i] })
  })
  let moved = 0
  const moves: { ax: 'h' | 'v'; old: number; oldT: number; nu: number; nuT: number }[] = []
  // segno della normale di un muro lungo l'asse della sua linea (i muri possono andare in un verso o nell'altro)
  const nsign = (i: number, ax: 'h' | 'v') => { const { n } = frame(raw.walls[i].a, raw.walls[i].b); return Math.sign(ax === 'h' ? n[1] : n[0]) || 1 }
  for (const l of lines) {
    const ms = l.walls.map(i => ({ m: meas[i], L: frame(raw.walls[i].a, raw.walls[i].b).L, sh: (meas[i]?.shift ?? 0) * nsign(i, l.ax) })).filter(x => x.m) as { m: Meas; L: number; sh: number }[]
    if (!ms.length) continue
    ms.sort((p, q) => p.sh - q.sh)
    const tot = ms.reduce((a, x) => a + x.L, 0)
    let acc = 0, shift = ms[0].sh
    for (const x of ms) { acc += x.L; if (acc >= tot / 2) { shift = x.sh; break } }
    const t = ms.reduce((a, x) => a + x.m.t * x.L, 0) / tot
    const oldT = raw.walls[l.walls[0]].t
    if (Math.abs(shift) < 0.01 && Math.abs(t - oldT) < 0.02) continue
    // si sposta solo se le facce di quella linea finiscono davvero piu' vicine all'inchiostro (shift in coordinata assoluta)
    const facesAt = (sh: number, tt: number) => l.walls.flatMap(i => {
      const w = raw.walls[i], { L, d } = frame(w.a, w.b), pts: Pt[] = []
      for (let q = 0.1 * L; q <= 0.9 * L; q += 0.05) for (const sg of [-1, 1]) {
        const x = w.a[0] + d[0] * q, y = w.a[1] + d[1] * q
        pts.push(l.ax === 'h' ? [x, y + sh + sg * tt / 2] : [x + sh + sg * tt / 2, y])
      }
      return pts
    })
    if (meanDist(img, useT, facesAt(shift, t)) > 0.9 * meanDist(img, useT, facesAt(0, oldT))) continue
    moves.push({ ax: l.ax, old: l.c, oldT, nu: l.c + shift, nuT: t })
    moved += l.walls.length
  }
  // applica gli spostamenti: muri della linea, estremi dei muri perpendicolari, aperture, lati delle stanze
  const tol = 0.07
  const mapCoord = (v: number, ax: 'h' | 'v') => { // coordinata (y per 'h', x per 'v') su una faccia o sull'asse di una linea spostata
    for (const m of moves) if (m.ax === ax) {
      if (Math.abs(v - m.old) < tol * 0.5) return m.nu
      if (Math.abs(v - (m.old - m.oldT / 2)) < tol) return m.nu - m.nuT / 2
      if (Math.abs(v - (m.old + m.oldT / 2)) < tol) return m.nu + m.nuT / 2
    }
    return v
  }
  const moveSeg = (s: { a: Pt; b: Pt; t: number }) => {
    const ax = axisOf(s)
    if (ax === 'h') {
      const m = moves.find(x => x.ax === 'h' && Math.abs(coordOf(s, 'h') - x.old) < 0.03)
      if (m) { s.a = [s.a[0], m.nu]; s.b = [s.b[0], m.nu]; s.t = m.nuT }
      s.a = [mapCoord(s.a[0], 'v'), s.a[1]]; s.b = [mapCoord(s.b[0], 'v'), s.b[1]]
    } else if (ax === 'v') {
      const m = moves.find(x => x.ax === 'v' && Math.abs(coordOf(s, 'v') - x.old) < 0.03)
      if (m) { s.a = [m.nu, s.a[1]]; s.b = [m.nu, s.b[1]]; s.t = m.nuT }
      s.a = [s.a[0], mapCoord(s.a[1], 'h')]; s.b = [s.b[0], mapCoord(s.b[1], 'h')]
    }
  }
  for (const w of raw.walls) moveSeg(w)
  for (const o of raw.openings) {
    const ax = axisOf(o)
    if (ax === 'o') continue
    const m = moves.find(x => x.ax === ax && Math.abs(coordOf(o, ax) - x.old) < 0.03)
    if (m) { if (ax === 'h') { o.a = [o.a[0], m.nu]; o.b = [o.b[0], m.nu] } else { o.a = [m.nu, o.a[1]]; o.b = [m.nu, o.b[1]] } o.t = m.nuT }
  }
  for (const r of raw.rooms) {
    r.poly = r.poly.map(([x, y]) => [Math.round(mapCoord(x, 'v') * 1000) / 1000, Math.round(mapCoord(y, 'h') * 1000) / 1000] as Pt)
    let a = 0; for (let i = 0; i < r.poly.length; i++) { const p = r.poly[i], q = r.poly[(i + 1) % r.poly.length]; a += p[0] * q[1] - q[0] * p[1] }
    r.area = Math.round(Math.abs(a) / 2 * 10) / 10
    if (!inPoly(r.center[0], r.center[1], r.poly)) { const xs = r.poly.map(p => p[0]), ys = r.poly.map(p => p[1]); r.center = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] }
  }

  // 3. misura dopo e muri senza riscontro nell'originale (facce lontane dall'inchiostro piu' di 20 cm)
  const allAfter = facePoints(raw)
  const after = meanDist(img, useT, allAfter.map(x => x.p)) * 100 / ppm
  let unsupported = 0
  raw.walls.forEach((_, i) => { if (meanDist(img, useT, allAfter.filter(x => x.w === i).map(x => x.p)) / ppm > 0.2) unsupported++ })
  const metrics: AlignMetrics = {
    before_cm: Math.round(before * 10) / 10, global_cm: Math.round(globalCm * 10) / 10, after_cm: Math.round(after * 10) / 10,
    unsupported, walls: raw.walls.length, moved, global: { s: Math.round(best.s * 1000) / 1000, r: best.r, tx: best.tx, ty: best.ty },
  }
  const diverge = after > 12 || unsupported > 0.25 * raw.walls.length
  raw.source = { ...raw.source, fit: { error_cm: metrics.after_cm, before_cm: metrics.before_cm, unsupported, walls: raw.walls.length, diverge } }
  return { raw, metrics }
}

// Mobili letti da Claude: si tengono solo quelli con inchiostro nel loro ingombro sull'originale (contorno del simbolo),
// confrontato col pavimento vuoto della stessa stanza. Scarta i mobili "immaginati" dal tipo di stanza.
export async function verifyFurniture(raw: RawPlan, original: Buffer): Promise<{ raw: RawPlan; kept: number; dropped: string[] }> {
  if (!raw.furniture?.length) return { raw, kept: 0, dropped: [] }
  const { imgW: W, imgH: H } = raw.source, T = raw.source.toImage as number[]
  const img = await loadOriginal(original, W, H)
  const edgeAt = (p: Pt) => { const [x, y] = apply(T, p), xi = Math.round(x), yi = Math.round(y); return xi < 0 || yi < 0 || xi >= W || yi >= H ? 0 : img.edge[yi * W + xi] }
  const rectPts = (at: Pt, f: NonNullable<RawPlan['furniture']>[number], k: number) => {
    const c = Math.cos(f.rot), s = Math.sin(f.rot), out: Pt[] = []
    for (let u = -0.5; u <= 0.5; u += 0.04) for (let v = -0.5; v <= 0.5; v += 0.04) {
      const lx = u * f.len * k, lz = v * f.depth * k // asse x locale ruotato come nel visore (rotation.y)
      out.push([at[0] + c * lx + s * lz, at[1] - s * lx + c * lz])
    }
    return out
  }
  const inAny = (p: Pt) => raw.furniture!.some(f => { const c = Math.cos(f.rot), s = Math.sin(f.rot), dx = p[0] - f.at[0], dz = p[1] - f.at[1]; return Math.abs(c * dx - s * dz) < f.len * 0.8 && Math.abs(s * dx + c * dz) < f.depth * 0.8 })
  // pavimento vuoto della stanza: densita' di bordi lontano dai muri e dai mobili letti
  const base = new Map<number, number>()
  for (const r of raw.rooms) {
    const xs = r.poly.map(p => p[0]), ys = r.poly.map(p => p[1]); let dk = 0, n = 0
    for (let x = Math.min(...xs) + 0.3; x < Math.max(...xs) - 0.3; x += 0.06) for (let y = Math.min(...ys) + 0.3; y < Math.max(...ys) - 0.3; y += 0.06) {
      const p: Pt = [x, y]; if (!inPoly(x, y, r.poly) || inAny(p)) continue
      dk += edgeAt(p); n++
    }
    base.set(r.id, n ? dk / n : 0)
  }
  const keep: NonNullable<RawPlan['furniture']> = [], dropped: string[] = []
  for (const f of raw.furniture) {
    const room = raw.rooms.find(r => inPoly(f.at[0], f.at[1], r.poly))
    if (!room) { dropped.push(`${f.kind} (fuori)`); continue }
    // la posizione letta e' approssimata: si cerca il simbolo entro 40 cm e ci si sposta li'
    let best = { d: -1, at: f.at }
    for (let dx = -0.4; dx <= 0.401; dx += 0.1) for (let dy = -0.4; dy <= 0.401; dy += 0.1) {
      const at: Pt = [f.at[0] + dx, f.at[1] + dy]
      if (!inPoly(at[0], at[1], room.poly)) continue
      const pts = rectPts(at, f, 1.1), d = pts.reduce((a, p) => a + edgeAt(p), 0) / pts.length - 0.002 * Math.hypot(dx, dy) * 10
      if (d > best.d) best = { d, at }
    }
    const b = base.get(room.id) ?? 0
    // soglia prudente: si scarta solo cio' che non ha piu' segni del pavimento vuoto della stanza (mobili inventati)
    if (best.d >= Math.max(0.03, 1.15 * b)) keep.push({ ...f, at: [Math.round(best.at[0] * 1000) / 1000, Math.round(best.at[1] * 1000) / 1000] })
    else dropped.push(`${f.kind} (${(best.d * 100).toFixed(1)}% contro ${(b * 100).toFixed(1)}%)`)
  }
  return { raw: { ...raw, furniture: keep }, kept: keep.length, dropped }
}
