-- GitHub commits leaderboard: expose per-user commit counts on the Explore view
-- so the leaderboard can rank by them. Commit counts live in each user's github
-- block JSONB (blocks.data->'stats'), so we extract them here as view columns.
--
-- Apply manually in the Supabase SQL editor (no CLI configured) BEFORE deploying
-- the commits leaderboard. The casts are regex-guarded so a single malformed
-- value can never error the whole view (which would 404 every Explore query).
--
-- Mirrors 20260618000000_profile_country.sql and adds:
--   github_commits_year  = stats.commitsThisYear (rolling 12-month total)
--   github_commits_month = count of the most recent month in stats.commitsByMonth
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
  (SELECT count(*) FROM public.sub_sites s WHERE s.user_id = p.id) as subsites_count,
  COALESCE((
    SELECT MAX(
      CASE WHEN b.data->'stats'->>'commitsThisYear' ~ '^[0-9]+$'
           THEN (b.data->'stats'->>'commitsThisYear')::int
           ELSE 0 END
    )
    FROM public.blocks b
    WHERE b.user_id = p.id
      AND b.type = 'github'
      AND b.visible = true
      AND b.sub_site_id IS NULL
  ), 0) as github_commits_year,
  COALESCE((
    SELECT (elem->>'count')::int
    FROM public.blocks b
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(b.data->'stats'->'commitsByMonth') = 'array'
           THEN b.data->'stats'->'commitsByMonth'
           ELSE '[]'::jsonb END
    ) elem
    WHERE b.user_id = p.id
      AND b.type = 'github'
      AND b.visible = true
      AND b.sub_site_id IS NULL
      AND elem->>'count' ~ '^[0-9]+$'
    ORDER BY elem->>'month' DESC
    LIMIT 1
  ), 0) as github_commits_month
FROM public.profiles p
WHERE p.username IS NOT NULL;
