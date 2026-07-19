import { useApp } from '../store/store.jsx'

// Modale responsive: bottom-sheet sotto i 900px, card centrata sopra.
export default function Modal({ open, onClose, title, children, maxWidth = 440 }) {
  const { isDesktop } = useApp()
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, ...(isDesktop ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(24,29,26,.42)', backdropFilter: 'blur(2px)' }} />
      {/* Card centrata via flex sull'overlay (desktop): l'animazione popIn anima solo scale,
          quindi non sovrascrive più il centraggio come faceva il vecchio translate. */}
      <div style={isDesktop
        ? { position: 'relative', width: '92%', maxWidth, background: '#F4F6FA', borderRadius: 22, padding: '20px 20px 22px', boxShadow: '0 30px 80px rgba(24,29,26,.3)', animation: 'popIn .22s ease both' }
        : { position: 'absolute', left: 10, right: 10, bottom: 10, background: '#F4F6FA', borderRadius: 26, padding: '18px 16px 26px', boxShadow: '0 -16px 50px rgba(24,29,26,.3)', animation: 'fadeUp .25s ease both' }}>
        {!isDesktop && <div style={{ width: 40, height: 5, borderRadius: 99, background: '#C6CEE0', margin: '0 auto 14px' }} />}
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
            <div style={{ flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: '-.4px' }}>{title}</div>
            <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 12, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: '#666E82' }}>✕</div>
          </div>
        )}
        <div style={{ marginTop: title ? 14 : 0 }}>{children}</div>
      </div>
    </div>
  )
}
