import { createHash, createHmac } from 'crypto'
import type { Metadata } from 'next'

// Anteprime dei link (WhatsApp, Facebook, LinkedIn, iMessage): immagini 1200x630 generate da /api/og (vedi ogRender).
// Qui solo gli indirizzi e i meta, niente sharp: lo importano le pagine.
// Gli indirizzi cambiano quando cambia il contenuto (v = impronta dei dati) cosi' le immagini si mettono in cache a lungo.

export const OG_BASE = 'https://agenteimmo.me'
export const OG_W = 1200
export const OG_H = 630
const DESIGN = '1' // cambia qui se cambia la grafica delle card: tutti gli indirizzi diventano nuovi

const OG_LOCALE: Record<string, string> = { it: 'it_IT', en: 'en_US' }

// card di Agente Immo: titolo e sottotitolo stanno nell'indirizzo, firmati (nessuno puo' fare card col nostro marchio e testo suo)
const secret = () => process.env.OG_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'agenteimmo-og'
export const ogSign = (t: string, s: string) => createHmac('sha256', secret()).update(`${DESIGN}\n${t}\n${s}`).digest('base64url').slice(0, 16)

export function immoOgImage(title: string, subtitle = ''): string {
  const t = title.slice(0, 120), s = subtitle.slice(0, 160)
  const q = new URLSearchParams({ t, ...(s ? { s } : {}), k: ogSign(t, s) })
  return `${OG_BASE}/api/og?${q}`
}

type ImmoMetaInput = {
  title: string // og:title
  description: string
  url: string
  locale?: string
  type?: 'website' | 'article'
  card?: { title: string; subtitle?: string } // testo della card, se diverso da og:title (piu' corto)
  extra?: Record<string, unknown> // campi in piu' per openGraph (publishedTime...)
}

// openGraph + twitter coerenti per le pagine di Agente Immo
export function immoMeta({ title, description, url, locale = 'it', type = 'website', card, extra }: ImmoMetaInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = immoOgImage(card?.title ?? title, card?.subtitle ?? '')
  return {
    openGraph: { type, url, siteName: 'Agente Immo', locale: OG_LOCALE[locale] ?? 'it_IT', title, description, images: [{ url: image, width: OG_W, height: OG_H, alt: card?.title ?? title, type: 'image/png' }], ...extra } as Metadata['openGraph'],
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

// ---------- Siti degli agenti ----------
const stamp = (x: unknown) => createHash('sha1').update(`${DESIGN}\n${JSON.stringify(x)}`).digest('base64url').slice(0, 10)

type SiteLike = {
  name: string
  logo: string | null
  cfg: { primary: string; city: string; agentRole: string; heroImage: string; ogImage: string; logo: string }
  properties: { id: string; cover: string; titolo: string; prezzo: number; mq: number; locali?: number | null; status?: string; details?: Record<string, unknown>; contratto?: string }[]
}

// copertina del sito: quella caricata dall'agente (gia' 1200x630) oppure la card generata
export function siteOgImage(slug: string, s: SiteLike): { url: string; width: number; height: number; type?: string } {
  if (s.cfg.ogImage) return { url: s.cfg.ogImage, width: OG_W, height: OG_H }
  const v = stamp([s.name, s.cfg.logo || s.logo, s.cfg.primary, s.cfg.city, s.cfg.agentRole, s.cfg.heroImage || s.properties[0]?.cover])
  return { url: `${OG_BASE}/api/og/sito/${encodeURIComponent(slug)}?v=${v}`, width: OG_W, height: OG_H, type: 'image/png' }
}

export function propertyOgImage(slug: string, s: SiteLike, p: SiteLike['properties'][number] & { photos?: string[] }, showPrices: boolean) {
  const v = stamp([s.name, s.cfg.logo || s.logo, s.cfg.primary, p.titolo, p.prezzo, p.mq, p.locali, p.status, p.details?.mostra_prezzo_venduto, p.contratto, p.photos?.[0] || p.cover, showPrices])
  return { url: `${OG_BASE}/api/og/sito/${encodeURIComponent(slug)}/${encodeURIComponent(p.id)}?v=${v}`, width: OG_W, height: OG_H, type: 'image/png' }
}

// openGraph + twitter di una pagina del sito di un agente
export function siteMeta({ name, title, description, url, image }: { name: string; title: string; description: string; url: string; image: { url: string; width: number; height: number; type?: string } }): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: { type: 'website', locale: 'it_IT', siteName: name, url, title, description, images: [{ ...image, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}
