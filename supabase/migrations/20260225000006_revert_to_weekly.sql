-- Revert month to week in showcase_winners and showcase_nominations
ALTER TABLE showcase_winners RENAME COLUMN month TO week;
ALTER TABLE showcase_nominations RENAME COLUMN month TO week;

-- Revert nomination limit to 1 per user per week
ALTER TABLE showcase_nominations DROP CONSTRAINT IF EXISTS showcase_nominations_nominated_by_week_key;
ALTER TABLE showcase_nominations ADD CONSTRAINT showcase_nominations_nominated_by_week_key UNIQUE (nominated_by, week);

-- The previous constraint for (user_id, week) already exists but let's make sure
ALTER TABLE showcase_nominations DROP CONSTRAINT IF EXISTS showcase_nominations_user_id_week_key;
ALTER TABLE showcase_nominations ADD CONSTRAINT showcase_nominations_user_id_week_key UNIQUE (user_id, week);
