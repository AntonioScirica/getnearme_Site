import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { pollVideo, startVideo } from '@/lib/videoJob'

export const runtime = 'nodejs'
export const maxDuration = 300

// Prova anonima dalla landing, secondo passo: la foto appena arredata diventa un video (ricetta "i mobili compaiono",
// la stessa della piattaforma). ~0,25 $ a video (Nano Banana 2 vuota + Opus elenco + Veo Lite 4 s).
// Limiti come la prova foto (riga contatore in ai_usage): 1 video al giorno per IP, tetto globale giornaliero.
const PER_IP = 1
const PER_DAY = 20 // ~5 $/giorno al massimo
const OWNER = 'landing' // cartella su R2 e firma del lavoro
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { image?: unknown } | null
  const image = typeof body?.image === 'string' ? body.image : ''
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 4_000_000) return NextResponse.json({ error: 'bad_image' }, { status: 400 })

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const count = async (mine: boolean) => {
    let q = admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_demo_video').gte('created_at', since)
    if (mine) q = q.eq('model', who)
    return (await q).count ?? 0
  }
  // IP senza limiti (i nostri, LANDING_FREE_IPS separati da virgola) e sviluppo locale: niente contatore
  const free = process.env.NODE_ENV === 'development' || (process.env.LANDING_FREE_IPS ?? '').split(',').map(x => x.trim()).includes(ip)
  const [used, all] = free ? [0, 0] : await Promise.all([count(true), count(false)])
  if (used >= PER_IP) return NextResponse.json({ error: 'limit' }, { status: 429 })
  if (all >= PER_DAY) return NextResponse.json({ error: 'busy' }, { status: 429 })
  const { data: slot } = free ? { data: null } : await admin.from('ai_usage').insert({ user_id: null, kind: 'landing_demo_video', provider: 'counter', model: who, duration_ms: 0, cost_usd: 0, ok: true } as never).select('id').single()

  const { status, ...r } = await startVideo(OWNER, '', { imageUrl: '', imageBase64: image, anim: 'popup' })
  // non partito: la prova si restituisce
  if (!r.job && slot) await admin.from('ai_usage').delete().eq('id', (slot as { id: string }).id)
  return NextResponse.json(r, typeof status === 'number' ? { status } : undefined)
}

// controllo del lavoro: il client ripete finche' non arriva l'url (Veo ~1-2 minuti)
export async function GET(req: NextRequest) {
  const { status, fresh: _f, id: _i, ...r } = await pollVideo(OWNER, req.nextUrl.searchParams.get('job') ?? '')
  return NextResponse.json(status === 'working' ? { status } : r, typeof status === 'number' ? { status } : undefined)
}
