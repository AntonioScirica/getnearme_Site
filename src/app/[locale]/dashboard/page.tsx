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
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  agencySeats: number | null;
};

// Avatar dal provider OAuth (Google): user_metadata.avatar_url / picture.
function avatarFromUser(user: { user_metadata?: Record<string, unknown> } | null | undefined): string | null {
  const m = user?.user_metadata as Record<string, string> | undefined;
  return (m?.avatar_url || m?.picture || null) as string | null;
}

// Le cache client (job video, batch foto, flag) sono in localStorage/IndexedDB
// NON scoped per utente. Se sullo stesso browser entra un account diverso (o si
// ricrea l'account dopo averlo cancellato -> nuovo user_id), senza pulirle il
// nuovo utente si ritroverebbe i contenuti del vecchio. Qui azzeriamo tutto
// appena l'uid della sessione non combacia con l'ultimo visto in questo browser.
function guardUserCache(uid: string): void {
  try {
    const prev = localStorage.getItem('gnm_last_uid');
    if (prev && prev !== uid) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gnm_') && k !== 'gnm_last_uid') localStorage.removeItem(k);
      }
      try { indexedDB.deleteDatabase('gnm_media_cache'); } catch { /* noop */ }
    }
    localStorage.setItem('gnm_last_uid', uid);
  } catch { /* private mode */ }
}

async function fetchProfile(userId: string, email: string, avatarUrl: string | null = null): Promise<UserData> {
  // NB: la colonna e' `stripe_agency_subscription_id` (NON `stripe_customer_id`).
  // Selezionare una colonna inesistente faceva fallire l'INTERA query -> data
  // null -> subscriptionType sempre 'free' (piano/brand bloccati anche da pagante).
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits, subscription_type, stripe_agency_subscription_id, total_earned, total_spent, onboarding_completed, agency_seats')
    .eq('user_id', userId)
    .single();
  if (error) console.error('fetchProfile error:', error.message);
  return {
    id: userId,
    email,
    credits: data?.credits ?? 0,
    subscriptionType: data?.subscription_type ?? 'free',
    stripeCustomerId: data?.stripe_agency_subscription_id ?? null,
    totalEarned: data?.total_earned ?? 0,
    totalSpent: data?.total_spent ?? 0,
    avatarUrl,
    onboardingCompleted: data?.onboarding_completed ?? false,
    agencySeats: data?.agency_seats ?? null,
  };
}

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Safety: getSession non deve mai appendere il loader all'infinito.
        const sessionRes = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        const session = sessionRes?.data?.session ?? null;
        if (session?.user) {
          // getSession legge solo il JWT locale: dopo che un account viene
          // cancellato, l'access token resta valido fino a scadenza (~1h) e
          // farebbe entrare in dashboard un utente inesistente (anche su un
          // altro dispositivo/origine). getUser() valida il token lato server:
          // se l'utente non esiste piu' (401/403) buttiamo giu' la sessione e
          // lasciamo che il redirect mandi al login. Errori di rete: fail-open
          // (non sloggare un utente valido solo perche' offline).
          const { data: userRes, error: userErr } = await supabase.auth.getUser();
          const status = (userErr as { status?: number } | null)?.status;
          if (userErr && (status === 401 || status === 403)) {
            await supabase.auth.signOut().catch(() => {});
            setLoading(false);
            return;
          }
          const u = userRes?.user ?? session.user;
          guardUserCache(u.id);
          const profile = await fetchProfile(u.id, u.email || '', avatarFromUser(u));
          setUserData(profile);
        }
      } catch (e) {
        console.error('dashboard init error', e);
      } finally {
        setLoading(false);
      }
    }
    init();

    // IMPORTANTE: il callback NON deve essere async ne' chiamare supabase dentro.
    // Supabase lo invoca tenendo il lock di auth: awaitare fetchProfile (che fa
    // supabase.from) qui dentro causa DEADLOCK -> getSession appeso -> loader
    // infinito. Il fetch del profilo va differito fuori dal callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserData(null);
        return;
      }
      if (session?.user) {
        const u = session.user;
        guardUserCache(u.id);
        setTimeout(() => { fetchProfile(u.id, u.email || '', avatarFromUser(u)).then(setUserData).catch(() => {}); }, 0);
      }
    });

    // Refetch profilo al ritorno dal checkout Stripe (aperto in nuova tab):
    // tornando sulla dashboard scatta focus/visibilitychange. Il webhook e'
    // async, quindi facciamo qualche tentativo finche' il piano si aggiorna.
    let pollId: ReturnType<typeof setTimeout> | null = null;
    const refetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const p = await fetchProfile(session.user.id, session.user.email || '', avatarFromUser(session.user));
          setUserData(p);
          return p.subscriptionType && p.subscriptionType !== 'free';
        }
      } catch { /* noop */ }
      return false;
    };
    const onReturn = () => {
      if (document.hidden) return;
      let tries = 0;
      const run = async () => {
        const paid = await refetchProfile();
        tries++;
        if (!paid && tries < 5) pollId = setTimeout(run, 2500); // webhook lag
      };
      if (pollId) clearTimeout(pollId);
      run();
    };
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
      if (pollId) clearTimeout(pollId);
    };
  }, []);

  // Non autenticato -> mandiamo al login vero (checkout/agency). Niente piu'
  // pagina di login custom: si usa sempre il login del checkout.
  useEffect(() => {
    if (!loading && !userData) {
      // Post eliminazione account: si va alla home landing, non al login.
      let postDelete = false;
      try { postDelete = sessionStorage.getItem('gnm_post_delete') === '1'; } catch { /* private mode */ }
      if (postDelete) {
        try { sessionStorage.removeItem('gnm_post_delete'); } catch { /* private mode */ }
        window.location.replace(`/${locale}`);
        return;
      }
      window.location.replace(`/${locale}/checkout/agency`);
    }
  }, [loading, userData, locale]);

  if (loading || !userData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <Loader2 size={26} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return <DashboardApp userData={userData} />;
}
