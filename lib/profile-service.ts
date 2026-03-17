import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProfileData, BlockData, getAdjustedAccentColor } from './profile-types';
import { scoreService } from './score-service';

async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar errores de cookies en server components
          }
        },
      },
    }
  );
}

export const profileService = {
  async getProfile(username: string): Promise<ProfileData | null> {
    const supabase = await getServerClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, name, tagline, image, github_handle, accent_color, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user')
      .eq('username', username)
      .single();

    if (profileError || !profile) return null;

    // Run these in parallel for faster response
    const [
      { data: blocks, error: blocksError },
      { data: userWinnerData },
      { data: latestWinnerData },
      { data: subSites, error: subSitesError }
    ] = await Promise.all([
      supabase
        .from('blocks')
        .select('id, type, order, col_span, row_span, visible, data')
        .eq('user_id', profile.id)
        .is('sub_site_id', null)
        .eq('visible', true)
        .order('order', { ascending: true }),
      supabase
        .from('showcase_winners')
        .select('week')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('showcase_winners')
        .select('week')
        .order('created_at', { ascending: false })
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
    transformed.subSites = subSitesWithAvatar;
    transformed.isWinner =
      !!userWinnerData &&
      !!latestWinnerData &&
      userWinnerData.week === latestWinnerData.week;
    
    return transformed;
  },

  async getSubSiteProfile(username: string, slug: string): Promise<ProfileData | null> {
    const supabase = await getServerClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, name, tagline, image, github_handle, accent_color, subscription_tier, pro_since, extra_blocks_from_share, twitter_share_unlocked, builder_score, ai_credits, custom_domain, referral_code, referred_by, pro_referrals_count, referral_reward_expires_at, is_onboarding_test_user')
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
      extraBlocksFromShare: profile.extra_blocks_from_share || 0,
      twitterShareUnlocked: profile.twitter_share_unlocked || false,
      builderScore: profile.builder_score || 0,
      aiCredits: profile.ai_credits || 0,
      customDomain: profile.custom_domain || "",
      referralCode: profile.referral_code || "",
      referredBy: profile.referred_by || "",
      proReferralsCount: profile.pro_referrals_count || 0,
      referralRewardExpiresAt: profile.referral_reward_expires_at || null,
      isOnboardingTestUser: profile.is_onboarding_test_user || false,
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
    const supabase = await getServerClient();

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
