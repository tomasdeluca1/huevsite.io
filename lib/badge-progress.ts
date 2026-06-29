import { BADGE_CATALOG } from "./profile-badges";
import { ProfileBadgeKey, BlockType } from "./profile-types";

/**
 * Client-side badge progress for the editor "quests" panel.
 *
 * This mirrors the determinstic badge rules in `getProfileBadges`
 * (lib/profile-badges.ts) but adds a progress ratio and an actionable next
 * step so the editor can nudge the user toward improving their board in real
 * time — without recomputing the server-authoritative builder score.
 */

export type QuestAction =
  | { kind: "addBlock"; blockType: BlockType; label: string }
  | { kind: "editProfile"; label: string }
  | { kind: "share"; label: string }
  | { kind: "upgrade"; label: string }
  | { kind: "link"; href: string; label: string };

export interface BadgeProgress {
  key: ProfileBadgeKey;
  label: string;
  shortLabel: string;
  icon: string;
  tone: string;
  earned: boolean;
  /** Satisfied sub-steps (or current metric value, clamped). */
  current: number;
  /** Total sub-steps / target metric. */
  target: number;
  /** 0..1 completion. */
  ratio: number;
  /** Short, dynamic, action-oriented hint. */
  hint: string;
  action?: QuestAction;
}

export interface QuestInput {
  name?: string | null;
  avatarUrl?: string | null;
  githubHandle?: string | null;
  tagline?: string | null;
  builderScore?: number | null;
  hasProAccess?: boolean | null;
  proReferralsCount?: number | null;
  isWinner?: boolean | null;
  updatedAt?: string | null;
  blocks: Array<{ type: string; visible?: boolean; links?: any[]; data?: any }>;
  visibleBlockCount: number;
}

function hasTwitterInBlocks(blocks: QuestInput["blocks"]): boolean {
  return blocks.some(
    (b) =>
      b.type === "social" &&
      ((b as any).links || (b as any).data?.links || []).some(
        (l: any) => l?.platform === "twitter" && (l.url || l.handle)
      )
  );
}

function hasGithubBlock(blocks: QuestInput["blocks"]): boolean {
  return blocks.some((b) => b.type === "github");
}

const ratio = (current: number, target: number) =>
  target <= 0 ? 1 : Math.max(0, Math.min(1, current / target));

