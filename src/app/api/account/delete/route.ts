import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteKeys, listKeys } from '@/lib/r2';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Best-effort: annulla SUBITO gli abbonamenti Stripe, cosi' un account eliminato non continua a essere fatturato.
// Non blocca la cancellazione account se Stripe fallisce. Parte dagli abbonamenti noti (GetNearMe in user_credits,
// Agente Immo in platform_credits) e annulla tutti quelli ancora vivi dei loro clienti.
const LIVE = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'])
async function cancelStripe(subs: string[], customers: string[]) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { console.error('cancelStripe: STRIPE_SECRET_KEY mancante'); return; }
  const api = (path: string, method = 'GET') => fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${key}` } }).then(async r => ({ ok: r.ok, json: await r.json().catch(() => null) }));
  try {
    const custs = new Set(customers);
    for (const id of subs) {
      const r = await api(`subscriptions/${id}`, 'DELETE');
      if (!r.ok) console.error('cancel sub failed:', id, r.json?.error?.message);
      if (r.json?.customer) custs.add(r.json.customer);
    }
    for (const c of custs) {
      const r = await api(`subscriptions?customer=${encodeURIComponent(c)}&status=all&limit=100`);
      const live = (r.json?.data ?? []).filter((x: { status: string }) => LIVE.has(x.status));
      await Promise.all(live.map((x: { id: string }) => api(`subscriptions/${x.id}`, 'DELETE').catch(() => null)));
    }
  } catch (err) {
    console.error('cancelStripe error:', (err as Error)?.message);
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
    const [{ data: credits }, { data: plat }] = await Promise.all([
      admin.from('user_credits').select('stripe_agency_subscription_id').eq('user_id', user.id).maybeSingle(),
      admin.from('platform_credits').select('stripe_subscription_id, stripe_customer_id').eq('user_id', user.id).maybeSingle(),
    ]);
    await cancelStripe(
      [credits?.stripe_agency_subscription_id, plat?.stripe_subscription_id].filter((x): x is string => !!x),
      [plat?.stripe_customer_id].filter((x): x is string => !!x),
    );

    // Foto create in Galleria e caricate per il sito: via anche da R2 (best effort, non blocca l'eliminazione)
    try {
      const keys = (await Promise.all([`edits/${user.id}/`, `vetrina/${user.id}/`].map(p => listKeys(p, 10000)))).flat().map(k => k.key);
      if (keys.length) await deleteKeys(keys);
    } catch (e) { console.error('account delete r2:', (e as Error)?.message); }

    // Hard delete: le righe dipendenti vengono rimosse via ON DELETE CASCADE / SET NULL
    // (migration 20260614120000_account_deletion_cascade.sql)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error('Error deleting user:', deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
