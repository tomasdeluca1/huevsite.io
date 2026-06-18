-- Structured country for builders, powering the Explore country/continent
-- filter. Stores an ISO-3166-1 alpha-2 code (e.g. 'AR', 'US'); the continent is
-- derived in app code (lib/countries.ts). NULL = not set / unknown.
--
-- Apply manually in the Supabase SQL editor (no CLI configured), BEFORE
-- deploying the country feature — the Explore view + filter reference this column.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Speed up Explore filtering by country.
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles (country);

-- Recreate the Explore view to expose `country` (views resolve their column
-- list at creation time, so ADD COLUMN alone does not surface it). Mirrors
-- 20260317000100_fix_explore_winner_logic.sql with p.country added.
DROP VIEW IF EXISTS public.profiles_explore;

CREATE VIEW public.profiles_explore AS
SELECT
  p.id,
  p.username,
  p.name,
  p.image,
  p.tagline,
  p.accent_color,
  p.pro_since,
  p.created_at,
  p.updated_at,
  p.builder_score,
  p.country,
  EXISTS(
    SELECT 1 FROM public.showcase_winners sw
    WHERE sw.user_id = p.id
    AND sw.week = (SELECT MAX(week) FROM public.showcase_winners)
  ) as is_winner,
  (SELECT count(*) FROM public.follows f WHERE f.following_id = p.id) as followers_count,
  (SELECT count(*) FROM public.showcase_nominations sn WHERE sn.user_id = p.id) as nominations_count,
  (SELECT count(*) FROM public.endorsements e WHERE e.to_id = p.id) as endorsements_count,
  (SELECT count(*) FROM public.sub_sites s WHERE s.user_id = p.id) as subsites_count
FROM public.profiles p
WHERE p.username IS NOT NULL;
