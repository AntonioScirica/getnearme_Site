// Crediti della piattaforma (tabelle platform_credits / platform_credit_events, scritte solo dal server).
// Il saldo si ricarica ogni mese finche' l'abbonamento e' pagato (anche il Pro annuale): ricarica "pigra" alla lettura.
import { createClient } from '@supabase/supabase-js'
import { CREDIT_COST } from '@/lib/pricing'
import { isPlatformAdmin } from '@/lib/platformAdmins'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export type Action = keyof typeof CREDIT_COST
export const PLAN_CREDITS: Record<string, number> = { starter: 1000, pro: 2500 }

export type Credits = { plan: 'none' | 'starter' | 'pro'; balance: number; monthly: number; renews: string | null; until: string | null; unlimited?: boolean }

// Account admin (i nostri): crediti illimitati, niente scalare
const adminCache = new Map<string, boolean>()
async function unlimited(userId: string): Promise<boolean> {
  if (!adminCache.has(userId)) adminCache.set(userId, isPlatformAdmin((await admin.auth.admin.getUserById(userId)).data.user?.email))
  return adminCache.get(userId)!
}

const monthAfter = (d: Date) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n }

export async function getCredits(userId: string): Promise<Credits> {
  if (await unlimited(userId)) return { plan: 'pro', balance: 999999, monthly: 0, renews: null, until: null, unlimited: true }
  const { data } = await admin.from('platform_credits').select('plan, balance, monthly_credits, period_end, subscription_until').eq('user_id', userId).maybeSingle()
  if (!data) return { plan: 'none', balance: 0, monthly: 0, renews: null, until: null }
  const now = new Date()
  const until = data.subscription_until ? new Date(data.subscription_until) : null
  // nuovo mese di crediti: il saldo torna ai crediti del piano (non si accumulano), solo se l'abbonamento e' ancora pagato
  if (data.plan !== 'none' && data.period_end && new Date(data.period_end) <= now && until && until > now) {
    let next = new Date(data.period_end)
    while (next <= now) next = monthAfter(next)
    const { data: upd } = await admin.from('platform_credits').update({ balance: data.monthly_credits, period_end: next.toISOString(), updated_at: now.toISOString() })
      .eq('user_id', userId).eq('period_end', data.period_end).select('balance').maybeSingle() // eq period_end: una sola ricarica anche con richieste in parallelo
    if (upd) {
      await admin.from('platform_credit_events').insert({ user_id: userId, delta: data.monthly_credits - data.balance, reason: 'rinnovo_mensile', balance_after: data.monthly_credits })
      return { plan: data.plan, balance: data.monthly_credits, monthly: data.monthly_credits, renews: next.toISOString(), until: data.subscription_until }
    }
  }
  return { plan: data.plan, balance: data.balance, monthly: data.monthly_credits, renews: data.period_end, until: data.subscription_until }
}

// true se ha i crediti per l'azione (senza scalarli)
export async function canAfford(userId: string, action: Action): Promise<boolean> {
  return (await getCredits(userId)).balance >= CREDIT_COST[action]
}

// Scala i crediti a lavoro riuscito. Ritorna il saldo nuovo (-1 se non bastavano: il lavoro e' gia' fatto, si consegna comunque).
export async function spend(userId: string, action: Action, meta?: Record<string, unknown>, times = 1): Promise<number> {
  const amount = CREDIT_COST[action] * times
  if (!amount || await unlimited(userId)) return (await getCredits(userId)).balance
  const { data, error } = await admin.rpc('spend_platform_credits', { p_user: userId, p_amount: amount, p_reason: action, p_meta: meta ?? null })
  if (error) console.error('spend credits', error)
  return typeof data === 'number' ? data : -1
}

export async function grant(userId: string, amount: number, reason: string, meta?: Record<string, unknown>): Promise<number> {
  const { data, error } = await admin.rpc('grant_platform_credits', { p_user: userId, p_amount: amount, p_reason: reason, p_meta: meta ?? null })
  if (error) console.error('grant credits', error)
  return typeof data === 'number' ? data : -1
}

// Abbonamento attivato o rinnovato (webhook Stripe): piano, crediti del mese pieni, scadenze.
export async function activatePlan(userId: string, o: { plan: 'starter' | 'pro'; paidUntil: Date; customer?: string; subscription?: string }) {
  const monthly = PLAN_CREDITS[o.plan]
  const periodEnd = monthAfter(new Date())
  await admin.from('platform_credits').upsert({
    user_id: userId, plan: o.plan, monthly_credits: monthly, balance: monthly, period_end: periodEnd.toISOString(), subscription_until: o.paidUntil.toISOString(),
    ...(o.customer ? { stripe_customer_id: o.customer } : {}), ...(o.subscription ? { stripe_subscription_id: o.subscription } : {}), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  await admin.from('platform_credit_events').insert({ user_id: userId, delta: monthly, reason: `piano_${o.plan}`, balance_after: monthly })
}

export async function extendPaid(subscription: string, paidUntil: Date) {
  await admin.from('platform_credits').update({ subscription_until: paidUntil.toISOString(), updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription)
}

export async function endPlan(subscription: string) {
  await admin.from('platform_credits').update({ plan: 'none', monthly_credits: 0, balance: 0, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription)
}

export async function userForSubscription(subscription: string): Promise<string | null> {
  const { data } = await admin.from('platform_credits').select('user_id').eq('stripe_subscription_id', subscription).maybeSingle()
  return data?.user_id ?? null
}

// Scala una volta sola per lo stesso lavoro (es. il video: la consegna puo' essere richiesta piu' volte).
export async function spendOnce(userId: string, action: Action, job: string): Promise<number> {
  const { count } = await admin.from('platform_credit_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('reason', action).eq('meta->>job', job)
  if (count) return (await getCredits(userId)).balance
  return spend(userId, action, { job })
}
