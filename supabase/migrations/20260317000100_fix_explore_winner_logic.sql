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
