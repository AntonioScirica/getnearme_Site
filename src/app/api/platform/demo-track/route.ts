import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Iscritti grazie alla prova gratis della landing: la piattaforma lo segnala una volta per utente (segno nel browser
// lasciato dalla prova). Una riga a costo zero in ai_usage (kind landing_signup), niente tabelle nuove.
// Conti in supabase/queries/prova_landing.sql.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { video?: unknown } | null
  const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('kind', 'landing_signup')
  if (!count) await admin.from('ai_usage').insert({ user_id: data.user.id, kind: 'landing_signup', provider: 'counter', model: b?.video === true ? 'foto+video' : 'foto', duration_ms: 0, cost_usd: 0, ok: true } as never)
  return NextResponse.json({ ok: true })
}
