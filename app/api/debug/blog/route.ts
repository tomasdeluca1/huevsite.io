import { NextRequest, NextResponse } from "next/server";
import {
  getAllBlogPosts,
  getDBBlogPosts,
  getPaginatedBlogPosts,
} from "@/lib/blog-data";

export const dynamic = "force-dynamic";

// Temporary debug endpoint — helps diagnose why BDLS posts weren't showing up
// on /blog even though the DB has them. Remove once verified.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
  };

  let dbPostsResult: any = null;
  let dbPostsError: string | null = null;
  try {
    const rows = await getDBBlogPosts();
    dbPostsResult = {
      count: rows.length,
      slugs: rows.map((r) => r.slug),
      firstAuthor: rows[0]?.author,
    };
  } catch (e: any) {
    dbPostsError = `${e?.name}: ${e?.message}\n${e?.stack || ""}`;
  }

  let allPostsResult: any = null;
  let allPostsError: string | null = null;
  try {
    const rows = await getAllBlogPosts();
    allPostsResult = {
      count: rows.length,
      first3Slugs: rows.slice(0, 3).map((r) => ({ slug: r.slug, date: r.date })),
    };
  } catch (e: any) {
    allPostsError = `${e?.name}: ${e?.message}`;
  }

  let paginatedResult: any = null;
  let paginatedError: string | null = null;
  try {
    const out = await getPaginatedBlogPosts({ page: 1 });
    paginatedResult = {
      total: out.total,
      page: out.page,
      totalPages: out.totalPages,
      slugs: out.posts.map((p) => p.slug),
    };
  } catch (e: any) {
    paginatedError = `${e?.name}: ${e?.message}`;
  }

  return NextResponse.json({
    env,
    dbPosts: { ok: !dbPostsError, result: dbPostsResult, error: dbPostsError },
    allPosts: { ok: !allPostsError, result: allPostsResult, error: allPostsError },
    paginated: { ok: !paginatedError, result: paginatedResult, error: paginatedError },
  });
}
