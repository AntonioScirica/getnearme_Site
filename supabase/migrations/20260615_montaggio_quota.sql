-- Montaggio quota: 5 free per account, illimitato sui piani a pagamento.
-- Specchia il sistema della post quota (stessa tabella user_staging_quota).

ALTER TABLE public.user_staging_quota ADD COLUMN IF NOT EXISTS montaggio_credits integer DEFAULT 5;
UPDATE public.user_staging_quota SET montaggio_credits = 5 WHERE montaggio_credits IS NULL;

CREATE OR REPLACE FUNCTION public.get_montaggio_quota_status(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID; v_plan TEXT; v_credits INTEGER; v_has_row BOOLEAN;
BEGIN
  v_owner := public.resolve_staging_quota_owner(p_user_id);
  SELECT photo_plan, montaggio_credits, true INTO v_plan, v_credits, v_has_row FROM public.user_staging_quota WHERE user_id = v_owner;
  IF public.is_paid_plan(v_plan) THEN RETURN jsonb_build_object('unlimited', true, 'remaining', NULL, 'plan', v_plan); END IF;
  IF v_has_row IS NOT TRUE THEN RETURN jsonb_build_object('unlimited', false, 'remaining', 5, 'plan', 'free'); END IF;
  RETURN jsonb_build_object('unlimited', false, 'remaining', COALESCE(v_credits, 5), 'plan', COALESCE(v_plan,'free'));
END; $$;

CREATE OR REPLACE FUNCTION public.check_and_decrement_montaggio_quota(p_user_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID; v_plan TEXT; v_credits INTEGER;
BEGIN
  v_owner := public.resolve_staging_quota_owner(p_user_id);
  SELECT photo_plan INTO v_plan FROM public.user_staging_quota WHERE user_id = v_owner;
  IF public.is_paid_plan(v_plan) THEN RETURN jsonb_build_object('allowed', true, 'unlimited', true); END IF;
  UPDATE public.user_staging_quota SET montaggio_credits = montaggio_credits - 1, updated_at = NOW() WHERE user_id = v_owner AND montaggio_credits > 0 RETURNING montaggio_credits INTO v_credits;
  IF v_credits IS NULL THEN RETURN jsonb_build_object('allowed', false, 'remaining', 0); END IF;
  RETURN jsonb_build_object('allowed', true, 'remaining', v_credits);
END; $$;

-- Free trial al signup: aggiunge anche montaggio_credits = 5.
CREATE OR REPLACE FUNCTION public.grant_free_trial() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_month TEXT := to_char(NOW() AT TIME ZONE 'Europe/Rome','YYYY-MM');
BEGIN
  INSERT INTO public.user_staging_quota (user_id, photo_plan, photo_credits, post_credits, montaggio_credits, monthly_limit, quota_month, updated_at)
  VALUES (NEW.id, 'free', 5, 5, 5, NULL, v_month, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_ai_video_quota (user_id, used, quota_month, extra_credits, extra_total, updated_at)
  VALUES (NEW.id, 0, v_month, 1, 1, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
