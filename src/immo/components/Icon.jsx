// Icona a tracciato singolo (stile del prototipo)
export default function Icon({ d, size = 20, stroke = '#15181F', sw = 1.8, fill = 'none', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={fill === 'none' ? stroke : 'none'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  )
}
