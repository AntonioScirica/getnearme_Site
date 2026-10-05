import { truncate } from '../lib/format'

// Titolo: corpo in base alla lunghezza, al massimo 3 righe nella larghezza utile (936 px)
export function titleFit(title: string, serif: boolean) {
  if (serif) {
    const t = truncate(title, 70)
    const size = t.length <= 24 ? 128 : t.length <= 44 ? 108 : 92
    const lines = Math.max(1, Math.ceil((t.length * size * 0.44) / 920))
    return { text: t, size, lines: Math.min(3, lines) }
  }
  const t = truncate(title, 62)
  const size = t.length <= 20 ? 108 : t.length <= 36 ? 96 : t.length <= 54 ? 80 : 72
  const lines = Math.max(1, Math.ceil((t.length * size * 0.58) / 936))
  return { text: t, size, lines: Math.min(3, lines) }
}

// prezzo: corpo in base ai caratteri, cosi' "€ 1.250.000" sta nel blocco
export const priceSize = (s: string, base: number) => (s.length <= 9 ? base : s.length <= 11 ? Math.round(base * 0.88) : Math.round(base * 0.74))
