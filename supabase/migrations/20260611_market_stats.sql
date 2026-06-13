-- Weekly market stats from ISTAT / ECB open data
-- Used by stats template for social posts targeting real estate agents

CREATE TABLE IF NOT EXISTS market_stats (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id text DEFAULT 'getnearme',
  indicator text NOT NULL,        -- 'ipab_index', 'ipab_yoy', 'compravendite', 'mortgage_rate'
  period text NOT NULL,            -- '2026-Q1', '2026-03', etc.
  region text DEFAULT 'IT',        -- 'IT' = national, region codes for breakdown
  value numeric(12, 4) NOT NULL,
  prev_value numeric(12, 4),       -- previous period for delta calc
  unit text,                       -- '%', 'index', 'count', 'rate'
  source text NOT NULL,            -- 'ISTAT_IPAB', 'ISTAT_NOTARIAL', 'ECB_MIR'
  raw_data jsonb DEFAULT '{}',
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(indicator, period, region)
);

CREATE INDEX IF NOT EXISTS idx_market_stats_indicator ON market_stats(indicator, period DESC);
CREATE INDEX IF NOT EXISTS idx_market_stats_fetched ON market_stats(fetched_at DESC);
