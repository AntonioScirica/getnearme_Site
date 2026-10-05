import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'
import { src } from '../lib/motion'

// Foto a tutto schermo con movimento lento continuo (zoom + leggera deriva). "len": durata visibile della foto.
export function KenBurns({ url, len, from = 1.04, to = 1.13, drift = 1.6, dir = 1 }: { url: string; len: number; from?: number; to?: number; drift?: number; dir?: number }) {
  const f = useCurrentFrame()
  const t = interpolate(f, [0, Math.max(1, len)], [0, 1], { extrapolateRight: 'clamp' })
  const s = from + (to - from) * t
  const x = (t - 0.5) * drift * dir
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#111' }}>
      <Img src={src(url)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s}) translateX(${x}%)`, willChange: 'transform' }} />
    </AbsoluteFill>
  )
}
