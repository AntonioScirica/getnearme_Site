// Operazioni sui pixel per il riconoscimento delle planimetrie, senza OpenCV (gira su Vercel in Node puro).
// Maschere = Uint8Array 0/1 riga per riga (indice y * w + x). Le morfologie con il cerchio usano la distanza
// euclidea esatta (Felzenszwalb), cosi' anche i kernel grandi (1,6 m = 130 px) costano come quelli piccoli.

export type Mask = Uint8Array

// distanza (in px) di ogni pixel dal pixel piu' vicino con mask == 0 (0 dove mask == 0)
export function dist0(mask: Mask, w: number, h: number): Float32Array {
  const INF = 1e20
  const f = new Float64Array(Math.max(w, h)), d = new Float64Array(Math.max(w, h))
  const v = new Int32Array(Math.max(w, h)), z = new Float64Array(Math.max(w, h) + 1)
  const g = new Float64Array(w * h)
  const dt1 = (n: number) => {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]) }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]] }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = mask[y * w + x] ? INF : 0
    dt1(h)
    for (let y = 0; y < h; y++) g[y * w + x] = d[y]
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x]
    dt1(w)
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x])
  }
  return out
}

export const not = (m: Mask) => { const o = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) o[i] = m[i] ? 0 : 1; return o }
export const and = (a: Mask, b: Mask) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] & b[i]; return o }
export const or = (a: Mask, b: Mask) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] | b[i]; return o }
export const andNot = (a: Mask, b: Mask) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] && !b[i] ? 1 : 0; return o }
export const count = (m: Mask) => { let c = 0; for (let i = 0; i < m.length; i++) c += m[i]; return c }

// cerchio di diametro k (come cv2.getStructuringElement(MORPH_ELLIPSE, (k, k)))
export function erodeDisk(m: Mask, w: number, h: number, k: number): Mask {
  const r = (k - 1) / 2, d = dist0(m, w, h), o = new Uint8Array(m.length)
  for (let i = 0; i < m.length; i++) o[i] = d[i] > r ? 1 : 0
  return o
}
export function dilateDisk(m: Mask, w: number, h: number, k: number): Mask {
  const r = (k - 1) / 2, d = dist0(not(m), w, h), o = new Uint8Array(m.length)
  for (let i = 0; i < m.length; i++) o[i] = d[i] <= r ? 1 : 0
  return o
}
export const openDisk = (m: Mask, w: number, h: number, k: number) => dilateDisk(erodeDisk(m, w, h, k), w, h, k)
export const closeDisk = (m: Mask, w: number, h: number, k: number) => erodeDisk(dilateDisk(m, w, h, k), w, h, k)

// rettangolo kw x kh (separabile, finestra scorrevole con conteggio)
export function dilateBox(m: Mask, w: number, h: number, kw: number, kh: number): Mask {
  const tmp = new Uint8Array(m.length), out = new Uint8Array(m.length)
  const lw = Math.floor((kw - 1) / 2), rw = kw - 1 - lw, lh = Math.floor((kh - 1) / 2), rh = kh - 1 - lh
  for (let y = 0; y < h; y++) {
    const row = y * w
    let c = 0
    for (let x = 0; x <= Math.min(rw, w - 1); x++) c += m[row + x]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = c > 0 ? 1 : 0
      const add = x + rw + 1, rem = x - lw
      if (add < w) c += m[row + add]
      if (rem >= 0) c -= m[row + rem]
    }
  }
  for (let x = 0; x < w; x++) {
    let c = 0
    for (let y = 0; y <= Math.min(rh, h - 1); y++) c += tmp[y * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = c > 0 ? 1 : 0
      const add = y + rh + 1, rem = y - lh
      if (add < h) c += tmp[add * w + x]
      if (rem >= 0) c -= tmp[rem * w + x]
    }
  }
  return out
}
export const erodeBox = (m: Mask, w: number, h: number, kw: number, kh: number) => not(dilateBox(not(m), w, h, kw, kh))
export const openBox = (m: Mask, w: number, h: number, kw: number, kh: number) => dilateBox(erodeBox(m, w, h, kw, kh), w, h, kw, kh)
export const closeBox = (m: Mask, w: number, h: number, kw: number, kh: number) => erodeBox(dilateBox(m, w, h, kw, kh), w, h, kw, kh)

// apertura con un segmento orizzontale ('h') o verticale ('v') lungo L: restano solo i tratti lunghi almeno L
export function keepRuns(m: Mask, w: number, h: number, axis: 'h' | 'v', L: number): Mask {
  const o = new Uint8Array(m.length)
  const outer = axis === 'h' ? h : w, inner = axis === 'h' ? w : h
  const at = (i: number, j: number) => (axis === 'h' ? i * w + j : j * w + i)
  for (let i = 0; i < outer; i++) {
    let s = -1
    for (let j = 0; j <= inner; j++) {
      const v = j < inner ? m[at(i, j)] : 0
      if (v && s < 0) s = j
      if (!v && s >= 0) { if (j - s >= L) for (let k = s; k < j; k++) o[at(i, k)] = 1; s = -1 }
    }
  }
  return o
}

// componenti connesse (8 vicini): etichette 1..n-1, aree
export function components(m: Mask, w: number, h: number, conn: 4 | 8 = 8): { n: number; lab: Int32Array; area: number[] } {
  const lab = new Int32Array(m.length), area = [0]
  const stack = new Int32Array(m.length)
  let n = 1
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || lab[s]) continue
    let sp = 0, a = 0
    stack[sp++] = s; lab[s] = n
    while (sp) {
      const p = stack[--sp]; a++
      const x = p % w, y = (p - x) / w
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        if (conn === 4 && dx && dy) continue
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const q = ny * w + nx
        if (m[q] && !lab[q]) { lab[q] = n; stack[sp++] = q }
      }
    }
    area.push(a); n++
  }
  return { n, lab, area }
}

