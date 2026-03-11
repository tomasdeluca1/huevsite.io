-- Add avatar_url to sub_sites
ALTER TABLE public.sub_sites ADD COLUMN IF NOT EXISTS avatar_url TEXT;
