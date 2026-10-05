import { AbsoluteFill } from 'remotion'
import type { AnnuncioProps } from '../schema'
import { Music } from '../components/Music'
import { AnnuncioElegante } from './Elegante'
import { AnnuncioVivace } from './Vivace'

export function Annuncio(p: AnnuncioProps) {
  return (
    <AbsoluteFill>
      {p.style === 'elegante' ? <AnnuncioElegante {...p} /> : <AnnuncioVivace {...p} />}
      <Music url={p.musicUrl} />
    </AbsoluteFill>
  )
}
