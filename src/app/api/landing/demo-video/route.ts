import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { deleteKeys, uploadFile } from '@/lib/r2'
import { sealKey } from '@/lib/demoProtect'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { alertCapReached } from '@/lib/landingAlert'
import { pollVideo, startVideo } from '@/lib/videoJob'
import { isFakeUser } from '@/lib/fakeAi'

export const runtime = 'nodejs'
export const maxDuration = 300

// Prova dalla pagina /prova, secondo passo (serve l'account): la foto appena arredata diventa un video (ricetta "i mobili compaiono",
// la stessa della piattaforma). ~0,9 $ a video con Veo 3.1 fast a 8 s (~1,7 $ standard) (Nano Banana 2 vuota + Sonnet elenco + Veo 8 s).
// Limiti come la prova foto (riga contatore in ai_usage): 1 video al giorno per IP, tetto globale giornaliero.
const PER_IP = 1
// tetto di tutti i video di prova al giorno (~0,85 $ l'uno): LANDING_VIDEO_PER_DAY su Vercel, predefinito 20 (~17 $/giorno)
const PER_DAY = Number(process.env.LANDING_VIDEO_PER_DAY) || 20
const OWNER = 'landing'
const MOCK_VIDEO = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/out/bbb243664b.mp4' // cartella su R2 e firma del lavoro
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { image?: unknown; device?: unknown; anim?: unknown; mock?: unknown; empty?: unknown } | null
  const image = typeof body?.image === 'string' ? body.image : ''
  if (body?.mock !== true && (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 4_000_000)) return NextResponse.json({ error: 'bad_image' }, { status: 400 })

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
  const who = createHash('sha256').update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)
  const since = new Date(Date.now() - 86_400_000).toISOString()
  // impronta del dispositivo (lib/deviceId): la prova vale una volta anche cambiando IP (VPN) o in incognito
  const dev = typeof body?.device === 'string' && /^[a-f0-9]{32}$/.test(body.device) ? `fp:${createHash('sha256').update(`${body.device}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 24)}` : null
  // la prova si fa solo con l'account (30/09): vale una volta per account, IP e dispositivo
  const user = await authUser(req)
  const devMock = process.env.NODE_ENV === 'development' && body?.mock === true // simulazione in locale: senza login
  if (!user && !devMock) return NextResponse.json({ error: 'login' }, { status: 401 })
  const acc = `u:${user?.id ?? 'dev'}`
  const keys = [who, acc, ...(dev ? [dev] : [])]
  const count = async (mine: boolean) => {
    // la prova e' una sola per IP, per sempre (30/09); il tetto di tutti resta giornaliero
    let q = admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_demo_video')
    q = mine ? q.in('model', keys) : q.eq('provider', 'counter').gte('created_at', since)
    return (await q).count ?? 0
  }
  // IP senza limiti (i nostri, LANDING_FREE_IPS separati da virgola) e sviluppo locale: niente contatore
  const free = process.env.NODE_ENV === 'development' || (process.env.LANDING_FREE_IPS ?? '').split(',').map(x => x.trim()).includes(ip)
  const [used, all] = free ? [0, 0] : await Promise.all([count(true), count(false)])
  // simulazione (solo IP senza limiti o sviluppo): nessuna AI, il GET risponde con un video d'esempio
  if (body?.mock === true) return free ? NextResponse.json({ job: 'mock' }) : NextResponse.json({ error: 'bad_image' }, { status: 400 })
  if (used >= PER_IP) return NextResponse.json({ error: 'limit' }, { status: 429 })
  if (all >= PER_DAY) { await alertCapReached(admin, 'video', PER_DAY); return NextResponse.json({ error: 'busy' }, { status: 429 }) }
  const { data: slot } = free ? { data: null } : await admin.from('ai_usage').insert({ user_id: user?.id ?? null, kind: 'landing_demo_video', provider: 'counter', model: who, duration_ms: 0, cost_usd: 0, ok: true } as never).select('id').single()
  // la stessa prova segnata anche sull'impronta del dispositivo (provider counter-fp: non conta nel tetto di tutti)
  if (!free && slot && dev) await admin.from('ai_usage').insert({ user_id: null, kind: 'landing_demo_video', provider: 'counter-fp', model: dev, duration_ms: 0, cost_usd: 0, ok: true } as never)
  if (!free && slot) await admin.from('ai_usage').insert({ user_id: user?.id ?? null, kind: 'landing_demo_video', provider: 'counter-fp', model: acc, duration_ms: 0, cost_usd: 0, ok: true } as never)

  // Svuota: image = foto originale, empty = stanza svuotata dalla prova; video in avanti, i mobili spariscono
  const empty = typeof body?.empty === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.empty) && body.empty.length < 4_000_000 ? body.empty : undefined
  // account di prova: lavoro finto
  const { status, ...r } = await startVideo(OWNER, (await isFakeUser(user?.id)) ? user!.id : '', { imageUrl: '', imageBase64: image, anim: body?.anim === 'gravity' ? 'gravity' : 'popup', empty }) // nella prova solo Popup e Dall'alto
  // non partito: la prova si restituisce
  if (!r.job && slot) { await admin.from('ai_usage').delete().eq('id', (slot as { id: string }).id); await admin.from('ai_usage').delete().eq('kind', 'landing_demo_video').eq('provider', 'counter-fp').in('model', dev ? [dev, acc] : [acc]) }
  return NextResponse.json(r, typeof status === 'number' ? { status } : undefined)
}

// controllo del lavoro: il client ripete finche' non arriva l'url (Veo ~1-2 minuti)
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('job') === 'mock') return NextResponse.json({ url: MOCK_VIDEO })
  const job = req.nextUrl.searchParams.get('job') ?? ''
  const name = (job.split('.')[1] ?? '').replace('~', '/')
  if (!/^[\w/-]{1,120}$/.test(name)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  // gia' pronto con la filigrana (il video pulito e' stato spostato): si risponde da qui
  const meta = `videos/${OWNER}/${name}.wm.json`
  const ready = await fetch(`${process.env.R2_PUBLIC_URL}/${meta}`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null) as { url?: string; token?: string } | null
  if (ready?.url) return NextResponse.json(ready)
  const { status, fresh: _f, id: _i, ...r } = await pollVideo(OWNER, job)
  if (status === 'working' || !r.url) return NextResponse.json(status === 'working' ? { status } : r, typeof status === 'number' ? { status } : undefined)
  // montato: niente filigrana (la prova si fa solo con l'account, 30/09); il video a una chiave casuale, il gettone per
  // lo scarico dalla piattaforma (DemoDownload) resta uguale
  {
    const clean = Buffer.from(await (await fetch(r.url)).arrayBuffer())
    const cleanKey = `landing-clean/${Date.now()}-${randomBytes(12).toString('hex')}.mp4`
    const url = await uploadFile(clean, cleanKey, 'video/mp4')
    const res = { url, token: sealKey(cleanKey) }
    await uploadFile(Buffer.from(JSON.stringify(res)), meta, 'application/json')
    await deleteKeys([`videos/${OWNER}/${name}.mp4`]).catch(() => {})
    return NextResponse.json(res)
  }
}
