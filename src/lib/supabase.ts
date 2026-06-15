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

// Lock del refresh token: quello DEFAULT di supabase-js (navigator.locks).
// I "deadlock" visti prima NON erano il lock, ma un callback onAuthStateChange
// async che awaitava supabase.from dentro (deadlock col lock di auth). Risolto
// quello, il lock di default funziona come in produzione/estensione. Il
// singleton qui sotto evita la multi-istanza (vera causa storica del deadlock).
export const supabase: SupabaseClient =
  globalThis.__gnm_supabase__ ?? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

if (typeof window !== 'undefined') {
  globalThis.__gnm_supabase__ = supabase;
}
