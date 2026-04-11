-- Security hardening — fixes from external pentest report (2026-04-10)
-- Addresses: C1, C2, C3, C4, C5, H2, H3, H5, M2, M3
--
-- Strategy:
--   * Strip sensitive PII columns from direct REST access (anon/authenticated)
--   * Lock down tables that should only be reached via service-role API routes
--   * Extend the privilege-escalation trigger on profiles to cover all
--     gamification + monetization fields
--   * Restrict the score RPCs to service-role / authenticated as appropriate
--
-- Service role bypasses ALL of these restrictions, so any backend code that
-- needs full access must use the SUPABASE_SERVICE_ROLE_KEY client. The
-- companion code change in this PR routes lib/profile-service.ts,
-- lib/score-service.ts and lib/showcase-service.ts through the service-role
-- client.

-- ============================================================================
-- 1. PROFILES — column-level SELECT grants (C4, M2)
-- ============================================================================
-- Default Supabase grants `SELECT ON profiles TO anon, authenticated` apply
-- to ALL columns. The RLS policy `Perfiles públicos son visibles para todos`
-- allows the rows to be read, so anyone with the anon key can dump email,
-- billing IDs, referral codes and credit balances.
--
-- Fix: revoke the table-level SELECT grant and re-grant only the column
-- whitelist below. RLS USING(true) still applies to row visibility.

REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  -- Identity & display
  id,
  username,
  name,
  image,
  github_handle,
  -- Visual customization
  accent_color,
  layout,
  border_radius,
  roles,
  recent_colors,
  -- Public profile fields
  tagline,
  location,
  available,
  -- Public flags
  twitter_share_unlocked,
  extra_blocks_from_share,
  has_seen_update_feb25,
  welcome_tweet_sent,
  is_onboarding_test_user,
  -- Subscription (badge visibility)
  subscription_tier,
  pro_since,
  custom_domain,
  -- Public gamification
  builder_score,
  is_monthly_winner,
  winner_month,
  is_profile_verified,
  has_good_reputation,
  is_top_matchmaker,
  -- Trial state (used by trial banners and pro-access checks)
  free_trial_started_at,
  free_trial_ends_at,
  free_trial_claimed_at,
  free_trial_last_insights_viewed_at,
  -- Referral state (NOT the code itself)
  pro_referrals_count,
  referral_reward_expires_at,
  -- Timestamps
  created_at,
  updated_at
) ON public.profiles TO anon, authenticated;

-- Excluded (service-role only — the critical PII / secrets):
--   email                                  PII
--   lemon_squeezy_customer_id              billing
--   lemon_squeezy_subscription_id          billing
--   referral_code                          per-user secret (used as a join key)
--   referred_by                            attribution privacy
--   ai_credits                             per-user quota (could enable abuse)
--   free_trial_welcome_email_sent_at       internal tracking
--   free_trial_launch_email_sent_at        internal tracking
--   free_trial_activation_email_sent_at    internal tracking
--   free_trial_expiring_email_sent_at      internal tracking

-- ============================================================================
-- 2. PROFILES — extend privilege-escalation trigger (C1)
-- ============================================================================
-- The previous migration (20260410000002_fix_profile_column_privilege_escalation)
-- only blocked builder_score, subscription_tier, pro_since and
-- lemon_squeezy_*. The pentest report flagged ai_credits, is_profile_verified
-- and other gamification flags. Extend the trigger to cover everything that
-- should never be writable by an authenticated user via direct REST.

CREATE OR REPLACE FUNCTION public.enforce_profile_column_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce on direct authenticated-user updates.
  -- service_role, postgres, and SECURITY DEFINER function owners are trusted.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- Score & gamification
  IF NEW.builder_score IS DISTINCT FROM OLD.builder_score THEN
    RAISE EXCEPTION 'builder_score is read-only. Use the recompute_builder_score() RPC.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.is_monthly_winner IS DISTINCT FROM OLD.is_monthly_winner THEN
    RAISE EXCEPTION 'is_monthly_winner is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.winner_month IS DISTINCT FROM OLD.winner_month THEN
    RAISE EXCEPTION 'winner_month is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_profile_verified IS DISTINCT FROM OLD.is_profile_verified THEN
    RAISE EXCEPTION 'is_profile_verified is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.has_good_reputation IS DISTINCT FROM OLD.has_good_reputation THEN
    RAISE EXCEPTION 'has_good_reputation is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_top_matchmaker IS DISTINCT FROM OLD.is_top_matchmaker THEN
    RAISE EXCEPTION 'is_top_matchmaker is read-only.' USING ERRCODE = '42501';
  END IF;

  -- Subscription & billing
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'subscription_tier can only be changed by the billing webhook.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.pro_since IS DISTINCT FROM OLD.pro_since THEN
    RAISE EXCEPTION 'pro_since can only be changed by the billing webhook.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.lemon_squeezy_customer_id IS DISTINCT FROM OLD.lemon_squeezy_customer_id THEN
    RAISE EXCEPTION 'lemon_squeezy_customer_id is read-only for users.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.lemon_squeezy_subscription_id IS DISTINCT FROM OLD.lemon_squeezy_subscription_id THEN
    RAISE EXCEPTION 'lemon_squeezy_subscription_id is read-only for users.'
      USING ERRCODE = '42501';
  END IF;

  -- Credits & referrals
  IF NEW.ai_credits IS DISTINCT FROM OLD.ai_credits THEN
    RAISE EXCEPTION 'ai_credits is read-only. Credits are spent via API endpoints.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'referral_code is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.pro_referrals_count IS DISTINCT FROM OLD.pro_referrals_count THEN
    RAISE EXCEPTION 'pro_referrals_count is read-only for users.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.referral_reward_expires_at IS DISTINCT FROM OLD.referral_reward_expires_at THEN
    RAISE EXCEPTION 'referral_reward_expires_at is read-only.' USING ERRCODE = '42501';
  END IF;

  -- Free trial state (driven by /api/trial/claim and the lifecycle cron)
  IF NEW.free_trial_claimed_at IS DISTINCT FROM OLD.free_trial_claimed_at THEN
    RAISE EXCEPTION 'free_trial_claimed_at is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.free_trial_started_at IS DISTINCT FROM OLD.free_trial_started_at THEN
    RAISE EXCEPTION 'free_trial_started_at is read-only.' USING ERRCODE = '42501';
  END IF;
  IF NEW.free_trial_ends_at IS DISTINCT FROM OLD.free_trial_ends_at THEN
    RAISE EXCEPTION 'free_trial_ends_at is read-only.' USING ERRCODE = '42501';
  END IF;

  -- Share-unlock state (driven by /api/social/share-unlock with tweet
  -- verification). Block direct REST writes so a user can't grant themselves
  -- bonus blocks.
  IF NEW.twitter_share_unlocked IS DISTINCT FROM OLD.twitter_share_unlocked THEN
    RAISE EXCEPTION 'twitter_share_unlocked is read-only. Use the share-unlock API.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.extra_blocks_from_share IS DISTINCT FROM OLD.extra_blocks_from_share THEN
    RAISE EXCEPTION 'extra_blocks_from_share is read-only. Use the share-unlock API.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger already exists from the previous migration; CREATE OR REPLACE on
