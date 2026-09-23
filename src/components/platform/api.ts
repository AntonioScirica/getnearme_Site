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

export const portfolioUrl = (slug: string) => `${window.location.origin}/it/a/${slug}`;

export const setPublic = (id: string, is_public: boolean) =>
  authFetch('/api/projects', { method: 'PUT', body: JSON.stringify({ id, is_public }) }).then(r => r.ok);
