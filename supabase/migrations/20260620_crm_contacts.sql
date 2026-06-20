-- CRM contacts for the sales team (Francesco/Alan/Filippo). Accessed only
-- server-side via the service role (/api/crm), so no RLS policies needed.
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_id text not null default 'getnearme',
  owner text,                       -- Francesco / Alan / Filippo
  contact_name text not null,
  agency text,
  phone text,
  email text,
  city text,
  status text not null default 'da_contattare',  -- da_contattare/contattato/demo/trattativa/vinto/perso/non_interessato
  source text,                      -- Chiamata a freddo / Referral / Instagram / Fiera / Sito / Altro
  notes text,
  next_action_at date,
  plan text,                        -- individual / agency
  value_eur numeric
);
create index if not exists crm_contacts_account_idx on public.crm_contacts(account_id);
create index if not exists crm_contacts_status_idx on public.crm_contacts(status);
