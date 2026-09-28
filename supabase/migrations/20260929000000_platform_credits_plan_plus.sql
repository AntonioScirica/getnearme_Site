-- Piano Plus (29/09/2026): platform_credits accetta anche 'plus'. Gia' applicata in produzione.
alter table public.platform_credits drop constraint platform_credits_plan_check;
alter table public.platform_credits add constraint platform_credits_plan_check check (plan = any (array['none'::text, 'starter'::text, 'plus'::text, 'pro'::text]));
