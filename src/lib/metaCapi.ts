import { createHash } from 'crypto'
import type Stripe from 'stripe'

// Conversions API di Meta: l'acquisto confermato da Stripe parte anche dal server (il Pixel nel browser ne perde,
// tra blocchi e cookie). Solo se nel checkout il browser aveva il consenso marketing (metadata ads = '1', vedi
// api/platform/checkout). event_id = sessione Stripe, lo stesso del Purchase nel browser: Meta lo conta una volta.
// Si accende con META_CAPI_TOKEN su Vercel (Gestione eventi > Pixel > Impostazioni > Conversions API > Genera token).
const PIXEL = '1023519243879273'
const sha = (s: string) => createHash('sha256').update(s.trim().toLowerCase()).digest('hex')

export async function capiPurchase(cs: Stripe.Checkout.Session, coupon = '') {
  const token = process.env.META_CAPI_TOKEN
  const m = cs.metadata ?? {}
  const value = (cs.amount_total ?? 0) / 100
  if (!token || m.ads !== '1') return // anche a 0 € (primo mese gratis col codice): e' comunque un cliente nuovo
  const email = cs.customer_details?.email
  const user_data = {
    ...(email ? { em: [sha(email)] } : {}),
    ...(m.user_id ? { external_id: [sha(m.user_id)] } : {}),
    ...(m.ip ? { client_ip_address: m.ip } : {}),
    ...(m.ua ? { client_user_agent: m.ua } : {}),
    ...(m.fbp ? { fbp: m.fbp } : {}),
    ...(m.fbc ? { fbc: m.fbc } : {}),
  }
  const data = [{
    event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), event_id: cs.id, action_source: 'website',
    event_source_url: 'https://agenteimmo.me/it/dashboard', user_data,
    custom_data: { value, currency: (cs.currency ?? 'eur').toUpperCase(), content_name: m.pack || m.plan || '', ...(coupon ? { coupon } : {}) },
  }]
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, ...(process.env.META_CAPI_TEST ? { test_event_code: process.env.META_CAPI_TEST } : {}) }),
    })
    if (!r.ok) console.error('meta capi', r.status, (await r.text()).slice(0, 300))
  } catch (e) {
    console.error('meta capi', e)
  }
}
