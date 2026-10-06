import type { PortfolioBrand } from '@/lib/portfolio'
import type { SiteConfig } from '@/lib/siteTemplates'

// Marchio dell'agente per le card: come il sito (nome agenzia, logo del sito o del profilo, colore, ruolo e citta')
export function agentInfo(slug: string, brand: PortfolioBrand, cfg: SiteConfig) {
  const role = cfg.agentRole || 'Agente immobiliare'
  const host = process.env.NEXT_PUBLIC_PORTFOLIO_HOST
  return {
    name: cfg.agencyName || brand.display_name || brand.company_name || 'Immobili',
    logo: cfg.logo || brand.logo_colored_h || brand.logo_black_h,
    primary: cfg.primary,
    place: cfg.city ? `${role} a ${cfg.city}` : role,
    domain: host ? `${host}/${slug}` : `agenteimmo.me/${slug}`,
  }
}
