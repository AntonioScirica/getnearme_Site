// Durate in fotogrammi (30 fps). Le stesse funzioni servono a calculateMetadata e alle composizioni.
export const FPS = 30
export const W = 1080
export const H = 1920
// safe area dei Reels: niente testo importante nei primi 220 px, negli ultimi 380 px e nei 60 px ai lati
export const SAFE = { top: 220, bottom: 1540, side: 72 }

export type Style = 'vivace' | 'elegante'
export type AnnuncioTiming = {
  T: number // transizione tra le foto
  starts: number[] // inizio di ogni foto
  lens: number[] // quanto ogni foto resta "sua" (la successiva entra alla fine, sopra)
  endStart: number // inizio della chiusura con l'agente
  END: number
  total: number
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function annuncioTiming(n: number, style: Style): AnnuncioTiming {
  const viv = style === 'vivace'
  const count = clamp(n, 1, 8)
  const T = viv ? 18 : 24
  const EXTRA = viv ? 24 : 18 // la prima foto resta un po' di piu': c'e' il titolo
  const END = viv ? 96 : 105
  // circa 3 s a foto, ma almeno ~15 s in tutto (con poche foto ogni scena dura di piu', al massimo 5 s)
  const S = Math.round(clamp((450 - EXTRA - END) / count, 90, 150))
  const lens = Array.from({ length: count }, (_, i) => S + (i === 0 ? EXTRA : 0))
  const starts: number[] = []
  let t = 0
  for (const l of lens) { starts.push(t); t += l }
  return { T, starts, lens, endStart: t, END, total: t + END }
}

// Venduto / Affittato: foto con il timbro 5 s, chiusura 3 s
export const VENDUTO = { photo: 150, END: 90, total: 240 }
