import { deepProfanity } from '@/lib/profanity'
import { NextRequest, NextResponse } from 'next/server'
import { hasSitePlan } from '@/lib/sitePlan'
import { createClient } from '@supabase/supabase-js'
import { cleanSite, type SiteConfig } from '@/lib/siteTemplates'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Sito vetrina dell'agente: configurazione in user_metadata.vetrina_site (nessuna tabella nuova).
// ponytail: se servono versioni o piu' siti per agente, spostarla in una colonna jsonb di user_brand.
async function user(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user ?? null
}

async function brandOf(userId: string) {
  const { data } = await admin.from('user_brand').select('portfolio_slug, company_name, display_name, company_email, logo_colored_h, logo_black_h, site_published').eq('user_id', userId).maybeSingle()
  // nome sul sito: quello del profilo della piattaforma (display_name); company_name e' del vecchio kit dell'estensione
  return { slug: data?.portfolio_slug ?? null, name: data?.display_name || data?.company_name || '', email: data?.company_email || '', logo: data?.logo_colored_h || data?.logo_black_h || null, published: !!data?.site_published }
}

export async function GET(req: NextRequest) {
  const u = await user(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await brandOf(u.id)
  return NextResponse.json({ ...b, config: cleanSite(u.user_metadata?.vetrina_site, b.name, b.email || u.email || '') })
}

// Marchio dell'agente (logo, colore, nome agenzia, telefono): una sola fonte, vetrina_site, scritta dall'editor del sito
// e dalla card "Il tuo marchio" del profilo; letta da sito e video (api/platform/video-reel). A ogni salvataggio logo,
// colore e nome agenzia si copiano anche in user_brand, che leggono report e vecchi strumenti: niente valori diversi.
// Logo vuoto = "usa quello del profilo" (sito e video ripiegano su user_brand): si cancella anche li' solo se l'agente
// ha tolto un logo che c'era (prima: logo dell'estensione mai toccato dal sito).
async function syncBrand(userId: string, cfg: SiteConfig, before: unknown) {
  const removed = !cfg.logo && typeof (before as { logo?: unknown } | null)?.logo === 'string' && !!(before as { logo: string }).logo
  await admin.from('user_brand').upsert({ user_id: userId, ...(cfg.logo ? { logo_colored_h: cfg.logo } : removed ? { logo_colored_h: null, logo_black_h: null } : {}), primary_color: cfg.primary, ...(cfg.agencyName ? { company_name: cfg.agencyName } : {}), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}

// PATCH { published } -> accende/spegne il sito pubblico (solo se ha gia' un indirizzo e il piano Pro)
// PATCH { brand: { logo, primary, agencyName, phone } } -> solo questi campi del marchio (card del profilo)
export async function PATCH(req: NextRequest) {
  const u = await user(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as { published?: unknown; brand?: unknown } | null
  if (body?.brand && typeof body.brand === 'object') {
    if (deepProfanity(body.brand)) return NextResponse.json({ error: 'profanity' }, { status: 400 })
    const b = await brandOf(u.id)
    const raw = (u.user_metadata?.vetrina_site ?? {}) as Record<string, unknown>
    const pick = body.brand as Record<string, unknown>
    const next = { ...raw, ...Object.fromEntries(['logo', 'primary', 'agencyName', 'phone'].filter(k => k in pick).map(k => [k, pick[k]])) }
    const config = cleanSite(next, b.name, b.email || u.email || '')
    const { error } = await admin.auth.admin.updateUserById(u.id, { user_metadata: { ...u.user_metadata, vetrina_site: config } })
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
    await syncBrand(u.id, config, 'logo' in pick && !pick.logo ? { logo: 'tolto' } : raw).catch(e => console.error('brand sync', e))
    return NextResponse.json({ config })
  }
  if (typeof body?.published !== 'boolean') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (body.published && !(await hasSitePlan(u.id))) return NextResponse.json({ error: 'plan_required' }, { status: 403 })
  const { data, error } = await admin.from('user_brand').update({ site_published: body.published, updated_at: new Date().toISOString() })
    .eq('user_id', u.id).not('portfolio_slug', 'is', null).select('site_published').maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'save_failed' }, { status: error ? 500 : 409 })
  return NextResponse.json({ published: data.site_published })
}

export async function PUT(req: NextRequest) {
  const u = await user(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (deepProfanity(body)) return NextResponse.json({ error: 'profanity' }, { status: 400 })
  const b = await brandOf(u.id)
  const config = cleanSite(body, b.name, b.email || u.email || '')
  const { error } = await admin.auth.admin.updateUserById(u.id, { user_metadata: { ...u.user_metadata, vetrina_site: config } })
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  await syncBrand(u.id, config, u.user_metadata?.vetrina_site).catch(e => console.error('brand sync', e))
  return NextResponse.json({ config })
}
