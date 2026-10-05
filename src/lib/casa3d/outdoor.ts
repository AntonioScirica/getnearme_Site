// Terrazzi e balconi persi nel ridisegno: GPT cancella i tratteggi e le linee sottili fuori dai muri. Si ricavano
// dall'ORIGINALE: zone tratteggiate (densita' di linee) o chiuse da un contorno sottile, attaccate alla casa, e le
// scritte "terrazzo/balcone" lette fuori dalle stanze riconosciute. Diventano stanze esterne con i parapetti sul bordo.
import sharp from 'sharp'
import { closeDisk, components, dilateDisk, fillPoly, simplifyRing, traceContour } from './raster'
import { inPoly } from './build'
import type { Pt, RawPlan, RawRoom } from './types'

type OutLabel = NonNullable<RawPlan['outside_labels']>[number]

export async function findOutdoor(raw0: RawPlan, original: Buffer): Promise<{ raw: RawPlan; added: { type: string; area: number; how: string }[] }> {
  const raw: RawPlan = JSON.parse(JSON.stringify(raw0))
  const { imgW: W, imgH: H } = raw.source
  const T = raw.source.toImage, det = T[0] * T[3] - T[1] * T[2], ppm = Math.sqrt(Math.abs(det))
  const toPx = (p: Pt): [number, number] => [T[0] * p[0] + T[2] * p[1] + T[4], T[1] * p[0] + T[3] * p[1] + T[5]]
  const toM = (x: number, y: number): Pt => [(T[3] * (x - T[4]) - T[2] * (y - T[5])) / det, (-T[1] * (x - T[4]) + T[0] * (y - T[5])) / det]
  const { data } = await sharp(original).rotate().flatten({ background: '#ffffff' }).resize(W, H, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true })
  const N = W * H, ink = new Uint8Array(N)
  // soglia relativa al foglio: le foto delle planimetrie hanno linee grigie chiare su fondo non bianco
  const hist = new Uint32Array(256); for (let i = 0; i < N; i += 7) hist[data[i]]++
  let acc = 0, med = 255; const tot = hist.reduce((a, b) => a + b, 0); for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= tot / 2) { med = v; break } }
  const thr = Math.max(120, Math.min(205, med - 35))
  for (let i = 0; i < N; i++) ink[i] = data[i] < thr ? 1 : 0
  // impronta della casa (stanze + muri) in pixel dell'originale
  const foot = new Uint8Array(N)
  for (const r of raw.rooms) fillPoly(foot, W, H, r.poly.map(toPx))
  for (const w of raw.walls) {
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1e-6, nx = -(w.b[1] - w.a[1]) / L * w.t / 2, ny = (w.b[0] - w.a[0]) / L * w.t / 2
    fillPoly(foot, W, H, [[w.a[0] + nx, w.a[1] + ny], [w.b[0] + nx, w.b[1] + ny], [w.b[0] - nx, w.b[1] - ny], [w.a[0] - nx, w.a[1] - ny]].map(p => toPx(p as Pt)))
  }
  const near = dilateDisk(foot, W, H, Math.max(3, Math.round(1.4 * ppm))) // entro 70 cm dalla casa
  const footPad = dilateDisk(foot, W, H, 5)
  // l'inchiostro dei muri non conta per il tratteggio: si toglie una fascia di 25 cm attorno alla casa
  const wallBand = dilateDisk(foot, W, H, Math.max(5, Math.round(0.5 * ppm)))
  for (let i = 0; i < N; i++) if (wallBand[i]) ink[i] = 0
  // densita' di inchiostro su finestre di 50 cm (immagine integrale)
  const k = Math.max(5, Math.round(0.5 * ppm)), I = new Float64Array((W + 1) * (H + 1))
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { s += ink[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + s } }
  const dens = (x: number, y: number) => {
    const x0 = Math.max(0, x - (k >> 1)), y0 = Math.max(0, y - (k >> 1)), x1 = Math.min(W, x + (k >> 1) + 1), y1 = Math.min(H, y + (k >> 1) + 1)
    return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0))
  }
  const hatch = new Uint8Array(N)
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) { const i = y * W + x; if (footPad[i]) continue; const d = dens(x, y); hatch[i] = !wallBand[i] && d > 0.07 && d < 0.55 ? 1 : 0 }
  const cc = components(hatch, W, H, 4)
  const labels: OutLabel[] = raw.outside_labels ?? []
  const lp = labels.map(l => ({ l, x: Math.round(l.x * W), y: Math.round(l.y * H) }))
  const added: { type: string; area: number; how: string }[] = []
  const used = new Set<number>()
  let nextId = Math.max(0, ...raw.rooms.map(r => r.id)) + 1
  const addRegion = (mask: Int32Array, id: number, how: string, lab?: OutLabel) => {
    let n = 0, sx = 0, sy = 0, nearN = 0, x0 = W, y0 = H, x1 = 0, y1 = 0
    for (let i = 0; i < N; i++) if (mask[i] === id) { n++; const x = i % W, y = (i - x) / W; sx += x; sy += y; if (near[i]) nearN++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const area = n / (ppm * ppm), fill = n / ((x1 - x0 + 1) * (y1 - y0 + 1))
    // attaccato alla casa (almeno 60 cm di bordo vicino), misura da terrazzo/balcone, forma piena, non tocca il bordo del foglio
    if (process.env.CASA3D_DEBUG) console.log('esterno?', how, { area: Math.round(area * 10) / 10, nearN, needNear: Math.round(0.6 * ppm * 3), fill: Math.round(fill * 100) / 100, box: [x0, y0, x1, y1] })
    const thin = Math.min(x1 - x0, y1 - y0) / ppm
    if (area < (lab ? 1.5 : 2.5) || area > 90 || nearN < 0.6 * ppm * 3 || fill < (lab ? 0.3 : 0.45) || thin < 0.8 || (x0 <= 1 && x1 >= W - 2) || (y0 <= 1 && y1 >= H - 2)) return false // tutto il foglio no
    const ring = simplifyRing(traceContour(mask, id, W, H).map(([x, y]) => [x + 0.5, y + 0.5] as [number, number]), 0.12 * ppm)
    let poly = ring.map(([x, y]) => toM(x, y))
    // lati quasi dritti raddrizzati (la pianta e' dritta)
    for (let it = 0; it < 2; it++) for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], an = Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI) % 180
      if (Math.min(an, 180 - an) < 8) { const y = (a[1] + b[1]) / 2; a[1] = b[1] = y } else if (Math.abs(an - 90) < 8) { const x = (a[0] + b[0]) / 2; a[0] = b[0] = x }
    }
    poly = poly.map(p => [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000] as Pt)
    const type = lab?.type === 'balcone' || (!lab && area < 6) ? 'balcone' : 'terrazzo'
    const c = toM(sx / n, sy / n)
    const room: RawRoom = { id: nextId++, area: Math.round(area * 10) / 10, center: [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000], poly, type, ...(lab ? { label: lab.text.slice(0, 40) } : {}) }
    raw.rooms.push(room)
    // parapetti sui lati lontani dalla casa (il lato attaccato e' la facciata)
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [mx, my] = toPx(m)
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.3) continue
      const xi = Math.round(mx), yi = Math.round(my)
      if (xi >= 0 && yi >= 0 && xi < W && yi < H && near[yi * W + xi]) continue
      raw.walls.push({ a, b, t: 0.12, label: `parapetto-${room.id}` })
    }
    added.push({ type, area: room.area, how })
    return true
  }
  // 1. zone tratteggiate attaccate alla casa (con la scritta dentro, se c'e')
  for (let id = 1; id < cc.n; id++) {
    if (cc.area[id] < 1.5 * ppm * ppm) continue
    const lab = lp.find(q => q.x >= 0 && q.y >= 0 && q.x < W && q.y < H && cc.lab[q.y * W + q.x] === id)
    if (addRegion(cc.lab, id, lab ? 'tratteggio + scritta' : 'tratteggio', lab?.l)) { if (lab) used.add(lp.indexOf(lab)) }
  }
  // 2. scritte terrazzo/balcone rimaste: tratteggio rado o contorno sottile attorno alla scritta. L'inchiostro fuori
  // dalla casa chiuso con un disco di 1,2 m diventa una macchia unica (le linee del tratteggio si toccano), e la zona e'
  // la macchia che contiene la scritta; se no, il bianco chiuso dalle linee attorno alla scritta.
  const rest = lp.filter((_, j) => !used.has(j))
  if (rest.length) {
    const outInk = new Uint8Array(N); for (let i = 0; i < N; i++) outInk[i] = ink[i] && !footPad[i] ? 1 : 0
    const blob = closeDisk(outInk, W, H, Math.max(5, Math.round(1.2 * ppm)))
    for (let i = 0; i < N; i++) if (footPad[i]) blob[i] = 0
    const bc = components(blob, W, H, 4)
    const free = new Uint8Array(N), inkD = dilateDisk(ink, W, H, 3)
    for (let i = 0; i < N; i++) free[i] = !inkD[i] && !footPad[i] ? 1 : 0
    const fc = components(free, W, H, 4)
    const at = (lab: Int32Array, q: { x: number; y: number }) => {
      for (let rr = 0; rr < 0.8 * ppm; rr += 3) for (let a = 0; a < 6.28; a += 0.4) { const x = Math.round(q.x + Math.cos(a) * rr), y = Math.round(q.y + Math.sin(a) * rr); if (x >= 0 && y >= 0 && x < W && y < H && lab[y * W + x]) return lab[y * W + x] }
      return 0
    }
    for (const q of rest) {
      if (q.x < 0 || q.y < 0 || q.x >= W || q.y >= H) continue
      const qm = toM(q.x, q.y)
      if (raw.rooms.some(r => inPoly(qm[0], qm[1], r.poly))) continue
      const b = at(bc.lab, q)
      if (b && addRegion(bc.lab, b, 'tratteggio rado + scritta', q.l)) continue
      const f = at(fc.lab, q)
      if (f) addRegion(fc.lab, f, 'contorno + scritta', q.l)
    }
  }
  return { raw, added }
}
