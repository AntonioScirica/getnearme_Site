import { AbsoluteFill, Sequence, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'
import type { VendutoProps } from '../schema'
import { ClosingVivace, SERIF_ACCENT } from '../components/Closing'
import { Icon } from '../components/Icons'
import { KenBurns } from '../components/Photo'
import { MaskUp, MaskWords } from '../components/Reveal'
import { Scrim } from '../components/Scrim'
import { StagedLabel } from '../components/Staged'
import { INK, RED, palette } from '../lib/color'
import { SANS } from '../lib/fonts'
import { clean, daysText, doneWord } from '../lib/format'
import { SAFE, VENDUTO } from '../lib/timing'
import { Dust, Stamp, impactFrame } from './Stamp'

const AT = 36 // il timbro parte a 1,2 s
const STAMP_Y = 800

export function VendutoVivace(p: VendutoProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pal = palette(p.agent.color)
  const hit = AT + impactFrame(fps)
  const place = clean(p.place)
  const days = daysText(p.days)
  // micro tremolio di tutto il fotogramma all'impatto (3 fotogrammi, sempre piu' piccolo)
  const k = f - hit
  const amp = k >= 0 && k < 3 ? [16, 9, 4][k] : 0
  const sx = amp ? (random(`sx${k}`) - 0.5) * 2 * amp : 0
  const sy = amp ? (random(`sy${k}`) - 0.5) * 2 * amp : 0
  const dim = interpolate(f, [hit - 2, hit + 10], [0, 0.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const capReach = 1920 - 1120 + 60
  const small = clean(p.agent.agency) || clean(p.agent.name)
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0c', fontFamily: SANS }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${amp ? 1.012 : 1})` }}>
        <KenBurns url={p.photo.src} len={VENDUTO.total} from={1.03} to={1.16} drift={1.2} />
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
        <Scrim reach={place || days ? capReach : 0} top={0.3} strength={interpolate(f, [40, 70], [0.35, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
        <Dust at={hit} y={STAMP_Y} />
        <Stamp word={doneWord(p.contract)} small={small.length <= 26 ? small : ''} at={AT} y={STAMP_Y} />
        <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1130, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, color: '#fff' }}>
          {place && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: '100%' }}>
              <MaskUp start={hit + 16}><Icon name="pin" size={56} color="#fff" stroke={2.2} /></MaskUp>
              <MaskWords text={place} start={hit + 16} stagger={2} style={{ fontSize: place.length > 22 ? 52 : 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, textAlign: 'center' }} />
            </div>
          )}
          {days && (
            <MaskUp start={hit + 26}>
              <div style={{ height: 96, padding: '0 40px 0 32px', borderRadius: 999, background: '#fff', color: INK, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Icon name="timer" size={44} color={RED} stroke={2.3} />
                <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{days}</span>
              </div>
            </MaskUp>
          )}
        </div>
        {p.photo.staged && <StagedLabel variant="vivace" />}
      </AbsoluteFill>
      <Sequence from={VENDUTO.photo}>
        <ClosingVivace
          agent={p.agent}
          pal={pal}
          headline={[[{ text: 'Hai una casa' }], [{ text: p.contract === 'affitto' ? 'da affittare?' : 'da vendere?' }], [{ text: 'Chiamami', style: SERIF_ACCENT }]]}
        />
      </Sequence>
    </AbsoluteFill>
  )
}
