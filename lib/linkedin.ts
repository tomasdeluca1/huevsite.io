/**
 * LinkedIn auto-announcements for the huevsite.io company page, published
 * through the Typefully v2 API (the LinkedIn page is connected to the
 * "Huevsite" social set in Typefully, which handles LinkedIn auth/tokens).
 *
 * LinkedIn plain-text posts can't @mention people (mentions need URNs), so
 * these composers never use @handles — always display names + profile URLs.
 *
 * Requires TYPEFULLY_API_KEY + TYPEFULLY_SOCIAL_SET_ID; every publisher is
 * non-fatal and skips with a warning when they're missing, mirroring
 * sendTweet's behavior so announcement flows never break on social errors.
 */

const TYPEFULLY_V2_BASE = "https://api.typefully.com/v2";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";

/**
 * Publishes a text post to the huevsite.io LinkedIn page (immediately).
 * Returns the Typefully draft response, or null when config is missing.
 */
export async function postToLinkedIn(text: string) {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;

  if (!apiKey || !socialSetId) {
    console.warn("TYPEFULLY_API_KEY / TYPEFULLY_SOCIAL_SET_ID not set. Skipping LinkedIn post.");
    return null;
  }

  const res = await fetch(`${TYPEFULLY_V2_BASE}/social-sets/${socialSetId}/drafts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platforms: {
        linkedin: {
          enabled: true,
          posts: [{ text }],
        },
      },
      publish_at: "now",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully v2 API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  console.log("LinkedIn post published via Typefully, draft id:", data?.id);
  return data;
}

/**
 * Builder de la Semana announcement.
 */
export async function postBuilderOfTheWeekLinkedIn(
  winner: { name: string; username: string },
  week: string,
  finalists?: { name: string; count: number }[],
  preview = false
) {
  const lines = [
    `🏆 Builder de la Semana (${week})`,
    "",
    `Felicitaciones a ${winner.name} por ser elegido Builder de la Semana en huevsite 🥚`,
    "",
    `Mirá lo que está construyendo: ${SITE_URL}/${winner.username}`,
  ];

  if (finalists && finalists.length > 0) {
    lines.push("", "También estuvieron en el podio:");
    finalists.slice(0, 3).forEach((f, i) => {
      lines.push(`${i === 0 ? "🥈" : i === 1 ? "🥉" : "🔹"} ${f.name} (${f.count} votos)`);
    });
  }

  lines.push("", "#buildinpublic");

  const text = lines.join("\n");
  if (preview) return text;
  return postToLinkedIn(text);
}

/**
 * Community milestone announcement (every +50 builders).
 */
export async function postCommunityMilestoneLinkedIn(milestone: number, preview = false) {
  const text = [
    `🎉 ¡Ya somos ${milestone} builders en huevsite!`,
    "",
    "Gracias a cada builder que arma su perfil y comparte lo que construye en público.",
    "",
    SITE_URL,
  ].join("\n");

  if (preview) return text;
  return postToLinkedIn(text);
}

/**
 * Weekly community digest (Friday cron). Same content as the tweet but with
 * display names instead of handles — no @mentions on LinkedIn.
 */
export async function postWeeklyDigestLinkedIn(
  movers: { name: string; delta: number }[],
  newProjectsCount: number,
  news: { title: string } | null,
  preview = false
) {
  if (movers.length === 0 && newProjectsCount === 0 && !news) return null;

  const lines: string[] = ["🥚 Resumen semanal de huevsite", ""];

  if (movers.length > 0) {
    lines.push("🏆 Los que más subieron esta semana:");
    const medals = ["👑", "🥈", "🥉"];
    movers.slice(0, 3).forEach((m, i) => {
      lines.push(`${medals[i] || "🔹"} ${m.name} (+${m.delta} pts)`);
    });
    lines.push("");
  }

  if (newProjectsCount > 0) {
    lines.push(`🚀 ${newProjectsCount} ${newProjectsCount === 1 ? "proyecto nuevo" : "proyectos nuevos"} esta semana`);
    lines.push("");
  }

  if (news?.title) {
    lines.push(`✨ ${news.title}`);
    lines.push("");
  }

  lines.push(`Leaderboard completo: ${SITE_URL}/leaderboard`);

  const text = lines.join("\n");
  if (preview) return text;
  return postToLinkedIn(text);
}
