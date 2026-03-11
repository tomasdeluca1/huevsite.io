CREATE OR REPLACE VIEW profiles_explore AS
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
  p.is_showcase_winner as is_winner,
  (SELECT count(*) FROM follows f WHERE f.following_id = p.id) as followers_count,
  (SELECT count(*) FROM showcase_nominations sn WHERE sn.user_id = p.id) as nominations_count,
  (SELECT count(*) FROM endorsements e WHERE e.to_id = p.id) as endorsements_count,
  (SELECT count(*) FROM sub_sites s WHERE s.user_id = p.id) as subsites_count
FROM profiles p
WHERE p.username IS NOT NULL;
