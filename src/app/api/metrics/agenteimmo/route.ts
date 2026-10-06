import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { isMetricsRequest } from '@/lib/metricsAuth'
import {
  admin, stripe, eur, USD_EUR, isAdminEmail, isTestEmail,
  selectAll, selectIn, listAllUsers, listActiveSubscriptions, monthlyEurOfSubscription, computeBpActuals,
} from '@/lib/bpActuals'

// Iscritti alla piattaforma Agente Immo da una data (default: rebrand del 23/09/2026), con costi e dati.
// SOLO LETTURA: auth.users + tabelle della piattaforma (service role) + Stripe (liste filtrate per data, niente N+1).
export const dynamic = 'force-dynamic'

const DEFAULT_SINCE = '2026-09-23'

export type AiKindCost = { kind: string; eur: number; n: number }
export type AgenteImmoUser = {
  id: string
  email: string
  name: string
  agency: string
  createdAt: string
  method: string
  isTest: boolean
  kind: 'agente' | 'privato' // privato = si e' iscritto dall'estensione per cercare casa (account_type private, niente piattaforma)
  isAdmin: boolean
  plan: string
  planActive: boolean
  planUntil: string | null
  paying: boolean
  mrrEur: number
  paidEur: number
  credits: number | null
  aiEur: number
  aiByCategory: Record<string, number>
  aiByKind: AiKindCost[]
  photos: number
  videos: number
  properties: number
  siteSlug: string | null
  sitePublished: boolean
  leads: number
  siteViews: number
  lastActivity: string | null
  lastSignIn: string | null
  lastUse: string | null // ultimo battito sulla piattaforma (platform_sessions, dal 05/10/2026)
  minutes7: number // minuti attivi negli ultimi 7 giorni
  discounts: string[]
  marketingConsent: boolean | null
  welcomeCredits: boolean
}
export type AgenteImmoResponse = {
  since: string
  users: AgenteImmoUser[]
  totals: {
    aiAllEur: number // tutto ai_usage dal [data], anche prove della landing, admin e chiamate senza utente
    chargesEur: number // tutti i pagamenti Stripe riusciti dal [data], al netto dei rimborsi
    chargesUnmatchedEur: number // pagamenti non collegati a nessun iscritto della lista
    landingTrials: number
  }
  mrr: { eur: number; source: 'stripe' | 'listino'; customers: number }
  stripeOk: boolean
  usdEur: number
  fetchedAt: string
}

// categoria del costo AI per tipo (ai_usage.kind)
function category(kind: string): string {
  if (kind.startsWith('video') || kind.startsWith('prova_') || kind.startsWith('template_') || kind === 'agente_uscita') return 'video'
  if (kind.startsWith('planimetria')) return 'planimetria'
  if (['arreda', 'svuota', 'modifica', 'photo_edit', 'zona', 'stile_da_foto', 'anteprime_stili', 'staging_plan'].includes(kind)) return 'foto'
  if (kind.startsWith('landing')) return 'prova landing'
  return 'testi e analisi'
}
const PHOTO_REASONS = new Set(['arreda', 'svuota', 'modifica'])
// video_prep e' il primo passo di un video che poi scala video_render: si conta una volta sola
const isVideoReason = (r: string) => (r === 'video' || r.startsWith('video_')) && r !== 'video_prep'

const max = (a: string | null, b: string | null | undefined) => (!b ? a : !a || b > a ? b : a)

const cache = new Map<string, { at: number; data: AgenteImmoResponse }>()

