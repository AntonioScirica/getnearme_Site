import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateJson } from '@/lib/ai'
import { DETAIL_FIELDS } from '@/lib/propertyImport'

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
const BASE_KEYS = ['riferimento', 'nome', 'addr', 'prezzo', 'mq', 'locali', 'camere', 'bagni', 'descrizione', 'titolo', 'tipologia', 'photoUrl'] as const
// campi della scheda (classe energetica, piano...): chiave "d:<campo>"
const TARGET_KEYS = [...BASE_KEYS, ...DETAIL_FIELDS.map(f => `d:${f.key}`)]

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { headers?: unknown; sample?: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const headers = Array.isArray(body.headers) ? body.headers.filter((h): h is string => typeof h === 'string') : []
  if (!headers.length) return NextResponse.json({ error: 'no_headers' }, { status: 400 })

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
- photoUrl: url di una foto/immagine (la prima colonna foto)
Campi della scheda (usali solo se c'e' una colonna che li contiene davvero):
${DETAIL_FIELDS.map(f => `- d:${f.key}: ${f.label}${f.options?.length ? ` (valori tipo: ${f.options.slice(0, 6).join(', ')})` : ''}`).join('\n')}

Rispondi SOLO con un oggetto JSON valido, chiavi = i campi target, valori = nome colonna esatto (copiato dagli header) o stringa vuota. Nessun altro testo.`

  try {
    // stesso modello dei testi della piattaforma (Claude): lib/ai
    const r = await generateJson<Record<string, unknown>>({
      system: 'Sei un mappatore di colonne per import immobiliari. Rispondi solo con il JSON richiesto.',
      text: prompt,
      schema: { type: 'object', properties: Object.fromEntries(TARGET_KEYS.map(k => [k, { type: 'string' }])), additionalProperties: false },
      usage: { userId, kind: 'map_columns' },
      maxTokens: 1500,
    })
    if (!r.ok) return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
    const parsed = r.data

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
