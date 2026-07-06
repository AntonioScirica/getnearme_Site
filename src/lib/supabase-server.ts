// Server-only Supabase client (service role key). Never import this from a
// "use client" file — the key must not reach the browser bundle. Unlike
// src/lib/supabase.ts this is a factory, not a singleton: there's no
// GoTrueClient/localStorage race to avoid on the server, each request can
// just create its own client.

import { createClient } from '@supabase/supabase-js';

export function getSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
