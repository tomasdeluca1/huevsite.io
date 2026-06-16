import { AccentColor, Role } from "./onboarding-types";

export type SubscriptionTier = "free" | "pro";

export const MAX_FREE_BLOCKS = 5;
export const MAX_PRO_BLOCKS = 22;

export type ProfileBadgeKey =
  | "profile_complete"
  | "active_this_week"
  | "twitter_connected"
  | "github_linked"
  | "multi_block"
  | "rising_builder"
  | "builder_of_the_week"
  | "premium"
  | "ambassador";

export interface ProfileBadge {
  key: ProfileBadgeKey;
  label: string;
  shortLabel: string;
  description: string;
  hint: string;
  icon: string;
  tone: "trust" | "activity" | "achievement" | "premium" | "community";
}

export interface FreeTrialState {
  eligible: boolean;
  active: boolean;
  claimed: boolean;
  expiresAt?: string | null;
  claimedAt?: string | null;
  daysRemaining?: number;
  canUseLastInsightsView: boolean;
  lastInsightsViewedAt?: string | null;
}

export type TaglineStatus =
  | "disponible para proyectos"
  | "trabajando a full"
  | "buscando laburo"
  | "modo zen";

export const PRESET_BORDER_RADIUS = [
  { label: 'Sharp', value: '0px' },
  { label: 'Subtle', value: '0.5rem' },
  { label: 'Rounded', value: '1rem' },
  { label: 'Soft', value: '1.5rem' },
  { label: 'Pill', value: '2.5rem' },
];

export const PRESET_COLORS = [
  "#C8FF00", // Acid Green
  "#4D9FFF", // Electric Blue
  "#A855F7", // Crypto Purple
  "#FF7A00", // Productividad Orange
  "#FF3B3B", // Crimson
  "#00FF88", // Matrix Green
  "#FFD600", // Gold
  "#FFFFFF", // Clean White
];

export function getContrastColor(hexColor: string): string {
  if (!hexColor || typeof hexColor !== "string") return "#000000";
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return "#000000";

  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);

  // Calculate relative luminance using YIQ
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 145 ? "#000000" : "#FFFFFF";
}

// Canonical accent-color format. accent_color is interpolated UNESCAPED into a
// `<style dangerouslySetInnerHTML>` tag on every public profile page, so a value
// that isn't a strict 6-digit hex can break out of the style context (stored
// XSS). Validate on every write path AND sanitize on render against this.
export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
export const DEFAULT_ACCENT_COLOR = "#C8FF00";

export function isValidAccentColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

export function isDarkColor(hexColor: string): boolean {
  if (!hexColor || typeof hexColor !== "string") return true;
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 40;
}

export function getAdjustedAccentColor(hexColor: string): string {
  // Defense-in-depth: never let a non-hex value reach the public style tag,
  // regardless of how it was stored. Falls back to the brand default.
  const safe = isValidAccentColor(hexColor) ? hexColor : DEFAULT_ACCENT_COLOR;
  if (isDarkColor(safe)) {
    // Si es demasiado oscuro para fondo negro, devolvemos un color que sea legible
    // pero que mantenga la esencia del color elegido (en este caso un gris claro/blanco)
    return "#A1A1AA"; // zinc-400 (visible sobre negro)
  }
  return safe;
}

export type BlockType =
  | "hero"
  | "building"
  | "github"
  | "project"
  | "stack"
  | "metric"
  | "social"
  | "community"
  | "writing"
  | "cv"
  | "media"
  | "certification"
  | "achievement"
  | "collab"
  | "ecosystem"
  | "custom";

export interface EcosystemBlockData extends BaseBlock {
  type: "ecosystem";
  title?: string;
  hideHeaderEcosystem?: boolean;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  col_span: number;
  row_span: number;
  visible: boolean;
  // Board preset al que pertenece el bloque del perfil principal (0-2).
  board_index?: number;
}

export interface HeroBlockData extends BaseBlock {
  type: "hero";
  name: string;
  avatarUrl: string;
  tagline: string;
  description?: string;
  roles?: Role[];
  status: string;
  location: string;
}

export interface BuildingBlockData extends BaseBlock {
  type: "building";
  project: string;
  description: string;
  stack: string[];
  link: string;
}

