import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Best-effort: cancella subito gli abbonamenti Stripe attivi del cliente, così un
// account eliminato non continua a essere fatturato. Non blocca la cancellazione
// account se Stripe fallisce.
async function cancelStripeSubscriptions(customerId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return;
  try {
    const list = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=100`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const json = await list.json();
    if (!list.ok || !Array.isArray(json?.data)) return;
    const active = json.data.filter((s: any) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due');
    await Promise.all(
      active.map((s: any) =>
        fetch(`https://api.stripe.com/v1/subscriptions/${s.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${key}` },
        }).catch(() => null)
      )
    );
  } catch (err) {
    console.error('cancelStripeSubscriptions error:', (err as Error)?.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // Cancella eventuali abbonamenti Stripe prima di eliminare l'utente
    const { data: credits } = await admin
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    if (credits?.stripe_customer_id) {
      await cancelStripeSubscriptions(credits.stripe_customer_id);
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
