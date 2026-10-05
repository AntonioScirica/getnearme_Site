import G from './glyphs.json'

// Testo dei video Annuncio e Venduto come contorni SVG (Plus Jakarta Sans, vedi scripts/reel-glyphs.py):
// sul server non ci sono font installati, cosi' sharp disegna le lettere senza cercarne uno. Misure esatte (con le
// coppie di crenatura), quindi badge e righe si costruiscono intorno al testo vero.
export type Weight = 500 | 700 | 800
type Face = { upm: number; asc: number; desc: number; glyphs: Record<string, [number, string]>; kern: Record<string, number> }
const FACES = G as unknown as Record<string, Face>

// niente caratteri che il font non ha; trattini lunghi -> virgola (regola dei testi della piattaforma)
export const clean = (s: string) => s.replace(/\s*[–—]\s*/g, ', ').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim()

export function measure(s: string, size: number, w: Weight, track = 0): number {
  const f = FACES[w], k = size / f.upm
  let x = 0
  const chars = [...s]
  chars.forEach((c, i) => {
    const g = f.glyphs[c] ?? f.glyphs['?']
    x += g[0] * k + (i < chars.length - 1 ? (f.kern[c + chars[i + 1]] ?? 0) * k + track : 0)
  })
  return x
}

// testo su una riga; y = linea di base
export function text(s: string, o: { x: number; y: number; size: number; w: Weight; fill: string; anchor?: 'start' | 'middle' | 'end'; track?: number; opacity?: number }): string {
  const f = FACES[o.w], k = o.size / f.upm, track = o.track ?? 0
  const width = measure(s, o.size, o.w, track)
  let x = o.anchor === 'middle' ? o.x - width / 2 : o.anchor === 'end' ? o.x - width : o.x
  const chars = [...s]
  let out = ''
  chars.forEach((c, i) => {
    const g = f.glyphs[c] ?? f.glyphs['?']
    if (g[1]) out += `<path transform="translate(${x.toFixed(2)} ${o.y.toFixed(2)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})" d="${g[1]}"/>`
    x += g[0] * k + (i < chars.length - 1 ? (f.kern[c + chars[i + 1]] ?? 0) * k + track : 0)
  })
  return `<g fill="${o.fill}"${o.opacity !== undefined ? ` fill-opacity="${o.opacity}"` : ''}>${out}</g>`
}

// a capo per parole entro maxW, al massimo maxLines righe (l'ultima con i puntini se non ci sta)
export function wrap(s: string, size: number, w: Weight, maxW: number, maxLines: number): string[] {
  const words = clean(s).split(' ').filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (measure(next, size, w) <= maxW || !cur) { cur = next; continue }
    lines.push(cur); cur = word
  }
  if (cur) lines.push(cur)
  if (lines.length <= maxLines) return lines.map(l => fit(l, size, w, maxW))
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = fit(`${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, size, w, maxW)
  return kept
}
// una riga che non ci sta: tagliata con i puntini
export function fit(s: string, size: number, w: Weight, maxW: number): string {
  if (measure(s, size, w) <= maxW) return s
  let t = s
  while (t.length > 1 && measure(`${t}…`, size, w) > maxW) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}
