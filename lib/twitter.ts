import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

const rwClient = client.readWrite;

/**
 * Posts a simple tweet to X
 */
export async function sendTweet(text: string) {
  if (!process.env.TWITTER_API_KEY) {
    console.warn("TWITTER_API_KEY is not set. Skipping tweet.");
    return null;
  }

  try {
    const tweet = await rwClient.v2.tweet(text);
    console.log("Tweet posted successfully:", tweet.data.id);
    return tweet;
  } catch (error) {
    console.error("Error posting tweet:", error);
    throw error;
  }
}

/**
 * Specifically formats and posts a "Builder of the Week" tweet with top nominees information
 */
export async function postBuilderOfTheWeek(
  mention: string,
  week: string,
  name?: string,
  finalists?: { mention: string, count: number }[],
  username?: string
) {
  // `mention` is the Twitter handle ("@handle") when the user has X linked,
  // otherwise a fallback profile URL. The handle is ONLY for the @mention.
  // `username` is the huevsite profile — the URL must always point to it, never
  // to the Twitter handle.
  const hasHandle = mention?.startsWith('@');
  const displayName =
    name || username || (hasHandle ? mention.replace('@', '') : mention.split('/').pop() || 'builder');

  const profileUrl = username
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/${username}`
    : (mention.startsWith('http') ? mention : `${process.env.NEXT_PUBLIC_SITE_URL}/${mention.replace('@', '')}`);

  // Use the @handle as the mention; if there's no handle, just the name.
  const winnerLabel = hasHandle
    ? (mention === displayName ? mention : `${mention} (${displayName})`)
    : displayName;

  let text = `🏆 ¡Atención builders! \n\nFelicitaciones a ${winnerLabel} por ser el Builder de la Semana (${week}) en Huevsite! 🥚✨\n\nMirá lo que está buildiando acá:\n${profileUrl}`;

  if (finalists && finalists.length > 0) {
    text += `\n\nLos finalistas:\n`;
    finalists.slice(0, 3).forEach((f, i) => {
      const fIsUrl = f.mention.startsWith('http');
      const fMentionText = fIsUrl ? (f.mention.split('/').pop() || 'builder') : f.mention;
      text += `${i === 0 ? '🥈' : i === 1 ? '🥉' : '🔹'} ${fMentionText} (${f.count} votos)\n`;
    });
  }

  text += `\n#buildinpublic #huevsite`;

  return sendTweet(text);
}

/**
 * Posts a leaderboard with as many builders as can fit in a single tweet (280 chars)
 */
export async function postLeaderboard(profiles: { mention: string, score: number }[], preview = false, customTitle?: string) {
  const HEADER = `${customTitle || '🔥 TOP BUILDERS'}\n\n`;
  const FOOTER = `\n¿Y vos? ¡Lanzá tu huevsite!\n\n#buildeaenpublico\n\nhuevsite.io`;

  // Twitter counts any URL as 23 characters
  const URL_LENGTH = 23;
  const footerLengthEstimate = FOOTER.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '').length + URL_LENGTH;
  const baseLength = HEADER.length + footerLengthEstimate;

  let currentText = HEADER;
  let addedCount = 0;

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const medal = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
    const isUrl = p.mention.startsWith('http');
    const displayIdentifier = isUrl ? (p.mention.split('/').pop() || 'builder') : p.mention;

    // Line to add: "👑 #1 username (123 pts)\n"
    const line = `${medal} #${i + 1} ${displayIdentifier} (${p.score} pts)\n`;

    // Check if adding this line + footer exceeds 280
    if (baseLength + currentText.length - HEADER.length + line.length > 280) {
      break;
    }

    currentText += line;
    addedCount++;
  }

  if (addedCount === 0) {
    throw new Error("No space to even add one builder to the tweet.");
  }

  // Final assembly
  const finalText = currentText + FOOTER;

  if (preview) return finalText;
  return sendTweet(finalText);
}

/**
 * Posts a welcome tweet for new builders who connect their X account
 */
export async function postWelcomeBuilder(username: string, twitterHandle: string) {
  const cleanHandle = twitterHandle.replace('@', '');
  const text = `Un nuevo builder sumó su X handle: Bienvenido @${cleanHandle} a huevsite 👋\n\nAcá su perfil: huevsite.io/${username}\n\n#BuildeaEnPublico`;

  return sendTweet(text);
}

/**
 * Checks if a block update contains a new Twitter handle and posts a welcome tweet if necessary.
 */
