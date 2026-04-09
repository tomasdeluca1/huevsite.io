import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postWeeklyStats } from "@/lib/twitter";
import { ADMIN_USERNAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile?.username !== ADMIN_USERNAME) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
