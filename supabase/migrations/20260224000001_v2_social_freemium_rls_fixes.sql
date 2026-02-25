-- Fixes para borrar followers y nominaciones
CREATE POLICY "Usuarios pueden eliminar sus follows" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

CREATE POLICY "Usuarios eliminan nominaciones" ON public.showcase_nominations
  FOR DELETE USING (nominated_by = auth.uid());
