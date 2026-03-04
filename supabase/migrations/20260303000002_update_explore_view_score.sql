-- Migration: Add builder_score to profiles_explore view
DROP VIEW IF EXISTS public.profiles_explore;

CREATE OR REPLACE VIEW public.profiles_explore AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.tagline,
  p.image,
  p.accent_color,
  p.pro_since,
  p.is_winner,
  p.builder_score,
  p.created_at,
  p.updated_at,
  (SELECT count(*) FROM public.follows f WHERE f.following_id = p.id) as followers_count,
  (SELECT count(*) FROM public.showcase_nominations sn WHERE sn.user_id = p.id) as nominations_count,
  (SELECT count(*) FROM public.endorsements e WHERE e.to_id = p.id) as endorsements_count
FROM public.profiles p
WHERE p.username IS NOT NULL;
