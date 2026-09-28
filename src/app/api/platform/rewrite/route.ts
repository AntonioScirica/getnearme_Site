import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canAfford, spend } from '@/lib/credits'
import { generateJson } from '@/lib/ai'
import { geminiFreeJson } from '@/lib/geminiFree'
import { TITLE_RULES } from '@/lib/titleRules'
import { deepProfanity } from '@/lib/profanity'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 300

// "Riscrivi l'annuncio" (Miglioralo): nuovo titolo e descrizione dai campi letti. Solo testo, niente foto.
// Prima Gemini a quota gratuita (costo 0, gratis anche per l'agente); se manca la chiave o la quota e' finita,
// Sonnet 5 (~0,01 $ a riscrittura, scelto il 28/09: scrive meglio di Haiku e costa meno del credito) e si scala 1 credito.
const SYSTEM = `Sei un consulente esperto di annunci immobiliari italiani (immobiliare.it, idealista, casa.it). Ricevi i dati e il testo di un annuncio gia' pubblicato e lo riscrivi meglio.
Rispondi SOLO con un oggetto JSON con le chiavi "titolo" e "descrizione".
- titolo: nuovo titolo, MASSIMO 60 caratteri spazi inclusi (immobiliare.it taglia a 60). Regole, da ricerca sui portali:
${TITLE_RULES}
- descrizione: la descrizione originale riscritta meglio, NON riassunta. Tieni TUTTE le informazioni dell'originale e dei dati (ambienti, misure, piano, finiture, dotazioni, spese, servizi e luoghi vicini, trasporti, distanze, disponibilità): se l'originale nomina scuole, negozi, metro o parchi vicini, restano tutti. Riorganizza in paragrafi brevi e ordinati (apertura con tipologia, zona e punto di forza; composizione; finiture e dotazioni; zona e servizi vicini; condizioni), correggi refusi e forma. Lunghezza simile all'originale o maggiore, mai più corta. Prosa; un elenco puntato (righe che iniziano con "- ") solo per 5 o più voci omogenee, al massimo uno. Usa SOLO informazioni presenti nell'annuncio: non inventare. Non aggiungere promesse o servizi dell'agenzia non presenti (orari di visita, disponibilità serali, consulenze, mutui). Chiudi al massimo con un invito generico a contattare l'agenzia. Niente em dash, usa virgole.

VOCE DI TITOLO E DESCRIZIONE: scrivi come un agente immobiliare italiano esperto che pubblica l'annuncio della propria agenzia sul portale.
- Prima persona plurale dell'agenzia ("proponiamo", "vi presentiamo", "l'immobile si compone di").
- Lessico del settore usato con naturalezza: "ottimo stato", "doppia esposizione", "libero al rogito", "spese condominiali contenute", "zona ben servita", "classe energetica".
- Struttura tipica di un buon annuncio d'agenzia: apertura con tipologia, zona e punto di forza; composizione; finiture e dotazioni; contesto e servizi; condizioni (disponibilità, box/cantina); chiusura con invito a contattare l'agenzia per informazioni o visita.
- Titolo: segui le regole del campo titolo qui sopra.
- Tono professionale, concreto, credibile: niente toni da pubblicità, niente superlativi.`
const SCHEMA = { type: 'object', properties: { titolo: { type: 'string' }, descrizione: { type: 'string' } }, required: ['titolo', 'descrizione'], additionalProperties: false }
type Out = { titolo: string; descrizione: string }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: { fields?: Record<string, unknown>; url?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const text = JSON.stringify({ url: b.url, ...b.fields })
  if (!b.fields || text.length > 30000) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const input = `Annuncio attuale (JSON):\n${text}`
  const ok = (o: Partial<Out> | null): o is Out => !!o && typeof o.titolo === 'string' && typeof o.descrizione === 'string' && !!o.descrizione.trim()

  const free = await geminiFreeJson<Out>({ system: SYSTEM, text: input, userId: data.user.id, kind: 'rewrite', maxTokens: 6000 })
  if (ok(free) && !deepProfanity(free)) return NextResponse.json({ titolo: free.titolo, descrizione: free.descrizione, gratis: true })

  // ripiego a pagamento: Sonnet 5, 1 credito
  if (!(await canAfford(data.user.id, 'riscrivi'))) return NextResponse.json({ error: 'no_credits' }, { status: 402 })
  const r = await generateJson<Out>({ system: SYSTEM, text: input, schema: SCHEMA, usage: { userId: data.user.id, kind: 'rewrite' }, model: 'claude-sonnet-5' })
  if (!r.ok || !ok(r.data)) return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  await spend(data.user.id, 'riscrivi', { url: b.url })
  return NextResponse.json({ titolo: r.data.titolo, descrizione: r.data.descrizione, gratis: false })
}
