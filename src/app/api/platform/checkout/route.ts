import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { isFakeUser } from '@/lib/fakeAi'
import { FORFETTARIO_FOOTER, PACKS, STRIPE_PORTAL_CONFIG } from '@/lib/pricing'

// chiave mancante al build (raccolta dati delle pagine su Vercel): non si crea l'errore qui, le chiamate falliscono solo a runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing')
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const PRICES = { starter: 'ai_starter_monthly', plus: 'ai_plus_monthly', pro_yearly: 'ai_pro_yearly', pro_quarterly: 'ai_pro_quarterly' } as const
const SITE = 'https://agenteimmo.me'
// ritorno da Stripe sullo stesso sito da cui si e' partiti (in sviluppo localhost o IP di rete), mai verso altri domini
const siteOf = (req: NextRequest) => { const o = req.nextUrl.origin; return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(o) ? o : SITE }

// Checkout Stripe per i piani. Si fattura a societa' e professionisti: ragione sociale e indirizzo, Partita IVA e
// codice SDI o PEC per la fattura elettronica, tutti obbligatori. Regime forfettario: niente IVA sul prezzo.
export async function POST(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // account di prova degli agenti simulati: mai una sessione Stripe con le chiavi live
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') && await isFakeUser(u.id)) return NextResponse.json({ error: 'test_account' }, { status: 403 })
  const body = await req.json().catch(() => null) as { plan?: string; back?: string; pack?: string; ads?: boolean; fbp?: string; fbc?: string } | null
  // pacchetto di crediti extra (pagamento singolo): solo con un piano attivo
  const pack = PACKS.find(x => x.id === body?.pack)
  const lookup = pack ? `ai_pack_${pack.credits}` : PRICES[body?.plan as keyof typeof PRICES]
  if (!lookup) return NextResponse.json({ error: 'bad_plan' }, { status: 400 })
  const price = (await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0]
  if (!price) return NextResponse.json({ error: 'price_missing' }, { status: 500 })
  const plan = pack ? 'pack' : body!.plan!.startsWith('pro') ? 'pro' : body!.plan === 'plus' ? 'plus' : 'starter'
  const { data: row } = await admin.from('platform_credits').select('stripe_customer_id, stripe_subscription_id, plan').eq('user_id', u.id).maybeSingle()
  if (pack && (!row?.plan || row.plan === 'none')) return NextResponse.json({ error: 'no_plan' }, { status: 400 })
  const meta: Record<string, string> = pack ? { app: 'agenteimmo', user_id: u.id, plan, pack: pack.id, credits: String(pack.credits) } : { app: 'agenteimmo', user_id: u.id, plan }
  // consenso marketing del browser: solo allora il webhook manda l'acquisto a Meta (Conversions API, lib/metaCapi)
  const ck = (v: unknown) => (typeof v === 'string' && /^fb\.\d\.\d+\.[\w-]{1,200}$/.test(v) ? v : '')
  const ads: Record<string, string> = body?.ads === true ? { ads: '1', ip: (req.headers.get('x-forwarded-for')?.split(',')[0] ?? '').trim().slice(0, 45), ua: (req.headers.get('user-agent') ?? '').slice(0, 450), ...(ck(body.fbp) ? { fbp: ck(body.fbp) } : {}), ...(ck(body.fbc) ? { fbc: ck(body.fbc) } : {}) } : {}
  // cambio piano con un abbonamento attivo: pagina di Stripe dove l'agente vede il nuovo prezzo e quanto paga oggi e
  // conferma lui (niente addebiti con un clic dalla piattaforma). Stesso abbonamento, niente secondo abbonamento.
  // I crediti del nuovo piano li mette il webhook (customer.subscription.updated).
  if (!pack && row?.stripe_subscription_id && row.plan && row.plan !== 'none') {
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id).catch(() => null)
    if (sub && ['active', 'trialing'].includes(sub.status)) {
      const item = sub.items.data[0]
      if (item.price.id === price.id) return NextResponse.json({ error: 'same_plan' }, { status: 400 })
      const portal = await stripe.billingPortal.sessions.create({
        configuration: STRIPE_PORTAL_CONFIG, customer: sub.customer as string, locale: 'it', return_url: `${siteOf(req)}/it/dashboard#/piano`,
        flow_data: {
          type: 'subscription_update_confirm',
          subscription_update_confirm: { subscription: sub.id, items: [{ id: item.id, price: price.id, quantity: 1 }] },
          after_completion: { type: 'redirect', redirect: { return_url: `${siteOf(req)}/it/dashboard#/piano?ok=1` } },
        },
      })
      return NextResponse.json({ url: portal.url })
    }
  }
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
    metadata: { ...meta, ...ads },
    ...(pack ? { invoice_creation: { enabled: true } } : { subscription_data: { metadata: meta } }),
    locale: 'it',
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true, required: 'if_supported' },
    // SDI o PEC facoltativo: senza, la fattura elettronica va con 0000000 e l'agente la trova nel cassetto fiscale
    custom_fields: [{ key: 'sdi', label: { type: 'custom', custom: 'Codice SDI o PEC (facoltativo)' }, type: 'text', optional: true }],
    // il conto Stripe e' lo stesso di GetNearMe: marchio di Agente Immo solo su questo checkout (la nota del forfettario resta in fattura)
    branding_settings: { display_name: 'Agente Immo', icon: { type: 'url', url: `${SITE}/immo/logo-cerchio-stripe.png` }, logo: { type: 'url', url: `${SITE}/immo/logo-cerchio-stripe.png` }, button_color: '#537eec', border_style: 'pill' },
    allow_promotion_codes: true,
    // sid e valore: l'evento Purchase nel browser (stesso eventID dell'invio dal server, Meta lo conta una volta)
    success_url: `${siteOf(req)}/it/dashboard#/piano?ok=1&sid={CHECKOUT_SESSION_ID}&v=${(price.unit_amount ?? 0) / 100}&k=${pack ? pack.id : plan}`,
    // partito dalla landing: annullando si torna ai prezzi della landing, non alla piattaforma
    cancel_url: body?.back === 'it' || body?.back === 'en' ? `${siteOf(req)}/${body.back}#prezzi` : `${siteOf(req)}/it/dashboard#/piano`,
  })
  return NextResponse.json({ url: session.url })
}
