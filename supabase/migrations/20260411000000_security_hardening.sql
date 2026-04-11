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

-- The whitelist below is generated dynamically: we only GRANT columns that
-- actually exist in the live profiles table. This makes the migration safe
-- against schema drift between environments (a column listed in schema.sql
-- but never migrated to prod won't break the GRANT).
--
-- Sensitive columns are NEVER added even if present:
--   email, lemon_squeezy_customer_id, lemon_squeezy_subscription_id,
--   referral_code, referred_by, ai_credits, and any
--   free_trial_*_email_sent_at tracking column.

DO $$
DECLARE
  v_public_columns TEXT[] := ARRAY[
    -- Identity & display
    'id', 'username', 'name', 'image', 'github_handle',
    -- Visual customization
    'accent_color', 'layout', 'border_radius', 'roles', 'recent_colors',
    -- Public profile fields
    'tagline', 'location', 'available',
    -- Public flags
    'twitter_share_unlocked', 'extra_blocks_from_share',
    'has_seen_update_feb25', 'welcome_tweet_sent', 'is_onboarding_test_user',
    -- Subscription (badge visibility)
    'subscription_tier', 'pro_since', 'custom_domain',
    -- Public gamification
    'builder_score', 'is_monthly_winner', 'winner_month',
    'is_profile_verified', 'has_good_reputation', 'is_top_matchmaker',
    -- Trial state (used by trial banners and pro-access checks)
    'free_trial_started_at', 'free_trial_ends_at', 'free_trial_claimed_at',
    'free_trial_last_insights_viewed_at',
    -- Referral state (NOT the code itself)
    'pro_referrals_count', 'referral_reward_expires_at',
    -- Timestamps
    'created_at', 'updated_at'
  ];
  v_existing_columns TEXT[];
  v_grant_sql TEXT;
BEGIN
  SELECT array_agg(quote_ident(column_name) ORDER BY column_name)
    INTO v_existing_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = ANY(v_public_columns);

  IF v_existing_columns IS NULL OR array_length(v_existing_columns, 1) IS NULL THEN
    RAISE EXCEPTION 'No public profile columns found — refusing to GRANT empty list';
  END IF;

  v_grant_sql := format(
    'GRANT SELECT (%s) ON public.profiles TO anon, authenticated',
    array_to_string(v_existing_columns, ', ')
  );

  RAISE NOTICE 'Granting SELECT on % public profile columns', array_length(v_existing_columns, 1);
  EXECUTE v_grant_sql;
END $$;

-- ============================================================================
-- 2. PROFILES — extend privilege-escalation trigger (C1)
-- ============================================================================
-- The previous migration (20260410000002_fix_profile_column_privilege_escalation)
-- only blocked builder_score, subscription_tier, pro_since and
-- lemon_squeezy_*. The pentest report flagged ai_credits, is_profile_verified
-- and other gamification flags. Extend the trigger to cover everything that
-- should never be writable by an authenticated user via direct REST.

-- We use to_jsonb(NEW)->>'column' instead of NEW.column so the function
-- doesn't fail at runtime if a column happens to be missing in this
-- environment (schema drift defense). For columns that don't exist,
-- to_jsonb returns NULL on both sides and the IS DISTINCT FROM check
-- is false, so the trigger silently skips.

CREATE OR REPLACE FUNCTION public.enforce_profile_column_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_locked_columns TEXT[] := ARRAY[
    -- Score & gamification
    'builder_score',
    'is_monthly_winner',
    'winner_month',
    'is_profile_verified',
    'has_good_reputation',
    'is_top_matchmaker',
    -- Subscription & billing
    'subscription_tier',
    'pro_since',
    'lemon_squeezy_customer_id',
    'lemon_squeezy_subscription_id',
    -- Credits & referrals
    'ai_credits',
    'referral_code',
    'pro_referrals_count',
    'referral_reward_expires_at',
    -- Free trial state
    'free_trial_claimed_at',
    'free_trial_started_at',
    'free_trial_ends_at',
    -- Share-unlock state
    'twitter_share_unlocked',
    'extra_blocks_from_share'
  ];
  v_col TEXT;
BEGIN
  -- Only enforce on direct authenticated-user updates.
  -- service_role, postgres, and SECURITY DEFINER function owners are trusted.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  FOREACH v_col IN ARRAY v_locked_columns LOOP
    IF (v_old ? v_col) AND (v_new ? v_col) AND ((v_old -> v_col) IS DISTINCT FROM (v_new -> v_col)) THEN
      RAISE EXCEPTION 'Column % is read-only and can only be updated via service-role API routes.', v_col
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recompute_builder_score'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.recompute_builder_score(UUID) FROM authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.recompute_builder_score(UUID) TO service_role';
  END IF;
END $$;

-- ============================================================================
-- 8. RPC get_builder_score_breakdown — block anon (H3)
-- ============================================================================
-- The breakdown is shown in the ScoreInfoModal on profile pages, which is
-- only meaningful for logged-in users that want to understand the gamification
-- system. Block anon entirely; keep authenticated.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_builder_score_breakdown'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_builder_score_breakdown(UUID) TO authenticated, service_role';
  END IF;
END $$;
