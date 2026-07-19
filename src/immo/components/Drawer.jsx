import { useApp } from '../store/store.jsx'

// Pannello dettaglio responsive: drawer laterale destro sopra i 900px, sheet a tutto schermo sotto.
export default function Drawer({ open, onClose, width = 520, children }) {
  const { isDesktop } = useApp()
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(24,29,26,.42)', backdropFilter: 'blur(2px)' }} />
      <div className="no-scrollbar" style={isDesktop
        ? { position: 'absolute', top: 0, bottom: 0, right: 0, width, maxWidth: '94vw', background: '#F4F6FA', boxShadow: '-24px 0 70px rgba(24,29,26,.25)', overflowY: 'auto', animation: 'slideIn .25s ease both' }
        : { position: 'absolute', inset: 0, background: '#F4F6FA', overflowY: 'auto', animation: 'fadeUp .22s ease both' }}>
        {children}
      </div>
    </div>
  )
}
