import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function isMissingTable(err: any): boolean {
  return !!err && (err.code === "42P01" || /relation .* does not exist/i.test(err.message || ""));
}

async function recount(db: ReturnType<typeof createServiceRoleClient>, launchId: string): Promise<number> {
  const { count } = await db
    .from("project_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("project_launch_id", launchId);
  const n = count || 0;
  await db.from("project_launches").update({ upvote_count: n }).eq("id", launchId);
  return n;
}

// POST /api/launches/[id]/upvote — add the current user's upvote (idempotent).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const launchId = params.id;
  const db = createServiceRoleClient();

  const { error } = await db
    .from("project_upvotes")
    .insert({ project_launch_id: launchId, voter_id: user.id });

  if (error && error.code !== "23505") {
    // 23505 = unique violation → already upvoted, treat as success (idempotent).
    if (isMissingTable(error)) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (error.code === "23503") return NextResponse.json({ error: "not_found" }, { status: 404 });
    console.error("[upvote] insert error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const upvoteCount = await recount(db, launchId);
  return NextResponse.json({ upvoteCount, voted: true });
}

// DELETE /api/launches/[id]/upvote — remove the current user's upvote.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const launchId = params.id;
  const db = createServiceRoleClient();

  const { error } = await db
    .from("project_upvotes")
    .delete()
    .eq("project_launch_id", launchId)
    .eq("voter_id", user.id);

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    console.error("[upvote] delete error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const upvoteCount = await recount(db, launchId);
  return NextResponse.json({ upvoteCount, voted: false });
}
