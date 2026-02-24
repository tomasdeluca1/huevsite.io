-- ============================================================
-- huevsite.io v2 — Social + Freemium migration
-- ============================================================

-- 1. Agregar columnas nuevas a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recent_colors      TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pro_since          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS twitter_share_unlocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extra_blocks_from_share INTEGER DEFAULT 0;

-- 2. Tabla de follows (feature flag: red social)
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows visibles para todos" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Usuarios gestionan sus propios follows" ON public.follows
  FOR ALL USING (follower_id = auth.uid());

-- 3. Tabla de actividad (feature flag: red social)
CREATE TABLE IF NOT EXISTS public.activities (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL,   -- new_project | new_block | milestone
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actividades visibles para todos" ON public.activities
  FOR SELECT USING (true);

CREATE POLICY "Sistema crea actividades de usuarios" ON public.activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Tabla de endorsements (feature flag: red social)
CREATE TABLE IF NOT EXISTS public.endorsements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill      TEXT NOT NULL,
  comment    TEXT CHECK (char_length(comment) <= 140),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (from_id, to_id, skill)
);

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Endorsements visibles para todos" ON public.endorsements
  FOR SELECT USING (true);

CREATE POLICY "Usuarios crean sus propios endorsements" ON public.endorsements
  FOR INSERT WITH CHECK (from_id = auth.uid());

CREATE POLICY "Usuarios eliminan sus propios endorsements" ON public.endorsements
  FOR DELETE USING (from_id = auth.uid());

-- 5. Tabla de nominaciones para showcase semanal
CREATE TABLE IF NOT EXISTS public.showcase_nominations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nominated_by  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week          TEXT NOT NULL,   -- formato: "2026-W08"
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, week),
  UNIQUE (nominated_by, week)
);

ALTER TABLE public.showcase_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nominaciones visibles para todos" ON public.showcase_nominations
  FOR SELECT USING (true);

CREATE POLICY "Usuarios crean nominaciones" ON public.showcase_nominations
  FOR INSERT WITH CHECK (nominated_by = auth.uid());

-- 6. Tabla de ganadores del showcase semanal
CREATE TABLE IF NOT EXISTS public.showcase_winners (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  week       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.showcase_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Winners visibles para todos" ON public.showcase_winners
  FOR SELECT USING (true);

-- Solo admins pueden insertar winners (via service role desde /admin)
