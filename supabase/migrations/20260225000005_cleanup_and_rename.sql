-- Rename week column to month in showcase_winners and showcase_nominations
ALTER TABLE showcase_winners RENAME COLUMN week TO month;
ALTER TABLE showcase_nominations RENAME COLUMN week TO month;

-- Remove recent_colors from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS recent_colors;

-- Set 'huevsite' as the winner of the month
INSERT INTO showcase_winners (user_id, month)
SELECT id, '2026-02' FROM profiles WHERE username = 'huevsite'
ON CONFLICT (user_id) DO UPDATE SET month = EXCLUDED.month;

UPDATE profiles SET is_monthly_winner = true, winner_month = '2026-02' WHERE username = 'huevsite';

