import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion'
import type { VendutoProps } from '../schema'
import { ClosingElegante } from '../components/Closing'
import { Hairline, Vignette } from '../components/Frame'
import { KenBurns } from '../components/Photo'
import { DrawLine, FadeUp } from '../components/Reveal'
import { StagedLabel } from '../components/Staged'
import { palette } from '../lib/color'
import { SANS, SERIF } from '../lib/fonts'
import { clean, daysText, doneWord } from '../lib/format'
import { SOFT, prog } from '../lib/motion'
import { SAFE, VENDUTO } from '../lib/timing'

// Venduto Elegante: niente timbro. "Venduto" in serif corsivo che compare lettera per lettera, una linea che si disegna,
// zona e giorni in maiuscolo tracciato.
const TRACK = { fontFamily: SANS, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.26em' }

export function VendutoElegante(p: VendutoProps) {
  const f = useCurrentFrame()
  const pal = palette(p.agent.color)
  const word = doneWord(p.contract)
  const size = Math.min(250, Math.round(880 / (word.length * 0.43)))
  const place = clean(p.place)
  const days = daysText(p.days)
  const dim = interpolate(f, [0, 20, 50], [0.12, 0.12, 0.46], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SOFT })
  const label = clean(p.agent.agency) || clean(p.agent.name)
  const letters = [...word]
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f10', color: '#fff' }}>
      <AbsoluteFill style={{ opacity: prog(f, 0, 20, SOFT) }}>
        <KenBurns url={p.photo.src} len={VENDUTO.total} from={1.02} to={1.09} drift={0.6} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(10,10,11,${dim})` }} />
      <Vignette strength={0.55} />
      {label && (
        <FadeUp start={10} dur={30} style={{ position: 'absolute', top: SAFE.top + 24, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ ...TRACK, fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
        </FadeUp>
      )}
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: size, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', textShadow: '0 4px 40px rgba(0,0,0,0.3)' }}>
          {letters.map((c, i) => {
            const q = prog(f, 30 + i * 4, 26, SOFT)
            return <span key={i} style={{ display: 'inline-block', opacity: q, transform: `translateY(${(1 - q) * 26}px)`, filter: `blur(${(1 - q) * 10}px)` }}>{c}</span>
          })}
        </div>
        <DrawLine start={30 + letters.length * 4 + 6} dur={30} width={220} color="rgba(255,255,255,0.8)" origin="center" style={{ margin: '44px 0 44px' }} />
        {place && (
          <FadeUp start={30 + letters.length * 4 + 16}>
            <div style={{ ...TRACK, fontSize: place.length > 24 ? 32 : 38, textAlign: 'center', maxWidth: 920 }}>{place}</div>
          </FadeUp>
        )}
        {days && (
          <FadeUp start={30 + letters.length * 4 + 24} style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: pal.bright }} />
            <span style={{ ...TRACK, fontSize: 30, color: 'rgba(255,255,255,0.86)' }}>{days}</span>
          </FadeUp>
        )}
      </div>
      {p.photo.staged && <StagedLabel variant="elegante" opacity={interpolate(f, [10, 28, VENDUTO.photo - 10, VENDUTO.photo], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />}
      <Sequence from={VENDUTO.photo}>
        <ClosingElegante
          agent={p.agent}
          pal={pal}
          headline={[[{ text: 'Hai una casa' }], [{ text: p.contract === 'affitto' ? 'da affittare?' : 'da vendere?' }], [{ text: 'Chiamami', style: { fontStyle: 'italic' } }]]}
        />
      </Sequence>
      <Hairline />
    </AbsoluteFill>
  )
}
