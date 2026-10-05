import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { isPlatformAdmin, PLATFORM_ADMIN_EMAILS } from '@/lib/platformAdmins'

// Dati reali per il business plan dinamico (#/business-plan), solo admin e SOLO LETTURA:
// clienti paganti per piano (platform_credits), MRR (abbonamenti Stripe attivi con lookup key ai_*),
// costo AI degli ultimi 30 giorni (ai_usage.cost_usd, in dollari) e prove gratis dalla landing.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const USD_EUR = 0.92
const PRICE_EUR: Record<string, number> = { starter: 19, plus: 49, pro: 59 } // stima se Stripe non risponde (Pro come annuale)
const TEST_DOMAIN = '@agenteimmo-test.local'

type Plan = 'starter' | 'plus' | 'pro'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: me } = await admin.auth.getUser(token)
  if (!isPlatformAdmin(me.user?.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const now = new Date()
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  // clienti con un piano attivo pagato su Stripe (esclusi admin e account di prova)
  const { data: credits } = await admin.from('platform_credits')
    .select('user_id, plan, subscription_until, stripe_subscription_id')
    .in('plan', ['starter', 'plus', 'pro']).gte('subscription_until', now.toISOString()).not('stripe_subscription_id', 'is', null)
  const rows = (credits ?? []) as { user_id: string; plan: Plan; stripe_subscription_id: string }[]
  const emails = new Map<string, string>()
  await Promise.all(rows.slice(0, 500).map(async r => {
    const { data } = await admin.auth.admin.getUserById(r.user_id)
    if (data?.user?.email) emails.set(r.user_id, data.user.email)
  }))
  const paying = rows.filter(r => { const e = emails.get(r.user_id) ?? ''; return !PLATFORM_ADMIN_EMAILS.includes(e) && !e.endsWith(TEST_DOMAIN) })
  const byPlan: Record<Plan, number> = { starter: 0, plus: 0, pro: 0 }
  for (const r of paying) byPlan[r.plan]++

  // MRR dagli abbonamenti Stripe (annuale /12, trimestrale /3); se Stripe non risponde, stima dai prezzi di listino
  let mrr = paying.reduce((s, r) => s + PRICE_EUR[r.plan], 0)
  let mrrSource: 'stripe' | 'listino' = 'listino'
  if (stripe && paying.length) {
    try {
      const ids = new Set(paying.map(r => r.stripe_subscription_id))
      let total = 0
      for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
        if (!ids.has(sub.id)) continue
        for (const it of sub.items.data) {
          const p = it.price
          if (!p.lookup_key?.startsWith('ai_') || !p.unit_amount || !p.recurring) continue
          const months = p.recurring.interval === 'year' ? 12 * p.recurring.interval_count : p.recurring.interval === 'month' ? p.recurring.interval_count : 1
          total += (p.unit_amount / 100) * (it.quantity ?? 1) / months
        }
      }
      mrr = total
      mrrSource = 'stripe'
    } catch { /* resta la stima di listino */ }
  }

  // costo AI degli ultimi 30 giorni: totale, dei clienti paganti, delle prove gratis
  const { data: usage } = await admin.from('ai_usage').select('user_id, kind, provider, cost_usd').gte('created_at', since).limit(50000)
  const payingIds = new Set(paying.map(r => r.user_id))
  let aiTotalUsd = 0, aiPayingUsd = 0, aiTrialsUsd = 0, trials = 0
  for (const u of (usage ?? []) as { user_id: string | null; kind: string; provider: string; cost_usd: number }[]) {
    const c = Number(u.cost_usd) || 0
    aiTotalUsd += c
    if (u.kind.startsWith('landing_demo')) aiTrialsUsd += c
    else if (u.user_id && payingIds.has(u.user_id)) aiPayingUsd += c
    if (u.kind === 'landing_demo' && u.provider === 'counter') trials++
  }

  const eur = (usd: number) => usd * USD_EUR
  return NextResponse.json({
    customers: paying.length, byPlan, mrr, mrrSource,
    ai30: { totalEur: eur(aiTotalUsd), payingEur: eur(aiPayingUsd), trialsEur: eur(aiTrialsUsd), perCustomerEur: paying.length ? eur(aiPayingUsd) / paying.length : null },
    trials30: trials, trialCostEur: trials ? eur(aiTrialsUsd) / trials : null,
    usdEur: USD_EUR, fetchedAt: now.toISOString(),
  })
}
