-- Add winner of the month fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_monthly_winner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winner_month TEXT; -- format 'YYYY-MM'

-- Index for performance when fetching winner on landing
CREATE INDEX IF NOT EXISTS idx_profiles_is_monthly_winner ON profiles(is_monthly_winner) WHERE is_monthly_winner = true;
