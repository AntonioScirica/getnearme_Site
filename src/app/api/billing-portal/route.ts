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

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'misconfig' }, { status: 500 })

    // La colonna reale e' stripe_agency_subscription_id (NON stripe_customer_id).
    const { data: row, error: rowErr } = await admin
      .from('user_credits')
      .select('stripe_agency_subscription_id')
      .eq('user_id', userId)
      .single()
    if (rowErr) console.error('billing-portal row error:', rowErr.message)
    const subscriptionId = row?.stripe_agency_subscription_id

    let customer: string | null = null
    if (subscriptionId) {
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      })
      const sub = await subRes.json()
      if (subRes.ok && sub?.customer) customer = sub.customer
      else console.error('billing-portal sub lookup failed:', sub?.error?.message)
    }

    // Fallback: la colonna puo' essere vuota/disallineata (subscription
    // sostituita, riga non scritta da un percorso legacy). Cerca il customer
    // Stripe per email invece di arrenderti col portale generico inutile.
    if (!customer) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      const email = authUser?.user?.email
      if (email) {
        const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        })
        const custData = await custRes.json()
        if (custRes.ok && custData?.data?.[0]?.id) customer = custData.data[0].id
      }
    }

    if (!customer) return NextResponse.json({ error: 'no_customer' }, { status: 400 })

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
