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
  
  -- Subscription & Pro
  subscription_tier TEXT DEFAULT 'free',
  pro_since TIMESTAMPTZ,
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  custom_domain TEXT UNIQUE,
  
  -- Gamification & Social
  builder_score INTEGER DEFAULT 0,
  twitter_share_unlocked BOOLEAN DEFAULT false,
  extra_blocks_from_share INTEGER DEFAULT 0,
  recent_colors TEXT[] DEFAULT '{}',
  has_seen_update_feb25 BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Sub-sites para usuarios PRO
CREATE TABLE IF NOT EXISTS public.sub_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- 3. Bloques del huevsite grid
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sub_site_id UUID REFERENCES public.sub_sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- hero | building | github | project | stack | metric | social | community | writing
  "order" INTEGER NOT NULL, -- orden en el grid
  col_span INTEGER DEFAULT 1, -- 1-4
  row_span INTEGER DEFAULT 1, -- 1-3
  data JSONB NOT NULL, -- contenido específico del bloque
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Social: Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (follower_id, following_id)
);

-- 5. Social: Actividades
CREATE TABLE IF NOT EXISTS public.activities (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL, 
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Perfiles públicos son visibles para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden editar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Blocks
CREATE POLICY "Bloques son visibles para todos" ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden gestionar sus propios bloques" ON public.blocks FOR ALL USING (user_id = auth.uid());

-- Políticas para sub_sites
CREATE POLICY "Los sub_sites son públicos" ON public.sub_sites FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden gestionar sus sub_sites" ON public.sub_sites FOR ALL USING (auth.uid() = user_id);

-- Políticas para Follows
CREATE POLICY "Follows visibles para todos" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Usuarios gestionan sus propios follows" ON public.follows FOR ALL USING (follower_id = auth.uid());

-- Políticas para Actividades
CREATE POLICY "Actividades visibles para todos" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Usuarios crean actividades" ON public.activities FOR INSERT WITH CHECK (user_id = auth.uid());

-- Función para actualizar el updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON public.blocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sub_sites_updated_at BEFORE UPDATE ON public.sub_sites FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
