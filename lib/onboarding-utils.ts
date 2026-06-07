import { BlockData } from "@/lib/profile-types";
import {
  extractGitHubProfileUsername,
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
    layout: layout || (username ? selectOnboardingLayout(username) : null),
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
  const selectedLayout = state.layout || selectOnboardingLayout(state.username);

  return {
    username: state.username,
    accentColor: state.accentColor,
    layout: selectedLayout,
    roles: state.roles,
    githubHandle: state.githubData?.username,
    githubData: state.githubData,
    linktreeData: state.linktreeData,
  };
}

export function selectOnboardingLayout(seed?: string | null): OnboardingCompletionData["layout"] {
  const source = (seed || "huevsite").trim().toLowerCase();
  const score = Array.from(source).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return score % 2 === 0 ? "dev_heavy" : "minimal";
}

export function buildOnboardingBlocks({
  state,
  displayName,
  avatarUrl,
  tagline,
}: BuildBlocksParams): BlockData[] {
  const template = resolveBoardTemplate(state.layout);
  const name =
    state.linktreeData?.displayName || state.githubData?.name || displayName || state.username;
  const bio = state.linktreeData?.bio || state.githubData?.bio || tagline || "";
  const image = state.linktreeData?.avatarUrl || state.githubData?.avatarUrl || avatarUrl || "";
  const stackItems = state.githubData?.topLanguages?.slice(0, 5) || [];
  const linktreeLinks = sanitizeImportedLinks(state.linktreeData?.links || []);
  const githubHandle =
    state.githubHandle ||
    state.githubData?.username ||
    linktreeLinks.map((link) => extractGitHubProfileUsername(link.url)).find(Boolean) ||
    undefined;

  const socialSourceLinks = dedupeByUrl(
    linktreeLinks.filter(
      (link) =>
        (link.category === "social" || link.category === "community") &&
        !(githubHandle && link.platform === "github")
    )
  );

  const socialLinks = socialSourceLinks.slice(0, 5).map((link) => ({
    platform: link.platform,
    url: link.url,
    label: link.title,
  }));

  const writingLinks = linktreeLinks.filter((link) => link.category === "writing").slice(0, 4);
  const mediaLinks = linktreeLinks.filter((link) => link.category === "media").slice(0, 2);
  const projectLinks = linktreeLinks
    .filter((link) => link.category === "project")
    .filter((link) => !(githubHandle && link.platform === "github"))
    .filter((link) => !writingLinks.some((writing) => writing.url === link.url))
    .filter((link) => !mediaLinks.some((media) => media.url === link.url));
  const utilityLinks = linktreeLinks.filter((link) => link.category === "other");
  const featuredLinks = [...projectLinks, ...utilityLinks].slice(0, 4);

  const githubStats = hasUsefulGitHubData(state.githubData)
    ? // Prefer the full normalized stats (real heatmap + monthly commits) when
      // the import provided them; otherwise derive a basic fallback.
      state.githubData!.stats ?? {
        stars:
          state.githubData!.topRepos?.reduce((acc, repo) => acc + (repo.stars || 0), 0) || 0,
        repos: state.githubData!.publicRepos || 0,
        followers: state.githubData!.followers || 0,
        topLanguages:
          state.githubData!.topLanguages?.slice(0, 3).map((lang, index, all) => ({
            name: lang,
            percent: Math.max(20, Math.round(100 / Math.max(all.length, 1))),
          })) || [],
      }
    : null;

  const heroBlock: Extract<BlockData, { type: "hero" }> = {
    id: "hero-onboarding",
    type: "hero",
    order: 0,
    col_span: 2,
    row_span: 1,
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
    githubStats && githubHandle
      ? {
          id: "github-onboarding",
          type: "github",
          order: 1,
          col_span: 1,
          row_span: 1,
          visible: true,
          username: githubHandle,
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
          col_span: 1,
          row_span: 1,
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

  const writingBlock: Extract<BlockData, { type: "writing" }> | null =
    writingLinks.length > 0
      ? {
          id: "writing-onboarding",
          type: "writing",
          order: 6,
          col_span: 1,
          row_span: 1,
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
    row_span: 1,
    visible: true,
    title: link.title,
    description: buildProjectDescription(link),
    imageUrl: link.imageUrl || "",
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

  const secondaryProject = primaryProjects[1] || null;
  const primaryProject = primaryProjects[0] || null;
  const supportPool: Array<BlockData | null> = [
    secondaryProject,
    writingBlock,
    mediaBlock,
    secondaryCustoms[0] || null,
    secondaryCustoms[1] || null,
    stackBlock,
  ];
  const supportBlocks = supportPool.filter((block): block is BlockData => !!block);
  const maxSupportBlocks = githubBlock ? 2 : 3;

  const templateBlocks =
    template === "minimal"
      ? [heroBlock, githubBlock, socialBlock, primaryProject, ...supportBlocks.slice(0, maxSupportBlocks)]
      : [heroBlock, primaryProject, socialBlock, githubBlock, ...supportBlocks.slice(0, maxSupportBlocks)];

  const uniqueBlocks = templateBlocks
    .filter(Boolean)
    .filter((block): block is BlockData => !!block)
    .filter((block) => {
      if (block.type === "custom" || block.type === "project" || block.type === "media") {
        return !!block.link;
      }
      if (block.type === "github") {
        return !!block.username && hasMeaningfulGithubStats(block.stats);
      }
      if (block.type === "social") {
        return block.links.length > 0;
      }
      return true;
    })
    .filter(
      (block, index, all) =>
        all.findIndex((candidate) => {
          if ("link" in candidate && "link" in block) {
            return candidate.type === block.type && candidate.link === block.link;
          }
          return candidate.id === block.id;
        }) === index
    );

  const normalizedBlocks = uniqueBlocks.map((block) => normalizeBlockForTemplate(block, template));

  return normalizedBlocks.map((block, order) => ({ ...block, order }));
}

function normalizeBlockForTemplate(
  block: BlockData,
  template: "dev_heavy" | "minimal"
): BlockData {
  if (block.type === "hero") {
    return {
      ...block,
      col_span: 2,
      row_span: 1,
    };
  }

  if (block.type === "project") {
    return {
      ...block,
      col_span: template === "dev_heavy" ? 2 : 1,
      row_span: 1,
    };
  }

  if (block.type === "github" || block.type === "social" || block.type === "writing" || block.type === "media" || block.type === "custom" || block.type === "stack") {
    return {
      ...block,
      col_span: 1,
      row_span: 1,
    };
  }

  return block;
}

function sanitizeImportedLinks(links: ImportedLinktreeLink[]) {
  return dedupeByUrl(
    links.filter((link) => {
      const hostname = link.hostname.replace(/^www\./, "").toLowerCase();
      return hostname !== "linktr.ee" && hostname !== "linktree.com" && hostname !== "bio.site";
    })
  );
}

function dedupeByUrl<T extends { url: string }>(items: T[]) {
  return items.filter(
    (block, index, all) =>
      all.findIndex((candidate) => {
        return (
          candidate.url.replace(/\/$/, "").toLowerCase() ===
          block.url.replace(/\/$/, "").toLowerCase()
        );
      }) === index
  );
}

function buildProjectDescription(link: ImportedLinktreeLink) {
  if (link.category === "project") {
    return `Proyecto destacado importado desde ${link.hostname}.`;
  }

  if (link.category === "media") {
    return `Contenido destacado publicado en ${link.hostname}.`;
  }

  return `Acceso directo a ${link.hostname} desde tu board.`;
}

function resolveBoardTemplate(layout: OnboardingCompletionData["layout"]) {
  return layout === "minimal" || layout === "creative" ? "minimal" : "dev_heavy";
}

function hasUsefulGitHubData(githubData: GitHubData | null | undefined) {
  if (!githubData?.username) return false;

  return (
    githubData.publicRepos > 0 ||
    githubData.followers > 0 ||
    githubData.topLanguages.length > 0 ||
    githubData.topRepos.length > 0
  );
}

function hasMeaningfulGithubStats(
  stats: Extract<BlockData, { type: "github" }>["stats"] | null | undefined
) {
  if (!stats) return false;

  return (
    stats.repos > 0 ||
    stats.followers > 0 ||
    stats.stars > 0 ||
    (stats.topLanguages?.length || 0) > 0
  );
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
