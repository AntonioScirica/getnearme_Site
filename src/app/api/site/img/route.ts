import { NextRequest, NextResponse } from 'next/server'

// Proxy delle foto per il tour 3D: WebGL vuole immagini con CORS e i CDN degli annunci non lo danno.
// Solo https verso host pubblici, massimo 8 MB, cache lunga.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  let url: URL
  try { url = new URL(u) } catch { return new NextResponse('bad', { status: 400 }) }
  if (url.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(url.hostname)) return new NextResponse('bad', { status: 400 })
  const r = await fetch(url, { headers: { Accept: 'image/*' }, signal: AbortSignal.timeout(15_000) }).catch(() => null)
  if (!r?.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) return new NextResponse('not found', { status: 404 })
  const len = Number(r.headers.get('content-length') ?? 0)
  if (len > 8_000_000) return new NextResponse('too big', { status: 413 })
  return new NextResponse(r.body, { headers: { 'Content-Type': r.headers.get('content-type')!, 'Cache-Control': 'public, max-age=86400, s-maxage=604800', 'Access-Control-Allow-Origin': '*' } })
}
