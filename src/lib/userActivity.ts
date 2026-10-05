import { createHash } from 'crypto'
import type Stripe from 'stripe'
import { admin, stripe, eur, selectAll } from '@/lib/bpActuals'
import { listKeys, publicUrl } from '@/lib/r2'

// Cronologia completa di un iscritto per il dashboard /metrics (pagina Agente Immo, riga espansa).
// SOLO LETTURA: auth, ai_usage, platform_credit_events, projects, site_leads, user_brand (service role), Stripe e le cartelle
// dell'utente su R2 (edits, previews, videos, casa3d, uploads, chats). Gli eventi si collegano tra loro per tempo
// (±2-3 minuti) e per nome del file: ogni foto o video porta con se' template, stile, costo AI e crediti scalati.

export type ActCat = 'account' | 'foto' | 'video' | 'casa3d' | 'crediti' | 'pagamento' | 'immobile' | 'richiesta' | 'sito' | 'ai'
export type ActAi = { kind: string; model: string; eur: number; at: string }
export type ActEvent = {
  id: string
  at: string
  cat: ActCat
  title: string
  tags?: string[] // template, stile, stanza, stagione...
  prompt?: string // richiesta scritta dall'agente (chat o dati della Galleria)
  lines?: string[] // dettagli in piu'
  ai?: ActAi[]
  aiEur?: number
  credits?: number // somma dei movimenti collegati (+/-)
  balance?: number | null
  creditReasons?: string[]
  before?: string
  after?: string
  video?: string
  poster?: string
  frames?: { url: string; label: string; video?: boolean }[]
  link?: { href: string; label: string }
  warn?: string
}
export type ActivityResponse = {
  id: string
  email: string
  events: ActEvent[]
  totals: { photos: number; previews: number; videos: number; videosByTemplate: Record<string, number>; casa3d: number; aiEur: number; creditsUsed: number; creditsAdded: number; chats: number }
  missing: string[]
  stripeOk: boolean
  fetchedAt: string
}

const MIN = 60_000
const iso = (t: number) => new Date(t).toISOString()
const ms = (s: string) => Date.parse(s)

// nome del video dal suffisso del file (vedi lib/videoJob, video-reel, landing/demo-video)
const VIDEO_TPL: [string, string][] = [
  ['-prova', 'Video della prova (landing)'], ['-ra', 'Video dell’annuncio'], ['-vs', 'Venduto o Affittato'], ['-kh', 'Volo nel cantiere (orizzontale)'],
  ['-kf', 'Volo nel cantiere'], ['-kc', 'Cantiere'], ['-km', 'Camminata (movimento camera)'], ['-kp', 'Dalla pianta alla stanza'], ['-kd', 'Giro col drone'],
  ['-ks', 'Stagioni'], ['-ka', 'Con te in video'], ['-kw', 'Cammina e cambia stile'], ['-k', 'Giorno e notte'], ['-g', 'Prima e dopo, dall’alto'],
  ['-d', 'Prima e dopo, particelle'], ['-p', 'Prima e dopo, Popup'], ['-f', 'Prima e dopo (stanza gia’ vuota)'],
]
const TPL_OF = new Map(VIDEO_TPL)
// motivo del movimento crediti -> template (per collegare movimento e video)
const REASON_SUFFIX: Record<string, string[]> = {
  video_reel: ['-ra'], video_venduto: ['-vs'], video_cantiere: ['-kc'], video_fpv: ['-kf', '-kh'], video_camera: ['-km'], video_planwalk: ['-kp'],
  video_drone: ['-kd'], video_stagioni: ['-ks'], video_agent: ['-ka'], video_walk: ['-kw'], video_daynight: ['-k'], video_render: ['-p', '-g', '-d', '-f'], video: ['-p', '-g', '-d', '-f'],
}
// tipo di ai_usage -> template del video (per non dare il costo di un video a un altro fatto nello stesso momento)
const KIND_SUFFIX: Record<string, string[]> = { ...REASON_SUFFIX, video_popup: ['-p'], video_gravity: ['-g'], video_particles: ['-d'], video_items: ['-p', '-g', '-d', '-f'] }
const FRAME_LABEL: Record<string, string> = {
  arredata: 'arredata', vuota: 'vuota', finale: 'finale', notte: 'notte', scavo: 'scavo', struttura: 'struttura', quasi: 'quasi finita',
  pianta3d: 'pianta 3D', 'stagione-neve': 'neve', 'stagione-estate': 'estate', 'stagione-primavera': 'primavera',
}
const STYLE_LABEL: Record<string, string> = { modern: 'Moderno', nordic: 'Nordico', industrial: 'Luxury', boho: 'Boho', empty: 'Svuota', day: 'Luminoso', night: 'Notte', planimetria: 'da planimetria' }
const REASON_LABEL: Record<string, string> = {
  benvenuto: 'Crediti di benvenuto', rinnovo_mensile: 'Rinnovo mensile dei crediti', fine_piano: 'Fine del piano', arreda: 'Foto arredata', svuota: 'Stanza svuotata',
  modifica: 'Modifica gratis', modifica_extra: 'Modifica', luminoso: 'Luminoso', riscrivi: 'Testo riscritto', casa3d: 'Casa 3D', video_prep: 'Anteprime del video',
}
const reasonLabel = (r: string) => REASON_LABEL[r] ?? (r.startsWith('piano_') ? `Piano ${r.slice(6)} attivato` : r.startsWith('pacchetto_affiliato') ? 'Bonus affiliato' : r.startsWith('pacchetto_') ? `Pacchetto crediti (${r.split('_')[1]})` : r.startsWith('codice') ? 'Codice promozionale' : r.startsWith('video') ? `Video ${TPL_OF.get(REASON_SUFFIX[r]?.[0] ?? '') ?? r.slice(6)}` : r)
const AI_LABEL: Record<string, string> = {
  classify: 'Lettura della richiesta in chat', lettura_annuncio: 'Lettura annuncio dal portale', analyze: 'Analisi annuncio', analyze_free: 'Analisi gratuita (contatore)',
  landing_demo: 'Prova gratis della landing (foto)', landing_demo_video: 'Prova gratis della landing (video)', landing_demo_photo: 'Foto della prova landing salvata',
  landing_signup: 'Iscrizione arrivata dalla prova', trial_email_1: 'Email della prova inviata (1)', trial_email_3: 'Email della prova inviata (3)',
  planimetria_ritaglio: 'Ritaglio della planimetria', planimetria_vista: 'Lettura della planimetria', video_items: 'Elenco arredi per il video',
}
const PHOTO_TITLE: Record<string, string> = {
  planimetria_foto: 'Foto da un punto della planimetria', planimetria: 'Planimetria rifatta', arreda: 'Foto arredata', svuota: 'Stanza svuotata',
  zona: 'Modifica di una zona', modifica: 'Foto modificata', photo_edit: 'Foto modificata', stile_da_foto: 'Stile da una foto', luminoso: 'Foto luminosa',
}
const aiLabel = (k: string) => AI_LABEL[k] ?? k.replace(/_/g, ' ')
const PHOTO_KINDS = (k: string) => ['arreda', 'svuota', 'modifica', 'photo_edit', 'zona', 'stile_da_foto', 'anteprime_stili', 'staging_plan', 'luminoso'].includes(k) || (k.startsWith('planimetria') && k !== 'planimetria_ritaglio')
const VIDEO_KINDS = (k: string) => k.startsWith('video') || k === 'agente_uscita' || k.startsWith('template_')
const CASA_KINDS = (k: string) => k.startsWith('casa3d') || k === 'planimetria_ritaglio'

