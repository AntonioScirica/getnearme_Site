-- Automated blog pipeline: curated topic queue + AI-generated posts with a
-- quality gate before publish. See plan: blog automatico SEO/GEO.

CREATE TABLE IF NOT EXISTS blog_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_hint TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN
    ('ai-staging','ai-video','social-media','reports-analytics','ai-avatar','agency-productivity','comparison-geo')),
  product_hook TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','used')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_topics_queue
  ON blog_topics(created_at) WHERE status = 'queued';

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES blog_topics(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'it',
  title TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  faq_items JSONB NOT NULL DEFAULT '[]',
  pillar TEXT NOT NULL,
  product_hook TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated','scheduled','published','pending_review','rejected')),
  quality_score NUMERIC(3,1),
  quality_result JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (slug, locale)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_status ON blog_posts(locale, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON blog_posts(published_at DESC) WHERE status = 'published';

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_topics ENABLE ROW LEVEL SECURITY;

-- Public can read only published posts. All writes (and all of blog_topics)
-- go through edge functions using the service role, which bypasses RLS —
-- no write policy is defined on purpose.
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published');

-- Atomically pops the oldest queued topic (FOR UPDATE SKIP LOCKED so a
-- concurrent cron run can never double-pick the same row) and marks it used.
CREATE OR REPLACE FUNCTION pop_blog_topic()
RETURNS blog_topics
LANGUAGE plpgsql
AS $$
DECLARE
  picked blog_topics;
BEGIN
  SELECT * INTO picked FROM blog_topics
  WHERE status = 'queued'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF picked.id IS NOT NULL THEN
    UPDATE blog_topics SET status = 'used' WHERE id = picked.id;
  END IF;

  RETURN picked;
END;
$$;

-- Seed topic queue — cluster order matters (ai-staging first, complete,
-- before moving to the next pillar) for topical authority.
INSERT INTO blog_topics (title_hint, target_keyword, pillar, product_hook) VALUES
  ('Home staging virtuale: guida pratica per agenzie immobiliari nel 2026', 'home staging virtuale', 'ai-staging', 'AI home staging'),
  ('Come arredare virtualmente una casa vuota per venderla più velocemente', 'arredare virtualmente casa', 'ai-staging', 'AI home staging'),
  ('Staging virtuale vs staging fisico: costi, tempi e ROI a confronto', 'home staging virtuale prezzi', 'ai-staging', 'AI home staging'),
  ('Video immobiliari con l''AI: creare un video annuncio senza videomaker', 'video annunci immobiliari AI', 'ai-video', 'AI video listing'),
  ('Quanto costa un video professionale per un annuncio (e come risparmiare con l''AI)', 'costo video immobiliare', 'ai-video', 'AI video listing'),
  ('5 errori da evitare nei video di presentazione immobili', 'video presentazione immobili', 'ai-video', 'AI video listing'),
  ('Calendario editoriale social per agenti immobiliari: cosa pubblicare ogni settimana', 'social media agente immobiliare', 'social-media', 'Template post social'),
  ('Instagram per agenti immobiliari: template pronti che aumentano i contatti', 'template post immobiliari instagram', 'social-media', 'Template post social'),
  ('Più lead da Facebook e Instagram senza un social media manager', 'lead generation agenzia immobiliare social', 'social-media', 'Template post social'),
  ('Report di zona automatici: presentare un''analisi di mercato ai clienti', 'report analisi di zona immobiliare', 'reports-analytics', 'Report PDF brandizzati'),
  ('PDF di valutazione immobiliare: cosa deve contenere per convincere il venditore', 'report valutazione immobiliare pdf', 'reports-analytics', 'Report PDF brandizzati'),
  ('Analisi di mercato immobiliare: leggere i dati della tua zona nel 2026', 'analisi mercato immobiliare', 'reports-analytics', 'Report PDF brandizzati'),
  ('Avatar AI per agenti immobiliari: presentare un immobile senza girare un video', 'avatar ai agente immobiliare', 'ai-avatar', 'Avatar AI video'),
  ('Video di presentazione personale senza mostrarsi in camera', 'video presentazione agente immobiliare AI', 'ai-avatar', 'Avatar AI video'),
  ('Gestire più collaboratori in agenzia: strumenti AI per il lavoro di squadra', 'strumenti ai agenzia immobiliare team', 'agency-productivity', 'Piani multi-seat'),
  ('Quanto tempo perde un''agenzia senza strumenti AI (e come recuperarlo)', 'produttivita agenzia immobiliare ai', 'agency-productivity', 'Piani multi-seat'),
  ('Onboarding di nuovi agenti: standardizzare contenuti e report', 'onboarding agenti immobiliari', 'agency-productivity', 'Piani multi-seat'),
  ('I migliori strumenti AI per agenzie immobiliari italiane nel 2026', 'migliori strumenti ai agenzie immobiliari', 'comparison-geo', 'Piattaforma all-in-one'),
  ('GetNearMe vs Canva vs strumenti gratuiti: cosa conviene a un agente', 'getnearme vs canva', 'comparison-geo', 'Piattaforma all-in-one'),
  ('AI per l''immobiliare in Italia: quali strumenti usano davvero le agenzie nel 2026', 'ai immobiliare italia', 'comparison-geo', 'Piattaforma all-in-one');
