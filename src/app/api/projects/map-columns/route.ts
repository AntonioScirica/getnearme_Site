import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 20

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const { data } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  return data.user?.id ?? null
}

// Mappa gli header di un file import sui campi immobile usando Claude Haiku.
// Solo gli HEADER (+ 1 riga d'esempio) vengono inviati: costo ~zero, indipendente
// dalla dimensione del file. Il client ha comunque un fallback euristico.
const TARGET_KEYS = ['riferimento', 'nome', 'addr', 'prezzo', 'mq', 'locali', 'camere', 'bagni', 'descrizione', 'titolo', 'tipologia', 'photoUrl'] as const

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { headers?: unknown; sample?: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const headers = Array.isArray(body.headers) ? body.headers.filter((h): h is string => typeof h === 'string') : []
  if (!headers.length) return NextResponse.json({ error: 'no_headers' }, { status: 400 })

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const sampleLine = body.sample
    ? '\nEsempio prima riga (valori): ' + JSON.stringify(body.sample).slice(0, 800)
    : ''

  const prompt = `Sei un mappatore di colonne per l'import di immobili (real estate) da file CSV/Excel di agenzie e gestionali italiani.
Header colonne del file: ${JSON.stringify(headers)}${sampleLine}

Mappa ogni CAMPO TARGET al nome ESATTO della colonna piu' adatta tra gli header forniti, oppure null se non c'e'.
Campi target:
- riferimento: codice/ID annuncio (rif interno, codice agenzia)
- nome: nome o etichetta dell'immobile (se non c'e', usa indirizzo o titolo)
- addr: indirizzo / via / comune / localita
- prezzo: prezzo di vendita o affitto
- mq: superficie / metri quadri
- locali: locali / vani
- camere: camere da letto
- bagni: bagni
- descrizione: testo PUBBLICO dell'annuncio. NON usare colonne con note interne/segrete/private.
- titolo: titolo annuncio
- tipologia: tipo immobile (appartamento, villa, attico...)
- photoUrl: url di una foto/immagine

Rispondi SOLO con un oggetto JSON valido, chiavi = i campi target, valori = nome colonna esatto (copiato dagli header) o null. Nessun altro testo.`

  try {
    const anthropic = new Anthropic({ apiKey })
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'parse_failed' }, { status: 502 })
    const parsed = JSON.parse(match[0]) as Record<string, unknown>

    // Valida: solo chiavi note + valori che sono header reali.
    const mapping: Record<string, string> = {}
    for (const key of TARGET_KEYS) {
      const v = parsed[key]
      mapping[key] = typeof v === 'string' && headers.includes(v) ? v : ''
    }
    return NextResponse.json({ mapping })
  } catch (err) {
    console.error('map-columns error:', err)
    return NextResponse.json({ error: 'llm_failed' }, { status: 502 })
  }
}
