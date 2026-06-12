'use client';

// User profile = GetNearMe SaaS dashboard (Claude Design redesign).
// The previous account/billing page is preserved in
// src/components/dashboard/legacy-account-page.txt and will be folded into the
// new "Piano & Crediti" screen during the screen-by-screen port.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DashboardApp from '@/components/dashboard/DashboardApp';

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function gate() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace(`/${locale}/checkout/agency`);
        return;
      }
      setReady(true);
    }
    gate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <Loader2 size={26} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return <DashboardApp />;
}
