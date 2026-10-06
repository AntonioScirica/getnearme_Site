// Casa 3D: tipi condivisi tra riconoscimento (server), schermata di correzione e visore (browser).
export type Pt = [number, number]
export type OpType = 'door' | 'entrance' | 'varco' | 'window'

// Pianta riconosciuta, modificabile: muri come segmenti con spessore, aperture sui muri, stanze. Metri, origine al
// centro della casa, x a destra e y in basso come nell'immagine raddrizzata.
export type RawWall = { a: Pt; b: Pt; t: number; label?: string }
export type RawOpening = { type: OpType; a: Pt; b: Pt; t: number; width: number; rooms: number[]; suspect: boolean; label?: string; added?: boolean }
// label: scritta letta dalla planimetria originale (il tipo viene da li'); written_mq: mq scritti per la stanza
export type RawRoom = { id: number; area: number; center: Pt; poly: Pt[]; type: string; label?: string; written_mq?: number; floor?: FloorKind; wall?: string; stair?: StairHint } // floor/wall: scelti dall'agente
// scala: verso dei gradini letto dall'originale (axis = asse lungo cui si sale, tread = pedata misurata in metri) e
// scala esterna (nel resede o fuori dalla casa: rampa all'aperto, niente muri ne' soffitto). {} = guardata, niente trovato
export type StairHint = { axis?: 'x' | 'z'; tread?: number; outdoor?: boolean
  // rampa e pianerottolo disegnati (rettangoli [x0, z0, x1, z1] in metri sulla pianta), gradini contati, verso di salita lungo axis
  flight?: [number, number, number, number]; treads?: number; landing?: [number, number, number, number]; up?: 1 | -1; seen?: boolean
  // dalla lettura dell'originale: verso scritto (freccia, "su"/"giu'"), stanze collegate e piano di arrivo non disegnato
  goes?: 'su' | 'giu'; from?: string; to?: string; to_missing?: boolean; arrow?: 1 | -1
  // riquadro della scala letto da Gemini (metri sulla pianta) e scala come disegnata, pezzo per pezzo dall'ingresso
  // (il capo al piano della pianta) verso l'altro capo: rampe dritte, gradini a ventaglio, pianerottoli. guess = gradini
  // non trovati nel disegno, messi nel riquadro letto
  box?: [number, number, number, number]; path?: StairPiece[]; guess?: boolean }
// pezzo di scala disegnata (metri). run: rampa dritta nel rettangolo box, si avanza lungo axis nel verso dir, n gradini.
// fan: gradini a ventaglio o della svolta, uno spicchio (poligono) per gradino, nell'ordine di salita dall'ingresso.
// land: pianerottolo piano
export type StairPiece =
  | { k: 'run'; box: [number, number, number, number]; axis: 'x' | 'z'; dir: 1 | -1; n: number }
  | { k: 'fan'; n: number; box: [number, number, number, number]; wedges: Pt[][] }
  | { k: 'land'; box: [number, number, number, number] }
// Materiali e colori veri dalle foto dell'immobile (una chiamata di visione per casa), per tipo di stanza
export const FLOOR_KINDS = ['parquet_chiaro', 'parquet_medio', 'parquet_scuro', 'gres_chiaro', 'gres_scuro', 'marmo', 'cotto', 'graniglia'] as const
export type FloorKind = (typeof FLOOR_KINDS)[number]
export type Materials = {
  rooms: Record<string, { floor: FloorKind; wall: string }>
  frames: string; doors: string
  facade: { kind: 'intonaco' | 'pietra' | 'mattone'; color: string }
  roof: 'coppi' | 'tegole' | 'piano' | 'non_visibile'; shutters: string
  from: number // foto guardate
}
export type RawSource = {
  angle: number; m_per_px: number; scala_porte: number; scala_tramezzi: number; tramezzo_px: number; classi_spessore_m: number[]
  scale_from: 'porte' | 'tramezzi' | 'mq' | 'manuale' | 'scritte'; scale_note?: string; scale_warn?: boolean
  // combacio con l'originale dopo l'allineamento: errore medio (cm) delle facce dei muri, muri senza riscontro
  fit?: { error_cm: number; before_cm: number; unsupported: number; walls: number; diverge: boolean }
  // terrazzi trovati piu' piccoli dei mq scritti: avviso e 'Disegna terrazzo' nella correzione
  outdoor_short?: { room: number; found: number; written: number }[]
  // metri -> pixel dell'immagine di partenza (stessa misura della planimetria originale ritagliata): [a, b, c, d, e, f]
  // con x_img = a*x + c*y + e, y_img = b*x + d*y + f (come la matrice SVG)
  toImage: [number, number, number, number, number, number]
  imgW: number; imgH: number
}
export type RawPlan = { version: 3; units: 'm'; height: number; source: RawSource; walls: RawWall[]; openings: RawOpening[]; rooms: RawRoom[]; furniture?: DrawnItem[]; materials?: Materials
  // scritte terrazzo/balcone lette fuori dalle stanze riconosciute (posizione 0-1 sull'originale): per ritrovare le zone esterne
  outside_labels?: { text: string; type: string; x: number; y: number; mq?: number }[]
  // lettura semantica dell'originale (src/lib/casa3d/read.ts), dubbi da confermare con un si'/no e controlli senza AI
  read?: PlanReadInfo; doubts?: Doubt[]; checks?: PlanChecks }

