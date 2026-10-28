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
UPDATE public.profiles p SET show_ecosystem = false
WHERE EXISTS (
  SELECT 1 FROM public.blocks b
  WHERE b.user_id = p.id
    AND b.type = 'ecosystem'
    AND b.sub_site_id IS NULL
    AND COALESCE((b.data->>'hideHeaderEcosystem')::boolean, false)
);
