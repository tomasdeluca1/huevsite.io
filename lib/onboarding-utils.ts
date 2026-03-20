import { BlockData } from "@/lib/profile-types";
import {
  type ImportedLinktreeLink,
  getImportedLinkLabel,
} from "@/lib/linktree-import";
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
  linktreeData?: OnboardingCompletionData["linktreeData"] | null;
}

interface BuildBlocksParams {
  state: Pick<
    OnboardingCompletionData,
    | "username"
    | "accentColor"
    | "layout"
    | "roles"
    | "githubData"
    | "githubHandle"
    | "linktreeData"
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
  linktreeData,
}: BuildInitialStateParams): OnboardingState {
  return {
    ...INITIAL_STATE,
    username: username || "",
    accentColor: (accentColor as OnboardingState["accentColor"]) || INITIAL_STATE.accentColor,
    layout: layout || null,
    roles: roles || [],
    githubConnected: !!githubData,
    githubData: githubData || null,
    linktreeData: linktreeData || null,
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
    linktreeData: state.linktreeData,
  };
}

export function buildOnboardingBlocks({
  state,
  displayName,
  avatarUrl,
  tagline,
}: BuildBlocksParams): BlockData[] {
  const name =
    state.githubData?.name || state.linktreeData?.displayName || displayName || state.username;
  const bio = state.githubData?.bio || state.linktreeData?.bio || tagline || "";
  const image = state.githubData?.avatarUrl || state.linktreeData?.avatarUrl || avatarUrl || "";
  const stackItems = state.githubData?.topLanguages?.slice(0, 5) || [];
  const linktreeLinks = state.linktreeData?.links || [];
  const hasLinktreeImport = linktreeLinks.length > 0;
  const dedupeByUrl = <T extends { url: string }>(items: T[]) =>
    items.filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.url.replace(/\/$/, "").toLowerCase() ===
            item.url.replace(/\/$/, "").toLowerCase()
        ) === index
    );

  const socialSourceLinks = dedupeByUrl(
    [
      ...(state.githubHandle
        ? [
            {
              title: "GitHub",
              url: `https://github.com/${state.githubHandle}`,
              platform: "github" as const,
              hostname: "github.com",
              category: "social" as const,
            },
          ]
        : []),
      ...linktreeLinks.filter((link) => link.category === "social" || link.category === "community"),
    ]
  );

  const socialLinks = socialSourceLinks.map((link) => ({
    platform: link.platform,
    url: link.url,
    label: link.title,
  }));

  const writingLinks = linktreeLinks.filter((link) => link.category === "writing").slice(0, 4);
  const mediaLinks = linktreeLinks.filter((link) => link.category === "media").slice(0, 2);
  const projectLinks = linktreeLinks
    .filter((link) => link.category === "project")
    .filter((link) => !writingLinks.some((writing) => writing.url === link.url))
    .filter((link) => !mediaLinks.some((media) => media.url === link.url));
  const utilityLinks = linktreeLinks.filter((link) => link.category === "other");
  const featuredLinks = [...projectLinks, ...utilityLinks].slice(0, 4);

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

  const roleMetricValue =
    state.roles[0] === "founder"
      ? "Founder"
      : state.roles[0] === "designer"
      ? "Designer"
      : state.roles[0] === "indie_hacker"
      ? "Indie"
      : "Builder";

  const heroBlock: Extract<BlockData, { type: "hero" }> = {
    id: "hero-onboarding",
    type: "hero",
    order: 0,
    col_span: state.layout === "creative" ? 1 : 2,
    row_span: state.layout === "minimal" ? 1 : 2,
    visible: true,
    name,
    avatarUrl: image,
    tagline: bio,
    description: "",
    roles: state.roles,
    status: "",
    location: "",
  };

  const githubBlock: Extract<BlockData, { type: "github" }> | null =
    githubStats && state.githubHandle
      ? {
          id: "github-onboarding",
          type: "github",
          order: 1,
          col_span: 1,
          row_span: 2,
          visible: true,
          username: state.githubHandle,
          showAdvanced: true,
          stats: githubStats,
        }
      : null;

  const socialBlock: Extract<BlockData, { type: "social" }> | null =
    socialLinks.length > 0
      ? {
          id: "social-onboarding",
          type: "social",
          order: 2,
          col_span: socialLinks.length >= 4 || state.layout === "minimal" ? 2 : 1,
          row_span: socialLinks.length >= 5 ? 2 : 1,
          visible: true,
          links: socialLinks,
        }
      : null;

  const stackBlock: Extract<BlockData, { type: "stack" }> | null =
    stackItems.length > 0
      ? {
          id: "stack-onboarding",
          type: "stack",
          order: 3,
          col_span: 1,
          row_span: 1,
          visible: true,
          items: stackItems,
        }
      : null;

  const modeMetricBlock: Extract<BlockData, { type: "metric" }> = {
    id: "metric-onboarding",
    type: "metric",
    order: 4,
    col_span: 1,
    row_span: 1,
    visible: true,
    label: "MODE",
    value: roleMetricValue,
    icon: "sparkles",
  };

  const linkCountMetricBlock: Extract<BlockData, { type: "metric" }> | null =
    hasLinktreeImport
      ? {
          id: "metric-link-count-onboarding",
          type: "metric",
          order: 5,
          col_span: 1,
          row_span: 1,
          visible: true,
          label: "LINKS",
          value: String(linktreeLinks.length),
          icon: "globe",
        }
      : null;

  const writingBlock: Extract<BlockData, { type: "writing" }> | null =
    writingLinks.length > 0
      ? {
          id: "writing-onboarding",
          type: "writing",
          order: 6,
          col_span: 1,
          row_span: Math.min(2, Math.max(1, writingLinks.length > 2 ? 2 : 1)),
          visible: true,
          posts: writingLinks.map((link) => ({
            title: link.title,
            date: link.hostname,
            link: link.url,
          })),
        }
      : null;

  const mediaBlock: Extract<BlockData, { type: "media" }> | null =
    mediaLinks[0]
      ? {
          id: "media-onboarding",
          type: "media",
          order: 7,
          col_span: 1,
          row_span: 1,
          visible: true,
          url: mediaLinks[0].url,
          title: mediaLinks[0].title,
          description: `Contenido destacado desde ${mediaLinks[0].hostname}.`,
          link: mediaLinks[0].url,
        }
      : null;

  const buildProjectBlock = (
    link: ImportedLinktreeLink,
    index: number
  ): Extract<BlockData, { type: "project" }> => ({
    id: `project-onboarding-${index}`,
    type: "project",
    order: 10 + index,
    col_span: index === 0 ? 2 : 1,
    row_span: index === 0 ? 2 : 1,
    visible: true,
    title: link.title,
    description: buildProjectDescription(link),
    imageUrl: "",
    metrics: "",
    link: link.url,
    stack: [],
  });

  const buildCustomBlock = (
    link: ImportedLinktreeLink,
    index: number
  ): Extract<BlockData, { type: "custom" }> => ({
    id: `custom-onboarding-${index}`,
    type: "custom",
    order: 30 + index,
    col_span: 1,
    row_span: 1,
    visible: true,
    label: getImportedLinkLabel(link).toUpperCase(),
    title: link.title,
    description: buildCustomDescription(link),
    link: link.url,
  });

  const primaryProjects = projectLinks.slice(0, 2).map(buildProjectBlock);
  const secondaryCustoms = featuredLinks
    .filter((link) => !primaryProjects.some((project) => project.link === link.url))
    .map(buildCustomBlock);

  const orderedBlocks: BlockData[] = [
    heroBlock,
    ...primaryProjects,
    ...(socialBlock ? [socialBlock] : []),
    ...(writingBlock ? [writingBlock] : []),
    ...(mediaBlock ? [mediaBlock] : []),
    ...(githubBlock ? [githubBlock] : []),
    ...(stackBlock ? [stackBlock] : []),
    ...(hasLinktreeImport && linkCountMetricBlock ? [linkCountMetricBlock] : []),
    ...secondaryCustoms,
    ...(hasLinktreeImport
      ? [
          buildCustomBlock(
            {
              title: "Origen importado",
              url: state.linktreeData?.sourceUrl || "",
              platform: "website",
              hostname: "linktree",
              category: "other",
            },
            99
          ),
        ]
      : []),
    modeMetricBlock,
  ].filter((block) => {
    if (block.type === "custom" || block.type === "project" || block.type === "media") {
      return !!block.link;
    }
    return true;
  });

  const uniqueBlocks = orderedBlocks.filter(
    (block, index, all) =>
      all.findIndex((candidate) => {
        if ("link" in candidate && "link" in block) {
          return candidate.type === block.type && candidate.link === block.link;
        }
        return candidate.id === block.id;
      }) === index
  );

  const compactBlocks = uniqueBlocks.slice(0, hasLinktreeImport ? 8 : 5);

  return compactBlocks.map((block, order) => ({ ...block, order }));
}

function buildProjectDescription(link: ImportedLinktreeLink) {
  if (link.category === "project") {
    return `Entrada principal a ${link.hostname} desde tu board.`;
  }

  if (link.category === "media") {
    return `Contenido destacado publicado en ${link.hostname}.`;
  }

  return `Abrí ${link.hostname} sin salir del contexto de tu board.`;
}

function buildCustomDescription(link: ImportedLinktreeLink) {
  if (link.category === "writing") {
    return `Texto o newsletter publicado en ${link.hostname}.`;
  }

  if (link.category === "community") {
    return `Punto de entrada a tu comunidad en ${link.hostname}.`;
  }

  if (link.category === "social") {
    return `Canal activo en ${getImportedLinkLabel(link).toLowerCase()}.`;
  }

  return `Abrí ${link.hostname} directo desde tu board.`;
}
