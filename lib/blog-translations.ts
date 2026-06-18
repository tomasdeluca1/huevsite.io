// English translations of the hardcoded blog articles, keyed by slug.
// Resolved by localizePost() in blog-data.ts when the active locale is 'en'.
// DB-backed (Builder de la Semana) posts have no entry here and fall back to
// their original Spanish. This file is generated/filled by the i18n pipeline.
export interface BlogPostTranslation {
  title: string;
  excerpt: string;
  content: string;
}

export const BLOG_TRANSLATIONS: Record<string, BlogPostTranslation> = {};
