import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Best-effort: annulla SUBITO la subscription Stripe, così un account eliminato
// non continua a essere fatturato. Non blocca la cancellazione account se Stripe
// fallisce. Cancella per id subscription e (se ricavabile) tutte quelle del customer.
async function cancelStripeSubscription(subscriptionId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { console.error('cancelStripeSubscription: STRIPE_SECRET_KEY mancante'); return; }
  try {
    // 1) annulla la subscription nota
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    });
    const sub = await res.json();
    if (!res.ok) { console.error('cancel sub failed:', sub?.error?.message); return; }
    // 2) per sicurezza, annulla eventuali altre subscription attive dello stesso customer
    const customerId = sub?.customer;
    if (customerId) {
      const list = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=active&limit=100`, { headers: { Authorization: `Bearer ${key}` } });
      const json = await list.json();
      if (list.ok && Array.isArray(json?.data)) {
        await Promise.all(json.data.map((s: any) =>
          fetch(`https://api.stripe.com/v1/subscriptions/${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } }).catch(() => null)
        ));
      }
    }
  } catch (err) {
    console.error('cancelStripeSubscription error:', (err as Error)?.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // Cancella la subscription Stripe PRIMA di eliminare l'utente (colonna reale:
    // stripe_agency_subscription_id, NON stripe_customer_id che non esiste).
    const { data: credits } = await admin
      .from('user_credits')
      .select('stripe_agency_subscription_id')
      .eq('user_id', user.id)
      .single();
    if (credits?.stripe_agency_subscription_id) {
      await cancelStripeSubscription(credits.stripe_agency_subscription_id);
    }

    // Hard delete: le righe dipendenti vengono rimosse via ON DELETE CASCADE / SET NULL
    // (migration 20260614120000_account_deletion_cascade.sql)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error('Error deleting user:', deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