-- the function is enough.

-- ============================================================================
-- 3. BLOG_POSTS — fix permissive ALL policy (C2, C5)
-- ============================================================================
-- The original policy `service_role_manage_posts FOR ALL USING (true)` did
-- NOT include `TO service_role`, so it applies to ALL roles — meaning anon
-- and authenticated users could PATCH/DELETE/INSERT blog posts directly via
-- the REST API.
--
-- Fix: drop and recreate with TO service_role. The `read_published_posts`
-- policy (USING is_published = true) is correct and remains.

DROP POLICY IF EXISTS "service_role_manage_posts" ON public.blog_posts;

CREATE POLICY "blog_posts_service_role_all"
  ON public.blog_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. BUILDER_INTERVIEWS — drop public read/update (C3)
-- ============================================================================
-- The original policies `read_interview_by_token` and
-- `update_interview_by_token` used `USING (true)`, exposing the entire
-- table (including tokens, emails, full responses) to anonymous REST clients
-- — which could also PATCH any interview.
--
-- All legitimate access flows through API routes that use the service role
-- (`app/api/builder-interview/[token]/*` and `app/api/admin/builder-interview/*`).
-- Drop the public policies; reads/writes from anon and authenticated are
-- denied by default once no policy permits them.

DROP POLICY IF EXISTS "read_interview_by_token" ON public.builder_interviews;
DROP POLICY IF EXISTS "update_interview_by_token" ON public.builder_interviews;
DROP POLICY IF EXISTS "service_role_insert" ON public.builder_interviews;

CREATE POLICY "builder_interviews_service_role_all"
  ON public.builder_interviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. PROFILE_VISITORS — restrict INSERT to service role (H5)
-- ============================================================================
-- The previous policy `Service can insert visitors WITH CHECK (true)` had
-- no role restriction, so any authenticated user could fabricate visitor
-- records to inflate analytics.
--
-- All visitor tracking lives in lib/analytics-service.ts which already uses
-- the service-role client.

DROP POLICY IF EXISTS "Service can insert visitors" ON public.profile_visitors;

CREATE POLICY "profile_visitors_service_role_insert"
  ON public.profile_visitors
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 6. SHOWCASE_NOMINATIONS — restrict SELECT to service role (M3)
-- ============================================================================
-- Knowing who voted for whom is privacy-sensitive. Reads happen via
-- lib/showcase-service.ts which is updated to use the service-role client.
-- INSERT/DELETE policies (where `nominated_by = auth.uid()`) remain so
-- users can still vote/un-vote.
-- showcase_winners stays publicly readable (intended public data).

DROP POLICY IF EXISTS "Nominaciones visibles para todos" ON public.showcase_nominations;

-- ============================================================================
-- 7. RPC recompute_builder_score — restrict to service role (H2)
-- ============================================================================
-- Any authenticated user could call this RPC with an arbitrary target_user_id.
-- We can't add an `auth.uid() = target_user_id` check inside the function
-- because legitimate flows recompute OTHER users' scores (e.g. recomputing
-- the recipient of an endorsement). Instead, lock the RPC to service-role
-- only — lib/score-service.ts is updated to call it via the service-role
-- client.

REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_builder_score(UUID) TO service_role;

-- ============================================================================
-- 8. RPC get_builder_score_breakdown — block anon (H3)
-- ============================================================================
-- The breakdown is shown in the ScoreInfoModal on profile pages, which is
-- only meaningful for logged-in users that want to understand the gamification
-- system. Block anon entirely; keep authenticated.

REVOKE EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) TO authenticated, service_role;
