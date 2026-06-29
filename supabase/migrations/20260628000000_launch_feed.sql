-- Weekly launch feed: a project "launches" into an ISO week; the community
-- upvotes; launches rank within the week. Content stays in blocks.data — these
-- tables only model the launch event + votes.
--
-- Apply manually in the Supabase SQL editor (no CLI) BEFORE deploying the feed.
-- The feed/launch APIs degrade to empty/no-op if these tables are missing.

CREATE TABLE IF NOT EXISTS public.project_launches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id     uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  launch_week  text NOT NULL,                  -- ISO 'YYYY-Wxx'
  launched_at  timestamptz NOT NULL DEFAULT now(),
  scheduled    boolean NOT NULL DEFAULT false, -- Pro scheduled a future week
  featured     boolean NOT NULL DEFAULT false, -- Pro pin
  upvote_count integer NOT NULL DEFAULT 0,     -- denormalized for ranking
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (block_id, launch_week)               -- relaunch across weeks, not within
);
CREATE INDEX IF NOT EXISTS idx_project_launches_week ON public.project_launches(launch_week);
CREATE INDEX IF NOT EXISTS idx_project_launches_user ON public.project_launches(user_id);

CREATE TABLE IF NOT EXISTS public.project_upvotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_launch_id uuid NOT NULL REFERENCES public.project_launches(id) ON DELETE CASCADE,
  voter_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_launch_id, voter_id)
);
CREATE INDEX IF NOT EXISTS idx_project_upvotes_launch ON public.project_upvotes(project_launch_id);

-- Feed is public; reads open. All writes go through API routes using the
-- service-role key (which bypasses RLS), so no write policies are needed.
ALTER TABLE public.project_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_upvotes  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read launches" ON public.project_launches;
DROP POLICY IF EXISTS "public read upvotes"  ON public.project_upvotes;
CREATE POLICY "public read launches" ON public.project_launches FOR SELECT USING (true);
CREATE POLICY "public read upvotes"  ON public.project_upvotes  FOR SELECT USING (true);

GRANT SELECT ON public.project_launches, public.project_upvotes TO anon, authenticated;
