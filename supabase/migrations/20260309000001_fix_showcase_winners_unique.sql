-- Fix: showcase_winners debería permitir que un usuario gane en múltiples semanas.
-- El constraint original era UNIQUE(user_id), lo que impedía que un ganador anterior
-- volviera a ganar en un empate futuro.
-- Cambiamos a UNIQUE(user_id, week) para que el único constraint sea no repetir
-- el mismo usuario en la misma semana.

-- 1. Eliminar el constraint único actual sobre user_id
ALTER TABLE public.showcase_winners
  DROP CONSTRAINT IF EXISTS showcase_winners_user_id_key;

-- 2. Crear constraint compuesto (user_id, week)
ALTER TABLE public.showcase_winners
  ADD CONSTRAINT showcase_winners_user_id_week_key UNIQUE (user_id, week);

-- 3. Actualizar la RPC para usar el nuevo conflict target
CREATE OR REPLACE FUNCTION admin_pick_winner(
  p_week TEXT,
  p_winner_ids UUID[],
  p_secret TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_secret != 'Manuel2003' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insertar ganadores ignorando conflictos de (user_id, week)
  FOR i IN 1..array_length(p_winner_ids, 1) LOOP
    INSERT INTO public.showcase_winners (user_id, week)
    VALUES (p_winner_ids[i], p_week)
    ON CONFLICT (user_id, week) DO NOTHING;

    INSERT INTO public.activities (user_id, type, data)
    VALUES (p_winner_ids[i], 'showcase_winner', jsonb_build_object('week', p_week));
  END LOOP;

  -- Borrar nominaciones de esa semana
  DELETE FROM public.showcase_nominations WHERE week = p_week;
END;
$$;

-- 4. Insertar manualmente al tercer ganador de W10 que fue omitido (el usuario con empate que ya había ganado W09)
-- NOTA: Reemplazá el UUID con el user_id real de "huevsite" (el usuario faltante en W10)
-- Podés obtenerlo con: SELECT id FROM profiles WHERE username = 'huevsite';
-- INSERT INTO public.showcase_winners (user_id, week)
-- VALUES ('<UUID_DEL_USUARIO>', '2026-W10')
-- ON CONFLICT (user_id, week) DO NOTHING;
