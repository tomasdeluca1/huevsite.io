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
  has_good_reputation?: boolean | null;
  is_top_matchmaker?: boolean | null;
  twitter_share_unlocked?: boolean | null;
};

export const BADGE_CATALOG: Record<ProfileBadge["key"], Omit<ProfileBadge, "key">> = {
  profile_complete:    {
    label: "Perfil completo",      shortLabel: "Completo",   icon: "✦", tone: "trust",
    description: "Tu perfil está completo con nombre, avatar, tagline, GitHub y al menos 4 bloques visibles.",
    hint:        "Agregá nombre, foto de perfil, tagline, tu GitHub y al menos 4 bloques visibles.",
  },
  profile_validated:  {
    label: "Perfil validado",      shortLabel: "Validado",   icon: "◈", tone: "trust",
    description: "El equipo de huevsite revisó y validó tu perfil manualmente.",
    hint:        "Badge asignado manualmente por el equipo de huevsite. No se puede solicitar — revisamos perfiles de forma proactiva cuando los consideramos confiables y completos.",
  },
  good_reputation:    {
    label: "Buena reputación",     shortLabel: "Reputación", icon: "◉", tone: "trust",
    description: "Reconocido por la comunidad por tu calidad y actitud.",
    hint:        "Badge asignado manualmente por el equipo de huevsite a perfiles que aportan valor genuino y tienen buena actitud en la comunidad. No se puede solicitar.",
  },
  active_this_week:   {
    label: "Activo esta semana",   shortLabel: "Activo",     icon: "⚡", tone: "activity",
    description: "Actualizaste tu perfil en los últimos 7 días.",
    hint:        "Editá y guardá tu perfil para renovar este badge cada semana.",
  },
  top_matchmaker:     {
    label: "Top matchmaker",       shortLabel: "Matcher",    icon: "⟡", tone: "community",
    description: "Conectaste builders de manera destacada en la comunidad.",
    hint:        "Badge asignado manualmente por el equipo de huevsite a quienes conectan activamente a otros builders entre sí dentro del ecosistema. No se puede solicitar.",
  },
  builder_of_the_week: {
    label: "Builder de la semana", shortLabel: "BOTW",       icon: "◆", tone: "achievement",
    description: "Fuiste elegido Builder de la Semana por la comunidad.",
    hint:        "Cada semana la comunidad elige un Builder destacado. Participá en el showcase.",
  },
  premium:            {
    label: "Pro",                  shortLabel: "Pro",        icon: "◈", tone: "premium",
    description: "Acceso Pro activo — más bloques, análisis y features avanzadas.",
    hint:        "Activá el plan Pro para desbloquear más bloques, insights y features.",
  },
  ambassador:         {
    label: "Embajador",            shortLabel: "Embajador",  icon: "✶", tone: "community",
    description: "Referiste al menos un builder al ecosistema de huevsite.",
    hint:        "Compartí tu link de referido y conseguí que al menos un builder se una.",
  },
  twitter_connected:  {
    label: "Twitter conectado",    shortLabel: "Twitter",    icon: "𝕏", tone: "community",
    description: "Conectaste tu cuenta de Twitter/X al ecosistema de huevsite.",
    hint:        "Compartí tu perfil en Twitter usando el botón de compartir del dashboard.",
  },
};

export const ALL_BADGE_KEYS: ProfileBadge["key"][] = [
  "profile_complete", "profile_validated", "good_reputation",
  "active_this_week", "top_matchmaker", "builder_of_the_week",
  "premium", "ambassador", "twitter_connected",
];

function createBadge(key: ProfileBadge["key"]): ProfileBadge {
  return { key, ...BADGE_CATALOG[key] };
}

export function isProfileComplete(profile: BadgeProfile, blockCount: number) {
  return Boolean(profile.name && profile.image && profile.github_handle && profile.tagline && blockCount >= 4);
}

export function getProfileBadges(profile: BadgeProfile, options: { blockCount: number; hasWonBuilderOfTheWeek: boolean }) {
  const badges: ProfileBadge[] = [];

  if (isProfileComplete(profile, options.blockCount)) badges.push(createBadge("profile_complete"));
  if (profile.is_profile_verified) badges.push(createBadge("profile_validated"));
  if (profile.has_good_reputation) badges.push(createBadge("good_reputation"));

  if (profile.updated_at && new Date(profile.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    badges.push(createBadge("active_this_week"));
  }

  if (profile.is_top_matchmaker) badges.push(createBadge("top_matchmaker"));
  if (options.hasWonBuilderOfTheWeek) badges.push(createBadge("builder_of_the_week"));
  if (hasPaidProBadge(profile)) badges.push(createBadge("premium"));
  if ((profile.pro_referrals_count || 0) > 0) badges.push(createBadge("ambassador"));
  if (profile.twitter_share_unlocked) badges.push(createBadge("twitter_connected"));

  return badges;
}
