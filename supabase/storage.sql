-- Configuración de Supabase Storage para huevsite.io

-- 1. Crear el bucket para assets (fotos de perfil, previews de proyectos, etc.)
-- Nota: En Supabase, los buckets se pueden crear vía UI o vía SQL si tenés permisos de admin.
-- Este script asume que querés manejar las políticas para un bucket llamado 'assets'.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de seguridad para el bucket 'assets'

-- Cualquiera puede ver las imágenes (es un portfolio público)
CREATE POLICY "Imágenes públicas son visibles para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

-- Solo usuarios autenticados pueden subir imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND 
    auth.role() = 'authenticated'
  );

-- Usuarios pueden actualizar sus propias imágenes
CREATE POLICY "Usuarios pueden actualizar sus propios archivos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuarios pueden borrar sus propias imágenes
CREATE POLICY "Usuarios pueden borrar sus propios archivos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assets' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
