import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for API routes that own the authorization logic.
// After the 2026-04-11 security hardening, the `authenticated` role only has
// SELECT access to a whitelist of public profile columns. Backend endpoints
// that need to read/write sensitive columns on behalf of the logged-in user
// must authenticate the request via getUser() on the SSR client, then use
// this service-role client for the actual DB work — with explicit
// `.eq('user_id', ...)` / `.eq('id', ...)` checks to preserve ownership.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
