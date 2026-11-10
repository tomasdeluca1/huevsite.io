-- OAuth 2.1 del MCP. Los secretos (código, access, refresh, client secret)
-- se guardan solo como sha256. El cliente público no lee estas tablas.
--
-- Aplicar a mano en el SQL Editor de Supabase.
-- RLS on y sin policies: sin GRANT, anon y authenticated no entran.
-- El service role de las rutas saltea RLS.

create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text not null,
  client_uri text,
  logo_uri text,
  redirect_uris text[] not null,
  token_endpoint_auth_method text not null default 'none',
  client_secret_hash text,
  registration_source text not null,
  created_at timestamptz not null default now(),
  constraint oauth_clients_source_chk check (registration_source in ('dcr', 'cimd')),
  constraint oauth_clients_auth_chk check (token_endpoint_auth_method in ('none', 'client_secret_basic', 'client_secret_post'))
);

create table if not exists public.oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  scope text not null,
  resource text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_authorization_codes_user_idx
  on public.oauth_authorization_codes (user_id, created_at desc);

create table if not exists public.oauth_grants (
  id uuid primary key,
  family_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null,
  client_name text not null,
  scope text not null,
  resource text not null,
  access_token_hash text not null unique,
  refresh_token_hash text unique,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists oauth_grants_user_idx
  on public.oauth_grants (user_id, created_at desc);

create index if not exists oauth_grants_family_idx
  on public.oauth_grants (family_id);

alter table public.mcp_audit_log
  add column if not exists credential_id text;

create index if not exists mcp_audit_log_credential_idx
  on public.mcp_audit_log (credential_id, created_at desc);

alter table public.oauth_clients enable row level security;
alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_grants enable row level security;

revoke all on public.oauth_clients from anon, authenticated;
revoke all on public.oauth_authorization_codes from anon, authenticated;
revoke all on public.oauth_grants from anon, authenticated;
