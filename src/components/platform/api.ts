import { supabase } from '@/lib/supabase';

export async function authFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${session?.access_token}` },
  });
}

export const go = (path: string) => { window.location.hash = path; };

export const formatPrice = (n: number) => (n ? `€ ${n.toLocaleString('it-IT')}` : 'Prezzo n.d.');

// Dominio vetrina (NEXT_PUBLIC_PORTFOLIO_HOST, es. agenteimmo.me); in locale senza env resta sul sito.
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
export const portfolioPrefix = () => (PORTFOLIO_HOST ? `${PORTFOLIO_HOST}/` : `${window.location.host}/it/a/`);
export const portfolioUrl = (slug: string) => (PORTFOLIO_HOST ? `https://${PORTFOLIO_HOST}/${slug}` : `${window.location.origin}/it/a/${slug}`);

export const setPublic = (id: string, is_public: boolean) =>
  authFetch('/api/projects', { method: 'PUT', body: JSON.stringify({ id, is_public }) }).then(r => r.ok);
