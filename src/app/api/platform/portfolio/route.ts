import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Stesso vincolo del CHECK su user_brand.portfolio_slug.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/
// Sul dominio vetrina questi prefissi non arrivano alla pagina portfolio (esclusi dal matcher in proxy.ts).
const RESERVED_RE = /^(api|metrics|nfc)/
const validSlug = (s: string) => SLUG_RE.test(s) && !RESERVED_RE.test(s)
// Parole da non avere in un indirizzo pubblico (it + en), come sottostringa senza trattini ("cazz-o" non passa).
// Niente radici corte che stanno dentro cognomi o paesi veri (Cazzaniga, Negri, Ficarra, Troia, Madonna di Campiglio).
const BAD = ['cazzo', 'merda', 'merdos', 'stronz', 'puttan', 'vaffa', 'fanculo', 'minchia', 'pompin', 'bastard', 'coglion', 'frocio', 'froci', 'ricchion', 'porcodio', 'porcamadonna', 'diocan', 'zoccola', 'sborr', 'inculat',
  'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'nigg', 'whore', 'slut', 'asshole', 'porn', 'hitler']
const badSlug = (s: string) => { const flat = s.replace(/-/g, ''); return BAD.some(w => flat.includes(w)) }

const getUserId = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

// Primo slug libero tra base, base-2 ... base-99 (lo slug gia' dell'utente conta come libero).
async function firstFree(base: string, userId: string): Promise<string | null> {
  const { data } = await admin.from('user_brand').select('portfolio_slug, user_id').like('portfolio_slug', `${base}%`)
  const taken = new Set((data ?? []).filter(r => r.user_id !== userId).map(r => r.portfolio_slug))
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
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: 'invalid_name' }, { status: 400 })

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
