import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { activatePlan, endPlan, extendPaid, grantPack, userForSubscription } from '@/lib/credits'
import { FORFETTARIO_FOOTER as FOOTER } from '@/lib/pricing'

export const runtime = 'nodejs'
// chiave mancante al build (raccolta dati delle pagine su Vercel): non si crea l'errore qui, le chiamate falliscono solo a runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing')

// Fine del periodo pagato: nelle API recenti sta sulla voce dell'abbonamento
const paidUntil = (s: Stripe.Subscription) => new Date(((s as unknown as { current_period_end?: number }).current_period_end ?? s.items.data[0]?.current_period_end ?? 0) * 1000)
// il prezzo decide il piano (dopo un cambio piano i metadati dell'abbonamento restano quelli di prima)
const planOf = (s: Stripe.Subscription): 'starter' | 'plus' | 'pro' => { const p = s.items.data[0]?.price?.metadata?.plan ?? s.metadata?.plan; return p === 'pro' || p === 'plus' ? p : 'starter' }

// Webhook Stripe dei piani di Agente Immo (endpoint separato da quello dell'estensione).
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  let ev: Stripe.Event
  try {
    ev = stripe.webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_PLATFORM_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 })
  }
  try {
    if (ev.type === 'checkout.session.completed') {
      const cs = ev.data.object as Stripe.Checkout.Session
      // pacchetto di crediti extra (pagamento singolo): crediti aggiunti al saldo, una volta sola per sessione
      if (cs.metadata?.app === 'agenteimmo' && cs.mode === 'payment' && cs.metadata.pack && cs.payment_status === 'paid') {
        const userId = cs.metadata.user_id || cs.client_reference_id
        const credits = Number(cs.metadata.credits)
        if (userId && credits > 0) await grantPack(userId, credits, cs.metadata.pack, cs.id)
        return NextResponse.json({ ok: true })
      }
      if (cs.metadata?.app !== 'agenteimmo' || cs.mode !== 'subscription' || !cs.subscription) return NextResponse.json({ ok: true })
      const userId = cs.metadata.user_id || cs.client_reference_id
      if (!userId) return NextResponse.json({ ok: true })
      const sub = await stripe.subscriptions.retrieve(String(cs.subscription))
      const customer = String(cs.customer)
      await activatePlan(userId, { plan: planOf(sub), paidUntil: paidUntil(sub), customer, subscription: sub.id })
      const sdi = cs.custom_fields?.find(f => f.key === 'sdi')?.text?.value ?? ''
      await stripe.customers.update(customer, { invoice_settings: { footer: FOOTER }, metadata: { app: 'agenteimmo', user_id: userId, sdi_pec: sdi.slice(0, 200) } })
    } else if (ev.type === 'invoice.paid') {
      const inv = ev.data.object as Stripe.Invoice
      const subId = (inv as unknown as { subscription?: string }).subscription ?? inv.parent?.subscription_details?.subscription
      if (subId && inv.billing_reason === 'subscription_cycle') {
        const sub = await stripe.subscriptions.retrieve(String(subId))
        if (sub.metadata?.app === 'agenteimmo') await extendPaid(sub.id, paidUntil(sub))
      }
    } else if (ev.type === 'customer.subscription.updated') {
      const sub = ev.data.object as Stripe.Subscription
      if (sub.metadata?.app !== 'agenteimmo') return NextResponse.json({ ok: true })
      if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) await endPlan(sub.id)
      else {
        const userId = await userForSubscription(sub.id)
        await extendPaid(sub.id, paidUntil(sub))
        // cambio piano (Starter <-> Pro): crediti del nuovo piano
        const prev = (ev.data.previous_attributes as { items?: unknown } | undefined)?.items
        if (userId && prev) await activatePlan(userId, { plan: planOf(sub), paidUntil: paidUntil(sub), subscription: sub.id })
      }
    } else if (ev.type === 'customer.subscription.deleted') {
      const sub = ev.data.object as Stripe.Subscription
      if (sub.metadata?.app === 'agenteimmo') await endPlan(sub.id)
    }
  } catch (e) {
    console.error('platform stripe webhook', ev.type, e)
    return NextResponse.json({ error: 'failed' }, { status: 500 }) // Stripe riprova
  }
  return NextResponse.json({ ok: true })
}
