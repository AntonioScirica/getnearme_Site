import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractFields, type ListingIn } from '@/lib/listingExtract'
import { overDailyCap } from '@/lib/ai'
import { rulesAnalysis } from '@/lib/listingRules'
import { getCredits } from '@/lib/credits'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 60
const FREE_ANALYSES = 5

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

  let listing: ListingIn, lang: unknown
  try { ({ listing, lang } = await req.json()) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (!listing || typeof listing !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (JSON.stringify(listing).length > 400_000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  // Gemini a quota gratuita, ma la quota e' unica per tutti: tetto per agente (ANALYZE_DAILY_LIMIT, 100)
  if (await overDailyCap(data.user.id, ['extract'], Number(process.env.ANALYZE_DAILY_LIMIT) || 100)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  // senza piano: 5 analisi gratis in tutto (righe contatore in ai_usage, kind analyze_free), poi si sceglie un piano
  const c = await getCredits(data.user.id)
  const free = c.plan === 'none' && !c.unlimited
  if (free) {
    const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('kind', 'analyze_free')
    if ((count ?? 0) >= FREE_ANALYSES) return NextResponse.json({ error: 'free_limit' }, { status: 402 })
  }
  const fields = await extractFields(listing, data.user.id)
  if (free) await admin.from('ai_usage').insert({ user_id: data.user.id, kind: 'analyze_free', provider: 'counter', model: 'analyze', duration_ms: 0, cost_usd: 0, ok: true } as never)
  return NextResponse.json({ ...rulesAnalysis(fields, lang === 'en' ? 'en' : 'it'), fields })
}
