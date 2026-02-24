import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProfileData, BlockData } from './profile-types';

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
      .eq('visible', true)
      .order('order', { ascending: true });

    if (blocksError) return null;

    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.name || profile.username,
      accentColor: profile.accent_color as any,
      recentColors: profile.recent_colors || [],
      extraBlocksFromShare: profile.extra_blocks_from_share || 0,
      twitterShareUnlocked: profile.twitter_share_unlocked || false,
      blocks: (blocks || []).map(b => {
        const { id, type, order, col_span, row_span, visible, ...cleanData } = b.data || {};
        return {
          id: b.id,
          type: b.type,
          order: b.order,
          col_span: b.col_span,
          row_span: b.row_span,
          visible: b.visible,
          ...cleanData
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
  }
};
