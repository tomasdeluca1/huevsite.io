-- Migration: Add is_onboarding_test_user flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_onboarding_test_user BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_onboarding_test_user IS 'Flag to force show the onboarding experience (used for testing and huevsite user)';
