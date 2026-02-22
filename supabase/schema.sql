-- Tablas para huevsite.io

-- 1. Perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  image TEXT,
  github_handle TEXT UNIQUE,
  accent_color TEXT DEFAULT '#C8FF00',
  layout TEXT DEFAULT 'dev_heavy',
  roles TEXT[] DEFAULT '{}', -- array de roles: developer, designer, founder, indie_hacker
  tagline TEXT,
  location TEXT,
  available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Bloques del bento grid
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- hero | building | github | project | stack | metric | social | community | writing
  "order" INTEGER NOT NULL, -- orden en el grid (order es keyword SQL, necesita comillas)
  col_span INTEGER DEFAULT 1, -- 1-4
  row_span INTEGER DEFAULT 1, -- 1-3
  data JSONB NOT NULL, -- contenido específico del bloque
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Perfiles públicos son visibles para todos" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden editar su propio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para Blocks
CREATE POLICY "Bloques son visibles para todos" ON public.blocks
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus propios bloques" ON public.blocks
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Función para actualizar el updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
