-- Le foto extra comprate coi pacchetti (add_staging_credits -> photo_credits) non
-- devono perdersi allo scatto del mese. Il reset mensile sovrascriveva
-- photo_credits = monthly_limit, cancellando gli extra. Ora tiene il massimo tra
-- saldo attuale e limite: gli extra sopra il mensile sopravvivono, e il mensile
-- si ricarica solo se sei sotto al limite.

CREATE OR REPLACE FUNCTION public.maybe_reset_monthly_quota(p_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan  TEXT;
  v_limit INTEGER;
  v_month TEXT;
  v_now   TEXT;
BEGIN
  v_now := to_char(NOW() AT TIME ZONE 'Europe/Rome', 'YYYY-MM');
  SELECT photo_plan, monthly_limit, quota_month INTO v_plan, v_limit, v_month
    FROM public.user_staging_quota WHERE user_id = p_user_id;
  IF v_plan IN ('agency_monthly','agency_quarterly','agency_annual')
     AND v_limit IS NOT NULL
     AND (v_month IS NULL OR v_month < v_now)
  THEN
    UPDATE public.user_staging_quota
       SET photo_credits = GREATEST(COALESCE(photo_credits,0), v_limit),
           quota_month   = v_now,
           updated_at    = NOW()
     WHERE user_id = p_user_id;
  END IF;
END; $$;
