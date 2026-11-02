// Who receives Mail 1 · Lanzamiento.
// Whole auth base, minus unsubscribed, minus lifetime (Founder) buyers,
// minus current Pro (subscription_tier = 'pro' and not lifetime), minus Tomás.
// newsletter_subscribed is intentionally not a filter.

export interface FounderMail1Profile {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  community_digest_unsubscribed: boolean | null;
  is_lifetime: boolean | null;
  subscription_tier: string | null;
}

export interface FounderMail1AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export type FounderMail1SkipReason = "no_email" | "owner" | "unsubscribed" | "lifetime" | "pro";

export interface FounderMail1OwnerMatch {
  emails: Set<string>;
  usernames: Set<string>;
  ids: Set<string>;
}

// Public owner profiles. The leaderboard username is tomidelu; the landing
// links /_tomidelu. Plus whatever ADMIN_USERNAME is set to. Matched profiles
// contribute their address so a second auth user with the same email is out too.
const PUBLIC_OWNER_USERNAMES = ["tomidelu", "_tomidelu"];

function norm(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function buildOwnerMatch(input: {
  adminEmails: string;
  adminUsername: string;
  profiles: FounderMail1Profile[];
}): FounderMail1OwnerMatch {
  const emails = new Set(
    input.adminEmails
      .split(",")
      .map((email) => norm(email))
      .filter(Boolean)
  );
  const usernames = new Set(
    [...PUBLIC_OWNER_USERNAMES, input.adminUsername].map((username) => norm(username)).filter(Boolean)
  );
  const ids = new Set<string>();
  for (const profile of input.profiles) {
    if (!usernames.has(norm(profile.username))) continue;
    ids.add(profile.id);
    const email = norm(profile.email);
    if (email) emails.add(email);
  }
  return { emails, usernames, ids };
}

/**
 * First matching reason wins so the preview counts add up to the auth base.
 * Owner is checked before Pro: Tomás is Pro today, and he still has to be
 * excluded by address even if that tier changes.
 */
export function founderMail1SkipReason(
  user: FounderMail1AuthUser,
  profile: FounderMail1Profile | undefined,
  owner: FounderMail1OwnerMatch
): FounderMail1SkipReason | null {
  const email = norm(user.email);
  if (!email) return "no_email";
  const profileEmail = norm(profile?.email);
  const username = norm(profile?.username);
  if (
    owner.emails.has(email) ||
    (profileEmail && owner.emails.has(profileEmail)) ||
    owner.ids.has(user.id) ||
    (username && owner.usernames.has(username))
  ) {
    return "owner";
  }
  if (profile?.community_digest_unsubscribed) return "unsubscribed";
  if (profile?.is_lifetime) return "lifetime";
  if (norm(profile?.subscription_tier) === "pro" && !profile?.is_lifetime) return "pro";
  return null;
}

function metaName(user: FounderMail1AuthUser): string {
  const meta = user.user_metadata;
  if (!meta) return "";
  for (const key of ["full_name", "name", "display_name"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** {nombre} in the Mail 1 greeting. Profile display name, then auth metadata. */
export function founderMail1Name(
  user: FounderMail1AuthUser,
  profile: FounderMail1Profile | undefined
): string {
  const fromProfile = (profile?.name || "").trim();
  return fromProfile || metaName(user);
}
