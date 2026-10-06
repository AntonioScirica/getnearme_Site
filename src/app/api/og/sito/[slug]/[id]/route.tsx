import { NextRequest } from 'next/server'
import { getBrand, getPublicProperties, getSite, toSiteProperty } from '@/lib/portfolio'
import { STATUS_LABELS, closedPriceHidden, isClosed, statusOf, zoneOnly } from '@/lib/siteTemplates'
import { propertyCard } from '@/lib/ogRender'
import { agentInfo } from '../../agentInfo'

// Anteprima del link di un immobile del sito di un agente
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const brand = await getBrand(slug)
  if (!brand) return new Response('not found', { status: 404 })
  const [cfg, props] = await Promise.all([getSite(brand), getPublicProperties(brand.user_id)])
  const raw = props.find(x => x.id === id)
  if (!raw) return new Response('not found', { status: 404 })
  const p = toSiteProperty(raw), st = statusOf(p)
  const rent = /affitt/i.test(p.contratto ?? '')
  const price = cfg.showPrices && !closedPriceHidden(p) && p.prezzo ? `€ ${Number(p.prezzo).toLocaleString('it-IT')}${rent ? '/mese' : ''}` : ''
  const facts = [p.mq ? `${p.mq} m²` : '', p.locali ? `${p.locali} ${p.locali === 1 ? 'locale' : 'locali'}` : '', p.zona?.[0] || zoneOnly(p.addr)].filter(Boolean).join('  ·  ')
  return propertyCard(agentInfo(slug, brand, cfg), { title: p.titolo.split(' | ')[0], price, facts, photo: p.photos?.[0] || p.cover || null, stamp: isClosed(st) ? STATUS_LABELS[st][0] : null })
}
