import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side admin guard. Call at the top of an admin server component
// or layout. If the visitor isn't the admin, this throws a redirect and
// the caller never continues.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username !== "tomi_delu") {
    redirect("/");
  }

  return { user, profile };
}
