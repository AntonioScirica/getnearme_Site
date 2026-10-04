import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBrand } from '@/lib/portfolio'

// Visita alla scheda di un immobile sul sito dell'agente (anche dominio vetrina ed embed): +1 al giorno in property_views.
// Il browser la manda una volta al giorno per immobile (localStorage); qui si scartano i bot e chi martella.
// ponytail: limite in memoria per istanza (60 visite ogni 10 minuti per IP), condiviso solo se arrivano abusi veri
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const hits = new Map<string, number[]>()
const BOT = /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse|facebookexternalhit|whatsapp|telegram|curl|wget|python|axios|node-fetch|go-http|java\//i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 })
  const b = await req.json().catch(() => null) as { slug?: unknown; id?: unknown } | null
  const slug = typeof b?.slug === 'string' ? b.slug.slice(0, 60) : '', id = typeof b?.id === 'string' ? b.id : ''
  if (!slug || !UUID.test(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'x'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 600_000)
  if (recent.length >= 60) return new NextResponse(null, { status: 204 })
  hits.set(ip, [...recent, now])

  // solo immobili pubblici di un sito acceso (getBrand controlla sito pubblicato e piano)
  const brand = await getBrand(slug)
  if (!brand) return new NextResponse(null, { status: 204 })
  const { data: p } = await admin.from('projects').select('id').eq('id', id).eq('user_id', brand.user_id).eq('is_public', true).maybeSingle()
  if (!p) return new NextResponse(null, { status: 204 })
  const { error } = await admin.rpc('bump_property_view', { p_project: id })
  if (error) { console.error('[site/view] bump_property_view', error.message); return NextResponse.json({ error: 'failed' }, { status: 500 }) }
  return new NextResponse(null, { status: 204 })
}
