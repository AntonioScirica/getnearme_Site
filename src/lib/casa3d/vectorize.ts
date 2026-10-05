// Vettorializzazione della pianta "da CAD" (ridisegnata da GPT Image) -> pianta in metri modificabile.
// Porting in TypeScript di vector3.py (prototipo del 04/10, OpenCV) con tre miglioramenti:
//  1. finestre sul perimetro anche senza grigio: un'interruzione del muro esterno senza arco e' una finestra;
//  2. chiusura delle stanze col contorno della casa: i varchi non riconosciuti e il grigio delle finestre (anche
//     sui muri obliqui dei bovindi) chiudono il perimetro prima di cercare le stanze;
//  3. porte senza arco: varco largo da porta tra un muro e il suo perpendicolare (non solo tra due pezzi dello stesso muro).
// Passi: angolo dominante e raddrizzamento; spessore tipico dei tramezzi; segmenti orizzontali/verticali + obliqui;
// spessori a classi; collineari allineati; aperture lungo le linee dei muri; giunti L/T; stanze; scala.
import sharp from 'sharp'
import {
  andNot, closeBox, closeDisk, components, dilateBox, dist0, erodeDisk, fillPoly, fillRect, growSeeds, keepRuns, meanRect, openBox, openDisk,
  or, reachFromBorder, simplifyRing, traceContour, type Mask,
} from './raster'
import type { OpType, Pt, RawOpening, RawPlan, RawRoom, RawWall } from './types'

type Seg = { axis: 'h' | 'v'; c: number; t: number; a0: number; a1: number }
type Obl = { axis: 'o'; p0: Pt; p1: Pt; t: number }
type Gap = { axis: 'h' | 'v'; c: number; t: number; a0: number; a1: number; type: OpType | 'door?' | 'gap?'; win: number; arc: number; blob?: boolean; rooms?: number[]; width?: number; suspect?: boolean; label?: string }

export type VectorizeOpts = { areaM2?: number; mPerPx?: number }
export type VectorizeResult = { plan: RawPlan; stats: Record<string, unknown>; ms: number }

// immagine in scala di grigi (sfondo bianco), raddoppiata se piccola come nel prototipo
export async function loadGray(buf: Buffer): Promise<{ g: Uint8Array; w: number; h: number; up: number; srcW: number; srcH: number }> {
  const meta = await sharp(buf).metadata()
  const srcW = meta.width ?? 0, srcH = meta.height ?? 0
  const up = Math.max(srcW, srcH) < 1400 ? 2 : 1
  let img = sharp(buf).flatten({ background: '#ffffff' })
  if (up > 1) img = img.resize(srcW * up, srcH * up, { kernel: 'cubic' })
  const { data, info } = await img.grayscale().raw().toBuffer({ resolveWithObject: true })
  const g = new Uint8Array(info.width * info.height)
  for (let i = 0, j = 0; i < g.length; i++, j += info.channels) g[i] = data[j]
  return { g, w: info.width, h: info.height, up, srcW, srcH }
}

const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const percentile = (a: Float32Array | number[], p: number) => {
  const s = Float32Array.from(a).sort(), k = (s.length - 1) * p / 100, f = Math.floor(k), c = Math.min(s.length - 1, f + 1)
  return s[f] + (s[c] - s[f]) * (k - f)
}

// 1. angolo dominante dei muri (istogramma delle direzioni dei bordi, modulo 90 gradi)
function dominantAngle(g: Uint8Array, w: number, h: number): number {
  const b = new Float32Array(w * h)
  for (let i = 0; i < b.length; i++) b[i] = g[i] < 110 ? 1 : 0
  // Sobel 5x5 separabile (liscio [1 4 6 4 1], derivata [-1 -2 0 2 1])
  const S = [1, 4, 6, 4, 1], D = [-1, -2, 0, 2, 1]
  const conv = (src: Float32Array, k: number[], horiz: boolean) => {
    const o = new Float32Array(w * h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0
      for (let t = -2; t <= 2; t++) {
        const xx = horiz ? Math.min(w - 1, Math.max(0, x + t)) : x, yy = horiz ? y : Math.min(h - 1, Math.max(0, y + t))
        s += src[yy * w + xx] * k[t + 2]
      }
      o[y * w + x] = s
    }
    return o
  }
  const gx = conv(conv(b, D, true), S, false), gy = conv(conv(b, S, true), D, false)
  let mmax = 0
  const mag = new Float32Array(w * h), ang = new Float32Array(w * h)
  for (let i = 0; i < mag.length; i++) {
    mag[i] = Math.hypot(gx[i], gy[i]); if (mag[i] > mmax) mmax = mag[i]
    ang[i] = (((Math.atan2(gy[i], gx[i]) * 180) / Math.PI) % 90 + 90) % 90
  }
  if (!mmax) return 0
  const NB = 900, hist = new Float64Array(NB)
  for (let i = 0; i < mag.length; i++) if (mag[i] > mmax * 0.2) hist[Math.min(NB - 1, Math.floor(ang[i] / 90 * NB))] += mag[i]
  let best = 0, bi = 0
  for (let i = 0; i < NB; i++) { let s = 0; for (let k = -2; k <= 2; k++) s += hist[(i + k + NB) % NB]; if (s > best) { best = s; bi = i } }
  const pk = bi * 0.1 + 0.05
  let sw = 0, sd = 0
  for (let i = 0; i < mag.length; i++) {
    if (!(mag[i] > mmax * 0.2)) continue
    const d = ((ang[i] - pk + 45) % 90 + 90) % 90 - 45
    if (Math.abs(d) < 1.5) { sw += mag[i]; sd += d * mag[i] }
  }
  let A = pk + (sw ? sd / sw : 0)
  if (A > 45) A -= 90
  return A
}

