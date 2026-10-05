import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from 'remotion'
import type { AnnuncioProps } from '../schema'
import { ClosingVivace, SERIF_ACCENT } from '../components/Closing'
import { Icon } from '../components/Icons'
import { KenBurns } from '../components/Photo'
import { MaskUp, MaskWords } from '../components/Reveal'
import { Scrim } from '../components/Scrim'
import { StagedLabel } from '../components/Staged'
import { INK, palette, type Palette } from '../lib/color'
import { SANS } from '../lib/fonts'
import { clean, contractWord, euro, facts as factsOf, groupIt, parsePrice, type Fact, type Price } from '../lib/format'
import { OUT, prog } from '../lib/motion'
import { SAFE, annuncioTiming, type AnnuncioTiming } from '../lib/timing'
import { priceSize, titleFit } from './text'

// Stile Vivace, "editoriale cinetico": spinta direzionale con parallasse tra le foto, testi in maschera,
// prezzo eroe in un blocco del colore dell'agente che si srotola, barra a segmenti stile storie.

const PUSH = Easing.bezier(0.76, 0, 0.18, 1)
const BOTTOM = 1920 - (SAFE.bottom - 96) // i blocchi di testo finiscono qui; sotto resta la dicitura "arredata virtualmente"

export function AnnuncioVivace(p: AnnuncioProps) {
  const n = Math.min(8, p.photos.length)
  const t = annuncioTiming(n, 'vivace')
  const pal = palette(p.agent.color)
  const price = parsePrice(p.price, p.contract)
  const facts = factsOf(p.mq, p.rooms)
  const hasPrice = !!price || facts.length > 0
  const title = titleFit(p.title, false)
  const place = clean(p.place)
  // con una sola foto titolo e prezzo stanno sulla stessa scena, uno dopo l'altro
  const one = n === 1
  const priceFrom = one ? 96 : t.T - 4
  const introOut = one && hasPrice ? 82 : undefined
  const introReach = BOTTOM + (place ? 76 : 0) + title.lines * title.size * 1.02 + 92 + 40
  const priceReach = BOTTOM + (facts.length ? 124 : 0) + (price ? 228 : 0) + 80

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0c', fontFamily: SANS }}>
      {p.photos.slice(0, n).map((ph, i) => {
        const last = i === n - 1
        const reach = Math.max(i === 0 ? introReach : 0, (i === 1 || one) && hasPrice ? priceReach : 0, ph.staged ? BOTTOM + 40 : 0)
        return (
          <Sequence key={i} from={t.starts[i]} durationInFrames={t.lens[i] + (last ? t.END : t.T + 6)}>
            <PushLayer first={i === 0} last={last} len={t.lens[i]} T={t.T} pal={pal}>
              <KenBurns url={ph.src} len={t.lens[i] + t.T + (last ? t.END : 0)} dir={i % 2 ? -1 : 1} from={i % 2 ? 1.12 : 1.04} to={i % 2 ? 1.04 : 1.12} />
              <Scrim reach={reach} top={0.5} />
              {i === 0 && (
                <Sequence durationInFrames={introOut === undefined ? undefined : introOut + 30} layout="none">
                  <Intro contract={p.contract} title={title} place={place} pal={pal} out={introOut} />
                </Sequence>
              )}
              {(i === 1 || one) && hasPrice && (
                <Sequence from={priceFrom} layout="none">
                  <PriceBlock price={price} facts={facts} contract={p.contract} pal={pal} />
                </Sequence>
              )}
              {ph.staged && <StagedLabel variant="vivace" />}
            </PushLayer>
          </Sequence>
        )
      })}
      <Sequence durationInFrames={t.endStart + 20}>
        <TopBar t={t} n={n} pal={pal} label={clean(p.agent.agency) || clean(p.agent.name)} />
      </Sequence>
      <Sequence from={t.endStart}>
        <ClosingVivace agent={p.agent} pal={pal} headline={[[{ text: 'Prenota una' }, { text: 'visita', style: SERIF_ACCENT }]]} />
      </Sequence>
    </AbsoluteFill>
  )
}

