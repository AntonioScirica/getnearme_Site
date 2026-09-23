import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Stesso vincolo del CHECK su user_brand.portfolio_slug.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

const getUserId = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.from('user_brand').select('portfolio_slug').eq('user_id', userId).maybeSingle()
  return NextResponse.json({ slug: data?.portfolio_slug ?? null })
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let slug: unknown
  try { ({ slug } = await req.json()) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return NextResponse.json({ error: 'invalid_slug' }, { status: 400 })

  const { error } = await admin.from('user_brand').upsert({ user_id: userId, portfolio_slug: slug, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error?.code === '23505') return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
  if (error) {
    console.error('portfolio slug error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
  return NextResponse.json({ slug })
}
