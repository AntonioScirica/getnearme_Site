// Placeholder immagine (sostituisce gli image-slot del prototipo)
export default function Placeholder({ label, style, shape = 'rect', tone = 'blue' }) {
  const tones = {
    blue: 'linear-gradient(135deg,#C9D6F2 0%,#A9BDE8 55%,#8FA8DE 100%)',
    warm: 'linear-gradient(135deg,#EAD9C8 0%,#DCC3A8 60%,#C8AB8E 100%)',
    violet: 'linear-gradient(135deg,#D9D2F5 0%,#BFB2EE 55%,#A493E4 100%)',
    green: 'linear-gradient(135deg,#CFE0D4 0%,#B4CDBB 60%,#9ABBA4 100%)',
    grey: 'linear-gradient(135deg,#DDE2EC 0%,#C8CFDE 60%,#B4BDD0 100%)',
  }
  return (
    <div style={{ background: tones[tone] || tones.blue, borderRadius: shape === 'circle' ? '50%' : 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', position: 'relative', ...style }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}>
        <path d="M4 8.5h3.2l1.9-2.5h5.8l1.9 2.5H20a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5ZM12 17a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />
      </svg>
      {label && <div style={{ position: 'relative', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', textAlign: 'center', padding: '0 8px' }}>{label}</div>}
    </div>
  )
}
