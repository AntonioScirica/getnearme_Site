import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { headers } from 'next/headers'
import { cleanSite, type SiteConfig, type SiteProperty } from './siteTemplates'

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
}

const PROPERTY_COLS = 'id, titolo, nome, descrizione, addr, prezzo, mq, locali, camere, bagni, tipologia, cover, import_data'

export async function getBrand(slug: string): Promise<PortfolioBrand | null> {
  const { data } = await admin
    .from('user_brand')
    .select('user_id, portfolio_slug, company_name, display_name, company_email, company_website, primary_color, logo_colored_h, logo_black_h')
    .eq('portfolio_slug', slug)
    .maybeSingle()
  return data
}

export async function getPublicProperties(userId: string): Promise<PublicProperty[]> {
  const { data } = await admin.from('projects').select(PROPERTY_COLS)
    .eq('user_id', userId).eq('is_public', true).order('created_at', { ascending: false })
  return data ?? []
}

// Base dei link interni: sul dominio vetrina /<slug>, sul sito /<locale>/a/<slug>.
export async function portfolioBase(locale: string, slug: string): Promise<string> {
  const host = (await headers()).get('host')?.split(':')[0].replace(/^www\./, '')
  return host && host === process.env.NEXT_PUBLIC_PORTFOLIO_HOST ? `/${slug}` : `/${locale}/a/${slug}`
}

// Sito vetrina scelto dall'agente (template, colori, testi), ripulito.
export async function getSite(brand: PortfolioBrand): Promise<SiteConfig> {
  const { data } = await admin.auth.admin.getUserById(brand.user_id)
  return cleanSite(data.user?.user_metadata?.vetrina_site, brand.company_name || brand.display_name || '', brand.company_email || '')
}

// Immobile pubblico nella forma usata dai siti vetrina (foto, zona e contratto da import_data).
export function toSiteProperty(p: PublicProperty): SiteProperty {
  const d = (p.import_data ?? {}) as { photos?: unknown; zona?: unknown; contratto?: unknown }
  const photos = Array.isArray(d.photos) ? d.photos.filter((x): x is string => typeof x === 'string').slice(0, 40) : []
  return {
    id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, locali: p.locali,
    tipologia: p.tipologia, cover: p.cover, descrizione: p.descrizione, photos: photos.length ? photos : p.cover ? [p.cover] : [],
    contratto: typeof d.contratto === 'string' ? d.contratto : '', zona: Array.isArray(d.zona) ? d.zona.filter((x): x is string => typeof x === 'string').slice(0, 12) : [],
  }
}

// Tutto quello che serve alle pagine del sito vetrina, una volta per richiesta.
export const loadSite = cache(async (locale: string, slug: string) => {
  const brand = await getBrand(slug)
  if (!brand) return null
  const [props, cfg, base] = await Promise.all([getPublicProperties(brand.user_id), getSite(brand), portfolioBase(locale, slug)])
  return { cfg, base, name: brand.company_name || brand.display_name || 'Immobili', logo: brand.logo_colored_h || brand.logo_black_h, properties: props.map(toSiteProperty) }
})
