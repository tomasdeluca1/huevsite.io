-- Allow multiple nominations per month (up to 3)
ALTER TABLE showcase_nominations DROP CONSTRAINT IF EXISTS showcase_nominations_nominated_by_week_key;

-- We still want one nomination PER recipient PER month (can't nominate the same person twice)
-- The existing UNIQUE (user_id, week) already handles this if 'week' is our 'month' column.
-- Wait, let's verify the constraint names.
