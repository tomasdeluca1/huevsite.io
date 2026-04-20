import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const { data } = await supabase
    .from("profiles")
    .select("username, name, image")
    .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(8);

  return NextResponse.json(data ?? []);
}
