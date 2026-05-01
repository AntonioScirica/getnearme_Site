'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Locale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function AmbassadorRedirect({ locale }: { locale: Locale }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let done = false;

    async function check(userId: string) {
      if (done || cancelled) return;
      const { data } = await supabase
        .from('user_credits')
        .select('subscription_type')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      console.log('[AmbassadorRedirect] subscription_type:', data?.subscription_type);
      if (data?.subscription_type === 'ambassador') {
        done = true;
        router.replace(`/${locale}/ambassador/dashboard`);
      }
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await check(session.user.id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) check(session.user.id);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [locale, router]);

  return null;
}
