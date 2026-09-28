import { NextRequest } from 'next/server'
import { loadSite, siteUrl } from '@/lib/portfolio'
import { buildPropertyReportHtml } from '@/lib/propertyReport'
import { reportPois } from '@/lib/reportPois'

export const maxDuration = 40

// Report PDF di un immobile pubblicato ("Scarica il report" sul sito dell'agente): HTML pronto da stampare.
// Solo immobili pubblici (slug + id). La CDN tiene la risposta un'ora.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const slug = (q.get('slug') ?? '').slice(0, 60), id = (q.get('id') ?? '').slice(0, 60)
  const s = slug && id ? await loadSite('it', slug) : null
  const p = s?.properties.find(x => x.id === id)
  if (!s || !p || s.cfg.hidden.includes('page:immobile')) return new Response('not found', { status: 404 })
  const pois = await reportPois(p.addr, p.details)
  const url = siteUrl(slug)
  const html = buildPropertyReportHtml({ p, name: s.name, logo: s.cfg.logo || s.logo, cfg: s.cfg, url, pois, origin: req.nextUrl.origin, online: `${url}/${p.id}` })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600', 'X-Robots-Tag': 'noindex' } })
}
