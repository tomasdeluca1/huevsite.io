import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { postWeeklyStats } from "@/lib/twitter";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    const result = await postWeeklyStats(supabase, preview);

    return NextResponse.json({ 
      success: true,
      preview: preview ? result : null
    });
  } catch (error: any) {
    console.error("Weekly stats Twitter post error:", error);
    return NextResponse.json({ error: error.message || "Failed to post weekly stats" }, { status: 500 });
  }
}
