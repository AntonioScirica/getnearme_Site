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

export const supabase: SupabaseClient =
  globalThis.__gnm_supabase__ ?? createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (typeof window !== 'undefined') {
  globalThis.__gnm_supabase__ = supabase;
}
