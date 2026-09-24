import { NextRequest, NextResponse } from 'next/server'
import { TITLE_RULES } from '@/lib/titleRules'
import { generateJson } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Genera titolo, descrizione e score di un annuncio a partire dai dati inseriti
// dall'agente (flow "Crea da zero"). Stesso output servira' al flow "Migliora annuncio".
// ponytail: niente addebito crediti per ora, da agganciare prima dello switch.
const SCHEMA = {
  type: 'object',
  properties: {
    titolo: { type: 'string' },
    descrizione: { type: 'string' },
    score: { type: 'integer' },
    suggerimenti: { type: 'array', items: { type: 'string' } },
  },
  required: ['titolo', 'descrizione', 'score', 'suggerimenti'],
  additionalProperties: false,
}

const SYSTEM = `Sei un copywriter immobiliare italiano esperto. Scrivi annunci per portali come immobiliare.it e idealista.
- Titolo: MASSIMO 60 caratteri spazi inclusi (immobiliare.it taglia a 60). Regole, da ricerca sui portali:
${TITLE_RULES}
- Descrizione: 120-220 parole, italiano naturale, paragrafi brevi. Scrivi in prosa. Usa un elenco puntato (righe che iniziano con "- ") solo se ha davvero senso: molte voci omogenee, di solito 5 o più dotazioni o ambienti, che in una frase diventerebbero un elenco di virgole illeggibile. Al massimo un elenco per descrizione; se le voci sono poche, mettile in una frase. Apri con il punto di forza principale, poi spazi, dotazioni, zona. Usa solo i dati forniti: non inventare caratteristiche, metrature o servizi. Non aggiungere promesse o servizi dell'agenzia non presenti (orari di visita, disponibilità serali, consulenze, mutui). Chiudi al massimo con un invito generico a contattare l'agenzia. Niente em dash, usa virgole.
- Score: da 0 a 100, quanto e' completo e convincente l'annuncio con i dati disponibili (dati mancanti, foto, chiarezza).
- Suggerimenti: 2-5 azioni concrete per migliorare l'annuncio (es. dati mancanti da aggiungere, foto da fare).
- Se nei dati c'e' "zona" (servizi verificati su OpenStreetMap con distanze), dedica 1-2 frasi alla zona citando SOLO quei servizi, dando priorita' a quelli in "zona_evidenza" (scelti dall'agente), con le distanze arrotondate (es. "a circa 400 metri dalla stazione Tibaldi"). Se "zona" manca o e' vuota, non descrivere servizi di zona che non conosci.

VOCE DI TITOLO E DESCRIZIONE: scrivi come un agente immobiliare italiano esperto che pubblica l'annuncio della propria agenzia sul portale.
- Prima persona plurale dell'agenzia ("proponiamo", "vi presentiamo", "l'immobile si compone di").
- Lessico del settore usato con naturalezza: "ottimo stato", "doppia esposizione", "libero al rogito", "spese condominiali contenute", "zona ben servita", "classe energetica".
- Struttura tipica di un buon annuncio d'agenzia: apertura con tipologia, zona e punto di forza; composizione; finiture e dotazioni; contesto e servizi; condizioni (disponibilità, box/cantina); chiusura con invito a contattare l'agenzia per informazioni o visita.
- Titolo: segui le regole del titolo qui sopra.
- Tono professionale, concreto, credibile: niente toni da pubblicità, niente superlativi.`

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { property?: Record<string, unknown>; nFoto?: number }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const input = JSON.stringify({ ...body.property, numero_foto: body.nFoto ?? 0 })
  if (input.length > 8000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  const r = await generateJson<Record<string, unknown>>({
    system: SYSTEM,
    text: `Dati immobile (JSON):\n${input}`,
    schema: SCHEMA,
    usage: { userId: data.user.id, kind: 'describe' },
    maxTokens: 4000,
  })
  if (!r.ok) {
    console.error('describe error:', r.error, r.detail)
    return NextResponse.json({ error: r.error === 'refused' ? 'refused' : 'ai_failed' }, { status: r.error === 'refused' ? 422 : 502 })
  }
  return NextResponse.json(r.data)
}
