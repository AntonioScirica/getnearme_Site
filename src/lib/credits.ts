// Crediti della piattaforma (tabelle platform_credits / platform_credit_events, scritte solo dal server).
// Il saldo si ricarica ogni mese finche' l'abbonamento e' pagato (anche il Pro annuale): ricarica "pigra" alla lettura.
import { createClient } from '@supabase/supabase-js'
import { CREDIT_COST } from '@/lib/pricing'
import { isPlatformAdmin } from '@/lib/platformAdmins'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export type Action = keyof typeof CREDIT_COST
export const PLAN_CREDITS: Record<string, number> = { starter: 600, plus: 1500, pro: 2500 }

export type Credits = { plan: 'none' | 'starter' | 'plus' | 'pro'; balance: number; monthly: number; renews: string | null; until: string | null; unlimited?: boolean }

// Account admin (i nostri): crediti illimitati, niente scalare
// (tranne l'account di test, che scala crediti veri per provare saldo e costi come un cliente)
const METERED = ['a@gmail.com']
const adminCache = new Map<string, boolean>()
async function unlimited(userId: string): Promise<boolean> {
  if (!adminCache.has(userId)) { const email = (await admin.auth.admin.getUserById(userId)).data.user?.email; adminCache.set(userId, isPlatformAdmin(email) && !METERED.includes(email ?? '')) }
  return adminCache.get(userId)!
}

const monthAfter = (d: Date) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n }

// Crediti dei pacchetti ancora da usare (non scadono: al rinnovo e a fine piano restano, i crediti del mese no).
// Niente colonna nuova: pacchetti comprati dopo l'ultimo rinnovo/cambio piano + quelli rimasti a quel momento (meta.pack_left
// dell'evento). Si consumano prima i crediti del mese, quindi dei pacchetti resta al massimo il saldo attuale.
async function packLeft(userId: string, balance: number): Promise<number> {
  const { data: last } = await admin.from('platform_credit_events').select('created_at, meta').eq('user_id', userId)
    .or('reason.eq.rinnovo_mensile,reason.like.piano_%,reason.eq.fine_piano').order('created_at', { ascending: false }).limit(1).maybeSingle()
  const base = Number((last?.meta as { pack_left?: number } | null)?.pack_left ?? 0) || 0
  let q = admin.from('platform_credit_events').select('delta').eq('user_id', userId).like('reason', 'pacchetto_%')
  if (last?.created_at) q = q.gt('created_at', last.created_at)
  const { data: packs } = await q
  const bought = (packs ?? []).reduce((a, r) => a + (Number(r.delta) || 0), 0)
  return Math.max(0, Math.min(balance, base + bought))
}

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
    const pack = await packLeft(userId, data.balance) // i crediti dei pacchetti passano al mese nuovo, quelli del mese no
    const fresh = data.monthly_credits + pack
    const { data: upd } = await admin.from('platform_credits').update({ balance: fresh, period_end: next.toISOString(), updated_at: now.toISOString() })
      .eq('user_id', userId).eq('period_end', data.period_end).select('balance').maybeSingle() // eq period_end: una sola ricarica anche con richieste in parallelo
    if (upd) {
      await admin.from('platform_credit_events').insert({ user_id: userId, delta: fresh - data.balance, reason: 'rinnovo_mensile', balance_after: fresh, meta: { pack_left: pack } } as never)
      return { plan: data.plan, balance: fresh, monthly: data.monthly_credits, renews: next.toISOString(), until: data.subscription_until }
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

// azione gratis ma da contare (le 3 modifiche gratis per foto): riga a 0 crediti nello storico
export async function noteFree(userId: string, reason: Action, meta: Record<string, unknown>) {
  const { error } = await admin.from('platform_credit_events').insert({ user_id: userId, delta: 0, reason, meta, balance_after: (await getCredits(userId)).balance } as never)
  if (error) console.error('note free', error)
}
// quante modifiche (gratis o a 1 credito) sono gia' state fatte sulla stessa foto di partenza
export async function editsOn(userId: string, root: string): Promise<number> {
  const { count } = await admin.from('platform_credit_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('reason', ['modifica', 'modifica_extra']).eq('meta->>root', root)
  return count ?? 0
}

export async function grant(userId: string, amount: number, reason: string, meta?: Record<string, unknown>): Promise<number> {
  const { data, error } = await admin.rpc('grant_platform_credits', { p_user: userId, p_amount: amount, p_reason: reason, p_meta: meta ?? null })
  if (error) console.error('grant credits', error)
  return typeof data === 'number' ? data : -1
}

// Pacchetto di crediti comprato (webhook Stripe): si aggiunge al saldo. Idempotente per sessione di pagamento (Stripe riprova).
export async function grantPack(userId: string, credits: number, pack: string, session: string): Promise<number> {
  const reason = `pacchetto_${pack}_${session.slice(-12)}`
  const { count } = await admin.from('platform_credit_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('reason', reason)
  if (count) return (await getCredits(userId)).balance
  return grant(userId, credits, reason, { pack, session })
}

// Abbonamento attivato o rinnovato (webhook Stripe): piano, crediti del mese pieni, scadenze.
export async function activatePlan(userId: string, o: { plan: 'starter' | 'plus' | 'pro'; paidUntil: Date; customer?: string; subscription?: string }) {
  const monthly = PLAN_CREDITS[o.plan]
  const periodEnd = monthAfter(new Date())
  // cambio o nuovo piano: crediti del mese nuovi, i pacchetti restano
  const { data: cur } = await admin.from('platform_credits').select('balance').eq('user_id', userId).maybeSingle()
  const pack = cur ? await packLeft(userId, cur.balance ?? 0) : 0
  await admin.from('platform_credits').upsert({
    user_id: userId, plan: o.plan, monthly_credits: monthly, balance: monthly + pack, period_end: periodEnd.toISOString(), subscription_until: o.paidUntil.toISOString(),
    ...(o.customer ? { stripe_customer_id: o.customer } : {}), ...(o.subscription ? { stripe_subscription_id: o.subscription } : {}), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  await admin.from('platform_credit_events').insert({ user_id: userId, delta: monthly + pack - (cur?.balance ?? 0), reason: `piano_${o.plan}`, balance_after: monthly + pack, meta: { pack_left: pack } } as never)
}

export async function extendPaid(subscription: string, paidUntil: Date) {
  await admin.from('platform_credits').update({ subscription_until: paidUntil.toISOString(), updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription)
}

// fine abbonamento: via i crediti del mese, restano quelli dei pacchetti
export async function endPlan(subscription: string) {
  const { data: cur } = await admin.from('platform_credits').select('user_id, balance').eq('stripe_subscription_id', subscription).maybeSingle()
  if (!cur) return
  const pack = await packLeft(cur.user_id, cur.balance ?? 0)
  await admin.from('platform_credits').update({ plan: 'none', monthly_credits: 0, balance: pack, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription)
  await admin.from('platform_credit_events').insert({ user_id: cur.user_id, delta: pack - (cur.balance ?? 0), reason: 'fine_piano', balance_after: pack, meta: { pack_left: pack } } as never)
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
