// Casa 3D: tipi condivisi tra riconoscimento (server), schermata di correzione e visore (browser).
export type Pt = [number, number]
export type OpType = 'door' | 'entrance' | 'varco' | 'window'

// Pianta riconosciuta, modificabile: muri come segmenti con spessore, aperture sui muri, stanze. Metri, origine al
// centro della casa, x a destra e y in basso come nell'immagine raddrizzata.
export type RawWall = { a: Pt; b: Pt; t: number; label?: string }
export type RawOpening = { type: OpType; a: Pt; b: Pt; t: number; width: number; rooms: number[]; suspect: boolean; label?: string; added?: boolean }
// label: scritta letta dalla planimetria originale (il tipo viene da li'); written_mq: mq scritti per la stanza
export type RawRoom = { id: number; area: number; center: Pt; poly: Pt[]; type: string; label?: string; written_mq?: number; floor?: FloorKind; wall?: string } // floor/wall: scelti dall'agente
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
  outside_labels?: { text: string; type: string; x: number; y: number; mq?: number }[] }

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
  rooms: { id: number; type: string; area: number; center: Pt; poly: Pt[]; rect: [number, number, number, number]; floor?: FloorKind; wall?: string }[]
  materials?: { frames: string; doors: string; facade: { kind: string; color: string }; roof: string; shutters: string }
  // metri -> pixel della planimetria originale (per la miniatura che gira con la vista)
  image?: { toImage: number[]; w: number; h: number }
  name?: string
}

// Un piano della casa salvato su R2 (raw = modificabile, plan = per il visore)
export type Casa3dFloor = { name: string; raw: string; plan: string; image: string; cad?: string }
// Casa 3D dell'immobile, in import_data.details.casa3d (niente colonne nuove)
export type Casa3d = { status: 'ready' | 'working'; floors: Casa3dFloor[]; manifest: string; poster?: string; created: string; updated?: string; key: string }
// indirizzo del visore (pagina statica in public/casa3d, versione nel nome per la cache)
export const VIEWER_PATH = '/casa3d/v1/index.html'

// stanze all'aperto: niente soffitto, pavimento da esterno, parapetti al posto dei muri esterni
export const OUTDOOR = new Set(['balcone', 'terrazzo'])
export const ROOM_TYPES = ['soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'ingresso', 'corridoio', 'studio', 'ripostiglio', 'balcone', 'terrazzo', 'scala'] as const
export const ROOM_LABEL_IT: Record<string, string> = {
  soggiorno: 'Soggiorno', cucina: 'Cucina', camera: 'Camera', cameretta: 'Cameretta', bagno: 'Bagno', ingresso: 'Ingresso', corridoio: 'Corridoio',
  studio: 'Studio', ripostiglio: 'Ripostiglio', balcone: 'Balcone', terrazzo: 'Terrazzo', scala: 'Scala', lavanderia: 'Lavanderia', stanza: 'Stanza', esterno: 'Fuori casa',
}
export const ROOM_LABEL_EN: Record<string, string> = {
  soggiorno: 'Living room', cucina: 'Kitchen', camera: 'Bedroom', cameretta: 'Kids room', bagno: 'Bathroom', ingresso: 'Entrance', corridoio: 'Hallway',
  studio: 'Study', ripostiglio: 'Storage', balcone: 'Balcony', terrazzo: 'Terrace', scala: 'Stairs', lavanderia: 'Laundry', stanza: 'Room', esterno: 'Not part of the home',
}

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
