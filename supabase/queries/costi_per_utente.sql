-- Costo reale per utente nel mese (ai_usage: immagini, testi, video fal, anche falliti e costi "nascosti")
-- contro crediti usati e incasso del piano. Solo lettura: si lancia dall'SQL editor di Supabase.
-- Incasso: prezzo mensile del piano (Pro contato a 59, l'annuale: il caso peggiore); pacchetti extra non inclusi.
-- Netto = incasso - Stripe (2,2% + 0,25) - tasse forfettario 24,2% (78% x (5% + 26,07%)). 1 $ = 0,92 EUR.
with mese as (select date_trunc('month', now()) as da),
costi as (
  select user_id, sum(cost_usd) usd, count(*) chiamate,
         sum(cost_usd) filter (where provider = 'fal') usd_video,
         sum(cost_usd) filter (where not ok) usd_falliti
  from ai_usage, mese where created_at >= mese.da and user_id is not null group by 1
),
crediti as (
  select user_id, -sum(delta) filter (where delta < 0) usati
  from platform_credit_events, mese where created_at >= mese.da group by 1
)
select u.email, coalesce(p.plan, 'none') piano,
       coalesce(cr.usati, 0) crediti_usati,
       round(coalesce(c.usd, 0) * 0.92, 2) costo_eur,
       round(coalesce(c.usd_video, 0) * 0.92, 2) di_cui_video_eur,
       coalesce(c.chiamate, 0) chiamate_ai,
       x.incasso,
       round(x.incasso - (x.incasso * 0.022 + case when x.incasso > 0 then 0.25 else 0 end) - x.incasso * 0.242 - coalesce(c.usd, 0) * 0.92, 2) margine_eur
from costi c
full join crediti cr using (user_id)
left join platform_credits p using (user_id)
left join auth.users u on u.id = coalesce(c.user_id, cr.user_id)
cross join lateral (select case p.plan when 'starter' then 29 when 'plus' then 49 when 'pro' then 59 else 0 end::numeric incasso) x
order by costo_eur desc;
