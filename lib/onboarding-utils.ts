import { BlockData } from "@/lib/profile-types";
import {
  INITIAL_STATE,
  type GitHubData,
  type OnboardingCompletionData,
  type OnboardingState,
  type Role,
} from "@/lib/onboarding-types";

interface BuildInitialStateParams {
  username?: string;
  accentColor?: string;
  layout?: OnboardingCompletionData["layout"] | null;
  roles?: Role[] | null;
  githubData?: GitHubData | null;
}

interface BuildBlocksParams {
  state: Pick<
    OnboardingCompletionData,
    "username" | "accentColor" | "layout" | "roles" | "githubData" | "githubHandle"
  >;
  displayName?: string;
  avatarUrl?: string;
  tagline?: string;
}

export function buildInitialOnboardingState({
  username,
  accentColor,
  layout,
  roles,
  githubData,
}: BuildInitialStateParams): OnboardingState {
  return {
    ...INITIAL_STATE,
    username: username || "",
    accentColor: (accentColor as OnboardingState["accentColor"]) || INITIAL_STATE.accentColor,
    layout: layout || null,
    roles: roles || [],
    githubConnected: !!githubData,
    githubData: githubData || null,
    usernameAvailable: username ? true : null,
  };
}

export function buildOnboardingCompletionData(
  state: OnboardingState
): OnboardingCompletionData {
  if (!state.layout) {
    throw new Error("Onboarding incompleto: falta layout.");
  }

  return {
    username: state.username,
    accentColor: state.accentColor,
    layout: state.layout,
    roles: state.roles,
    githubHandle: state.githubData?.username,
    githubData: state.githubData,
  };
}

export function buildOnboardingBlocks({
  state,
  displayName,
  avatarUrl,
  tagline,
}: BuildBlocksParams): BlockData[] {
  const name = state.githubData?.name || displayName || state.username;
  const bio = state.githubData?.bio || tagline || "";
  const image = state.githubData?.avatarUrl || avatarUrl || "";
  const stackItems = state.githubData?.topLanguages?.slice(0, 5) || [];
  const socialLinks = state.githubHandle
    ? [{ platform: "github", url: `https://github.com/${state.githubHandle}` }]
    : [];

  const githubStats = state.githubData
    ? {
        stars:
          state.githubData.topRepos?.reduce((acc, repo) => acc + (repo.stars || 0), 0) || 0,
        repos: state.githubData.publicRepos || 0,
        followers: state.githubData.followers || 0,
        topLanguages:
          state.githubData.topLanguages?.slice(0, 3).map((lang) => ({
            name: lang,
            percent: 33,
          })) || [],
      }
    : null;

  const baseBlocks: Record<string, BlockData> = {
    hero: {
      id: "hero-onboarding",
      type: "hero",
      order: 0,
      col_span: state.layout === "creative" ? 1 : state.layout === "minimal" ? 2 : 2,
      row_span: state.layout === "minimal" ? 1 : 2,
      visible: true,
      name,
      avatarUrl: image,
      tagline: bio,
      description: "",
      roles: state.roles,
      status: "",
      location: "",
    },
    github: {
      id: "github-onboarding",
      type: "github",
      order: 1,
      col_span: 1,
      row_span: 2,
      visible: true,
      username: state.githubHandle || "",
      showAdvanced: true,
      stats: githubStats || {
        stars: 0,
        repos: 0,
        followers: 0,
        topLanguages: [],
      },
    },
    social: {
      id: "social-onboarding",
      type: "social",
      order: 2,
      col_span: state.layout === "minimal" ? 2 : 1,
      row_span: 1,
      visible: true,
      links: socialLinks,
    },
    stack: {
      id: "stack-onboarding",
      type: "stack",
      order: 3,
      col_span: 1,
      row_span: 1,
      visible: true,
      items: stackItems,
    },
    metric: {
      id: "metric-onboarding",
      type: "metric",
      order: 4,
      col_span: 1,
      row_span: 1,
      visible: true,
      label: "Mode",
      value:
        state.roles[0] === "founder"
          ? "Founder"
          : state.roles[0] === "designer"
          ? "Designer"
          : state.roles[0] === "indie_hacker"
          ? "Indie"
          : "Builder",
      icon: "sparkles",
    },
  };

  const layouts: Record<OnboardingCompletionData["layout"], Array<keyof typeof baseBlocks>> = {
    dev_heavy: ["hero", "github", "stack", "social"],
    founder_heavy: githubStats ? ["hero", "metric", "github", "social"] : ["hero", "metric", "social", "stack"],
    minimal: githubStats ? ["hero", "social", "github"] : ["hero", "social", "stack"],
    creative: githubStats ? ["hero", "social", "stack", "github"] : ["hero", "social", "stack"],
  };

  return layouts[state.layout]
    .map((key, order) => ({ ...baseBlocks[key], order }))
    .filter((block) => {
      if (block.type === "github") return !!githubStats && !!state.githubHandle;
      if (block.type === "social") return block.links.length > 0;
      if (block.type === "stack") return block.items.length > 0;
      return true;
    });
}
