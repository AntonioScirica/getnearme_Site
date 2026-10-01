import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Generazioni finte per gli account di prova degli agenti simulati (@agenteimmo-test.local), solo in locale:
// foto e video seguono tutto il flusso vero (crediti, R2, Galleria, montaggio) ma senza chiamare GPT Image,
// Nano Banana, fal o Opus. Fuori dallo sviluppo locale non scatta mai.
const TEST_DOMAIN = '@agenteimmo-test.local'
export const FAKE_VIDEO = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili/F12_rianima.mp4'
const seen = new Map<string, boolean>()
let admin: ReturnType<typeof createClient> | null = null

export async function isFakeUser(userId: string | undefined): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development' || !userId) return false
  if (seen.has(userId)) return seen.get(userId)!
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin.auth.admin.getUserById(userId)
  const fake = !!data.user?.email?.endsWith(TEST_DOMAIN)
  seen.set(userId, fake)
  return fake
}

// la foto di partenza, un po' piu' calda e con la scritta FINTA: si vede che e' cambiata ma non e' costata nulla
export async function fakePhoto(image: string): Promise<string> {
  const src = image.startsWith('data:') ? Buffer.from(image.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(image, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
  const img = sharp(src).rotate()
  const { width = 1024, height = 768 } = await img.metadata()
  const s = Math.round(Math.min(width, height) / 12)
  const label = Buffer.from(`<svg width="${width}" height="${height}"><rect x="${s / 2}" y="${s / 2}" width="${s * 4.2}" height="${s * 1.4}" rx="${s * 0.7}" fill="#537eec"/><text x="${s / 2 + s * 2.1}" y="${s / 2 + s}" font-family="Arial" font-weight="700" font-size="${s * 0.8}" fill="#fff" text-anchor="middle">FINTA</text></svg>`)
  const out = await img.modulate({ brightness: 1.05, saturation: 1.1, hue: 8 }).composite([{ input: label }]).jpeg({ quality: 90 }).toBuffer()
  return out.toString('base64')
}
