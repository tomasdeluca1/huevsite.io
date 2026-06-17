import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAdjustedAccentColor } from "@/lib/profile-types";
import { SITE_URL } from "@/lib/site-url";

// Public, read-only profile API for embedding huevsite cards on other platforms
// (e.g. nordelta.tech). CORS is open because the payload is the same public data
// already rendered on /[username]. See /blog/api-publica-de-perfiles for docs.
export const dynamic = "force-dynamic";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const username = (params.username || "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400, headers: CORS });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username, name, tagline, image, accent_color, builder_score")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  }

  const body = {
    username: data.username,
    name: data.name || data.username,
    headline: data.tagline || null,
    avatar: data.image || null,
    accentColor: getAdjustedAccentColor(data.accent_color as any),
    builderScore: typeof data.builder_score === "number" ? data.builder_score : null,
    url: `${SITE_URL}/${data.username}`,
  };

  return NextResponse.json(body, {
    headers: { ...CORS, "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}
