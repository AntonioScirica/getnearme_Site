-- Sito dell'agente online solo quando lo decide lui (switch in "Il mio sito").
-- I siti gia' con indirizzo restano online; nuovi e senza indirizzo partono spenti.
ALTER TABLE user_brand ADD COLUMN IF NOT EXISTS site_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_brand ALTER COLUMN site_published SET DEFAULT false;
UPDATE user_brand SET site_published = false WHERE portfolio_slug IS NULL;
