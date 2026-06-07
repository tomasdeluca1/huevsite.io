-- Weekly community digest:
--  1) score_snapshots — weekly snapshot of each builder's score, used to
--     compute "who gained the most points this week" (current - last snapshot).
--  2) profiles.community_digest_unsubscribed — per-user opt-out for the weekly
--     digest email. Everyone is in by default; the unsubscribe link flips it.

CREATE TABLE IF NOT EXISTS public.score_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS score_snapshots_user_time_idx
  ON public.score_snapshots (user_id, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS score_snapshots_time_idx
  ON public.score_snapshots (snapshot_at DESC);

-- Snapshots are only ever read/written by the service-role cron.
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_digest_unsubscribed BOOLEAN NOT NULL DEFAULT false;
