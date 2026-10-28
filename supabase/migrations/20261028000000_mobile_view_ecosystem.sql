-- Vista mobile y visibilidad del ecosistema.
-- Aplicar manualmente en el SQL Editor de Supabase.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_ecosystem BOOLEAN DEFAULT true;

ALTER TABLE public.blocks
  ADD COLUMN IF NOT EXISTS mobile_order INTEGER NULL;

ALTER TABLE public.blocks
  ADD COLUMN IF NOT EXISTS visible_on TEXT NOT NULL DEFAULT 'both';

-- Idempotente: ADD CONSTRAINT no admite IF NOT EXISTS.
ALTER TABLE public.blocks
  DROP CONSTRAINT IF EXISTS blocks_visible_on_check;
ALTER TABLE public.blocks
  ADD CONSTRAINT blocks_visible_on_check
  CHECK (visible_on IN ('both', 'desktop', 'mobile'));

-- Backfill único (spec §6.8): quien tenía escondido el ecosistema con el flag
-- hideHeaderEcosystem del bloque lo conserva escondido. Desde acá manda la columna.
--
-- Es seguro correrlo dos veces: cada bloque procesado queda marcado con
-- ecosystemBackfilled en su JSONB y el UPDATE ignora los ya marcados. Sin esa
-- marca, un segundo run volvería a poner show_ecosystem = false y pisaría a
-- quien ya lo prendió de nuevo.
-- NO limpiar hideHeaderEcosystem para lograr lo mismo: esta migración se aplica
-- ANTES del deploy, y el ProfileHeader viejo todavía lee ese flag; borrarlo
-- haría reaparecer el ecosistema justo a quienes lo habían escondido.
-- Es un solo statement (CTE) para que marcar el bloque y apagar el perfil sean
-- atómicos: no puede quedar uno marcado sin apagar ni apagado sin marcar.
WITH pendientes AS (
  SELECT b.id
  FROM public.blocks b
  WHERE b.type = 'ecosystem'
    AND b.sub_site_id IS NULL
    AND COALESCE((b.data->>'hideHeaderEcosystem')::boolean, false)
    AND NOT COALESCE((b.data->>'ecosystemBackfilled')::boolean, false)
),
marcados AS (
  UPDATE public.blocks b
  SET data = b.data || '{"ecosystemBackfilled": true}'::jsonb
  FROM pendientes x
  WHERE b.id = x.id
  RETURNING b.user_id
)
UPDATE public.profiles p SET show_ecosystem = false
FROM marcados m
WHERE p.id = m.user_id;
