import { NextRequest, NextResponse } from 'next/server'
import { loadSite } from '@/lib/portfolio'
import { lookupZone, type Poi } from '@/lib/zone'

export const maxDuration = 40

// Servizi vicini a un immobile pubblicato, per la scheda del sito dell'agente. Solo indirizzi di immobili
// pubblici (slug + id), mai un indirizzo qualsiasi: niente proxy aperto verso Nominatim/Overpass.
// ponytail: cache e limite in memoria per istanza (24 h, 30 ricerche nuove ogni 10 min per IP); la CDN tiene la risposta un giorno
const RADII = [500, 1000, 2000, 5000]
const cache = new Map<string, { at: number; pois: Poi[] }>()
const hits = new Map<string, number[]>()

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const slug = (q.get('slug') ?? '').slice(0, 60), id = (q.get('id') ?? '').slice(0, 60)
  const radius = RADII.includes(Number(q.get('r'))) ? Number(q.get('r')) : 1000
  const s = slug && id ? await loadSite('it', slug) : null
  const addr = s?.properties.find(p => p.id === id)?.addr?.trim()
  if (!addr) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const key = `${addr}|${radius}`
  const hit = cache.get(key)
  const headers = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
  if (hit && Date.now() - hit.at < 86_400_000) return NextResponse.json({ pois: hit.pois }, { headers })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'x'
  const recent = (hits.get(ip) ?? []).filter(t => Date.now() - t < 600_000)
  if (recent.length >= 30) return NextResponse.json({ error: 'too_many' }, { status: 429 })
  hits.set(ip, [...recent, Date.now()])

  const zone = await lookupZone(addr, radius)
  const pois = (zone?.pois ?? []).filter(p => p.distanza <= radius)
  if (zone) cache.set(key, { at: Date.now(), pois })
  return NextResponse.json({ pois }, { headers })
}
