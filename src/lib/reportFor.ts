import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { toSiteProperty, siteUrl, type PublicProperty } from '@/lib/portfolio'
import { cleanSite } from '@/lib/siteTemplates'
import { buildPropertyReportHtml } from '@/lib/propertyReport'
import { reportPois } from '@/lib/reportPois'
import { hasSitePlan } from '@/lib/sitePlan'

// Scheda (report) di un immobile: la usano il Report PDF della piattaforma e il link pubblico firmato /api/s/<id>
// (Manda al cliente senza sito: il cliente apre la scheda dal link su WhatsApp, niente PDF da salvare e allegare).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const COLS = 'id, user_id, titolo, nome, descrizione, addr, prezzo, mq, locali, camere, bagni, tipologia, cover, import_data, riferimento, created_at, is_public'

export const reportSig = (id: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`scheda:${id}`).digest('base64url').slice(0, 16)
export const reportSigOk = (id: string, k: string) => k.length === 16 && timingSafeEqual(Buffer.from(k), Buffer.from(reportSig(id)))

// ownerIds: chi puo' leggere l'immobile (utente e il suo team); null = link pubblico gia' verificato con la firma
export async function reportHtmlFor(id: string, ownerIds: string[] | null, origin: string): Promise<string | null> {
  let q = admin.from('projects').select(COLS).eq('id', id)
  if (ownerIds) q = q.in('user_id', ownerIds)
  const { data: row } = await q.maybeSingle()
  if (!row) return null
  const uid = row.user_id as string
  const [{ data: b }, { data: au }] = await Promise.all([
    admin.from('user_brand').select('portfolio_slug, company_name, display_name, company_email, logo_colored_h, logo_black_h, site_published').eq('user_id', uid).maybeSingle(),
    admin.auth.admin.getUserById(uid),
  ])
  const u = au.user
  const name = b?.display_name || b?.company_name || u?.user_metadata?.full_name || 'Agente immobiliare'
  const cfg = cleanSite(u?.user_metadata?.vetrina_site, name, b?.company_email || u?.email || '')
  const slug = (b?.portfolio_slug as string | null) ?? null
  const siteOn = !!slug && !!b?.site_published && (await hasSitePlan(uid))
  // link all'annuncio online solo se davvero raggiungibile; senza sito online niente indirizzo del sito
  const online = siteOn && row.is_public ? `${siteUrl(slug!)}/${row.id}` : ''
  const p = toSiteProperty(row as PublicProperty)
  const pois = await reportPois(p.addr, p.details)
  return buildPropertyReportHtml({ p, name, logo: cfg.logo || b?.logo_colored_h || b?.logo_black_h, cfg, url: siteOn ? siteUrl(slug!) : '', pois, origin, online })
}
