CREATE OR REPLACE FUNCTION admin_pick_winner(
  p_week TEXT,
  p_winner_ids UUID[],
  p_secret TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar secreto para evitar que llamen al RPC directo desde el cliente
  -- Se asume que el backend envia ADMIN_SECRET (Manuel2003)
  IF p_secret != 'Manuel2003' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insertar ganadores ignorando conflictos
  FOR i IN 1..array_length(p_winner_ids, 1) LOOP
    INSERT INTO public.showcase_winners (user_id, week)
    VALUES (p_winner_ids[i], p_week)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.activities (user_id, type, data)
    VALUES (p_winner_ids[i], 'showcase_winner', jsonb_build_object('week', p_week));
  END LOOP;

  -- Borrar nominaciones
  DELETE FROM public.showcase_nominations WHERE week = p_week;
END;
$$;
