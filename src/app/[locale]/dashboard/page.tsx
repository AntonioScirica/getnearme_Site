'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

async function fetchProfile(userId: string, email: string): Promise<UserData> {
  const { data } = await supabase
    .from('user_credits')
    .select('credits, subscription_type, stripe_customer_id, total_earned, total_spent')
    .eq('user_id', userId)
    .single();
  return {
    id: userId,
    email,
    credits: data?.credits ?? 0,
    subscriptionType: data?.subscription_type ?? 'free',
    stripeCustomerId: data?.stripe_customer_id ?? null,
    totalEarned: data?.total_earned ?? 0,
    totalSpent: data?.total_spent ?? 0,
  };
}

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email || '');
        setUserData(profile);
      }
      setLoading(false);
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email || '');
        setUserData(profile);
      } else {
        setUserData(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginLoading(false);
    if (error) setLoginError(error.message);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <Loader2 size={26} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ width: 380, background: '#fff', borderRadius: 20, padding: '40px 32px', boxShadow: '0 8px 40px rgba(33,31,28,.08)', border: '1px solid #f0ede7' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>GetNearMe</div>
            <div style={{ fontSize: 13.5, color: '#8c867d' }}>Accedi per continuare</div>
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#57534c' }}>Email</label>
          <input
            type="email" required autoFocus value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e4e1da', borderRadius: 10, fontSize: 14, marginBottom: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#57534c' }}>Password</label>
          <input
            type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e4e1da', borderRadius: 10, fontSize: 14, marginBottom: 20, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          {loginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{loginError}</div>
          )}
          <button
            type="submit" disabled={loginLoading}
            style={{ width: '100%', padding: '13px 16px', background: '#3B83F6', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 10, cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.7 : 1, fontFamily: 'inherit' }}
          >
            {loginLoading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    );
  }

  return <DashboardApp userData={userData} />;
}
