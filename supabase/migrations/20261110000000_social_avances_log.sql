-- Log del cron de avances de builders (X + LinkedIn + Instagram).
-- Una fila por corrida: qué pieza se eligió, a dónde salió, ids y errores.
-- Aplicar a mano en el SQL Editor de Supabase antes de prender
-- AVANCES_CRON_ENABLED. No hay CLI en este repo.
--
-- RLS on y sin policies: el cliente no lee ni escribe. Solo el service role
-- del cron (que saltea RLS).

create table if not exists public.social_avances_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  run_date date not null,
  user_id uuid references public.profiles(id) on delete set null,
  builder_username text,
  -- null solo en corridas skipped sin pieza (no_signal).
  source_type text,
  source_id uuid,
  title text,
  image_url text,
  include_founder_cta boolean not null default false,
  status text not null,
  skip_reason text,
  payload jsonb,
  x_result text,
  linkedin_result text,
  instagram_result text,
  constraint social_avances_log_source_type_chk
    check (source_type is null or source_type in ('launch', 'new_project', 'update')),
  constraint social_avances_log_status_chk
    check (status in ('posted', 'skipped', 'failed', 'preview'))
);

-- Una publicación por fuente. preview/skipped/failed no ocupan el cupo.
create unique index if not exists social_avances_log_posted_source_uidx
  on public.social_avances_log (source_type, source_id)
  where status = 'posted' and source_id is not null;

-- Una publicación por día ART. force=1 puede publicar de nuevo, pero el
-- insert de la segunda fila posted choca acá a propósito.
create unique index if not exists social_avances_log_posted_run_date_uidx
  on public.social_avances_log (run_date)
  where status = 'posted';

create index if not exists social_avances_log_user_published_idx
  on public.social_avances_log (user_id, published_at desc);

alter table public.social_avances_log enable row level security;

revoke all on public.social_avances_log from anon, authenticated;