// Lettura semantica della planimetria ORIGINALE (Gemini Flash, una chiamata): stanze con nome scritto, collegamenti tra
// stanze, finestre, scale con verso, esterni, dubbi. Coordinate 0-1000 sull'immagine ritagliata (x da sinistra, y dall'alto).
// La geometria esatta resta quella della pipeline: la lettura da' nomi, tipi, unioni, porte e scale.
export type ReadRoom = { id: string; name: string; type: string; poly: Pt[]; mq: number | null; h: number | null; conf: number }
export type ReadLink = { x: number; y: number; w: number | null; between: [string, string]; kind: 'ingresso' | 'porta' | 'varco' | 'portafinestra'; conf: number }
export type ReadStair = { poly: Pt[]; inside: boolean; arrow: number | null; goes: 'su' | 'giu' | null; from: string | null; to: string | null; missing_floor: boolean; conf: number }
export type ReadOutdoor = { label: string; type: string; poly: Pt[]; shared: boolean | null; ours: boolean | null }
export type PlanRead = {
  kind: string; floor: string | null; rooms: ReadRoom[]; links: ReadLink[]; windows: { x: number; y: number; room: string; conf: number }[]
  stairs: ReadStair[]; outdoor: ReadOutdoor[]; doubts: { q: string; x: number; y: number }[]
}
// cosa ha fatto la lettura sulla pianta (numeri per i controlli e per la schermata di correzione)
export type PlanReadInfo = { model: string; ms: number; usd: number; rooms: number; matched: number; merged: number; typed: number; reopened: number; retyped: number; windows: number; stairs: number; outdoor: number }
// dubbio da far confermare all'agente con un si'/no (x, y: posizione 0-1 sull'originale; answer quando ha risposto)
export type Doubt = { q: string; x: number; y: number; from: 'lettura' | 'controlli'; kind?: string; answer?: boolean }
// controlli automatici senza AI: punteggio 0-100 e voci (scala dai minimi del DM 5/7/1975, mq, porte, scale)
export type PlanChecks = { score: number; items: { id: string; ok: boolean; msg: string; weight: number }[]; scale_hint?: number }

// Correzioni (dal controllo di Claude): stesso schema del prototipo in Python
export type Fix = {
  room_types?: Record<string, string>
  remove_openings?: string[]
  change_openings?: { label: string; type: OpType }[]
  add_doors?: { between: [number, number]; entrance?: boolean }[]
  add_windows?: { wall: string; room: number }[]
  notes?: string
  // scritte della planimetria originale: posizione 0-1 sull'immagine originale, tipo, mq e altezza scritti (0 = no)
  labels?: { text: string; type: string; x: number; y: number; mq: number; h: number }[]
  // mobili disegnati sull'originale: centro 0-1, lato lungo e profondita' in frazioni della larghezza dell'immagine,
  // back = direzione (gradi, 0 = destra, 90 = giu') dal centro verso la schiena (testiera, schienale, lato contro il muro)
  furniture?: { kind: string; x: number; y: number; len: number; depth: number; back: number; confidence?: number }[]
  furniture_drawn?: boolean // la planimetria ha mobili disegnati? se no i mobili letti si ignorano
}
// mobile disegnato, in metri sulla pianta (rot come nel visore: la schiena del modello e' -z)
export type DrawnItem = { kind: string; at: Pt; rot: number; len: number; depth: number; conf?: number; added?: boolean } // added: messo dall'agente

