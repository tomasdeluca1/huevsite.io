-- Atribución de checkout (utm_* y ref) que Lemon Squeezy devuelve en
-- meta.custom_data, y registro de reembolsos Founder (order_refunded).
-- Aplicar manualmente en el SQL Editor de Supabase. No corre sola.

create table if not exists public.lemon_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  lemon_id text not null,
  variant_id text,
  status text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lemon_purchases_event_lemon_unique unique (event_name, lemon_id)
);

create index if not exists lemon_purchases_user_id_idx
  on public.lemon_purchases (user_id);

alter table public.lemon_purchases enable row level security;

-- Sin policies para anon/authenticated: solo el service role (webhook y admin)
-- escribe y lee. El service role saltea RLS.

-- is_lifetime no estaba en el trigger de columnas bloqueadas. Sin esto, un
-- usuario autenticado puede ponerse is_lifetime = true por la API de
-- Supabase, ocupar un lugar del cupo y frenar un downgrade de suscripción.
-- SECURITY INVOKER para que current_user sea el rol de la request: el
-- service role (webhook y admin) pasa, authenticated no.
CREATE OR REPLACE FUNCTION public.enforce_is_lifetime_privilege()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated'
     AND NEW.is_lifetime IS DISTINCT FROM OLD.is_lifetime THEN
    RAISE EXCEPTION 'is_lifetime can only be changed by the billing webhook.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_is_lifetime_privilege ON public.profiles;
CREATE TRIGGER enforce_is_lifetime_privilege
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_is_lifetime_privilege();
