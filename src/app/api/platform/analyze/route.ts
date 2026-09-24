import { NextRequest, NextResponse } from 'next/server'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { generateJson } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'
import { CRITERI_PROMPT, CRITERI_SCHEMA, withScores } from '@/lib/listingScore'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 300

// Flow "Migliora annuncio": riceve lo snapshot letto dall'estensione (o incollato a
// mano) e restituisce diagnosi + annuncio riscritto. Le foto vanno a Claude come URL
// dei CDN dei portali, cosi' valuta anche la qualita' del servizio fotografico.
// Modello: Qwen self-hosted su RunPod via lib/ai (Claude solo come ripiego finche' l'endpoint non c'e').
// ponytail: niente addebito crediti per ora, da agganciare prima dello switch.
const MAX_PHOTOS = 3
// Per l'AI bastano foto medie: meno pixel = meno token = meno secondi GPU.
// immobiliare: stesso id in piu' tagli, m-c e' circa 400-500px.
const forAi = (url: string) => url.replace(/(pwm\.im-cdn\.it\/image\/\d+)\/[^/]+$/, '$1/m-c.jpg')

const str = { type: 'string' }
const strList = { type: 'array', items: str }
const SCHEMA = {
  type: 'object',
  properties: {
    criteri: CRITERI_SCHEMA,
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
          foto_stanza: str,
          modifica_foto: str,
        },
        required: ['area', 'gravita', 'problema', 'perche', 'soluzione', 'foto_indice', 'foto_stanza', 'modifica_foto'],
        additionalProperties: false,
      },
    },
    dati_mancanti: strList,
    foto_consigli: strList,
    titolo: str,
    descrizione: str,
  },
  required: ['criteri', 'sintesi', 'punti_forza', 'problemi', 'dati_mancanti', 'foto_consigli', 'titolo', 'descrizione'],
  additionalProperties: false,
}

const SYSTEM = `Sei un consulente esperto di annunci immobiliari italiani (immobiliare.it, idealista, casa.it). Ricevi un annuncio già pubblicato e lo valuti come farebbe un acquirente esigente e l'algoritmo del portale.
- criteri: per ognuno dei criteri qui sotto dai i punti dell'annuncio attuale (punti), i punti che avrebbe dopo aver applicato TUTTE le soluzioni dei problemi e la descrizione e il titolo riscritti (punti_dopo, realistico: se una foto va rifatta e non si può sistemare con l'AI, conta che l'agente la rifaccia), una nota di una frase sul perché dei punti attuali, e limite: se punti_dopo resta sotto il massimo, in una frase cosa manca ancora per il massimo e che le correzioni non risolvono (es. "mancano foto di bagno e cucina, vanno scattate", "l'annuncio non indica l'anno di costruzione, va chiesto al proprietario"); se arriva al massimo, "". Lo score totale è la somma, non scriverlo.
${CRITERI_PROMPT}
- sintesi: 1-2 frasi sul giudizio complessivo.
- punti_forza: 2-4 cose fatte bene.
- problemi: massimo 4, i più importanti, ordinati per gravità. SOLO azioni che l'agente può fare da solo, subito: modificare titolo o testo, compilare un campo della scheda sul portale, riordinare/sostituire/eliminare foto, rifare una foto, modificare una foto con l'AI. VIETATO: consigli generici ("migliora la presentazione"), cose che l'agente non controlla (zona, palazzo, mercato, prezzi di zona), ripetere lo stesso punto due volte. Per ognuno:
  - problema: cosa non va, citando l'esempio preciso preso dal testo o dalle foto.
  - perche: perché fa perdere contatti o fiducia, in una frase.
  - soluzione: l'azione concreta, in forma di istruzione ("Metti la foto del soggiorno al primo posto", "Compila il campo Spese condominiali"). Se riguarda il testo, includi la frase corretta tra virgolette.
  - foto_indice: se il problema riguarda UNA delle foto che vedi, il suo numero (1 = prima immagine allegata, 2 = seconda, 3 = terza); altrimenti 0.
  - foto_stanza: se foto_indice > 0, l'ambiente che quella foto mostra, riconosciuto guardandola, in minuscolo con articolo ("la cucina", "il soggiorno", "la camera da letto", "il bagno", "l'androne", "il balcone", "la facciata"); altrimenti "".
  - Nei testi (problema, perche, soluzione, foto_consigli, criteri) chiama SEMPRE le foto per ambiente ("la foto della cucina"), MAI per numero o posizione ("foto 3", "terza foto"); l'unica eccezione è "la prima foto" della galleria quando il problema è proprio quale foto viene mostrata per prima.
  - modifica_foto: istruzione per un editor di immagini generativo (Qwen-Image), che ridisegna il contenuto della foto ma non fa correzioni tecniche. Scrivila SOLO se il problema si risolve con una di queste modifiche di contenuto:
    - togliere oggetti precisi: disordine su piani e mobili, panni stesi, cavi, bidoni, auto, persone, oggetti personali;
    - arredare una stanza vuota o spoglia con mobili adatti all'ambiente (home staging);
    - sostituire un cielo grigio o bianco con un cielo azzurro limpido;
    - rendere l'ambiente più luminoso, come in una giornata di sole con luce naturale dalle finestre;
    - riordinare: letto rifatto, cuscini sistemati, tavolo sgombro;
    - cambiare un materiale o un colore: pareti imbiancate, pavimento diverso.
    Scrivila in italiano, un'azione concreta sugli elementi visibili (nomina cosa e dove), più "lascia invariati" per ciò che deve restare uguale (es. "Togli le pentole e i barattoli dal piano di lavoro, lascia invariati mobili, pareti e pavimento"). VIETATO chiedere correzioni tecniche o geometriche: raddrizzare, prospettiva, linee verticali, ritagliare, bilanciamento del bianco, esposizione, nitidezza, rumore, risoluzione, grandangolo. Se la foto è storta, sfocata, piccola, inquadrata male o manca una stanza, va rifatta: lascia "" e dillo nella soluzione.
- dati_mancanti: campi che l'acquirente cerca e non ci sono (es. spese condominiali, riscaldamento, esposizione, anno costruzione). Solo il nome del dato, breve.
- foto_consigli: 2-4 consigli sulle foto viste (luce, ordine, inquadrature, stanze mancanti, prima foto). Se non ci sono foto, dillo.
- titolo: nuovo titolo, max 70 caratteri, concreto, niente emoji.
- MAI segnalare, in nessun campo (problemi, foto_consigli, criteri, sintesi): watermark o loghi sulle foto, testo o parole in maiuscolo. Non sono problemi per questa analisi.
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

  const photos = (Array.isArray(listing.photos) ? listing.photos : []).filter(isPublicHttpsUrl) // foto di qualsiasi sito di annunci, solo https pubblico

  // I dati li legge l'estensione (propertyInfo); l'AI serve solo per score, cosa sistemare e riscrittura.
  const text = JSON.stringify({ url: listing.url, titolo: listing.title, indirizzo: listing.address, dati: listing.propertyInfo, numero_foto_totali: photos.length })
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
  return NextResponse.json(withScores(r.data))
}
