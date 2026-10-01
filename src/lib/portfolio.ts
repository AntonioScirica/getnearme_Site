import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { headers } from 'next/headers'
import { cityOf, cleanSite, pageHidden, zoneSlug, type SiteConfig, type SiteProperty } from './siteTemplates'
import { hasSitePlan, sitePlanHolders } from './sitePlan'
import { listKeys, publicUrl } from './r2'

// Lettura pubblica del portfolio: service role lato server, SOLO immobili is_public.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export type PortfolioBrand = {
  user_id: string
  portfolio_slug: string
  company_name: string | null
  display_name: string | null
  company_email: string | null
  company_website: string | null
  primary_color: string
  logo_colored_h: string | null
  logo_black_h: string | null
}

export type PublicProperty = {
  id: string
  titolo: string
  nome: string
  descrizione: string
  addr: string
  prezzo: number
  mq: number
  locali: number | null
  camere: number
  bagni: number
  tipologia: string | null
  cover: string
  import_data: Record<string, unknown> | null
  riferimento: string | null
  created_at: string
}

const PROPERTY_COLS = 'id, titolo, nome, descrizione, addr, prezzo, mq, locali, camere, bagni, tipologia, cover, import_data, riferimento, created_at'

// Sito spento o piano scaduto: nome e email dell'agente per una pagina "non disponibile" invece del 404 nudo
export async function getOfflineBrand(slug: string): Promise<{ name: string; email: string } | null> {
  const { data } = await admin.from('user_brand').select('company_name, display_name, company_email').eq('portfolio_slug', slug).maybeSingle()
  return data ? { name: (data.display_name || data.company_name || '') as string, email: (data.company_email || '') as string } : null
}

export async function getBrand(slug: string): Promise<PortfolioBrand | null> {
  const { data } = await admin
    .from('user_brand')
    .select('user_id, portfolio_slug, company_name, display_name, company_email, company_website, primary_color, logo_colored_h, logo_black_h')
    .eq('portfolio_slug', slug)
    .eq('site_published', true) // sito spento dall'agente: 404
    .maybeSingle()
  // piano scaduto o senza sito (Starter): 404 finche' non torna Pro
  return data && (await hasSitePlan(data.user_id as string)) ? data : null
}

export async function getPublicProperties(userId: string): Promise<PublicProperty[]> {
  const { data } = await admin.from('projects').select(PROPERTY_COLS)
    .eq('user_id', userId).eq('is_public', true).order('created_at', { ascending: false })
  return data ?? []
}

// Indirizzo pubblico canonico del sito (per canonical, sitemap, dati strutturati): dominio vetrina se c'e'.
export const siteUrl = (slug: string, path = '') =>
  process.env.NEXT_PUBLIC_PORTFOLIO_HOST ? `https://${process.env.NEXT_PUBLIC_PORTFOLIO_HOST}/${slug}${path}` : `https://agenteimmo.me/it/a/${slug}${path}`

// Base dei link interni: sul dominio vetrina /<slug>, sul sito /<locale>/a/<slug>.
export async function portfolioBase(locale: string, slug: string): Promise<string> {
  const host = (await headers()).get('host')?.split(':')[0].replace(/^www\./, '')
  return host && host === process.env.NEXT_PUBLIC_PORTFOLIO_HOST ? `/${slug}` : `/${locale}/a/${slug}`
}

// Sito vetrina scelto dall'agente (template, colori, testi), ripulito.
export async function getSite(brand: PortfolioBrand): Promise<SiteConfig> {
  const { data } = await admin.auth.admin.getUserById(brand.user_id)
  return cleanSite(data.user?.user_metadata?.vetrina_site, brand.display_name || brand.company_name || '', brand.company_email || '')
}

