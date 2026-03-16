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
  finalists?: { mention: string, count: number }[]
) {
  const isUrl = mention.startsWith('http');
  const displayName = name || mention.replace('@', '').split('/').pop() || 'builder';
  const profileUrl = isUrl ? mention : `${process.env.NEXT_PUBLIC_SITE_URL}/${mention.replace('@', '')}`;
  const mentionText = isUrl ? displayName : mention;

  let text = `🏆 ¡Atención builders! \n\nFelicitaciones a ${mentionText} (${displayName}) por ser el Builder de la Semana (${week}) en Huevsite! 🥚✨\n\nMirá lo que está buildiando acá:\n${profileUrl}`;

  if (finalists && finalists.length > 0) {
    text += `\n\nEstuvo peleado! El top 3 fue:\n`;
    finalists.slice(0, 3).forEach((f, i) => {
      const fIsUrl = f.mention.startsWith('http');
      const fMentionText = fIsUrl ? (f.mention.split('/').pop() || 'builder') : f.mention;
      text += `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${fMentionText} (${f.count} votos)\n`;
    });
  }

  text += `\n#buildinpublic #huevsite`;

  return sendTweet(text);
}

/**
 * Posts a leaderboard with as many builders as can fit in a single tweet (280 chars)
 */
export async function postLeaderboard(profiles: { mention: string, score: number }[]) {
  const HEADER = `🔥 TOP BUILDERS\n\n`;
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

  return sendTweet(finalText);
}
