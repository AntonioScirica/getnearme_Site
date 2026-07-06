-- pg_cron schedules for the automated blog pipeline.
--
-- Prerequisites (already enabled on this project — see
-- GetNearMe/supabase/migrations/20260514113729_social_publishing_cron.sql):
--
--   create extension if not exists pg_cron with schema extensions;
--   create extension if not exists pg_net  with schema extensions;
--
-- Vault secrets required (Dashboard → Settings → Vault):
--   supabase_functions_url  → already set (shared across functions on this project)
--   blog_cron_secret        → NEW, shared secret with generate-blog-post /
--                             quality-check-blog-post / publish-blog-posts,
--                             verified via the `x-cron-secret` header. One
--                             secret per pipeline, same convention as
--                             social_cron_secret.

-- ─── generate-blog-post: daily at 08:00 UTC ─────────────────────────────────
-- 1 post/day — deliberate ramp-up pace, see plan section "Volumi: ramp-up
-- anti-penalizzazione". Raise cadence later by re-running this block with a
-- different schedule string, nothing else changes.
SELECT cron.unschedule('generate-blog-post')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-blog-post');

SELECT cron.schedule(
  'generate-blog-post',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_functions_url') || '/generate-blog-post',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'blog_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);

-- ─── publish-blog-posts: daily at 08:15 UTC (after generate) ────────────────
SELECT cron.unschedule('publish-blog-posts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-blog-posts');

SELECT cron.schedule(
  'publish-blog-posts',
  '15 8 * * *',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_functions_url') || '/publish-blog-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'blog_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);

-- ─── analyze-blog-performance: weekly, Sunday 06:00 UTC ─────────────────────
-- Self-adjusting layer: refills blog_topics from real GSC query data and
-- steps generate-blog-post's cadence up/down via adjust_blog_cadence(). Needs
-- the GOOGLE_SERVICE_ACCOUNT_JSON secret set on this function.
SELECT cron.unschedule('analyze-blog-performance')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'analyze-blog-performance');

SELECT cron.schedule(
  'analyze-blog-performance',
  '0 6 * * 0',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_functions_url') || '/analyze-blog-performance',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'blog_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);

-- Sanity check
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN ('generate-blog-post','publish-blog-posts','analyze-blog-performance');