// cartella delle chat (stessa formula di api/platform/chats)
const chatDir = (uid: string) => `chats/${createHash('sha256').update(`${uid}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 32)}`
const getJson = async <T,>(key: string): Promise<T | null> => fetch(publicUrl(key), { cache: 'no-store', signal: AbortSignal.timeout(10_000) }).then(r => (r.ok ? r.json() : null)).catch(() => null)
const isUrl = (s: unknown): s is string => typeof s === 'string' && /^https:\/\//.test(s)
const keyOf = (url: string) => { const base = `${process.env.R2_PUBLIC_URL}/`; return url.startsWith(base) ? url.slice(base.length).split('?')[0] : null }

type ChatInfo = { text?: string; tags: string[]; prompt?: string }
type Picks = { label?: string }[]
type ChatMsg = { role?: string; text?: string; out?: string | null; url?: string; job?: string; picks?: Picks; room?: string; look?: string; season?: string; anim?: string; req?: { style?: string; prompt?: string; customPrompt?: string; room?: string }; restyle?: { label?: string }; reel?: { tpl?: string; style?: string; title?: string; contract?: string }; agent?: { kind?: string; video?: string }; casa?: { key?: string } }

// chat salvate (ultime 50, 30 giorni): richiesta scritta e scelte fatte, per chiave del file risultato o nome del video
async function readChats(uid: string): Promise<{ byKey: Map<string, ChatInfo>; count: number }> {
  const byKey = new Map<string, ChatInfo>()
  const dir = chatDir(uid)
  const list = (await getJson<{ id: string }[]>(`${dir}/index.json`)) ?? []
  const chats = await Promise.all(list.slice(0, 50).map(e => getJson<{ msgs?: ChatMsg[] }>(`${dir}/${e.id}.json`)))
  for (const c of chats) {
    let lastText: string | undefined
    for (const m of c?.msgs ?? []) {
      if (m.role === 'user' && m.text?.trim()) { lastText = m.text.trim(); continue }
      const tags: string[] = []
      if (m.role === 'ai' && isUrl(m.out)) {
        const k = keyOf(m.out)
        if (!k) continue
        const style = m.req?.style ? STYLE_LABEL[m.req.style] ?? m.req.style : ''
        if (style) tags.push(style)
        const prompt = m.req?.prompt || m.req?.customPrompt || undefined
        byKey.set(k, { text: m.text || lastText, tags, prompt: prompt || (lastText && lastText !== m.text ? lastText : undefined) })
      } else if (m.role === 'video') {
        for (const p of m.picks ?? []) if (p.label) tags.push(p.label)
        if (m.restyle?.label && !tags.includes(m.restyle.label)) tags.push(m.restyle.label)
        if (m.season) tags.push(m.season)
        const room = m.room || m.agent?.kind
        if (room) tags.push(String(room).replace(/^room:/, ''))
        if (m.reel?.style) tags.push(m.reel.style)
        const info = { text: lastText, tags, prompt: m.reel?.title ? `Titolo: ${m.reel.title}` : undefined }
        // nome del video: nell'url finale o nel job (".../<nome>.<firma>")
        const names = [m.url && keyOf(m.url), m.job].filter(Boolean).join(' ').match(/\d{13}-[a-z0-9]+(?:-[a-z]+)?/g) ?? []
        for (const n of names) byKey.set(`video:${n.replace(/-(?:ra|vs|k[a-z]?|[pgdf])$/, '')}`, info)
      } else if (m.role === 'casa3d' && m.casa?.key) byKey.set(`casa3d:${m.casa.key}`, { text: lastText, tags: [] })
    }
  }
  return { byKey, count: list.length }
}

export async function buildActivity(uid: string): Promise<ActivityResponse | null> {
  const { data: ud } = await admin.auth.admin.getUserById(uid)
  const user = ud.user
  if (!user) return null
  const missing: string[] = []
  // Stripe in parallelo con il resto (e' la parte piu' lenta)
  const stripeP = stripe ? stripeEvents(stripe, user.email ?? '', null).then(ev => ({ ok: true, ev }), e => { console.error('metrics/user stripe', e); return { ok: false, ev: [] as ActEvent[] } }) : null
  type Usage = { id: number; kind: string; provider: string; model: string | null; cost_usd: number; created_at: string; ok: boolean | null }
  type Ev = { id: number; reason: string; delta: number; balance_after: number | null; meta: Record<string, unknown> | null; created_at: string }
  type Project = { id: string; nome: string | null; titolo: string | null; addr: string | null; prezzo: number | null; created_at: string; cover: string | null; thumb: string | null; is_public: boolean | null; import_data: Record<string, unknown> | null }
  type Lead = { id: string; created_at: string; name: string | null; email: string | null; phone: string | null; message: string | null; project_id: string | null }
  const [usage, credits, projects, leads, brand, credRow, keys, chats] = await Promise.all([
    selectAll<Usage>((f, t) => admin.from('ai_usage').select('id, kind, provider, model, cost_usd, created_at, ok').eq('user_id', uid).order('id').range(f, t)),
    selectAll<Ev>((f, t) => admin.from('platform_credit_events').select('id, reason, delta, balance_after, meta, created_at').eq('user_id', uid).order('id').range(f, t)),
    selectAll<Project>((f, t) => admin.from('projects').select('id, nome, titolo, addr, prezzo, created_at, cover, thumb, is_public, import_data').eq('user_id', uid).order('created_at').range(f, t)),
    selectAll<Lead>((f, t) => admin.from('site_leads').select('*').eq('user_id', uid).order('created_at').range(f, t)).catch(() => [] as Lead[]),
    admin.from('user_brand').select('portfolio_slug, site_published, updated_at').eq('user_id', uid).maybeSingle().then(r => r.data as { portfolio_slug: string | null; site_published: boolean | null; updated_at: string | null } | null),
    admin.from('platform_credits').select('plan, balance, stripe_customer_id, stripe_subscription_id, subscription_until').eq('user_id', uid).maybeSingle().then(r => r.data as { plan: string; balance: number; stripe_customer_id: string | null; stripe_subscription_id: string | null; subscription_until: string | null } | null),
    Promise.all(['edits', 'previews', 'videos', 'casa3d', 'uploads'].map(p => listKeys(`${p}/${uid}/`, 5000).then(l => [p, l] as const))),
    readChats(uid).catch(() => ({ byKey: new Map<string, ChatInfo>(), count: 0 })),
  ])
  const R2 = Object.fromEntries(keys) as Record<string, { key: string; at: number }[]>
  const events: ActEvent[] = []

  // --- account ---
  const md = (user.user_metadata ?? {}) as Record<string, unknown>
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider as string].filter(Boolean)
  events.push({
    id: 'signup', at: user.created_at, cat: 'account', title: 'Iscrizione',
    tags: [providers.join(', ') || 'email', ...(typeof md.signup_source === 'string' ? [`da ${md.signup_source}`] : [])],
    lines: [
      typeof md.marketing_consent === 'boolean' ? `Consenso marketing: ${md.marketing_consent ? 'sì' : 'no'}` : '',
      typeof md.terms_accepted_at === 'string' ? `Termini accettati ${new Date(md.terms_accepted_at).toLocaleString('it-IT')}` : '',
    ].filter(Boolean),
  })
  if (user.email_confirmed_at && ms(user.email_confirmed_at) - ms(user.created_at) > 5000) events.push({ id: 'confirm', at: user.email_confirmed_at, cat: 'account', title: 'Email confermata' })
  for (const i of user.identities ?? []) if (i.created_at && ms(i.created_at) - ms(user.created_at) > MIN) events.push({ id: `ident-${i.provider}`, at: i.created_at, cat: 'account', title: `Collegato l’accesso con ${i.provider}` })
  if (user.last_sign_in_at) events.push({ id: 'lastsign', at: user.last_sign_in_at, cat: 'account', title: 'Ultimo accesso', lines: ['Gli accessi precedenti non sono salvati in tabelle leggibili (solo l’ultimo)'] })
  missing.push('Accessi: solo iscrizione e ultimo accesso (lo storico login di Supabase non è leggibile dal server)')

  // --- foto (edits + anteprime) ---
  type Visual = { ev: ActEvent; from: number; to: number; kind: 'foto' | 'anteprima' | 'video' | 'casa3d'; suffix?: string; name?: string }
  const visuals: Visual[] = []
  const edits = R2.edits ?? []
  const editSet = new Set(edits.map(k => k.key))
  const meta = new Map<string, { t?: string; r?: string; f?: string }>()
  for (const { key } of edits) {
    const m = key.match(/^(.+)\.meta\.([\w-]+)$/)
    if (m) try { meta.set(`${m[1]}.jpg`, JSON.parse(Buffer.from(m[2], 'base64url').toString())) } catch { /* nome rovinato */ }
  }
  for (const { key, at } of edits) {
    if (!key.endsWith('.jpg') || key.endsWith('-prima.jpg')) continue
    const stamp = Number(key.match(/\/(\d{13})-[a-z0-9]+(?:-prova)?\.jpg$/)?.[1]) || at
    const d = meta.get(key) ?? {}
    const chat = chats.byKey.get(key)
    const prima = key.replace(/\.jpg$/, '-prima.jpg')
    const casa = key.match(/\/casa-([\w-]+)\//)?.[1]
    const t = (d.t ?? '').trim()
    const styleWords = t.split(' ').filter(w => STYLE_LABEL[w])
    const custom = t && styleWords.length !== t.split(' ').length ? t : ''
    const tags = [...new Set([...(chat?.tags ?? []), ...styleWords.map(w => STYLE_LABEL[w]), ...(d.r ? [d.r] : [])])]
    const prova = /-prova\.jpg$/.test(key)
    visuals.push({
      kind: 'foto', from: stamp - 3 * MIN, to: Math.max(stamp, at) + MIN,
      ev: {
        id: key, at: iso(stamp), cat: 'foto', title: prova ? 'Foto della prova gratis' : d.f ? 'Modifica di una foto già generata' : 'Foto generata', tags,
        prompt: custom || chat?.prompt || (chat?.text && chat.text !== t ? chat.text : undefined),
        before: editSet.has(prima) ? publicUrl(prima) : d.f && editSet.has(d.f) ? publicUrl(d.f) : undefined, after: publicUrl(key),
        lines: [casa ? `Immobile ${casa.slice(0, 8)}` : '', !meta.has(key) && !prova ? 'Senza dati della Galleria (foto creata prima del 30/09)' : ''].filter(Boolean),
      },
    })
  }
  for (const { key, at } of R2.previews ?? []) {
    const stamp = Number(key.match(/\/(\d{13})-/)?.[1]) || at
    visuals.push({ kind: 'anteprima', from: stamp - 3 * MIN, to: stamp + MIN, ev: { id: key, at: iso(stamp), cat: 'foto', title: 'Anteprima di stile per un video', after: publicUrl(key), lines: ['Non va in Galleria: proposta tra cui scegliere prima del video'] } })
  }

  // --- video: file raggruppati per nome (<ms>-<rand>), il risultato e' l'mp4 con il suffisso del template ---
  const groups = new Map<string, { key: string; at: number; suffix: string; ext: string }[]>()
  for (const { key, at } of R2.videos ?? []) {
    const m = key.match(/^videos\/[^/]+\/((?:casa-[\w-]+\/)?(\d{13})-([a-z0-9]+))(.*)\.(mp4|jpg|json)$/)
    if (!m) continue
    const g = groups.get(m[1]) ?? []
    g.push({ key, at, suffix: m[4], ext: m[5] })
    groups.set(m[1], g)
  }
  for (const [name, files] of groups) {
    const stamp = Number(name.match(/(\d{13})-/)?.[1])
    const finals = files.filter(f => f.ext === 'mp4' && TPL_OF.has(f.suffix))
    const rest = files.filter(f => !finals.includes(f) && !f.suffix.endsWith('.job') && !f.suffix.endsWith('.wm'))
    const chat = chats.byKey.get(`video:${name.replace(/^casa-[\w-]+\//, '')}`)
    const frames = (sfx: string) => rest.filter(f => f.ext === 'jpg' && !(f.suffix === `${sfx}-arredata`)).map(f => {
      const lab = f.suffix.replace(/^-(?:[pgdf]|ra|vs)-/, '-').slice(1)
      return { url: publicUrl(f.key), label: FRAME_LABEL[lab] ?? lab }
    })
    const extraVideos = rest.filter(f => f.ext === 'mp4').map(f => ({ url: publicUrl(f.key), label: f.suffix === '-agente' ? 'video caricato dall’agente' : f.suffix === '-walk' ? 'camminata di lavoro' : f.suffix.slice(1), video: true }))
    const casa = name.match(/^casa-([\w-]+)\//)?.[1]
    if (!finals.length) {
      // lavori senza video finale: in corso, falliti o pezzi di lavoro (es. il video dell'agente caricato)
      const end = Math.max(...files.map(f => f.at))
      const onlyUpload = rest.length > 0 && rest.every(f => f.suffix === '-agente' || f.suffix === '-walk')
      visuals.push({
        kind: 'video', from: stamp - 3 * MIN, to: end + MIN, name,
        ev: { id: `vg-${name}`, at: iso(stamp), cat: 'video', title: onlyUpload ? 'Video dell’agente caricato (lavorazione)' : 'Video non completato', tags: chat?.tags, prompt: chat?.text,
          poster: files.find(f => f.suffix.endsWith('arredata'))?.key ? publicUrl(files.find(f => f.suffix.endsWith('arredata'))!.key) : undefined,
          frames: [...frames(''), ...extraVideos], warn: onlyUpload ? undefined : 'Nessun mp4 finale: lavoro fallito, interrotto o ancora in corso' },
      })
      continue
    }
    for (const f of finals) {
      const tpl = TPL_OF.get(f.suffix)!
      const cover = [`videos/${uid}/${name}${f.suffix}-arredata.jpg`, `videos/${uid}/${name}-arredata.jpg`].find(c => files.some(x => x.key === c))
      const seen = new Set<string>([tpl.toLowerCase()])
      const tags = [tpl, ...(chat?.tags ?? []).filter(t => { const l = t.toLowerCase(); if (seen.has(l) || tpl.toLowerCase().includes(l)) return false; seen.add(l); return true })]
      const season = files.find(x => x.suffix.startsWith('-stagione-'))?.suffix.slice(10)
      if (season && !tags.some(t => t.toLowerCase().includes(season))) tags.push(season)
      visuals.push({
        kind: 'video', from: stamp - 3 * MIN, to: f.at + 2 * MIN, suffix: f.suffix, name,
        ev: { id: f.key, at: iso(stamp), cat: 'video', title: tpl.startsWith('Video') ? tpl : `Video ${tpl}`, tags, prompt: chat?.prompt ?? (chat?.text && !/^crea un video$/i.test(chat.text) ? chat.text : undefined),
          video: publicUrl(f.key), poster: cover ? publicUrl(cover) : undefined, frames: [...frames(f.suffix), ...extraVideos],
          lines: [`Pronto ${new Date(f.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} (${Math.max(0, Math.round((f.at - stamp) / 1000))} s)`, casa ? `Immobile ${casa.slice(0, 8)}` : ''].filter(Boolean) },
      })
    }
  }
  // video caricati dall'agente (uploads/): l'originale, prima della conversione
  for (const { key, at } of R2.uploads ?? []) {
    visuals.push({ kind: 'video', from: at - MIN, to: at + MIN, ev: { id: key, at: iso(at), cat: 'video', title: 'Video caricato dall’agente', video: publicUrl(key), tags: ['Con te in video / Cammina'], lines: ['File originale caricato dal telefono'] } })
  }

  // --- Casa 3D: una cartella per casa ---
  const casas = new Map<string, { key: string; at: number }[]>()
  for (const k of R2.casa3d ?? []) { const c = k.key.split('/')[2]; if (c) casas.set(c, [...(casas.get(c) ?? []), k]) }
  for (const [c, files] of casas) {
    const start = Math.min(...files.map(f => f.at)), end = Math.max(...files.map(f => f.at))
    const poster = files.filter(f => /\/poster-[^/]+\.webp$/.test(f.key)).sort((a, b) => b.at - a.at)[0]
    const orig = files.filter(f => /-orig-[^/]+\.jpg$/.test(f.key))
    const cad = files.filter(f => /-cad-[^/]+\.png$/.test(f.key))
    const floors = new Set(files.map(f => f.key.match(/\/f(\d+)-/)?.[1]).filter(Boolean)).size
    const chat = chats.byKey.get(`casa3d:${c}`)
    visuals.push({
      kind: 'casa3d', from: start - 3 * MIN, to: end + 2 * MIN, name: c,
      ev: { id: `c3d-${c}`, at: iso(start), cat: 'casa3d', title: 'Casa 3D dalla planimetria', tags: ['Casa 3D', `${floors || 1} ${floors > 1 ? 'piani' : 'piano'}`], prompt: chat?.text,
        before: orig[0] ? publicUrl(orig[0].key) : undefined, after: poster ? publicUrl(poster.key) : cad[0] ? publicUrl(cad[0].key) : undefined,
        frames: [...cad.map(f => ({ url: publicUrl(f.key), label: 'pianta ridisegnata' })), ...files.filter(f => /-check-/.test(f.key)).map(f => ({ url: publicUrl(f.key), label: 'controllo' }))],
        lines: [`Chiave ${c}`, files.some(f => /\/casa-[^/]+\.json$/.test(f.key)) ? 'Casa costruita' : 'Casa non ancora costruita (solo pianta)'] },
    })
  }

  // --- movimenti crediti: al risultato per job/nome o per tempo, gli altri restano righe a se' ---
  const addCredit = (ev: ActEvent, e: Ev) => {
    ev.credits = (ev.credits ?? 0) + e.delta
    ev.balance = e.balance_after
    ;(ev.creditReasons ??= []).push(`${reasonLabel(e.reason)} ${e.delta > 0 ? '+' : ''}${e.delta}`)
  }
  const orphans: Visual[] = []
  for (const e of credits) {
    const t = ms(e.created_at)
    const job = typeof e.meta?.job === 'string' ? e.meta.job : ''
    let target: Visual | undefined
    if (e.reason === 'casa3d' && job) target = visuals.find(v => v.kind === 'casa3d' && v.name === job)
    else if (e.reason.startsWith('video')) {
      const sfx = REASON_SUFFIX[e.reason]
      // reel e venduto: job = nome del video; gli altri: id del lavoro fal, si collega per tempo e template
      target = (job ? visuals.find(v => v.kind === 'video' && !!v.suffix && !!v.name && job.includes(v.name.replace(/^casa-[\w-]+\//, ''))) : undefined)
        || visuals.filter(v => v.kind === 'video' && v.suffix && (!sfx || sfx.includes(v.suffix)) && t >= v.from && t <= v.to + MIN)
          .sort((a, b) => Math.abs(a.to - t) - Math.abs(b.to - t))[0]
      if (!target && e.reason === 'video_prep') target = visuals.filter(v => v.kind === 'video' && t >= v.from - 5 * MIN && t <= v.to).sort((a, b) => Math.abs(ms(a.ev.at) - t) - Math.abs(ms(b.ev.at) - t))[0]
    } else if (['arreda', 'svuota', 'modifica', 'modifica_extra', 'luminoso'].includes(e.reason)) {
      const kind = e.meta?.preview ? 'anteprima' : 'foto'
      // crediti scalati un attimo prima di salvare il file
      target = visuals.filter(v => v.kind === kind && v.ev.credits === undefined && Math.abs(ms(v.ev.at) - t) <= 90_000).sort((a, b) => Math.abs(ms(a.ev.at) - t) - Math.abs(ms(b.ev.at) - t))[0]
    }
    if (target) { addCredit(target.ev, e); continue }
    const lines = [e.meta?.code ? `Codice ${String(e.meta.code)}` : '', e.meta?.pack_left ? `Crediti dei pacchetti rimasti ${e.meta.pack_left}` : '', job ? `Lavoro ${job.slice(0, 60)}` : ''].filter(Boolean)
    const ev: ActEvent = { id: `cr-${e.id}`, at: e.created_at, cat: 'crediti', title: reasonLabel(e.reason), lines, ...(e.reason.match(/^(arreda|svuota|modifica|video)/) ? { warn: 'Risultato non trovato su R2 (cancellato dalla Galleria o non salvato)' } : {}) }
    addCredit(ev, e)
    // movimento senza file: le chiamate AI dello stesso momento si attaccano qui
    const kind = e.reason.startsWith('video') ? 'video' : e.reason === 'casa3d' ? 'casa3d' : ['arreda', 'svuota', 'modifica', 'modifica_extra'].includes(e.reason) ? 'foto' : null
    if (kind) orphans.push({ kind, from: t - 3 * MIN, to: t + MIN, suffix: REASON_SUFFIX[e.reason]?.[0], ev })
    else events.push(ev)
  }
  visuals.push(...orphans)
  // --- costi AI: ogni chiamata va al risultato piu' vicino del suo tipo, le altre restano righe a se' ---
  const fits = (v: Visual, k: string) => (v.kind === 'video' ? VIDEO_KINDS(k) : v.kind === 'casa3d' ? CASA_KINDS(k) : PHOTO_KINDS(k))
  const looseAi: Usage[] = []
  for (const u of usage) {
    const t = ms(u.created_at)
    const sfx = KIND_SUFFIX[u.kind]
    const all = visuals.filter(v => t >= v.from && t <= v.to && fits(v, u.kind))
    const exact = sfx ? all.filter(v => v.suffix && sfx.includes(v.suffix)) : []
    const cands = exact.length ? exact : all
    const best = cands.sort((a, b) => Math.abs(ms(a.ev.at) - t) - Math.abs(ms(b.ev.at) - t))[0]
    const row = { kind: u.kind, model: u.model ?? u.provider, eur: eur(Number(u.cost_usd) || 0), at: u.created_at }
    if (best) (best.ev.ai ??= []).push(row)
    else looseAi.push(u)
  }

  for (const v of visuals) {
    if (v.ev.ai?.length) v.ev.aiEur = v.ev.ai.reduce((s, a) => s + a.eur, 0)
    // tipo di foto dalla chiamata AI che l'ha fatta
    const pk = v.ev.ai?.map(a => a.kind).find(k => PHOTO_TITLE[k])
    if (v.kind === 'foto' && v.ev.title === 'Foto generata' && pk) v.ev.title = PHOTO_TITLE[pk]
    events.push(v.ev)
  }

  // chiamate AI senza risultato: raggruppate per tipo se vicine (es. 5 letture della chat in 2 minuti)
  const sortedAi = [...looseAi].sort((a, b) => ms(a.created_at) - ms(b.created_at))
  let cur: ActEvent | null = null, curKind = '', curEnd = 0
  for (const u of sortedAi) {
    const t = ms(u.created_at)
    const row = { kind: u.kind, model: u.model ?? u.provider, eur: eur(Number(u.cost_usd) || 0), at: u.created_at }
    if (cur && u.kind === curKind && t - curEnd <= 2 * MIN) { cur.ai!.push(row); cur.aiEur! += row.eur; cur.title = `${aiLabel(u.kind)} ×${cur.ai!.length}`; curEnd = t; continue }
    const counter = u.provider === 'counter' || u.provider === 'counter-fp' || u.provider === 'resend'
    cur = { id: `ai-${u.id}`, at: u.created_at, cat: counter && !u.kind.startsWith('landing_demo') ? 'account' : 'ai', title: aiLabel(u.kind), ai: [row], aiEur: row.eur, ...(u.ok === false ? { warn: 'Chiamata fallita' } : {}) }
    curKind = u.kind; curEnd = t
    events.push(cur)
  }

  // --- immobili ---
  const projName = new Map<string, string>()
  for (const p of projects) {
    const d = p.import_data ?? {}
    const src = typeof d.source === 'string' ? d.source : ''
    const url = typeof d.url === 'string' && /^https?:\/\//.test(d.url) ? d.url : ''
    const photos = Array.isArray(d.photos) ? d.photos.length : 0
    const name = p.titolo || p.nome || p.addr || 'Immobile'
    projName.set(p.id, name)
    events.push({
      id: `p-${p.id}`, at: p.created_at, cat: 'immobile', title: src === 'platform' ? 'Immobile creato a mano' : src === 'csv-link' ? 'Immobile importato da CSV' : src === 'link' ? 'Immobile importato da link' : src === 'portal' ? 'Immobile importato da portale (link)' : 'Immobile creato',
      tags: [src || 'senza fonte', ...(p.is_public ? ['pubblico'] : [])],
      lines: [name, [p.addr && p.addr !== name ? p.addr : '', p.prezzo ? `${p.prezzo.toLocaleString('it-IT')} €` : '', photos ? `${photos} foto` : ''].filter(Boolean).join(' · '), typeof d.score === 'number' || typeof d.score === 'string' ? `Punteggio annuncio ${d.score}` : ''].filter(Boolean),
      after: isUrl(p.cover) ? p.cover : isUrl(p.thumb) ? p.thumb : undefined,
      link: url ? { href: url, label: new URL(url).hostname.replace(/^www\./, '') } : undefined,
    })
  }
  for (const l of leads) {
    events.push({ id: `l-${l.id}`, at: l.created_at, cat: 'richiesta', title: 'Richiesta ricevuta dal sito', lines: [[l.name, l.email, l.phone].filter(Boolean).join(' · '), l.project_id ? `Immobile: ${projName.get(l.project_id) ?? l.project_id.slice(0, 8)}` : 'Richiesta generica'].filter(Boolean), prompt: l.message?.slice(0, 500) || undefined })
  }
  if (brand?.portfolio_slug) {
    events.push({ id: 'site', at: brand.updated_at ?? user.created_at, cat: 'sito', title: brand.site_published ? 'Sito pubblicato' : 'Sito in bozza', tags: [`/${brand.portfolio_slug}`],
      lines: ['Data dell’ultima modifica del sito (la data esatta di pubblicazione non è salvata)'], link: brand.site_published ? { href: `https://agenteimmo.me/${brand.portfolio_slug}`, label: `agenteimmo.me/${brand.portfolio_slug}` } : undefined })
  }

  // --- Stripe: checkout, pagamenti, abbonamenti del cliente (per id cliente salvato o email) ---
  let stripeOk = !!stripe
  if (stripeP) {
    const r = await stripeP
    stripeOk = r.ok
    events.push(...r.ev)
    // cliente salvato ma con email diversa da quella dell'account: si legge anche lui
    const known = new Set(r.ev.map(e => e.id))
    if (r.ok && credRow?.stripe_customer_id && !r.ev.length) events.push(...(await stripeEvents(stripe!, '', credRow.stripe_customer_id).catch(() => [])).filter(e => !known.has(e.id)))
  }

  events.sort((a, b) => b.at.localeCompare(a.at))
  const videoEvs = events.filter(e => e.cat === 'video' && e.video && !e.id.startsWith('uploads/'))
  const byTpl: Record<string, number> = {}
  for (const v of videoEvs) { const t = v.tags?.[0] ?? 'Video'; byTpl[t] = (byTpl[t] ?? 0) + 1 }
  missing.push(
    'Prompt: le richieste scritte restano solo nelle chat salvate (ultime 50, 30 giorni) e nei dati della Galleria (160 caratteri); ai_usage non ha dettagli né prompt',
    'Stile del Video dell’annuncio (Vivace, Elegante...) e titoli: solo se la chat è ancora salvata',
    'Foto e video cancellati dalla Galleria: resta il movimento crediti, non la miniatura',
    'Accessi al sito, visite per giorno e click non sono per evento',
  )
  return {
    id: uid, email: user.email ?? '', events,
    totals: {
      photos: events.filter(e => e.cat === 'foto' && !e.id.startsWith('previews/')).length,
      previews: events.filter(e => e.id.startsWith('previews/')).length,
      videos: videoEvs.length, videosByTemplate: byTpl,
      casa3d: events.filter(e => e.cat === 'casa3d').length,
      aiEur: usage.reduce((s, u) => s + eur(Number(u.cost_usd) || 0), 0),
      creditsUsed: -credits.filter(e => e.delta < 0).reduce((s, e) => s + e.delta, 0),
      creditsAdded: credits.filter(e => e.delta > 0).reduce((s, e) => s + e.delta, 0),
      chats: chats.count,
    },
    missing, stripeOk, fetchedAt: new Date().toISOString(),
  }
}

async function stripeEvents(s: Stripe, email: string, savedCustomer: string | null): Promise<ActEvent[]> {
  const customers = new Set<string>(savedCustomer ? [savedCustomer] : [])
  if (email) for (const c of (await s.customers.list({ email, limit: 10 })).data) customers.add(c.id)
  const sessions = new Map<string, Stripe.Checkout.Session>()
  const charges: Stripe.Charge[] = []
  const subs: Stripe.Subscription[] = []
  const expand = ['data.total_details.breakdown']
  await Promise.all([
    ...(email ? [(async () => { for await (const x of s.checkout.sessions.list({ customer_details: { email }, limit: 100, expand })) sessions.set(x.id, x) })()] : []),
    ...[...customers].flatMap(customer => [
      (async () => { for await (const x of s.checkout.sessions.list({ customer, limit: 100, expand })) sessions.set(x.id, x) })(),
      (async () => { for await (const x of s.charges.list({ customer, limit: 100 })) charges.push(x) })(),
      (async () => { for await (const x of s.subscriptions.list({ customer, status: 'all', limit: 100 })) subs.push(x) })(),
    ]),
  ])
  const promo = new Map<string, string>()
  const money = (n: number | null | undefined, cur?: string | null) => `${((n ?? 0) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${(cur ?? 'eur').toUpperCase() === 'EUR' ? '€' : (cur ?? '').toUpperCase()}`
  const out: ActEvent[] = []
  for (const x of sessions.values()) {
    const codes: string[] = []
    for (const d of x.total_details?.breakdown?.discounts ?? []) {
      const disc = d.discount as unknown as { promotion_code?: string | { id: string; code?: string } | null; source?: { coupon?: string | { id: string; name?: string | null } | null }; coupon?: { id: string; name?: string | null } }
      const pid = typeof disc.promotion_code === 'string' ? disc.promotion_code : disc.promotion_code?.id
      if (pid && !promo.has(pid)) promo.set(pid, (await s.promotionCodes.retrieve(pid).catch(() => null))?.code ?? pid)
      const cp = disc.source?.coupon ?? disc.coupon
      codes.push((pid && promo.get(pid)) || (typeof cp === 'string' ? cp : cp?.name || cp?.id) || 'sconto')
    }
    const done = x.status === 'complete'
    const md = Object.entries(x.metadata ?? {}).filter(([k]) => !/user|uid|email/i.test(k)).map(([k, v]) => `${k}: ${v}`).join(' · ')
    out.push({
      id: x.id, at: iso(x.created * 1000), cat: 'pagamento',
      title: done ? `Checkout completato (${x.mode === 'subscription' ? 'abbonamento' : x.mode === 'payment' ? 'acquisto' : x.mode})` : x.status === 'expired' ? 'Checkout abbandonato (scaduto)' : 'Checkout aperto, non pagato',
      tags: [money(x.amount_total, x.currency), ...codes.map(c => `codice ${c}`)],
      lines: [x.total_details?.amount_discount ? `Sconto ${money(x.total_details.amount_discount, x.currency)} su ${money(x.amount_subtotal, x.currency)}` : '', md].filter(Boolean),
      ...(done ? {} : { warn: 'Non completato' }),
    })
  }
  for (const c of charges) {
    const refunded = c.amount_refunded ? ` (rimborsati ${money(c.amount_refunded, c.currency)})` : ''
    out.push({ id: c.id, at: iso(c.created * 1000), cat: 'pagamento', title: c.status === 'succeeded' ? 'Pagamento riuscito' : c.status === 'failed' ? 'Pagamento fallito' : `Pagamento ${c.status}`, tags: [money(c.amount, c.currency)],
      lines: [c.description ?? '', refunded.trim(), c.failure_message ?? ''].filter(Boolean), link: c.receipt_url ? { href: c.receipt_url, label: 'ricevuta' } : undefined, ...(c.status === 'failed' ? { warn: c.failure_message ?? 'Fallito' } : {}) })
  }
  for (const sub of subs) {
    const items = sub.items.data.map(i => i.price.lookup_key || i.price.nickname || i.price.id).join(', ')
    out.push({ id: sub.id, at: iso(sub.created * 1000), cat: 'pagamento', title: 'Abbonamento creato', tags: [items, sub.status] })
    if (sub.canceled_at) out.push({ id: `${sub.id}-c`, at: iso(sub.canceled_at * 1000), cat: 'pagamento', title: 'Abbonamento disdetto', tags: [items], lines: sub.ended_at ? [`Finito il ${new Date(sub.ended_at * 1000).toLocaleDateString('it-IT')}`] : [] })
    else if (sub.cancel_at_period_end && sub.cancel_at) out.push({ id: `${sub.id}-c`, at: iso((sub.canceled_at ?? sub.created) * 1000), cat: 'pagamento', title: 'Disdetta a fine periodo', tags: [items], lines: [`Finisce il ${new Date(sub.cancel_at * 1000).toLocaleDateString('it-IT')}`] })
  }
  return out
}
