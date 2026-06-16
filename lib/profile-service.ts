import { ProfileData, BlockData, getAdjustedAccentColor, MAX_FREE_BLOCKS } from './profile-types';
import { scoreService } from './score-service';
import { getProfileBadges } from './profile-badges';
import { getFreeTrialState, hasProAccess } from './pro-access';
import { getCurrentWeek, getWeekString } from './showcase-service';
import { createServiceRoleClient } from './supabase/service-role';

// Public-profile rendering uses the service-role client because:
//   1) The /[username] page must work for anonymous visitors, and after
//      the 2026-04-11 hardening pass several profile columns (ai_credits,
//      lemon_squeezy_*, free_trial_*) are no longer grant-readable to anon
//      via the REST API.
//   2) These reads are read-only and aggregated server-side before being
//      shipped to the client; _transformProfile is responsible for not
//      leaking sensitive fields back to the page.
//
// Use createServiceRoleClient (not a bare supabase-js client) so that the
// `cache: "no-store"` fetch override applies — without it, Next.js caches
// PostgREST responses across requests and the BDLS winner badge sticks to
// whoever was latest when the page was first rendered.
function getServerClient() {
  return createServiceRoleClient();
}

export const profileService = {
  async getProfile(username: string): Promise<ProfileData | null> {
    const supabase = getServerClient();

    const PROFILE_COLS = 'id, username, name, tagline, image, github_handle, accent_color, border_radius, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user, is_profile_verified, has_good_reputation, is_top_matchmaker, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, newsletter_subscribed, updated_at';

    // Intentamos traer published_board (board presets). Si la columna no está
    // migrada aún, el select falla y caemos al legacy (un solo board) — así el
    // deploy nunca rompe las páginas públicas antes de aplicar la migración.
    let profile: any = null;
    let profileError: any = null;
    ({ data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLS + ', published_board')
      .eq('username', username)
      .single());
    if (profileError) {
      ({ data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_COLS)
        .eq('username', username)
        .single());
    }

    if (profileError || !profile) return null;

    const boardMigrated =
      (profile as any).published_board !== undefined && (profile as any).published_board !== null;
    const publishedBoard = boardMigrated ? (profile as any).published_board : 0;

    // Bloques del board PUBLICADO (perfil principal). Pre-migración no filtra.
    let mainBlocksQuery = supabase
      .from('blocks')
      .select('id, type, order, col_span, row_span, visible, data')
      .eq('user_id', profile.id)
      .is('sub_site_id', null)
      .eq('visible', true);
    if (boardMigrated) mainBlocksQuery = mainBlocksQuery.eq('board_index', publishedBoard);
    mainBlocksQuery = mainBlocksQuery.order('order', { ascending: true });

    // Run these in parallel for faster response
    const [
      { data: blocks, error: blocksError },
      { data: userWinnerData },
      { data: latestWinnerData },
      { data: subSites, error: subSitesError }
    ] = await Promise.all([
      mainBlocksQuery,
      supabase
        .from('showcase_winners')
        .select('week')
        .eq('user_id', profile.id)
        .order('week', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Restrict the "latest winner" lookup to the current ISO week or the
      // immediately previous one. Without this clamp, the top banner sticks
      // to whoever was the most recent pick — even if that pick was weeks
      // ago because the cron stalled, or if a stale/test row pointed at a
      // future week. We mirror the [currentWeek, prevWeek] window used by
      // showcase-service.getShowcaseData so the banner matches the
      // "currently featured" winner concept on /explore.
      supabase
        .from('showcase_winners')
        .select('week')
        .in('week', [
          getCurrentWeek(),
          getWeekString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        ])
        .order('week', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('sub_sites')
        .select('id, title, description, slug, avatar_url, source_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    ]);

    let subSitesWithAvatar = (subSites || []).map(s => ({
      ...s,
      avatarUrl: s.avatar_url || null,
      sourceUrl: s.source_url || null
    }));

    if (subSitesWithAvatar.length > 0) {
      const subSiteIds = subSitesWithAvatar.map(s => s.id);
      const { data: subSiteBlocks } = await supabase
        .from('blocks')
        .select('sub_site_id, data')
        .in('sub_site_id', subSiteIds)
        .eq('type', 'hero');
        
      if (subSiteBlocks) {
        subSitesWithAvatar = subSitesWithAvatar.map(s => {
          const hero = subSiteBlocks.find(b => b.sub_site_id === s.id);
          return {
            ...s,
            avatarUrl: s.avatarUrl || hero?.data?.avatarUrl || null
          };
        });
      }
    }

    const transformed = this._transformProfile(profile, blocks || []);
    transformed.blocks = transformed.blocks.map((block: any) =>
      block.type === 'hero'
        ? { ...block, avatarUrl: profile.image || "" }
        : block
    ) as BlockData[];
    transformed.subSites = subSitesWithAvatar;
    transformed.isWinner =
      !!userWinnerData &&
      !!latestWinnerData &&
      userWinnerData.week === latestWinnerData.week;
    transformed.badges = getProfileBadges(profile, {
      blockCount: transformed.blocks.length,
      hasWonBuilderOfTheWeek: !!userWinnerData,
      blocks: transformed.blocks,
    });
    transformed.ogImageVersion = [
      "botw",
      latestWinnerData?.week || "none",
      transformed.isWinner ? "winner" : "default",
      `b${transformed.badges?.length ?? 0}`,
    ].join("-");

    // Enforce free-tier limits on public profile
    if (!hasProAccess(profile)) {
      const effectiveLimit = MAX_FREE_BLOCKS + (profile.extra_blocks_from_share || 0);
      if (transformed.blocks.length > effectiveLimit) {
        transformed.blocks = transformed.blocks.slice(0, effectiveLimit);
      }
      // Sub-sites are a Pro feature — hide from public view
      transformed.subSites = [];
    }

    return transformed;
  },

  async getSubSiteProfile(username: string, slug: string): Promise<ProfileData | null> {
    const supabase = getServerClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, name, tagline, image, github_handle, accent_color, border_radius, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user, is_profile_verified, has_good_reputation, is_top_matchmaker, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, newsletter_subscribed, updated_at')
      .eq('username', username)
      .single();

    if (profileError || !profile) return null;

    // Check if subsite exists
    const { data: subSite, error: subSiteError } = await supabase
      .from('sub_sites')
      .select('id, title, description, slug, avatar_url, source_url')
      .eq('user_id', profile.id)
      .eq('slug', slug)
      .single();

    if (subSiteError || !subSite) return null;

    const [
      { data: blocks, error: blocksError },
      { data: subSites }
    ] = await Promise.all([
      supabase
        .from('blocks')
        .select('id, type, order, col_span, row_span, visible, data')
        .eq('user_id', profile.id)
        .eq('sub_site_id', subSite.id)
        .eq('visible', true)
        .order('order', { ascending: true }),
      supabase
        .from('sub_sites')
        .select('id, title, description, slug, avatar_url, source_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    ]);

    if (blocksError) return null;

    const transformed = this._transformProfile(profile, blocks || []);
    transformed.badges = getProfileBadges(profile, {
      blockCount: transformed.blocks.length,
      hasWonBuilderOfTheWeek: false,
      blocks: transformed.blocks,
    });

    let subSitesWithAvatar = (subSites || []).map(s => ({
      ...s,
      avatarUrl: s.avatar_url || null,
      sourceUrl: s.source_url || null
    }));

    if (subSitesWithAvatar.length > 0) {
      const subSiteIds = subSitesWithAvatar.map(s => s.id);
      const { data: subSiteBlocks } = await supabase
        .from('blocks')
        .select('sub_site_id, data')
        .in('sub_site_id', subSiteIds)
        .eq('type', 'hero');

      if (subSiteBlocks) {
        subSitesWithAvatar = subSitesWithAvatar.map(s => {
          const hero = subSiteBlocks.find(b => b.sub_site_id === s.id);
          return {
            ...s,
            avatarUrl: s.avatarUrl || hero?.data?.avatarUrl || null
          };
        });
      }
    }

    // Customization for subsite:
    return {
      ...transformed,
      displayName: subSite.title,
      tagline: subSite.description || transformed.tagline,
      avatarUrl: subSite.avatar_url || transformed.avatarUrl,
      blocks: transformed.blocks.map((block: any) =>
        block.type === 'hero'
          ? { ...block, avatarUrl: subSite.avatar_url || "" }
          : block
      ) as BlockData[],
      subSites: subSitesWithAvatar,
      subSiteId: subSite.id,
      sourceUrl: subSite.source_url || null,
      parentProfile: {
        username: profile.username,
        displayName: (profile as any).name || profile.username,
        avatarUrl: (profile as any).image || null,
        tagline: (profile as any).tagline || null,
      }
    };
  },

  _transformProfile(profile: any, blocks: any[]): ProfileData {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.name || profile.username,
      tagline: profile.tagline || "",
      avatarUrl: profile.image || "",
      githubHandle: profile.github_handle || "",
      accentColor: getAdjustedAccentColor(profile.accent_color as any),
      subscriptionTier: (() => {
        if (profile.subscription_tier === 'pro' || !!profile.pro_since) return 'pro';
        if (profile.referral_reward_expires_at) {
          const expiresAt = new Date(profile.referral_reward_expires_at);
          if (expiresAt > new Date()) return 'pro';
        }
        return 'free';
      })(),
      hasProAccess: hasProAccess(profile),
      extraBlocksFromShare: profile.extra_blocks_from_share || 0,
      twitterShareUnlocked: profile.twitter_share_unlocked || false,
      builderScore: profile.builder_score || 0,
      aiCredits: profile.ai_credits || 0,
      customDomain: profile.custom_domain || "",
      referralCode: profile.referral_code || "",
      referredBy: profile.referred_by || "",
      proReferralsCount: profile.pro_referrals_count || 0,
      referralRewardExpiresAt: profile.referral_reward_expires_at || null,
      isProfileVerified: profile.is_profile_verified || false,
      hasGoodReputation: profile.has_good_reputation || false,
      isTopMatchmaker: profile.is_top_matchmaker || false,
      freeTrialClaimedAt: profile.free_trial_claimed_at || null,
      freeTrialStartedAt: profile.free_trial_started_at || null,
      freeTrialEndsAt: profile.free_trial_ends_at || null,
      freeTrialLastInsightsViewedAt: profile.free_trial_last_insights_viewed_at || null,
      freeTrial: getFreeTrialState(profile),
      borderRadius: profile.border_radius || '1.5rem',
      isOnboardingTestUser: profile.is_onboarding_test_user || false,
      newsletterSubscribed: profile.newsletter_subscribed === true,
      subSites: [], // Initially empty, filled by API if needed
      blocks: (blocks || []).map(b => {
        const { id, type, order, col_span, row_span, visible, ...data } = b.data || {};
        return {
          id: b.id,
          type: b.type,
          order: b.order,
          col_span: b.col_span,
          row_span: b.row_span,
          visible: b.visible,
          ...data
        };
      }) as BlockData[]
    };
  },

  async saveProfile(userId: string, profile: ProfileData) {
    const supabase = getServerClient();

    // 1. Actualizar perfil básico
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        accent_color: profile.accentColor,
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Sincronizar bloques (versión simplificada: borrar + insertar)
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    const blocksToInsert = profile.blocks.map((block, index) => {
      const { id, type, order, col_span, row_span, visible, ...data } = block;

      return {
        user_id: userId,
        type,
        col_span,
        row_span,
        data,
        order: index,
        visible: visible !== undefined ? visible : true
      };
    });

    const { error: insertError } = await supabase
      .from('blocks')
      .insert(blocksToInsert);

    if (insertError) throw insertError;

    // 3. Recalcular Builder Score
    await scoreService.recomputeScore(userId);
  }
};
