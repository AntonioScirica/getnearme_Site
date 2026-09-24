import { NextRequest, NextResponse } from 'next/server'
import { buildStagingPrompt, type SceneType } from '@/lib/stagingPrompts'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { createClient } from '@supabase/supabase-js'
import { uploadJpeg } from '@/lib/r2'
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const runtime = 'nodejs'
export const maxDuration = 300

// "Sistema con AI": modifica una foto con Qwen-Image 2.1 sul nostro endpoint RunPod
// (repo getnearme-qwen-image-worker). Risultato salvato su R2, costo in ai_usage.
// Solo foto dei CDN dei portali o del nostro R2: il worker non scarica URL arbitrari.
const ALLOWED = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
const RUNPOD = 'https://api.runpod.ai/v2'
const allowedUrl = (u: string) => ALLOWED.test(u) || (!!process.env.R2_PUBLIC_URL && u.startsWith(`${process.env.R2_PUBLIC_URL}/`)) || isPublicHttpsUrl(u)

type RunpodJob = { id?: string; status?: string; output?: { image_base64?: string; error?: string; seconds?: number }; error?: string }

async function runJob(input: Record<string, unknown>): Promise<RunpodJob> {
  const id = process.env.AI_IMAGE_ENDPOINT_ID
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` }
  // runsync attende fino a ~90 s; se il lavoro non e' finito (avvio a freddo) si prosegue con /status.
  let job: RunpodJob = await fetch(`${RUNPOD}/${id}/runsync`, { method: 'POST', headers, body: JSON.stringify({ input }), signal: AbortSignal.timeout(120_000) }).then(r => r.json())
  const deadline = Date.now() + 240_000
  while (job.id && (job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS') && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    job = await fetch(`${RUNPOD}/${id}/status/${job.id}`, { headers, signal: AbortSignal.timeout(20_000) }).then(r => r.json())
  }
  return job
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Foto: URL (annunci, R2) oppure caricata dal computer (imageBase64, data URL gia' ridimensionata).
  // Modifica: testo libero e/o i preset di home staging (stile, vista, scena, planimetria).
  let body: { imageUrl?: string; imageBase64?: string; prompt?: string; style?: string; angle?: string; scene?: SceneType; planimetria?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const custom = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : ''
  const scene: SceneType = body.scene === 'esterno' || body.scene === 'giardino' ? body.scene : 'interno'
  const hasPreset = !!(body.style || body.angle || body.planimetria)
  if ((!custom && !hasPreset) || (!imageBase64 && !allowedUrl(imageUrl))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const prompt = buildStagingPrompt({ customPrompt: custom, style: body.style, angle: body.angle, planimetria: !!body.planimetria, scene })

  // Modalita' finta: nessuna GPU, torna la stessa foto.
  if (AI_MOCK) { await mockDelay(2000); return NextResponse.json({ url: imageUrl || imageBase64, mock: true }) }
  if (!process.env.AI_IMAGE_ENDPOINT_ID || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const t0 = Date.now()
  let job: RunpodJob
  try {
    job = await runJob({ ...(imageBase64 ? { image_base64: imageBase64 } : { image_url: imageUrl }), prompt, steps: 12 }) // 12 passaggi: ~8 s invece di 17 a 25, qualita' simile nel confronto del 24/09
  } catch (e) {
    console.error('photo-edit runpod error:', e)
    await logUsage({ userId, kind: 'photo_edit' }, true, Date.now() - t0, {}, false, 'qwen-image-2.1')
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
  const ms = Date.now() - t0
  const b64 = job.output?.image_base64
  await logUsage({ userId, kind: 'photo_edit' }, true, ms, {}, !!b64, 'qwen-image-2.1')
  if (!b64) {
    console.error('photo-edit failed:', job.status, job.error || job.output?.error)
    return NextResponse.json({ error: job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS' ? 'timeout' : 'ai_failed' }, { status: 502 })
  }
  const url = await uploadJpeg(await matchInputShape(Buffer.from(b64, 'base64'), imageBase64, imageUrl), `edits/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`)
  return NextResponse.json({ url, seconds: job.output?.seconds })
}

// Il modello genera a ~1 MP con lati multipli di 32: le proporzioni cambiano di poco (es. 1920x1440 ->
// 1184x896) e nel prima/dopo la foto sembra spostata. Riporto il risultato alle proporzioni esatte
// dell'originale (lato lungo max 1600 px). Se l'originale non si legge, resta com'e'.
async function matchInputShape(out: Buffer, imageBase64: string, imageUrl: string): Promise<Buffer> {
  try {
    const src = imageBase64
      ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64')
      : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).metadata()
    if (!width || !height) return out
    const k = Math.min(1, 1600 / Math.max(width, height))
    return await sharp(out).resize(Math.round(width * k), Math.round(height * k), { fit: 'fill' }).jpeg({ quality: 90 }).toBuffer()
  } catch {
    return out
  }
}
