import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPublicHttpsUrl } from '@/lib/safeUrl'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 120

// Maschera dell'oggetto cliccato (SAM 2.1 nel worker foto), per mostrarla all'agente prima di modificare.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { imageUrl?: string; imageBase64?: string; points?: { x: number; y: number }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const imageUrl = typeof body.imageUrl === 'string' && isPublicHttpsUrl(body.imageUrl) ? body.imageUrl : ''
  const points = Array.isArray(body.points) ? body.points.filter(p => p && [p.x, p.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)).slice(0, 10) : []
  if ((!imageBase64 && !imageUrl) || !points.length) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const id = process.env.AI_IMAGE_ENDPOINT_ID
  if (!id || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const r = await fetch(`https://api.runpod.ai/v2/${id}/runsync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` },
    body: JSON.stringify({ input: { point_mask: points, ...(imageBase64 ? { image_base64: imageBase64 } : { image_url: imageUrl }) } }),
    signal: AbortSignal.timeout(110_000),
  }).then(x => x.json()).catch(() => null)
  const png = r?.output?.mask_png
  if (!png) return NextResponse.json({ error: r?.output?.error ?? (r?.status === 'IN_QUEUE' || r?.status === 'IN_PROGRESS' ? 'timeout' : 'ai_failed') }, { status: 502 })
  return NextResponse.json({ mask: `data:image/png;base64,${png}` })
}
