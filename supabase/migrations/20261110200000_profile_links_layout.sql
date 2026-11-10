-- Modo público opcional del perfil: portfolio (grilla actual) o links
-- (link in bio). El default es portfolio para no cambiar perfiles existentes.
-- link_box_style es el formato global de los botones. El override por link
-- queda en blocks.data.boxStyle, sin columna nueva.
--
-- RLS ya está activo en profiles: SELECT público y UPDATE del dueño.
-- Estas columnas son visuales, igual que accent_color. No van a la lista
-- de columnas bloqueadas por enforce_profile_column_privileges.
--
-- Aplicar en el SQL editor de Supabase antes de deployar. Si las columnas
-- no existen, profile-service reintenta el SELECT sin ellas y el perfil
-- sigue en portfolio.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_layout TEXT NOT NULL DEFAULT 'portfolio',
  ADD COLUMN IF NOT EXISTS link_box_style TEXT NOT NULL DEFAULT 'pill';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_profile_layout_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_layout_check
  CHECK (profile_layout IN ('portfolio', 'links'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_link_box_style_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_link_box_style_check
  CHECK (link_box_style IN ('pill', 'card', 'compact', 'featured', 'expandable'));

-- 20260411000000 revocó el SELECT de tabla y dejó una whitelist por columna.
GRANT SELECT (profile_layout, link_box_style) ON public.profiles TO anon, authenticated;
