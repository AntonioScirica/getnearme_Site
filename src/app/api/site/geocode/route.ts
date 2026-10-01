import { NextRequest, NextResponse } from 'next/server'
import { geocode } from '@/lib/zone'

// Indirizzo -> coordinate (Nominatim, gratis) dal nostro server: il browser a volte viene bloccato (CORS o
// limiti di uso). Cache in memoria per un giorno e limite per IP: niente proxy aperto verso Nominatim.
const cache = new Map<string, { at: number; v: { lat: number; lon: number } | null }>()
const hits = new Map<string, number[]>()

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200)
  if (q.length < 3) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const headers = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
  const hit = cache.get(q)
  if (hit && Date.now() - hit.at < 86_400_000) return NextResponse.json(hit.v ?? { error: 'not_found' }, { status: hit.v ? 200 : 404, headers })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'x'
  const recent = (hits.get(ip) ?? []).filter(t => Date.now() - t < 600_000)
  if (recent.length >= 60) return NextResponse.json({ error: 'too_many' }, { status: 429 })
  hits.set(ip, [...recent, Date.now()])

  const g = await geocode(q)
  const v = g ? { lat: Number(g.lat), lon: Number(g.lon) } : null
  cache.set(q, { at: Date.now(), v })
  return NextResponse.json(v ?? { error: 'not_found' }, { status: v ? 200 : 404, headers })
}
