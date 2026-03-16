import { createClient } from "@supabase/supabase-js";

/**
 * Resolves the best way to mention a list of users on Twitter.
 * If they have a Twitter handle in their social blocks, use it (@handle).
 * Otherwise, use their Huevsite URL.
 */
export async function resolveXHandles(usernames: string[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get profiles and their IDs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', usernames);

  if (!profiles || profiles.length === 0) return {};

  const profileIds = profiles.map(p => p.id);

  // 2. Fetch social blocks for these users
  const { data: blocks } = await supabase
    .from('blocks')
    .select('user_id, data')
    .eq('type', 'social')
    .in('user_id', profileIds);

  const results: Record<string, string> = {};

  for (const profile of profiles) {
    const userBlocks = blocks?.filter(b => b.user_id === profile.id) || [];
    let twitterHandle = null;

    for (const block of userBlocks) {
      const links = block.data?.links || [];
      const twitterLink = links.find((l: any) => l.platform === 'twitter');
      if (twitterLink?.url) {
        // Extract handle from URL or use as is if it's already a handle
        const url = twitterLink.url;
        if (url.includes('x.com/') || url.includes('twitter.com/')) {
          const parts = url.split('/');
          twitterHandle = parts[parts.length - 1].replace('@', '').split('?')[0];
        } else {
          twitterHandle = url.replace('@', '');
        }
        break;
      }
    }

    if (twitterHandle) {
      results[profile.username] = `@${twitterHandle}`;
    } else {
      results[profile.username] = `${process.env.NEXT_PUBLIC_SITE_URL}/${profile.username}`;
    }
  }

  return results;
}