// Pianta per il visore (schema letto da public/casa3d/viewer/house.js)
export type ViewerPlan = {
  version: 3; units: 'm'; height: number
  outline: Pt[]
  walls: { outer: Pt[]; holes: Pt[][] }[]
  // muretti alti ~1 m dei terrazzi e balconi (muri che non chiudono nessuna stanza interna)
  parapets?: { outer: Pt[]; holes: Pt[][] }[]
  // arredo come nella planimetria (modelli del catalogo del visore); le stanze senza mobili disegnati si arredano da sole
  furniture?: { kind: string; x: number; z: number; rot: number; w: number; d: number; room: number; opts: Record<string, number> }[]
  windows: { rect: [number, number, number, number]; axis: 'x' | 'z'; room: number; in: [number, number] }[]
  doors: { axis: 'x' | 'z'; rooms: [number, number]; rect: [number, number, number, number]; swing: number; entrance?: boolean; varco?: boolean }[]
  rooms: { id: number; type: string; area: number; center: Pt; poly: Pt[]; rect: [number, number, number, number]; floor?: FloorKind; wall?: string; stair?: StairHint; label?: string }[]
  // confini dei giardini e dei cortili (linee del lotto): siepe o muretto basso nel visore, non muri
  boundaries?: { a: Pt; b: Pt; kind: 'siepe' | 'muretto' }[]
  fills?: { room: number; poly: Pt[] }[] // strisce dei muri tolti tra esterni: pavimento dell'esterno accanto
  lawn?: boolean // tra le foto dell'immobile c'e' un giardino: esterni a prato
  materials?: { frames: string; doors: string; facade: { kind: string; color: string }; roof: string; shutters: string }
  // metri -> pixel della planimetria originale (per la miniatura che gira con la vista)
  image?: { toImage: number[]; w: number; h: number }
  name?: string
  garden?: boolean // ha esterni (resede, giardino, terrazzo): base del plastico verde nel visore
}

// Un piano della casa salvato su R2 (raw = modificabile, plan = per il visore)
export type Casa3dFloor = { name: string; raw: string; plan: string; image: string; cad?: string }
// Casa 3D dell'immobile, in import_data.details.casa3d (niente colonne nuove)
export type Casa3d = { status: 'ready' | 'working'; floors: Casa3dFloor[]; manifest: string; poster?: string; created: string; updated?: string; key: string; style?: Casa3dStyle }
// stili d'arredo del visore (public/casa3d/v1/viewer/styles.js): cambio dal vivo, lo scelto si salva nel manifest
export const CASA3D_STYLES = ['moderno', 'nordico', 'classico', 'industriale', 'lusso', 'boho', 'vuota'] as const
export type Casa3dStyle = (typeof CASA3D_STYLES)[number]
export const STYLE_LABEL: Record<Casa3dStyle, [string, string]> = {
  moderno: ['Moderno', 'Modern'], nordico: ['Nordico', 'Nordic'], classico: ['Classico', 'Classic'], industriale: ['Industriale', 'Industrial'],
  lusso: ['Luxury', 'Luxury'], boho: ['Boho', 'Boho'], vuota: ['Vuota', 'Empty'],
}
export const isStyle = (x: unknown): x is Casa3dStyle => typeof x === 'string' && (CASA3D_STYLES as readonly string[]).includes(x)
// indirizzo del visore (pagina statica in public/casa3d, versione nel nome per la cache)
export const VIEWER_PATH = '/casa3d/v1/index.html'

