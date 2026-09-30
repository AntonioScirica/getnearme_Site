'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import DashboardApp from '@/components/dashboard/DashboardApp';
import ImmoLoader from '@/components/ui/ImmoLoader';

// Nuova piattaforma (branch ui-rewrite): visibile solo agli admin (lib/platformAdmins)
// finche' non si fa lo switch. Switch = rendere sempre <PlatformApp/> e cancellare
// DashboardApp. ?ui=old forza la vecchia per confronto.
// ponytail: gate client-side, nasconde solo la UI; i dati restano protetti da RLS.
const PlatformApp = dynamic(() => import('@/components/platform/PlatformApp'), { ssr: false });

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

// Se Supabase non risponde (es. API giu') non restare in caricamento infinito.
const withTimeout = <T,>(p: PromiseLike<T>, ms = 8000): Promise<T> =>
  Promise.race([Promise.resolve(p), new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [unavailable, setUnavailable] = useState(false);

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
          const { data: userRes, error: userErr } = await withTimeout(supabase.auth.getUser());
          const status = (userErr as { status?: number } | null)?.status;
          if (userErr && (status === 401 || status === 403)) {
            await supabase.auth.signOut().catch(() => {});
            setLoading(false);
            return;
          }
          const u = userRes?.user ?? session.user;
          guardUserCache(u.id);
          const profile = await withTimeout(fetchProfile(u.id, u.email || '', avatarFromUser(u)));
          setUserData(profile);
        }
      } catch (e) {
        console.error('dashboard init error', e);
        if ((e as Error)?.message === 'timeout') setUnavailable(true);
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
    if (!loading && !userData && !unavailable) {
      // Post eliminazione account: si va alla home landing, non al login.
      let postDelete = false;
      try { postDelete = sessionStorage.getItem('gnm_post_delete') === '1'; } catch { /* private mode */ }
      if (postDelete) {
        try { sessionStorage.removeItem('gnm_post_delete'); } catch { /* private mode */ }
        window.location.replace(`/${locale}`);
        return;
      }
      // si torna qui (anche #/piano?buy=...) dopo l'accesso
      window.location.replace(`/${locale}/accedi?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`);
    }
  }, [loading, userData, locale, unavailable]);

  if (unavailable) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontSize: 15, color: '#444' }}>
        <div>{locale === 'en' ? 'Service temporarily unavailable.' : 'Servizio momentaneamente non disponibile.'}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, background: '#15181f', color: '#fff', border: 0, cursor: 'pointer' }}>{locale === 'en' ? 'Try again' : 'Riprova'}</button>
      </div>
    );
  }

  if (loading || !userData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <ImmoLoader label={locale === 'en' ? 'Loading' : 'Caricamento'} />
      </div>
    );
  }

  // Agente Immo e' la piattaforma per tutti (27/09/2026); la vecchia dashboard resta solo con ?ui=old
  const showNewPlatform = new URLSearchParams(window.location.search).get('ui') !== 'old';
  return showNewPlatform ? <PlatformApp userData={userData} /> : <DashboardApp userData={userData} />;
}