// Ogni foto entra da destra dietro una maschera, preceduta da una lama del colore dell'agente; la vecchia arretra
export function PushLayer({ first, last, len, T, pal, children }: { first: boolean; last: boolean; len: number; T: number; pal: Palette; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const pin = first ? 1 : prog(f, 0, T, PUSH)
  const q = last ? 0 : prog(f, len, T, PUSH)
  // lama del colore dell'agente appena davanti al bordo della foto nuova: larga al massimo 120 px a meta' corsa
  const edge = (1 - pin) * 100
  const blade = Math.sin(Math.PI * pin) * (120 / 10.8)
  return (
    <AbsoluteFill>
      {!first && pin < 1 && <AbsoluteFill style={{ backgroundColor: pal.brand, clipPath: `inset(0 ${100 - edge}% 0 ${Math.max(0, edge - blade)}%)` }} />}
      <AbsoluteFill style={{ clipPath: pin < 1 ? `inset(0 0 0 ${(1 - pin) * 100}%)` : undefined, overflow: 'hidden' }}>
        <AbsoluteFill style={{ transform: `translateX(${(1 - pin) * 32 - q * 14}%) scale(${1 - q * 0.08})`, transformOrigin: '50% 50%' }}>
          {children}
          {q > 0 && <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${0.55 * q})` }} />}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// Barra a segmenti (storie Instagram), nome dell'agenzia e contatore "01 / 05"
function TopBar({ t, n, pal, label }: { t: AnnuncioTiming; n: number; pal: Palette; label: string }) {
  const f = useCurrentFrame()
  const show = prog(f, 4, 18)
  const pad = (k: number) => String(k).padStart(2, '0')
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <div style={{ position: 'absolute', top: SAFE.top + 16, left: SAFE.side, right: SAFE.side, display: 'flex', gap: 10 }}>
        {Array.from({ length: n }, (_, i) => {
          const fill = interpolate(f, [t.starts[i], t.starts[i] + t.lens[i]], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div key={i} style={{ flex: 1, height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.32)', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: pal.bright, transform: `scaleX(${fill})`, transformOrigin: 'left' }} />
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', top: SAFE.top + 52, left: SAFE.side, right: SAFE.side, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: 32, fontWeight: 700, textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>
        <span style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 700 }}>{label}</span>
        {n > 1 && (
          <span style={{ display: 'flex', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
            <span style={{ position: 'relative', overflow: 'hidden', width: '1.4em', height: '1.25em' }}>
              {Array.from({ length: n }, (_, i) => {
                const a = i === 0 ? 1 : prog(f, t.starts[i] + 4, 14)
                const b = i === n - 1 ? 0 : prog(f, t.starts[i + 1] + 4, 14)
                if (a <= 0 || b >= 1) return null
                return <span key={i} style={{ position: 'absolute', right: 0, top: 0, transform: `translateY(${(1 - a) * 100 - b * 100}%)` }}>{pad(i + 1)}</span>
              })}
            </span>
            <span style={{ opacity: 0.7 }}>&nbsp;/ {pad(n)}</span>
          </span>
        )}
      </div>
    </AbsoluteFill>
  )
}

export function Intro({ contract, title, place, pal, out }: { contract: AnnuncioProps['contract']; title: ReturnType<typeof titleFit>; place: string; pal: Palette; out?: number }) {
  const f = useCurrentFrame()
  const wipe = prog(f, 4, 16)
  const wipeOut = out === undefined ? 0 : prog(f, out + 6, 12)
  return (
    <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: BOTTOM, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 28 }}>
      <div style={{ height: 64, padding: '0 28px', borderRadius: 999, background: pal.brand, color: pal.on, display: 'flex', alignItems: 'center', clipPath: `inset(0 ${(1 - wipe) * 100}% 0 ${wipeOut * 100}% round 999px)` }}>
        <MaskUp start={10} out={out}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{contractWord(contract)}</span>
        </MaskUp>
      </div>
      {title.text && (
        <MaskWords text={title.text} start={10} stagger={2} out={out} style={{ color: '#fff', fontSize: title.size, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02, textShadow: '0 2px 24px rgba(0,0,0,0.25)' }} />
      )}
      {place && (
        <MaskUp start={20} out={out}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff' }}>
            <Icon name="pin" size={46} color="#fff" stroke={2.2} />
            <span style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 860 }}>{place}</span>
          </div>
        </MaskUp>
      )}
    </div>
  )
}

export function PriceBlock({ price, facts, contract, pal }: { price: Price | null; facts: Fact[]; contract: AnnuncioProps['contract']; pal: Palette }) {
  const f = useCurrentFrame()
  const wipe = prog(f, 8, 18, OUT)
  return (
    <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: BOTTOM, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24 }}>
      {price && (
        <>
          <MaskUp start={4}>
            <span style={{ color: '#fff', fontSize: 34, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{contract === 'affitto' ? 'Canone mensile' : 'Prezzo'}</span>
          </MaskUp>
          <div style={{ background: pal.brand, color: pal.on, borderRadius: 32, padding: '18px 44px 22px', clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round 32px)`, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            {price.kind === 'num' ? <CountUp value={price.value} suffix={price.suffix} start={12} /> : (
              <MaskUp start={14}><span style={{ fontSize: price.text.length > 16 ? 64 : 84, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{price.text}</span></MaskUp>
            )}
          </div>
        </>
      )}
      {facts.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: price ? 4 : 0 }}>
          {facts.map((x, i) => (
            <MaskUp key={x.key} start={(price ? 28 : 6) + i * 4}>
              <div style={{ height: 96, padding: '0 36px 0 28px', borderRadius: 999, background: '#fff', color: INK, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Icon name={x.key === 'mq' ? 'area' : 'door'} size={44} color={pal.deep} stroke={2.2} />
                <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{x.value} {x.unit}</span>
              </div>
            </MaskUp>
          ))}
        </div>
      )}
    </div>
  )
}

// numero che sale rapido fino al prezzo (stesse cifre dall'inizio, cosi' la larghezza non balla)
function CountUp({ value, suffix, start }: { value: number; suffix: string; start: number }) {
  const f = useCurrentFrame()
  const final = euro(value)
  const size = priceSize(final, 136)
  const from = Math.max(10 ** (String(Math.round(value)).length - 1), value * 0.62)
  const v = interpolate(f, [start, start + 26], [from, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.1, 0.7, 0.2, 1) })
  const shown = f >= start + 26 ? value : Math.round(v / 10 ** Math.max(0, String(Math.round(value)).length - 3)) * 10 ** Math.max(0, String(Math.round(value)).length - 3)
  const p = prog(f, start, 10)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, opacity: p, fontWeight: 800, letterSpacing: '-0.045em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', fontSize: size }}>
        <span style={{ visibility: 'hidden' }}>{final}</span>
        <span style={{ position: 'absolute', left: 0, top: 0 }}>€ {groupIt(shown)}</span>
      </span>
      {suffix && <span style={{ fontSize: Math.round(size * 0.4), fontWeight: 700, letterSpacing: '-0.01em', opacity: 0.88 }}>{suffix}</span>}
    </div>
  )
}
