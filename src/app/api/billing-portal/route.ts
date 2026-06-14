import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crea una Stripe Billing Portal SESSION per l'utente loggato, così "Gestisci
// piano" entra diretto (niente re-inserimento email/magic-link). Usa la chiave
// segreta Stripe lato server + lo stripe_customer_id salvato su user_credits.

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: u } = await admin.auth.getUser(token)
    const userId = u.user?.id
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { data: row } = await admin
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()
    const customer = row?.stripe_customer_id
    if (!customer) return NextResponse.json({ error: 'no_customer' }, { status: 400 })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'misconfig' }, { status: 500 })

    const { returnUrl } = await req.json().catch(() => ({}))
    const body = new URLSearchParams()
    body.set('customer', customer)
    if (typeof returnUrl === 'string' && returnUrl.startsWith('http')) body.set('return_url', returnUrl)

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const json = await res.json()
    if (!res.ok) {
      console.error('billing-portal error:', json?.error?.message)
      return NextResponse.json({ error: json?.error?.message || 'stripe_error' }, { status: 500 })
    }
    return NextResponse.json({ url: json.url })
  } catch (err) {
    console.error('billing-portal exception:', (err as Error)?.message)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
