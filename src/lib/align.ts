import sharp from 'sharp'

// GPT Image e Nano Banana a volte restituiscono la stanza spostata di qualche pixel (28/09: GPT 12 px a sinistra su
// 1500, lo spigolo del muro nel prima/dopo si vedeva doppio). Si misura lo spostamento sui bordi (pareti, porte,
// piastrelle) e si rimette a posto: gratis, niente rigenerazioni. Solo traslazione fino al 3%; lo zoom non si stima
// (con i mobili cambiati la misura della scala sbagliava).
const W = 320
// solo la parte alta (soffitto, pareti, porte, finestre): in basso i mobili cambiano e falsano la misura
const TOP = +(process.env.ALIGN_TOP || 0.5)
async function edges(img: Buffer, w: number, h: number): Promise<Float32Array> {
  const { data } = await sharp(img).rotate().resize(w, h, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true })
  const e = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; e[i] = Math.hypot(data[i + 1] - data[i - 1], data[i + w] - data[i - w]) }
  return e
}
function corr(a: Float32Array, b: Float32Array, w: number, h: number, dx: number, dy: number, m: number): number {
  let ab = 0, aa = 0, bb = 0
  for (let y = m; y < Math.round(h * TOP); y++) for (let x = m; x < w - m; x++) { const p = a[y * w + x], q = b[(y + dy) * w + x + dx]; ab += p * q; aa += p * p; bb += q * q }
  return ab / Math.sqrt(aa * bb || 1)
}

// spostamento del risultato rispetto all'originale, in frazione della foto (dx > 0 = risultato spostato a destra)
export async function measureShift(orig: Buffer, out: Buffer): Promise<{ dx: number; dy: number; gain: number }> {
  const { width = 1, height = 1 } = await sharp(orig).rotate().metadata()
  const h = Math.round(W * height / width), m = Math.ceil(W * 0.03) + 1
  const [a, b] = await Promise.all([edges(orig, W, h), edges(out, W, h)])
  const zero = corr(a, b, W, h, 0, 0, m)
  let best = { dx: 0, dy: 0, c: zero }
  for (let dy = -m + 1; dy < m; dy++) for (let dx = -m + 1; dx < m; dx++) {
    const c = corr(a, b, W, h, dx, dy, m)
    if (c > best.c) best = { dx, dy, c }
  }
  return { dx: best.dx / W, dy: best.dy / h, gain: best.c - zero }
}

// risultato riportato sulla foto originale; le strisce scoperte sul bordo si riempiono ripetendo l'ultima riga di pixel
export async function alignTo(orig: Buffer, out: Buffer): Promise<Buffer> {
  try {
    const s = await measureShift(orig, out)
    if (s.gain < 0.02 || (Math.abs(s.dx) < 0.003 && Math.abs(s.dy) < 0.003)) return out // niente spostamento chiaro
    const img = sharp(out).rotate()
    const { width = 0, height = 0 } = await img.metadata()
    const px = Math.round(s.dx * width), py = Math.round(s.dy * height)
    // nuovo(x) = risultato(x + px): si allarga dal lato opposto allo spostamento e si ritaglia
    const padded = await img.extend({ left: Math.max(0, -px), right: Math.max(0, px), top: Math.max(0, -py), bottom: Math.max(0, py), extendWith: 'copy' }).toBuffer()
    return await sharp(padded).extract({ left: Math.max(0, px), top: Math.max(0, py), width, height }).jpeg({ quality: 92 }).toBuffer()
  } catch (e) {
    console.error('align', e)
    return out
  }
}

// ponytail: controllo minimo con la foto spostata a mano, `npx tsx src/lib/align.ts foto.jpg`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('align.ts') && process.argv[2]) {
  ;(async () => {
    const o = await sharp(process.argv[2]).resize(1500, 1000, { fit: 'cover' }).jpeg().toBuffer()
    const moved = await sharp(await sharp(o).extend({ left: 0, right: 15, top: 0, bottom: 10, extendWith: 'copy' }).toBuffer()).extract({ left: 15, top: 10, width: 1500, height: 1000 }).toBuffer() // contenuto 15 px a sinistra, 10 su
    const s = await measureShift(o, moved)
    console.assert(Math.abs(s.dx * 1500 + 15) < 6 && Math.abs(s.dy * 1000 + 10) < 6, 'misura', s)
    const back = await measureShift(o, await alignTo(o, moved))
    console.assert(Math.abs(back.dx * 1500) < 6 && Math.abs(back.dy * 1000) < 6, 'riallineata', back)
    console.log('ok', (s.dx * 1500).toFixed(1), (s.dy * 1000).toFixed(1), '->', (back.dx * 1500).toFixed(1), (back.dy * 1000).toFixed(1))
  })()
}
