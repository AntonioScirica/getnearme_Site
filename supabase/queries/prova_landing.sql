-- Prova gratis della landing: quanto spendiamo e quanti si iscrivono grazie alla prova. Solo lettura (SQL editor).
-- Costi: le chiamate AI della prova sono in ai_usage senza utente (user_id null): foto (landing_demo_image) e video
-- (video_*, fal-*, anche i falliti). Prove: righe contatore landing_demo / landing_demo_video (una per IP, per sempre).
-- Iscritti: riga landing_signup scritta dalla piattaforma al primo accesso di chi ha fatto la prova (segno nel browser).
with giorni as (
  select date_trunc('day', created_at)::date giorno,
         count(*) filter (where kind = 'landing_demo' and provider = 'counter') prove_foto,
         count(*) filter (where kind = 'landing_demo_video' and provider = 'counter') prove_video,
         round(sum(cost_usd) filter (where user_id is null and provider <> 'counter')::numeric * 0.92, 2) spesa_eur
  from ai_usage where created_at > now() - interval '30 days' group by 1
),
iscritti as (
  select date_trunc('day', u.created_at)::date giorno, count(*) iscritti,
         count(*) filter (where coalesce(p.plan, 'none') <> 'none') paganti
  from ai_usage u left join platform_credits p using (user_id)
  where u.kind = 'landing_signup' and u.created_at > now() - interval '30 days' group by 1
)
select coalesce(g.giorno, i.giorno) giorno, coalesce(prove_foto, 0) prove_foto, coalesce(prove_video, 0) prove_video,
       coalesce(spesa_eur, 0) spesa_eur, coalesce(iscritti, 0) iscritti_dalla_prova, coalesce(paganti, 0) di_cui_paganti,
       case when coalesce(iscritti, 0) > 0 then round(coalesce(spesa_eur, 0) / iscritti, 2) end costo_per_iscritto_eur
from giorni g full join iscritti i using (giorno)
order by giorno desc;
