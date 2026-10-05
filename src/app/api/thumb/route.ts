import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { allowedUrl } from '@/lib/safeUrl'

export const runtime = 'nodejs'

// Anteprime leggere per le card degli immobili: la foto (portale o R2) ridotta e in WebP, poi resta nella cache del CDN
// per un anno (stesso URL = stessa foto). Larghezze fisse, cosi' la cache non si frammenta.
const SIZES = [160, 320, 480, 640, 960]

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const w = Number(req.nextUrl.searchParams.get('w')) || 640
  if (!allowedUrl(u) || !SIZES.includes(w)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const r = await fetch(u, { signal: AbortSignal.timeout(15_000) }).catch(() => null)
  if (!r?.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) return NextResponse.redirect(u, 302) // non si riesce: la foto originale
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length > 25_000_000) return NextResponse.redirect(u, 302)
  const out = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 62 }).toBuffer().catch(() => null)
  if (!out) return NextResponse.redirect(u, 302)
  return new NextResponse(new Uint8Array(out), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' } })
}
