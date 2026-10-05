import type { CSSProperties } from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'
import type { Agent } from '../schema'
import { INK, mix, type Palette } from '../lib/color'
import { SANS, SERIF } from '../lib/fonts'
import { clean, siteText } from '../lib/format'
import { OUT, SOFT, prog, src } from '../lib/motion'
import { SAFE } from '../lib/timing'
import { DrawLine, FadeUp, MaskUp, MaskWords, type Part } from './Reveal'
import { Icon } from './Icons'

// Chiusura con l'agente (ultimi ~3 s): frase, logo, nome, agenzia, telefono, sito. Ogni riga vuota sparisce.
export type Headline = Part[][] // righe di pezzi; un pezzo con serif:true e' l'accento in Instrument Serif corsivo

function agentLines(a: Agent) {
  const name = clean(a.name) || clean(a.agency)
  const agency = clean(a.agency) && clean(a.agency) !== name ? clean(a.agency) : ''
  return { name, agency, phone: clean(a.phone), site: siteText(a.site), logo: a.logoUrl ? a.logoUrl : '' }
}

const fitSize = (s: string, base: number, maxChars: number) => (s.length > maxChars ? Math.max(base * 0.62, Math.round((base * maxChars) / s.length)) : base)

export function ClosingVivace({ agent, pal, headline }: { agent: Agent; pal: Palette; headline: Headline }) {
  const f = useCurrentFrame()
  const a = agentLines(agent)
  // il pannello sale e i suoi angoli si chiudono mentre arriva; poi compare il contenuto
  const p = prog(f, 0, 18, OUT)
  const radius = interpolate(p, [0, 1], [96, 0])
  const dark = pal.on !== '#ffffff'
  const btnBg = dark ? INK : '#ffffff'
  const btnFg = dark ? '#ffffff' : pal.deep
  let k = 0
  const at = () => 14 + 4 * k++
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - p) * 100}%)` }}>
      <AbsoluteFill style={{ borderRadius: `${radius}px ${radius}px 0 0`, overflow: 'hidden', background: `linear-gradient(165deg, ${mix(pal.brand, '#ffffff', 0.1)} 0%, ${pal.brand} 45%, ${mix(pal.brand, '#000000', 0.14)} 100%)` }}>
        {/* luce morbida e un grande anello sottile: profondita' senza rubare la scena al testo */}
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 18% 8%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 46%)' }} />
        <div style={{ position: 'absolute', width: 1400, height: 1400, left: -160, top: 1180, borderRadius: '50%', border: `2px solid ${pal.on === '#ffffff' ? 'rgba(255,255,255,0.16)' : 'rgba(29,29,31,0.12)'}`, transform: `scale(${0.9 + 0.1 * prog(f, 6, 60)})` }} />
        <div style={{ position: 'absolute', width: 1000, height: 1000, left: 40, top: 1380, borderRadius: '50%', border: `2px solid ${pal.on === '#ffffff' ? 'rgba(255,255,255,0.12)' : 'rgba(29,29,31,0.09)'}`, transform: `scale(${0.9 + 0.1 * prog(f, 10, 60)})` }} />
        <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.top, bottom: 1920 - SAFE.bottom, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: pal.on, fontFamily: SANS }}>
          {headline.length > 0 && (
            <div style={{ marginBottom: 64 }}>
              {headline.map((line, i) => (
                <MaskWords key={i} parts={line} start={at()} stagger={2} style={{ fontSize: 88, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04 }} />
              ))}
            </div>
          )}
          {a.logo && (
            <Pop start={at()} style={{ marginBottom: 44 }}>
              <div style={{ height: 176, padding: '0 60px', borderRadius: 999, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
                <Img src={src(a.logo)} style={{ height: 112, maxWidth: 640, objectFit: 'contain' }} />
              </div>
            </Pop>
          )}
          {a.name && (
            <MaskUp start={at()}>
              <div style={{ fontSize: fitSize(a.name, 68, 22), fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{a.name}</div>
            </MaskUp>
          )}
          {a.agency && (
            <MaskUp start={at()} style={{ marginTop: 6 }}>
              <div style={{ fontSize: fitSize(a.agency, 44, 34), fontWeight: 500, opacity: 0.86, whiteSpace: 'nowrap' }}>{a.agency}</div>
            </MaskUp>
          )}
          {a.phone && (
            <Pop start={at()} style={{ marginTop: 52 }}>
              <div style={{ height: 124, padding: '0 56px 0 48px', borderRadius: 999, background: btnBg, color: btnFg, display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.16)' }}>
                <Icon name="phone" size={48} color={btnFg} stroke={2.2} />
                <span style={{ fontSize: fitSize(a.phone, 56, 17), fontWeight: 800, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{a.phone}</span>
              </div>
            </Pop>
          )}
          {a.site && (
            <FadeUp start={at()} style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon name="globe" size={36} color={pal.on} stroke={2} style={{ opacity: 0.86 }} />
              <span style={{ fontSize: fitSize(a.site, 44, 30), fontWeight: 600, opacity: 0.92, whiteSpace: 'nowrap' }}>{a.site}</span>
            </FadeUp>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// entrata di un oggetto pieno (logo, bottone): sale e si assesta, senza rimbalzo
function Pop({ start, children, style }: { start: number; children: React.ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const p = prog(f, start, 20, OUT)
  return <div style={{ opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})`, ...style }}>{children}</div>
}

