import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ADMIN_EMAILS } from "@/lib/constants";

/**
 * Check if the current session user is an admin by email.
 * Uses the session client only for auth (getUser), then checks the email
 * against the ADMIN_EMAILS whitelist. No DB query needed — the email
 * comes straight from the JWT.
 *
 * Returns `{ user }` if admin, `null` otherwise.
 */
export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  return { user };
}

/**
 * Returns a service-role Supabase client if the caller is an admin.
 * Use this in API routes: authenticate first, then get an unrestricted
 * client for all DB operations — no RLS will block admin actions.
 *
 * Also accepts an optional NextRequest for cron/secret auth (pick-winner, etc.).
 */
export async function getAdminClient(request?: Request) {
  // 1. Check cron/admin secrets (for automated jobs)
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      return createServiceRoleClient();
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret && process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET) {
      return createServiceRoleClient();
    }
  }

  // 2. Check user session
  const admin = await getAdminUser();
  if (!admin) return null;

  return createServiceRoleClient();
}

/**
 * Server-side admin guard for layouts/pages. Redirects non-admins.
 */
export async function requireAdmin() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/");
  }

  return admin;
}
