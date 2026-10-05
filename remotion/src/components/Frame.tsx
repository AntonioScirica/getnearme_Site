import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { SOFT, prog } from '../lib/motion'

// Elegante: cornice a filo (hairline 2 px bianco 60%) e vignettatura delicata
export function Vignette({ strength = 0.5 }: { strength?: number }) {
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)` }} />
}
export function Hairline({ start = 6 }: { start?: number }) {
  const f = useCurrentFrame()
  const p = prog(f, start, 30, SOFT)
  return <div style={{ position: 'absolute', inset: 40, border: '2px solid rgba(255,255,255,0.6)', opacity: p, transform: `scale(${1.012 - 0.012 * p})` }} />
}
