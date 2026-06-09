-- Social content pipeline tables (ported from ai-for-dumbs, account: getnearme)
-- Safe to re-run: IF NOT EXISTS everywhere. Does not touch extension tables.

-- Raw news from RSS/Twitter
CREATE TABLE IF NOT EXISTS ai_news_raw (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL UNIQUE,
  summary text,
  published_at timestamptz,
  source text NOT NULL,
  source_type text NOT NULL,
  discovered_at timestamptz DEFAULT now(),
  used boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  account_id text DEFAULT 'getnearme'
);
CREATE INDEX IF NOT EXISTS idx_news_discovered ON ai_news_raw(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source_type ON ai_news_raw(source_type);
CREATE INDEX IF NOT EXISTS idx_news_raw_account ON ai_news_raw(account_id);

-- Brand accounts (multi-brand support)
CREATE TABLE IF NOT EXISTS brand_accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  ig_handle text,
  description text,
  tone_of_voice text,
  content_strategy jsonb DEFAULT '{}',
  publish_schedule jsonb DEFAULT '{}',
  credentials jsonb DEFAULT '{}',
  autopilot boolean DEFAULT true,
  notify_telegram boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Editorial topics
CREATE TABLE IF NOT EXISTS content_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date date NOT NULL,
  rubric text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  summary text,
  source_news_id bigint REFERENCES ai_news_raw(id),
  status text NOT NULL DEFAULT 'proposed',
  template text NOT NULL DEFAULT 'pop',
  slide_data jsonb,
  telegram_message_id bigint,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  edition text DEFAULT 'morning',
  account_id text DEFAULT 'getnearme' REFERENCES brand_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_content_topics_date ON content_topics(plan_date);
CREATE INDEX IF NOT EXISTS idx_content_topics_status ON content_topics(status);
CREATE INDEX IF NOT EXISTS idx_content_topics_edition ON content_topics(plan_date, edition);
CREATE INDEX IF NOT EXISTS idx_content_topics_account ON content_topics(account_id, plan_date);

-- Generated content (rendered posts ready to publish)
CREATE TABLE IF NOT EXISTS generated_content (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id text NOT NULL,
  type text NOT NULL,
  content_data jsonb NOT NULL,
  image_urls text[],
  video_url text,
  status text NOT NULL DEFAULT 'approved',
  edit_notes text,
  error text,
  ig_post_id text,
  ig_story_id text,
  tiktok_publish_id text,
  publish_date date NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  topic_id uuid REFERENCES content_topics(id),
  account_id text DEFAULT 'getnearme' REFERENCES brand_accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_content_date ON generated_content(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_account ON generated_content(account_id, publish_date);

-- API cost tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  model text NOT NULL,
  operation text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);

-- IG performance metrics
CREATE TABLE IF NOT EXISTS post_metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id bigint REFERENCES generated_content(id),
  account_id text DEFAULT 'getnearme',
  ig_post_id text,
  publish_date date NOT NULL,
  impressions int DEFAULT 0,
  reach int DEFAULT 0,
  saves int DEFAULT 0,
  shares int DEFAULT 0,
  comments int DEFAULT 0,
  likes int DEFAULT 0,
  plays int DEFAULT 0,
  total_interactions int DEFAULT 0,
  save_rate numeric(5,4) DEFAULT 0,
  share_rate numeric(5,4) DEFAULT 0,
  engagement_rate numeric(5,4) DEFAULT 0,
  content_type text,
  rubric text,
  cta_text text,
  hook_text text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ig_post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_metrics_date ON post_metrics(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_post_metrics_account ON post_metrics(account_id, publish_date);

CREATE TABLE IF NOT EXISTS performance_insights (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id text DEFAULT 'getnearme',
  week_start date NOT NULL,
  week_end date NOT NULL,
  insights jsonb NOT NULL,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, week_start)
);

-- Storage bucket for rendered slides/stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read content" ON storage.objects
    FOR SELECT USING (bucket_id = 'content');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service write content" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'content');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service update content" ON storage.objects
    FOR UPDATE USING (bucket_id = 'content');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed account
INSERT INTO brand_accounts (id, name, ig_handle, description, tone_of_voice, autopilot, notify_telegram) VALUES
  ('getnearme', 'GetNearMe', '@getnearme_app', 'AI news e divulgazione (contenuti condivisi con just_ai per ora)', 'Ironico, diretto, divulgativo.', true, true)
ON CONFLICT (id) DO NOTHING;
