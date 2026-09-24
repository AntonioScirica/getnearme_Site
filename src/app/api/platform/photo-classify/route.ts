import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { AI_MOCK } from '@/lib/aiMock'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const RUNPOD = 'https://api.runpod.ai/v2'
export const maxDuration = 120

// Tipo di foto (interno/esterno/giardino/planimetria) e stanza, dal servizio foto (stesso worker di
// photo-edit, input { classify: true }). Costa ~1 s di GPU; se il worker e' spento aspetta l'avvio.
export type Classified = { scene: 'interno' | 'esterno' | 'giardino' | 'planimetria'; room: string }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { imageUrl?: string; imageBase64?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const imageUrl = typeof body.imageUrl === 'string' && isPublicHttpsUrl(body.imageUrl) ? body.imageUrl : ''
  if (!imageBase64 && !imageUrl) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  if (AI_MOCK) return NextResponse.json({ scene: 'interno', room: 'soggiorno', mock: true } satisfies Classified & { mock: boolean })
  const id = process.env.AI_IMAGE_ENDPOINT_ID
  if (!id || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const r = await fetch(`${RUNPOD}/${id}/runsync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` },
    body: JSON.stringify({ input: { classify: true, ...(imageBase64 ? { image_base64: imageBase64 } : { image_url: imageUrl }) } }),
    signal: AbortSignal.timeout(110_000),
  }).then(x => x.json()).catch(() => null)
  const out = r?.output as Partial<Classified> | undefined
  if (!out?.scene) return NextResponse.json({ error: r?.status === 'IN_QUEUE' || r?.status === 'IN_PROGRESS' ? 'timeout' : 'ai_failed' }, { status: 502 })
  return NextResponse.json({ scene: out.scene, room: out.room ?? '' })
}
