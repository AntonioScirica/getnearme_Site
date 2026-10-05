import { SAFE } from '../lib/timing'
import { SANS } from '../lib/fonts'

// Dicitura obbligatoria sulle foto arredate con l'AI: piccola, in basso ma dentro la safe area
export function StagedLabel({ opacity = 1, variant }: { opacity?: number; variant: 'vivace' | 'elegante' }) {
  const viv = variant === 'vivace'
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: SAFE.bottom - 52, display: 'flex', justifyContent: 'center', opacity }}>
      <div style={{ height: 52, padding: '0 24px', borderRadius: 999, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', fontFamily: SANS, fontWeight: viv ? 600 : 500, fontSize: 26, letterSpacing: viv ? '0.01em' : '0.06em' }}>
        Immagine arredata virtualmente
      </div>
    </div>
  )
}
