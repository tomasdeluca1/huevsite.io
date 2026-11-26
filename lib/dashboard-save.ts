import type { ProfileData } from "./profile-types";

export async function saveDashboard(
  profile: Pick<ProfileData, "accentColor" | "username" | "displayName" | "tagline" | "customDomain"> & { blocks: { id: string }[] },
  flushMobileOrder: () => Promise<boolean>,
): Promise<number | undefined> {
  const errors: unknown[] = [];
  let builderScore: number | undefined;
  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accent_color: profile.accentColor,
        username: profile.username,
        name: profile.displayName,
        tagline: profile.tagline,
        custom_domain: profile.customDomain,
      }),
    });
    if (!response.ok) throw new Error(`Profile update failed (${response.status})`);
    const data = await response.json();
    builderScore = data.profile?.builder_score;
  } catch (error) {
    errors.push(error);
  }

  const blockOrders = profile.blocks
    .map((block, index) => ({ id: block.id, order: index }))
    .filter(b => !b.id.startsWith('temp-'));

  if (blockOrders.length > 0) {
    try {
      const reorder = await fetch('/api/blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockOrders),
      });
      if (!reorder.ok) throw new Error(`Desktop order update failed (${reorder.status})`);
    } catch (error) {
      errors.push(error);
    }
  }

  try {
    if (!(await flushMobileOrder())) throw new Error("Mobile order update failed");
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) throw errors[0];
  return builderScore;
}
