import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchListingPage } from '@/lib/pageFetch'
import { overDailyCap } from '@/lib/ai'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 200

// "Miglioralo" senza estensione: il server legge la pagina dell'annuncio (diretto, poi servizio con proxy) e la
// restituisce nello stesso formato dell'estensione. Solo utenti registrati, solo pagine che sembrano annunci.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let url: unknown
  try { ({ url } = await req.json()) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (typeof url !== 'string') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  // letture a pagamento (ZenRows): tetto giornaliero condiviso con Importa da link
  if (await overDailyCap(data.user.id, ['lettura_annuncio'], Number(process.env.LISTING_READ_DAILY_LIMIT) || 100)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  const r = await fetchListingPage(url, data.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'invalid_url' ? 400 : 422 })
  return NextResponse.json({ url, title: r.title, address: '', propertyInfo: r.fields ?? {}, photos: r.photos, raw: r.raw, via: r.via })
}
