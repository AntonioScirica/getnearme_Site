// Scale lette dalla planimetria ORIGINALE (niente AI): la geometria della scala viene dal DISEGNO. Nel riquadro della
// scala letto da Gemini (hint.box, metri) o attorno al vano si campiona l'inchiostro su una griglia in metri e si cercano:
//  - rampe dritte: righe sottili parallele lunghe come la rampa (40-160 cm), a passo regolare (17-38 cm), almeno 3
//    (4 senza riquadro letto); il filo di un muro a un passo dall'ultima riga chiude la rampa (primo gradino dalla porta);
//  - gradini a ventaglio: almeno 4 righe sottili che convergono verso un perno, a 6-50 gradi l'una dall'altra (scale a
//    chiocciola o con la svolta a gradini);
//  - pianerottolo: rettangolo chiuso oltre un capo libero di una rampa, profondo almeno 60 cm.
// I pezzi si legano capo a capo (scale a L o a U con la svolta a ventaglio) e si ordinano dall'ingresso, il capo al piano
// della pianta: l'altro capo e' quello col pianerottolo; se non c'e', l'ingresso e' il capo verso la stanza di partenza
// letta (cucina -> cantina) o verso una porta. Niente trovato nel disegno: gradini dentro il riquadro letto (guess).
import sharp from 'sharp'
import { inPoly, polyDist } from './build'
import type { Pt, RawPlan, RawRoom, StairHint, StairPiece } from './types'

const STEP = 0.02 // campionamento in metri
type Box = [number, number, number, number]
type Grid = { x0: number; z0: number; nx: number; nz: number; g: Uint8Array }
type Run = { axis: 'x' | 'z'; lines: number[]; p0: number; p1: number; n: number }
type Fan = { c: Pt; rays: { a: number; r0: number; r1: number }[]; box: Box }
// svolta a gradini tra due rampe ad angolo: spicchi gia' fatti, capi = righe d'arrivo delle due rampe
type Turn = { wedges: Pt[][]; ends: [[Pt, Pt], [Pt, Pt]] }
type Piece = { run?: Run; fan?: Fan; turn?: Turn; box: Box; n: number }
// capo di un pezzo: segmento (da, a) dove si entra o si esce
type End = { piece: number; side: 0 | 1; a: Pt; b: Pt; m: Pt }

const r3 = (v: number) => Math.round(v * 1000) / 1000
const grow = (b: Box, d: number): Box => [b[0] - d, b[1] - d, b[2] + d, b[3] + d]
const bboxOf = (P: Pt[]): Box => { const xs = P.map(q => q[0]), zs = P.map(q => q[1]); return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] }
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))
const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1])
const xzOf = (axis: 'x' | 'z', a: number, p: number): Pt => (axis === 'x' ? [a, p] : [p, a])

// opt.drop: scala senza gradini nel disegno ne' riquadro letto (vano chiamato scala dal riconoscimento) = non e' una scala
export async function readStairs(raw0: RawPlan, original: Buffer, opt: { drop?: boolean } = {}): Promise<RawPlan> {
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
  // un riquadro letto va a una sola scala (quella che lo copre di piu')
  const used = new Set<string>()
  for (const r of todo) {
    const hint: StairHint = { ...r.stair, seen: true }
    for (const k of ['path', 'flight', 'treads', 'landing', 'up', 'tread', 'guess'] as const) delete hint[k]
    const key = hint.box ? hint.box.join(',') : ''
    const box = hint.box && !used.has(key) ? hint.box : undefined
    if (box) used.add(key)
    // lettura fatta e nessuna scala letta qui (o gia' data a un altro vano): vano chiamato scala dal riconoscimento, e'
    // un passaggio
    if (!box && opt.drop && raw.read) { r.type = 'corridoio'; delete r.stair; continue }
    const S = box ? grow(box, 0.25) : grow(bboxOf(r.poly), hint.outdoor ? 1.5 : 0.4)
    const res = drawnStair(ink, S, { minLines: box ? 3 : 4, raw })
    let path: StairPiece[] | null = null
    if (res) path = orderPath(raw, r, hint, res.pieces, res.landing)
    else if (box) {
      // gradini non riconosciuti: nella zona disegnata a gradini del riquadro letto, a ventaglio se le righe sono di
      // sbieco e convergono (scala a chiocciola disegnata a mano), se no una rampa dritta
      const zone = denseBox(ink, box) ?? box
      path = guessFan(raw, r, hint, ink, zone) ?? guessPath(raw, r, hint, zone); hint.guess = true
    }
    if (!path) { r.stair = hint; continue }
    hint.path = path
    // campi di prima (visori vecchi, etichetta): rettangolo di tutta la scala, gradini contati, prima rampa
    const runs = path.filter(p => p.k === 'run') as Extract<StairPiece, { k: 'run' }>[]
    hint.flight = bboxOf(path.flatMap(p => [[p.box[0], p.box[1]], [p.box[2], p.box[3]]] as Pt[])).map(r3) as Box
    hint.treads = path.reduce((s, p) => s + (p.k === 'land' ? 0 : p.n), 0)
    if (runs[0]) { hint.axis = runs[0].axis; const L = runs[0].axis === 'x' ? runs[0].box[2] - runs[0].box[0] : runs[0].box[3] - runs[0].box[1]; hint.tread = Math.round(L / runs[0].n * 100) / 100 }
    const land = path.find(p => p.k === 'land')
    if (land) hint.landing = land.box
    r.stair = hint
  }
  return raw
}

// --- lettura del disegno ---

function gridOf(ink: (x: number, z: number) => number, S: Box): Grid {
  const nx = Math.max(1, Math.floor((S[2] - S[0]) / STEP)), nz = Math.max(1, Math.floor((S[3] - S[1]) / STEP))
  const g = new Uint8Array(nx * nz)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = ink(S[0] + (i + 0.5) * STEP, S[1] + (j + 0.5) * STEP) > 0.45 ? 1 : 0
  return { x0: S[0], z0: S[1], nx, nz, g }
}
const cell = (G: Grid, i: number, j: number) => (i < 0 || j < 0 || i >= G.nx || j >= G.nz ? 0 : G.g[j * G.nx + i])
const at = (G: Grid, x: number, z: number) => cell(G, Math.floor((x - G.x0) / STEP), Math.floor((z - G.z0) / STEP))

