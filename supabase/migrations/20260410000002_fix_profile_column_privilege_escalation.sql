-- Fix: privilege escalation via direct UPDATE on public.profiles
--
-- Problem: the existing RLS policy `Usuarios edit profiles` allows any
-- authenticated user to UPDATE their own profile row with no column-level
-- restriction. A client can bypass the /api/profile Zod schema by calling
-- Supabase directly:
--     supabase.from('profiles').update({ builder_score: 999999999 }).eq('id', auth.uid())
-- and freely rewrite sensitive columns (score, subscription, referral counters).
--
-- Fix: BEFORE UPDATE trigger that freezes sensitive columns when the caller
-- runs as the `authenticated` role. Service-role paths (lemon-squeezy webhook)
-- and SECURITY DEFINER functions (recompute_builder_score) bypass because
-- current_user is not 'authenticated' in those contexts.

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

  IF NEW.builder_score IS DISTINCT FROM OLD.builder_score THEN
    RAISE EXCEPTION 'builder_score is read-only. Use the recompute_builder_score() RPC.'
      USING ERRCODE = '42501';
  END IF;

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

  IF NEW.pro_referrals_count IS DISTINCT FROM OLD.pro_referrals_count THEN
    RAISE EXCEPTION 'pro_referrals_count is read-only for users.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_column_privileges ON public.profiles;

CREATE TRIGGER enforce_profile_column_privileges
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_column_privileges();

-- Remediation: recompute ponti's builder_score (was manually set to 999999999
-- via the RLS gap this migration closes). Runs as postgres inside the
-- migration, so the new trigger bypasses (current_user <> 'authenticated').
DO $$
DECLARE
  v_user_id UUID;
  v_new_score INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles WHERE username = 'ponti';
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'ponti not found, skipping score recompute';
    RETURN;
  END IF;
  v_new_score := public.recompute_builder_score(v_user_id);
  RAISE NOTICE 'ponti builder_score recomputed to %', v_new_score;
END $$;
