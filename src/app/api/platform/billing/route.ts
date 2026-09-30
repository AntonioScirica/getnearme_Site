import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { STRIPE_PORTAL_CONFIG } from '@/lib/pricing'

// chiave mancante al build (raccolta dati delle pagine su Vercel): non si crea l'errore qui, le chiamate falliscono solo a runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing')
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const SITE = 'https://agenteimmo.me'
const siteOf = (req: NextRequest) => { const o = req.nextUrl.origin; return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(o) ? o : SITE }

// Portale clienti di Stripe per chi ha gia' un piano: cambio piano, disdetta, metodo di pagamento e fatture stanno li',
// la pagina Piano non rimostra le card. Serve la configurazione del portale su Stripe (prodotti e prezzi ammessi al cambio).
export async function POST(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: row } = await admin.from('platform_credits').select('stripe_customer_id, plan').eq('user_id', u.id).maybeSingle()
  const customer = row?.stripe_customer_id as string | undefined
  if (!customer || !row?.plan || row.plan === 'none') return NextResponse.json({ error: 'no_plan' }, { status: 400 })
  try {
    const s = await stripe.billingPortal.sessions.create({ configuration: STRIPE_PORTAL_CONFIG, customer, return_url: `${siteOf(req)}/it/dashboard#/piano`, locale: 'it' })
    return NextResponse.json({ url: s.url })
  } catch (e) {
    console.error('billing portal', e)
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 })
  }
}
