-- Update admin_pick_winner to STOP deleting nominations.
-- We need to keep them to calculate "Builder of the Month" and other historical stats.

CREATE OR REPLACE FUNCTION admin_pick_winner(
  p_week TEXT,
  p_winner_ids UUID[],
  p_secret TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We use the same secret for basic security as before
  IF p_secret != 'Manuel2003' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert winners ignoring conflicts of (user_id, week)
  FOR i IN 1..array_length(p_winner_ids, 1) LOOP
    INSERT INTO public.showcase_winners (user_id, week)
    VALUES (p_winner_ids[i], p_week)
    ON CONFLICT (user_id, week) DO NOTHING;

    INSERT INTO public.activities (user_id, type, data)
    VALUES (p_winner_ids[i], 'showcase_winner', jsonb_build_object('week', p_week));
  END LOOP;

  -- REMOVED: DELETE FROM public.showcase_nominations WHERE week = p_week;
  -- Keeping nominations for historical data and monthly builders.
END;
$$;