function drawnStair(ink: (x: number, z: number) => number, S: Box, o: { minLines: number; raw: RawPlan }) {
  const G = gridOf(ink, S)
  const runs = findRuns(G, o.minLines, ink)
  for (const r of runs) { const b = trimToWalls(o.raw, runBox(G, r), r.axis); if (r.axis === 'x') { r.p0 = b[1]; r.p1 = b[3] } else { r.p0 = b[0]; r.p1 = b[2] } }
  // svolte tra due rampe ad angolo (scale a L con i gradini a ventaglio nell'angolo)
  let turns: Piece[] = []
  for (const A of runs) for (const B of runs) if (A.axis === 'x' && B.axis === 'z') { const t = cornerTurn(G, A, B); if (t) turns.push({ ...t, n: t.n, box: t.box, run: undefined, fan: undefined, ...{ pair: [A, B] } } as Piece) }
  // una svolta per rampa: quella tra le rampe piu' lunghe; le rampette dentro una svolta sono righe del ventaglio
  turns.sort((u, w) => pairSteps(w) - pairSteps(u))
  const usedR = new Set<Run>()
  turns = turns.filter(t => { const [A, B] = (t as Piece & { pair: [Run, Run] }).pair; if (usedR.has(A) || usedR.has(B)) return false; usedR.add(A); usedR.add(B); return true })
  for (let i = runs.length - 1; i >= 0; i--) if (!usedR.has(runs[i]) && runs[i].n <= 2 && turns.some(t => overlap(t.box, runBox(G, runs[i])) > 0.3 * area(runBox(G, runs[i])))) runs.splice(i, 1)
  const near = (b: Box) => [...runs.map(r => runBox(G, r)), ...turns.map(t => t.box)].some(q => overlap(q, b) > 0.3 * Math.min(area(b), area(q)))
  const fans = findFans(G).filter(f => !near(f.box))
  const pieces: Piece[] = [...runs.map(r => ({ run: r, box: runBox(G, r), n: r.n })), ...turns, ...fans.map(f => ({ fan: f, box: f.box, n: f.rays.length - 1 }))]
  if (!pieces.length) return null
  // pezzi legati capo a capo: si tiene la catena con piu' gradini
  const chain = chainOf(G, pieces)
  const kept = chain.order.map(i => pieces[i])
  // pianerottolo oltre un capo libero di una rampa
  let landing: { box: Box; end: 0 | 1 } | null = null, bestD = 0
  for (const e of [0, 1] as const) {
    const ce = chain.free[e]
    const pc = ce ? pieces[ce.piece] : null
    if (!pc?.run) continue
    const l = landingAt(G, pc.run, ce!.side)
    if (l && l.d > bestD) { landing = { box: l.box, end: e }; bestD = l.d }
  }
  return { pieces: kept, chain, landing, G }
}

