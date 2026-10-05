import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { RED } from '../lib/color'
import { SANS } from '../lib/fonts'

// Timbro VENDUTO / AFFITTATO: entra enorme e "sbatte" (scala 2,2 -> 1, spring rigido), inclinato di -8 gradi,
// inchiostro sgranato (maschera di rumore feTurbulence) su un cartoncino chiaro per il contrasto.
export const STAMP_SPRING = { stiffness: 520, damping: 30, mass: 0.75 }

// primo fotogramma in cui il timbro tocca la foto (scala ~1): li' partono tremolio e polvere
export function impactFrame(fps: number): number {
  for (let k = 0; k < 30; k++) if (spring({ frame: k, fps, config: STAMP_SPRING }) >= 0.985) return k
  return 6
}

export function Stamp({ word, small, at, y }: { word: string; small: string; at: number; y: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - at, fps, config: STAMP_SPRING })
  const scale = 2.2 - 1.2 * s
  const rot = -8 - (1 - s) * 7
  const opacity = interpolate(f, [at, at + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const W = 860
  const size = Math.min(168, Math.round(700 / (word.length * 0.7)))
  const hasSmall = !!small
  const H = size + 150 + (hasSmall ? 46 : 0)
  const textY = (hasSmall ? 46 : 0) + 75 + size * 0.86
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y - H / 2, height: H, display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale}) rotate(${rot}deg)`, filter: `drop-shadow(0 ${18 * s}px ${36 * s}px rgba(0,0,0,0.35))` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="ink" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={11} result="fine" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={2} seed={4} result="coarse" />
            <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 3.85" result="fa" />
            <feColorMatrix in="coarse" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.25" result="ca" />
            <feComposite in="fa" in2="ca" operator="arithmetic" k1={1} k2={0} k3={0} k4={0} result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
          <filter id="paper" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={2} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.42" result="na" />
            <feComposite in="SourceGraphic" in2="na" operator="in" />
          </filter>
        </defs>
        <rect x={6} y={6} width={W - 12} height={H - 12} rx={32} fill="#fbf7f0" opacity={0.95} filter="url(#paper)" />
        <g filter="url(#ink)" fill="none" stroke={RED}>
          <rect x={20} y={20} width={W - 40} height={H - 40} rx={24} strokeWidth={14} />
          <rect x={44} y={44} width={W - 88} height={H - 88} rx={12} strokeWidth={4} />
          {hasSmall && (
            <text x={W / 2} y={44 + 52} textAnchor="middle" fill={RED} stroke="none" style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.3em' }}>{small.toUpperCase()}</text>
          )}
          <text x={W / 2} y={textY} textAnchor="middle" fill={RED} stroke="none" textLength={W - 200} lengthAdjust="spacingAndGlyphs" style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: '0.04em' }}>{word.toUpperCase()}</text>
        </g>
      </svg>
    </div>
  )
}

// sbuffo di polvere all'impatto: granelli che schizzano dai bordi e qualche nuvoletta morbida
export function Dust({ at, y }: { at: number; y: number }) {
  const f = useCurrentFrame() - at
  if (f < 0 || f > 34) return null
  const grains = Array.from({ length: 48 }, (_, i) => {
    const r = (k: string) => random(`dust-${i}-${k}`)
    const side = r('s')
    // punto di partenza sul bordo del timbro (ellisse 440 x 170)
    const ang = r('a') * Math.PI * 2
    const sx = Math.cos(ang) * 440, sy = Math.sin(ang) * 170
    const speed = 10 + r('v') * 22
    const dist = (speed * (1 - Math.pow(0.86, f))) / (1 - 0.86)
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.7 + 0.08 * f * f
    const size = 4 + r('z') * (side > 0.8 ? 14 : 8)
    const o = interpolate(f, [0, 2, 26], [0, 0.95, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return { x: 540 + sx + dx, y: y + sy + dy, size, o }
  })
  const puffs = Array.from({ length: 7 }, (_, i) => {
    const r = (k: string) => random(`puff-${i}-${k}`)
    const ang = (i / 7) * Math.PI * 2 + r('a') * 0.6
    const grow = interpolate(f, [0, 30], [0.5, 1.6], { extrapolateRight: 'clamp' })
    const o = interpolate(f, [0, 3, 30], [0, 0.55, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return { x: 540 + Math.cos(ang) * (420 + f * 3), y: y + Math.sin(ang) * (170 + f * 2), size: (90 + r('z') * 90) * grow, o }
  })
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {puffs.map((p, i) => (
        <div key={`p${i}`} style={{ position: 'absolute', left: p.x - p.size / 2, top: p.y - p.size / 2, width: p.size, height: p.size, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,228,214,0.9) 0%, rgba(236,228,214,0) 70%)', opacity: p.o }} />
      ))}
      {grains.map((g, i) => (
        <div key={i} style={{ position: 'absolute', left: g.x, top: g.y, width: g.size, height: g.size, borderRadius: '50%', background: '#efe8dc', opacity: g.o, filter: 'blur(0.6px)' }} />
      ))}
    </AbsoluteFill>
  )
}
