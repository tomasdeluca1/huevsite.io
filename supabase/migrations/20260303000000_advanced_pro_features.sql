-- Migration: Advanced PRO Features
-- 1. Builder Score (Gamification)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS builder_score INTEGER DEFAULT 0;

-- 2. Sub-sites for PRO users
CREATE TABLE IF NOT EXISTS public.sub_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Habilitar RLS en sub_sites
ALTER TABLE public.sub_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los sub_sites son públicos" ON public.sub_sites
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus sub_sites" ON public.sub_sites
  FOR ALL USING (auth.uid() = user_id);

-- Agregar sub_site_id a blocks
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS sub_site_id UUID REFERENCES public.sub_sites(id) ON DELETE CASCADE;

-- 3. Tabla para el feed de lanzamientos (Product Hunt LATAM)
CREATE TABLE IF NOT EXISTS public.launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sub_site_id UUID REFERENCES public.sub_sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en launches
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lanzamientos son públicos" ON public.launches
  FOR SELECT USING (true);

CREATE POLICY "Usuarios gestionan sus lanzamientos" ON public.launches
  FOR ALL USING (auth.uid() = user_id);

-- Tabla para upvotes (para no permitir múltiples upvotes)
CREATE TABLE IF NOT EXISTS public.launch_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(launch_id, user_id)
);

ALTER TABLE public.launch_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upvotes públicos" ON public.launch_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden votar" ON public.launch_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden quitar voto" ON public.launch_upvotes
  FOR DELETE USING (auth.uid() = user_id);
