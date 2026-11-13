// Paths to bust after a project (or any block) is deleted, so the public
// profile and the directories that list it don't keep the old HTML.
// Usernames are [a-z0-9_]{3,20} at signup; older rows also allow A-Z and '-'.

const HANDLE = /^[a-zA-Z0-9_-]{1,50}$/;
const SLUG = /^[a-z0-9-]{1,80}$/;

export function publicPathsAfterProjectDelete(
  username: string | null | undefined,
  subSiteSlug?: string | null,
): string[] {
  const handle = (username || "").trim().replace(/^@/, "");
  if (!HANDLE.test(handle)) return [];
  const paths = [`/${handle}`];
  const slug = (subSiteSlug || "").trim();
  if (SLUG.test(slug)) paths.push(`/${handle}/${slug}`);
  paths.push("/explore");
  return paths;
}

export async function revalidatePublicProfile(
  username: string | null | undefined,
  subSiteSlug?: string | null,
): Promise<void> {
  const paths = publicPathsAfterProjectDelete(username, subSiteSlug);
  if (paths.length === 0) return;
  let revalidatePath: (path: string) => void;
  try {
    ({ revalidatePath } = await import("next/cache"));
  } catch {
    return;
  }
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Scripts and calls outside a Next.js request have no cache store.
    }
  }
}