// righe dei gradini per ciascun asse e sequenze regolari (rampe)
function findRuns(G: Grid, minLines: number, ink: (x: number, z: number) => number): Run[] {
  const out: (Run & { score: number })[] = []
  for (const axis of ['x', 'z'] as const) {
    const NA = axis === 'x' ? G.nx : G.nz, NP = axis === 'x' ? G.nz : G.nx
    const v = (a: number, p: number) => (axis === 'x' ? cell(G, a, p) : cell(G, p, a))
    const segs: { a: number; p0: number; p1: number }[] = []
    for (let a = 0; a < NA; a++) {
      let s = -1, gap = 0
      for (let p = 0; p <= NP; p++) {
        const on = p < NP && v(a, p)
        if (on) { if (s < 0) s = p; gap = 0 } else if (s >= 0 && ++gap > 4) {
          const L = (p - gap - s + 1) * STEP
          // un tratto che arriva al bordo della zona continua fuori (filo di un muro), non e' un gradino
          if (L >= 0.4 && L <= 1.6 && s > 1 && p - gap < NP - 2) segs.push({ a, p0: s, p1: p - gap })
          s = -1; gap = 0
        }
      }
    }
    // righe = segmenti su posizioni vicine (spessore del tratto) con lo stesso tratto di traverso; i tratti spessi (muri) no
    const lines: { a0: number; a1: number; sa: number; n: number; p0: number; p1: number }[] = []
    for (const q of segs) {
      const l = lines.find(m => q.a - m.a1 <= 1 && q.a >= m.a0 && Math.min(m.p1, q.p1) - Math.max(m.p0, q.p0) > 0.6 * (q.p1 - q.p0))
      if (l) { l.a1 = q.a; l.sa += q.a; l.n++; l.p0 = Math.min(l.p0, q.p0); l.p1 = Math.max(l.p1, q.p1) } else lines.push({ a0: q.a, a1: q.a, sa: q.a, n: 1, p0: q.p0, p1: q.p1 })
    }
    const L = lines.filter(m => (m.a1 - m.a0 + 1) * STEP <= 0.1).map(m => ({ a: m.sa / m.n, p0: m.p0, p1: m.p1 })).sort((u, w) => u.a - w.a)
    for (let k = 0; k < L.length; k++) {
      // una riga persa nel disegno (tratto interrotto) vale come doppio passo: la pedata resta quella
      const seq = [L[k]]
      let step = 0, miss = 0
      for (let m = k + 1; m < L.length; m++) {
        const last = seq[seq.length - 1], d = (L[m].a - last.a) * STEP
        if (d < 0.15) continue
        if (d > (step ? 2.3 * step * STEP : 0.38)) break
        const ov = Math.min(seq[0].p1, L[m].p1) - Math.max(seq[0].p0, L[m].p0)
        if (ov < 0.7 * Math.min(seq[0].p1 - seq[0].p0, L[m].p1 - L[m].p0)) continue
        const k2 = step ? Math.round((L[m].a - last.a) / step) : 1
        if (step && (k2 < 1 || k2 > 2 || Math.abs(L[m].a - last.a - k2 * step) * STEP > 0.06)) continue
        if (k2 === 2) miss++
        seq.push(L[m])
        step = (L[m].a - seq[0].a) / (seq.length - 1 + miss)
      }
      if (seq.length + miss < 3 || miss > seq.length / 2) continue
      // seme trovato (fascia della rampa e passo): si rilegge la fascia riga per riga. Riga = inchiostro su almeno il 70%
      // della larghezza; si allarga dal seme a passo regolare (una riga persa al massimo); una riga che prosegue oltre la
      // fascia da tutti e due i lati (filo di un muro) chiude la rampa e ci si ferma
      const ps0 = seq.map(l => l.p0).sort((u, w) => u - w), ps1 = seq.map(l => l.p1).sort((u, w) => u - w)
      let p0 = ps0[ps0.length >> 1], p1 = ps1[ps1.length >> 1]
      const cov = (a: number) => { let c = 0; for (let p = p0; p <= p1; p++) if (v(a, p) || v(a - 1, p) || v(a + 1, p)) c++; return c / (p1 - p0 + 1) }
      const prof = Array.from({ length: NA }, (_, a) => cov(a))
      const peaks: number[] = []
      for (let a = 0; a < NA; a++) { if (prof[a] < 0.65) continue; let e = a; while (e + 1 < NA && prof[e + 1] >= 0.65) e++; if ((e - a + 1) * STEP <= 0.16) peaks.push((a + e) / 2); a = e }
      const A0 = axis === 'x' ? G.x0 : G.z0, P0 = axis === 'x' ? G.z0 : G.x0
      const beyond = (a: number) => {
        const am = A0 + (a + 0.5) * STEP
        const side = (q0: number, q1: number) => { let c = 0, k = 0; for (let q = q0; q <= q1; q += STEP) { k++; const [x, z] = xzOf(axis, am, q); if ([-STEP, 0, STEP].some(da => { const [x2, z2] = xzOf(axis, am + da, q); return ink(x2, z2) > 0.45 })) c++; void x; void z } return k ? c / k : 0 }
        const e0 = P0 + (p0 + 0.5) * STEP, e1 = P0 + (p1 + 0.5) * STEP
        return side(e0 - 0.3, e0 - 0.06) >= 0.8 && side(e1 + 0.06, e1 + 0.3) >= 0.8
      }
      const seed = seq[seq.length >> 1].a
      const ci = peaks.reduce((b, q, i) => (Math.abs(q - seed) < Math.abs(peaks[b] - seed) ? i : b), 0)
      if (!peaks.length || Math.abs(peaks[ci] - seed) > 3) continue
      const lines = [peaks[ci]]
      // passo: la riga vicina piu' prossima tra 15 e 40 cm (il passo del seme puo' essere sbagliato)
      const near = peaks.map(q => Math.abs(q - peaks[ci])).filter(d => d * STEP >= 0.15 && d * STEP <= 0.4).sort((u, w) => u - w)
      const st = near[0] ?? step
      let lost = 0
      for (const dir of [1, -1]) {
        let cur = peaks[ci]
        for (;;) {
          const cand = peaks.filter(q => (q - cur) * dir > 0).map(q => ({ q, d: Math.abs(q - cur) })).filter(o => Math.abs(o.d - st) <= 0.22 * st || (!lost && Math.abs(o.d - 2 * st) <= 0.22 * st)).sort((u, w) => u.d - w.d)[0]
          if (!cand) break
          if (cand.d > 1.5 * st) lost++
          if (dir > 0) lines.push(cand.q); else lines.unshift(cand.q)
          cur = cand.q
          if (beyond(cand.q) && lines.length > 2) break // filo di muro: chiude
        }
      }
      const n = lines.length - 1 + lost
      // larghezza vera: dal centro verso i lati finche' le righe hanno inchiostro (il tratto non si attacca al muro accanto)
      const onAll = (p: number) => lines.filter(a => v(Math.round(a), p) || v(Math.round(a) - 1, p) || v(Math.round(a) + 1, p)).length / lines.length
      const pc = Math.round((p0 + p1) / 2)
      let q0 = pc, q1 = pc
      // (anche oltre la fascia del seme, fino a 50 cm: righe spezzate dalla linea di passaggio o da un segno)
      while (q0 > Math.max(0, p0 - 25) && (onAll(q0 - 1) >= 0.5 || onAll(q0 - 2) >= 0.5)) q0--
      while (q1 < Math.min(NP - 1, p1 + 25) && (onAll(q1 + 1) >= 0.5 || onAll(q1 + 2) >= 0.5)) q1++
      if ((q1 - q0) * STEP >= 0.4) { p0 = q0; p1 = q1 }
      if (n + 1 < minLines) continue
      out.push({ axis, lines: lines.map(x => (axis === 'x' ? G.x0 : G.z0) + (x + 0.5) * STEP), p0: (axis === 'x' ? G.z0 : G.x0) + (p0 + 0.5) * STEP, p1: (axis === 'x' ? G.z0 : G.x0) + (p1 + 0.5) * STEP, n, score: lines.length })
    }
  }
  // le migliori, senza sovrapporsi
  out.sort((u, w) => w.score - u.score || w.n - u.n)
  const kept: Run[] = []
  for (const r of out) {
    const b = runBox(G, r)
    if (kept.some(k => overlap(runBox(G, k), b) > 0.25 * Math.min(area(b), area(runBox(G, k))))) continue
    kept.push(r)
    if (kept.length >= 3) break
  }
  return kept
}
function runBox(_G: Grid, r: Run): Box {
  const a0 = r.lines[0], a1 = r.lines[r.lines.length - 1]
  return r.axis === 'x' ? [a0, r.p0, a1, r.p1] : [r.p0, a0, r.p1, a1]
}

