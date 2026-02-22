import { AccentColor, Role } from "./onboarding-types";

export type BlockType =
  | "hero"
  | "building"
  | "github"
  | "project"
  | "stack"
  | "metric"
  | "social"
  | "community"
  | "writing";

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
  roles: Role[];
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

export interface CommunityBlockData extends BaseBlock {
  type: "community";
  name: string;
  badgeUrl?: string;
}

export interface WritingBlockData extends BaseBlock {
  type: "writing";
  posts: Array<{ title: string; date: string; link: string }>;
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
  | WritingBlockData;

export interface ProfileData {
  username: string;
  displayName: string;
  accentColor: string;
  blocks: BlockData[];
}
