import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { AI_MOCK } from '@/lib/aiMock'
import { getTeamUserIds } from '@/lib/teamScope'
import { logUsage, overDailyCap } from '@/lib/ai'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 120

// Tipo di foto (interno/esterno/giardino/planimetria), stanza e stato. Quasi istantaneo:
// 1. foto di un immobile gia' riconosciuta: risposta dalla memoria dell'immobile (import_data.rooms);
// 2. altrimenti Claude Haiku (~1 s). Il risultato si salva nell'immobile, la volta dopo e' immediato.
export type Classified = { scene: 'interno' | 'esterno' | 'giardino' | 'planimetria'; room: string; state?: string }
const SCENES = ['interno', 'esterno', 'giardino', 'planimetria']
const ROOMS = ['openspace', 'soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'sala', 'studio', 'ingresso', 'corridoio', 'balcone', 'cantina', 'box', 'altro']
const STATES = ['vuota', 'disordinata', 'datata', 'arredata']
const PROMPT = `Classifica questa foto immobiliare. Rispondi SOLO con JSON {"scene": "...", "room": "...", "state": "..."}.
scene: interno (stanza, anche balconi/logge/terrazzi di appartamento), esterno (facciata vista da fuori), giardino (giardino o cortile a terra), planimetria (disegno della pianta).
room (solo per interno, altrimenti ""): ${ROOMS.join(', ')}. openspace = cucina e zona giorno nello stesso ambiente (anche separate da penisola o muretto): SOLO se nella foto si vedono davvero mobili o elettrodomestici della cucina (piano cottura, lavello, pensili, frigo, cappa, penisola con piano di lavoro). Un tavolo da pranzo con le sedie NON e' una cucina: divano + tavolo da pranzo senza cucina visibile = soggiorno. Balconi e terrazzi = balcone.
state (solo per interno, altrimenti ""): vuota (senza veri mobili), disordinata (arredata ma in disordine), datata (mobili/finiture vecchi), arredata (arredata e in ordine).`

const clean = (o: Partial<Classified> | null | undefined): Classified | null => {
  if (!o || !SCENES.includes(String(o.scene))) return null
  const interno = o.scene === 'interno'
  return { scene: o.scene as Classified['scene'], room: interno && ROOMS.includes(String(o.room)) ? String(o.room) : interno ? 'altro' : '', state: interno && STATES.includes(String(o.state)) ? String(o.state) : '' }
}

// ~0,002 $ a foto (immagine + 60 token): si registra in ai_usage e si blocca oltre CLASSIFY_DAILY_LIMIT al giorno (500)
async function viaHaiku(image: { imageBase64?: string; imageUrl?: string }, userId: string): Promise<Classified> {
  const key = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!key) throw new Error('no_key')
  const t0 = Date.now()
  const m = image.imageBase64?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
  const source = m
    ? { type: 'base64' as const, media_type: m[1] as 'image/jpeg' | 'image/png' | 'image/webp', data: m[2] }
    : { type: 'url' as const, url: image.imageUrl! }
  const resp = await new Anthropic({ apiKey: key }).messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 60, temperature: 0,
    messages: [{ role: 'user', content: [{ type: 'image', source }, { type: 'text', text: PROMPT }] }],
  })
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  const c = clean(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? 'null'))
  await logUsage({ userId, kind: 'classify' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, !!c, 'claude-haiku-4-5-20251001').catch(() => {})
  if (!c) throw new Error('haiku_failed')
  return c
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { imageUrl?: string; imageBase64?: string; projectId?: string; photoUrl?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const imageUrl = typeof body.imageUrl === 'string' && isPublicHttpsUrl(body.imageUrl) ? body.imageUrl : ''
  if (!imageBase64 && !imageUrl) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (AI_MOCK) return NextResponse.json({ scene: 'interno', room: 'soggiorno', state: 'arredata', mock: true })

  // foto di un immobile: memoria per foto (import_data.rooms[url])
  const photoUrl = typeof body.photoUrl === 'string' && isPublicHttpsUrl(body.photoUrl) ? body.photoUrl : ''
  const project = typeof body.projectId === 'string' && photoUrl
    ? (await admin.from('projects').select('id, import_data').eq('id', body.projectId).in('user_id', await getTeamUserIds(admin, data.user.id)).maybeSingle()).data
    : null
  const rooms = ((project?.import_data as { rooms?: Record<string, Classified> } | null)?.rooms) ?? {}
  // v2: con "openspace" (cucina + soggiorno). Le foto riconosciute prima si rifanno
  if (project && rooms[photoUrl] && (rooms[photoUrl] as Classified & { v?: number }).v === 2) return NextResponse.json({ ...rooms[photoUrl], cached: true })

  const image = { imageBase64, imageUrl }
  if (await overDailyCap(data.user.id, ['classify'], Number(process.env.CLASSIFY_DAILY_LIMIT) || 500)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  const c = await viaHaiku(image, data.user.id).catch(() => null)
  if (!c) return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  if (project) {
    const d = (project.import_data && typeof project.import_data === 'object' ? project.import_data : {}) as Record<string, unknown>
    await admin.from('projects').update({ import_data: { ...d, rooms: { ...rooms, [photoUrl]: { ...c, v: 2 } } } }).eq('id', project.id)
  }
  return NextResponse.json(c)
}
