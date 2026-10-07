import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { socialPublishAllowed } from '@/lib/socialAccess'

// Pubblicazione diretta sui social (06/10/2026): la stessa coda della vecchia dashboard GetNearMe (tabella scheduled_posts,
// bucket privato social-post-media), pubblicata dalla edge function publish-due-posts che il cron chiama ogni minuto.
// "Pubblica ora" = un post con l'ora di adesso: il cron lo prende entro un minuto. Qui e non in social-post-create perche'
// servono due cose che quella funzione non salva: l'immobile (per l'elenco nella sua scheda) e le foto del carosello.
// Vanno in platform_results._meta (jsonb gia' esistente, niente modifiche al database); publish-due-posts conserva la chiave.
// Collegamento e scollegamento degli account restano sulle edge function (social-oauth-*, social-disconnect): hanno le chiavi Meta.

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = 'social-post-media'
const NETS = ['instagram', 'facebook', 'tiktok'] as const
type Net = (typeof NETS)[number]
const IG_DAILY_LIMIT = 25

async function userOf(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user ?? null
}
// solo gli utenti abilitati (SOCIAL_PUBLISH_EMAILS, lib/socialAccess): per gli altri questa API non esiste (404)
const hidden = () => NextResponse.json({ error: 'not_found' }, { status: 404 })

// Cosa sa fare la publish-due-posts pubblicata: la versione nuova risponde a GET ?caps=1 (caroselli, storie Facebook, foto
// TikTok); quella vecchia risponde 403 e allora si pubblicano solo foto singole e video. Si riguarda ogni 10 minuti.
type Caps = { carousel: boolean; fbStory: boolean; tiktokPhoto: boolean; tiktokDirect: boolean }
let capsCache: { at: number; caps: Caps } | null = null
async function caps(): Promise<Caps> {
  if (capsCache && Date.now() - capsCache.at < 600_000) return capsCache.caps
  const none: Caps = { carousel: false, fbStory: false, tiktokPhoto: false, tiktokDirect: false }
  const c = await fetch(`${URL_}/functions/v1/publish-due-posts?caps=1`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    .then(r => (r.ok ? r.json() : none)).then(j => ({ carousel: !!j.carousel, fbStory: !!j.fbStory, tiktokPhoto: !!j.tiktokPhoto, tiktokDirect: !!j.tiktokDirect })).catch(() => none)
  capsCache = { at: Date.now(), caps: c }
  return c
}

type Row = { id: string; platforms: string[]; media_type: string; format: string; scheduled_at: string; status: string; published_at: string | null; error_message: string | null; retry_count: number | null; next_retry_at: string | null; platform_results: Record<string, { post_id?: string; permalink?: string | null; error?: string } & Record<string, unknown>> | null; created_at: string }
const view = (r: Row) => {
  const net = r.platforms[0]
  const res = r.platform_results?.[net]
  const meta = (r.platform_results?._meta ?? {}) as { carousel?: boolean; count?: number }
  return {
    id: r.id, net, status: r.status, scheduledAt: r.scheduled_at, publishedAt: r.published_at, mediaType: r.media_type, format: r.format,
    carousel: !!meta.carousel, count: meta.count ?? 1,
    link: res?.permalink || null, error: r.status === 'failed' || r.status === 'partial' ? (res?.error || r.error_message || '') : null,
    // ancora dei tentativi automatici in arrivo (publish-due-posts riprova 3 volte)
    retrying: r.status === 'failed' && (r.retry_count ?? 0) < 3 && !!r.next_retry_at,
  }
}

export async function GET(req: NextRequest) {
  const user = await userOf(req)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!socialPublishAllowed(user.email)) return hidden()
  const sp = req.nextUrl.searchParams
  if (sp.get('access')) return NextResponse.json({ ok: true }) // la piattaforma chiede se mostrare la pubblicazione social
  if (sp.get('caps')) return NextResponse.json({ caps: await caps() })
  let q = admin.from('scheduled_posts')
    .select('id, platforms, media_type, format, scheduled_at, status, published_at, error_message, retry_count, next_retry_at, platform_results, created_at')
    .eq('user_id', user.id).neq('status', 'cancelled').order('scheduled_at', { ascending: false }).limit(40)
  const ids = (sp.get('ids') ?? '').split(',').filter(x => /^[0-9a-f-]{36}$/.test(x))
  if (ids.length) q = q.in('id', ids)
  const project = sp.get('project')
  if (project) q = q.filter('platform_results->_meta->>project', 'eq', project)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  return NextResponse.json({ posts: (data as Row[]).map(view) })
}

