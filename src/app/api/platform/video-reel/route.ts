import { NextRequest, NextResponse } from 'next/server'
import { createClient, type User } from '@supabase/supabase-js'
import { createHash, createHmac } from 'crypto'
import { canAfford, spendOnce } from '@/lib/credits'
import { CREDIT_COST } from '@/lib/pricing'
import { allowedUrl } from '@/lib/safeUrl'
import { publicUrl, uploadAiJpeg, uploadAiVideo, uploadFile, uploadJpeg } from '@/lib/r2'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'
import { isAiPhotoUrl } from '@/lib/siteTemplates'
import { DEFAULT_COLOR, MUSIC_MOOD, renderVideo, type AgentInfo, type Job, type Photo } from '@/lib/reel/render'
import { cleanLambda, fetchLambdaVideo, isThrottle, lambdaProgress, lambdaReady, startLambda, type LambdaJob } from '@/lib/reel/lambda'

export const runtime = 'nodejs'
export const maxDuration = 300

// Video dell'annuncio (reel) e Video Venduto o Affittato (venduto), 05/10/2026: niente AI. Quattro stili:
// Vivace ed Elegante = composizioni Remotion su AWS Lambda (src/lib/reel/lambda.ts): POST avvia e risponde
// { status: 'working', job }, la chat chiede GET ?job= finche' il video e' pronto (salvato su R2 al primo GET finito).
// Semplice e Classico = montaggio FFmpeg qui (render.ts, i suoi vecchi 'vivace' ed 'elegante'), in una sola richiesta.
// Crediti solo se il video riesce; se Lambda fallisce niente addebito e niente ripiego su FFmpeg.
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

// stile scelto nella chat; i vecchi id del montaggio FFmpeg non sono mai stati salvati da nessuna parte
type Style = 'vivace' | 'elegante' | 'semplice' | 'classico'
const STYLES: Style[] = ['vivace', 'elegante', 'semplice', 'classico']
const onLambda = (s: Style): s is 'vivace' | 'elegante' => s === 'vivace' || s === 'elegante'
// copertina (Galleria) dal video Remotion: scena d'apertura con le scritte gia' entrate
const COVER_AT = { reel: 2, venduto: 2.5 }
const redoToken = (uid: string, name: string, n: number, print: string) => (n < FREE_REDOS ? `${name.replace('/', '~')}.${n}.${sign(uid, `reel.${name}.${n}.${print}`)}` : null)
// lavoro su Lambda: dati del render firmati (niente tabella), li rilegge il GET
type Work = { r: string; b: string; name: string; t: 'reel' | 'venduto'; n: number; p: string; redo: boolean; dir: string; c: number; logo: boolean; at: number; ai?: boolean }
// video con almeno una foto arredata dall'AI: mp4 e copertina col segno nascosto (AI Act, lib/aiMark); gli altri restano normali
const saveReel = (key: string, mp4: Buffer, cover: Buffer, ai: boolean) => Promise.all(ai
  ? [uploadAiVideo(mp4, `${key}.mp4`, 'composite'), uploadAiJpeg(cover, `${key}-arredata.jpg`, 'composite')]
  : [uploadFile(mp4, `${key}.mp4`, 'video/mp4'), uploadJpeg(cover, `${key}-arredata.jpg`)])
