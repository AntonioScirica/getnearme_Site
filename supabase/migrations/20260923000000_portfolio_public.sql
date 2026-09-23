-- Portfolio pubblico della nuova piattaforma: getnearme.it/a/<slug>.
-- Solo colonne nuove, nessun dato esistente modificato.
-- La pagina pubblica legge lato server (service role), quindi niente policy anon:
-- RLS di user_brand e projects resta com'e'.

ALTER TABLE user_brand
  ADD COLUMN IF NOT EXISTS portfolio_slug TEXT UNIQUE
    CHECK (portfolio_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$');

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS projects_public_by_user
  ON projects (user_id, created_at DESC) WHERE is_public;
