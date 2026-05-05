-- Add newsletter_subscribed flag to profiles.
--
-- Going forward (per privacy policy update mayo 2026), new signups are
-- subscribed to the founder's newsletter by default. Users can opt out
-- from the dashboard or via the unsubscribe link in any newsletter email.
--
-- Existing users (created before this migration) are NOT auto-subscribed —
-- they did not consent to a marketing list at signup, so we backfill them
-- to FALSE and surface a toggle in the dashboard for explicit opt-in.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: anyone who already exists at the moment of running this
-- migration gets opted-out. New rows inserted after this point keep the
-- column default (TRUE).
UPDATE public.profiles
SET newsletter_subscribed = FALSE
WHERE newsletter_subscribed IS NOT FALSE;
