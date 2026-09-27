import { NextRequest } from 'next/server'
import { loadSite, siteUrl } from '@/lib/portfolio'
import { buildPropertyReportHtml } from '@/lib/propertyReport'
import { lookupZone, type Poi } from '@/lib/zone'

export const maxDuration = 40

// Report PDF di un immobile pubblicato ("Scarica il report" sul sito dell'agente): HTML pronto da stampare.
// Solo immobili pubblici (slug + id). Servizi vicini dalla stessa fonte di "Cosa c'e' vicino" (OSM, 1 km).
// ponytail: cache dei servizi in memoria per istanza (24 h); la CDN tiene la risposta un'ora
const cache = new Map<string, { at: number; pois: Poi[] }>()

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const slug = (q.get('slug') ?? '').slice(0, 60), id = (q.get('id') ?? '').slice(0, 60)
  const s = slug && id ? await loadSite('it', slug) : null
  const p = s?.properties.find(x => x.id === id)
  if (!s || !p || s.cfg.hidden.includes('page:immobile')) return new Response('not found', { status: 404 })

  let pois: Poi[] = []
  if (p.addr && (p.details as { distanze_auto?: boolean } | undefined)?.distanze_auto !== false) {
    const hit = cache.get(p.addr)
    if (hit && Date.now() - hit.at < 86_400_000) pois = hit.pois
    else {
      const z = await lookupZone(p.addr, 1000).catch(() => null)
      pois = z?.pois ?? []
      if (pois.length) cache.set(p.addr, { at: Date.now(), pois }) // un errore di OSM non resta in cache
    }
  }
  const html = buildPropertyReportHtml({ p, name: s.name, logo: s.cfg.logo || s.logo, cfg: s.cfg, url: siteUrl(slug), pois, origin: req.nextUrl.origin })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600', 'X-Robots-Tag': 'noindex' } })
}
