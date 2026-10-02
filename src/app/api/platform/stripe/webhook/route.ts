import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { activatePlan, endPlan, extendPaid, grantPack, userForSubscription } from '@/lib/credits'
import { FORFETTARIO_FOOTER as FOOTER } from '@/lib/pricing'
import { capiPurchase } from '@/lib/metaCapi'
import { sendPlatformEmail } from '@/lib/platformEmails'

export const runtime = 'nodejs'
// chiave mancante al build (raccolta dati delle pagine su Vercel): non si crea l'errore qui, le chiamate falliscono solo a runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing')

// Fine del periodo pagato: nelle API recenti sta sulla voce dell'abbonamento
const paidUntil = (s: Stripe.Subscription) => new Date(((s as unknown as { current_period_end?: number }).current_period_end ?? s.items.data[0]?.current_period_end ?? 0) * 1000)
// il prezzo decide il piano (dopo un cambio piano i metadati dell'abbonamento restano quelli di prima)
const planOf = (s: Stripe.Subscription): 'starter' | 'plus' | 'pro' => { const p = s.items.data[0]?.price?.metadata?.plan ?? s.metadata?.plan; return p === 'pro' || p === 'plus' ? p : 'starter' }

// Webhook Stripe dei piani di Agente Immo (endpoint separato da quello dell'estensione). Manda anche le email degli
// acquisti (lib/platformEmails). ponytail: se Stripe riprova un evento gia' riuscito a meta', l'email puo' partire due volte (raro).
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
        if (userId && credits > 0) { await grantPack(userId, credits, cs.metadata.pack, cs.id); await sendPlatformEmail(userId, { kind: 'pack', credits }); await capiPurchase(cs) }
        return NextResponse.json({ ok: true })
      }
      if (cs.metadata?.app !== 'agenteimmo' || cs.mode !== 'subscription' || !cs.subscription) return NextResponse.json({ ok: true })
      const userId = cs.metadata.user_id || cs.client_reference_id
      if (!userId) return NextResponse.json({ ok: true })
      const sub = await stripe.subscriptions.retrieve(String(cs.subscription))
      const customer = String(cs.customer)
      await activatePlan(userId, { plan: planOf(sub), paidUntil: paidUntil(sub), customer, subscription: sub.id })
      await sendPlatformEmail(userId, { kind: 'plan_started', plan: planOf(sub) })
      await capiPurchase(cs)
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
        const prevAttr = ev.data.previous_attributes as { items?: unknown; cancel_at_period_end?: boolean; cancel_at?: number | null } | undefined
        if (userId && prevAttr?.items) {
          await activatePlan(userId, { plan: planOf(sub), paidUntil: paidUntil(sub), subscription: sub.id })
          await sendPlatformEmail(userId, { kind: 'plan_changed', plan: planOf(sub) })
        }
        // disdetta programmata (dal portale: a fine periodo): email con la data di scadenza
        const cancelNow = sub.cancel_at_period_end || !!sub.cancel_at
        const cancelBefore = prevAttr && ('cancel_at_period_end' in prevAttr || 'cancel_at' in prevAttr) ? !!(prevAttr.cancel_at_period_end || prevAttr.cancel_at) : cancelNow
        if (userId && cancelNow && !cancelBefore) await sendPlatformEmail(userId, { kind: 'cancel_scheduled', plan: planOf(sub), until: sub.cancel_at ? new Date(sub.cancel_at * 1000) : paidUntil(sub) })
      }
    } else if (ev.type === 'customer.subscription.deleted') {
      const sub = ev.data.object as Stripe.Subscription
      if (sub.metadata?.app === 'agenteimmo') {
        const userId = await userForSubscription(sub.id)
        await endPlan(sub.id)
        if (userId) await sendPlatformEmail(userId, { kind: 'plan_ended' })
      }
    } else if (ev.type === 'invoice.payment_failed') {
      // rinnovo non incassato: Stripe riprova da solo, l'agente aggiorna la carta dal portale
      const inv = ev.data.object as Stripe.Invoice
      const subId = (inv as unknown as { subscription?: string }).subscription ?? inv.parent?.subscription_details?.subscription
      if (subId && inv.billing_reason === 'subscription_cycle' && (inv.attempt_count ?? 1) === 1) {
        const sub = await stripe.subscriptions.retrieve(String(subId))
        const userId = sub.metadata?.app === 'agenteimmo' ? await userForSubscription(sub.id) : null
        if (userId) await sendPlatformEmail(userId, { kind: 'payment_failed', plan: planOf(sub) })
      }
    }
  } catch (e) {
    console.error('platform stripe webhook', ev.type, e)
    return NextResponse.json({ error: 'failed' }, { status: 500 }) // Stripe riprova
  }
  return NextResponse.json({ ok: true })
}
