import { NextRequest, NextResponse } from 'next/server'
import { isMetricsRequest } from '@/lib/metricsAuth'
import { buildActivity, type ActivityResponse } from '@/lib/userActivity'

// Cronologia di un iscritto (riga espansa della pagina Agente Immo del dashboard /metrics). Solo letture.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const cache = new Map<string, { at: number; data: ActivityResponse }>()

export async function GET(req: NextRequest) {
  if (!isMetricsRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < 30_000 && !req.nextUrl.searchParams.has('fresh')) return NextResponse.json(hit.data)
  try {
    const data = await buildActivity(id)
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (cache.size > 200) cache.clear()
    cache.set(id, { at: Date.now(), data })
    return NextResponse.json(data)
  } catch (e) {
    console.error('metrics/agenteimmo/user', e)
    return NextResponse.json({ error: 'Errore nel caricamento della cronologia' }, { status: 500 })
  }
}