export async function checkAndPostWelcomeTweet(supabase: any, userId: string, blockType: string, blockData: any) {
  if (blockType !== 'social') return;

  const links = blockData?.links || [];
  const twitterLink = links.find((l: any) => l.platform === 'twitter');
  const twitterHandle = twitterLink?.handle || twitterLink?.url;

  if (!twitterHandle) return;

  // 1. Check if user already sent welcome tweet
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, welcome_tweet_sent')
    .eq('id', userId)
    .single();

  if (profile?.welcome_tweet_sent) return;

  // 2. Extract clean handle
  let cleanHandle = twitterHandle;
  if (twitterHandle.includes('x.com/') || twitterHandle.includes('twitter.com/')) {
    const parts = twitterHandle.split('/');
    cleanHandle = parts[parts.length - 1].replace('@', '').split('?')[0];
  } else {
    cleanHandle = twitterHandle.replace('@', '');
  }

  if (!cleanHandle ||
    cleanHandle === 'twitter' ||
    cleanHandle === 'x' ||
    cleanHandle === 'x.com' ||
    cleanHandle === 'twitter.com' ||
    cleanHandle.includes('.') // Handles like "x.com" or "twitter.com"
  ) return;

  try {
    // 3. Post tweet
    await postWelcomeBuilder(profile.username, cleanHandle);

    // 4. Mark as sent
    await supabase
      .from('profiles')
      .update({ welcome_tweet_sent: true })
      .eq('id', userId);

    console.log(`// Welcome tweet sent for @${profile.username} (X: @${cleanHandle})`);
  } catch (err) {
    console.error("// Error posting welcome tweet:", err);
  }
}

/**
 * Checks if the total builder count has reached a milestone (multiples of 50 after 100)
 */
export async function checkAndPostCommunityMilestone(supabase: any) {
  try {
    // 1. Get total builder count
    // Use select('id', ...) — select('*', ...) fails under the column-level
    // grants from migration 20260411000000 when called with a session client.
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error || count === null) return;

    // We only care about milestones like 100, 150, 200...
    if (count < 100 || count % 50 !== 0) return;

    const milestone = count;

    // 2. Check if milestone already posted
    const { data: existing } = await supabase
      .from('community_milestones')
      .select('id')
      .eq('milestone', milestone)
      .maybeSingle();

    if (existing) return;

    // 3. Post tweet
    const text = `Milestones de comunidad — "¡Ya somos ${milestone} builders en huevsite! 🎉"`;
    await sendTweet(text);

    // 4. Record milestone
    await supabase
      .from('community_milestones')
      .insert({ milestone });

    console.log(`// Community milestone reached and posted: ${milestone} builders!`);
  } catch (err) {
    console.error("// Error checking community milestone:", err);
  }
}

/**
 * Posts a shout-out for a new PRO builder
 */
export async function postProUpgrade(username: string, twitterHandle?: string) {
  const mention = twitterHandle
    ? `@${twitterHandle.replace('@', '')}`
    : `@${username}`;

  const text = `💎 ¡Nuevo Builder PRO en la casa! \n\nFelicitaciones a ${mention} por sumarse al plan Pro de huevsite. ✨\n\nMirá su perfil: huevsite.io/${username}\n\n#probuilder #huevsite`;

  return sendTweet(text);
}

/**
 * Posts weekly community stats (Friday wrap-up)
 */
export async function postWeeklyStats(supabase: any, preview = false) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    // 1. Get new builders in last 7 days
    // select('id', ...) instead of select('*', ...) — column-level grants
    // would reject the latter under a session client.
    const { count: newBuilders } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', dateStr);

    // 2. Get new projects/buildings in last 7 days
    const { count: newProjects } = await supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .in('type', ['building', 'project'])
      .gte('created_at', dateStr);

    const builderCount = newBuilders || 0;
    const projectCount = newProjects || 0;

    if (builderCount === 0 && projectCount === 0) return null;

    const text = `📊 Stats de la semana en huevsite:\n\n🚀 ${projectCount} nuevos proyectos publicados\n👋 ${builderCount} nuevos builders se sumaron\n\n¡La comunidad no para de crecer! 🥚✨\n\nhuevsite.io\n\n#buildinpublic #latam`;

    if (preview) return text;
    await sendTweet(text);
    console.log("// Weekly stats posted successfully");
    return true;
  } catch (err) {
    console.error("// Error posting weekly stats:", err);
    return null;
  }
}

/**
 * Composes and posts the weekly community digest tweet:
 * top point-gainers of the week + new projects count + latest news.
 * Returns the composed text when preview=true, null when there is nothing to share.
 */
export async function postWeeklyDigest(
  movers: { username: string; delta: number }[],
  newProjectsCount: number,
  news: { title: string } | null,
  preview = false
) {
  if (movers.length === 0 && newProjectsCount === 0 && !news) return null;

  const lines: string[] = ["🥚 Resumen semanal de huevsite", ""];

  if (movers.length > 0) {
    lines.push("🏆 Los que más subieron:");
    const medals = ["👑", "🥈", "🥉"];
    movers.slice(0, 3).forEach((m, i) => {
      lines.push(`${medals[i] || "🔹"} @${m.username} (+${m.delta} pts)`);
    });
    lines.push("");
  }

  if (newProjectsCount > 0) {
    lines.push(`🚀 ${newProjectsCount} ${newProjectsCount === 1 ? "proyecto nuevo" : "proyectos nuevos"} esta semana`);
    lines.push("");
  }

  let text = lines.join("\n");
  const footer = "huevsite.io/leaderboard\n#buildinpublic #latam";

  // Add the news headline only if it keeps us under Twitter's 280 (URL ≈ 23 chars).
  if (news?.title) {
    const candidate = `${text}✨ ${news.title}\n\n`;
    if (candidate.length + 23 + 25 <= 280) {
      text = candidate;
    } else {
      text = `${text}\n`;
    }
  }

  const finalText = `${text}${footer}`;

  if (preview) return finalText;
  return sendTweet(finalText);
}