// gradini a ventaglio. 1) tratti sottili dritti nel disegno (Hough sulla griglia: per ogni direzione la retta con piu'
// inchiostro, poi il tratto continuo piu' lungo su quella retta, 30-160 cm; tratto preso = cancellato, si ripete);
// 2) un perno dove convergono almeno 4 tratti (le loro rette passano a meno di 10 cm, il capo vicino entro 45 cm), a
// 6-50 gradi l'uno dall'altro, almeno 3 di sbieco (i muri vanno lungo gli assi), carta bianca tra un tratto e l'altro
type Seg = { a: Pt; b: Pt; len: number; ang: number }
function thinSegments(G: Grid): Seg[] {
  const { nx, nz } = G
  const live = new Uint8Array(G.g)
  // via le macchie (muri pieni, scritte spesse): cella con inchiostro su piu' dell'80% dei 7x7 attorno
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!G.g[j * nx + i]) continue
    let c = 0, k = 0
    for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { k++; c += cell(G, i + di, j + dj) }
    if (c / k > 0.8) live[j * nx + i] = 0
  }
  const NT = 90, R = Math.ceil(Math.hypot(nx, nz)), segs: Seg[] = []
  const cs = Array.from({ length: NT }, (_, t) => Math.cos((t * Math.PI) / NT)), sn = Array.from({ length: NT }, (_, t) => Math.sin((t * Math.PI) / NT))
  for (let it = 0; it < 40; it++) {
    const acc = new Int32Array(NT * (2 * R + 1))
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (live[j * nx + i]) for (let t = 0; t < NT; t++) acc[t * (2 * R + 1) + Math.round(i * cs[t] + j * sn[t]) + R]++
    let bi = 0; for (let k = 1; k < acc.length; k++) if (acc[k] > acc[bi]) bi = k
    if (acc[bi] < 0.3 / STEP) break
    const t = Math.floor(bi / (2 * R + 1)), rho = (bi % (2 * R + 1)) - R
    // punti della retta, il tratto continuo piu' lungo (buchi fino a 3 celle)
    const dx = -sn[t], dz = cs[t], x0 = rho * cs[t], z0 = rho * sn[t]
    let best: [number, number] | null = null, s0 = -1e9, last = -1e9
    const hitAt = (u: number) => { const i = Math.round(x0 + dx * u), j = Math.round(z0 + dz * u); for (let d = -1; d <= 1; d++) { const ii = Math.round(i + cs[t] * d), jj = Math.round(j + sn[t] * d); if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && live[jj * nx + ii]) return true } return false }
    for (let u = -R; u <= R + 4; u++) {
      const on = u <= R && hitAt(u)
      if (on) { if (u - last > 4) s0 = u; last = u }
      else if (u - last === 4 && s0 > -1e9) { if (!best || last - s0 > best[1] - best[0]) best = [s0, last]; s0 = -1e9 }
    }
    // celle della retta cancellate comunque (non si ripesca la stessa retta)
    for (let u = -R; u <= R; u++) { const i = Math.round(x0 + dx * u), j = Math.round(z0 + dz * u); for (let d = -2; d <= 2; d++) { const ii = Math.round(i + cs[t] * d), jj = Math.round(j + sn[t] * d); if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && (!best || (u >= best[0] - 2 && u <= best[1] + 2))) live[jj * nx + ii] = 0 } }
    if (!best) continue
    const L = (best[1] - best[0]) * STEP
    if (L < 0.3 || L > 1.6) continue
    const P = (u: number): Pt => [G.x0 + (x0 + dx * u + 0.5) * STEP, G.z0 + (z0 + dz * u + 0.5) * STEP]
    segs.push({ a: P(best[0]), b: P(best[1]), len: L, ang: Math.atan2(dz, dx) })
  }
  return segs
}
function findFans(G: Grid): Fan[] {
  const segs = thinSegments(G)
  if (segs.length < 4) return []
  const lineD = (q: Seg, c: Pt) => Math.abs((c[0] - q.a[0]) * Math.sin(q.ang) - (c[1] - q.a[1]) * Math.cos(q.ang))
  const nearEnd = (q: Seg, c: Pt) => Math.min(Math.hypot(c[0] - q.a[0], c[1] - q.a[1]), Math.hypot(c[0] - q.b[0], c[1] - q.b[1]))
  // perni candidati: incroci delle rette di coppie di tratti non paralleli, vicino ai capi
  let top: { c: Pt; rays: { a: number; r0: number; r1: number }[] } | null = null
  for (let i = 0; i < segs.length; i++) for (let k = i + 1; k < segs.length; k++) {
    const A = segs[i], B = segs[k]
    let da = Math.abs(A.ang - B.ang) % Math.PI; da = Math.min(da, Math.PI - da)
    if (da < 0.1) continue
    const d1: Pt = [Math.cos(A.ang), Math.sin(A.ang)], d2: Pt = [Math.cos(B.ang), Math.sin(B.ang)], den = d1[0] * d2[1] - d1[1] * d2[0]
    const u = ((B.a[0] - A.a[0]) * d2[1] - (B.a[1] - A.a[1]) * d2[0]) / den
    const c: Pt = [A.a[0] + d1[0] * u, A.a[1] + d1[1] * u]
    if (nearEnd(A, c) > 0.7 || nearEnd(B, c) > 0.7) continue
    // tratti che convergono qui: raggi dal perno verso il capo lontano
    const rays = segs.filter(q => lineD(q, c) <= 0.1 && nearEnd(q, c) <= 0.7 && Math.max(Math.hypot(c[0] - q.a[0], c[1] - q.a[1]), Math.hypot(c[0] - q.b[0], c[1] - q.b[1])) >= 0.3).map(q => {
      const fa = Math.hypot(c[0] - q.a[0], c[1] - q.a[1]) > Math.hypot(c[0] - q.b[0], c[1] - q.b[1]) ? q.a : q.b
      return { a: Math.atan2(fa[1] - c[1], fa[0] - c[0]), r0: nearEnd(q, c), r1: Math.hypot(fa[0] - c[0], fa[1] - c[1]) }
    }).sort((u2, w) => u2.a - w.a)
    // la catena piu' lunga di raggi consecutivi (6-50 gradi), entro 180 gradi
    let best: typeof rays = []
    for (let s0 = 0; s0 < rays.length; s0++) {
      const seq = [rays[s0]]
      for (let m = 1; m < rays.length; m++) {
        const q = rays[(s0 + m) % rays.length], prev = seq[seq.length - 1]
        let d = q.a - prev.a; if (d <= 0) d += 2 * Math.PI
        let span = q.a - seq[0].a; if (span <= 0) span += 2 * Math.PI
        if (d < 0.1 || d > 0.87 || span > 3.2) break
        seq.push(q)
      }
      if (seq.length > best.length) best = seq
    }
    if (best.length < 4) continue
    const skew = best.filter(q => { const dd = ((q.a * 180 / Math.PI) % 90 + 90) % 90; return dd >= 10 && dd <= 80 }).length
    if (skew < 3) continue
    // carta bianca tra un raggio e l'altro
    let clean = true
    for (let m = 1; m < best.length && clean; m++) {
      let a2 = (best[m].a + best[m - 1].a) / 2
      if (best[m].a < best[m - 1].a) a2 += Math.PI
      const r0 = Math.max(best[m].r0, best[m - 1].r0, 0.2), r1 = Math.min(best[m].r1, best[m - 1].r1)
      let kk = 0, cc = 0
      for (let r = r0 + 0.05; r < r1 - 0.05; r += 0.025) { kk++; if (at(G, c[0] + Math.cos(a2) * r, c[1] + Math.sin(a2) * r)) cc++ }
      if (kk && cc / kk > 0.4) clean = false
    }
    if (!clean) continue
    if (!top || best.length > top.rays.length) top = { c, rays: best }
  }
  if (!top) return []
  const f = top as { c: Pt; rays: { a: number; r0: number; r1: number }[] }
  const pts: Pt[] = f.rays.flatMap(r => [[f.c[0] + Math.cos(r.a) * r.r0, f.c[1] + Math.sin(r.a) * r.r0], [f.c[0] + Math.cos(r.a) * r.r1, f.c[1] + Math.sin(r.a) * r.r1]] as Pt[])
  return [{ c: f.c, rays: f.rays, box: bboxOf([...pts, f.c]) }]
}

