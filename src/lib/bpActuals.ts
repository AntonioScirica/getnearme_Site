import Stripe from 'stripe'
import { createClient, type User } from '@supabase/supabase-js'
import { PLATFORM_ADMIN_EMAILS } from '@/lib/platformAdmins'

// Dati reali condivisi tra il business plan (bp-actuals) e la pagina "Agente Immo" del dashboard /metrics.
// Solo letture con service role.
export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
export const USD_EUR = 0.92
export const TEST_DOMAIN = '@agenteimmo-test.local'
export const PRICE_EUR: Record<string, number> = { starter: 19, plus: 49, pro: 59 } // stima se Stripe non risponde (Pro come annuale)
export const eur = (usd: number) => usd * USD_EUR

export type Plan = 'starter' | 'plus' | 'pro'

export const isAdminEmail = (e?: string | null) => !!e && PLATFORM_ADMIN_EMAILS.includes(e)
export const isTestEmail = (e?: string | null) => !!e && e.endsWith(TEST_DOMAIN)
/** account da escludere dai numeri: admin della piattaforma e account di test */
export const isHiddenEmail = (e?: string | null) => isAdminEmail(e) || isTestEmail(e)

// PostgREST restituisce al massimo 1000 righe per richiesta: si pagina con range()
type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>
export async function selectAll<T>(page: (from: number, to: number) => Page<T>, size = 1000): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < size) return out
  }
}

/** stessa query a blocchi di id (in() con liste lunghe supera la lunghezza dell'URL) */
export async function selectIn<T>(ids: string[], page: (chunk: string[], from: number, to: number) => Page<T>, chunk = 150): Promise<T[]> {
  const parts: Promise<T[]>[] = []
  for (let i = 0; i < ids.length; i += chunk) {
    const c = ids.slice(i, i + chunk)
    parts.push(selectAll<T>((from, to) => page(c, from, to)))
  }
  return (await Promise.all(parts)).flat()
}

// tutti gli utenti auth, paginati; cache breve per non rifare la lista a ogni richiesta
let usersCache: { at: number; users: User[] } | null = null
export async function listAllUsers(): Promise<User[]> {
  if (usersCache && Date.now() - usersCache.at < 60_000) return usersCache.users
  const users: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    users.push(...data.users)
    if (data.users.length < 1000) break
  }
  usersCache = { at: Date.now(), users }
  return users
}

/** canone mensile in euro di un abbonamento Stripe (solo prezzi ai_*: annuale /12, trimestrale /3) */
export function monthlyEurOfSubscription(sub: Stripe.Subscription): number {
  let total = 0
  for (const it of sub.items.data) {
    const p = it.price
    if (!p.lookup_key?.startsWith('ai_') || !p.unit_amount || !p.recurring) continue
    const months = p.recurring.interval === 'year' ? 12 * p.recurring.interval_count : p.recurring.interval === 'month' ? p.recurring.interval_count : 1
    total += (p.unit_amount / 100) * (it.quantity ?? 1) / months
  }
  return total
}

/** abbonamenti Stripe attivi (anche in prova) */
export async function listActiveSubscriptions(): Promise<Stripe.Subscription[]> {
  if (!stripe) return []
  const out: Stripe.Subscription[] = []
  for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) out.push(sub)
  return out
}

export type BpActuals = {
  customers: number
  byPlan: Record<Plan, number>
  mrr: number
  mrrSource: 'stripe' | 'listino'
  ai30: { totalEur: number; payingEur: number; trialsEur: number; perCustomerEur: number | null }
  trials30: number
  trialCostEur: number | null
  usdEur: number
  fetchedAt: string
}

// clienti paganti per piano (platform_credits), MRR (abbonamenti Stripe attivi con lookup key ai_*),
// costo AI degli ultimi 30 giorni (ai_usage.cost_usd, in dollari) e prove gratis dalla landing.
let bpCache: { at: number; data: BpActuals } | null = null
export async function computeBpActuals(): Promise<BpActuals> {
  if (bpCache && Date.now() - bpCache.at < 60_000) return bpCache.data
  const now = new Date()
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  // clienti con un piano attivo pagato su Stripe (esclusi admin e account di prova)
  const { data: credits } = await admin.from('platform_credits')
    .select('user_id, plan, subscription_until, stripe_subscription_id')
    .in('plan', ['starter', 'plus', 'pro']).gte('subscription_until', now.toISOString()).not('stripe_subscription_id', 'is', null)
  const rows = (credits ?? []) as { user_id: string; plan: Plan; stripe_subscription_id: string }[]
  const emails = new Map((await listAllUsers()).map(u => [u.id, u.email ?? '']))
  const paying = rows.filter(r => !isHiddenEmail(emails.get(r.user_id)))
  const byPlan: Record<Plan, number> = { starter: 0, plus: 0, pro: 0 }
  for (const r of paying) byPlan[r.plan]++

  // MRR dagli abbonamenti Stripe; se Stripe non risponde, stima dai prezzi di listino
  let mrr = paying.reduce((s, r) => s + PRICE_EUR[r.plan], 0)
  let mrrSource: 'stripe' | 'listino' = 'listino'
  if (stripe && paying.length) {
    try {
      const ids = new Set(paying.map(r => r.stripe_subscription_id))
      mrr = (await listActiveSubscriptions()).filter(s => ids.has(s.id)).reduce((s, sub) => s + monthlyEurOfSubscription(sub), 0)
      mrrSource = 'stripe'
    } catch { /* resta la stima di listino */ }
  }

  // costo AI degli ultimi 30 giorni: totale, dei clienti paganti, delle prove gratis
  const usage = await selectAll<{ user_id: string | null; kind: string; provider: string; cost_usd: number }>((from, to) =>
    admin.from('ai_usage').select('user_id, kind, provider, cost_usd').gte('created_at', since).order('id').range(from, to))
  const payingIds = new Set(paying.map(r => r.user_id))
  let aiTotalUsd = 0, aiPayingUsd = 0, aiTrialsUsd = 0, trials = 0
  for (const u of usage) {
    const c = Number(u.cost_usd) || 0
    aiTotalUsd += c
    if (u.kind.startsWith('landing_demo')) aiTrialsUsd += c
    else if (u.user_id && payingIds.has(u.user_id)) aiPayingUsd += c
    if (u.kind === 'landing_demo' && u.provider === 'counter') trials++
  }

  const data: BpActuals = {
    customers: paying.length, byPlan, mrr, mrrSource,
    ai30: { totalEur: eur(aiTotalUsd), payingEur: eur(aiPayingUsd), trialsEur: eur(aiTrialsUsd), perCustomerEur: paying.length ? eur(aiPayingUsd) / paying.length : null },
    trials30: trials, trialCostEur: trials ? eur(aiTrialsUsd) / trials : null,
    usdEur: USD_EUR, fetchedAt: now.toISOString(),
  }
  bpCache = { at: Date.now(), data }
  return data
}
