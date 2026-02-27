-- Fix constraint that prevented multiple users from nominating the same recipient
ALTER TABLE showcase_nominations DROP CONSTRAINT IF EXISTS showcase_nominations_user_id_week_key;

-- Replace with constraint that prevents the same user from nominating the same recipient twice in a week
-- Note: we already have showcase_nominations_nominated_by_week_key, but this is good practice
ALTER TABLE showcase_nominations ADD CONSTRAINT showcase_nominations_user_id_nominated_by_week_key UNIQUE (user_id, nominated_by, week);
