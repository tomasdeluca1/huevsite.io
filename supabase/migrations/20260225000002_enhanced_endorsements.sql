-- Migration: Enhance endorsements with visibility and better RLS
ALTER TABLE public.endorsements 
  ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- Update RLS policies for endorsements
DROP POLICY IF EXISTS "Endorsements visibles para todos" ON public.endorsements;
CREATE POLICY "Endorsements visibles para todos" ON public.endorsements
  FOR SELECT USING (visible = true OR to_id = auth.uid() OR from_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios crean sus propios endorsements" ON public.endorsements;
CREATE POLICY "Usuarios crean sus propios endorsements" ON public.endorsements
  FOR INSERT WITH CHECK (from_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios eliminan sus propios endorsements" ON public.endorsements;
CREATE POLICY "Usuarios pueden eliminar contenido" ON public.endorsements
  FOR DELETE USING (from_id = auth.uid() OR to_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden editar" ON public.endorsements;
CREATE POLICY "Usuarios pueden editar" ON public.endorsements
  FOR UPDATE USING (from_id = auth.uid() OR to_id = auth.uid());
