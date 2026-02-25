-- Migration: Add view for explore with counts
CREATE OR REPLACE VIEW profiles_explore AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.tagline,
  p.accent_color,
  p.pro_since,
  p.created_at,
  p.updated_at,
  (SELECT count(*) FROM follows f WHERE f.following_id = p.id) as followers_count,
  (SELECT count(*) FROM showcase_nominations sn WHERE sn.user_id = p.id) as nominations_count,
  (SELECT count(*) FROM endorsements e WHERE e.to_id = p.id) as endorsements_count
FROM profiles p
WHERE p.username IS NOT NULL;
