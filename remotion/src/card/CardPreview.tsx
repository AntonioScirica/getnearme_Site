import { AbsoluteFill, Freeze, Sequence, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { Intro, PriceBlock, PushLayer } from '../annuncio/Vivace'
import { titleFit } from '../annuncio/text'
import { Icon } from '../components/Icons'
import { KenBurns } from '../components/Photo'
import { MaskUp, MaskWords } from '../components/Reveal'
import { INK, RED, palette, type Palette } from '../lib/color'
import { SANS } from '../lib/fonts'
import { clean, daysText, doneWord, facts as factsOf, parsePrice } from '../lib/format'
import { prog } from '../lib/motion'
import { Dust, Stamp, impactFrame } from '../venduto/Stamp'
import type { AnnuncioProps, VendutoProps } from '../schema'

// Anteprime delle card dei template nella chat (05/10/2026): card orizzontali 1280x720 a tutto riquadro, con le
// stesse animazioni dello stile Vivace (testi in maschera, prezzo che si srotola e sale, spinta con la lama di colore,
// timbro che sbatte). I blocchi del verticale (pensati per 1080 di larghezza) entrano in un riquadro scalato in basso
// a sinistra. Angolo in alto a destra libero (~220x120): li' la card mette il badge dei crediti.
// L'ultimo mezzo secondo torna al primo fotogramma (Freeze), cosi' il loop non salta.
export const CARD = { w: 1280, h: 720 }
const K = 0.7 // scala dei blocchi del verticale
const PAD = 56
// sul telefono la card e' 4:3 (object-cover): restano visibili solo i 960 px centrali, quindi testi da x = 200
const LEFT = 200
// i blocchi del Vivace stanno a bottom 476 e left 72 dentro 1080x1920: il riquadro li porta a PAD dal bordo
const Box = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', left: LEFT - 72 * K, bottom: PAD - 476 * K, width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: 'bottom left' }}>{children}</div>
)
// ombra a sinistra e in basso per il contrasto del testo bianco
const Shade = ({ a = 1 }: { a?: number }) => (
  <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(0,0,0,${0.72 * a}) 0%, rgba(0,0,0,${0.38 * a}) 45%, rgba(0,0,0,0) 75%), linear-gradient(to right, rgba(0,0,0,${0.35 * a}) 0%, rgba(0,0,0,0) 60%)` }} />
)
// ritorno al primo fotogramma negli ultimi "len" fotogrammi
function LoopBack({ total, len, children }: { total: number; len: number; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const o = interpolate(f, [total - len, total - 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  if (o <= 0) return null
  return <AbsoluteFill style={{ opacity: o }}><Freeze frame={0}>{children}</Freeze></AbsoluteFill>
}

// ---- Video dell'annuncio ------------------------------------------------------------------------------
const T = 18
const STARTS = [0, 74, 152], LENS = [74, 78, 48]
export const CARD_ANNUNCIO_LEN = 200

function Segments({ pal, label }: { pal: Palette; label: string }) {
  const f = useCurrentFrame()
  return (
    <div style={{ position: 'absolute', top: 40, left: LEFT, width: 420, opacity: prog(f, 2, 14) }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {STARTS.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 8, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: pal.bright, transform: `scaleX(${interpolate(f, [s, s + LENS[i]], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`, transformOrigin: 'left' }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>{label}</div>
    </div>
  )
}

const Opening = ({ p }: { p: AnnuncioProps }) => (
  <>
    <KenBurns url={p.photos[0].src} len={LENS[0] + T} from={1.04} to={1.1} />
    <Shade />
  </>
)

export function CardAnnuncio(p: AnnuncioProps) {
  const pal = palette(p.agent.color)
  const title = titleFit(p.title, false)
  const price = parsePrice(p.price, p.contract)
  const facts = factsOf(p.mq, p.rooms)
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0c', fontFamily: SANS }}>
      {STARTS.map((s, i) => {
        const last = i === STARTS.length - 1
        return (
          <Sequence key={i} from={s} durationInFrames={LENS[i] + (last ? 0 : T + 6)}>
            <PushLayer first={i === 0} last={last} len={LENS[i]} T={T} pal={pal}>
              {i === 0 ? <Opening p={p} /> : <><KenBurns url={p.photos[i].src} len={LENS[i] + T} dir={i % 2 ? -1 : 1} from={i % 2 ? 1.1 : 1.04} to={i % 2 ? 1.04 : 1.1} /><Shade a={i === 1 ? 1 : 0.5} /></>}
              {i === 0 && <Box><Intro contract={p.contract} title={title} place={clean(p.place)} pal={pal} /></Box>}
              {i === 1 && <Sequence from={T - 4} layout="none"><Box><PriceBlock price={price} facts={facts} contract={p.contract} pal={pal} /></Box></Sequence>}
            </PushLayer>
          </Sequence>
        )
      })}
      <Segments pal={pal} label={clean(p.agent.agency) || clean(p.agent.name)} />
      <LoopBack total={CARD_ANNUNCIO_LEN} len={14}><Opening p={p} /></LoopBack>
    </AbsoluteFill>
  )
}

// ---- Video Venduto ------------------------------------------------------------------------------------
const AT = 10 // il timbro tocca la foto a ~0,6 s
export const CARD_VENDUTO_LEN = 150
const STAMP_Y = 420 // nel riquadro scalato (centro del timbro)

const Villa = ({ p }: { p: VendutoProps }) => <KenBurns url={p.photo.src} len={CARD_VENDUTO_LEN} from={1.03} to={1.12} drift={1.2} />

export function CardVenduto(p: VendutoProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hit = AT + impactFrame(fps)
  const place = clean(p.place)
  const days = daysText(p.days)
  const small = clean(p.agent.agency) || clean(p.agent.name)
  // tremolio di tutto il fotogramma all'impatto, come nel video vero
  const k = f - hit
  const amp = k >= 0 && k < 3 ? [10, 6, 3][k] : 0
  const sx = amp ? (random(`sx${k}`) - 0.5) * 2 * amp : 0
  const sy = amp ? (random(`sy${k}`) - 0.5) * 2 * amp : 0
  const dim = interpolate(f, [hit - 2, hit + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0c', fontFamily: SANS }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${amp ? 1.01 : 1})` }}>
        <Villa p={p} />
        <AbsoluteFill style={{ background: `linear-gradient(to right, rgba(0,0,0,${0.5 * dim}) 0%, rgba(0,0,0,${0.3 * dim}) 50%, rgba(0,0,0,${0.06 * dim}) 85%)` }} />
        <div style={{ position: 'absolute', left: LEFT - 50, top: 0, width: 1080, height: 1920, transform: `scale(${K * 0.86})`, transformOrigin: 'top left' }}>
          <Dust at={hit} y={STAMP_Y} />
          <Stamp word={doneWord(p.contract)} small={small.length <= 26 ? small : ''} at={AT} y={STAMP_Y} />
          <div style={{ position: 'absolute', left: 60, right: 60, top: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, color: '#fff' }}>
            {place && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <MaskUp start={hit + 14}><Icon name="pin" size={64} color="#fff" stroke={2.2} /></MaskUp>
                <MaskWords text={place} start={hit + 14} stagger={2} style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, textShadow: '0 2px 24px rgba(0,0,0,0.3)' }} />
              </div>
            )}
            {days && (
              <MaskUp start={hit + 24}>
                <div style={{ height: 104, padding: '0 44px 0 34px', borderRadius: 999, background: '#fff', color: INK, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Icon name="timer" size={48} color={RED} stroke={2.3} />
                  <span style={{ fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{days}</span>
                </div>
              </MaskUp>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <LoopBack total={CARD_VENDUTO_LEN} len={18}><Villa p={p} /></LoopBack>
    </AbsoluteFill>
  )
}
