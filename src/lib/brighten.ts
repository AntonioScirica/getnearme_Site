import sharp from 'sharp'

// "Luminoso" senza AI: correzione dell'esposizione come in Lightroom. Curva y = x^(1/g) sulla luminosita': alza ombre e
// toni medi, 1 resta 1, quindi nessun pixel nuovo bruciato (l'AI bruciava muri e soffitti, fino a 10 volte i bianchi puri, 27/09).
// g si sceglie per portare la luminosita' media verso ~150/255, tra 1 (niente) e 1.8. Poi un filo di calore e saturazione.
export async function brighten(input: Buffer): Promise<Buffer> {
  const img = sharp(input).rotate()
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let sum = 0
  for (let i = 0; i < data.length; i += 3) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  const mean = sum / (data.length / 3) / 255
  const target = 150 / 255
  // mean^(1/g) = target  ->  g = ln(mean) / ln(target)
  const g = mean > 0 && mean < target ? Math.min(1.8, Math.max(1, Math.log(mean) / Math.log(target))) : 1
  const lut = new Uint8Array(256).map((_, v) => Math.round(255 * Math.pow(v / 255, 1 / g)))
  const out = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 3) {
    // stessa curva sulla luminosita', i colori scalano insieme (niente dominanti): rapporto nuovo/vecchio
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    const k = y > 0 ? lut[Math.min(255, Math.round(y))] / y : 1
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.round(data[i + c] * k))
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .modulate({ saturation: 1.06 }).linear([1.02, 1, 0.97], [0, 0, 0]).jpeg({ quality: 92 }).toBuffer()
}