export async function GET(req: NextRequest) {
  if (!isMetricsRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const raw = req.nextUrl.searchParams.get('since') ?? DEFAULT_SINCE
  const since = /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : DEFAULT_SINCE
  const hit = cache.get(since)
  if (hit && Date.now() - hit.at < 60_000) return NextResponse.json(hit.data)
  try {
    const data = await build(since)
    cache.set(since, { at: Date.now(), data })
    return NextResponse.json(data)
  } catch (e) {
    console.error('metrics/agenteimmo', e)
    return NextResponse.json({ error: 'Errore nel caricamento dei dati' }, { status: 500 })
  }
}

async function build(since: string): Promise<AgenteImmoResponse> {
  const sinceIso = new Date(`${since}T00:00:00Z`).toISOString()
  const sinceUnix = Math.floor(Date.parse(sinceIso) / 1000)
  const now = new Date().toISOString()

  const all = await listAllUsers()
  const signups = all.filter(u => u.created_at >= sinceIso).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const ids = signups.map(u => u.id)
  const idSet = new Set(ids)

  // dati del database, in blocco
  type Credit = { user_id: string; plan: string; balance: number | null; subscription_until: string | null; stripe_subscription_id: string | null; stripe_customer_id: string | null }
  type Usage = { user_id: string | null; kind: string; provider: string; cost_usd: number; created_at: string }
  type Event = { user_id: string; reason: string; delta: number; created_at: string }
  type Project = { id: string; user_id: string }
  type Brand = { user_id: string; portfolio_slug: string | null; site_published: boolean | null; display_name: string | null; company_name: string | null }
  type Lead = { user_id: string }
  type View = { project_id: string; views: number }
  type Sess = { user_id: string; last_seen: string; active_seconds: number }

  const [credits, usageAll, events, projects, brands, leads, bp, platformSessions] = await Promise.all([
    selectIn<Credit>(ids, (c, f, t) => admin.from('platform_credits').select('user_id, plan, balance, subscription_until, stripe_subscription_id, stripe_customer_id').in('user_id', c).range(f, t)),
    selectAll<Usage>((f, t) => admin.from('ai_usage').select('user_id, kind, provider, cost_usd, created_at').gte('created_at', sinceIso).order('id').range(f, t)),
    selectIn<Event>(ids, (c, f, t) => admin.from('platform_credit_events').select('user_id, reason, delta, created_at').in('user_id', c).order('id').range(f, t)),
    selectIn<Project>(ids, (c, f, t) => admin.from('projects').select('id, user_id').in('user_id', c).order('id').range(f, t)),
    selectIn<Brand>(ids, (c, f, t) => admin.from('user_brand').select('user_id, portfolio_slug, site_published, display_name, company_name').in('user_id', c).range(f, t)),
    selectIn<Lead>(ids, (c, f, t) => admin.from('site_leads').select('user_id').in('user_id', c).order('id').range(f, t)),
    computeBpActuals(),
    selectIn<Sess>(ids, (c, f, t) => admin.from('platform_sessions').select('user_id, last_seen, active_seconds').in('user_id', c).order('started_at').range(f, t)).catch(() => [] as Sess[]),
  ])
  const projectOwner = new Map(projects.map(p => [p.id, p.user_id]))
  const views = await selectIn<View>([...projectOwner.keys()], (c, f, t) => admin.from('property_views').select('project_id, views').in('project_id', c).order('day').range(f, t))

  // Stripe: liste filtrate per data, poi mappate per customer o email
  let stripeOk = !!stripe
  const charges: Stripe.Charge[] = []
  const sessions: Stripe.Checkout.Session[] = []
  let activeSubs: Stripe.Subscription[] = []
  const promoNames = new Map<string, string>()
  if (stripe) {
    try {
      const [, , subs] = await Promise.all([
        (async () => { for await (const c of stripe.charges.list({ created: { gte: sinceUnix }, limit: 100 })) charges.push(c) })(),
        (async () => { for await (const s of stripe.checkout.sessions.list({ created: { gte: sinceUnix }, limit: 100, expand: ['data.total_details.breakdown'] })) sessions.push(s) })(),
        listActiveSubscriptions(),
        (async () => { for await (const p of stripe.promotionCodes.list({ limit: 100 })) promoNames.set(p.id, p.code) })(),
      ])
      activeSubs = subs
    } catch (e) {
      console.error('metrics/agenteimmo stripe', e)
      stripeOk = false
    }
  }

  const byEmail = new Map(signups.map(u => [(u.email ?? '').toLowerCase(), u.id]))
  const creditOf = new Map(credits.map(c => [c.user_id, c]))
  const byCustomer = new Map<string, string>()
  for (const c of credits) if (c.stripe_customer_id) byCustomer.set(c.stripe_customer_id, c.user_id)
  const custId = (c: string | { id: string } | null | undefined) => (typeof c === 'string' ? c : c?.id ?? null)
  const ownerOf = (customer: string | null, email: string | null | undefined) =>
    (customer && byCustomer.get(customer)) || (email ? byEmail.get(email.toLowerCase()) : undefined)
  // le sessioni di checkout collegano customer ed email anche per chi non ha ancora stripe_customer_id salvato
  for (const s of sessions) {
    const cu = custId(s.customer), uid = ownerOf(null, s.customer_details?.email)
    if (cu && uid && !byCustomer.has(cu)) byCustomer.set(cu, uid)
  }

  const paid = new Map<string, number>()
  let chargesEur = 0, chargesUnmatchedEur = 0
  for (const c of charges) {
    if (c.status !== 'succeeded') continue
    const amount = (c.amount - (c.amount_refunded ?? 0)) / 100 // ponytail: valute diverse da EUR sommate cosi' come sono
    chargesEur += amount
    const uid = ownerOf(custId(c.customer), c.billing_details?.email ?? c.receipt_email)
    if (uid) paid.set(uid, (paid.get(uid) ?? 0) + amount)
    else chargesUnmatchedEur += amount
  }
  const discounts = new Map<string, Set<string>>()
  for (const s of sessions) {
    const uid = ownerOf(custId(s.customer), s.customer_details?.email)
    if (!uid) continue
    for (const d of s.total_details?.breakdown?.discounts ?? []) {
      // codice promo e coupon: in d.discount.source.coupon (API recenti) o d.discount.coupon (vecchie)
      const disc = d.discount as unknown as { promotion_code?: string | { id: string } | null; source?: { coupon?: string | { id: string; name?: string | null } | null }; coupon?: { id: string; name?: string | null } }
      const promo = custId(disc.promotion_code)
      const cp = disc.source?.coupon ?? disc.coupon
      const label = (promo && promoNames.get(promo)) || (typeof cp === 'string' ? cp : cp?.name || cp?.id) || 'sconto'
      const set = discounts.get(uid) ?? new Set<string>()
      set.add(label)
      discounts.set(uid, set)
    }
  }
  const subMrr = new Map<string, number>()
  const subIds = new Map(credits.filter(c => c.stripe_subscription_id).map(c => [c.stripe_subscription_id!, c.user_id]))
  for (const s of activeSubs) {
    const uid = subIds.get(s.id) ?? ownerOf(custId(s.customer), null)
    if (uid) subMrr.set(uid, (subMrr.get(uid) ?? 0) + monthlyEurOfSubscription(s))
  }

  // aggregati per utente
  const ai = new Map<string, Map<string, { usd: number; n: number }>>()
  let aiAllUsd = 0, landingTrials = 0
  const last = new Map<string, string>()
  for (const u of usageAll) {
    const c = Number(u.cost_usd) || 0
    aiAllUsd += c
    if (u.kind === 'landing_demo' && u.provider === 'counter') landingTrials++ // stesso conteggio di bp-actuals
    if (!u.user_id || !idSet.has(u.user_id)) continue
    const m = ai.get(u.user_id) ?? new Map()
    const k = m.get(u.kind) ?? { usd: 0, n: 0 }
    k.usd += c; k.n++
    m.set(u.kind, k); ai.set(u.user_id, m)
    last.set(u.user_id, max(last.get(u.user_id) ?? null, u.created_at)!)
  }
  const photos = new Map<string, number>(), videos = new Map<string, number>(), welcome = new Set<string>()
  for (const e of events) {
    if (PHOTO_REASONS.has(e.reason)) photos.set(e.user_id, (photos.get(e.user_id) ?? 0) + 1)
    else if (isVideoReason(e.reason) && e.delta < 0) videos.set(e.user_id, (videos.get(e.user_id) ?? 0) + 1)
    if (e.reason === 'benvenuto') welcome.add(e.user_id)
    last.set(e.user_id, max(last.get(e.user_id) ?? null, e.created_at)!)
  }
  const count = <T,>(rows: T[], key: (r: T) => string | undefined, n: (r: T) => number = () => 1) => {
    const m = new Map<string, number>()
    for (const r of rows) { const k = key(r); if (k) m.set(k, (m.get(k) ?? 0) + n(r)) }
    return m
  }
  const propCount = count(projects, p => p.user_id)
  const leadCount = count(leads, l => l.user_id)
  const viewCount = count(views, v => projectOwner.get(v.project_id), v => Number(v.views) || 0)
  const brandOf = new Map(brands.map(b => [b.user_id, b]))
  const lastUse = new Map<string, string>(), secs7 = new Map<string, number>()
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  for (const x of platformSessions) {
    if (!(x.active_seconds > 0)) continue
    lastUse.set(x.user_id, max(lastUse.get(x.user_id) ?? null, x.last_seen)!)
    if (x.last_seen >= weekAgo) secs7.set(x.user_id, (secs7.get(x.user_id) ?? 0) + x.active_seconds)
  }

  const users: AgenteImmoUser[] = signups.map(u => {
    const md = (u.user_metadata ?? {}) as Record<string, unknown>
    const site = (md.vetrina_site ?? {}) as Record<string, unknown>
    const b = brandOf.get(u.id)
    const c = creditOf.get(u.id)
    const plan = c?.plan ?? 'none'
    const planActive = plan !== 'none' && (!c?.subscription_until || c.subscription_until >= now)
    const kinds = ai.get(u.id) ?? new Map<string, { usd: number; n: number }>()
    const aiByKind = [...kinds].map(([kind, v]) => ({ kind, eur: eur(v.usd), n: v.n })).sort((a, b) => b.eur - a.eur)
    const aiByCategory: Record<string, number> = {}
    for (const k of aiByKind) aiByCategory[category(k.kind)] = (aiByCategory[category(k.kind)] ?? 0) + k.eur
    const mrrEur = subMrr.get(u.id) ?? 0
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    const providers = (u.app_metadata?.providers as string[] | undefined) ?? [u.app_metadata?.provider as string].filter(Boolean)
    return {
      id: u.id,
      email: u.email ?? '',
      name: str(md.full_name) || str(md.name) || b?.display_name || '',
      agency: str(site.agencyName) || b?.company_name || '',
      createdAt: u.created_at,
      method: providers.join(', ') || 'email',
      isTest: isTestEmail(u.email),
      kind: md.account_type === 'private' && !c ? 'privato' as const : 'agente' as const,
      isAdmin: isAdminEmail(u.email),
      plan,
      planActive,
      planUntil: c?.subscription_until ?? null,
      paying: planActive && (!!c?.stripe_subscription_id || mrrEur > 0),
      mrrEur,
      paidEur: paid.get(u.id) ?? 0,
      credits: c?.balance ?? null,
      aiEur: aiByKind.reduce((s, k) => s + k.eur, 0),
      aiByCategory,
      aiByKind,
      photos: photos.get(u.id) ?? 0,
      videos: videos.get(u.id) ?? 0,
      properties: propCount.get(u.id) ?? 0,
      siteSlug: b?.portfolio_slug ?? null,
      sitePublished: !!b?.site_published,
      leads: leadCount.get(u.id) ?? 0,
      siteViews: viewCount.get(u.id) ?? 0,
      lastActivity: max(max(last.get(u.id) ?? null, u.last_sign_in_at), lastUse.get(u.id)),
      lastSignIn: u.last_sign_in_at ?? null,
      lastUse: lastUse.get(u.id) ?? null,
      minutes7: Math.round((secs7.get(u.id) ?? 0) / 60),
      discounts: [...(discounts.get(u.id) ?? [])],
      marketingConsent: typeof md.marketing_consent === 'boolean' ? md.marketing_consent : null,
      welcomeCredits: welcome.has(u.id),
    }
  })

  return {
    since,
    users,
    totals: { aiAllEur: eur(aiAllUsd), chargesEur, chargesUnmatchedEur, landingTrials },
    mrr: { eur: bp.mrr, source: bp.mrrSource, customers: bp.customers },
    stripeOk,
    usdEur: USD_EUR,
    fetchedAt: new Date().toISOString(),
  }
}
