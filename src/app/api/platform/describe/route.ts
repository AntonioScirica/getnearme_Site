import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const anthropic = new Anthropic()

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
- Titolo: max 70 caratteri, concreto (tipologia, zona, punto di forza). Niente maiuscolo urlato, niente emoji.
- Descrizione: 120-220 parole, italiano naturale, paragrafi brevi. Apri con il punto di forza principale, poi spazi, dotazioni, zona. Usa solo i dati forniti: non inventare caratteristiche, metrature o servizi. Niente em dash, usa virgole.
- Score: da 0 a 100, quanto e' completo e convincente l'annuncio con i dati disponibili (dati mancanti, foto, chiarezza).
- Suggerimenti: 2-5 azioni concrete per migliorare l'annuncio (es. dati mancanti da aggiungere, foto da fare).`

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { property?: Record<string, unknown>; nFoto?: number }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const input = JSON.stringify({ ...body.property, numero_foto: body.nFoto ?? 0 })
  if (input.length > 8000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  try {
    const res = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Dati immobile (JSON):\n${input}` }],
    })
    if (res.stop_reason === 'refusal') return NextResponse.json({ error: 'refused' }, { status: 422 })
    const text = res.content.find(b => b.type === 'text')
    if (!text || text.type !== 'text') return NextResponse.json({ error: 'empty' }, { status: 502 })
    return NextResponse.json(JSON.parse(text.text))
  } catch (e) {
    console.error('describe error:', e)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}
