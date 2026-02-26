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
  | "cv";

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
  | CVBlockData;

export interface ProfileData {
  id?: string;
  username: string;
  displayName: string;
  tagline?: string;
  accentColor: string;
  subscriptionTier: "free" | "pro";
  twitterShareUnlocked: boolean;
  extraBlocksFromShare: number;
  blocks: BlockData[];
}
