import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractFields, type ListingIn } from '@/lib/listingExtract'
import { rulesAnalysis } from '@/lib/listingRules'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 60

// "Miglioralo": riceve la pagina dell'annuncio (letta dall'estensione, dal server con read-listing, o testo incollato)
// e restituisce il verdetto. Niente GPU nostra: i campi li legge Gemini a quota gratuita (o le regex, se non c'e'),
// il punteggio e i problemi sono a regole (lib/listingRules). Gratis per noi, quindi anche per l'agente.
// La riscrittura di titolo e descrizione e' su richiesta: api/platform/rewrite.
// (Fino al 28/09/2026 era un'unica analisi con foto su Qwen/RunPod: ~3 min e ~0,06-0,10 $ ognuna.)
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let listing: ListingIn
  try { ({ listing } = await req.json()) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (!listing || typeof listing !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (JSON.stringify(listing).length > 400_000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  const fields = await extractFields(listing, data.user.id)
  return NextResponse.json({ ...rulesAnalysis(fields), fields })
}
