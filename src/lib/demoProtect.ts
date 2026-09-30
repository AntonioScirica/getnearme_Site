import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import sharp from 'sharp'

// Prova gratis della landing (30/09): si vede solo la versione con la filigrana; quella pulita sta su R2 a una chiave
// casuale mai mostrata al browser. Il browser tiene solo un gettone cifrato con la chiave, che la piattaforma scambia
// con l'indirizzo vero dopo il login (/api/platform/demo-claim). Uno screenshot resta con la filigrana.
const secret = () => createHash('sha256').update(`demo|${process.env.SUPABASE_SERVICE_ROLE_KEY}`).digest()

export function sealKey(key: string): string {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', secret(), iv)
  const enc = Buffer.concat([c.update(key, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url')
}
export function openKey(token: string): string | null {
  try {
    const b = Buffer.from(token, 'base64url'), d = createDecipheriv('aes-256-gcm', secret(), b.subarray(0, 12))
    d.setAuthTag(b.subarray(12, 28))
    const key = Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
    return /^landing-clean\/[\w.-]+$/.test(key) ? key : null
  } catch { return null }
}

// scritta "agenteimmo.me" ripetuta in diagonale su tutta l'immagine, bianca semitrasparente con un'ombra
export async function watermarkPng(width: number, height: number): Promise<Buffer> {
  const size = Math.round(Math.max(width, height) / 22), stepX = size * 9, stepY = size * 4
  let text = ''
  for (let y = -height; y < height * 2; y += stepY) for (let x = -width; x < width * 2; x += stepX)
    text += `<text x="${x + ((y / stepY) % 2) * stepX / 2}" y="${y}">agenteimmo.me</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g transform="rotate(-24 ${width / 2} ${height / 2})" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size}" fill="#ffffff" fill-opacity="0.34" stroke="#000000" stroke-opacity="0.12" stroke-width="${Math.max(1, size / 30)}">${text}</g></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
export async function watermarkImage(img: Buffer): Promise<Buffer> {
  const { width = 1024, height = 768 } = await sharp(img).metadata()
  return sharp(img).composite([{ input: await watermarkPng(width, height) }]).jpeg({ quality: 82 }).toBuffer()
}
