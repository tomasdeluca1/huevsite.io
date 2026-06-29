import { ProfileBadge } from "@/lib/profile-types";
import { hasPaidProBadge } from "@/lib/pro-access";

type BadgeProfile = {
  name?: string | null;
  image?: string | null;
  github_handle?: string | null;
  tagline?: string | null;
  updated_at?: string | null;
  subscription_tier?: string | null;
  pro_since?: string | null;
  referral_reward_expires_at?: string | null;
  pro_referrals_count?: number | null;
  is_profile_verified?: boolean | null;
  twitter_share_unlocked?: boolean | null;
  builder_score?: number | null;
};

type BadgeBlock = {
  type: string;
  data?: any;
  links?: any[];
};

export const BADGE_CATALOG: Record<ProfileBadge["key"], Omit<ProfileBadge, "key">> = {
  profile_complete: {
    label: "Perfil completo", shortLabel: "Completo", icon: "✦", tone: "trust",
    description: "Tu perfil está completo con nombre, avatar, tagline, GitHub y al menos 4 bloques visibles.",
    hint: "Agregá nombre, foto de perfil, tagline, tu GitHub y al menos 4 bloques visibles.",
  },
  active_this_week: {
    label: "Activo esta semana", shortLabel: "Activo", icon: "⚡", tone: "activity",
    description: "Actualizaste tu perfil en los últimos 7 días.",
    hint: "Editá y guardá tu perfil para renovar este badge cada semana.",
  },
  twitter_connected: {
    label: "Twitter conectado", shortLabel: "Twitter", icon: "𝕏", tone: "community",
    description: "Tenés tu cuenta de Twitter/X visible en tu bloque de redes sociales.",
    hint: "Agregá un bloque de Redes Sociales e incluí tu handle de Twitter/X.",
  },
  builder_of_the_week: {
    label: "Builder de la semana", shortLabel: "BOTW", icon: "◆", tone: "achievement",
    description: "Fuiste elegido Builder de la Semana por la comunidad.",
    hint: "Cada semana la comunidad elige un Builder destacado. Participá en el showcase.",
  },
  premium: {
    label: "Pro", shortLabel: "Pro", icon: "◈", tone: "premium",
    description: "Acceso Pro activo — más bloques, análisis y features avanzadas.",
    hint: "Activá el plan Pro para desbloquear más bloques, insights y features.",
  },
  ambassador: {
    label: "Embajador", shortLabel: "Embajador", icon: "✶", tone: "community",
    description: "Referiste al menos un builder al ecosistema de huevsite.",
    hint: "Compartí tu link de referido y conseguí que al menos un builder se una.",
  },
  multi_block: {
    label: "Bloque maestro", shortLabel: "Bloques", icon: "▣", tone: "activity",
    description: "Tenés 8 o más bloques en tu perfil.",
    hint: "Agregá más bloques a tu perfil hasta llegar a 8 para desbloquear este badge.",
  },
  github_linked: {
    label: "GitHub conectado", shortLabel: "GitHub", icon: "◭", tone: "trust",
    description: "Tenés un bloque de GitHub Stats activo en tu perfil.",
    hint: "Agregá un bloque de GitHub Stats con tu usuario para desbloquear este badge.",
  },
  rising_builder: {
    label: "Builder en ascenso", shortLabel: "Rising", icon: "△", tone: "achievement",
    description: "Tu builder score superó los 300 puntos.",
    hint: "Seguí mejorando tu perfil y sumando bloques para llegar a 300 pts de builder score.",
  },
};

export const ALL_BADGE_KEYS: ProfileBadge["key"][] = [
  "profile_complete", "active_this_week", "twitter_connected",
  "github_linked", "multi_block", "rising_builder",
  "builder_of_the_week", "premium", "ambassador",
];

function createBadge(key: ProfileBadge["key"]): ProfileBadge {
  return { key, ...BADGE_CATALOG[key] };
}

export function isProfileComplete(profile: BadgeProfile, blockCount: number, blocks: BadgeBlock[] = []) {
  // "GitHub" is satisfied by EITHER the profile.github_handle column (set via the
  // Edit Profile modal) OR a GitHub block on the board — otherwise a user who adds
  // a GitHub block (and earns github_linked) but never fills the handle field stays
  // silently locked out of profile_complete.
  const hasGithub = Boolean(profile.github_handle) || hasGithubBlock(blocks);
  return Boolean(profile.name && profile.image && hasGithub && profile.tagline && blockCount >= 4);
}

function hasTwitterInBlocks(blocks: BadgeBlock[]): boolean {
  return blocks.some(b =>
    b.type === "social" &&
    ((b as any).links || (b.data as any)?.links || []).some(
      (l: any) => l.platform === "twitter" && (l.url || l.handle)
    )
  );
}

function hasGithubBlock(blocks: BadgeBlock[]): boolean {
  return blocks.some(b => b.type === "github");
}

export function getProfileBadges(
  profile: BadgeProfile,
  options: { blockCount: number; hasWonBuilderOfTheWeek: boolean; blocks?: BadgeBlock[] }
) {
  const badges: ProfileBadge[] = [];
  const blocks = options.blocks || [];

  if (isProfileComplete(profile, options.blockCount, blocks)) badges.push(createBadge("profile_complete"));

  if (profile.updated_at && new Date(profile.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    badges.push(createBadge("active_this_week"));
  }

  if (hasTwitterInBlocks(blocks)) badges.push(createBadge("twitter_connected"));
  if (hasGithubBlock(blocks)) badges.push(createBadge("github_linked"));
  if (options.blockCount >= 8) badges.push(createBadge("multi_block"));
  if ((profile.builder_score || 0) >= 300) badges.push(createBadge("rising_builder"));

  if (options.hasWonBuilderOfTheWeek) badges.push(createBadge("builder_of_the_week"));
  if (hasPaidProBadge(profile)) badges.push(createBadge("premium"));
  if ((profile.pro_referrals_count || 0) > 0) badges.push(createBadge("ambassador"));

  return badges;
}
