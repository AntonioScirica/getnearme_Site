import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { OUT, SOFT, prog } from '../lib/motion'

// Parole che salgono da dietro una maschera, una dopo l'altra (Vivace).
// "parts": pezzi con stile proprio (es. una parola in serif corsivo). "out": fotogramma in cui escono verso l'alto.
export type Part = { text: string; style?: CSSProperties }
export function MaskWords({ text, parts, start, stagger = 2, dur = 20, out, style }: { text?: string; parts?: Part[]; start: number; stagger?: number; dur?: number; out?: number; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const words = (parts ?? [{ text: text ?? '' }]).flatMap(p => p.text.split(' ').filter(Boolean).map(w => ({ w, style: p.style })))
  return (
    <div style={style}>
      {words.map(({ w, style: ws }, i) => {
        const p = prog(f, start + i * stagger, dur)
        const q = out === undefined ? 0 : prog(f, out + i, 12)
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.06em 0.04em 0.16em', margin: '-0.06em -0.04em -0.16em', marginRight: i < words.length - 1 ? '0.2em' : '-0.04em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 135 - q * 135}%)`, opacity: 1 - q, ...ws }}>{w}</span>
          </span>
        )
      })}
    </div>
  )
}

// Un blocco che entra da dietro una maschera, dal basso (Vivace)
export function MaskUp({ start, dur = 20, out, children, style }: { start: number; dur?: number; out?: number; children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const p = prog(f, start, dur)
  const q = out === undefined ? 0 : prog(f, out, 12)
  return (
    <div style={{ overflow: 'hidden', padding: '8px 4px 12px', margin: '-8px -4px -12px', ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 135 - q * 135}%)`, opacity: 1 - q }}>{children}</div>
    </div>
  )
}

// Dissolvenza con lieve salita (Elegante)
export function FadeUp({ start, dur = 24, dy = 14, out, children, style }: { start: number; dur?: number; dy?: number; out?: number; children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const p = prog(f, start, dur, SOFT)
  const q = out === undefined ? 0 : prog(f, out, 16, SOFT)
  return <div style={{ opacity: p * (1 - q), transform: `translateY(${(1 - p) * dy - q * 8}px)`, ...style }}>{children}</div>
}

// Riga sottile che si disegna da sinistra (o dal centro)
export function DrawLine({ start, dur = 26, width, height = 2, color, origin = 'left', out, style }: { start: number; dur?: number; width: number; height?: number; color: string; origin?: 'left' | 'center'; out?: number; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const p = prog(f, start, dur)
  const q = out === undefined ? 0 : prog(f, out, 16)
  return <div style={{ width, height, background: color, transform: `scaleX(${p})`, transformOrigin: origin, opacity: 1 - q, ...style }} />
}

// opacita' di un intero gruppo che esce (dissolvenza)
export const useFadeOut = (out: number | undefined, dur = 14) => {
  const f = useCurrentFrame()
  return out === undefined ? 1 : interpolate(f, [out, out + dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: OUT })
}