// stanze all'aperto: niente soffitto, pavimento da esterno, parapetti al posto dei muri esterni
export const OUTDOOR = new Set(['balcone', 'terrazzo'])
// esterni a terra della casa (resede, corte, giardino): prato o pavimentazione, confini a siepe o muretto, niente soffitto
export const GROUND = new Set(['giardino', 'cortile'])
export const ROOM_TYPES = ['soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'ingresso', 'corridoio', 'studio', 'ripostiglio', 'balcone', 'terrazzo', 'scala', 'giardino', 'cortile'] as const
export const ROOM_LABEL_IT: Record<string, string> = {
  soggiorno: 'Soggiorno', cucina: 'Cucina', camera: 'Camera', cameretta: 'Cameretta', bagno: 'Bagno', ingresso: 'Ingresso', corridoio: 'Corridoio',
  studio: 'Studio', ripostiglio: 'Ripostiglio', balcone: 'Balcone', terrazzo: 'Terrazzo', scala: 'Scala', lavanderia: 'Lavanderia', stanza: 'Stanza', esterno: 'Fuori casa',
  giardino: 'Giardino', cortile: 'Cortile',
}
export const ROOM_LABEL_EN: Record<string, string> = {
  soggiorno: 'Living room', cucina: 'Kitchen', camera: 'Bedroom', cameretta: 'Kids room', bagno: 'Bathroom', ingresso: 'Entrance', corridoio: 'Hallway',
  studio: 'Study', ripostiglio: 'Storage', balcone: 'Balcony', terrazzo: 'Terrace', scala: 'Stairs', lavanderia: 'Laundry', stanza: 'Room', esterno: 'Not part of the home',
  giardino: 'Garden', cortile: 'Courtyard',
}
// scritte delle esterne: resede/corte/cortile/giardino/area esterna/pertinenza sono esterni della casa, mai stanze.
// "a comune", corte e cortile = cortile condiviso (pavimentato); esclusivo, giardino, area esterna = giardino privato
export const EXTERIOR_RE = /\b(resede|corte|cortile|giardino|area\s+esterna|pertinenz[ae]|chiostr[oi]|aia)\b/i
export const exteriorType = (text: string): 'giardino' | 'cortile' | null => !EXTERIOR_RE.test(text) ? null : /comun|condomin|\bcorte\b|cortile|chiostr|\baia\b/i.test(text) && !/esclusiv|privat|giardino/i.test(text) ? 'cortile' : 'giardino'
// parole delle catastali poco note: spiegazione breve al tocco nella schermata di correzione
export const GLOSSARY: [RegExp, string, string][] = [
  [/resede/i, 'Resede: area esterna della casa, cortile o giardino', 'Resede: the home outdoor area, courtyard or garden'],
  [/\bcorte\b/i, 'Corte: cortile, area esterna comune o della casa', 'Corte: courtyard, shared or private outdoor area'],
  [/pertinenz/i, 'Pertinenza: spazio al servizio della casa, di solito esterno', 'Pertinenza: space serving the home, usually outdoors'],
  [/disimp|\bdis\.?\b/i, 'Disimpegno: piccolo corridoio che collega le stanze', 'Disimpegno: small hallway linking the rooms'],
  [/\bw\.?\s?c\.?\b/i, 'W.C.: bagno', 'W.C.: bathroom'],
  [/loggia/i, 'Loggia: balcone coperto, chiuso su tre lati', 'Loggia: covered balcony, closed on three sides'],
  [/lastrico/i, 'Lastrico solare: terrazzo di copertura', 'Lastrico solare: roof terrace'],
  [/androne/i, 'Androne: ingresso comune del palazzo', 'Androne: shared building entrance'],
  [/sottotetto|soffitta/i, 'Sottotetto: spazio sotto il tetto, spesso basso', 'Sottotetto: space under the roof, often low'],
  [/tettoia|portico/i, 'Portico o tettoia: spazio coperto all\'aperto', 'Porch or canopy: covered outdoor space'],
  [/\bh\s?=?\s?\d/i, 'H: altezza del soffitto in metri', 'H: ceiling height in metres'],
  [/\bp\.?\s?t\.?\b|piano terra/i, 'P.T.: piano terra', 'P.T.: ground floor'],
  [/cantin/i, 'Cantina: locale di deposito, spesso interrato', 'Cantina: storage room, often below ground'],
]
export const glossaryOf = (text?: string, en = false) => { if (!text) return null; const g = GLOSSARY.find(([re]) => re.test(text)); return g ? (en ? g[2] : g[1]) : null }

// casa 3D di un immobile pubblico (details.casa3d), solo indirizzi https: per il sito e la pagina /3d
export function casa3dOf(p: { details?: Record<string, unknown> }): { manifest: string; poster?: string; floors: number } | null {
  const c = p.details?.casa3d as { manifest?: unknown; poster?: unknown; floors?: unknown[] } | undefined
  if (!c || typeof c.manifest !== 'string' || !/^https:\/\//.test(c.manifest)) return null
  return { manifest: c.manifest, poster: typeof c.poster === 'string' && /^https:\/\//.test(c.poster) ? c.poster : undefined, floors: Array.isArray(c.floors) ? c.floors.length : 1 }
}

export const FLOOR_LABEL: Record<FloorKind, [string, string]> = {
  parquet_chiaro: ['Parquet chiaro', 'Light wood'], parquet_medio: ['Parquet', 'Wood'], parquet_scuro: ['Parquet scuro', 'Dark wood'],
  gres_chiaro: ['Piastrelle chiare', 'Light tiles'], gres_scuro: ['Piastrelle scure', 'Dark tiles'], marmo: ['Marmo', 'Marble'], cotto: ['Cotto', 'Terracotta'], graniglia: ['Graniglia', 'Terrazzo tiles'],
}
// colori dei muri proposti nella correzione (oltre a quelli letti dalle foto)
export const WALL_COLORS = ['#f4f1ea', '#ffffff', '#ece4d6', '#e8dccb', '#d9d4cc', '#cfd8d3', '#d6dde6', '#ead7cf']
export const FACADE_COLORS = ['#efe6d6', '#e7cfa7', '#d9b48f', '#c98e6a', '#b9b3a8', '#f2efe8', '#c46a4a', '#a89f91']