// foto temporanee su R2 (0.jpg, 1.jpg, ... e logo.png) da cancellare a fine render
const srcFiles = (w: Work) => [...Array.from({ length: w.c }, (_, k) => `${w.dir}/${k}.jpg`), ...(w.logo ? [`${w.dir}/logo.png`] : [])]
const packWork = (uid: string, w: Work) => { const d = Buffer.from(JSON.stringify(w)).toString('base64url'); return `${d}.${sign(uid, `reel-job.${d}`)}` }
function unpackWork(uid: string, job: string): Work | null {
  const [d, sig] = job.split('.')
  if (!d || !sig || sig !== sign(uid, `reel-job.${d}`)) return null
  try { return JSON.parse(Buffer.from(d, 'base64url').toString()) as Work } catch { return null }
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
  // segno nascosto AI Act sul video: foto arredate (staged) o risultati AI della piattaforma (edits/ su R2)
  // (anche foto caricate che hanno gia' il segno nascosto nei metadati)
  const aiReel = srcs.some(x => x.staged || isAiPhotoUrl(x.src)) || bufs.some(b => b!.includes('AlgorithmicMedia'))
  const contract: 'vendita' | 'affitto' = body.contract === 'affitto' ? 'affitto' : 'vendita'
  const style = STYLES.find(s => s === body.style) ?? 'vivace'
  // montaggio FFmpeg: Semplice = il suo vivace, Classico = il suo elegante (anche per la scelta della musica)
  const look = style === 'elegante' || style === 'classico' ? 'elegante' : 'vivace'
  const enhance = body.enhance !== false
  if (onLambda(style) && !lambdaReady()) { console.error('video-reel: Remotion Lambda non configurato'); return NextResponse.json({ error: 'render_failed' }, { status: 503 }) }
  const agent = await agentOf(u)
  const fields = template === 'reel'
    ? { kind: 'reel' as const, photos, title: str(body.title, 80), place: str(body.place, 60), price: str(body.price, 40), mq: str(body.mq, 8), rooms: str(body.rooms, 4), contract, enhance, agent }
    : { kind: 'venduto' as const, photo: photos[0], place: str(body.place, 60), days: str(body.days, 4), contract, enhance, agent }
  const pid = typeof body.projectId === 'string' && /^[\w-]{1,64}$/.test(body.projectId) ? body.projectId : ''
  const name = redo?.name ?? `${pid ? `casa-${pid}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${template === 'reel' ? 'ra' : 'vs'}`
  const mood = MUSIC_MOOD[look][Math.floor(Math.random() * 2)], tracks = MUSIC_CATALOG[mood]
  const musicUrl = `${MUSIC_BASE}/${mood}/${encodeURIComponent(tracks[Math.floor(Math.random() * tracks.length)])}`

  if (onLambda(style)) {
    // Remotion su Lambda: foto su R2 in una cartella temporanea, render avviato, la chat poi chiede a che punto e'
    const dir = `reel-src/${u.id}/${name.replace('/', '~')}-${redo?.n ?? 0}`
    try {
      const t0 = Date.now()
      const j = { ...fields, style } as LambdaJob
      const { renderId, bucket } = await startLambda(j, dir, musicUrl)
      console.log('video-reel lambda start', template, style, photos.length, 'foto', renderId, Date.now() - t0, 'ms')
      return NextResponse.json({ status: 'working', job: packWork(u.id, { r: renderId, b: bucket, name, t: template, n: redo?.n ?? 0, p: print, redo: !!redo, dir, c: photos.length, logo: !!agent.logo, at: t0, ...(aiReel ? { ai: true } : {}) }) })
    } catch (e) {
      if (isThrottle(e)) { console.log('video-reel lambda in coda', template, style); return NextResponse.json({ status: 'queued' }) }
      console.error('video-reel lambda start', e)
      return NextResponse.json({ error: 'render_failed' }, { status: 502 })
    }
  }

  const job = { ...fields, style: look } as Job
  try {
    const music = await fetch(musicUrl, { signal: AbortSignal.timeout(15_000) })
      .then(r => (r.ok ? r.arrayBuffer() : null)).then(b => (b ? Buffer.from(b) : null)).catch(() => null)
    const t0 = Date.now()
    const r = await renderVideo(job, music)
    const key = `videos/${u.id}/${name}`
    const [url] = await saveReel(key, r.mp4, r.cover, aiReel)
    console.log('video-reel', template, style, photos.length, 'foto', Date.now() - t0, 'ms')
    // primo video: crediti ora (una volta sola per nome); correzioni gratis
    const credits = redo ? undefined : await spendOnce(u.id, action, name)
    const n = redo?.n ?? 0
    return NextResponse.json({ url: `${url}?v=${n}`, credits, redo: redoToken(u.id, name, n, print), redosLeft: FREE_REDOS - n })
  } catch (e) {
    console.error('video-reel', e)
    return NextResponse.json({ error: 'render_failed' }, { status: 502 })
  }
}

// Video Remotion: a che punto e'. A render finito si salva su R2 (mp4 + copertina) e si scalano i crediti (una volta per nome).
export async function GET(req: NextRequest) {
  const u = await userOf(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const w = unpackWork(u.id, req.nextUrl.searchParams.get('job') ?? '')
  if (!w) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  try {
    const pr = await lambdaProgress(w.r, w.b)
    if (!pr) return NextResponse.json({ status: 'working' })
    if (pr.fatalErrorEncountered) {
      const msg = pr.errors.map(e => e.message).join(' | ')
      void cleanLambda(w.r, w.b, srcFiles(w))
      // AWS pieno a meta' lavoro: la chat rimanda la richiesta da capo (crediti mai scalati prima della fine)
      if (isThrottle(msg)) { console.log('video-reel lambda in coda (a meta)', w.r); return NextResponse.json({ status: 'queued' }) }
      console.error('video-reel lambda', w.r, msg.slice(0, 1000))
      return NextResponse.json({ error: 'render_failed' }, { status: 502 })
    }
    if (!pr.done || !pr.outKey) return NextResponse.json({ status: 'working', progress: Math.round(pr.overallProgress * 100) })
    const { mp4, cover } = await fetchLambdaVideo(w.b, pr.outKey, COVER_AT[w.t])
    const key = `videos/${u.id}/${w.name}`
    const [url] = await saveReel(key, mp4, cover, !!w.ai)
    const action = w.t === 'reel' ? 'video_reel' : 'video_venduto'
    const credits = w.redo ? undefined : await spendOnce(u.id, action, w.name)
    console.log('video-reel lambda done', w.t, w.r, Date.now() - w.at, 'ms', 'costo AWS', pr.costs.displayCost, pr.costs.accruedSoFar, (mp4.length / 1e6).toFixed(1), 'MB')
    await cleanLambda(w.r, w.b, srcFiles(w))
    return NextResponse.json({ url: `${url}?v=${w.n}`, credits, redo: redoToken(u.id, w.name, w.n, w.p), redosLeft: FREE_REDOS - w.n })
  } catch (e) {
    // un altro controllo (seconda scheda, pagina ricaricata) ha gia' salvato il video e ripulito Lambda: si risponde con quello
    const key = `videos/${u.id}/${w.name}.mp4`
    const head = await fetch(publicUrl(key), { method: 'HEAD', cache: 'no-store' }).catch(() => null)
    const at = Date.parse(head?.headers.get('last-modified') ?? '')
    if (head?.ok && at >= w.at - 60_000) return NextResponse.json({ url: `${publicUrl(key)}?v=${w.n}`, redo: redoToken(u.id, w.name, w.n, w.p), redosLeft: FREE_REDOS - w.n })
    console.error('video-reel lambda poll', w.r, e)
    return NextResponse.json({ error: 'render_failed' }, { status: 502 })
  }
}
