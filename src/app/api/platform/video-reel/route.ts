import { NextRequest, NextResponse } from 'next/server'
import { createClient, type User } from '@supabase/supabase-js'
import { createHash, createHmac } from 'crypto'
import { canAfford, spendOnce } from '@/lib/credits'
import { CREDIT_COST } from '@/lib/pricing'
import { allowedUrl } from '@/lib/safeUrl'
import { uploadFile, uploadJpeg } from '@/lib/r2'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'
import { DEFAULT_COLOR, MUSIC_MOOD, renderVideo, type AgentInfo, type Job, type Photo } from '@/lib/reel/render'

export const runtime = 'nodejs'
export const maxDuration = 300

// Video dell'annuncio (reel) e Video Venduto o Affittato (venduto), 05/10/2026: niente AI, montaggio FFmpeg qui.
// Il video si fa in una richiesta (meno di un minuto); crediti solo se riesce.
// redo: correggere i testi dopo il video e' gratis (stesse foto, fino a 3 volte), con il token firmato del primo video.
// Dati dell'agente (nome, agenzia, telefono, logo, sito) letti qui dal suo profilo, mai dal browser.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FREE_REDOS = 3
// stessa firma di lib/videoJob (non importata: si porterebbe dietro tutta la parte AI)
const sign = (userId: string, id: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`${userId}:${id}`).digest('base64url').slice(0, 22)
const MUSIC_BASE = 'https://pub-cd3d5947375c4207af2dc57da61686ee.r2.dev/music'

async function userOf(req: NextRequest): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user ?? null
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const isData = (s: string) => /^data:image\/(jpeg|png|webp);base64,/.test(s) && s.length < 3_000_000

async function load(src: string): Promise<Buffer | null> {
  if (isData(src)) return Buffer.from(src.split(',')[1] ?? '', 'base64')
  if (!allowedUrl(src)) return null
  const r = await fetch(src, { signal: AbortSignal.timeout(20_000) }).catch(() => null)
  if (!r?.ok) return null
  const b = Buffer.from(await r.arrayBuffer())
  return b.length && b.length < 20_000_000 ? b : null
}

async function agentOf(u: User): Promise<AgentInfo> {
  const { data: b } = await admin.from('user_brand').select('portfolio_slug, company_name, display_name, logo_colored_h, logo_black_h, site_published').eq('user_id', u.id).maybeSingle()
  const site = (u.user_metadata?.vetrina_site ?? {}) as { phone?: unknown; agencyName?: unknown; primary?: unknown; logo?: unknown }
  const logoUrl = (typeof site.logo === 'string' && site.logo) || b?.logo_colored_h || b?.logo_black_h || ''
  const logo = logoUrl && /^https:\/\//.test(logoUrl) ? await load(logoUrl).catch(() => null) : null
  const name = str(b?.display_name, 60) || str(u.user_metadata?.full_name, 60) || str(u.user_metadata?.name, 60)
  const agency = str(site.agencyName, 60) || str(b?.company_name, 60)
  const host = process.env.NEXT_PUBLIC_PORTFOLIO_HOST || 'agenteimmo.me'
  return {
    name, agency,
    phone: typeof site.phone === 'string' ? site.phone.replace(/[^\d+ ]/g, '').trim().slice(0, 20) : '',
    site: b?.portfolio_slug && b.site_published ? `${host}/${b.portfolio_slug}` : '',
    // colore del sito dell'agente se l'ha scelto, altrimenti il blu di Agente Immo
    color: typeof site.primary === 'string' && /^#[0-9a-f]{6}$/i.test(site.primary) ? site.primary : DEFAULT_COLOR,
    logo,
  }
}

type Body = { template?: unknown; photos?: unknown; title?: unknown; place?: unknown; price?: unknown; mq?: unknown; rooms?: unknown; contract?: unknown; style?: unknown; enhance?: unknown; days?: unknown; projectId?: unknown; redo?: unknown }

