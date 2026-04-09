import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  return profile?.username === "tomi_delu";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("builder_interviews")
    .select("id, builder_username, builder_name, builder_email, status, invited_at, submitted_at, typefully_x_draft_url, typefully_linkedin_draft_url, generation_error")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
