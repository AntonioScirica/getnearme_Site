// Materiali e colori veri della casa dalle foto dell'immobile: UNA chiamata di visione (Sonnet, ~0,015 $) con al
// massimo 8 foto ridotte (una per tipo di stanza, piu' 1-2 esterni). Per tipo di stanza: pavimento e colore dei muri;
// infissi, porte, facciata, tetto, persiane. Il visore usa le texture CC0 che ha (tinte), l'agente puo' cambiarli.
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import { FLOOR_KINDS, type Materials } from './types'

const HEX = '^#[0-9a-fA-F]{6}$'
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['rooms', 'frames', 'doors', 'facade', 'roof', 'shutters'],
  properties: {
    rooms: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'floor', 'wall'], properties: {
      type: { type: 'string', enum: ['soggiorno', 'cucina', 'camera', 'cameretta', 'studio', 'bagno', 'ingresso', 'corridoio', 'ripostiglio', 'balcone', 'terrazzo'] },
      floor: { type: 'string', enum: [...FLOOR_KINDS] }, wall: { type: 'string', pattern: HEX } } } },
    frames: { type: 'string', pattern: HEX }, doors: { type: 'string', pattern: HEX },
    facade: { type: 'object', additionalProperties: false, required: ['kind', 'color'], properties: { kind: { type: 'string', enum: ['intonaco', 'pietra', 'mattone'] }, color: { type: 'string', pattern: HEX } } },
    roof: { type: 'string', enum: ['coppi', 'tegole', 'piano', 'non_visibile'] }, shutters: { type: 'string' },
  },
}

// foto rappresentative: una per stanza riconosciuta (classificazione gia' fatta in import_data.rooms) e 2 esterni, niente planimetrie
export function pickPhotos(photos: string[], cls: Record<string, { scene?: string; room?: string }>, max = 8): string[] {
  const out: string[] = [], seen = new Set<string>()
  let ext = 0
  for (const p of photos) {
    const c = cls[p]
    if (c?.scene === 'planimetria' || /casa3d-dev|planimetri/i.test(p)) continue
    const k = c?.scene === 'esterno' || c?.scene === 'giardino' ? 'esterno' : c?.room || ''
    if (k === 'esterno') { if (ext >= 2) continue; ext++ } else if (k && seen.has(k)) continue
    if (k) seen.add(k)
    out.push(p)
    if (out.length >= max) break
  }
  return out
}

export async function readMaterials(userId: string, photos: string[]): Promise<Materials | null> {
  if (!photos.length) return null
  const imgs = (await Promise.all(photos.slice(0, 8).map(async u => {
    try { const b = Buffer.from(await (await fetch(u, { signal: AbortSignal.timeout(15000) })).arrayBuffer()); return (await sharp(b).rotate().resize(768, 768, { fit: 'inside' }).jpeg({ quality: 78 }).toBuffer()).toString('base64') } catch { return null }
  }))).filter((x): x is string => !!x)
  if (!imgs.length) return null
  const t0 = Date.now()
  try {
    const resp = await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 2000,
      messages: [{ role: 'user', content: [
        ...imgs.map(data => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } })),
        { type: 'text', text: `These are photos of one Italian home for sale (interiors and maybe exteriors). For each room type you can see, give the floor (parquet_chiaro = light wood, parquet_medio, parquet_scuro = dark wood, gres_chiaro = light ceramic/porcelain tiles, gres_scuro = dark tiles, marmo = marble, cotto = terracotta, graniglia = Venetian terrazzo/cement tiles) and the dominant wall colour as hex. Give one entry for every room type you see; if a room type is not shown, leave it out. Also: window frames colour (hex), interior doors colour (hex), facade (intonaco = plaster with its colour, pietra = stone, mattone = brick, with dominant colour hex; if no exterior photo, guess plaster #efe6d6), roof (coppi, tegole, piano, non_visibile) and shutters colour (hex or empty). Reply only with JSON.` },
      ] }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    })
    await logUsage({ userId, kind: 'casa3d_materiali' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, true, 'claude-sonnet-5').catch(() => {})
    const txt = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as Omit<Materials, 'rooms' | 'from'> & { rooms: { type: string; floor: Materials['rooms'][string]['floor']; wall: string }[] }
    const rooms: Materials['rooms'] = {}
    for (const r of j.rooms ?? []) if (!rooms[r.type]) rooms[r.type] = { floor: r.floor, wall: r.wall }
    if (rooms.camera && !rooms.cameretta) rooms.cameretta = rooms.camera
    if (rooms.ingresso && !rooms.corridoio) rooms.corridoio = rooms.ingresso
    return { rooms, frames: j.frames, doors: j.doors, facade: j.facade, roof: j.roof, shutters: j.shutters || '', from: imgs.length }
  } catch (e) {
    console.error('casa3d materiali', e)
    return null
  }
}
