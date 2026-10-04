import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { hasSitePlan } from '@/lib/sitePlan'

// Richieste arrivate dal modulo di contatto del sito (site_leads, senza policy RLS: solo da qui, solo le proprie).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const STATUSES = ['nuova', 'richiamata', 'visita', 'chiusa'] as const
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET -> { leads: [{ id, name, email, phone, message, status, created_at, project_id, property }], sitePlan }
// ponytail: le ultime 500, senza paginazione
export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const [{ data, error }, sitePlan] = await Promise.all([
    admin.from('site_leads').select('id, name, email, phone, message, status, created_at, project_id').eq('user_id', u.id).order('created_at', { ascending: false }).limit(500),
    hasSitePlan(u.id),
  ])
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  const ids = [...new Set((data ?? []).map(l => l.project_id).filter((x): x is string => !!x))]
  const { data: props } = ids.length ? await admin.from('projects').select('id, titolo, nome, cover').eq('user_id', u.id).in('id', ids) : { data: [] }
  const byId = new Map((props ?? []).map(p => [p.id as string, { id: p.id as string, title: (p.titolo || p.nome || '') as string, cover: (p.cover || null) as string | null }]))
  return NextResponse.json({ sitePlan, leads: (data ?? []).map(l => ({ ...l, property: l.project_id ? byId.get(l.project_id) ?? null : null })) })
}

// PATCH { id, status } -> stato della richiesta (solo le proprie)
export async function PATCH(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { id?: unknown; status?: unknown } | null
  if (typeof b?.id !== 'string' || !UUID.test(b.id) || !STATUSES.includes(b.status as typeof STATUSES[number])) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { data, error } = await admin.from('site_leads').update({ status: b.status }).eq('id', b.id).eq('user_id', u.id).select('id, status').maybeSingle()
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
