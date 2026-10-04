import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'

// Visite alle schede sul sito, per gli immobili dell'agente: { views: { <id>: { d30, total } } }.
// ?ids=a,b,c (al massimo 200); senza ids tutti i suoi immobili. Solo immobili suoi.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const asked = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter(x => UUID.test(x)).slice(0, 200)
  let q = admin.from('projects').select('id').eq('user_id', u.id)
  if (asked.length) q = q.in('id', asked)
  const { data: own } = await q
  const ids = (own ?? []).map(p => p.id as string)
  const views: Record<string, { d30: number; total: number }> = Object.fromEntries(ids.map(id => [id, { d30: 0, total: 0 }]))
  if (!ids.length) return NextResponse.json({ views })
  // ponytail: una riga per immobile e giorno, lette a pagine da 1000 (limite di PostgREST) e sommate qui;
  // con anni di storico e centinaia di case, somma in SQL
  const data: { project_id: string; day: string; views: number }[] = []
  for (let at = 0; ; at += 1000) {
    const { data: page, error } = await admin.from('property_views').select('project_id, day, views').in('project_id', ids).order('day').range(at, at + 999)
    if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
    data.push(...(page ?? []))
    if ((page ?? []).length < 1000) break
  }
  const from = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10) // oggi compreso: 30 giorni
  for (const r of data) {
    const v = views[r.project_id]
    v.total += r.views
    if (r.day >= from) v.d30 += r.views
  }
  return NextResponse.json({ views })
}
