import type { BlockData, ProjectBlockData } from "@/lib/profile-types";

export const LAUNCHY_BASE_URL =
  process.env.NEXT_PUBLIC_LAUNCHY_URL || "https://launchy.huevsite.com";

/**
 * Deep-link to Launchy's new-product page, prefilled from a huevsite project.
 * Returns null if the project can't be launched yet (no valid URL, or the
 * block isn't persisted) — callers should disable the button and explain why.
 */
export function buildLaunchyNewProductUrl(
  block: BlockData & ProjectBlockData
): string | null {
  const link = (block.link || "").trim();
  if (!/^https?:\/\//i.test(link)) return null;
  if (String(block.id).startsWith("temp-")) return null; // not persisted yet → no stable ref

  const params = new URLSearchParams({
    ref: block.id,
    name: block.title || "",
    tagline: (block.description || "").slice(0, 80),
    description: (block.description || "").slice(0, 500),
    url: link,
  });
  if (block.imageUrl) params.set("logoUrl", block.imageUrl);
  if (block.stack?.length) params.set("tags", block.stack.join(","));

  return `${LAUNCHY_BASE_URL}/dashboard/products/new?${params.toString()}`;
}
