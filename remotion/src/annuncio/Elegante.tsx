import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion'
import type { AnnuncioProps } from '../schema'
import { ClosingElegante } from '../components/Closing'
import { Hairline, Vignette } from '../components/Frame'
import { KenBurns } from '../components/Photo'
import { DrawLine, FadeUp } from '../components/Reveal'
import { Scrim } from '../components/Scrim'
import { StagedLabel } from '../components/Staged'
import { palette, type Palette } from '../lib/color'
import { SANS, SERIF } from '../lib/fonts'
import { clean, contractWord, euro, facts as factsOf, parsePrice, type Fact, type Price } from '../lib/format'
import { SOFT, prog } from '../lib/motion'
import { SAFE, annuncioTiming, type AnnuncioTiming } from '../lib/timing'
import { priceSize, titleFit } from './text'

// Stile Elegante, "rivista di lusso": dissolvenze lente, zoom lentissimo, cornice a filo, Instrument Serif per titolo e
// prezzo, etichette piccole in maiuscolo tracciato. Il colore dell'agente compare solo come punto e come linea.

const BOTTOM = 1920 - (SAFE.bottom - 84)
const SIDE = SAFE.side + 16
const LABEL = { fontFamily: SANS, fontWeight: 500, fontSize: 28, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.8)' }

export function AnnuncioElegante(p: AnnuncioProps) {
  const n = Math.min(8, p.photos.length)
  const t = annuncioTiming(n, 'elegante')
  const pal = palette(p.agent.color)
  const price = parsePrice(p.price, p.contract)
  const facts = factsOf(p.mq, p.rooms)
  const hasPrice = !!price || facts.length > 0
  const title = titleFit(p.title, true)
  const place = clean(p.place)
  const one = n === 1
  // finestre dei testi: titolo sulla prima foto, prezzo sulla seconda (o dopo il titolo se la foto e' una)
  const introEnd = one ? (hasPrice ? 92 : t.endStart) : t.starts[1] + 6
  const priceStart = one ? 100 : t.starts[1] + 14
  const priceEnd = n > 2 ? t.starts[2] + 6 : t.endStart + 8

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f10' }}>
      {p.photos.slice(0, n).map((ph, i) => {
        const last = i === n - 1
        return (
          <Sequence key={i} from={t.starts[i]} durationInFrames={t.lens[i] + (last ? t.END : t.T + 2)}>
            <Fade first={i === 0} T={t.T}>
              <KenBurns url={ph.src} len={t.lens[i] + t.T + (last ? t.END : 0)} from={1.02} to={1.08} drift={0.8} dir={i % 2 ? -1 : 1} />
            </Fade>
          </Sequence>
        )
      })}
      <Vignette strength={0.5} />
      <Scrim reach={BOTTOM + 380} top={0.5} strength={0.92} />
      {p.photos.slice(0, n).map((ph, i) =>
        ph.staged ? (
          <Sequence key={`s${i}`} from={t.starts[i]} durationInFrames={t.lens[i] + (i === n - 1 ? 0 : t.T)} layout="none">
            <StagedFade len={t.lens[i] + (i === n - 1 ? 0 : t.T)} first={i === 0} />
          </Sequence>
        ) : null,
      )}
      <Sequence durationInFrames={t.endStart + 12}>
        <TopRow t={t} n={n} label={clean(p.agent.agency) || clean(p.agent.name)} />
      </Sequence>
      <Sequence durationInFrames={introEnd + 16} layout="none">
        <Intro contract={p.contract} title={title} place={place} pal={pal} out={introEnd} />
      </Sequence>
      {hasPrice && (
        <Sequence from={priceStart} durationInFrames={priceEnd - priceStart + 16} layout="none">
          <PriceBlock price={price} facts={facts} contract={p.contract} pal={pal} out={priceEnd - priceStart} />
        </Sequence>
      )}
      <Sequence from={t.endStart}>
        <ClosingElegante agent={p.agent} pal={pal} headline={[[{ text: 'Prenota una' }, { text: 'visita', style: { fontStyle: 'italic' } }]]} />
      </Sequence>
      <Hairline />
    </AbsoluteFill>
  )
}

