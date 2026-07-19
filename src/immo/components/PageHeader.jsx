import { useApp } from '../store/store.jsx'
import { ICONS } from '../data/seed.js'
import Icon from './Icon.jsx'

// Intestazione di pagina responsive.
// Sotto i 900px: header in stile app (freccia indietro + titolo + azioni).
// Sopra: riga titolo grande in stile desktop (la topbar globale è nella shell).
export default function PageHeader({ title, onBack, right, subtitle }) {
  const { isDesktop, back } = useApp()
  if (isDesktop) {
    // Nessun padding orizzontale/maxWidth proprio: eredita quelli del contenitore della schermata,
    // così il titolo è allineato ai contenuti sottostanti (niente doppio padding).
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '26px 0 4px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-.7px' }}>{title}</div>
          {subtitle && <div style={{ marginTop: 3, fontSize: 13.5, color: '#666E82' }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 14px' }}>
      {onBack !== null && (
        <div onClick={onBack || back} style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
          <Icon d={ICONS.back} size={20} sw={2} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 21, letterSpacing: '-.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#8A91A6', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
