'use client';

import { adsInfo } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

// Dal piano scelto (landing o pagina di accesso) dritti al checkout Stripe, senza passare dalla pagina dei piani.
// replace: dopo il login la pagina di accesso non resta nella cronologia (indietro da Stripe torna alla landing).
// Ritorna false se non c'e' sessione o Stripe non risponde (chi chiama decide cosa fare).
export type Buy = 'starter' | 'plus' | 'pro_yearly' | 'pro_quarterly';
export const isBuy = (v: string | null | undefined): v is Buy => v === 'starter' || v === 'plus' || v === 'pro_yearly' || v === 'pro_quarterly';

export async function startCheckout(plan: Buy, o: { replace?: boolean; back?: 'it' | 'en' } = {}): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const d = await fetch('/api/platform/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ plan, back: o.back, ...adsInfo() }),
  }).then(r => r.json()).catch(() => null) as { url?: string } | null;
  if (!d?.url) return false;
  if (o.replace) window.location.replace(d.url); else window.location.href = d.url;
  return true;
}