// capi dei pezzi e catena
function endsOf(pieces: Piece[]): End[] {
  const out: End[] = []
  pieces.forEach((pc, i) => {
    if (pc.run) {
      const r = pc.run
      for (const side of [0, 1] as const) {
        const a = side ? r.lines[r.lines.length - 1] : r.lines[0]
        const A = xzOf(r.axis, a, r.p0), B = xzOf(r.axis, a, r.p1)
        out.push({ piece: i, side, a: A, b: B, m: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] })
      }
    } else if (pc.turn) {
      for (const side of [0, 1] as const) { const [A, B] = pc.turn.ends[side]; out.push({ piece: i, side, a: A, b: B, m: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] }) }
    } else if (pc.fan) {
      const f = pc.fan
      for (const side of [0, 1] as const) {
        const ry = side ? f.rays[f.rays.length - 1] : f.rays[0]
        const A: Pt = [f.c[0] + Math.cos(ry.a) * ry.r0, f.c[1] + Math.sin(ry.a) * ry.r0], B: Pt = [f.c[0] + Math.cos(ry.a) * ry.r1, f.c[1] + Math.sin(ry.a) * ry.r1]
        out.push({ piece: i, side, a: A, b: B, m: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] })
      }
    }
  })
  return out
}
function chainOf(_G: Grid, pieces: Piece[]): { order: number[]; free: [End | null, End | null]; ends: End[]; links: [End, End][] } {
  const ends = endsOf(pieces)
  const segD = (e: End, f: End) => Math.min(...[e.a, e.b, e.m].flatMap(p => [f.a, f.b, f.m].map(q => Math.hypot(p[0] - q[0], p[1] - q[1]))))
  const links: [End, End][] = []
  for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) {
    const e = ends[i], f = ends[j]
    if (e.piece === f.piece) continue
    if (Math.hypot(e.m[0] - f.m[0], e.m[1] - f.m[1]) <= 0.45 || segD(e, f) <= 0.12) links.push([e, f])
  }
  // da ogni pezzo si cammina lungo i legami: la catena con piu' gradini
  let best: { order: number[]; free: [End | null, End | null]; steps: number } | null = null
  for (let s = 0; s < pieces.length; s++) for (const startSide of [0, 1] as const) {
    const order = [s], seen = new Set([s])
    let cur = ends.find(e => e.piece === s && e.side !== startSide)!
    const first = ends.find(e => e.piece === s && e.side === startSide)!
    if (links.some(([a, b]) => (a === first && !seen.has(b.piece)) || (b === first && !seen.has(a.piece)))) continue // si parte da un capo libero
    for (;;) {
      const l = links.find(([a, b]) => (a === cur && !seen.has(b.piece)) || (b === cur && !seen.has(a.piece)))
      if (!l) break
      const nxt = l[0] === cur ? l[1] : l[0]
      order.push(nxt.piece); seen.add(nxt.piece)
      cur = ends.find(e => e.piece === nxt.piece && e.side !== nxt.side)!
    }
    const steps = order.reduce((t, i) => t + pieces[i].n, 0)
    if (!best || steps > best.steps) best = { order, free: [first, cur], steps }
  }
  if (!best) { const e = ends.filter(x => x.piece === 0); return { order: [0], free: [e[0], e[1]], ends, links } }
  return { order: best.order, free: best.free, ends, links }
}

// Svolta tra la rampa A (lungo x) e la rampa B (lungo z) che si incontrano ad angolo: la zona dell'angolo (fascia di B per
// fascia di A, piu' il tratto tra i capi e l'angolo) si riempie di gradini a ventaglio. Spicchi tra il percorso interno
// (lato del pozzo) e quello esterno (lato dei muri), divisi in parti uguali; quanti gradini: le righe contate lungo la
// linea di mezzo nel disegno (o un gradino ogni 25 cm se non si leggono)
function cornerTurn(G: Grid, A: Run, B: Run): Piece | null {
  const Ac = [(A.lines[0] + A.lines[A.lines.length - 1]) / 2, (A.p0 + A.p1) / 2], Bc = [(B.p0 + B.p1) / 2, (B.lines[0] + B.lines[B.lines.length - 1]) / 2]
  const cx = (B.p0 + B.p1) / 2, cz = (A.p0 + A.p1) / 2 // centro dell'angolo
  const sx = cx > Ac[0] ? 1 : -1, sz = cz > Bc[1] ? 1 : -1
  const xa = sx > 0 ? A.lines[A.lines.length - 1] : A.lines[0], zb = sz > 0 ? B.lines[B.lines.length - 1] : B.lines[0]
  // l'angolo e' oltre i capi delle due rampe, non troppo lontano
  const gx = sx > 0 ? B.p0 - xa : xa - B.p1, gz = sz > 0 ? A.p0 - zb : zb - A.p1
  if (gx < -0.1 || gz < -0.1 || gx > 0.9 || gz > 0.9) return null
  const zAin = Bc[1] > Ac[1] ? A.p1 : A.p0, zAout = Bc[1] > Ac[1] ? A.p0 : A.p1
  const xBin = Ac[0] < Bc[0] ? B.p0 : B.p1, xBout = Ac[0] < Bc[0] ? B.p1 : B.p0
  const inner: Pt[] = [[xa, zAin], [xBin, zAin], [xBin, zb]], outer: Pt[] = [[xa, zAout], [xBout, zAout], [xBout, zb]]
  const len = (P: Pt[]) => P.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - P[i][0], q[1] - P[i][1]), 0)
  const atT = (P: Pt[], t: number): Pt => { let d = t * len(P); for (let i = 1; i < P.length; i++) { const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (d <= L || i === P.length - 1) { const k = L ? Math.min(1, d / L) : 0; return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k] } d -= L } return P[P.length - 1] }
  // righe lungo la linea di mezzo (esclusi i capi, che sono le righe delle rampe)
  const midL = (len(inner) + len(outer)) / 2
  let lines = 0, on = false
  for (let t = 0.06; t <= 0.94; t += 0.004) {
    const a = atT(inner, t), b = atT(outer, t), q: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const ink = at(G, q[0], q[1]) === 1
    if (ink && !on) lines++
    on = ink
  }
  const n = lines >= 2 && lines <= 12 && midL / (lines + 1) >= 0.12 ? lines + 1 : Math.max(2, Math.round(midL / 0.25))
  // spicchi: tra i raggi k e k+1, con i vertici dei percorsi che cadono in mezzo
  const tOf = (P: Pt[]) => { const L = len(P); let d = 0; return P.map((q, i) => { if (i) d += Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]); return L ? d / L : 0 }) }
  const ti = tOf(inner), to = tOf(outer)
  const wedges: Pt[][] = []
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n
    const w: Pt[] = [atT(inner, t0), atT(outer, t0)]
    outer.forEach((q, i) => { if (to[i] > t0 && to[i] < t1) w.push(q) })
    w.push(atT(outer, t1), atT(inner, t1))
    inner.map((q, i) => ({ q, i })).reverse().forEach(({ q, i }) => { if (ti[i] > t0 && ti[i] < t1) w.push(q) })
    wedges.push(w)
  }
  const box = bboxOf([...inner, ...outer])
  return { turn: { wedges, ends: [[inner[0], outer[0]], [inner[2], outer[2]]] }, box, n }
}

