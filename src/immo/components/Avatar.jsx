// Avatar con iniziali
export default function Avatar({ ini, c = '#DDE5FB', size = 44, fs = 14, col = '#3A4152', style }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: fs, color: col, flex: 'none', ...style }}>
      {ini}
    </div>
  )
}
