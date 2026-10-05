import { AbsoluteFill } from 'remotion'
import type { VendutoProps } from '../schema'
import { Music } from '../components/Music'
import { VendutoElegante } from './Elegante'
import { VendutoVivace } from './Vivace'

export function Venduto(p: VendutoProps) {
  return (
    <AbsoluteFill>
      {p.style === 'elegante' ? <VendutoElegante {...p} /> : <VendutoVivace {...p} />}
      <Music url={p.musicUrl} />
    </AbsoluteFill>
  )
}
