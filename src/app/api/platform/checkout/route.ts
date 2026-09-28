import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { FORFETTARIO_FOOTER, PACKS } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const PRICES = { starter: 'ai_starter_monthly', pro_yearly: 'ai_pro_yearly', pro_quarterly: 'ai_pro_quarterly' } as const
const SITE = 'https://agenteimmo.me'
// ritorno da Stripe sullo stesso sito da cui si e' partiti (in sviluppo localhost o IP di rete), mai verso altri domini
const siteOf = (req: NextRequest) => { const o = req.nextUrl.origin; return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(o) ? o : SITE }

// Checkout Stripe per i piani. Si fattura a societa' e professionisti: ragione sociale e indirizzo, Partita IVA e
// codice SDI o PEC per la fattura elettronica, tutti obbligatori. Regime forfettario: niente IVA sul prezzo.
export async function POST(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as { plan?: string; back?: string; pack?: string } | null
  // pacchetto di crediti extra (pagamento singolo): solo con un piano attivo
  const pack = PACKS.find(x => x.id === body?.pack)
  const lookup = pack ? `ai_pack_${pack.credits}` : PRICES[body?.plan as keyof typeof PRICES]
  if (!lookup) return NextResponse.json({ error: 'bad_plan' }, { status: 400 })
  const price = (await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0]
  if (!price) return NextResponse.json({ error: 'price_missing' }, { status: 500 })
  const plan = pack ? 'pack' : body!.plan!.startsWith('pro') ? 'pro' : 'starter'
  const { data: row } = await admin.from('platform_credits').select('stripe_customer_id, plan').eq('user_id', u.id).maybeSingle()
  if (pack && (!row?.plan || row.plan === 'none')) return NextResponse.json({ error: 'no_plan' }, { status: 400 })
  const meta: Record<string, string> = pack ? { app: 'agenteimmo', user_id: u.id, plan, pack: pack.id, credits: String(pack.credits) } : { app: 'agenteimmo', user_id: u.id, plan }
  let customer = row?.stripe_customer_id as string | undefined
  if (!customer) {
    customer = (await stripe.customers.create({ email: u.email || undefined, invoice_settings: { footer: FORFETTARIO_FOOTER }, metadata: { app: 'agenteimmo', user_id: u.id }, preferred_locales: ['it'] })).id
    await admin.from('platform_credits').upsert({ user_id: u.id, stripe_customer_id: customer, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }
  const session = await stripe.checkout.sessions.create({
    mode: pack ? 'payment' : 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    customer, customer_update: { address: 'auto', name: 'auto' },
    client_reference_id: u.id,
    metadata: meta,
    ...(pack ? { invoice_creation: { enabled: true } } : { subscription_data: { metadata: meta } }),
    locale: 'it',
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true, required: 'if_supported' },
    custom_fields: [{ key: 'sdi', label: { type: 'custom', custom: 'Codice SDI o PEC (fattura elettronica)' }, type: 'text', optional: false }],
    custom_text: { submit: { message: 'Prezzo finale: operazione senza IVA, regime forfettario (art. 1, commi 54-89, L. 190/2014). Riceverai la fattura elettronica.' } },
    allow_promotion_codes: true,
    success_url: `${siteOf(req)}/it/dashboard#/piano?ok=1`,
    // partito dalla landing: annullando si torna ai prezzi della landing, non alla piattaforma
    cancel_url: body?.back === 'it' || body?.back === 'en' ? `${siteOf(req)}/${body.back}#prezzi` : `${siteOf(req)}/it/dashboard#/piano`,
  })
  return NextResponse.json({ url: session.url })
}
