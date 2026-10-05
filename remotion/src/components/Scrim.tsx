import { AbsoluteFill } from 'remotion'

// Ombra sotto i testi: dal basso fino a "reach" px resta abbastanza scura (>= 0.68) per il contrasto AA del testo bianco
// anche su foto chiare, poi sfuma in ~420 px. top: ombra leggera in alto per barra e contatore.
export function Scrim({ reach, top = 0, strength = 1 }: { reach: number; top?: number; strength?: number }) {
  const r = Math.max(0, reach)
  const a = (v: number) => (v * strength).toFixed(3)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {r > 0 && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${a(0.86)}) 0px, rgba(0,0,0,${a(0.7)}) ${r}px, rgba(0,0,0,${a(0.42)}) ${r + 150}px, rgba(0,0,0,${a(0.14)}) ${r + 300}px, rgba(0,0,0,0) ${r + 440}px)`,
          }}
        />
      )}
      {top > 0 && <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${top}) 0px, rgba(0,0,0,${(top * 0.5).toFixed(3)}) 260px, rgba(0,0,0,0) 520px)` }} />}
    </AbsoluteFill>
  )
}
