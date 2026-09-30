import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { isDisposableEmail } from '@/lib/disposableEmails'

export const runtime = 'nodejs'

// Registrazione con email: l'account nasce gia' confermato, cosi' dopo il modulo si e' subito dentro (e dalla prova
// della landing si va dritti a /prova). Supabase chiede la conferma email: qui si salta, il client poi fa il login.
// Limite: 5 account l'ora per IP (riga contatore in ai_usage, kind signup), le email usa e getta restano vietate.
// ponytail: email non verificate; se servira' la verifica, mandarla dopo il login senza bloccare l'accesso.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null) as { email?: unknown; password?: unknown; marketing?: unknown } | null
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase() : ''
  const password = typeof b?.password === 'string' ? b.password : ''
  if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return NextResponse.json({ error: 'email' }, { status: 400 })
  if (password.length < 6 || password.length > 200) return NextResponse.json({ error: 'password' }, { status: 400 })
  if (isDisposableEmail(email)) return NextResponse.json({ error: 'disposable' }, { status: 400 })

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'signup').eq('model', who).gte('created_at', new Date(Date.now() - 3_600_000).toISOString())
  if ((count ?? 0) >= 5) return NextResponse.json({ error: 'rate' }, { status: 429 })

  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { marketing_consent: b?.marketing === true, terms_accepted_at: new Date().toISOString(), signup_source: 'site' },
  })
  if (error) return NextResponse.json({ error: /already|exists|registered/i.test(error.message) ? 'exists' : 'failed' }, { status: 400 })
  await admin.from('ai_usage').insert({ user_id: data.user.id, kind: 'signup', provider: 'counter', model: who, duration_ms: 0, cost_usd: 0, ok: true } as never)
  return NextResponse.json({ ok: true })
}