function Fade({ first, T, children }: { first: boolean; T: number; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const o = first ? prog(f, 0, 20, SOFT) : prog(f, 0, T, SOFT)
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}

function StagedFade({ len, first }: { len: number; first: boolean }) {
  const f = useCurrentFrame()
  const o = interpolate(f, [first ? 10 : 12, first ? 28 : 30, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <StagedLabel variant="elegante" opacity={o} />
}

function TopRow({ t, n, label }: { t: AnnuncioTiming; n: number; label: string }) {
  const f = useCurrentFrame()
  const show = prog(f, 10, 30, SOFT)
  const pad = (k: number) => String(k).padStart(2, '0')
  return (
    <div style={{ position: 'absolute', top: SAFE.top + 24, left: SIDE, right: SIDE, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: show, color: '#fff', fontFamily: SANS }}>
      <span style={{ ...LABEL, fontSize: 26, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 680 }}>{label}</span>
      {n > 1 && (
        <span style={{ position: 'relative', fontWeight: 300, fontSize: 30, letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums', display: 'flex' }}>
          <span style={{ position: 'relative', width: '1.3em', height: '1.3em', marginRight: '0.35em' }}>
            {Array.from({ length: n }, (_, i) => {
              const a = i === 0 ? 1 : prog(f, t.starts[i], t.T, SOFT)
              const b = i === n - 1 ? 0 : prog(f, t.starts[i + 1], t.T, SOFT)
              const o = a * (1 - b)
              return o > 0 ? <span key={i} style={{ position: 'absolute', right: 0, top: 0, opacity: o }}>{pad(i + 1)}</span> : null
            })}
          </span>
          <span style={{ opacity: 0.6 }}>/ {pad(n)}</span>
        </span>
      )}
    </div>
  )
}

function Intro({ contract, title, place, pal, out }: { contract: AnnuncioProps['contract']; title: ReturnType<typeof titleFit>; place: string; pal: Palette; out: number }) {
  return (
    <div style={{ position: 'absolute', left: SIDE, right: SIDE, bottom: BOTTOM, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', color: '#fff' }}>
      <FadeUp start={8} out={out} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30 }}>
        <span style={{ width: 12, height: 12, borderRadius: 12, background: pal.bright }} />
        <span style={{ ...LABEL, fontSize: 30, color: 'rgba(255,255,255,0.92)' }}>{contractWord(contract)}</span>
      </FadeUp>
      {title.text && (
        <FadeUp start={14} dy={16} out={out}>
          <div style={{ fontFamily: SERIF, fontSize: title.size, lineHeight: 1.0, letterSpacing: '-0.012em', textWrap: 'balance' } as React.CSSProperties}>{title.text}</div>
        </FadeUp>
      )}
      <DrawLine start={26} width={140} color="rgba(255,255,255,0.75)" out={out} style={{ margin: title.text ? '40px 0 32px' : '0 0 32px' }} />
      {place && (
        <FadeUp start={34} out={out}>
          <div style={{ ...LABEL, marginBottom: 6 }}>Zona</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 60, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 900 }}>{place}</div>
        </FadeUp>
      )}
    </div>
  )
}

function PriceBlock({ price, facts, contract, pal, out }: { price: Price | null; facts: Fact[]; contract: AnnuncioProps['contract']; pal: Palette; out: number }) {
  const text = price ? (price.kind === 'num' ? euro(price.value) : price.text) : ''
  return (
    <div style={{ position: 'absolute', left: SIDE, right: SIDE, bottom: BOTTOM, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', color: '#fff' }}>
      {price && (
        <>
          <FadeUp start={4} out={out} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
            <span style={{ width: 12, height: 12, borderRadius: 12, background: pal.bright }} />
            <span style={{ ...LABEL, fontSize: 30, color: 'rgba(255,255,255,0.92)' }}>{contract === 'affitto' ? 'Canone mensile' : 'Prezzo'}</span>
          </FadeUp>
          <FadeUp start={10} dy={16} out={out} style={{ display: 'flex', alignItems: 'baseline', gap: 14, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: SERIF, fontSize: price.kind === 'num' ? priceSize(text, 168) : text.length > 16 ? 84 : 112, lineHeight: 1.0, letterSpacing: '-0.01em' }}>{text}</span>
            {price.kind === 'num' && price.suffix && <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 68 }}>{price.suffix}</span>}
          </FadeUp>
          <DrawLine start={20} width={140} color="rgba(255,255,255,0.75)" out={out} style={{ margin: facts.length ? '36px 0 36px' : '36px 0 0' }} />
        </>
      )}
      {facts.length > 0 && (
        <div style={{ display: 'flex', gap: 88 }}>
          {facts.map((x, i) => (
            <FadeUp key={x.key} start={(price ? 26 : 8) + i * 6} out={out}>
              <div style={{ ...LABEL, marginBottom: 8 }}>{x.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 80, lineHeight: 1.0, whiteSpace: 'nowrap' }}>
                {x.value}
                {x.key === 'mq' && <span style={{ fontStyle: 'italic', fontSize: 56 }}> m²</span>}
              </div>
            </FadeUp>
          ))}
        </div>
      )}
    </div>
  )
}
