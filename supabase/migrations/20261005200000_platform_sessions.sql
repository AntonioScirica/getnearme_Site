-- Sessioni della piattaforma Agente Immo (05/10/2026): tempo attivo per utente e per sezione, per /metrics.
-- Scrive solo il server col service role (api/platform/heartbeat); RLS attiva senza policy = nessun accesso dal browser.
create table if not exists public.platform_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  active_seconds integer not null default 0,
  device text,
  sections jsonb not null default '{}'::jsonb
);
create index if not exists platform_sessions_user_started on public.platform_sessions (user_id, started_at desc);
alter table public.platform_sessions enable row level security;
