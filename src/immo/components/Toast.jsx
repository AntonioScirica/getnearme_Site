// Toast di conferma (renderizzato solo dalla shell)
export default function Toast({ msg, bottom = 30 }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', left: '50%', bottom, transform: 'translateX(-50%)', background: '#15181F', color: '#F4F6FA', fontSize: 13, fontWeight: 600, borderRadius: 99, padding: '11px 18px', boxShadow: '0 10px 30px rgba(24,29,26,.35)', zIndex: 120, animation: 'toastUp .25s ease both', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A2B9F5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      {msg}
    </div>
  )
}
