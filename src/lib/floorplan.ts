// Planimetria di un immobile per il tour 3D (dollhouse e passeggiata).
// Oggi la pianta viene inventata dai dati dell'annuncio (mq, locali, camere, bagni): una pianta
// credibile, sempre uguale per lo stesso immobile. Quando avremo la planimetria vera letta dal
// disegno, avra' la stessa forma (stanze come rettangoli in metri) e il visore non cambia.

export type RoomType = 'soggiorno' | 'cucina' | 'camera' | 'bagno' | 'corridoio' | 'studio'
export type Room = { id: string; name: string; type: RoomType; x: number; y: number; w: number; d: number; photo?: string }
// Porta: apertura sul lato condiviso tra due stanze (o verso l'esterno per l'ingresso), in metri
export type Door = { x: number; y: number; w: number; horizontal: boolean }
export type Window = { x: number; y: number; w: number; horizontal: boolean }
export type Plan = { width: number; depth: number; height: number; rooms: Room[]; doors: Door[]; windows: Window[] }

const HALL = 1.2 // corridoio
const DOOR = 0.9

export function inventPlan(p: { mq?: number; locali?: number | null; camere?: number | null; bagni?: number | null; photos?: string[]; rooms?: string[] }): Plan {
  const mq = Math.max(35, Math.min(300, p.mq || 80))
  const camere = Math.max(1, Math.min(5, p.camere ?? 1))
  const bagni = Math.max(1, Math.min(3, p.bagni ?? 1))
  const studio = (p.locali ?? 0) - camere - 1 > 0 && mq > 90

  // Forma: rettangolo con lato lungo 1.5 volte il corto, due file di stanze e il corridoio in mezzo
  const width = Math.round(Math.sqrt(mq * 1.5) * 10) / 10
  const depth = Math.round((mq / width) * 10) / 10
  const rowD = (depth - HALL) / 2

  // Fila giorno (in alto): soggiorno e cucina. Fila notte (in basso): camere, bagni, studio.
  const top: { type: RoomType; name: string; weight: number }[] = [
    { type: 'soggiorno', name: 'Soggiorno', weight: 3 },
    { type: 'cucina', name: 'Cucina', weight: 1.4 },
  ]
  const bottom: { type: RoomType; name: string; weight: number }[] = []
  for (let i = 0; i < camere; i++) bottom.push({ type: 'camera', name: camere === 1 ? 'Camera' : i === 0 ? 'Camera matrimoniale' : `Camera ${i + 1}`, weight: i === 0 ? 2 : 1.5 })
  for (let i = 0; i < bagni; i++) bottom.push({ type: 'bagno', name: bagni === 1 ? 'Bagno' : `Bagno ${i + 1}`, weight: 0.8 })
  if (studio) bottom.push({ type: 'studio', name: 'Studio', weight: 1.2 })
  // bagno vicino alle camere: alterna cosi' non finiscono tutti in fondo
  bottom.sort((a, b) => (a.type === 'bagno' ? 1 : 0) - (b.type === 'bagno' ? 1 : 0))
  if (bottom.length > 2) { const bath = bottom.findIndex(r => r.type === 'bagno'); if (bath > 1) { const [b] = bottom.splice(bath, 1); bottom.splice(1, 0, b) } }

  const rooms: Room[] = []
  const doors: Door[] = []
  const windows: Window[] = []
  const lay = (row: typeof top, y: number, idPrefix: string) => {
    const tot = row.reduce((s, r) => s + r.weight, 0)
    let x = 0
    row.forEach((r, i) => {
      const w = Math.round((width * r.weight) / tot * 100) / 100
      rooms.push({ id: `${idPrefix}${i}`, name: r.name, type: r.type, x, y, w, d: rowD })
      // porta verso il corridoio, al centro del lato
      doors.push({ x: x + w / 2 - DOOR / 2, y: y === 0 ? rowD : y, w: DOOR, horizontal: true })
      // finestra sul muro esterno (in alto per la fila giorno, in basso per la notte), non nei bagni interni
      if (r.type !== 'bagno' || w > 2.2) windows.push({ x: x + w * 0.25, y: y === 0 ? 0 : depth, w: Math.min(1.6, w * 0.5), horizontal: true })
      x += w
    })
  }
  lay(top, 0, 'g')
  lay(bottom, rowD + HALL, 'n')
  rooms.push({ id: 'hall', name: 'Ingresso', type: 'corridoio', x: 0, y: rowD, w: width, d: HALL })
  // ingresso: porta esterna sul corridoio, lato sinistro
  doors.push({ x: 0, y: rowD + HALL / 2 - DOOR / 2, w: DOOR, horizontal: false })

  // Foto: prima quelle riconosciute per stanza, poi in ordine
  const photos = p.photos ?? []
  const used = new Set<number>()
  const typeOfLabel = (s: string): RoomType | null => /soggiorno|salotto|living/i.test(s) ? 'soggiorno' : /cucina/i.test(s) ? 'cucina' : /camera|letto/i.test(s) ? 'camera' : /bagno/i.test(s) ? 'bagno' : /studio/i.test(s) ? 'studio' : /ingresso|corridoio/i.test(s) ? 'corridoio' : null
  for (const r of rooms) {
    const k = photos.findIndex((_, i) => !used.has(i) && p.rooms?.[i] && typeOfLabel(p.rooms[i]) === r.type)
    if (k >= 0) { r.photo = photos[k]; used.add(k) }
  }
  for (const r of rooms) {
    if (r.photo || r.type === 'corridoio') continue
    const k = photos.findIndex((_, i) => !used.has(i))
    if (k >= 0) { r.photo = photos[k]; used.add(k) }
  }
  return { width, depth, height: 2.7, rooms, doors, windows }
}

// Colori del pavimento per tipo di stanza
export const FLOOR: Record<RoomType, string> = { soggiorno: '#d9c4a5', cucina: '#cfd3d6', camera: '#d9c4a5', bagno: '#c9d6db', corridoio: '#d2bf9f', studio: '#d9c4a5' }
