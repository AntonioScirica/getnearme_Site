import { Audio, interpolate, useVideoConfig } from 'remotion'
import { src } from '../lib/motion'

// Musica opzionale (per ora resta nel montaggio esistente): entra in 0,4 s ed esce in 1,5 s
export function Music({ url }: { url?: string }) {
  const { durationInFrames, fps } = useVideoConfig()
  if (!url) return null
  return (
    <Audio
      src={src(url)}
      volume={f => 0.85 * interpolate(f, [0, 0.4 * fps, durationInFrames - 1.5 * fps, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
    />
  )
}
