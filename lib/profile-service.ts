import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProfileData, BlockData } from './profile-types';
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
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', profile.id)
      .is('sub_site_id', null)
      .eq('visible', true)
      .order('order', { ascending: true });

    if (blocksError) return null;

    const { data: subSites, error: subSitesError } = await supabase
      .from('sub_sites')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    let subSitesWithAvatar = subSites || [];
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
            avatarUrl: s.avatar_url || hero?.data?.avatarUrl || null
          };
        });
      }
    }

    const transformed = this._transformProfile(profile, blocks || []);
    transformed.subSites = subSitesWithAvatar;
    
    return transformed;
  },

  async getSubSiteProfile(username: string, slug: string): Promise<ProfileData | null> {
    const supabase = await getServerClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) return null;

    // Check if subsite exists
    const { data: subSite, error: subSiteError } = await supabase
      .from('sub_sites')
      .select('*')
      .eq('user_id', profile.id)
      .eq('slug', slug)
      .single();

    if (subSiteError || !subSite) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('sub_site_id', subSite.id)
      .eq('visible', true)
      .order('order', { ascending: true });

    if (blocksError) return null;

    const transformed = this._transformProfile(profile, blocks || []);
    // Customization for subsite:
    return {
      ...transformed,
      displayName: subSite.title,
      tagline: subSite.description || transformed.tagline,
      avatarUrl: subSite.avatar_url || transformed.avatarUrl,
      parentProfile: {
        username: profile.username,
        displayName: profile.name || profile.username,
        avatarUrl: profile.avatarUrl || null,
        tagline: profile.tagline || null,
      }
    };
  },

  _transformProfile(profile: any, blocks: any[]): ProfileData {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.name || profile.username,
      tagline: profile.tagline || "",
      accentColor: profile.accent_color as any,
      subscriptionTier: (profile.subscription_tier === 'pro' || !!profile.pro_since) ? 'pro' : 'free',
      extraBlocksFromShare: profile.extra_blocks_from_share || 0,
      twitterShareUnlocked: profile.twitter_share_unlocked || false,
      builderScore: profile.builder_score || 0,
      customDomain: profile.custom_domain || "",
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