export function ClosingElegante({ agent, pal, headline }: { agent: Agent; pal: Palette; headline: Headline }) {
  const f = useCurrentFrame()
  const a = agentLines(agent)
  const bg = prog(f, 0, 24, SOFT)
  let k = 0
  const at = () => 16 + 6 * k++
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(15,15,16,${bg})` }}>
      <div style={{ position: 'absolute', left: SAFE.side + 8, right: SAFE.side + 8, top: SAFE.top, bottom: 1920 - SAFE.bottom, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#ffffff' }}>
        {headline.length > 0 && (
          <FadeUp start={at()} dy={16}>
            {headline.map((line, i) => (
              <div key={i} style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 1.04, letterSpacing: '-0.01em' }}>
                {line.map((pt, j) => <span key={j} style={pt.style}>{(j ? ' ' : '') + pt.text}</span>)}
              </div>
            ))}
          </FadeUp>
        )}
        <DrawLine start={at()} width={96} color={pal.bright} origin="center" style={{ margin: '48px 0 56px' }} />
        {a.logo && (
          <FadeUp start={at()} style={{ marginBottom: 48 }}>
            <div style={{ height: 160, padding: '0 56px', borderRadius: 999, background: '#f4f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Img src={src(a.logo)} style={{ height: 100, maxWidth: 600, objectFit: 'contain' }} />
            </div>
          </FadeUp>
        )}
        {a.name && (
          <FadeUp start={at()}>
            <div style={{ fontFamily: SERIF, fontSize: fitSize(a.name, 84, 24), lineHeight: 1.05, whiteSpace: 'nowrap' }}>{a.name}</div>
          </FadeUp>
        )}
        {a.agency && (
          <FadeUp start={at()} style={{ marginTop: 14 }}>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: fitSize(a.agency, 30, 30), letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.72, whiteSpace: 'nowrap' }}>{a.agency}</div>
          </FadeUp>
        )}
        {a.phone && (
          <FadeUp start={at()} style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Icon name="phone" size={42} color="#ffffff" stroke={1.5} />
            <span style={{ fontFamily: SANS, fontWeight: 300, fontSize: fitSize(a.phone, 56, 17), letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{a.phone}</span>
          </FadeUp>
        )}
        {a.site && (
          <FadeUp start={at()} style={{ marginTop: 18 }}>
            <span style={{ fontFamily: SANS, fontWeight: 300, fontSize: fitSize(a.site, 44, 30), letterSpacing: '0.04em', opacity: 0.74, whiteSpace: 'nowrap' }}>{a.site}</span>
          </FadeUp>
        )}
      </div>
    </AbsoluteFill>
  )
}

export const SERIF_ACCENT: CSSProperties = { fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '1.14em', lineHeight: 0.9 }