export function getBadgeProgress(input: QuestInput): BadgeProgress[] {
  const blocks = input.blocks || [];
  const blockCount = input.visibleBlockCount;
  const score = input.builderScore || 0;

  const meta = (key: ProfileBadgeKey) => ({
    key,
    label: BADGE_CATALOG[key].label,
    shortLabel: BADGE_CATALOG[key].shortLabel,
    icon: BADGE_CATALOG[key].icon,
    tone: BADGE_CATALOG[key].tone as string,
  });

  const result: BadgeProgress[] = [];

  // profile_complete — name + avatar + github + tagline + >=4 blocks
  {
    // Mirror isProfileComplete: respect the hero block for name/tagline/avatar
    // (set there, not always synced to the profiles row) and accept a GitHub block.
    const hero: any = blocks.find((b) => b.type === "hero")?.data || {};
    const effName = input.name || hero.name;
    const effAvatar = input.avatarUrl || hero.avatarUrl;
    const effTagline = input.tagline || hero.tagline;
    const hasGithub = Boolean(input.githubHandle) || hasGithubBlock(blocks);
    const steps = [
      Boolean(effName),
      Boolean(effAvatar),
      hasGithub,
      Boolean(effTagline),
      blockCount >= 4,
    ];
    const current = steps.filter(Boolean).length;
    const earned = current === steps.length;
    const missingProfileField = !effName || !effAvatar || !hasGithub || !effTagline;
    result.push({
      ...meta("profile_complete"),
      earned,
      current,
      target: steps.length,
      ratio: ratio(current, steps.length),
      hint: earned
        ? "Tu perfil está completo. 💪"
        : missingProfileField
        ? "Completá nombre, foto, tagline y GitHub en tu perfil."
        : `Te faltan ${4 - blockCount} bloque(s) para completar el perfil.`,
      action: earned
        ? undefined
        : missingProfileField
        ? { kind: "editProfile", label: "Completar perfil" }
        : { kind: "addBlock", blockType: "project", label: "Agregar bloque" },
    });
  }

  // github_linked — has a GitHub block
  {
    const earned = hasGithubBlock(blocks);
    result.push({
      ...meta("github_linked"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "GitHub conectado." : "Sumá tu actividad de GitHub con un bloque de stats.",
      action: earned ? undefined : { kind: "addBlock", blockType: "github", label: "Agregar GitHub" },
    });
  }

  // twitter_connected — twitter link inside a social block
  {
    const earned = hasTwitterInBlocks(blocks);
    result.push({
      ...meta("twitter_connected"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "Twitter/X conectado." : "Agregá un bloque de Redes con tu handle de X.",
      action: earned ? undefined : { kind: "addBlock", blockType: "social", label: "Agregar Redes" },
    });
  }

  // multi_block — 8+ visible blocks
  {
    const earned = blockCount >= 8;
    result.push({
      ...meta("multi_block"),
      earned,
      current: Math.min(blockCount, 8),
      target: 8,
      ratio: ratio(blockCount, 8),
      hint: earned
        ? "Board completísimo. 🔥"
        : `Te falta${8 - blockCount === 1 ? "" : "n"} ${8 - blockCount} bloque(s) para llegar a 8.`,
      action: earned ? undefined : { kind: "addBlock", blockType: "project", label: "Agregar bloque" },
    });
  }

  // rising_builder — score >= 300
  {
    const earned = score >= 300;
    result.push({
      ...meta("rising_builder"),
      earned,
      current: Math.min(score, 300),
      target: 300,
      ratio: ratio(score, 300),
      hint: earned
        ? "Estás en el ranking. 📈"
        : `Te faltan ${300 - score} pts. Sumá proyectos y conseguí seguidores.`,
      action: earned ? undefined : { kind: "addBlock", blockType: "project", label: "Sumar proyecto" },
    });
  }

  // ambassador — at least one referral
  {
    const count = input.proReferralsCount || 0;
    const earned = count > 0;
    result.push({
      ...meta("ambassador"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "Sos embajador. 🤝" : "Invitá a un builder con tu link de referido.",
      action: earned ? undefined : { kind: "link", href: "/referrals", label: "Ver referidos" },
    });
  }

  // premium — Pro access
  {
    const earned = Boolean(input.hasProAccess);
    result.push({
      ...meta("premium"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "Plan Pro activo." : "Desbloqueá más bloques, insights y dominio propio.",
      action: earned ? undefined : { kind: "upgrade", label: "Ir a Pro" },
    });
  }

  // builder_of_the_week — won the showcase
  {
    const earned = Boolean(input.isWinner);
    result.push({
      ...meta("builder_of_the_week"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "¡Fuiste Builder de la semana! ◆" : "Compartí tu board y pedí que te nominen en el showcase.",
      action: earned ? undefined : { kind: "share", label: "Compartir y sumar" },
    });
  }

  // active_this_week — updated in the last 7 days (auto-renews while editing)
  {
    const earned = input.updatedAt
      ? new Date(input.updatedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : true;
    result.push({
      ...meta("active_this_week"),
      earned,
      current: earned ? 1 : 0,
      target: 1,
      ratio: earned ? 1 : 0,
      hint: earned ? "Activo esta semana." : "Guardá un cambio para renovar este badge.",
      action: earned ? undefined : { kind: "editProfile", label: "Editar perfil" },
    });
  }

  return result;
}

export interface QuestSummary {
  total: number;
  earned: number;
  /** Locked badges sorted by closeness to completion (most progress first). */
  nextUp: BadgeProgress[];
  /** The single best next quest (highest progress, actionable). */
  topQuest?: BadgeProgress;
}

export function summarizeQuests(progress: BadgeProgress[]): QuestSummary {
  const earned = progress.filter((p) => p.earned);
  const locked = progress
    .filter((p) => !p.earned)
    .sort((a, b) => b.ratio - a.ratio);
  const topQuest = locked.find((p) => p.action) || locked[0];
  return {
    total: progress.length,
    earned: earned.length,
    nextUp: locked,
    topQuest,
  };
}
