import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamUserIds } from '@/lib/teamScope'
import { toSiteProperty, siteUrl, type PublicProperty } from '@/lib/portfolio'
import { cleanSite } from '@/lib/siteTemplates'
import { buildPropertyReportHtml } from '@/lib/propertyReport'
import { reportPois } from '@/lib/reportPois'
import { hasSitePlan } from '@/lib/sitePlan'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 40
const COLS = 'id, titolo, nome, descrizione, addr, prezzo, mq, locali, camere, bagni, tipologia, cover, import_data, riferimento, created_at, is_public'

// Report PDF di un immobile dalla pagina dell'immobile in piattaforma (anche non pubblicato, anche senza sito):
// stesso documento di "Scarica il report" sul sito, con i dati del profilo e del sito dell'agente. GET ?id=
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const u = data.user
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = (req.nextUrl.searchParams.get('id') ?? '').slice(0, 64)
  if (!/^[\w-]+$/.test(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { data: row } = await admin.from('projects').select(COLS).eq('id', id).in('user_id', await getTeamUserIds(admin, u.id)).maybeSingle()
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const { data: b } = await admin.from('user_brand').select('portfolio_slug, company_name, display_name, company_email, logo_colored_h, logo_black_h, site_published').eq('user_id', u.id).maybeSingle()
  const name = b?.company_name || b?.display_name || u.user_metadata?.full_name || 'Agente immobiliare'
  const cfg = cleanSite(u.user_metadata?.vetrina_site, name, b?.company_email || u.email || '')
  const slug = (b?.portfolio_slug as string | null) ?? null
  // link all'annuncio online solo se davvero raggiungibile: sito acceso, piano col sito, immobile pubblico
  const online = slug && b?.site_published && row.is_public && (await hasSitePlan(u.id)) ? `${siteUrl(slug)}/${row.id}` : ''
  const p = toSiteProperty(row as PublicProperty)
  const pois = await reportPois(p.addr, p.details)
  const html = buildPropertyReportHtml({ p, name, logo: cfg.logo || b?.logo_colored_h || b?.logo_black_h, cfg, url: slug ? siteUrl(slug) : 'https://agenteimmo.me', pois, origin: req.nextUrl.origin, online })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } })
}
