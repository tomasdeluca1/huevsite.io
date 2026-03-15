-- Add source_url to sub_sites so we store what URL the AI used to generate it
ALTER TABLE public.sub_sites ADD COLUMN IF NOT EXISTS source_url TEXT;
