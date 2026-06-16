-- ============================================================================
-- Tier split: Individuale / Agenzia
-- ============================================================================
-- Prima del split esisteva UN solo tier a pagamento (€59/€590) salvato come
-- subscription_type 'agency_monthly' / 'agency_annual'.
--
-- Dopo il split:
--   - Individuale (€59/€590)  -> subscription_type 'individual_monthly' / 'individual_annual'
--   - Agenzia    (€399/€3588) -> subscription_type 'agency_monthly' / 'agency_annual' (NUOVI prezzi, con Team)
--
-- I paganti attuali a €59/€590 vanno quindi RINOMINATI a individual_*, altrimenti
-- col nuovo schema risulterebbero Agenzia (e otterrebbero il Team).
--
-- !!! ORDINE CRITICO !!!
-- Eseguire QUESTA migrazione INSIEME al deploy del webhook aggiornato
-- (supabase/functions/stripe-webhook: PRICE_TO_TIER ripuntato + nuovi price IDs
-- Agenzia). Se il webhook vecchio resta attivo, il prossimo evento Stripe
-- (rinnovo/update) riscrive 'agency_monthly' sui clienti €59.
-- ============================================================================

BEGIN;

-- 1) Piano (user_credits): €59/€590 -> individual_*
UPDATE public.user_credits
SET subscription_type = 'individual_monthly'
WHERE subscription_type = 'agency_monthly';

UPDATE public.user_credits
SET subscription_type = 'individual_annual'
WHERE subscription_type = 'agency_annual';

-- 2) Piano foto (user_staging_quota.photo_plan): stesso rename
UPDATE public.user_staging_quota
SET photo_plan = 'individual_monthly'
WHERE photo_plan = 'agency_monthly';

UPDATE public.user_staging_quota
SET photo_plan = 'individual_annual'
WHERE photo_plan = 'agency_annual';

-- 3) Team: 5 utenti inclusi (era default 10). Solo i team col default invariato.
ALTER TABLE public.teams ALTER COLUMN max_members SET DEFAULT 5;
UPDATE public.teams SET max_members = 5 WHERE max_members = 10;

COMMIT;

-- NOTE:
-- - Se esistono colonne per il tier "in pausa" (es. paused_subscription_type),
--   applicare lo stesso rename anche lì prima di riattivare le sub in pausa.
-- - Le quote Agenzia più alte (1000 foto / 12 video) sono gestite dal webhook
--   (PLAN_MONTHLY_LIMITS) e/o da operational_config: vedi il webhook aggiornato.
