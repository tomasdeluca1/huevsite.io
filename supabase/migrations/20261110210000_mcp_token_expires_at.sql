-- Vencimiento de los tokens personales del MCP.
-- expires_at null = no vence ("Nunca"). No hay valor por omisión a propósito:
-- las filas que ya existen quedan null y siguen sin vencimiento.
--
-- La tabla puede ya tener la columna (20261110183000). IF NOT EXISTS no la pisa.
--
-- Aplicar a mano en el SQL Editor de Supabase. No hay CLI en este repo.
-- No aplicar desde la app.

alter table public.mcp_access_tokens
  add column if not exists expires_at timestamptz;

comment on column public.mcp_access_tokens.expires_at is
  'Cuando vence el token personal. Null significa que no vence.';
