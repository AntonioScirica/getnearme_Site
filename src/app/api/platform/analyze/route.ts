import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const anthropic = new Anthropic()

export const maxDuration = 60

// Flow "Migliora annuncio": riceve lo snapshot letto dall'estensione (o incollato a
// mano) e restituisce diagnosi + annuncio riscritto. Le foto vanno a Claude come URL
// dei CDN dei portali, cosi' valuta anche la qualita' del servizio fotografico.
// ponytail: niente addebito crediti per ora, da agganciare prima dello switch.
const PHOTO_RE = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
const MAX_PHOTOS = 6

const str = { type: 'string' }
const strList = { type: 'array', items: str }
const SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    sintesi: str,
    punti_forza: strList,
    problemi: {
      type: 'array',
      items: {
        type: 'object',
        properties: { area: { type: 'string', enum: ['titolo', 'descrizione', 'foto', 'dati', 'prezzo'] }, gravita: { type: 'string', enum: ['alta', 'media', 'bassa'] }, testo: str },
        required: ['area', 'gravita', 'testo'],
        additionalProperties: false,
      },
    },
    dati_mancanti: strList,
    foto_consigli: strList,
    titolo: str,
    descrizione: str,
  },
  required: ['score', 'sintesi', 'punti_forza', 'problemi', 'dati_mancanti', 'foto_consigli', 'titolo', 'descrizione'],
  additionalProperties: false,
}

const SYSTEM = `Sei un consulente esperto di annunci immobiliari italiani (immobiliare.it, idealista, casa.it). Ricevi un annuncio già pubblicato e lo valuti come farebbe un acquirente esigente e l'algoritmo del portale.
- score: 0-100, qualità complessiva dell'annuncio attuale (completezza dati, titolo, descrizione, foto, coerenza prezzo/dati).
- sintesi: 1-2 frasi sul giudizio complessivo.
- punti_forza: 2-4 cose fatte bene.
- problemi: i difetti concreti, ordinati per gravità. Cita esempi precisi dal testo o dalle foto.
- dati_mancanti: campi che l'acquirente cerca e non ci sono (es. spese condominiali, riscaldamento, esposizione, anno costruzione).
- foto_consigli: 2-4 consigli sulle foto viste (luce, ordine, inquadrature, stanze mancanti, prima foto). Se non ci sono foto, dillo.
- titolo: nuovo titolo, max 70 caratteri, concreto, niente maiuscolo urlato ne' emoji.
- descrizione: nuova descrizione 120-220 parole, italiano naturale, paragrafi brevi. Usa SOLO informazioni presenti nell'annuncio: non inventare. Niente em dash, usa virgole.`

type Listing = { url?: string; title?: string; address?: string; propertyInfo?: Record<string, unknown>; photos?: string[] }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let listing: Listing
  try { ({ listing } = await req.json()) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (!listing || typeof listing !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const photos = (Array.isArray(listing.photos) ? listing.photos : []).filter(u => typeof u === 'string' && PHOTO_RE.test(u))
  const text = JSON.stringify({
    url: listing.url, titolo: listing.title, indirizzo: listing.address,
    dati: listing.propertyInfo, numero_foto_totali: photos.length,
  })
  if (text.length > 20000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  const ask = (withPhotos: boolean) => anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 8000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        ...(withPhotos ? photos.slice(0, MAX_PHOTOS).map(url => ({ type: 'image' as const, source: { type: 'url' as const, url } })) : []),
        { type: 'text' as const, text: `Annuncio attuale (JSON):\n${text}${withPhotos ? '' : '\n(Foto non disponibili per l\'analisi.)'}` },
      ],
    }],
  })

  try {
    let res
    try {
      res = await ask(photos.length > 0)
    } catch (e) {
      // Il CDN del portale puo' rifiutare il download delle immagini: riprova solo testo.
      if (!(e instanceof Anthropic.BadRequestError) || !photos.length) throw e
      res = await ask(false)
    }
    if (res.stop_reason === 'refusal') return NextResponse.json({ error: 'refused' }, { status: 422 })
    const block = res.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') return NextResponse.json({ error: 'empty' }, { status: 502 })
    return NextResponse.json(JSON.parse(block.text))
  } catch (e) {
    console.error('analyze error:', e)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}
