// Singleton Supabase browser client.
// Multiple createClient calls instantiate multiple GoTrueClient instances which
// race on the same localStorage key — only one processes OAuth URL hash, others
// see session=null. Always import this client in client components.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  // eslint-disable-next-line no-var
  var __gnm_supabase__: SupabaseClient | undefined;
}

// lock no-op: supabase-js usa navigator.locks per serializzare il refresh del
// token; su localhost (e in certi setup) quella lock può non risolversi mai →
// deadlock → l'auto-refresh non gira → il token scade e l'utente viene
// sbattuto fuori ("Accedi per usare..."). Bypassando la lock l'auto-refresh
// funziona e il token resta sempre fresco, anche durante render lunghi.
export const supabase: SupabaseClient =
  globalThis.__gnm_supabase__ ?? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
  });

if (typeof window !== 'undefined') {
  globalThis.__gnm_supabase__ = supabase;
}
