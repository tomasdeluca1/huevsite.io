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
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    serviceKeyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 40),
  };

  // Raw REST call — same query that the helper runs but via plain fetch
  // so we can see exactly what PostgREST returns without the supabase-js
  // client sitting in the middle.
  let rawRest: any = null;
  let rawRestError: string | null = null;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog_posts?select=slug,is_published,date&is_published=eq.true&order=date.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });
    rawRest = {
      status: res.status,
      body: await res.text(),
    };
  } catch (e: any) {
    rawRestError = `${e?.name}: ${e?.message}`;
  }

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
    rawRest: { ok: !rawRestError, result: rawRest, error: rawRestError },
    dbPosts: { ok: !dbPostsError, result: dbPostsResult, error: dbPostsError },
    allPosts: { ok: !allPostsError, result: allPostsResult, error: allPostsError },
    paginated: { ok: !paginatedError, result: paginatedResult, error: paginatedError },
  });
}