// matrice come cv2.getRotationMatrix2D + allargamento della tela: originale -> raddrizzata
function rotation(A: number, W0: number, H0: number) {
  const a = Math.cos(A * Math.PI / 180), b = Math.sin(A * Math.PI / 180)
  const W = Math.floor(H0 * Math.abs(b) + W0 * Math.abs(a)), H = Math.floor(H0 * Math.abs(a) + W0 * Math.abs(b))
  const cx = W0 / 2, cy = H0 / 2
  const R = [a, b, (1 - a) * cx - b * cy + W / 2 - W0 / 2, -b, a, b * cx + (1 - a) * cy + H / 2 - H0 / 2]
  return { R, W, H }
}
function warp(g: Uint8Array, W0: number, H0: number, R: number[], W: number, H: number): Uint8Array {
  // inversa di [[r0 r1 r2],[r3 r4 r5]]
  const det = R[0] * R[4] - R[1] * R[3]
  const i0 = R[4] / det, i1 = -R[1] / det, i3 = -R[3] / det, i4 = R[0] / det
  const i2 = -(i0 * R[2] + i1 * R[5]), i5 = -(i3 * R[2] + i4 * R[5])
  const out = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = i0 * x + i1 * y + i2, sy = i3 * x + i4 * y + i5
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0
    const px = (xx: number, yy: number) => (xx < 0 || yy < 0 || xx >= W0 || yy >= H0 ? 255 : g[yy * W0 + xx])
    const v = px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy) + px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy
    out[y * W + x] = Math.round(v)
  }
  return out
}

