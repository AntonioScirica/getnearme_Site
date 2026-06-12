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

export type UserData = {
  id: string;
  email: string;
  credits: number;
  subscriptionType: string;
  stripeCustomerId: string | null;
  totalEarned: number;
  totalSpent: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [ready, setReady] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function init() {
      // TODO: restore auth gate before merge
      // const { data: { session } } = await supabase.auth.getSession();
      // if (!session?.user) {
      //   router.replace(`/${locale}/checkout/agency`);
      //   return;
      // }

      // Demo data while auth is bypassed
      setUserData({
        id: 'demo-user',
        email: 'demo@getnearme.it',
        credits: 140,
        subscriptionType: 'agency_quarterly',
        stripeCustomerId: null,
        totalEarned: 200,
        totalSpent: 60,
      });

      setReady(true);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <Loader2 size={26} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return <DashboardApp userData={userData} />;
}
