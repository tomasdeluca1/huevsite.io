import { AccentColor, Role } from "./onboarding-types";

export type SubscriptionTier = "free" | "pro";

export const MAX_FREE_BLOCKS = 5;

export type TaglineStatus =
  | "disponible para proyectos"
  | "trabajando a full"
  | "buscando laburo"
  | "modo zen";

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
  if (isDarkColor(hexColor)) {
    // If it's too dark for a black background, return something slightly more visible
    // but keep it as dark as possible to respect user's choice.
    return "#1a1a1a"; 
  }
  return hexColor;
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
  | "custom";

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  col_span: number;
  row_span: number;
  visible: boolean;
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
  stats: {
    stars: number;
    repos: number;
    followers: number;
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
  posts: Array<{ title: string; date: string; link: string }>;
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
  | CustomBlockData;

export interface ProfileData {
  id?: string;
  username: string;
  displayName: string;
  tagline?: string;
  accentColor: string;
  subscriptionTier: "free" | "pro";
  twitterShareUnlocked: boolean;
  extraBlocksFromShare: number;
  hasSeenUpdateFeb25?: boolean;
  blocks: BlockData[];
}
