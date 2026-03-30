ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS border_radius TEXT DEFAULT '1.5rem';
