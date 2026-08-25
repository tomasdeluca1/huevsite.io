import type { Locale } from "@/lib/locale";
import { SITE_URL } from "@/lib/site-url";

/**
 * Google Search Console property verification. Next renders this as
 * `<meta name="google-site-verification" content="..." />` in <head> from the
 * root layout, so it is present on every route (GSC only checks `/`, but a
 * site-wide tag survives any future landing-page rewrite).
 */
export const GOOGLE_SITE_VERIFICATION = "cT5cJIznuzyHeOsAz_PjVMqZHDJciG4311O3qogJNP8";

/**
 * Absolute canonical URL for a path. Every indexable page must declare one:
 * profiles, /explore and /leaderboard are reachable with `?from=`, `?tag=`,
 * `?page=` and utm_* params, and without an explicit canonical Google treats
 * each variant as a separate (duplicate) URL.
 *
 * NOTE: the canonical is deliberately NOT set on the root layout — Next merges
 * metadata per-segment, so a layout-level `alternates.canonical` is inherited
 * by every page that doesn't declare its own, pointing the whole site at "/".
 */
export function canonical(path = "/"): string {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}

/**
 * Keyword sets per route. The meta keywords tag is ignored by Google but still
 * read by Bing/Yandex and by the AI crawlers we explicitly allow in robots.txt
 * (GPTBot, PerplexityBot, ClaudeBot…), which is where this actually pays off.
 * The real ranking work lives in the titles/descriptions/H1s these mirror —
 * keep both in sync when the copy changes.
 */
type KeywordSets = Record<string, readonly string[]>;

const BRAND_ES = [
  "huevsite",
  "huevsite.io",
] as const;

const CORE_ES = [
  "portfolio para developers",
  "portfolio de programador",
  "link in bio para builders",
  "alternativa a linktree",
  "portfolio online gratis",
  "perfil profesional para desarrolladores",
  "red social de builders",
  "portfolio con github",
  "mostrar proyectos personales",
  "builders latam",
  "indie hackers en español",
  "portfolio para founders",
] as const;

const CORE_EN = [
  "developer portfolio",
  "link in bio for builders",
  "linktree alternative",
  "free portfolio builder",
  "portfolio website for developers",
  "builder social network",
  "github portfolio page",
  "showcase side projects",
  "indie hacker portfolio",
  "founder profile page",
  "bio link page",
  "personal website builder",
] as const;

const KEYWORDS_ES: KeywordSets = {
  home: [
    ...CORE_ES,
    "armar portfolio en minutos",
    "cv para developers",
    "portfolio de diseñador",
    "métricas de proyectos",
    "comunidad de builders",
  ],
  explore: [
    "directorio de builders",
    "developers argentinos",
    "portfolios de developers",
    "perfiles de programadores",
    "encontrar builders",
    "comunidad tech latam",
    ...CORE_ES.slice(0, 4),
  ],
  leaderboard: [
    "ranking de builders",
    "builder score",
    "developers más activos",
    "ranking de developers latam",
    "leaderboard de programadores",
    ...CORE_ES.slice(0, 3),
  ],
  recruiter: [
    "contratar developers latam",
    "buscar talento tech",
    "developers open to work",
    "reclutar programadores",
    "talento builder",
    "hiring developers argentina",
    "portfolios de candidatos tech",
  ],
  feed: [
    "lanzamientos de productos",
    "product hunt en español",
    "builders hunt",
    "lanzar tu producto",
    "side projects nuevos",
    "startups latam",
  ],
  pricing: [
    "precio portfolio online",
    "portfolio gratis para developers",
    "dominio propio para portfolio",
    "huevsite pro",
    ...CORE_ES.slice(0, 4),
  ],
  linktree: [
    "alternativa a linktree",
    "migrar de linktree",
    "importar linktree",
    "linktree para developers",
    "link in bio gratis",
    "bio link builder",
  ],
  blog: [
    "blog para builders",
    "recursos para developers",
    "cómo armar un portfolio",
    "consejos para indie hackers",
    "historias de builders",
  ],
  profile: [
    "portfolio de builder",
    "perfil de developer",
    "proyectos y stack",
    ...CORE_ES.slice(0, 4),
  ],
  bdls: [
    "builder de la semana",
    "builders destacados",
    "salón de la fama builders",
    "comunidad de builders",
  ],
  referrals: [
    "programa de referidos",
    "invitar builders",
    "huevsite pro gratis",
  ],
};

const KEYWORDS_EN: KeywordSets = {
  home: [
    ...CORE_EN,
    "build a portfolio in minutes",
    "developer resume page",
    "designer portfolio",
    "project metrics",
    "builder community",
  ],
  explore: [
    "developer directory",
    "browse developer portfolios",
    "find builders",
    "tech community profiles",
    ...CORE_EN.slice(0, 4),
  ],
  leaderboard: [
    "developer leaderboard",
    "builder score",
    "most active builders",
    "top indie hackers",
    ...CORE_EN.slice(0, 3),
  ],
  recruiter: [
    "hire developers latam",
    "tech talent search",
    "developers open to work",
    "recruit engineers",
    "builder talent board",
    "candidate portfolios",
  ],
  feed: [
    "product launches",
    "builders hunt",
    "launch your product",
    "new side projects",
    "latam startups",
  ],
  pricing: [
    "portfolio pricing",
    "free developer portfolio",
    "custom domain portfolio",
    "huevsite pro",
    ...CORE_EN.slice(0, 4),
  ],
  linktree: [
    "linktree alternative",
    "migrate from linktree",
    "import linktree",
    "linktree for developers",
    "free link in bio",
    "bio link builder",
  ],
  blog: [
    "builder blog",
    "developer resources",
    "how to build a portfolio",
    "indie hacker tips",
    "builder stories",
  ],
  profile: [
    "builder portfolio",
    "developer profile",
    "projects and stack",
    ...CORE_EN.slice(0, 4),
  ],
  bdls: [
    "builder of the week",
    "featured builders",
    "builder hall of fame",
    "builder community",
  ],
  referrals: [
    "referral program",
    "invite builders",
    "free huevsite pro",
  ],
};

export type KeywordPage = keyof typeof KEYWORDS_ES;

/**
 * Keywords for a route, always prefixed with the brand terms so branded
 * searches ("huevsite") stay attached to every page.
 */
export function keywordsFor(page: KeywordPage, locale: Locale = "es"): string[] {
  const sets = locale === "en" ? KEYWORDS_EN : KEYWORDS_ES;
  return [...BRAND_ES, ...(sets[page] ?? [])];
}

/** Site-wide fallback set, used by the root layout. */
export function siteKeywords(locale: Locale = "es"): string[] {
  return keywordsFor("home", locale);
}

/**
 * Indexing directives we want on every public page. `max-image-preview: large`
 * is what lets Google show the full-width OG card in results and Discover;
 * `max-snippet: -1` removes the snippet length cap (better for AI Overviews).
 */
export const PUBLIC_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} as const;

/** Private/authenticated surfaces: keep them out of the index entirely. */
export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
