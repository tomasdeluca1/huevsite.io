ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_profile_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_good_reputation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top_matchmaker BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_last_insights_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_launch_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_welcome_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_activation_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_expiring_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_expired_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_last_chance_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_free_trial_ends_at
  ON public.profiles (free_trial_ends_at);