// Immobile pubblico nella forma usata dai siti vetrina (foto, zona e contratto da import_data).
export function toSiteProperty(p: PublicProperty): SiteProperty {
  const d = (p.import_data ?? {}) as { photos?: unknown; zona?: unknown; contratto?: unknown; details?: unknown; prima?: unknown }
  const prima = d.prima && typeof d.prima === 'object' ? Object.fromEntries(Object.entries(d.prima as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string')) : undefined
  const photos = Array.isArray(d.photos) ? d.photos.filter((x): x is string => typeof x === 'string').slice(0, 40) : []
  return {
    id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, locali: p.locali,
    tipologia: p.tipologia, cover: p.cover, descrizione: p.descrizione, photos: photos.length ? photos : p.cover ? [p.cover] : [],
    prima, riferimento: p.riferimento ?? '', createdAt: p.created_at, details: d.details && typeof d.details === 'object' ? d.details as Record<string, unknown> : undefined,
    contratto: typeof d.contratto === 'string' ? d.contratto : typeof (d.details as { contratto?: unknown } | undefined)?.contratto === 'string' ? String((d.details as { contratto: string }).contratto) : '', zona: Array.isArray(d.zona) ? d.zona.filter((x): x is string => typeof x === 'string').slice(0, 12) : [],
  }
}

// Tutto quello che serve alle pagine del sito vetrina, una volta per richiesta.
export const loadSite = cache(async (locale: string, slug: string) => {
  const brand = await getBrand(slug)
  if (!brand) return null
  const [props, cfg, base] = await Promise.all([getPublicProperties(brand.user_id), getSite(brand), portfolioBase(locale, slug)])
  // video dell'agente per immobile: un solo elenco su R2 (videos/<agente>/casa-<id>/<nome>.mp4), raggruppato per casa
  const vids = new Map<string, string[]>()
  for (const { key } of await listKeys(`videos/${brand.user_id}/`).catch(() => [])) {
    const id = key.match(/\/casa-([\w-]+)\/[^/]+\.mp4$/)?.[1]
    if (id) vids.set(id, [...(vids.get(id) ?? []), publicUrl(key)])
  }
  const properties = props.map(toSiteProperty).map(p => (vids.has(p.id) ? { ...p, videos: vids.get(p.id) } : p))
  // citta' non scritta dall'agente: quella dei suoi immobili
  return { test: await isTestOwner(brand.user_id), cfg: cfg.city ? cfg : { ...cfg, city: cityOf(properties) }, base, name: cfg.agencyName || brand.display_name || brand.company_name || 'Immobili', logo: brand.logo_colored_h || brand.logo_black_h, properties }
})

// Account di prova (agenti simulati, email @agenteimmo-test.local): il loro sito resta visibile ma fuori da Google
// (niente sitemap, noindex), prima finivano nella sitemap con le case finte
const testOwners = new Map<string, boolean>()
export async function isTestOwner(userId: string): Promise<boolean> {
  if (!testOwners.has(userId)) {
    const { data } = await admin.auth.admin.getUserById(userId)
    testOwners.set(userId, !!data.user?.email?.endsWith('@agenteimmo-test.local'))
  }
  return testOwners.get(userId)!
}

// Tutte le pagine pubbliche dei siti degli agenti, per la sitemap del dominio vetrina.
// ponytail: un giro su tutti gli agenti con immobili pubblici (una lettura della config per agente); a migliaia di siti, sitemap index per agente
export async function allSitePages(): Promise<{ url: string; lastModified?: string }[]> {
  const { data: pub } = await admin.from('projects').select('id, user_id, created_at').eq('is_public', true)
  const users = [...new Set((pub ?? []).map(p => p.user_id as string))]
  if (!users.length) return []
  const { data: brands } = await admin.from('user_brand').select('user_id, portfolio_slug, company_name, display_name, company_email').in('user_id', users).not('portfolio_slug', 'is', null).eq('site_published', true)
  const out: { url: string; lastModified?: string }[] = []
  const withPlan = await sitePlanHolders((brands ?? []).map(b => b.user_id as string))
  for (const b of (brands ?? []).filter(b => withPlan.has(b.user_id as string))) {
    if (await isTestOwner(b.user_id as string)) continue
    const slug = b.portfolio_slug as string
    const cfg = await getSite(b as PortfolioBrand)
    const mine = (pub ?? []).filter(p => p.user_id === b.user_id)
    out.push({ url: siteUrl(slug), lastModified: mine[0]?.created_at })
    for (const page of ['immobili', 'servizi', 'contatti', 'agente']) if (!pageHidden(cfg, page)) out.push({ url: siteUrl(slug, `/${page}`) })
    if (!pageHidden(cfg, 'zona')) for (const z of cfg.zones) out.push({ url: siteUrl(slug, `/zona/${zoneSlug(z.name)}`) })
    if (!pageHidden(cfg, 'immobile')) for (const p of mine) out.push({ url: siteUrl(slug, `/${p.id}`), lastModified: p.created_at })
  }
  return out
}
