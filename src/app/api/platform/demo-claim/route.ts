import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { openKey } from '@/lib/demoProtect'

// Prova della landing: dopo il login i gettoni cifrati diventano gli indirizzi di foto e video puliti (senza filigrana)
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { photo?: unknown; video?: unknown } | null
  const url = (t: unknown) => { const k = typeof t === 'string' ? openKey(t) : null; return k ? `${process.env.R2_PUBLIC_URL}/${k}` : null }
  return NextResponse.json({ photo: url(b?.photo), video: url(b?.video) })
}
