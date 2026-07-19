// Interruttore on/off (stile iOS del prototipo)
export default function Toggle({ on, onClick, onColor = '#537EEC' }) {
  return (
    <div onClick={onClick} style={{ width: 46, height: 26, borderRadius: 99, background: on ? onColor : '#D7DCE9', position: 'relative', cursor: 'pointer', transition: 'background .2s', flex: 'none' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(24,29,26,.25)', transition: 'left .2s' }} />
    </div>
  )
}
