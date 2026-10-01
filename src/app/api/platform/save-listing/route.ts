import { deepProfanity } from '@/lib/profanity'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveListingProject, str } from '@/lib/saveListing'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const runtime = 'nodejs'
export const maxDuration = 60

// "Salva nei miei immobili" da Migliora annuncio: copia TUTTE le foto su R2 e salva tutti i dati letti (lib/saveListing).

type Body = {
  titolo?: string; descrizione?: string; score?: number; suggerimenti?: string[]
  details?: Record<string, unknown> // scheda completa estratta dall'AI (campi di propertyFields)
  listing?: { url?: string; title?: string; address?: string; propertyInfo?: Record<string, unknown>; photos?: string[] }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let b: Body
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (deepProfanity(b)) return NextResponse.json({ error: 'profanity' }, { status: 400 })
  const l = b.listing
  if (!l) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const info = l.propertyInfo && typeof l.propertyInfo === 'object' ? l.propertyInfo : {}
  // portale senza titolo: se ne compone uno dai dati (tipologia, locali, zona), mai un salvataggio rifiutato per questo
  const fi = info as Record<string, unknown>
  const titolo = str(b.titolo, 200) || str(fi.titolo, 200) || str(l.title, 200)
    || [str(fi.tipologia, 60), str(fi.locali, 10) && `${str(fi.locali, 10)} locali`, str(fi.zona, 80)].filter(Boolean).join(', ') || 'Immobile'
  if (JSON.stringify(info).length > 30000) return NextResponse.json({ error: 'too_large' }, { status: 400 })
  const details = b.details && typeof b.details === 'object' && !Array.isArray(b.details) ? b.details : {}
  if (JSON.stringify(details).length > 20000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  try {
    const r = await saveListingProject(userId, { titolo, descrizione: b.descrizione, score: b.score, suggerimenti: b.suggerimenti, details, listing: l, source: 'portal' })
    return NextResponse.json(r)
  } catch (e) {
    console.error('save-listing error:', e)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}
