import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateJson, overDailyCap } from '@/lib/ai'
import { geminiFreeJson } from '@/lib/geminiFree'
import { deepProfanity } from '@/lib/profanity'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 60

// Testo del post social di un immobile (Condividi sui social, scheda dell'immobile). Gratis per l'agente: prima Gemini a
// quota gratuita (costo 0), se manca la chiave o la quota e' finita Haiku 4.5. Un testo e' ~1.500 token in entrata e ~400 in
// uscita, cioe' ~0,4 centesimi di dollaro con Haiku: sotto il centesimo, non vale un credito (deciso il 05/10/2026).
// Tetto giornaliero per utente, come per Riscrivi.
const SYSTEM = `Sei un agente immobiliare italiano che scrive il testo di un post per Instagram e Facebook per una casa della sua agenzia.
Rispondi SOLO con un oggetto JSON con la chiave "testo".
- Italiano, tono da agente di zona: cordiale, concreto, credibile, niente superlativi da pubblicità.
- Struttura: una riga d'apertura con tipologia e zona; una riga con prezzo, metri quadri e locali; 3 o 4 punti forti presi SOLO dai dati e dalla descrizione (uno per riga, ognuno con una emoji sobria all'inizio, ad esempio 🏡 📐 🛏️ 🛁 🌿 ☀️ 🚗 📍); una riga d'invito a scrivere o chiamare per una visita; una riga vuota; da 5 a 8 hashtag in minuscolo con la città, la zona e la tipologia (esempio #casamilano #navigli #trilocale #casainvendita).
- Al massimo 900 caratteri. Non inventare nulla che non sia nei dati. Se c'e' il telefono, mettilo nell'invito.
- Se arredata e' vera, aggiungi prima degli hashtag la riga "Alcune immagini sono arredate virtualmente."
- Niente em dash, usa virgole. Niente link.`
const SCHEMA = { type: 'object', properties: { testo: { type: 'string' } }, required: ['testo'], additionalProperties: false }
type Out = { testo: string }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: { fields?: Record<string, unknown> }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const text = JSON.stringify(b.fields ?? null)
  if (!b.fields || typeof b.fields !== 'object' || text.length > 12000) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (await overDailyCap(data.user.id, ['social_caption'], Number(process.env.SOCIAL_CAPTION_DAILY_LIMIT) || 40)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })

  const input = `Dati dell'immobile (JSON):\n${text}`
  const ok = (o: Partial<Out> | null): o is Out => !!o && typeof o.testo === 'string' && !!o.testo.trim() && !deepProfanity(o)
  const clean = (s: string) => s.replace(/\s*[—–]\s*/g, ', ').trim().slice(0, 1500)

  const free = await geminiFreeJson<Out>({ system: SYSTEM, text: input, userId: data.user.id, kind: 'social_caption', maxTokens: 1500 })
  if (ok(free)) return NextResponse.json({ testo: clean(free.testo) })
  const r = await generateJson<Out>({ system: SYSTEM, text: input, schema: SCHEMA, maxTokens: 1200, usage: { userId: data.user.id, kind: 'social_caption' }, model: 'claude-haiku-4-5-20251001' })
  if (!r.ok || !ok(r.data)) { console.error('social-caption', r.ok ? 'vuoto' : `${r.error} ${r.detail ?? ''}`.slice(0, 400)); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }
  return NextResponse.json({ testo: clean(r.data.testo) })
}
