import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { guidedEdit } from '@/lib/guidedEdit'
import { nanoBanana, stagePrompt } from '@/lib/nanoBanana'
import { STYLE_LOOK } from '@/lib/stagingPrompts'
import { finish } from '@/lib/finish'

export const runtime = 'nodejs'
export const maxDuration = 300

// Prova anonima dalla landing: una foto arredata nello stile scelto, senza account (per scaricare serve l'account:
// qui si restituisce solo un'anteprima a 1024 px). Nano Banana 2, ~0,065 EUR a foto (ripiego: Qwen + Opus).
// Limiti senza tabelle nuove: una riga "contatore" in ai_usage (kind landing_demo, provider counter, model = hash
// dell'IP), 3 prove al giorno per IP e un tetto globale giornaliero.
// ponytail: IP condivisi (uffici, 4G) si dividono le 3 prove; tabella dedicata se serve un limite per dispositivo.
const PER_IP = 3
const PER_DAY = 300
const STYLES = ['modern', 'nordic', 'industrial'] as const
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { image?: unknown; style?: unknown; prompt?: unknown } | null
  const image = typeof body?.image === 'string' ? body.image : ''
  const style = STYLES.find(s => s === body?.style) ?? 'modern'
  const custom = typeof body?.prompt === 'string' ? body.prompt.replace(/[\u0000-\u001f"]/g, ' ').trim().slice(0, 200) : ''
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 6_000_000) return NextResponse.json({ error: 'bad_image' }, { status: 400 })

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const count = async (mine: boolean) => {
    let q = admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_demo').gte('created_at', since)
    if (mine) q = q.eq('model', who)
    return (await q).count ?? 0
  }
  const [used, all] = await Promise.all([count(true), count(false)])
  if (used >= PER_IP) return NextResponse.json({ error: 'limit', left: 0 }, { status: 429 })
  if (all >= PER_DAY) return NextResponse.json({ error: 'busy' }, { status: 429 })
  // si prenota la prova prima di generare: richieste in parallelo dallo stesso IP non superano il limite di molto
  await admin.from('ai_usage').insert({ user_id: null, kind: 'landing_demo', provider: 'counter', model: who, duration_ms: 0, cost_usd: 0, ok: true } as never)

  // foto ridotta a 1536 px: basta per il modello e per l'anteprima
  const src = await sharp(Buffer.from(image.split(',')[1], 'base64')).rotate().resize({ width: 1536, height: 1536, fit: 'inside' }).jpeg({ quality: 88 }).toBuffer()
  const look = custom ? `as requested by the agent (in Italian): "${custom}"` : STYLE_LOOK[style]
  const img = `data:image/jpeg;base64,${src.toString('base64')}`
  const nb = await nanoBanana({ userId: '', image: img, prompt: stagePrompt({ task: 'furnish', room: '', style: look }), kind: 'landing_demo_image' })
  const staged = nb ?? (await guidedEdit({ userId: '', input: { image_base64: img }, task: 'furnish', room: 'the room in the photo (recognize its type)', style: look, seed: Math.floor(Math.random() * 1_000_000) })).image
  if (!staged) return NextResponse.json({ error: 'failed', left: PER_IP - used - 1 }, { status: 502 })
  const { width = 1024, height = 1024 } = await sharp(src).metadata()
  const out = await sharp(await finish(Buffer.from(staged, 'base64'))).resize(Math.round(width * Math.min(1, 1024 / Math.max(width, height))), Math.round(height * Math.min(1, 1024 / Math.max(width, height))), { fit: 'fill' }).jpeg({ quality: 82 }).toBuffer()
  return NextResponse.json({ image: `data:image/jpeg;base64,${out.toString('base64')}`, left: PER_IP - used - 1 })
}
