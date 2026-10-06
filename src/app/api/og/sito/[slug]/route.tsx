import { NextRequest } from 'next/server'
import { getBrand, getPublicProperties, getSite } from '@/lib/portfolio'
import { cityOf } from '@/lib/siteTemplates'
import { siteCard } from '@/lib/ogRender'
import { agentInfo } from '../agentInfo'

// Anteprima del link del sito di un agente (card automatica: la copertina caricata dall'agente va diretta, vedi siteOgImage)
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await getBrand(slug)
  if (!brand) return new Response('not found', { status: 404 })
  const [cfg, props] = await Promise.all([getSite(brand), getPublicProperties(brand.user_id)])
  const city = cfg.city || cityOf(props)
  return siteCard(agentInfo(slug, brand, { ...cfg, city }), cfg.heroImage || props[0]?.cover || null)
}
