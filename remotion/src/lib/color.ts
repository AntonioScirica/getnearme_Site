// Colore dell'agente: testo sopra il colore scelto per contrasto (WCAG), varianti per fondo chiaro e scuro.
export const INK = '#1d1d1f'
export const NIGHT = '#0f0f10'
export const RED = '#d92d20'
export const DEFAULT_BRAND = '#537eec'

type RGB = [number, number, number]
export function normalizeHex(c: string): string {
  const s = (c || '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(s)) return `#${[...s].map(x => x + x).join('')}`.toLowerCase()
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`.toLowerCase()
  return DEFAULT_BRAND
}
const rgb = (hex: string): RGB => {
  const h = normalizeHex(hex)
  return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as RGB
}
const toHex = (c: RGB) => `#${c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`
export function luminance(hex: string): number {
  const v = rgb(hex).map(x => x / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
export function mix(a: string, b: string, t: number): string {
  const p = rgb(a), q = rgb(b)
  return toHex([0, 1, 2].map(i => p[i] + (q[i] - p[i]) * t) as RGB)
}
// avvicina il colore a "verso" finche' il contrasto con "fondo" non basta
function push(c: string, toward: string, bg: string, min: number): string {
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const m = mix(c, toward, t)
    if (contrast(m, bg) >= min) return m
  }
  return toward
}

export type Palette = {
  brand: string // il colore dell'agente, com'e'
  on: string // testo sopra il colore (bianco o ink); i testi sopra sono tutti grandi, quindi soglia 3:1 come da WCAG per testo grande, preferendo il bianco
  deep: string // il colore come testo/icona su fondo bianco (>= 4.5:1)
  bright: string // il colore come accento su foto scure o fondo notte (>= 3:1)
}
export function palette(color: string): Palette {
  const brand = normalizeHex(color)
  const on = contrast('#ffffff', brand) >= 3 ? '#ffffff' : INK
  return { brand, on, deep: push(brand, INK, '#ffffff', 4.5), bright: push(brand, '#ffffff', NIGHT, 3) }
}
