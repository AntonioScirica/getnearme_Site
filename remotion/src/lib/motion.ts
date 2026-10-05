import { Easing, interpolate, staticFile } from 'remotion'

// Curve uniche per tutto il progetto: uscita morbida e decisa, mai rimbalzi.
export const OUT = Easing.bezier(0.16, 1, 0.3, 1) // expo out
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1)
export const SOFT = Easing.bezier(0.33, 1, 0.68, 1) // cubic out (Elegante)

// 0..1 da start a start+dur, con curva
export const prog = (f: number, start: number, dur: number, easing = OUT) =>
  interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })

// foto e logo: URL assoluti (produzione, Lambda) o file in public/ (Studio, render di prova)
export const src = (s: string) => (/^(https?:|data:|blob:)/i.test(s) ? s : staticFile(s.replace(/^\/+/, '')))