// pianerottolo oltre il capo di una rampa: a 1/4 e 3/4 della larghezza il primo inchiostro a distanza simile (60 cm -
// 2,5 m) chiude un rettangolo
function landingAt(G: Grid, r: Run, side: 0 | 1): { box: Box; d: number } | null {
  const inkAt = (a: number, p: number) => { const [x, z] = xzOf(r.axis, a, p); return at(G, x, z) === 1 }
  const end = side ? r.lines[r.lines.length - 1] : r.lines[0], dir = side ? 1 : -1
  // dal filo dell'ultima riga (si esce prima dal suo tratto) al primo inchiostro
  const reach = (p: number) => { let d = 0.02; while (d < 0.12 && inkAt(end + dir * d, p)) d += STEP; for (d += STEP; d <= 2.5; d += STEP) if (inkAt(end + dir * d, p) || inkAt(end + dir * d, p + STEP)) return d; return null }
  // fondo del pianerottolo: la distanza piu' comune su 8 punti della larghezza (righe di passaggio o segni in mezzo non contano)
  const ds = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map(t => reach(r.p0 + (r.p1 - r.p0) * t)).filter((d): d is number => d !== null)
  const d = ds.map(x => ({ x, k: ds.filter(y => Math.abs(y - x) <= 0.1).length })).sort((u, w) => w.k - u.k || u.x - w.x)[0]?.x ?? null
  if (d === null || ds.filter(y => Math.abs(y - d) <= 0.1).length < 4) return null
  if (d < 0.6) return null
  const am = end + dir * d / 2, pm = (r.p0 + r.p1) / 2
  const sideAt = (s: number) => { for (let k = 0.1; k <= 2; k += STEP) if (inkAt(am, pm + s * k)) return pm + s * k; return s < 0 ? r.p0 : r.p1 }
  const q0 = Math.min(r.p0, sideAt(-1)), q1 = Math.max(r.p1, sideAt(1)), e0 = Math.min(end, end + dir * d), e1 = Math.max(end, end + dir * d)
  const [x0, z0] = xzOf(r.axis, e0, q0), [x1, z1] = xzOf(r.axis, e1, q1)
  return { box: [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)], d }
}

// --- ordine dall'ingresso ---

// stanze col nome letto (cucina, corridoio, "fuori" = esterni)
function roomsNamed(raw: RawPlan, name: string | undefined, self: RawRoom): RawRoom[] {
  if (!name) return []
  const n = name.toLowerCase()
  if (n === 'fuori') return raw.rooms.filter(r => r.id !== self.id && ['giardino', 'cortile', 'terrazzo', 'balcone', 'esterno'].includes(r.type))
  return raw.rooms.filter(r => r.id !== self.id && r.type !== 'scala' && ((r.label ?? '').toLowerCase().includes(n) || n.includes((r.label ?? '#').toLowerCase()) || r.type === n || n.includes(r.type)))
}
// quale dei due capi e' l'ingresso (al piano della pianta): 0 o 1. landingEnd = capo col pianerottolo (in cima)
function entryOf(raw: RawPlan, room: RawRoom, hint: StairHint, m: [Pt, Pt], landingEnd: 0 | 1 | null): 0 | 1 {
  const down = hint.goes === 'giu' && !hint.outdoor
  if (landingEnd !== null) return (down ? landingEnd : 1 - landingEnd) as 0 | 1
  const dist = (q: Pt, rs: RawRoom[]) => Math.min(99, ...rs.map(r => (inPoly(q[0], q[1], r.poly) ? 0 : polyDist(q, r.poly))))
  const from = roomsNamed(raw, hint.from, room)
  if (from.length) { const d0 = dist(m[0], from), d1 = dist(m[1], from); if (Math.abs(d0 - d1) > 0.2) return d0 < d1 ? 0 : 1 }
  // verso una porta (non le finestre)
  const ops = raw.openings.filter(o => o.type !== 'window')
  const dOp = (q: Pt) => Math.min(99, ...ops.map(o => { const c: Pt = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]; return Math.hypot(q[0] - c[0], q[1] - c[1]) }))
  const o0 = dOp(m[0]), o1 = dOp(m[1])
  if (Math.abs(o0 - o1) > 0.3) return o0 < o1 ? 0 : 1
  const to = roomsNamed(raw, hint.to, room)
  if (to.length) { const d0 = dist(m[0], to), d1 = dist(m[1], to); if (Math.abs(d0 - d1) > 0.2) return d0 < d1 ? 1 : 0 }
  return 0
}

