import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

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
  import_data: { photos?: string[]; contratto?: string; piano?: string; classe?: string; caratteristiche?: string[]; info?: Record<string, string | undefined> } | null
}

const PROPERTY_COLS = 'id, titolo, nome, descrizione, addr, prezzo, mq, locali, camere, bagni, tipologia, cover, import_data'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export async function getPublicProperty(userId: string, id: string): Promise<PublicProperty | null> {
  if (!UUID_RE.test(id)) return null
  const { data } = await admin.from('projects').select(PROPERTY_COLS)
    .eq('id', id).eq('user_id', userId).eq('is_public', true).maybeSingle()
  return data
}

// Base dei link interni: sul dominio vetrina /<slug>, sul sito /<locale>/a/<slug>.
export async function portfolioBase(locale: string, slug: string): Promise<string> {
  const host = (await headers()).get('host')?.split(':')[0].replace(/^www\./, '')
  return host && host === process.env.NEXT_PUBLIC_PORTFOLIO_HOST ? `/${slug}` : `/${locale}/a/${slug}`
}
