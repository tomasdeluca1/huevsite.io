import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function getFaviconUrl(websiteUrl: string): string | null {
  try {
    const url = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all social blocks
    const { data: blocks, error } = await supabase
      .from("blocks")
      .select("id, data")
      .eq("type", "social");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let updated = 0;

    for (const block of blocks || []) {
      const links = block.data?.links;
      if (!Array.isArray(links)) continue;

      let changed = false;
      const updatedLinks = links.map((link: any) => {
        if (link.platform === "website" && link.url && !link.favicon) {
          const favicon = getFaviconUrl(link.url);
          if (favicon) {
            changed = true;
            return { ...link, favicon };
          }
        }
        return link;
      });

      if (changed) {
        await supabase
          .from("blocks")
          .update({ data: { ...block.data, links: updatedLinks } })
          .eq("id", block.id);
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      totalBlocks: blocks?.length || 0,
      updated,
    });
  } catch (error) {
    console.error("Backfill favicons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
