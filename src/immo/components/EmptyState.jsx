import Icon from './Icon.jsx'

// Stato vuoto riutilizzabile
export default function EmptyState({ icon, title, sub, cta, onCta }) {
  return (
    <div style={{ padding: '34px 20px', textAlign: 'center', border: '1.5px dashed #D7DCE9', borderRadius: 18, background: 'rgba(255,255,255,.5)' }}>
      {icon && (
        <div style={{ width: 46, height: 46, borderRadius: 15, background: '#EDF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <Icon d={icon} size={22} stroke="#8A91A6" />
        </div>
      )}
      <div style={{ marginTop: 12, fontWeight: 700, fontSize: 14.5 }}>{title}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 12.5, color: '#666E82', lineHeight: 1.5 }}>{sub}</div>}
      {cta && (
        <div onClick={onCta} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{cta}</div>
      )}
    </div>
  )
}
