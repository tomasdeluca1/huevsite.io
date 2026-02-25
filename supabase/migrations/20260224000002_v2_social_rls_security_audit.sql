-- Security audit para tables de social y freemium
-- Asegurar delete para activities
CREATE POLICY "Usuarios pueden borrar su propia actividad" ON public.activities
  FOR DELETE USING (user_id = auth.uid());

-- Permitir a usuarios modificar sus pro_since (eventual webhook de stripe lo hara pero por ahora auth.uid)
CREATE POLICY "Usuarios edit profiles" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
