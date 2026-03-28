import { FreeTrialState } from "@/lib/profile-types";

type AccessProfile = {
  subscription_tier?: string | null;
  pro_since?: string | null;
  referral_reward_expires_at?: string | null;
  free_trial_claimed_at?: string | null;
  free_trial_started_at?: string | null;
  free_trial_ends_at?: string | null;
  free_trial_last_insights_viewed_at?: string | null;
};

export function hasReferralProAccess(referralRewardExpiresAt?: string | null) {
  if (!referralRewardExpiresAt) return false;
  return new Date(referralRewardExpiresAt) > new Date();
}

export function hasPaidProBadge(profile: AccessProfile) {
  return profile.subscription_tier === "pro" || !!profile.pro_since || hasReferralProAccess(profile.referral_reward_expires_at);
}

export function hasActiveFreeTrial(profile: AccessProfile) {
  if (!profile.free_trial_ends_at) return false;
  return new Date(profile.free_trial_ends_at) > new Date();
}

export function canUseLastInsightsView(profile: AccessProfile) {
  if (!profile.free_trial_claimed_at || !profile.free_trial_ends_at) return false;
  if (hasActiveFreeTrial(profile)) return false;
  return !profile.free_trial_last_insights_viewed_at;
}

export function hasProAccess(profile: AccessProfile) {
  return hasPaidProBadge(profile) || hasActiveFreeTrial(profile);
}

export function getFreeTrialState(profile: AccessProfile): FreeTrialState {
  const active = hasActiveFreeTrial(profile);
  const claimed = !!profile.free_trial_claimed_at;
  const paidPro = hasPaidProBadge(profile);
  const expiresAt = profile.free_trial_ends_at || null;
  const claimedAt = profile.free_trial_claimed_at || null;
  const canPreviewInsights = canUseLastInsightsView(profile);

  const daysRemaining = active && expiresAt
    ? Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    eligible: !claimed && !paidPro,
    active,
    claimed,
    expiresAt,
    claimedAt,
    daysRemaining,
    canUseLastInsightsView: canPreviewInsights,
    lastInsightsViewedAt: profile.free_trial_last_insights_viewed_at || null,
  };
}
