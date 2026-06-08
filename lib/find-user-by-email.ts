import { listAllAuthUsers } from "@/lib/list-auth-users";

// Resolve a buyer's email to a huevsite user id for webhook mapping.
//
// Tries profiles.email first (indexed, cheap), then falls back to scanning auth
// users — the auth email is always populated (~100%) whereas profiles.email is
// sparsely set (~31%), so the auth scan is what makes the fallback reliable.
// Returns null when no user matches.
export async function findUserIdByEmail(
  supabase: any,
  email: string | null | undefined
): Promise<string | null> {
  const target = (email || "").trim().toLowerCase();
  if (!target) return null;

  // 1. profiles.email (fast path)
  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", target)
    .maybeSingle();
  if (prof?.id) return prof.id;

  // 2. auth email (authoritative, always populated)
  const users = await listAllAuthUsers(supabase);
  const match = users.find((u: any) => (u.email || "").toLowerCase() === target);
  return match?.id || null;
}
