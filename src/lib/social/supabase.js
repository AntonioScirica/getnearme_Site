import { createClient } from '@supabase/supabase-js';

// Server-side client for the social content pipeline.
// Uses the GetNearMe Supabase project with the service role key (bypasses RLS).
const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
);

export default supabase;
