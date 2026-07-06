-- Self-adjusting layer for the blog pipeline: weekly performance check that
-- refills blog_topics from real GSC query data and adjusts publish cadence.
-- See plan: blog automatico SEO/GEO — "Volumi: ramp-up anti-penalizzazione".

CREATE TABLE IF NOT EXISTS blog_strategy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision TEXT NOT NULL,
  schedule_before TEXT,
  schedule_after TEXT,
  topics_added INT NOT NULL DEFAULT 0,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_strategy_log ENABLE ROW LEVEL SECURITY;
-- Service-role only (no policy = no access via anon/authenticated roles).

-- Re-points the generate-blog-post cron job at a new cadence. The allowed
-- list is a hard ceiling enforced in code, NOT data-driven — this is the one
-- thing that must never scale past 3 runs/day regardless of what the
-- performance check concludes (Google's scaled-content-abuse policy risk on
-- a low-authority domain). Same net.http_post body as the original
-- migration; only the cron interval changes.
-- Reads the current cron interval for generate-blog-post so the performance
-- check knows which rung of the cadence ladder it's on.
CREATE OR REPLACE FUNCTION get_blog_cadence()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT schedule FROM cron.job WHERE jobname = 'generate-blog-post' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION adjust_blog_cadence(new_schedule TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF new_schedule NOT IN ('0 8 * * *', '0 8,20 * * *', '0 6,12,18 * * *') THEN
    RAISE EXCEPTION 'Unsupported cadence schedule: %', new_schedule;
  END IF;

  PERFORM cron.unschedule('generate-blog-post')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-blog-post');

  PERFORM cron.schedule(
    'generate-blog-post',
    new_schedule,
    $sql$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_functions_url') || '/generate-blog-post',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'blog_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      ) AS request_id;
    $sql$
  );
END;
$$;
