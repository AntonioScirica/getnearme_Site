import { badSlug, hasProfanity } from '@/lib/profanity'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isReserved } from '@/lib/reservedPaths'
import { isPlatformAdmin } from '@/lib/platformAdmins'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Stesso vincolo del CHECK su user_brand.portfolio_slug.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/
// Su agenteimmo.me sito e piattaforma condividono il dominio: le pagine della piattaforma non possono essere slug.
const validSlug = (s: string) => SLUG_RE.test(s) && !isReserved(s)

const getUserId = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

// Il nome del sito e' "tenuto" solo da chi paga: piano Agente Immo attivo, vecchio abbonamento GetNearMe o admin.
// Chi non ha un piano puo' sceglierlo, ma resta libero per gli altri finche' non paga (27/09/2026).
async function payers(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const now = new Date().toISOString()
  const [{ data: plat }, { data: old }, admins] = await Promise.all([
    admin.from('platform_credits').select('user_id').in('user_id', ids).neq('plan', 'none').gt('subscription_until', now),
    admin.from('user_credits').select('user_id, subscription_type').in('user_id', ids),
    Promise.all(ids.map(id => admin.auth.admin.getUserById(id).then(r => (isPlatformAdmin(r.data.user?.email) ? id : null)).catch(() => null))),
  ])
  return new Set([
    ...(plat ?? []).map(r => r.user_id as string),
    ...(old ?? []).filter(r => r.subscription_type && !['free', 'ambassador'].includes(r.subscription_type)).map(r => r.user_id as string),
    ...admins.filter((x): x is string => !!x),
  ])
}

// Primo slug libero tra base, base-2 ... base-99 (lo slug gia' dell'utente e quelli di chi non paga contano come liberi).
async function firstFree(base: string, userId: string): Promise<string | null> {
  const { data } = await admin.from('user_brand').select('portfolio_slug, user_id').like('portfolio_slug', `${base}%`)
  const others = (data ?? []).filter(r => r.user_id !== userId)
  const paid = await payers(others.map(r => r.user_id as string))
  const taken = new Set(others.filter(r => paid.has(r.user_id as string)).map(r => r.portfolio_slug))
  for (let i = 1; i < 100; i++) {
    const s = i === 1 ? base : `${base.slice(0, 36)}-${i}`
    if (!taken.has(s)) return s
  }
  return null
}

// GET            -> { slug, name } dell'utente
// GET ?check=xx  -> { available, suggestion }
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const check = req.nextUrl.searchParams.get('check')
  if (check !== null) {
    if (!validSlug(check) || badSlug(check)) return NextResponse.json({ available: false, suggestion: null, invalid: true, bad: badSlug(check) })
    const suggestion = await firstFree(check, userId)
    return NextResponse.json({ available: suggestion === check, suggestion })
  }

  const { data } = await admin.from('user_brand').select('portfolio_slug, display_name').eq('user_id', userId).maybeSingle()
  return NextResponse.json({ slug: data?.portfolio_slug ?? null, name: data?.display_name ?? null })
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: { slug?: unknown; name?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const { slug } = body
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (typeof slug !== 'string' || !validSlug(slug) || badSlug(slug)) return NextResponse.json({ error: 'invalid_slug' }, { status: 400 })
  if (name.length < 2 || name.length > 80 || hasProfanity(name)) return NextResponse.json({ error: 'invalid_name' }, { status: 400 })

  // nome tenuto da chi non paga: si libera (quell'agente ne sceglie un altro al prossimo accesso, il suo sito va offline)
  const { data: holder } = await admin.from('user_brand').select('user_id').eq('portfolio_slug', slug).neq('user_id', userId).maybeSingle()
  if (holder) {
    if ((await payers([holder.user_id as string])).size) return NextResponse.json({ error: 'slug_taken', suggestion: await firstFree(slug, userId) }, { status: 409 })
    await admin.from('user_brand').update({ portfolio_slug: null, site_published: false, updated_at: new Date().toISOString() }).eq('user_id', holder.user_id)
  }
  const { error } = await admin.from('user_brand').upsert(
    { user_id: userId, portfolio_slug: slug, display_name: name, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  // Il vincolo UNIQUE chiude la race tra check e salvataggio.
  if (error?.code === '23505') return NextResponse.json({ error: 'slug_taken', suggestion: await firstFree(slug, userId) }, { status: 409 })
  if (error) {
    console.error('portfolio save error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
  return NextResponse.json({ slug, name })
}
