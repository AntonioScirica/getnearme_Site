// Sovrapposizione numerata della pianta riconosciuta sull'immagine di partenza, NELLO STESSO ORIENTAMENTO
// dell'originale (il prototipo la dava raddrizzata, ruotata di 45 gradi: Claude confondeva i lati). Serve al
// controllo di Claude e al debug. SVG disegnato a mano e passato a sharp: le scritte sono tratti vettoriali
// (niente font di sistema, che su Vercel mancano).
import sharp from 'sharp'
import type { Pt, RawPlan } from './types'

// carattere su una griglia 4 x 6 (y in basso): tratti come polilinee
const GLYPH: Record<string, number[][]> = {
  '0': [[0, 0, 4, 0, 4, 6, 0, 6, 0, 0]], '1': [[1, 1, 2, 0, 2, 6], [1, 6, 3, 6]], '2': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]],
  '3': [[0, 0, 4, 0, 2, 2.5, 4, 3.5, 4, 5, 3, 6, 0, 6]], '4': [[3, 6, 3, 0, 0, 4, 4, 4]], '5': [[4, 0, 0, 0, 0, 2.6, 3, 2.6, 4, 3.6, 4, 5, 3, 6, 0, 6]],
  '6': [[4, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.5, 3, 2.6, 0, 2.6]], '7': [[0, 0, 4, 0, 1.5, 6]], '8': [[1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3], [1, 3, 0, 2, 0, 1, 1, 0]],
  '9': [[4, 3.4, 1, 3.4, 0, 2.4, 0, 1, 1, 0, 3, 0, 4, 1, 4, 6, 0, 6]], '.': [[1.6, 5.4, 2.4, 5.4, 2.4, 6, 1.6, 6, 1.6, 5.4]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]], I: [[0, 0, 4, 0], [2, 0, 2, 6], [0, 6, 4, 6]], V: [[0, 0, 2, 6, 4, 0]], F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
  W: [[0, 0, 1, 6, 2, 2.5, 3, 6, 4, 0]], R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3, 4, 6]], ' ': [],
}
// testo come path SVG (altezza size, centrato su x,y)
export function textPath(s: string, x: number, y: number, size: number): string {
  const k = size / 6, adv = 5.2 * k, w = s.length * adv - 1.2 * k
  let d = ''
  ;[...s].forEach((ch, i) => {
    for (const st of GLYPH[ch] ?? []) {
      for (let j = 0; j < st.length; j += 2) d += `${j ? 'L' : 'M'}${(x - w / 2 + i * adv + st[j] * k).toFixed(1)} ${(y - size / 2 + st[j + 1] * k).toFixed(1)}`
    }
  })
  return d
}

const COL: Record<string, string> = { door: '#ff8c00', entrance: '#e00000', varco: '#c800c8', window: '#0096e6' }
const PAL = ['#f5c6a5', '#b9e3c6', '#c9c3f2', '#f7e19b', '#a9d8f0', '#f2b8d2', '#d6e7a6', '#e7cfa9', '#b3e0dc', '#e9b9b0']

export function overlaySvg(plan: RawPlan, cad: { dataUrl: string; w: number; h: number }): string {
  const [a, b, c, d, e, f] = plan.source.toImage
  // l'immagine di partenza puo' avere una misura diversa da quella su cui si e' calcolato toImage
  const sx = cad.w / plan.source.imgW, sy = cad.h / plan.source.imgH
  const T = (p: Pt): Pt => [(a * p[0] + c * p[1] + e) * sx, (b * p[0] + d * p[1] + f) * sy]
  const pts = (ps: Pt[]) => ps.map(p => T(p).map(v => v.toFixed(1)).join(',')).join(' ')
  const quad = (p0: Pt, p1: Pt, t: number): Pt[] => {
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1e-6, nx = -(p1[1] - p0[1]) / L * t / 2, ny = (p1[0] - p0[0]) / L * t / 2
    return [[p0[0] + nx, p0[1] + ny], [p1[0] + nx, p1[1] + ny], [p1[0] - nx, p1[1] - ny], [p0[0] - nx, p0[1] - ny]]
  }
  const fs = Math.max(11, Math.min(cad.w, cad.h) / 55)
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${cad.w}" height="${cad.h}" viewBox="0 0 ${cad.w} ${cad.h}">`
  s += `<rect width="100%" height="100%" fill="#fff"/><image href="${cad.dataUrl}" width="${cad.w}" height="${cad.h}" opacity="0.35"/>`
  plan.rooms.forEach((r, i) => { s += `<polygon points="${pts(r.poly)}" fill="${PAL[i % PAL.length]}" fill-opacity="0.85"/>` })
  for (const w of plan.walls) s += `<polygon points="${pts(quad(w.a, w.b, w.t))}" fill="#282828"/>`
  const labels: string[] = []
  for (const o of plan.openings) {
    s += `<polygon points="${pts(quad(o.a, o.b, o.t + 0.02))}" fill="${COL[o.type]}"${o.suspect ? ' stroke="#ff0000" stroke-width="3"' : ''}/>`
    const m = T([(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2])
    if (o.label) labels.push(`<path d="${textPath(o.label, m[0], m[1] - fs * 1.1, fs)}" stroke="#fff" stroke-width="${fs / 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${textPath(o.label, m[0], m[1] - fs * 1.1, fs)}" stroke="${COL[o.type]}" stroke-width="${fs / 7}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
  }
  for (const w of plan.walls) {
    if (!w.label) continue
    const m = T([(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2])
    labels.push(`<path d="${textPath(w.label, m[0], m[1], fs * 0.6)}" stroke="#fff" stroke-width="${fs / 5}" fill="none"/><path d="${textPath(w.label, m[0], m[1], fs * 0.6)}" stroke="#a00000" stroke-width="${fs / 12}" fill="none"/>`)
  }
  for (const r of plan.rooms) {
    const m = T(r.center), txt = `R${r.id} ${String(r.area)}`
    labels.push(`<path d="${textPath(txt, m[0], m[1], fs * 1.1)}" stroke="#fff" stroke-width="${fs / 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${textPath(txt, m[0], m[1], fs * 1.1)}" stroke="#000" stroke-width="${fs / 7}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
  }
  return s + labels.join('') + '</svg>'
}

// JPEG della sovrapposizione, lato lungo al massimo maxSide
export async function overlayJpeg(plan: RawPlan, cadPng: Buffer, maxSide = 1400): Promise<Buffer> {
  const meta = await sharp(cadPng).metadata()
  const w = meta.width ?? plan.source.imgW, h = meta.height ?? plan.source.imgH
  const small = await sharp(cadPng).flatten({ background: '#ffffff' }).jpeg({ quality: 70 }).toBuffer()
  const svg = overlaySvg(plan, { dataUrl: `data:image/jpeg;base64,${small.toString('base64')}`, w, h })
  return sharp(Buffer.from(svg)).resize(maxSide, maxSide, { fit: 'inside' }).jpeg({ quality: 86 }).toBuffer()
}
