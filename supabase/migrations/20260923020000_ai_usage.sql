-- Costo AI per agente: una riga per ogni chiamata della piattaforma (lib/ai.ts).
-- RLS attiva senza policy: accesso solo da server (service role).
CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_ms INTEGER NOT NULL,
  cost_usd NUMERIC(10,6) NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_created ON ai_usage (user_id, created_at DESC);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