export async function POST(req: NextRequest) {
  const user = await userOf(req)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!socialPublishAllowed(user.email)) return hidden()
  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  // 1) indirizzi firmati per caricare i file (foto PNG o video) nella cartella dell'utente, validi 2 minuti
  if (body.mode === 'upload') {
    const mimes = Array.isArray(body.mimes) ? body.mimes.slice(0, 10).map(String) : []
    if (!mimes.length || mimes.some(m => !/^(image\/(png|jpeg)|video\/(mp4|webm))$/.test(m))) return NextResponse.json({ error: 'bad_mime' }, { status: 400 })
    const out = []
    for (const m of mimes) {
      const path = `${user.id}/${crypto.randomUUID()}.${m.split('/')[1] === 'jpeg' ? 'jpg' : m.split('/')[1]}`
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
      if (error || !data) return NextResponse.json({ error: 'upload_url_failed' }, { status: 500 })
      out.push({ path, token: data.token })
    }
    return NextResponse.json({ uploads: out })
  }

  // 2) il post in coda: ora (adesso) o programmato
  if (body.mode === 'create') {
    const net = String(body.net) as Net
    if (!NETS.includes(net)) return NextResponse.json({ error: 'bad_net' }, { status: 400 })
    const mediaType = body.mediaType === 'video' ? 'video' : 'image'
    const format = ['feed', 'square', 'story', 'reel'].includes(String(body.format)) ? String(body.format) : 'feed'
    const paths = Array.isArray(body.paths) ? body.paths.map(String).slice(0, 10) : []
    if (!paths.length || paths.some(p => !p.startsWith(`${user.id}/`) || p.includes('..'))) return NextResponse.json({ error: 'bad_paths' }, { status: 400 })
    const carousel = paths.length > 1
    if (carousel && mediaType !== 'image') return NextResponse.json({ error: 'bad_paths' }, { status: 400 })
    const caption = String(body.caption ?? '')
    if (caption.length > 2200) return NextResponse.json({ error: 'caption_too_long' }, { status: 400 })
    const at = body.at ? new Date(String(body.at)) : new Date()
    if (isNaN(at.getTime())) return NextResponse.json({ error: 'bad_date' }, { status: 400 })
    if (body.at && at.getTime() < Date.now() - 60_000) return NextResponse.json({ error: 'date_past' }, { status: 400 })
    if (at.getTime() > Date.now() + 180 * 86_400_000) return NextResponse.json({ error: 'date_far' }, { status: 400 })
    const c = await caps()
    if ((carousel && !c.carousel) || (net === 'facebook' && format === 'story' && !c.fbStory) || (net === 'tiktok' && mediaType === 'image' && !c.tiktokPhoto))
      return NextResponse.json({ error: 'not_supported_yet' }, { status: 409 })
    if (net === 'instagram' && mediaType === 'video' && body.mime === 'video/webm') return NextResponse.json({ error: 'ig_webm' }, { status: 400 })

    const { data: acc } = await admin.from('social_accounts').select('platform, token_expires_at').eq('user_id', user.id).eq('platform', net).maybeSingle()
    if (!acc) return NextResponse.json({ error: 'not_connected' }, { status: 409 })
    // Facebook pubblica col token della Pagina, che non scade; TikTok lo rinnova publish-due-posts (refresh token 365 giorni)
    if (net === 'instagram' && acc.token_expires_at && new Date(acc.token_expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 409 })

    if (net === 'instagram') {
      const d0 = new Date(at); d0.setHours(0, 0, 0, 0)
      const d1 = new Date(at); d1.setHours(23, 59, 59, 999)
      const { count } = await admin.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).contains('platforms', ['instagram'])
        .gte('scheduled_at', d0.toISOString()).lte('scheduled_at', d1.toISOString()).in('status', ['scheduled', 'publishing', 'published'])
      if ((count ?? 0) >= IG_DAILY_LIMIT) return NextResponse.json({ error: 'ig_daily_limit' }, { status: 429 })
    }
    // TikTok Direct Post (07/10/2026): le scelte della schermata "Pubblica su TikTok" (privacy senza valore preimpostato,
    // interazioni, dichiarazione dei contenuti commerciali). Senza: bozza nella casella TikTok come prima.
    let tiktok_options: Record<string, unknown> | null = null
    if (net === 'tiktok' && body.tiktok && typeof body.tiktok === 'object') {
      const t = body.tiktok as Record<string, unknown>
      const privacy = String(t.privacy)
      if (!['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'].includes(privacy)) return NextResponse.json({ error: 'tt_privacy' }, { status: 400 })
      if (t.brandContent === true && privacy === 'SELF_ONLY') return NextResponse.json({ error: 'tt_branded_private' }, { status: 400 })
      if (!c.tiktokDirect) return NextResponse.json({ error: 'not_supported_yet' }, { status: 409 })
      tiktok_options = { direct: true, privacy_level: privacy, allow_comments: t.comment === true, allow_duet: t.duet === true, allow_stitch: t.stitch === true,
        brand_content_toggle: t.brandContent === true, brand_organic_toggle: t.brandOrganic === true }
    }
    const { data: membership } = await admin.from('team_members').select('team_id').eq('user_id', user.id).maybeSingle()
    const project = typeof body.project === 'string' && /^[\w-]{1,64}$/.test(body.project) ? body.project : null
    const { data: row, error } = await admin.from('scheduled_posts').insert({
      user_id: user.id, team_id: membership?.team_id ?? null, platforms: [net], media_url: paths[0], media_type: mediaType, format,
      caption, hashtags: '', first_comment: '', tiktok_options, scheduled_at: at.toISOString(), timezone: String(body.timezone || 'Europe/Rome').slice(0, 64), status: 'scheduled',
      platform_results: { _meta: { project, media_paths: paths, carousel, count: paths.length, source: 'agenteimmo' } },
    }).select('id, platforms, media_type, format, scheduled_at, status, published_at, error_message, retry_count, next_retry_at, platform_results, created_at').single()
    if (error || !row) return NextResponse.json({ error: 'create_failed' }, { status: 500 })
    return NextResponse.json({ post: view(row as Row) })
  }
  return NextResponse.json({ error: 'bad_mode' }, { status: 400 })
}

// annulla un post programmato (o uno andato male, cosi' non riprova da solo) e cancella i suoi file
export async function DELETE(req: NextRequest) {
  const user = await userOf(req)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!socialPublishAllowed(user.email)) return hidden()
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'bad_id' }, { status: 400 })
  const { data, error } = await admin.from('scheduled_posts').update({ status: 'cancelled', error_message: 'Cancelled by user', next_retry_at: null })
    .eq('id', id).eq('user_id', user.id).in('status', ['scheduled', 'failed']).select('media_url, platform_results').maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'not_cancellable' }, { status: 409 })
  const meta = (data.platform_results as { _meta?: { media_paths?: string[] } } | null)?._meta
  const paths = [...new Set([data.media_url, ...(meta?.media_paths ?? [])].filter((p): p is string => !!p && p.startsWith(`${user.id}/`)))]
  if (paths.length) await admin.storage.from(BUCKET).remove(paths)
  return NextResponse.json({ ok: true })
}
