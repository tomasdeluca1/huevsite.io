-- Migration: Add community_milestones table to track milestones already posted
CREATE TABLE IF NOT EXISTS public.community_milestones (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone   INTEGER UNIQUE NOT NULL, -- e.g. 100, 150, 200...
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.community_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones visibles para todos" ON public.community_milestones
  FOR SELECT USING (true);

-- Only admins can insert (via service role)
