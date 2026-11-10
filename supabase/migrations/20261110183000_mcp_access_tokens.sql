-- Tokens personales para el MCP de huevsite (agentes que actualizan el
-- perfil de quien creó el token). Se guarda solo el sha256. El secreto se
-- muestra una vez en el dashboard y no vuelve a salir de la API.
--
-- Aplicar a mano en el SQL Editor de Supabase antes de usar /api/mcp.
-- No hay CLI en este repo.
--
-- RLS on. Sin policies de escritura: el cliente no inserta ni revoca directo.
-- El service role (las rutas /api/mcp y /api/mcp/tokens) saltea RLS y filtra
-- por user_id. anon y authenticated no tienen GRANT, así que ni con la anon
-- key se lee el hash.

create table if not exists public.mcp_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  token_prefix text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  constraint mcp_access_tokens_name_len check (char_length(name) between 1 and 60),
  constraint mcp_access_tokens_prefix_len check (char_length(token_prefix) between 8 and 16)
);

create index if not exists mcp_access_tokens_user_idx
  on public.mcp_access_tokens (user_id, created_at desc);

alter table public.mcp_access_tokens enable row level security;

revoke all on public.mcp_access_tokens from anon, authenticated;

-- Dueño puede listar los suyos si algún día se reabre el GRANT.
-- Igual no alcanza: el hash no está en el GRANT de abajo, y hoy no hay GRANT.
drop policy if exists mcp_tokens_select_own on public.mcp_access_tokens;
create policy mcp_tokens_select_own on public.mcp_access_tokens
  for select using (user_id = auth.uid());

create table if not exists public.mcp_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_id uuid references public.mcp_access_tokens(id) on delete set null,
  tool text not null,
  ok boolean not null,
  error_code text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint mcp_audit_log_tool_len check (char_length(tool) between 1 and 64)
);

create index if not exists mcp_audit_log_token_created_idx
  on public.mcp_audit_log (token_id, created_at desc);

create index if not exists mcp_audit_log_user_created_idx
  on public.mcp_audit_log (user_id, created_at desc);

alter table public.mcp_audit_log enable row level security;

revoke all on public.mcp_audit_log from anon, authenticated;

drop policy if exists mcp_audit_select_own on public.mcp_audit_log;
create policy mcp_audit_select_own on public.mcp_audit_log
  for select using (user_id = auth.uid());
