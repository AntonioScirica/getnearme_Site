-- Eliminazione account completa: il trigger handle_user_deletion ora rimuove
-- anche i contenuti AI / progetti / cache server dell'utente, non solo crediti
-- e quota. Senza questo, i dati restavano orfani nel DB dopo la cancellazione.
-- (La cache localStorage/IndexedDB lato client viene già svuotata da handleDelete.)

CREATE OR REPLACE FUNCTION public.handle_user_deletion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM public.teams WHERE owner_id = OLD.id AND is_active = true;
  IF v_team_id IS NOT NULL THEN PERFORM public.dissolve_team(v_team_id); END IF;
  DELETE FROM public.team_members WHERE user_id = OLD.id;

  -- Contenuti AI / progetti / cache server
  DELETE FROM public.ai_video_jobs WHERE user_id = OLD.id;
  DELETE FROM public.ai_video_events WHERE user_id = OLD.id;
  DELETE FROM public.batch_staging WHERE user_id = OLD.id;
  DELETE FROM public.staging_predictions WHERE user_id = OLD.id;
  DELETE FROM public.scheduled_posts WHERE user_id = OLD.id;
  DELETE FROM public.social_accounts WHERE user_id = OLD.id;
  DELETE FROM public.social_oauth_pending WHERE user_id = OLD.id;
  DELETE FROM public.property_3d_tours WHERE user_id = OLD.id;
  DELETE FROM public.export_events WHERE user_id = OLD.id;
  DELETE FROM public.projects WHERE user_id = OLD.id;  -- cascade -> media / batch items
  DELETE FROM public.user_ai_video_quota WHERE user_id = OLD.id;
  DELETE FROM public.user_brand WHERE user_id = OLD.id;
  DELETE FROM public.user_white_label WHERE user_id = OLD.id;
  DELETE FROM public.user_monthly_activity WHERE user_id = OLD.id;
  DELETE FROM public.ambassador_accounts WHERE user_id = OLD.id;

  -- Esistenti
  DELETE FROM public.saved_properties WHERE user_id = OLD.id;
  DELETE FROM public.staging_usage WHERE user_id = OLD.id;
  DELETE FROM public.credit_transactions WHERE user_id = OLD.id;
  DELETE FROM public.referrals WHERE referrer_id = OLD.id OR referred_id = OLD.id;
  DELETE FROM public.newsletter WHERE user_id = OLD.id;
  DELETE FROM public.user_staging_quota WHERE user_id = OLD.id;
  DELETE FROM public.user_credits WHERE user_id = OLD.id;

  IF OLD.email IS NOT NULL THEN
    DELETE FROM public.newsletter WHERE email = OLD.email;
    DELETE FROM public.daily_bonus_tokens WHERE email = OLD.email;
    DELETE FROM public.daily_bonus_sub WHERE email = OLD.email;
  END IF;

  RETURN OLD;
END; $$;
