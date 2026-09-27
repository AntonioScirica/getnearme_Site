import sharp from 'sharp'

// Finitura fotografica dopo ogni modifica AI (senza AI, istantanea): il risultato di Qwen e' liscio, "piatto".
// Contrasto locale leggero (toni medi piu' staccati), grana fine e un filo di nitidezza, come una foto vera.
// Provato (27/09) anche a rimettere il dettaglio fine della foto originale dove la stanza non cambia: faceva riapparire
// in trasparenza mobili e piastrelle tolti, scartato.
export async function finish(resultBuf: Buffer): Promise<Buffer> {
  const img = sharp(resultBuf).removeAlpha()
  const { width: W = 0, height: H = 0 } = await img.metadata()
  if (!W || !H) return resultBuf
  const [r, low, big] = await Promise.all([img.clone().raw().toBuffer(), img.clone().blur(2).raw().toBuffer(), img.clone().blur(25).raw().toBuffer()])
  const out = Buffer.alloc(r.length)
  for (let i = 0; i < r.length; i += 3) {
    const grain = (Math.random() + Math.random() + Math.random() - 1.5) * 4 // ~gaussiana, sigma ~2, uguale sui tre canali
    for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, Math.round(r[i + c] + 0.22 * (low[i + c] - big[i + c]) + grain)))
  }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } }).sharpen({ sigma: 0.7 }).jpeg({ quality: 92 }).toBuffer()
}
