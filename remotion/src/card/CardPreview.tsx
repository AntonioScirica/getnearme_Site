import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { Annuncio } from '../annuncio/Annuncio'
import { Venduto } from '../venduto/Venduto'
import { src } from '../lib/motion'
import { H, W } from '../lib/timing'
import type { AnnuncioProps, VendutoProps } from '../schema'

// Anteprime delle card dei template nella chat (1280x720, card orizzontali): il video verticale vero dentro una
// cornice da telefono, al centro, su fondo con la stessa foto sfocata e scurita. Angolo in alto a destra libero
// (li la card mette il badge dei crediti). Il video intero, start = primo fotogramma.
export const CARD = { w: 1280, h: 720 }
const PHONE_H = 640, BEZEL = 8, RADIUS = 52
const INNER_H = PHONE_H - BEZEL * 2, SCALE = INNER_H / H, INNER_W = Math.round(W * SCALE)

type Props = { kind: 'annuncio'; start: number; len: number; video: AnnuncioProps } | { kind: 'venduto'; start: number; len: number; video: VendutoProps }

export function CardPreview(p: Props) {
  const f = useCurrentFrame()
  const bg = p.kind === 'annuncio' ? p.video.photos[0].src : p.video.photo.src
  // giunta del loop morbida: il telefono si schiarisce dal nero nei primi 6 fotogrammi e ci torna negli ultimi 6
  const fade = interpolate(f, [0, 6, p.len - 6, p.len - 1], [0.35, 0, 0, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0c' }}>
      <AbsoluteFill>
        <Img src={src(bg)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) saturate(1.1)', transform: 'scale(1.15)' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,11,12,.38), rgba(11,11,12,.55))' }} />
      <div
        style={{
          position: 'absolute', left: (CARD.w - INNER_W - BEZEL * 2) / 2, top: (CARD.h - PHONE_H) / 2,
          width: INNER_W + BEZEL * 2, height: PHONE_H, borderRadius: RADIUS, padding: BEZEL, background: '#0d0d0f',
          boxShadow: '0 0 0 1.5px rgba(255,255,255,.14), 0 40px 80px -24px rgba(0,0,0,.65), 0 12px 28px -12px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ position: 'relative', width: INNER_W, height: INNER_H, borderRadius: RADIUS - BEZEL, overflow: 'hidden', background: '#000' }}>
          <div style={{ position: 'relative', width: W, height: H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
            <Sequence from={-p.start} layout="none">
              {p.kind === 'annuncio' ? <Annuncio {...p.video} /> : <Venduto {...p.video} />}
            </Sequence>
          </div>
          <AbsoluteFill style={{ backgroundColor: '#000', opacity: fade }} />
        </div>
      </div>
    </AbsoluteFill>
  )
}
