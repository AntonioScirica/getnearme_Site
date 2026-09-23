-- Nome dell'agente scelto all'onboarding della nuova piattaforma; da qui nasce portfolio_slug.
ALTER TABLE user_brand ADD COLUMN IF NOT EXISTS display_name TEXT CHECK (char_length(display_name) <= 80);