export interface GitHubBlockData extends BaseBlock {
  type: "github";
  username: string;
  showAdvanced?: boolean;
  stats: {
    stars: number;
    repos: number;
    followers: number;
    topLanguages?: Array<{ name: string; percent: number }>;
    issuesClosed?: number;
    totalCommits?: number;
    heatmap?: number[];
    // Real commit data (populated by lib/github-service via GitHub GraphQL).
    commitsByMonth?: Array<{ month: string; count: number }>; // month = "YYYY-MM"
    commitsThisYear?: number;
    pullRequests?: number;
    syncedAt?: string; // ISO timestamp of the last successful GitHub sync
  };
}

export interface ProjectBlockData extends BaseBlock {
  type: "project";
  title: string;
  description: string;
  imageUrl?: string;
  metrics?: string;
  link: string;
  stack: string[];
}

export interface StackBlockData extends BaseBlock {
  type: "stack";
  items: string[];
}

export interface MetricBlockData extends BaseBlock {
  type: "metric";
  label: string;
  value: string;
  icon?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
  favicon?: string;
}

export interface SocialBlockData extends BaseBlock {
  type: "social";
  links: SocialLink[];
}

export interface Community {
  name: string;
  color?: string;
  badgeUrl?: string; // keeping for backward compatibility
  link?: string;
}

export interface CommunityBlockData extends BaseBlock {
  type: "community";
  communities: Community[];
}

export interface WritingBlockData extends BaseBlock {
  type: "writing";
  posts: Array<{ title: string; date: string; link: string; content?: string }>;
}

export interface CVBlockData extends BaseBlock {
  type: "cv";
  title: string;
  description: string;
  fileUrl: string;
}

export interface MediaBlockData extends BaseBlock {
  type: "media";
  url: string; // image or video URL
  title?: string;
  description?: string;
  link?: string;
}

export interface CertificationBlockData extends BaseBlock {
  type: "certification";
  name: string;
  issuer: string;
  date: string;
  link?: string;
  icon?: string;
}

export interface AchievementBlockData extends BaseBlock {
  type: "achievement";
  title: string;
  description: string;
  date?: string;
}

export interface CustomBlockData extends BaseBlock {
  type: "custom";
  label: string; // The "name" of the element at the top
  title: string;
  description: string;
  link?: string;
}

export interface CollabBlockData extends BaseBlock {
  type: "collab";
  users: Array<{ username: string; role: string }>;
}

export type BlockData =
  | HeroBlockData
  | BuildingBlockData
  | GitHubBlockData
  | ProjectBlockData
  | StackBlockData
  | MetricBlockData
  | SocialBlockData
  | CommunityBlockData
  | WritingBlockData
  | CVBlockData
  | MediaBlockData
  | CertificationBlockData
  | AchievementBlockData
  | CollabBlockData
  | EcosystemBlockData
  | CustomBlockData;

export interface SubSite {
  id: string;
  slug: string;
  title: string;
  description?: string;
  created_at: string;
  avatarUrl?: string;
  sourceUrl?: string;
}

export interface ProfileData {
  id?: string;
  username: string;
  displayName: string;
  email?: string;
  tagline?: string;
  avatarUrl?: string;
  githubHandle?: string;
  accentColor: string;
  roles?: Role[];
  layout?: string;
  subscriptionTier: "free" | "pro";
  hasProAccess?: boolean;
  twitterShareUnlocked: boolean;
  extraBlocksFromShare: number;
  hasSeenUpdateFeb25?: boolean;
  builderScore?: number;
  aiCredits?: number;
  customDomain?: string;
  subSiteId?: string;
  isWinner?: boolean;
  ogImageVersion?: string;
  isOnboardingTestUser?: boolean;
  newsletterSubscribed?: boolean;
  subSites: SubSite[];
  blocks: BlockData[];
  // Board presets (Pro): cuál board está publicado y sus nombres.
  publishedBoard?: number;
  boardNames?: Record<string, string>;
  sourceUrl?: string;
  referralCode?: string;
  referredBy?: string;
  proReferralsCount?: number;
  referralRewardExpiresAt?: string;
  isProfileVerified?: boolean;
  hasGoodReputation?: boolean;
  isTopMatchmaker?: boolean;
  freeTrialClaimedAt?: string | null;
  freeTrialStartedAt?: string | null;
  freeTrialEndsAt?: string | null;
  freeTrialLastInsightsViewedAt?: string | null;
  freeTrial?: FreeTrialState;
  badges?: ProfileBadge[];
  borderRadius?: string;
  parentProfile?: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    tagline?: string
  };
}
