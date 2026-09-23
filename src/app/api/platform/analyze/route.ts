import { NextRequest, NextResponse } from 'next/server'
import { generateJson } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 60

// Flow "Migliora annuncio": riceve lo snapshot letto dall'estensione (o incollato a
// mano) e restituisce diagnosi + annuncio riscritto. Le foto vanno a Claude come URL
// dei CDN dei portali, cosi' valuta anche la qualita' del servizio fotografico.
// Modello: Qwen self-hosted su RunPod via lib/ai (Claude solo come ripiego finche' l'endpoint non c'e').
// ponytail: niente addebito crediti per ora, da agganciare prima dello switch.
const PHOTO_RE = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
const MAX_PHOTOS = 3
// Per l'AI bastano foto medie: meno pixel = meno token = meno secondi GPU.
// immobiliare: stesso id in piu' tagli, m-c e' circa 400-500px.
const forAi = (url: string) => url.replace(/(pwm\.im-cdn\.it\/image\/\d+)\/[^/]+$/, '$1/m-c.jpg')

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
        properties: {
          area: { type: 'string', enum: ['titolo', 'descrizione', 'foto', 'dati', 'prezzo'] },
          gravita: { type: 'string', enum: ['alta', 'media', 'bassa'] },
          problema: str,
          perche: str,
          soluzione: str,
          foto_indice: { type: 'integer' },
          modifica_foto: str,
        },
        required: ['area', 'gravita', 'problema', 'perche', 'soluzione', 'foto_indice', 'modifica_foto'],
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
- problemi: massimo 8, ordinati per gravità. SOLO azioni che l'agente può fare da solo, subito: modificare titolo o testo, compilare un campo della scheda sul portale, riordinare/sostituire/eliminare foto, rifare una foto, modificare una foto con l'AI. VIETATO: consigli generici ("migliora la presentazione"), cose che l'agente non controlla (zona, palazzo, mercato, prezzi di zona), ripetere lo stesso punto due volte. Per ognuno:
  - problema: cosa non va, citando l'esempio preciso preso dal testo o dalle foto.
  - perche: perché fa perdere contatti o fiducia, in una frase.
  - soluzione: l'azione concreta, in forma di istruzione ("Sposta la foto 3 al primo posto", "Compila il campo Spese condominiali"). Se riguarda il testo, includi la frase corretta tra virgolette.
  - foto_indice: se il problema riguarda UNA delle foto che vedi, il suo numero (1 = prima immagine allegata, 2 = seconda, 3 = terza); altrimenti 0.
  - modifica_foto: se quella foto si può sistemare con un editor AI (più luce, raddrizzare, togliere oggetti o disordine, togliere scritte o watermark, arredare una stanza vuota, cielo più limpido), scrivi l'istruzione per l'editor, in italiano, breve e precisa (es. "Aumenta la luminosità e bilancia il bianco, mantieni invariati mobili e pareti"). Se serve rifare la foto o manca una stanza, lascia "".
- dati_mancanti: campi che l'acquirente cerca e non ci sono (es. spese condominiali, riscaldamento, esposizione, anno costruzione). Solo il nome del dato, breve.
- foto_consigli: 2-4 consigli sulle foto viste (luce, ordine, inquadrature, stanze mancanti, prima foto). Se non ci sono foto, dillo.
- titolo: nuovo titolo, max 70 caratteri, concreto, niente maiuscolo urlato ne' emoji.
- descrizione: nuova descrizione 120-220 parole, italiano naturale, paragrafi brevi. Scrivi in prosa. Usa un elenco puntato (righe che iniziano con "- ") solo se ha davvero senso: molte voci omogenee, di solito 5 o più dotazioni o ambienti, che in una frase diventerebbero un elenco di virgole illeggibile. Al massimo un elenco per descrizione; se le voci sono poche, mettile in una frase. Usa SOLO informazioni presenti nell'annuncio: non inventare. Non aggiungere promesse o servizi dell'agenzia non presenti (orari di visita, disponibilità serali, consulenze, mutui). Chiudi al massimo con un invito generico a contattare l'agenzia. Niente em dash, usa virgole.

VOCE DI TITOLO E DESCRIZIONE: scrivi come un agente immobiliare italiano esperto che pubblica l'annuncio della propria agenzia sul portale.
- Prima persona plurale dell'agenzia ("proponiamo", "vi presentiamo", "l'immobile si compone di").
- Lessico del settore usato con naturalezza: "ottimo stato", "doppia esposizione", "libero al rogito", "spese condominiali contenute", "zona ben servita", "classe energetica".
- Struttura tipica di un buon annuncio d'agenzia: apertura con tipologia, zona e punto di forza; composizione; finiture e dotazioni; contesto e servizi; condizioni (disponibilità, box/cantina); chiusura con invito a contattare l'agenzia per informazioni o visita.
- Titolo come lo scrive un agente sul portale: tipologia + punto di forza + zona, senza aggettivi vuoti ("splendido", "imperdibile", "occasione unica").
- Tono professionale, concreto, credibile: niente toni da pubblicità, niente superlativi.`

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

  const r = await generateJson<Record<string, unknown>>({
    system: SYSTEM,
    text: `Annuncio attuale (JSON):\n${text}`,
    images: photos.slice(0, MAX_PHOTOS).map(forAi),
    schema: SCHEMA,
    usage: { userId: data.user.id, kind: 'analyze' },
  })
  if (!r.ok) {
    console.error('analyze error:', r.error, r.detail)
    return NextResponse.json({ error: r.error === 'refused' ? 'refused' : 'ai_failed' }, { status: r.error === 'refused' ? 422 : 502 })
  }
  return NextResponse.json(r.data)
}
