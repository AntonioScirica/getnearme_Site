import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { uploadJpeg } from '@/lib/r2'
import { sealKey, watermarkImage } from '@/lib/demoProtect'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { stagePrompt } from '@/lib/nanoBanana'
import { gptImage } from '@/lib/gptImage'
import { STYLE_LOOK } from '@/lib/stagingPrompts'
import { finish } from '@/lib/finish'

export const runtime = 'nodejs'
export const maxDuration = 300

// Prova anonima dalla landing: una foto arredata nello stile scelto, senza account (per scaricare serve l'account:
// qui si restituisce solo un'anteprima a 1024 px). Nano Banana 2, ~0,065 EUR a foto (ripiego: Qwen + Opus).
// Limiti senza tabelle nuove: una riga "contatore" in ai_usage (kind landing_demo, provider counter, model = hash
// dell'IP), 1 foto al giorno per IP (poi 1 video, /api/landing/demo-video) e un tetto globale giornaliero.
// Se la foto non riesce la prova si restituisce (si cancella la riga contatore appena creata).
// ponytail: IP condivisi (uffici, 4G) si dividono la prova; tabella dedicata se serve un limite per dispositivo.
const PER_IP = 1
const PER_DAY = 100 // ~6 EUR/giorno al massimo con Nano Banana 2
const STYLES = ['modern', 'nordic', 'empty'] as const // empty = svuota la stanza
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { image?: unknown; style?: unknown; prompt?: unknown; mock?: unknown } | null
  const image = typeof body?.image === 'string' ? body.image : ''
  const style = STYLES.find(s => s === body?.style) ?? 'modern'
  const custom = typeof body?.prompt === 'string' ? body.prompt.replace(/[\u0000-\u001f"]/g, ' ').trim().slice(0, 200) : ''
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 6_000_000) return NextResponse.json({ error: 'bad_image' }, { status: 400 })

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const count = async (mine: boolean) => {
    // la prova e' una sola per IP, per sempre (30/09); il tetto di tutti resta giornaliero
    let q = admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_demo')
    q = mine ? q.eq('model', who) : q.gte('created_at', since)
    return (await q).count ?? 0
  }
  // IP senza limiti (i nostri, LANDING_FREE_IPS separati da virgola) e sviluppo locale: niente contatore
  const free = process.env.NODE_ENV === 'development' || (process.env.LANDING_FREE_IPS ?? '').split(',').map(x => x.trim()).includes(ip)
  const [used, all] = free ? [0, 0] : await Promise.all([count(true), count(false)])
  // simulazione (?simula=1 sulla landing, solo IP senza limiti o sviluppo): nessuna AI, foto d'esempio dopo 3 s
  if (free && body?.mock === true) {
    await new Promise(r => setTimeout(r, 3000))
    return NextResponse.json({ image: 'https://agenteimmo.me/immo/home/demo-after.webp', url: 'https://agenteimmo.me/immo/home/demo-after.webp', left: 99 })
  }
  if (used >= PER_IP) return NextResponse.json({ error: 'limit', left: 0 }, { status: 429 })
  if (all >= PER_DAY) return NextResponse.json({ error: 'busy' }, { status: 429 })
  // si prenota la prova prima di generare: richieste in parallelo dallo stesso IP non superano il limite di molto
  const { data: slot } = free ? { data: null } : await admin.from('ai_usage').insert({ user_id: null, kind: 'landing_demo', provider: 'counter', model: who, duration_ms: 0, cost_usd: 0, ok: true } as never).select('id').single()
  const giveBack = () => slot && admin.from('ai_usage').delete().eq('id', (slot as { id: string }).id)

  // foto ridotta a 1536 px: basta per il modello e per l'anteprima
  const src = await sharp(Buffer.from(image.split(',')[1], 'base64')).rotate().resize({ width: 1536, height: 1536, fit: 'inside' }).jpeg({ quality: 88 }).toBuffer()
  const look = custom ? `as requested by the agent (in Italian): "${custom}"` : style === 'empty' ? '' : STYLE_LOOK[style]
  const img = `data:image/jpeg;base64,${src.toString('base64')}`
  const empty = style === 'empty' && !custom
  // GPT Image 2.5 Sunburst, come in piattaforma (0,014 $ a qualita' bassa)
  const nb = await gptImage({ userId: '', image: img, prompt: stagePrompt({ task: empty ? 'empty' : 'furnish', room: '', style: look }), kind: 'landing_demo_image', quality: process.env.GPT_EDIT_QUALITY || 'low' })
  const staged = nb
  if (!staged) { await giveBack(); return NextResponse.json({ error: 'failed', left: PER_IP - used }, { status: 502 }) }
  const { width = 1024, height = 1024 } = await sharp(src).metadata()
  const done = await finish(Buffer.from(staged, 'base64'))
  // foto pulita su R2 a una chiave casuale che il browser non vede: riceve solo un gettone cifrato, che la piattaforma
  // scambia con la foto dopo il login (DemoDownload). In pagina solo la versione con la filigrana.
  const cleanKey = `landing-clean/${Date.now()}-${randomBytes(12).toString('hex')}.jpg`
  const saved = await uploadJpeg(await sharp(done).jpeg({ quality: 92 }).toBuffer(), cleanKey).then(() => true, () => false)
  const small = await sharp(done).resize(Math.round(width * Math.min(1, 1024 / Math.max(width, height))), Math.round(height * Math.min(1, 1024 / Math.max(width, height))), { fit: 'fill' }).jpeg({ quality: 88 }).toBuffer()
  const out = await watermarkImage(small)
  return NextResponse.json({ image: `data:image/jpeg;base64,${out.toString('base64')}`, token: saved ? sealKey(cleanKey) : null, left: free ? 99 : PER_IP - used - 1 })
}

// Stato della prova per chi torna sulla pagina: left = foto gratis rimaste oggi (0 = prova gia' usata, si mostrano i piani).
export async function GET(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const free = process.env.NODE_ENV === 'development' || (process.env.LANDING_FREE_IPS ?? '').split(',').map(x => x.trim()).includes(ip)
  if (free) return NextResponse.json({ left: 99 })
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_demo').eq('model', who)
  return NextResponse.json({ left: Math.max(0, PER_IP - (count ?? 0)) })
}