function orderPath(raw: RawPlan, room: RawRoom, hint: StairHint, kept: Piece[], landing: { box: Box; end: 0 | 1 } | null): StairPiece[] {
  // capi liberi della catena (ricalcolati sui pezzi tenuti, nell'ordine della catena)
  const ends = endsOf(kept)
  const first = kept.length === 1 ? ends.find(e => e.piece === 0 && e.side === 0)! : freeEnd(ends, kept, 0)
  const last = kept.length === 1 ? ends.find(e => e.piece === 0 && e.side === 1)! : freeEnd(ends, kept, kept.length - 1)
  const entry = entryOf(raw, room, hint, [first.m, last.m], landing ? landing.end : null)
  const seq = entry === 0 ? kept.map((p, i) => ({ p, i })) : kept.map((p, i) => ({ p, i })).reverse()
  const out: StairPiece[] = []
  let cur: Pt = entry === 0 ? first.m : last.m // punto da cui si entra nel pezzo
  for (const { p } of seq) {
    if (p.run) {
      const r = p.run, a0 = r.lines[0], a1 = r.lines[r.lines.length - 1]
      const m0 = xzOf(r.axis, a0, (r.p0 + r.p1) / 2), m1 = xzOf(r.axis, a1, (r.p0 + r.p1) / 2)
      const fwd = Math.hypot(cur[0] - m0[0], cur[1] - m0[1]) <= Math.hypot(cur[0] - m1[0], cur[1] - m1[1])
      out.push({ k: 'run', box: p.box.map(r3) as Box, axis: r.axis, dir: fwd ? 1 : -1, n: r.n })
      cur = fwd ? m1 : m0
    } else if (p.turn) {
      const t = p.turn, m0: Pt = mid(t.ends[0]), m1: Pt = mid(t.ends[1])
      const fwd = Math.hypot(cur[0] - m0[0], cur[1] - m0[1]) <= Math.hypot(cur[0] - m1[0], cur[1] - m1[1])
      const wedges = (fwd ? t.wedges : [...t.wedges].reverse()).map(w => w.map(q => [r3(q[0]), r3(q[1])] as Pt))
      out.push({ k: 'fan', n: wedges.length, box: p.box.map(r3) as Box, wedges })
      cur = fwd ? m1 : m0
    } else if (p.fan) {
      const f = p.fan, A = f.rays[0], B = f.rays[f.rays.length - 1]
      const pa: Pt = [f.c[0] + Math.cos(A.a) * (A.r0 + A.r1) / 2, f.c[1] + Math.sin(A.a) * (A.r0 + A.r1) / 2], pb: Pt = [f.c[0] + Math.cos(B.a) * (B.r0 + B.r1) / 2, f.c[1] + Math.sin(B.a) * (B.r0 + B.r1) / 2]
      const fwd = Math.hypot(cur[0] - pa[0], cur[1] - pa[1]) <= Math.hypot(cur[0] - pb[0], cur[1] - pb[1])
      // spicchi tra raggi vicini: dal perno (o da dove partono le righe) a dove finiscono (muro o bordo)
      const P = (q: { a: number }, r: number): Pt => [r3(f.c[0] + Math.cos(q.a) * r), r3(f.c[1] + Math.sin(q.a) * r)]
      let wedges = f.rays.slice(1).map((q, i) => { const o = f.rays[i]; return [P(o, Math.min(o.r0, 0.15)), P(o, o.r1), P(q, q.r1), P(q, Math.min(q.r0, 0.15))] })
      if (!fwd) wedges = wedges.reverse()
      out.push({ k: 'fan', n: wedges.length, box: p.box.map(r3) as Box, wedges })
      cur = fwd ? pb : pa
    }
  }
  if (landing) {
    const lb = landing.box.map(r3) as Box
    const atEnd = (entry === 0) === (landing.end === 1)
    if (atEnd) out.push({ k: 'land', box: lb }); else out.unshift({ k: 'land', box: lb })
  }
  return out
}
const pairSteps = (t: Piece) => { const pr = (t as Piece & { pair?: [Run, Run] }).pair; return pr ? pr[0].n + pr[1].n : 0 }
const mid = (e: [Pt, Pt]): Pt => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2]
// i lati della rampa si fermano al filo dei muri lungo la rampa (il tratto dei gradini spesso si attacca al muro accanto)
function trimToWalls(raw: RawPlan, b: Box, axis: 'x' | 'z'): Box {
  const out: Box = [...b]
  const [ai, pi] = axis === 'x' ? [0, 1] : [1, 0]
  const a0 = b[ai], a1 = b[ai + 2], W = b[pi + 2] - b[pi]
  for (const w of raw.walls) {
    const da = Math.abs(w.a[ai] - w.b[ai]), dp = Math.abs(w.a[pi] - w.b[pi])
    if (dp > 0.1 * Math.max(da, 1e-6)) continue // non e' lungo la rampa
    const ov = Math.min(a1, Math.max(w.a[ai], w.b[ai])) - Math.max(a0, Math.min(w.a[ai], w.b[ai]))
    if (ov < 0.5 * (a1 - a0)) continue
    const c = (w.a[pi] + w.b[pi]) / 2, w0 = c - w.t / 2, w1 = c + w.t / 2
    if (w1 > out[pi] && w0 < out[pi] + 0.35 * W && c < (b[pi] + b[pi + 2]) / 2) out[pi] = w1
    if (w0 < out[pi + 2] && w1 > out[pi + 2] - 0.35 * W && c > (b[pi] + b[pi + 2]) / 2) out[pi + 2] = w0
  }
  return out[pi + 2] - out[pi] >= 0.45 ? out : b
}
const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1] }
// capo libero del pezzo i della catena (quello non legato al pezzo vicino)
function freeEnd(ends: End[], kept: Piece[], i: number): End {
  const nb = i === 0 ? 1 : kept.length - 2
  const mine = ends.filter(e => e.piece === i), theirs = ends.filter(e => e.piece === nb)
  const dd = (e: End) => Math.min(...theirs.map(f => Math.hypot(e.m[0] - f.m[0], e.m[1] - f.m[1])))
  return dd(mine[0]) >= dd(mine[1]) ? mine[0] : mine[1]
}

