-- Owners can hard-delete their own blocks (projects live in public.blocks;
-- there is no soft-delete column). The FOR ALL policy already allowed this.
-- Name DELETE on its own so a later rewrite of the manage-all policy cannot
-- drop the owner's delete path. Dependent rows (project_launches,
-- project_upvotes, analytics_events) must go with the block.

DROP POLICY IF EXISTS "Usuarios pueden borrar sus propios bloques" ON public.blocks;

CREATE POLICY "Usuarios pueden borrar sus propios bloques"
  ON public.blocks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT DELETE ON public.blocks TO authenticated;

-- Recreate any foreign key that points at blocks(id) without ON DELETE CASCADE.
-- A single-column FK only: composite keys are left alone.
DO $$
DECLARE
  cons record;
BEGIN
  FOR cons IN
    SELECT c.conname,
           c.conrelid::regclass AS tbl,
           a.attname AS col
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.blocks'::regclass
      AND c.confdeltype <> 'c'
      AND array_length(c.conkey, 1) = 1
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', cons.tbl, cons.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.blocks(id) ON DELETE CASCADE',
      cons.tbl, cons.conname, cons.col
    );
  END LOOP;
END $$;
