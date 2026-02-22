-- Migración: Actualizar schema a la especificación final
-- Ejecutar esto si ya tenés datos en la DB

BEGIN;

-- 1. Actualizar tabla profiles
-- Renombrar display_name → name
ALTER TABLE public.profiles RENAME COLUMN display_name TO name;

-- Renombrar avatar_url → image
ALTER TABLE public.profiles RENAME COLUMN avatar_url TO image;

-- Agregar columnas faltantes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_handle TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'dev_heavy';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT false;

-- Eliminar columna status (reemplazada por available)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;

-- 2. Actualizar tabla blocks
-- Renombrar profile_id → user_id
ALTER TABLE public.blocks RENAME COLUMN profile_id TO user_id;

-- Renombrar position → order
ALTER TABLE public.blocks RENAME COLUMN position TO "order";

-- Renombrar content → data
ALTER TABLE public.blocks RENAME COLUMN content TO data;

-- Agregar columnas faltantes
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS col_span INTEGER DEFAULT 1;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS row_span INTEGER DEFAULT 1;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- Eliminar columna size (ahora se usa col_span/row_span)
ALTER TABLE public.blocks DROP COLUMN IF EXISTS size;

-- 3. Re-crear políticas RLS con los nuevos nombres de columna
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus propios bloques" ON public.blocks;

CREATE POLICY "Usuarios pueden gestionar sus propios bloques" ON public.blocks
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

COMMIT;
