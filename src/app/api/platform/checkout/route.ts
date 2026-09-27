import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { FORFETTARIO_FOOTER } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const PRICES = { starter: 'ai_starter_monthly', pro_yearly: 'ai_pro_yearly', pro_quarterly: 'ai_pro_quarterly' } as const
const SITE = 'https://agenteimmo.me'

// Checkout Stripe per i piani. Si fattura a societa' e professionisti: ragione sociale e indirizzo, Partita IVA e
// codice SDI o PEC per la fattura elettronica, tutti obbligatori. Regime forfettario: niente IVA sul prezzo.
export async function POST(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as { plan?: string } | null
  const lookup = PRICES[body?.plan as keyof typeof PRICES]
  if (!lookup) return NextResponse.json({ error: 'bad_plan' }, { status: 400 })
  const price = (await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0]
  if (!price) return NextResponse.json({ error: 'price_missing' }, { status: 500 })
  const plan = body!.plan!.startsWith('pro') ? 'pro' : 'starter'
  const { data: row } = await admin.from('platform_credits').select('stripe_customer_id').eq('user_id', u.id).maybeSingle()
  const meta = { app: 'agenteimmo', user_id: u.id, plan }
  let customer = row?.stripe_customer_id as string | undefined
  if (!customer) {
    customer = (await stripe.customers.create({ email: u.email || undefined, invoice_settings: { footer: FORFETTARIO_FOOTER }, metadata: { app: 'agenteimmo', user_id: u.id }, preferred_locales: ['it'] })).id
    await admin.from('platform_credits').upsert({ user_id: u.id, stripe_customer_id: customer, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    customer, customer_update: { address: 'auto', name: 'auto' },
    client_reference_id: u.id,
    metadata: meta,
    subscription_data: { metadata: meta },
    locale: 'it',
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true, required: 'if_supported' },
    custom_fields: [{ key: 'sdi', label: { type: 'custom', custom: 'Codice SDI o PEC (fattura elettronica)' }, type: 'text', optional: false }],
    custom_text: { submit: { message: 'Prezzo finale: operazione senza IVA, regime forfettario (art. 1, commi 54-89, L. 190/2014). Riceverai la fattura elettronica.' } },
    allow_promotion_codes: true,
    success_url: `${SITE}/it/dashboard#/piano?ok=1`,
    cancel_url: `${SITE}/it/dashboard#/piano`,
  })
  return NextResponse.json({ url: session.url })
}
