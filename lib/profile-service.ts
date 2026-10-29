import { cache } from 'react';
import { ProfileData, BlockData, getAdjustedAccentColor, MAX_FREE_BLOCKS } from './profile-types';
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

// Las dos lecturas públicas van envueltas en React cache().
//
// Tanto /[username] como /[username]/[slug] llaman al service DOS veces por
// request: una desde generateMetadata y otra desde el componente de página.
// Como el cliente de service-role fuerza `cache: "no-store"` (necesario: sin
// eso Next se quedaba con el badge del ganador BDLS pegado entre requests),
// Next no deduplica nada y cada vista de perfil costaba ~12 SELECT en lugar
// de ~6.
//
// cache() memoriza por request, no entre requests: elimina la query duplicada
// sin reintroducir el bug de datos viejos que motivó el no-store.

// Columnas nuevas de la vista mobile (blocks) y del ecosistema (profiles).
// Siempre se piden con intento optimista + reintento legacy: si la migración
// 20261028000000 todavía no se aplicó, el SELECT falla y, sin fallback,
// getProfile devolvería null y TODOS los perfiles darían 404.
const BLOCK_COLS_LEGACY = 'id, type, order, col_span, row_span, visible, data';
const BLOCK_COLS = BLOCK_COLS_LEGACY + ', mobile_order, visible_on';

export const profileService = {
  getProfile: cache(async (username: string): Promise<ProfileData | null> => {
    const supabase = getServerClient();

    const PROFILE_COLS = 'id, username, name, tagline, image, github_handle, accent_color, border_radius, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user, is_profile_verified, has_good_reputation, is_top_matchmaker, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, newsletter_subscribed, updated_at';

    // Intentamos traer las columnas más nuevas (published_board para board
    // presets, show_ecosystem para el interruptor de ecosistema). Si alguna no
    // está migrada aún, el select falla y bajamos de a un escalón: primero solo
    // published_board (para no perder el filtro de board si lo único pendiente
    // es show_ecosystem), y por último el legacy sin ninguna. Así el deploy
    // nunca rompe las páginas públicas antes de aplicar la migración.
    let profile: any = null;
    let profileError: any = null;
    ({ data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLS + ', published_board, show_ecosystem')
      .eq('username', username)
      .single());
    if (profileError) {
      ({ data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_COLS + ', published_board')
        .eq('username', username)
        .single());
    }
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
    // Se pide con mobile_order/visible_on; si no existen, reintenta legacy.
    const fetchMainBlocks = async () => {
      const build = (cols: string) => {
        let q = supabase
          .from('blocks')
          .select(cols)
          .eq('user_id', profile.id)
          .is('sub_site_id', null)
          .eq('visible', true);
        if (boardMigrated) q = q.eq('board_index', publishedBoard);
        return q.order('order', { ascending: true });
      };
      const res: any = await build(BLOCK_COLS);
      return res.error ? ((await build(BLOCK_COLS_LEGACY)) as any) : res;
    };

    // Run these in parallel for faster response
    const [
      { data: blocks, error: blocksError },
      { data: userWinnerData },
      { data: latestWinnerData },
      { data: subSites, error: subSitesError }
    ] = await Promise.all([
      fetchMainBlocks(),
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

    const transformed = profileService._transformProfile(profile, blocks || []);
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
    // Most recent week this builder won BDLS — for the laurel hover on the board.
    transformed.winnerWeek = (userWinnerData as any)?.week || null;
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
  }),

  getSubSiteProfile: cache(async (username: string, slug: string): Promise<ProfileData | null> => {
    const supabase = getServerClient();

    // show_ecosystem con reintento legacy (ver nota en getProfile).
    const SUB_PROFILE_COLS = 'id, username, name, tagline, image, github_handle, accent_color, border_radius, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user, is_profile_verified, has_good_reputation, is_top_matchmaker, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at, newsletter_subscribed, updated_at';
    let profile: any = null;
    let profileError: any = null;
    ({ data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(SUB_PROFILE_COLS + ', show_ecosystem')
      .eq('username', username)
      .single());
    if (profileError) {
      ({ data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(SUB_PROFILE_COLS)
        .eq('username', username)
        .single());
    }

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
      (async () => {
        const build = (cols: string) =>
          supabase
            .from('blocks')
            .select(cols)
            .eq('user_id', profile.id)
            .eq('sub_site_id', subSite.id)
            .eq('visible', true)
            .order('order', { ascending: true });
        const res: any = await build(BLOCK_COLS);
        return res.error ? ((await build(BLOCK_COLS_LEGACY)) as any) : res;
      })(),
      supabase
        .from('sub_sites')
        .select('id, title, description, slug, avatar_url, source_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
    ]);

    if (blocksError) return null;

    const transformed = profileService._transformProfile(profile, blocks || []);
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
  }),

  _transformProfile(profile: any, blocks: any[]): ProfileData {
    const proAccess = hasProAccess(profile);
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
      hasProAccess: proAccess,
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
      // Pre-migración la columna no viene: undefined => true (comportamiento actual).
      showEcosystem: profile.show_ecosystem !== false,
      isOnboardingTestUser: profile.is_onboarding_test_user || false,
      newsletterSubscribed: profile.newsletter_subscribed === true,
      subSites: [], // Initially empty, filled by API if needed
      blocks: (blocks || []).map(b => {
        const { id, type, order, col_span, row_span, visible, ...data } = b.data || {};
        return {
          ...data,
          id: b.id,
          type: b.type,
          order: b.order,
          col_span: b.col_span,
          row_span: b.row_span,
          visible: b.visible,
          mobileOrder: b.mobile_order ?? null,
          // Sin acceso Pro (mismo criterio que hasProAccess, prueba incluida) se
          // renderiza como 'both' SIN tocar el valor guardado en la base.
          visibleOn: proAccess ? (b.visible_on || 'both') : 'both',
        };
      // Hide archived projects from the public profile (the dashboard loads
      // blocks via /api/profile, which is unaffected, so they stay editable).
      }).filter((b: any) => !(b.type === "project" && b.archived === true)) as BlockData[]
    };
  },
};
