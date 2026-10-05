// Casa 3D: tipi condivisi tra riconoscimento (server), schermata di correzione e visore (browser).
export type Pt = [number, number]
export type OpType = 'door' | 'entrance' | 'varco' | 'window'

// Pianta riconosciuta, modificabile: muri come segmenti con spessore, aperture sui muri, stanze. Metri, origine al
// centro della casa, x a destra e y in basso come nell'immagine raddrizzata.
export type RawWall = { a: Pt; b: Pt; t: number; label?: string }
export type RawOpening = { type: OpType; a: Pt; b: Pt; t: number; width: number; rooms: number[]; suspect: boolean; label?: string; added?: boolean }
export type RawRoom = { id: number; area: number; center: Pt; poly: Pt[]; type: string }
export type RawSource = {
  angle: number; m_per_px: number; scala_porte: number; scala_tramezzi: number; tramezzo_px: number; classi_spessore_m: number[]
  scale_from: 'porte' | 'tramezzi' | 'mq' | 'manuale'; scale_note?: string
  // metri -> pixel dell'immagine di partenza (stessa misura della planimetria originale ritagliata): [a, b, c, d, e, f]
  // con x_img = a*x + c*y + e, y_img = b*x + d*y + f (come la matrice SVG)
  toImage: [number, number, number, number, number, number]
  imgW: number; imgH: number
}
export type RawPlan = { version: 3; units: 'm'; height: number; source: RawSource; walls: RawWall[]; openings: RawOpening[]; rooms: RawRoom[] }

// Correzioni (dal controllo di Claude): stesso schema del prototipo in Python
export type Fix = {
  room_types?: Record<string, string>
  remove_openings?: string[]
  change_openings?: { label: string; type: OpType }[]
  add_doors?: { between: [number, number]; entrance?: boolean }[]
  add_windows?: { wall: string; room: number }[]
  notes?: string
}

// Pianta per il visore (schema letto da public/casa3d/viewer/house.js)
export type ViewerPlan = {
  version: 3; units: 'm'; height: number
  outline: Pt[]
  walls: { outer: Pt[]; holes: Pt[][] }[]
  windows: { rect: [number, number, number, number]; axis: 'x' | 'z'; room: number; in: [number, number] }[]
  doors: { axis: 'x' | 'z'; rooms: [number, number]; rect: [number, number, number, number]; swing: number; entrance?: boolean; varco?: boolean }[]
  rooms: { id: number; type: string; area: number; center: Pt; poly: Pt[]; rect: [number, number, number, number] }[]
  name?: string
}

// Un piano della casa salvato su R2 (raw = modificabile, plan = per il visore)
export type Casa3dFloor = { name: string; raw: string; plan: string; image: string; cad?: string }
// Casa 3D dell'immobile, in import_data.details.casa3d (niente colonne nuove)
export type Casa3d = { status: 'ready' | 'working'; floors: Casa3dFloor[]; poster?: string; created: string; updated?: string; key: string }

export const ROOM_TYPES = ['soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'ingresso', 'corridoio', 'studio', 'ripostiglio', 'balcone', 'terrazzo', 'scala'] as const
export const ROOM_LABEL_IT: Record<string, string> = {
  soggiorno: 'Soggiorno', cucina: 'Cucina', camera: 'Camera', cameretta: 'Cameretta', bagno: 'Bagno', ingresso: 'Ingresso', corridoio: 'Corridoio',
  studio: 'Studio', ripostiglio: 'Ripostiglio', balcone: 'Balcone', terrazzo: 'Terrazzo', scala: 'Scala', lavanderia: 'Lavanderia', stanza: 'Stanza', esterno: 'Fuori casa',
}
export const ROOM_LABEL_EN: Record<string, string> = {
  soggiorno: 'Living room', cucina: 'Kitchen', camera: 'Bedroom', cameretta: 'Kids room', bagno: 'Bathroom', ingresso: 'Entrance', corridoio: 'Hallway',
  studio: 'Study', ripostiglio: 'Storage', balcone: 'Balcony', terrazzo: 'Terrace', scala: 'Stairs', lavanderia: 'Laundry', stanza: 'Room', esterno: 'Not part of the home',
}
