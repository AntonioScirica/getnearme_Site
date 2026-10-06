// Scale lette dalla planimetria ORIGINALE (niente AI). Attorno a ogni vano scala (fino a 2 m: le scale esterne nel
// resede sono disegnate fuori dal "vano" che il riconoscimento ricava) si campiona l'inchiostro su una griglia in metri
// e si cercano le righe dei gradini: segmenti paralleli lunghi come la rampa (45-160 cm), a passo regolare (17-38 cm),
// almeno 4. Ne escono:
//  - axis/tread: asse lungo cui si sale e pedata misurata (guidano il visore anche per le scale interne);
//  - flight: il rettangolo della rampa disegnata, in metri sulla pianta;
//  - landing + up: il pianerottolo disegnato in cima (rettangolo chiuso oltre un capo della rampa, profondo almeno
//    60 cm) e il verso di salita, verso il pianerottolo. Senza pianerottolo si lascia decidere al visore.
// Le scale esterne si fanno dove sono disegnate (non nel "vano" ricavato), con il loro pianerottolo.
import sharp from 'sharp'
import { inPoly } from './build'
import type { RawPlan, StairHint } from './types'

const STEP = 0.02 // campionamento in metri
type Box = [number, number, number, number]

export async function readStairs(raw0: RawPlan, original: Buffer): Promise<RawPlan> {
  const raw: RawPlan = JSON.parse(JSON.stringify(raw0))
  const todo = raw.rooms.filter(r => r.type === 'scala' && !r.stair?.seen)
  if (!todo.length) return raw
  const { imgW: W, imgH: H } = raw.source
  const T = raw.source.toImage
  const { data } = await sharp(original).rotate().flatten({ background: '#ffffff' }).resize(W, H, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true })
  // inchiostro nel punto: il piu' scuro dei pixel vicini (le righe dei gradini sono sottili, 1-2 pixel)
  const ink = (x: number, z: number) => {
    const px = Math.round(T[0] * x + T[2] * z + T[4]), py = Math.round(T[1] * x + T[3] * z + T[5])
    let m = 255
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = px + dx, Y = py + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) m = Math.min(m, data[Y * W + X]) }
    return (255 - m) / 255
  }
  for (const r of todo) {
    const xs = r.poly.map(p => p[0]), zs = r.poly.map(p => p[1])
    const box: Box = [Math.min(...xs) - 2, Math.min(...zs) - 2, Math.max(...xs) + 2, Math.max(...zs) + 2]
    const f = findFlight(ink, box, r.poly)
    const hint: StairHint = { ...r.stair, seen: true }
    if (f) {
      if (hint.arrow && hint.axis && hint.axis !== f.axis) delete hint.arrow
      hint.axis = f.axis; hint.tread = f.tread
      // la rampa disegnata si usa cosi' com'e' solo se e' vicina al vano (scale esterne) o dentro (interne)
      hint.flight = f.flight; hint.treads = f.n
      if (f.landing) { hint.landing = f.landing; hint.up = f.up }
      // freccia letta sull'originale (salita): vince sul pianerottolo trovato, se e' sullo stesso asse
      if (hint.arrow && hint.axis === f.axis) hint.up = hint.arrow
    }
    r.stair = hint
  }
  return raw
}

