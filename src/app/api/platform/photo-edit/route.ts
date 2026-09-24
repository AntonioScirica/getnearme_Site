import { NextRequest, NextResponse } from 'next/server'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { createClient } from '@supabase/supabase-js'
import { uploadJpeg } from '@/lib/r2'
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

  let body: { imageUrl?: string; prompt?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : ''
  if (!prompt || !allowedUrl(imageUrl)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  // Modalita' finta: nessuna GPU, torna la stessa foto.
  if (AI_MOCK) { await mockDelay(2000); return NextResponse.json({ url: imageUrl, mock: true }) }
  if (!process.env.AI_IMAGE_ENDPOINT_ID || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const t0 = Date.now()
  let job: RunpodJob
  try {
    job = await runJob({ image_url: imageUrl, prompt })
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
  const url = await uploadJpeg(Buffer.from(b64, 'base64'), `edits/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`)
  return NextResponse.json({ url, seconds: job.output?.seconds })
}
