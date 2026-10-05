import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canAfford, spendOnce } from '@/lib/credits'
import { CREDIT_COST } from '@/lib/pricing'
import { allowedUrl } from '@/lib/safeUrl'
import { parseAnim, parseSeason, pollVideo, renderVideo, startVideo, type FramesResult, type VideoResult } from '@/lib/videoJob'

export const runtime = 'nodejs'
export const maxDuration = 300

// Video dalla piattaforma: login e crediti qui, la ricetta in lib/videoJob (condivisa con la prova della landing).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function userOf(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}
const reply = ({ status, ...r }: VideoResult & FramesResult) => NextResponse.json(status === 'working' ? { ...r, status } : r, typeof status === 'number' ? { status } : undefined)

export async function POST(req: NextRequest) {
  const userId = await userOf(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // phase 'frames': solo Prima e Dopo (la chat li mostra); 'render': Veo dal token di Prima/Dopo approvati; senza: tutto di seguito
  let body: { imageUrl?: string; imageBase64?: string; projectId?: string; anim?: string; styled?: string; phase?: string; frames?: string; interior?: boolean; plan?: string; room?: string; look?: string; season?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const anim = parseAnim(body.anim), action = anim === 'fpv' ? 'video_fpv' : anim === 'cantiere' || anim === 'ristruttura' ? 'video_cantiere' : anim === 'daynight' ? 'video_daynight' : anim === 'camera' ? 'video_camera' : anim === 'planwalk' ? 'video_planwalk' : anim === 'drone' ? 'video_drone' : anim === 'stagioni' ? 'video_stagioni' : 'video'
  if (body.phase === 'render') {
    if (typeof body.frames !== 'string') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    if (!(await canAfford(userId, 'video_render'))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST.video_render }, { status: 402 })
    return reply(await renderVideo(userId, userId, body.frames, anim))
  }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  if (!imageBase64 && !allowedUrl(imageUrl)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  // crediti: controllo all'avvio, si scalano solo a video consegnato (GET)
  if (!(await canAfford(userId, action))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST[action] }, { status: 402 })
  const pid = typeof body.projectId === 'string' && /^[\w-]{1,64}$/.test(body.projectId) ? body.projectId : ''
  // foto nel nuovo stile (fatta da photo-edit, su R2): il video va dalla foto com'era a questa
  const styled = typeof body.styled === 'string' && allowedUrl(body.styled) ? body.styled : undefined
  // Dalla pianta alla stanza: anche la planimetria (indirizzo nostro o immagine caricata)
  const plan = typeof body.plan === 'string' && (allowedUrl(body.plan) || (/^data:image\/(jpeg|png|webp);base64,/.test(body.plan) && body.plan.length < 8_000_000)) ? body.plan : undefined
  if (anim === 'planwalk' && !plan) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const r = await startVideo(userId, userId, { imageUrl, imageBase64, projectId: pid, anim, styled, framesOnly: body.phase === 'frames', interior: body.interior === true, plan, room: typeof body.room === 'string' ? body.room.replace(/[^\p{L}\s']/gu, '').trim().slice(0, 40) || undefined : undefined, look: typeof body.look === 'string' && /^[a-z]{3,12}$/.test(body.look) ? body.look : undefined, ...(anim === 'stagioni' ? { season: parseSeason(body.season) } : {}) })
  // Prima e Dopo pronti: 1 credito (una volta per coppia di foto), il resto alla consegna del video
  if (body.phase === 'frames' && r.frames) await spendOnce(userId, 'video_prep', r.frames)
  return reply(r)
}

export async function GET(req: NextRequest) {
  const userId = await userOf(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { fresh, id, ...r } = await pollVideo(userId, req.nextUrl.searchParams.get('job') ?? '')
  // il lavoro firmato dice che video era: cantiere = due clip Kling (nome che finisce con -kc), Giorno e notte = una (-k)
  const job = req.nextUrl.searchParams.get('job') ?? ''
  const action = /-k[fh]\./.test(job) ? 'video_fpv' : /-kc\./.test(job) ? 'video_cantiere' : /-km\./.test(job) ? 'video_camera' : /-kp\./.test(job) ? 'video_planwalk' : /-ka\./.test(job) ? 'video_agent' : /-kw\./.test(job) ? 'video_walk' : /-kd\./.test(job) ? 'video_drone' : /-ks\./.test(job) ? 'video_stagioni' : /-k\./.test(job) ? 'video_daynight' : 'video_render' // Prima e dopo: 1 credito gia' scalato ai fotogrammi
  if (fresh && id) return NextResponse.json({ url: r.url, credits: await spendOnce(userId, action, id) })
  return reply(r)
}