// righe dei gradini e rampa: per ciascun asse, segmenti d'inchiostro perpendicolari all'asse
function findFlight(ink: (x: number, z: number) => number, box: Box, poly: [number, number][]) {
  const nx = Math.floor((box[2] - box[0]) / STEP), nz = Math.floor((box[3] - box[1]) / STEP)
  const g = new Uint8Array(nx * nz)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = ink(box[0] + (i + 0.5) * STEP, box[1] + (j + 0.5) * STEP) > 0.45 ? 1 : 0
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= nx || j >= nz ? 0 : g[j * nx + i])
  let best: { axis: 'x' | 'z'; lines: { a: number; p0: number; p1: number }[]; score: number } | null = null
  for (const axis of ['x', 'z'] as const) {
    // segmenti lungo il traverso (righe dei gradini) per ogni posizione lungo l'asse
    const NA = axis === 'x' ? nx : nz, NP = axis === 'x' ? nz : nx
    const v = (a: number, p: number) => (axis === 'x' ? at(a, p) : at(p, a))
    const runs: { a: number; p0: number; p1: number }[] = []
    for (let a = 0; a < NA; a++) {
      let s = -1, gap = 0
      for (let p = 0; p <= NP; p++) {
        const on = p < NP && (v(a, p) || v(a - 1, p) || v(a + 1, p))
        if (on) { if (s < 0) s = p; gap = 0 } else if (s >= 0 && ++gap > 4) {
          const L = (p - gap - s + 1) * STEP
          if (L >= 0.4 && L <= 1.6) runs.push({ a, p0: s, p1: p - gap })
          s = -1; gap = 0
        }
      }
    }
    // righe = segmenti vicini lungo l'asse (spessore del tratto) con lo stesso tratto di traverso
    const lines: { a: number; p0: number; p1: number; n: number }[] = []
    for (const q of runs) {
      const l = lines.find(m => Math.abs(m.a / m.n - q.a) <= 3 && Math.min(m.p1, q.p1) - Math.max(m.p0, q.p0) > 0.6 * (q.p1 - q.p0))
      if (l) { l.a += q.a; l.n++; l.p0 = Math.min(l.p0, q.p0); l.p1 = Math.max(l.p1, q.p1) } else lines.push({ ...q, n: 1 })
    }
    const L = lines.map(m => ({ a: m.a / m.n, p0: m.p0, p1: m.p1 })).sort((u, w) => u.a - w.a)
    // sequenze regolari: passo 17-38 cm, stesso traverso (sovrapposto almeno al 70%), almeno 4 righe
    for (let k = 0; k < L.length; k++) {
      // una riga persa nel disegno (tratto interrotto) vale come doppio passo: la pedata resta quella
      const seq = [L[k]]
      let step = 0, miss = 0
      for (let m = k + 1; m < L.length; m++) {
        const last = seq[seq.length - 1], d = (L[m].a - last.a) * STEP
        if (d < 0.17) continue
        if (d > (step ? 2.3 * step * STEP : 0.38)) break
        const ov = Math.min(seq[0].p1, L[m].p1) - Math.max(seq[0].p0, L[m].p0)
        if (ov < 0.7 * Math.min(seq[0].p1 - seq[0].p0, L[m].p1 - L[m].p0)) continue
        const k2 = step ? Math.round((L[m].a - last.a) / step) : 1
        if (step && (k2 < 1 || k2 > 2 || Math.abs(L[m].a - last.a - k2 * step) * STEP > 0.07)) continue
        if (!step && d > 0.38) continue
        if (k2 === 2) miss++
        seq.push(L[m])
        step = (L[m].a - seq[0].a) / (seq.length - 1 + miss)
      }
      if (seq.length + miss < 5 || miss > seq.length / 2) continue
      // vicino al vano: il centro della rampa entro 1,5 m dal poligono della stanza
      const ca = (seq[0].a + seq[seq.length - 1].a) / 2, cp = (seq[0].p0 + seq[0].p1) / 2
      const [cx, cz] = axis === 'x' ? [box[0] + ca * STEP, box[1] + cp * STEP] : [box[0] + cp * STEP, box[1] + ca * STEP]
      const inside = inPoly(cx, cz, poly)
      const score = seq.length + (inside ? 3 : 0)
      if (!best || score > best.score) best = { axis, lines: seq, score }
    }
  }
  if (!best) return null
  const { axis, lines } = best
  const A = (i: number) => (axis === 'x' ? box[0] : box[1]) + (i + 0.5) * STEP, P = (i: number) => (axis === 'x' ? box[1] : box[0]) + (i + 0.5) * STEP
  const a0 = A(lines[0].a), a1 = A(lines[lines.length - 1].a)
  const p0s = lines.map(l => l.p0).sort((u, w) => u - w), p1s = lines.map(l => l.p1).sort((u, w) => u - w)
  const p0 = P(p0s[p0s.length >> 1]), p1 = P(p1s[p1s.length >> 1])
  // pedata dal passo piu' frequente tra righe vicine (le righe perse contano doppio)
  const gaps = lines.slice(1).map((l, i) => l.a - lines[i].a).sort((u, w) => u - w), unit = gaps[0] ? gaps.filter(gp => gp < 1.5 * gaps[0]).reduce((u, w) => u + w, 0) / gaps.filter(gp => gp < 1.5 * gaps[0]).length : 1
  const nTreads = Math.max(1, Math.round((lines[lines.length - 1].a - lines[0].a) / unit))
  const tread = Math.round(((a1 - a0) / nTreads) * 100) / 100
  const xz = (a: number, p: number): [number, number] => (axis === 'x' ? [a, p] : [p, a])
  const flight: Box = axis === 'x' ? [a0, p0, a1, p1] : [p0, a0, p1, a1]
  // pianerottolo: oltre un capo, a 1/4 e 3/4 della larghezza (non sulla linea di risalita in mezzo), il primo inchiostro
  // trovato a una distanza simile (60 cm - 2,5 m) chiude un rettangolo; si prende il capo col pianerottolo piu' profondo
  const inkAt = (a: number, p: number) => { const [x, z] = xz(a, p); return ink(x, z) > 0.45 }
  const reach = (from: number, dir: number, p: number) => { for (let d = 0.06; d <= 2.5; d += STEP) if (inkAt(from + dir * d, p)) return d; return null }
  let landing: Box | null = null, up: 1 | -1 | undefined
  let bestD = 0
  for (const [end, dir] of [[a1, 1], [a0, -1]] as const) {
    const d1 = reach(end, dir, p0 + (p1 - p0) * 0.25), d2 = reach(end, dir, p0 + (p1 - p0) * 0.75)
    if (d1 === null || d2 === null || Math.abs(d1 - d2) > 0.15) continue
    const d = Math.min(d1, d2)
    if (d < 0.6 || d <= bestD) continue
    // lati del pianerottolo: dal suo centro verso i due lati del traverso
    const am = end + dir * d / 2, pm = (p0 + p1) / 2
    const side = (s: number) => { for (let k = 0.1; k <= 2; k += STEP) if (inkAt(am, pm + s * k)) return pm + s * k; return s < 0 ? p0 : p1 }
    const q0 = Math.min(p0, side(-1)), q1 = Math.max(p1, side(1)), e0 = Math.min(end, end + dir * d), e1 = Math.max(end, end + dir * d)
    const [x0, z0] = xz(e0, q0), [x1, z1] = xz(e1, q1)
    landing = [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]
    up = dir as 1 | -1; bestD = d
  }
  const r2 = (b: Box) => b.map(v => Math.round(v * 1000) / 1000) as Box
  return { axis, tread, n: nTreads, flight: r2(flight), ...(landing ? { landing: r2(landing), up } : {}) }
}