export async function POST(req: NextRequest) {
  const u = await userOf(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const template = body.template === 'venduto' ? 'venduto' : body.template === 'reel' ? 'reel' : null
  const list = Array.isArray(body.photos) ? body.photos.slice(0, 8) : []
  const srcs = list.map(p => ({ src: str((p as { src?: unknown })?.src, 3_000_000), staged: (p as { staged?: unknown })?.staged === true })).filter(p => p.src && (isData(p.src) || allowedUrl(p.src)))
  if (!template || !srcs.length || srcs.length !== list.length) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const action = template === 'reel' ? 'video_reel' : 'video_venduto'

  // correzione gratis: stesse foto del video gia' pagato (impronta nel token), al massimo FREE_REDOS volte
  const print = createHash('sha256').update(JSON.stringify([template, srcs.map(p => (isData(p.src) ? createHash('sha256').update(p.src).digest('hex') : p.src))])).digest('base64url').slice(0, 16)
  let redo: { name: string; n: number } | null = null
  if (typeof body.redo === 'string') {
    const [tilde, n, sig] = body.redo.split('.')
    const name = (tilde ?? '').replace('~', '/'), k = Number(n)
    if (!/^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+-(ra|vs)$/.test(name) || !(k >= 0) || sig !== sign(u.id, `reel.${name}.${k}.${print}`)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    if (k >= FREE_REDOS) return NextResponse.json({ error: 'redo_limit' }, { status: 429 })
    redo = { name, n: k + 1 }
  }
  if (!redo && !(await canAfford(u.id, action))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST[action] }, { status: 402 })

  const bufs = await Promise.all(srcs.map(p => load(p.src).catch(() => null)))
  if (bufs.some(b => !b)) return NextResponse.json({ error: 'photo_unreadable' }, { status: 422 })
  const photos: Photo[] = bufs.map((b, k) => ({ buf: b!, staged: srcs[k].staged }))
  const contract = body.contract === 'affitto' ? 'affitto' : 'vendita'
  const style = body.style === 'elegante' ? 'elegante' : 'vivace'
  const enhance = body.enhance !== false
  const agent = await agentOf(u)
  const job: Job = template === 'reel'
    ? { kind: 'reel', photos, title: str(body.title, 80), place: str(body.place, 60), price: str(body.price, 40), mq: str(body.mq, 8), rooms: str(body.rooms, 4), contract, style, enhance, agent }
    : { kind: 'venduto', photo: photos[0], place: str(body.place, 60), days: str(body.days, 4), contract, style, enhance, agent }

  try {
    const pid = typeof body.projectId === 'string' && /^[\w-]{1,64}$/.test(body.projectId) ? body.projectId : ''
    const name = redo?.name ?? `${pid ? `casa-${pid}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${template === 'reel' ? 'ra' : 'vs'}`
    const mood = MUSIC_MOOD[style][Math.floor(Math.random() * 2)], tracks = MUSIC_CATALOG[mood]
    const music = await fetch(`${MUSIC_BASE}/${mood}/${encodeURIComponent(tracks[Math.floor(Math.random() * tracks.length)])}`, { signal: AbortSignal.timeout(15_000) })
      .then(r => (r.ok ? r.arrayBuffer() : null)).then(b => (b ? Buffer.from(b) : null)).catch(() => null)
    const t0 = Date.now()
    const r = await renderVideo(job, music)
    const key = `videos/${u.id}/${name}`
    const [url] = await Promise.all([uploadFile(r.mp4, `${key}.mp4`, 'video/mp4'), uploadJpeg(r.cover, `${key}-arredata.jpg`)])
    console.log('video-reel', template, style, photos.length, 'foto', Date.now() - t0, 'ms')
    // primo video: crediti ora (una volta sola per nome); correzioni gratis
    const credits = redo ? undefined : await spendOnce(u.id, action, name)
    const n = redo?.n ?? 0
    return NextResponse.json({ url: `${url}?v=${n}`, credits, redo: n < FREE_REDOS ? `${name.replace('/', '~')}.${n}.${sign(u.id, `reel.${name}.${n}.${print}`)}` : null, redosLeft: FREE_REDOS - n })
  } catch (e) {
    console.error('video-reel', e)
    return NextResponse.json({ error: 'render_failed' }, { status: 502 })
  }
}