export function vectorize(g0: Uint8Array, W0: number, H0: number, up: number, srcW: number, srcH: number, opts: VectorizeOpts = {}): VectorizeResult {
  const t0 = Date.now()
  const A = dominantAngle(g0, W0, H0)
  const { R, W, H } = rotation(A, W0, H0)
  const g = Math.abs(A) < 0.02 ? g0 : warp(g0, W0, H0, R, W, H)
  const N = W * H

  const wallRaw = new Uint8Array(N), winRaw = new Uint8Array(N)
  for (let i = 0; i < N; i++) { wallRaw[i] = g[i] < 110 ? 1 : 0; winRaw[i] = g[i] >= 120 && g[i] <= 232 ? 1 : 0 }

  // 2. spessore tipico dei tramezzi: 2 x distanza sulle creste (massimi locali della distanza dal bianco)
  const dt = dist0(wallRaw, W, H)
  const th: number[] = []
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, d = dt[i]
    if (d < 2) continue
    let ridge = true
    for (let dy = -1; dy <= 1 && ridge; dy++) for (let dx = -1; dx <= 1; dx++) if (dt[i + dy * W + dx] > d + 1e-6) { ridge = false; break }
    if (ridge) th.push(2 * d)
  }
  const T = th.length ? Math.max(percentile(th, 30), 0.35 * percentile(th, 90)) : 8
  // via le linee sottili (archi delle porte, gradini, retini)
  const k = Math.max(3, Math.round(T * 0.55) | 1)
  const wall = openDisk(wallRaw, W, H, k)
  {
    const cc = components(wall, W, H)
    const small = new Uint8Array(cc.n)
    for (let i = 1; i < cc.n; i++) small[i] = cc.area[i] < (2.5 * T) ** 2 ? 1 : 0
    for (let i = 0; i < N; i++) if (cc.lab[i] && small[cc.lab[i]]) wall[i] = 0
  }
  const thin = andNot(wallRaw, dilateBox(wall, W, H, 3, 3)) // simboli sottili (archi)
  // grigio delle finestre, senza i bordi grigi (antialias) delle linee sottili: archi e gradini non sono finestre
  const win = andNot(closeBox(openBox(andNot(winRaw, dilateBox(thin, W, H, 5, 5)), W, H, 3, 3), W, H, 9, 9), wall)
  const winLine = andNot(closeBox(winRaw, W, H, 9, 9), wall) // per il grigio dentro un varco del muro (come nel prototipo)

  // 3. segmenti orizzontali e verticali
  const L = Math.floor(2.2 * T)
  const Hm = keepRuns(wall, W, H, 'h', L), Vm = keepRuns(wall, W, H, 'v', L)
  const runs = (mask: Mask, axis: 'h' | 'v'): Seg[] => {
    // per ogni colonna (asse h) i tratti di pixel muro, collegati tra colonne vicine con centro e spessore simili
    const outerN = axis === 'h' ? W : H, innerN = axis === 'h' ? H : W
    const at = (i: number, j: number) => (axis === 'h' ? mask[j * W + i] : mask[i * W + j])
    type Tr = { x0: number; x1: number; cs: number[]; ts: number[] }
    let active: Tr[] = []
    const done: Tr[] = []
    for (let x = 0; x < outerN; x++) {
      const starts: number[] = [], ends: number[] = []
      let prev = 0
      for (let y = 0; y <= innerN; y++) { const v = y < innerN ? at(x, y) : 0; if (v && !prev) starts.push(y); if (!v && prev) ends.push(y); prev = v }
      if (!starts.length) { done.push(...active); active = []; continue }
      const nxt: Tr[] = [], used = new Set<number>()
      for (let r = 0; r < starts.length; r++) {
        const c = (starts[r] + ends[r]) / 2, t = ends[r] - starts[r]
        let best = -1
        for (let q = 0; q < active.length; q++) {
          if (used.has(q)) continue
          const tr = active[q]
          if (Math.abs(tr.cs[tr.cs.length - 1] - c) < 0.5 * T && Math.abs(tr.ts[tr.ts.length - 1] - t) < 0.6 * T) { best = q; break }
        }
        let tr: Tr
        if (best < 0) tr = { x0: x, x1: x + 1, cs: [], ts: [] }
        else { tr = active[best]; used.add(best) }
        tr.cs.push(c); tr.ts.push(t); tr.x1 = x + 1
        nxt.push(tr)
      }
      active.forEach((tr, q) => { if (!used.has(q)) done.push(tr) })
      active = nxt
    }
    done.push(...active)
    return done.filter(tr => tr.x1 - tr.x0 >= 0.8 * L).map(tr => ({ axis, c: median(tr.cs), t: median(tr.ts), a0: tr.x0, a1: tr.x1 }))
  }
  const hv: Seg[] = [...runs(Hm, 'h'), ...runs(Vm, 'v')]
  // muri obliqui: quello che resta, se allungato
  const obl: Obl[] = []
  {
    const resid = andNot(wall, dilateBox(or(Hm, Vm), W, H, 5, 5))
    const cc = components(resid, W, H)
    const pts: number[][] = Array.from({ length: cc.n }, () => [])
    for (let i = 0; i < N; i++) if (cc.lab[i] && cc.area[cc.lab[i]] >= 3 * T * L) pts[cc.lab[i]].push(i)
    for (let c = 1; c < cc.n; c++) {
      const P = pts[c]; if (!P.length) continue
      let mx = 0, my = 0
      for (const p of P) { mx += p % W; my += Math.floor(p / W) }
      mx /= P.length; my /= P.length
      let sxx = 0, syy = 0, sxy = 0
      for (const p of P) { const dx = (p % W) - mx, dy = Math.floor(p / W) - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy }
      const n1 = P.length - 1 || 1; sxx /= n1; syy /= n1; sxy /= n1
      const tr = sxx + syy, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - (sxx * syy - sxy * sxy))
      let dx = sxy, dy = l1 - sxx
      if (Math.abs(dx) + Math.abs(dy) < 1e-9) { dx = sxx >= syy ? 1 : 0; dy = sxx >= syy ? 0 : 1 }
      const nn = Math.hypot(dx, dy); dx /= nn; dy /= nn
      let pmin = Infinity, pmax = -Infinity
      for (const p of P) { const pr = ((p % W) - mx) * dx + (Math.floor(p / W) - my) * dy; if (pr < pmin) pmin = pr; if (pr > pmax) pmax = pr }
      const length = pmax - pmin, t = P.length / Math.max(length, 1)
      if (length > 3 * t && length > L) obl.push({ axis: 'o', p0: [mx + dx * pmin, my + dy * pmin], p1: [mx + dx * pmax, my + dy * pmax], t })
    }
  }

  // 4. spessori normalizzati per classi (tramezzi ~10 cm, esterni ~30 cm)
  const ts = [...hv.filter(s => s.a1 - s.a0 > 2 * s.t).map(s => [s.t, s.a1 - s.a0 || 1]), ...obl.map(s => [s.t, 1])].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (!ts.length) ts.push([T, 1])
  const groups: number[][][] = []
  for (const [t, l] of ts) {
    const last = groups[groups.length - 1]
    if (last && t <= 1.3 * median(last.map(x => x[0]))) last.push([t, l]); else groups.push([[t, l]])
  }
  const classes = groups.map(gr => gr.reduce((a, x) => a + x[0] * x[1], 0) / gr.reduce((a, x) => a + x[1], 0))
  const tclass = (t: number) => classes.reduce((b, c) => (Math.abs(c - t) < Math.abs(b - t) ? c : b), classes[0])
  for (const s of hv) s.t = tclass(s.t)
  for (const s of obl) s.t = tclass(s.t)

  // 5. allineamento dei collineari
  for (const axis of ['h', 'v'] as const) {
    const ss = hv.filter(s => s.axis === axis).sort((a, b) => a.c - b.c)
    const cl: Seg[][] = []
    for (const s of ss) { const last = cl[cl.length - 1]; if (last && Math.abs(s.c - last[last.length - 1].c) < 0.6 * T) last.push(s); else cl.push([s]) }
    for (const c of cl) { const mc = c.reduce((a, s) => a + s.c * (s.a1 - s.a0), 0) / c.reduce((a, s) => a + (s.a1 - s.a0), 0); for (const s of c) s.c = mc }
  }

  // 6. aperture lungo le linee dei muri
  const gaps: Gap[] = []
  const clsGap = (axis: 'h' | 'v', c: number, t: number, a0: number, a1: number) => {
    const g_ = a1 - a0
    let wr: number, boxes: number[]
    if (axis === 'h') {
      const y0 = Math.floor(c - t / 2), y1 = Math.floor(c + t / 2) + 1, x0 = Math.floor(a0), x1 = Math.floor(a1)
      wr = meanRect(winLine, W, H, x0, y0, x1, y1)
      boxes = [meanRect(thin, W, H, x0, Math.max(Math.floor(c - g_ - t), 0), x1, Math.floor(c - t / 2)), meanRect(thin, W, H, x0, Math.floor(c + t / 2), x1, Math.floor(c + g_ + t))]
    } else {
      const x0 = Math.floor(c - t / 2), x1 = Math.floor(c + t / 2) + 1, y0 = Math.floor(a0), y1 = Math.floor(a1)
      wr = meanRect(winLine, W, H, x0, y0, x1, y1)
      boxes = [meanRect(thin, W, H, Math.max(Math.floor(c - g_ - t), 0), y0, Math.floor(c - t / 2), y1), meanRect(thin, W, H, Math.floor(c + t / 2), y0, Math.floor(c + g_ + t), y1)]
    }
    return { wr, arc: Math.max(...boxes) }
  }
  for (const axis of ['h', 'v'] as const) {
    const lines = [...new Set(hv.filter(s => s.axis === axis).map(s => s.c))].sort((a, b) => a - b)
    for (const c of lines) {
      const ivs: [number, number, 'row' | 'perp', number][] = hv.filter(s => s.axis === axis && s.c === c).map(s => [s.a0, s.a1, 'row', s.t])
      for (const o of hv) if (o.axis !== axis && o.a0 - 0.5 * T <= c && c <= o.a1 + 0.5 * T) ivs.push([o.c - o.t / 2, o.c + o.t / 2, 'perp', 0])
      ivs.sort((p, q) => p[0] - q[0] || p[1] - q[1] || (p[2] < q[2] ? -1 : p[2] > q[2] ? 1 : 0) || p[3] - q[3])
      const merged: { a: number; b: number; k: Set<string>; t: number }[] = []
      for (const [a, b, k_, t_] of ivs) {
        const last = merged[merged.length - 1]
        if (last && a <= last.b + 1) { last.b = Math.max(last.b, b); last.k.add(k_); if (k_ === 'row') last.t = Math.max(last.t, t_) }
        else merged.push({ a, b, k: new Set([k_]), t: k_ === 'row' ? t_ : 0 })
      }
      for (let i = 0; i + 1 < merged.length; i++) {
        const m0 = merged[i], m1 = merged[i + 1]
        const b0 = m0.b, a1 = m1.a, gap = a1 - b0
        const row0 = m0.k.has('row'), row1 = m1.k.has('row')
        if (!row0 && !row1) continue
        if (gap < 1.2 * T || gap > 22 * T) continue
        const t = m0.t && m1.t ? Math.min(m0.t, m1.t) : (m0.t || m1.t)
        // ai due lati del varco ci dev'essere spazio libero, non altro muro
        const q0 = Math.floor(b0 + 2), q1 = Math.floor(a1 - 2)
        const off0 = Math.floor(c - t / 2 - 0.8 * T - 3), off1 = Math.floor(c + t / 2 + 3)
        const sides = axis === 'h'
          ? [meanRect(wall, W, H, q0, Math.max(off0, 0), q1, Math.floor(c - t / 2 - 2)), meanRect(wall, W, H, q0, off1, q1, Math.floor(off1 + 0.8 * T))]
          : [meanRect(wall, W, H, Math.max(off0, 0), q0, Math.floor(c - t / 2 - 2), q1), meanRect(wall, W, H, off1, q0, Math.floor(off1 + 0.8 * T), q1)]
        if (sides.some(x => x > 0.3)) continue
        // il varco stesso non deve essere gia' coperto da un altro muro (muro esterno spesso letto su due linee)
        const self = axis === 'h' ? meanRect(wall, W, H, q0, Math.floor(c - t / 2), q1, Math.ceil(c + t / 2)) : meanRect(wall, W, H, Math.floor(c - t / 2), q0, Math.ceil(c + t / 2), q1)
        if (self > 0.35) continue
        const { wr, arc } = clsGap(axis, c, t, b0, a1)
        let typ: Gap['type']
        if (wr > 0.25) typ = 'window'
        else if (arc > 0.02 && gap <= 12 * T) typ = 'door'
        else if (gap <= 9.5 * T && row0 && row1) typ = 'door?' // niente simbolo, tra due pezzi dello stesso muro
        else typ = 'gap?' // niente simbolo: finestra se da' fuori, porta o varco se interno (deciso dopo le stanze)
        gaps.push({ axis, c, t, a0: b0, a1, type: typ, win: Math.round(wr * 100) / 100, arc: Math.round(arc * 1000) / 1000 })
      }
    }
  }
  // vuoti minuscoli tra pezzi dello stesso muro: chiusi (artefatti del disegno)
  for (const o of gaps.filter(o => o.a1 - o.a0 < 3.5 * T && (o.type === 'door?' || o.type === 'gap?'))) {
    gaps.splice(gaps.indexOf(o), 1); hv.push({ axis: o.axis, c: o.c, t: o.t, a0: o.a0 - 1, a1: o.a1 + 1 })
  }

  // 7. scala: porte (mediana 80 cm) > tramezzi (10 cm)
  const doorPx = gaps.filter(o => o.type === 'door').map(o => o.a1 - o.a0)
  const scaleDoors = doorPx.length >= 2 ? 0.8 / median(doorPx) : 0
  const scalePart = 0.1 / T
  let mpx = opts.mPerPx ? opts.mPerPx / up : (scaleDoors || scalePart)
  let scaleFrom: RawPlan['source']['scale_from'] = opts.mPerPx ? 'manuale' : scaleDoors ? 'porte' : 'tramezzi'

  // 8. giunti: estremi agganciati alla faccia lontana del muro perpendicolare vicino (L e T chiusi)
  const snap = Math.max(0.35 / mpx, 2.5 * T)
  for (const s of hv) for (const end of ['a0', 'a1'] as const) {
    const x = s[end]; let best: [number, Seg] | null = null
    for (const o of hv) {
      if (o.axis === s.axis) continue
      if (!(o.a0 - snap <= s.c && s.c <= o.a1 + snap)) continue
      const dd = Math.abs(o.c - x)
      if (dd <= snap && (!best || dd < best[0])) best = [dd, o]
    }
    if (best) {
      const o = best[1]
      s[end] = end === 'a0' ? o.c - o.t / 2 : o.c + o.t / 2
      for (const e2 of ['a0', 'a1'] as const) if (Math.abs(o[e2] - s.c) <= snap && !(o.a0 + 1 < s.c && s.c < o.a1 - 1)) o[e2] = e2 === 'a0' ? s.c - s.t / 2 : s.c + s.t / 2
    }
  }
  const walls = hv.filter(s => s.a1 - s.a0 > 0.5 * T)

  // 9. stanze: muri + aperture chiuse; il perimetro della casa si chiude anche col grigio delle finestre
  const rectOf = (s: { axis: 'h' | 'v'; c: number; t: number; a0: number; a1: number }): [number, number, number, number] =>
    s.axis === 'h' ? [s.a0, s.c - s.t / 2, s.a1, s.c + s.t / 2] : [s.c - s.t / 2, s.a0, s.c + s.t / 2, s.a1]
  const drawRect = (m: Mask, r: [number, number, number, number], grow = 0) => fillRect(m, W, H, Math.floor(r[0]) - grow, Math.floor(r[1]) - grow, Math.ceil(r[2]) - 1 + grow, Math.ceil(r[3]) - 1 + grow)
  const oblPoly = (s: Obl): Pt[] => {
    const [x0, y0] = s.p0, [x1, y1] = s.p1, L_ = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L_ * s.t / 2, ny = (x1 - x0) / L_ * s.t / 2
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]
  }
  const snapPoly = (p: Pt[]) => {
    for (let it = 0; it < 2; it++) for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]
      const an = Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI) % 180
      if (Math.min(an, 180 - an) < 6) { const y = (a[1] + b[1]) / 2; a[1] = b[1] = y } else if (Math.abs(an - 90) < 6) { const x = (a[0] + b[0]) / 2; a[0] = b[0] = x }
    }
    return p
  }
  type PxRoom = { id: number; px: number; c: Pt; poly: Pt[] }
  const segment = (gs: Gap[]) => {
    const bar = new Uint8Array(N)
    for (const s of walls) drawRect(bar, rectOf(s))
    for (const s of obl) fillPoly(bar, W, H, oblPoly(s))
    const wallbar = bar.slice()
    for (const o of gs) drawRect(bar, rectOf(o), 1)
    const free = new Uint8Array(N); for (let i = 0; i < N; i++) free[i] = bar[i] ? 0 : 1
    // fuori = raggiungibile dal bordo anche chiudendo i varchi fino a ~1,6 m (perimetro: muri + aperture + grigio delle finestre)
    const kc = Math.max(3, Math.floor(1.6 / mpx))
    const sealed = closeDisk(or(bar, winLine), W, H, kc) // qui anche il grigio vicino alle linee sottili (bovindi disegnati a doppia linea)
    const ff = new Uint8Array(N); for (let i = 0; i < N; i++) ff[i] = sealed[i] ? 0 : 1
    const outsideReach = reachFromBorder(ff, W, H)
    let inside: Mask = new Uint8Array(N); for (let i = 0; i < N; i++) inside[i] = free[i] && !outsideReach[i] && !win[i] ? 1 : 0
    inside = openBox(inside, W, H, 3, 3)
    // stanze unite da un varco non riconosciuto: semi erosi di ~75 cm e crescita dentro il pezzo
    const comp = components(inside, W, H, 4)
    const ke = Math.max(3, Math.floor(0.75 / mpx))
    const sc = components(erodeDisk(inside, W, H, ke), W, H, 8)
    const seedLab = new Int32Array(N), lab = new Int32Array(N)
    {
      const okSeed = sc.area.map(a => a * mpx * mpx > 0.3) // semi validi (> 0,3 m2) per ogni pezzo di casa
      const seedsOf = new Map<number, Set<number>>()
      for (let i = 0; i < N; i++) if (comp.lab[i] && sc.lab[i] && okSeed[sc.lab[i]]) { let s = seedsOf.get(comp.lab[i]); if (!s) seedsOf.set(comp.lab[i], s = new Set()); s.add(sc.lab[i]) }
      let nid = 1
      const compId = new Int32Array(comp.n), seedId = new Int32Array(sc.n)
      for (let ci = 1; ci < comp.n; ci++) {
        const ids = seedsOf.get(ci)
        if (!ids || ids.size <= 1) { compId[ci] = nid++; continue }
        for (const s of ids) seedId[s] = nid++
      }
      for (let i = 0; i < N; i++) if (comp.lab[i]) { if (compId[comp.lab[i]]) lab[i] = compId[comp.lab[i]]; else if (sc.lab[i] && seedId[sc.lab[i]]) seedLab[i] = seedId[sc.lab[i]] }
      const multi = new Uint8Array(N); for (let i = 0; i < N; i++) multi[i] = comp.lab[i] && !compId[comp.lab[i]] ? 1 : 0
      const grown = growSeeds(multi, seedLab, W, H)
      for (let i = 0; i < N; i++) if (multi[i] && grown[i]) lab[i] = grown[i]
    }
    let nLab = 0; for (let i = 0; i < N; i++) if (lab[i] > nLab) nLab = lab[i]
    const areaOf = new Int32Array(nLab + 1), sx = new Float64Array(nLab + 1), sy = new Float64Array(nLab + 1)
    for (let i = 0; i < N; i++) { const l = lab[i]; if (l) { areaOf[l]++; sx[l] += i % W; sy[l] += Math.floor(i / W) } }
    const minArea = 1 / (mpx * mpx)
    const rooms: PxRoom[] = [], roomLab = new Int32Array(N), relabel = new Int32Array(nLab + 1)
    for (let l = 1; l <= nLab; l++) {
      if (areaOf[l] < minArea) continue
      const rid = rooms.length + 1; relabel[l] = rid
      const cont = traceContour(lab, l, W, H).map(([x, y]) => [x + 0.5, y + 0.5] as Pt)
      rooms.push({ id: rid, px: areaOf[l], c: [sx[l] / areaOf[l], sy[l] / areaOf[l]], poly: snapPoly(simplifyRing(cont, 0.4 * T).map(p => [p[0], p[1]] as Pt)) })
    }
    for (let i = 0; i < N; i++) if (lab[i]) roomLab[i] = relabel[lab[i]]
    const outsideMask = new Uint8Array(N); for (let i = 0; i < N; i++) outsideMask[i] = free[i] && !inside[i] ? 1 : 0
    return { inside, wallbar, roomLab, rooms, outsideMask }
  }
  // stanze ai due lati di un'apertura (-1 = fuori, 0 = muro o niente): conta i pixel in una fascia di 90 cm per lato,
  // sul tratto centrale dell'apertura (un solo punto finiva su un moncone di muro o attraversava il muro esterno).
  // Lo spazio libero che non e' una stanza (fuori, rientranze chiuse dal contorno, ripostigli < 1 m2) vale come fuori.
  const sideRooms = (o: Gap, sg: ReturnType<typeof segment>) => {
    const out: number[] = [], L_ = o.a1 - o.a0, st = Math.max(1, Math.round(T / 4))
    for (const s of [-1, 1]) {
      const cnt = new Map<number, number>()
      let tot = 0, outs = 0
      for (let d = o.t / 2 + 2; d <= o.t / 2 + 0.9 / mpx; d += st) for (let a = o.a0 + 0.2 * L_; a <= o.a1 - 0.2 * L_; a += st) {
        const x = Math.floor(o.axis === 'h' ? a : o.c + s * d), y = Math.floor(o.axis === 'h' ? o.c + s * d : a)
        tot++
        if (x < 0 || y < 0 || x >= W || y >= H) { outs++; continue }
        const i = y * W + x, r = sg.roomLab[i]
        if (r) cnt.set(r, (cnt.get(r) ?? 0) + 1); else if (!sg.wallbar[i]) outs++
      }
      let best = 0, bc = 0
      for (const [r, c] of cnt) if (c > bc) { bc = c; best = r }
      out.push(tot && bc >= 0.25 * tot && bc >= outs ? best : tot && outs >= 0.25 * tot ? -1 : 0)
    }
    return out
  }
  // decide il tipo di ogni apertura dai lati; 'drop' = non e' un'apertura, 'wall' = in realta' e' un muro
  const classify = (sg: ReturnType<typeof segment>) => gaps.map(o => {
    const rooms = sideRooms(o, sg), wm = (o.a1 - o.a0) * mpx
    const outside = rooms.includes(-1), nr = rooms.filter(r => r > 0)
    const interior = nr.length === 2 && nr[0] !== nr[1], facade = outside && nr.length === 1
    let type: OpType | 'drop' | 'wall', ok = true
    if (o.type === 'window') {
      // grigio tra due stanze: quasi sempre un tramezzo sottile disegnato grigio (antialias), non una finestra interna
      if (interior) type = o.blob ? 'drop' : 'wall'
      else if (facade) { type = 'window'; ok = wm >= 0.5 && wm <= 2.6 }
      else { type = nr.length ? 'window' : 'drop'; ok = false }
    } else if (o.type === 'gap?' || o.type === 'door?') {
      // interruzione senza simbolo: sul perimetro e' una finestra, dentro una porta o un varco
      if (facade) { type = wm >= 0.5 && wm <= 2.6 ? 'window' : 'drop' }
      else if (interior) type = wm <= 1.0 ? (wm >= 0.55 ? 'door' : 'drop') : wm <= 2.4 ? 'varco' : 'drop'
      else type = 'drop'
      ok = o.type === 'door?' && type === 'door' // senza simbolo: da guardare (tranne la porta tra due pezzi di muro)
    } else {
      // porta con l'arco: verso fuori e' l'ingresso
      if (facade) { type = 'entrance'; ok = wm >= 0.8 && wm <= 1.25 }
      else { type = wm > 1.0 ? 'varco' : 'door'; ok = type === 'door' ? wm >= 0.6 && wm <= 1.0 : wm <= 2.4; if (!interior) ok = false }
    }
    return { o, type, rooms, ok }
  })
  // finestre grigie non trovate lungo le linee dei muri (muro esterno spostato o assottigliato alla finestra):
  // ogni macchia grigia allungata e diritta diventa una finestra, se non ce n'e' gia' una li'
  {
    const cc = components(win, W, H, 8)
    const bb = Array.from({ length: cc.n }, () => [W, H, -1, -1])
    for (let i = 0; i < N; i++) { const l = cc.lab[i]; if (!l) continue; const x = i % W, y = (i - x) / W, b = bb[l]; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y }
    for (let l = 1; l < cc.n; l++) {
      const [x0, y0, x1, y1] = bb[l], bw = x1 - x0 + 1, bh = y1 - y0 + 1
      const axis: 'h' | 'v' = bw >= bh ? 'h' : 'v', len = Math.max(bw, bh), thk = Math.min(bw, bh)
      if (len < 2.5 * thk || len < 4 * T || len > 40 * T || cc.area[l] < 0.6 * bw * bh) continue // diritta e piena, non diagonale
      const c = axis === 'h' ? (y0 + y1 + 1) / 2 : (x0 + x1 + 1) / 2, a0 = axis === 'h' ? x0 : y0, a1 = axis === 'h' ? x1 + 1 : y1 + 1
      if (gaps.some(o => o.axis === axis && Math.abs(o.c - c) < Math.max(o.t, thk) && Math.min(o.a1, a1) - Math.max(o.a0, a0) > 0.3 * (a1 - a0))) continue
      // spessore e linea del muro vicino sulla stessa direzione, se c'e'
      const near = walls.filter(s => s.axis === axis && Math.abs(s.c - c) < Math.max(s.t, thk) && (Math.abs(s.a1 - a0) < 3 * T || Math.abs(s.a0 - a1) < 3 * T))
      const t = near.length ? Math.max(...near.map(s => s.t)) : tclass(Math.max(thk, T))
      gaps.push({ axis, c: near.length ? near[0].c : c, t, a0, a1, type: 'window', win: 1, arc: 0, blob: true })
    }
  }
  let sg = segment(gaps)
  let dec = classify(sg)
  if (process.env.CASA3D_DEBUG) for (const d of dec) console.log(d.o.axis, Math.round(d.o.c), Math.round(d.o.a0), Math.round(d.o.a1), 't', Math.round(d.o.t), d.o.type, '->', d.type, d.rooms.join(','), 'w', Math.round((d.o.a1 - d.o.a0) * mpx * 100) / 100, 'win', d.o.win)
  if (dec.some(d => d.type === 'drop' || d.type === 'wall')) {
    // seconda passata senza le aperture finte (e con i muri grigi chiusi)
    for (const d of dec) if (d.type === 'wall') walls.push({ axis: d.o.axis, c: d.o.c, t: tclass(d.o.t), a0: d.o.a0 - 1, a1: d.o.a1 + 1 })
    gaps.splice(0, gaps.length, ...dec.filter(d => d.type !== 'drop' && d.type !== 'wall').map(d => d.o))
    sg = segment(gaps)
    dec = classify(sg).filter(d => d.type !== 'drop' && d.type !== 'wall')
  }
  const { inside, wallbar, rooms } = sg

  // scala dai mq: nota (netta, opzione) oppure confronto coi mq commerciali dell'annuncio (netta x ~1,2)
  const pxTot = rooms.reduce((a, r) => a + r.px, 0)
  let scaleNote: string | undefined
  if (opts.areaM2 && pxTot && !opts.mPerPx) {
    const net = pxTot * mpx * mpx, comm = net * 1.2
    const diff = Math.abs(comm - opts.areaM2) / opts.areaM2
    // oltre il 50% i mq dell'annuncio sono di solito di tutta la casa (piu' piani, giardino): si tiene la scala delle porte
    if (diff >= 0.5) scaleNote = `mq dell'annuncio molto diversi (${Math.round(comm)} contro ${Math.round(opts.areaM2)} m2 commerciali): tengo la scala ${scaleFrom === 'porte' ? 'delle porte' : 'dei tramezzi'}`
    else if (diff > 0.15) {
      const before = mpx
      mpx = Math.sqrt(opts.areaM2 / 1.2 / pxTot)
      scaleNote = `scala ${scaleFrom === 'porte' ? 'dalle porte' : 'dai tramezzi'} lontana dai mq dell'annuncio (${Math.round(comm)} contro ${Math.round(opts.areaM2)} m2 commerciali, ${Math.round(diff * 100)}%): uso i mq (${(before * up).toFixed(5)} -> ${(mpx * up).toFixed(5)} m/px)`
      scaleFrom = 'mq'
    }
  }
  // misure plausibili? porta mediana fuori 60-110 cm, stanze vere (>= 2 m2) in media sotto 6 m2 o casa sotto 25 m2 = scala
  // sbagliata (provato sulle 5 piante: nessun falso allarme; la catastale di Il Mulino, 39 m2 con 9 stanze, scatta)
  // (catastali tratteggiate o porte senza arco). Con i mq dell'immobile si prova a riscalare (solo se le porte tornano
  // tra 60 e 120 cm: se no i mq sono di tutta la casa); altrimenti l'agente scrive i mq (avviso nella correzione).
  let scaleWarn = false
  {
    const doorsPx = dec.filter(d => d.type === 'door').map(d => d.o.a1 - d.o.a0)
    const areas = rooms.map(r => r.px * mpx * mpx), net = areas.reduce((a, b) => a + b, 0)
    const real = areas.filter(a => a >= 2), mean = real.length ? real.reduce((a, b) => a + b, 0) / real.length : 0
    const odd = (dm: number, k: number) => (doorsPx.length >= 2 && (dm * k < 0.6 || dm * k > 1.1)) || mean * k * k < 6 || net * k * k < 25
    const dm = median(doorsPx) * mpx
    if (rooms.length && scaleFrom !== 'mq' && !opts.mPerPx && odd(dm, 1)) {
      const k = opts.areaM2 ? Math.sqrt(opts.areaM2 / 1.2 / net) : 0
      // e la correzione non deve essere enorme (oltre 2x i lati, 4x l'area, i mq sono di tutta la casa su piu' piani)
      if (k && k <= 2 && (doorsPx.length < 2 || (dm * k >= 0.6 && dm * k <= 1.2))) {
        mpx *= k; scaleFrom = 'mq'
        scaleNote = `misure poco plausibili (${Math.round(net)} m2 netti): uso i mq dell'immobile`
      } else scaleWarn = true
    }
  }
  const openings: Gap[] = dec.map(({ o, type, rooms: rs, ok }) => ({ ...o, type: type as OpType, rooms: rs, width: Math.round((o.a1 - o.a0) * mpx * 100) / 100, suspect: !ok || (o.arc === 0 && type !== 'window' && o.type !== 'door?') }))

  // 10. uscita in metri, origine al centro della casa
  let bx0 = W, by0 = H, bx1 = 0, by1 = 0
  for (let i = 0; i < N; i++) if (inside[i] || wallbar[i]) { const x = i % W, y = (i - x) / W; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y }
  const OX = (bx0 + bx1) / 2, OY = (by0 + by1) / 2
  const r3 = (v: number) => Math.round(v * 1000) / 1000
  const P = (x: number, y: number): Pt => [r3((x - OX) * mpx), r3((y - OY) * mpx)]
  const segEnds = (s: { axis: 'h' | 'v'; c: number; a0: number; a1: number }): [Pt, Pt] => s.axis === 'h' ? [P(s.a0, s.c), P(s.a1, s.c)] : [P(s.c, s.a0), P(s.c, s.a1)]
  const wallsOut: RawWall[] = [
    ...walls.map((s, i) => { const [a, b] = segEnds(s); return { a, b, t: r3(s.t * mpx), label: `W${i + 1}` } }),
    ...obl.map((s, i) => ({ a: P(...s.p0), b: P(...s.p1), t: r3(s.t * mpx), label: `W${walls.length + i + 1}` })),
  ]
  const PRE: Record<string, string> = { door: 'P', entrance: 'I', varco: 'V', window: 'F' }
  const opsOut: RawOpening[] = openings.map((o, i) => { const [a, b] = segEnds(o); return { type: o.type as OpType, a, b, t: r3(o.t * mpx), width: o.width!, rooms: o.rooms!, suspect: !!o.suspect, label: `${PRE[o.type]}${i + 1}` } })
  const roomsOut: RawRoom[] = rooms.map(r => ({ id: r.id, area: Math.round(r.px * mpx * mpx * 10) / 10, center: P(...r.c), poly: r.poly.map(q => P(...q)), type: 'stanza' }))

  // metri -> pixel dell'immagine di partenza: (m / mpx + O) nella raddrizzata, inversa della rotazione, / up
  const det = R[0] * R[4] - R[1] * R[3]
  const i0 = R[4] / det, i1 = -R[1] / det, i3 = -R[3] / det, i4 = R[0] / det
  const rot = Math.abs(A) >= 0.02
  const I = rot ? [i0, i1, -(i0 * R[2] + i1 * R[5]), i3, i4, -(i3 * R[2] + i4 * R[5])] : [1, 0, 0, 0, 1, 0]
  // x_img = (I0 * (X/mpx + OX) + I1 * (Y/mpx + OY) + I2) / up
  const toImage: RawPlan['source']['toImage'] = [
    I[0] / mpx / up, I[3] / mpx / up, I[1] / mpx / up, I[4] / mpx / up,
    (I[0] * OX + I[1] * OY + I[2]) / up, (I[3] * OX + I[4] * OY + I[5]) / up,
  ]
  const plan: RawPlan = {
    version: 3, units: 'm', height: 2.7,
    source: {
      angle: A, m_per_px: mpx * up, scala_porte: scaleDoors * up, scala_tramezzi: scalePart * up, tramezzo_px: T, classi_spessore_m: classes.map(c => r3(c * mpx)),
      scale_from: scaleFrom, ...(scaleNote ? { scale_note: scaleNote } : {}), ...(scaleWarn ? { scale_warn: true } : {}), toImage, imgW: srcW, imgH: srcH,
    },
    walls: wallsOut, openings: opsOut, rooms: roomsOut,
  }
  const cnt = (t: string) => opsOut.filter(o => o.type === t).length
  const stats = {
    angolo: Math.round(A * 100) / 100, m_per_px: Math.round(mpx * up * 1e5) / 1e5, scala: scaleFrom, spessori_cm: classes.map(c => Math.round(c * mpx * 100)),
    muri: wallsOut.length, obliqui: obl.length, door: cnt('door'), entrance: cnt('entrance'), varco: cnt('varco'), window: cnt('window'),
    sospette: opsOut.filter(o => o.suspect).length, stanze: roomsOut.length, mq: Math.round(roomsOut.reduce((a, r) => a + r.area, 0) * 10) / 10,
  }
  return { plan, stats, ms: Date.now() - t0 }
}

export async function vectorizeImage(buf: Buffer, opts: VectorizeOpts = {}): Promise<VectorizeResult> {
  const { g, w, h, up, srcW, srcH } = await loadGray(buf)
  return vectorize(g, w, h, up, srcW, srcH, opts)
}
