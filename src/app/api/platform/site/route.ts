import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cleanSite } from '@/lib/siteTemplates'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Sito vetrina dell'agente: configurazione in user_metadata.vetrina_site (nessuna tabella nuova).
// ponytail: se servono versioni o piu' siti per agente, spostarla in una colonna jsonb di user_brand.
async function user(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user ?? null
}

async function brandOf(userId: string) {
  const { data } = await admin.from('user_brand').select('portfolio_slug, company_name, display_name, company_email, logo_colored_h, logo_black_h').eq('user_id', userId).maybeSingle()
  return { slug: data?.portfolio_slug ?? null, name: data?.company_name || data?.display_name || '', email: data?.company_email || '', logo: data?.logo_colored_h || data?.logo_black_h || null }
}

export async function GET(req: NextRequest) {
  const u = await user(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await brandOf(u.id)
  return NextResponse.json({ ...b, config: cleanSite(u.user_metadata?.vetrina_site, b.name, b.email || u.email || '') })
}

export async function PUT(req: NextRequest) {
  const u = await user(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const b = await brandOf(u.id)
  const config = cleanSite(body, b.name, b.email || u.email || '')
  const { error } = await admin.auth.admin.updateUserById(u.id, { user_metadata: { ...u.user_metadata, vetrina_site: config } })
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  return NextResponse.json({ config })
}
