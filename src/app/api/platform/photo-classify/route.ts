import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { sceneFromName } from '@/lib/planUrl'
import { AI_MOCK } from '@/lib/aiMock'
import { getTeamUserIds } from '@/lib/teamScope'
import { overDailyCap } from '@/lib/ai'
import { viaHaiku } from '@/lib/photoClassify'
import type { Classified } from '@/lib/photoClassify'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 120

// Tipo di foto (interno/esterno/giardino/planimetria), stanza e stato. Quasi istantaneo:
// 1. foto di un immobile gia' riconosciuta: risposta dalla memoria dell'immobile (import_data.rooms);
// 1b. nome del file che dice gia' planimetria, esterno o giardino: niente AI;
// 2. altrimenti Claude Haiku (~1 s). Il risultato si salva nell'immobile, la volta dopo e' immediato.
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

  // prima dell'AI: il nome del file dice gia' planimetria, esterno o giardino? (gratis e subito)
  const byName = sceneFromName(photoUrl || imageUrl)
  if (byName) {
    if (project) {
      const d = (project.import_data && typeof project.import_data === 'object' ? project.import_data : {}) as Record<string, unknown>
      await admin.from('projects').update({ import_data: { ...d, rooms: { ...rooms, [photoUrl]: { ...byName, v: 2, da: 'nome' } } } }).eq('id', project.id)
    }
    return NextResponse.json({ ...byName, byName: true })
  }
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