// pixel liberi (m == 1) raggiungibili dal bordo dell'immagine (4 vicini)
export function reachFromBorder(m: Mask, w: number, h: number): Mask {
  const seen = new Uint8Array(m.length), stack = new Int32Array(m.length)
  let sp = 0
  const push = (p: number) => { if (m[p] && !seen[p]) { seen[p] = 1; stack[sp++] = p } }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (sp) {
    const p = stack[--sp], x = p % w, y = (p - x) / w
    if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (y > 0) push(p - w); if (y < h - 1) push(p + w)
  }
  return seen
}

// crescita geodetica da piu' semi dentro una maschera (al posto dello spartiacque: l'immagine e' binaria)
export function growSeeds(allowed: Mask, seeds: Int32Array, w: number, h: number): Int32Array {
  const lab = new Int32Array(allowed.length)
  let q = new Int32Array(allowed.length), qn = 0
  for (let p = 0; p < allowed.length; p++) if (seeds[p] && allowed[p]) { lab[p] = seeds[p]; q[qn++] = p }
  let nq = new Int32Array(allowed.length)
  while (qn) {
    let nn = 0
    for (let i = 0; i < qn; i++) {
      const p = q[i], x = p % w, y = (p - x) / w, l = lab[p]
      const tryP = (r: number) => { if (allowed[r] && !lab[r]) { lab[r] = l; nq[nn++] = r } }
      if (x > 0) tryP(p - 1); if (x < w - 1) tryP(p + 1); if (y > 0) tryP(p - w); if (y < h - 1) tryP(p + w)
    }
    const t = q; q = nq; nq = t; qn = nn
  }
  return lab
}

// contorno esterno di una regione (pixel con lab == id) col metodo di Moore; punti in coordinate pixel
export function traceContour(lab: Int32Array, id: number, w: number, h: number): [number, number][] {
  let start = -1
  for (let p = 0; p < lab.length; p++) if (lab[p] === id) { start = p; break }
  if (start < 0) return []
  const inR = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && lab[y * w + x] === id
  // vicini in senso orario a partire da ovest
  const DX = [-1, -1, 0, 1, 1, 1, 0, -1], DY = [0, -1, -1, -1, 0, 1, 1, 1]
  const sx = start % w, sy = (start - sx) / w
  const pts: [number, number][] = [[sx, sy]]
  let cx = sx, cy = sy, dir = 0 // si arriva da ovest (il pixel a sinistra e' fuori)
  for (let guard = 0; guard < 4 * lab.length; guard++) {
    let found = false
    for (let k = 0; k < 8; k++) {
      const d = (dir + k) % 8, nx = cx + DX[d], ny = cy + DY[d]
      if (inR(nx, ny)) {
        cx = nx; cy = ny; dir = (d + 6) % 8 // si riparte dal vicino precedente a quello trovato
        found = true; break
      }
    }
    if (!found) break
    if (cx === sx && cy === sy) break
    pts.push([cx, cy])
  }
  return pts
}

// semplificazione Douglas-Peucker di un anello chiuso
export function simplifyRing(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 4) return pts.slice()
  const dp = (a: number, b: number, out: number[]) => {
    const [x0, y0] = pts[a], [x1, y1] = pts[b % pts.length]
    const L = Math.hypot(x1 - x0, y1 - y0) || 1e-9
    let best = -1, bi = -1
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i % pts.length]
      const d = Math.abs((x1 - x0) * (y0 - y) - (x0 - x) * (y1 - y0)) / L
      if (d > best) { best = d; bi = i }
    }
    if (best > eps) { dp(a, bi, out); out.push(bi % pts.length); dp(bi, b, out) }
  }
  // punto di partenza e il piu' lontano da lui
  let far = 0, fd = -1
  for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > fd) { fd = d; far = i } }
  const idx: number[] = [0]
  dp(0, far, idx); idx.push(far); dp(far, pts.length, idx)
  return idx.map(i => pts[i])
}

// poligono pieno (anche concavo) su una maschera, regola pari/dispari, centro dei pixel
export function fillPoly(m: Mask, w: number, h: number, poly: [number, number][], val = 1) {
  const ys = poly.map(p => p[1])
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)))
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5, xs: number[] = []
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j]
      if ((yi > yc) !== (yj > yc)) xs.push(xi + ((yc - yi) * (xj - xi)) / (yj - yi))
    }
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5))
      for (let x = a; x <= b; x++) m[y * w + x] = val
    }
  }
}
export function fillRect(m: Mask, w: number, h: number, x0: number, y0: number, x1: number, y1: number, val = 1) {
  const a = Math.max(0, x0), b = Math.min(w - 1, x1), c = Math.max(0, y0), d = Math.min(h - 1, y1)
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) m[y * w + x] = val
}
// media di una maschera su un rettangolo [x0,x1) x [y0,y1) (estremi come lo slicing di numpy, tagliati ai bordi)
export function meanRect(m: Mask, w: number, h: number, x0: number, y0: number, x1: number, y1: number): number {
  const a = Math.max(0, x0), b = Math.min(w, x1), c = Math.max(0, y0), d = Math.min(h, y1)
  if (b <= a || d <= c) return 0
  let s = 0
  for (let y = c; y < d; y++) for (let x = a; x < b; x++) s += m[y * w + x]
  return s / ((b - a) * (d - c))
}
export const sizeRect = (w: number, h: number, x0: number, y0: number, x1: number, y1: number) => Math.max(0, Math.min(w, x1) - Math.max(0, x0)) * Math.max(0, Math.min(h, y1) - Math.max(0, y0))
