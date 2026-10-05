// Controllo visivo economico (Sonnet, ~0,01 $): Claude vede la planimetria originale e la sovrapposizione numerata
// NELLO STESSO ORIENTAMENTO e risponde solo con correzioni puntuali in JSON (tipi stanza, aperture da togliere o
// cambiare, porte e finestre mancanti). Una chiamata per pianta.
// Rispetto al prototipo: non togliere le finestre sul perimetro, distinguere l'ingresso dalle porte interne e
// dalle portefinestre sui balconi (Claude scambiava porte per ingressi).
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import type { Fix, RawPlan } from './types'

const MODEL = 'claude-sonnet-5'
const USD = { input: 2, output: 10 } // per milione di token (listino del 27/09/2026, come lib/ai)

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['room_types', 'remove_openings', 'change_openings', 'add_doors', 'add_windows', 'notes'],
  properties: {
    room_types: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'type'], properties: { id: { type: 'integer' }, type: { type: 'string', enum: ['soggiorno', 'cucina', 'camera', 'cameretta', 'studio', 'bagno', 'ingresso', 'corridoio', 'ripostiglio', 'lavanderia', 'balcone', 'terrazzo', 'scala', 'esterno'] } } } },
    remove_openings: { type: 'array', items: { type: 'string' } },
    change_openings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'type'], properties: { label: { type: 'string' }, type: { type: 'string', enum: ['door', 'entrance', 'window', 'varco'] } } } },
    add_doors: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['between', 'entrance'], properties: { between: { type: 'array', items: { type: 'integer' } }, entrance: { type: 'boolean' } } } },
    add_windows: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['wall', 'room'], properties: { wall: { type: 'string' }, room: { type: 'integer' } } } },
    notes: { type: 'string' },
  },
}

export async function claudeCheck(original: Buffer, overlay: Buffer, plan: RawPlan): Promise<{ fix: Fix; usage: { input: number; output: number; usd: number }; ms: number }> {
  const img = async (b: Buffer) => (await sharp(b).flatten({ background: '#ffffff' }).resize(1100, 1100, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()).toString('base64')
  const elems = {
    stanze: plan.rooms.map(r => ({ id: r.id, mq: r.area })),
    aperture: plan.openings.map(o => ({ label: o.label, tipo: o.type, larghezza_m: o.width, stanze_ai_lati: o.rooms, sospetta: o.suspect })),
  }
  const text = `Image 1 is the original floor plan of one dwelling. Image 2 is our automatic reading of it, drawn in exactly the SAME orientation and position as image 1: dark grey = walls (small labels W#), orange P# = interior doors, red I# = entrance doors, purple V# = open passages without a door, blue F# = windows (including French windows), coloured areas R# = rooms with their area in square metres. Red outlines = elements we are unsure about.
Detected elements (stanze_ai_lati: room ids on the two sides, -1 = outside, 0 = wall or unknown): ${JSON.stringify(elems)}
Compare with image 1 and list only the corrections needed. Rules:
- Room types (Italian): soggiorno, cucina, camera, cameretta (small single bedroom), studio, bagno, ingresso, corridoio, ripostiglio, lavanderia, balcone, terrazzo, scala (stairs inside the dwelling), esterno (NOT part of the dwelling: the building's common stairwell or landing, lift, garden, outdoor steps, areas outside the outer walls). Give a type for every room id (room_types: list of {id, type}).
- Entrance (I#) = only the main door of the dwelling, from the common landing, stairwell or the street; a dwelling usually has one. A door between two rooms of the dwelling is P# even if one side was read as outside. A glazed door or opening onto a balcony or terrace is a window (F#), not an entrance.
- Do NOT remove windows on the outer perimeter walls: a gap in an outer wall is almost always a window even if image 1 draws it only as a thin line or a gap. Remove a window only if image 1 clearly shows solid wall there, or if it is between two rooms of the dwelling.
- Remove an opening only if image 1 clearly shows solid wall there. Change P#/V# to the right type when needed (varco = wide opening without door).
- Add a door or window only if you clearly see it in image 1 and it is missing in image 2. add_windows uses the W# label of the outer wall and the room id.
Reply only with the JSON object.`
  const t0 = Date.now()
  const client = new Anthropic()
  const resp = await client.messages.create({
    model: MODEL, max_tokens: 4000,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await img(original) } },
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await img(overlay) } },
      { type: 'text', text },
    ] }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
  })
  const txt = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  const j = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as Omit<Fix, 'room_types'> & { room_types?: { id: number; type: string }[] }
  const fix: Fix = { ...j, room_types: Object.fromEntries((j.room_types ?? []).map(r => [String(r.id), r.type])) }
  const u = resp.usage
  return { fix, usage: { input: u.input_tokens, output: u.output_tokens, usd: Math.round((u.input_tokens * USD.input + u.output_tokens * USD.output) / 1e6 * 1e4) / 1e4 }, ms: Date.now() - t0 }
}