// zona disegnata a gradini dentro il riquadro letto: celle di 20 cm con righe sottili (8-50% d'inchiostro), il gruppo
// piu' grande; il riquadro di Gemini comprende spesso pianerottoli, tratteggi e pezzi di stanza
function denseBox(ink: (x: number, z: number) => number, box: Box): Box | null {
  const C = 0.2, nx = Math.max(1, Math.round((box[2] - box[0]) / C)), nz = Math.max(1, Math.round((box[3] - box[1]) / C))
  const d = new Uint8Array(nx * nz)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    let c = 0, k = 0
    for (let z = box[1] + j * C; z < box[1] + (j + 1) * C; z += STEP) for (let x = box[0] + i * C; x < box[0] + (i + 1) * C; x += STEP) { k++; if (ink(x, z) > 0.45) c++ }
    const f = c / k
    d[j * nx + i] = f >= 0.1 && f <= 0.85 ? 1 : 0
  }
  // solo blocchi fitti (almeno 6 celle su 9 attorno): via le righe singole (corrimano, muri sottili, tratteggi)
  const d0 = new Uint8Array(d)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz) c += d0[jj * nx + ii] } d[j * nx + i] = d0[j * nx + i] && c >= 6 ? 1 : 0 }
  // gruppo connesso piu' grande
  const lab = new Int32Array(nx * nz).fill(-1)
  let best: number[] = []
  for (let s0 = 0; s0 < nx * nz; s0++) {
    if (!d[s0] || lab[s0] >= 0) continue
    const q = [s0], comp: number[] = []; lab[s0] = s0
    while (q.length) { const c = q.pop()!; comp.push(c); const i = c % nx, j = (c / nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const k = jj * nx + ii; if (d[k] && lab[k] < 0) { lab[k] = s0; q.push(k) } } }
    if (comp.length > best.length) best = comp
  }
  if (best.length < 3) return null
  const is = best.map(c => c % nx), js = best.map(c => (c / nx) | 0)
  // il blocco fitto piu' una cella attorno (i bordi erano stati tolti)
  const b: Box = [box[0] + Math.max(0, Math.min(...is) - 1) * C, box[1] + Math.max(0, Math.min(...js) - 1) * C, box[0] + Math.min(nx, Math.max(...is) + 2) * C, box[1] + Math.min(nz, Math.max(...js) + 2) * C]
  return area(b) < 0.8 * area(box) ? b : null
}

function guessFan(raw: RawPlan, room: RawRoom, hint: StairHint, ink: (x: number, z: number) => number, zone: Box): StairPiece[] | null {
  const G = gridOf(ink, grow(zone, 0.05))
  const skew = thinSegments(G).filter(q => { const d = ((q.ang * 180 / Math.PI) % 90 + 90) % 90; return d >= 12 && d <= 78 })
  if (skew.length < 3) return null
  // perno: il punto piu' vicino a tutte le rette (minimi quadrati)
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0
  for (const q of skew) { const nx = -Math.sin(q.ang), nz = Math.cos(q.ang), w = q.len, d = nx * q.a[0] + nz * q.a[1]; a11 += w * nx * nx; a12 += w * nx * nz; a22 += w * nz * nz; b1 += w * nx * d; b2 += w * nz * d }
  const det = a11 * a22 - a12 * a12
  if (Math.abs(det) < 1e-6) return null
  const c: Pt = [(b1 * a22 - b2 * a12) / det, (a11 * b2 - a12 * b1) / det]
  const gz = grow(zone, 0.3)
  if (c[0] < gz[0] || c[0] > gz[2] || c[1] < gz[1] || c[1] > gz[3]) return null
  // angoli dei capi lontani, srotolati attorno alla direzione media
  const far = skew.map(q => (Math.hypot(q.a[0] - c[0], q.a[1] - c[1]) > Math.hypot(q.b[0] - c[0], q.b[1] - c[1]) ? q.a : q.b))
  const angs = far.map(f => Math.atan2(f[1] - c[1], f[0] - c[0]))
  const m = Math.atan2(angs.reduce((t, a) => t + Math.sin(a), 0), angs.reduce((t, a) => t + Math.cos(a), 0))
  const rel = angs.map(a => Math.atan2(Math.sin(a - m), Math.cos(a - m)))
  const a0 = m + Math.min(...rel), a1 = m + Math.max(...rel)
  if (a1 - a0 < 0.6) return null
  // fino al bordo della zona
  const toEdge = (a: number): Pt => { const dx = Math.cos(a), dz = Math.sin(a); let t = 9; for (const [v, d, o] of [[zone[0], dx, c[0]], [zone[2], dx, c[0]], [zone[1], dz, c[1]], [zone[3], dz, c[1]]]) if (Math.abs(d) > 1e-9) { const k = (v - o) / d; if (k > 0.05) t = Math.min(t, k) } return [c[0] + dx * t, c[1] + dz * t] }
  const rMid = 0.6 * median(far.map(f => Math.hypot(f[0] - c[0], f[1] - c[1])))
  const n = Math.max(3, Math.min(10, Math.round((a1 - a0) * rMid / 0.22)))
  const corners: Pt[] = [[zone[0], zone[1]], [zone[2], zone[1]], [zone[2], zone[3]], [zone[0], zone[3]]]
  const angRel = (q: Pt) => Math.atan2(Math.sin(Math.atan2(q[1] - c[1], q[0] - c[0]) - m), Math.cos(Math.atan2(q[1] - c[1], q[0] - c[0]) - m))
  const wedges: Pt[][] = []
  for (let k = 0; k < n; k++) {
    const t0 = a0 + (a1 - a0) * k / n, t1 = a0 + (a1 - a0) * (k + 1) / n
    const mid = corners.filter(q => { const r = angRel(q) + m; return r > t0 && r < t1 }).sort((u, w) => angRel(u) - angRel(w))
    wedges.push([[r3(c[0]), r3(c[1])], ...[toEdge(t0), ...mid, toEdge(t1)].map(q => [r3(q[0]), r3(q[1])] as Pt)])
  }
  const e0 = toEdge(a0), e1 = toEdge(a1)
  const entry = entryOf(raw, room, hint, [[(c[0] + e0[0]) / 2, (c[1] + e0[1]) / 2], [(c[0] + e1[0]) / 2, (c[1] + e1[1]) / 2]], null)
  return [{ k: 'fan', n, box: zone.map(r3) as Box, wedges: entry === 0 ? wedges : wedges.reverse() }]
}

// gradini non trovati nel disegno: una rampa dentro il riquadro letto, lungo il lato lungo, pedata ~28 cm
function guessPath(raw: RawPlan, room: RawRoom, hint: StairHint, box: Box): StairPiece[] {
  const axis: 'x' | 'z' = box[2] - box[0] >= box[3] - box[1] ? 'x' : 'z'
  const L = axis === 'x' ? box[2] - box[0] : box[3] - box[1], n = Math.max(2, Math.round(L / 0.28))
  const pm = axis === 'x' ? (box[1] + box[3]) / 2 : (box[0] + box[2]) / 2
  const m0 = xzOf(axis, axis === 'x' ? box[0] : box[1], pm), m1 = xzOf(axis, axis === 'x' ? box[2] : box[3], pm)
  const entry = entryOf(raw, room, hint, [m0, m1], null)
  return [{ k: 'run', box: box.map(r3) as Box, axis, dir: entry === 0 ? 1 : -1, n }]
}
