import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { sendTweet } from "@/lib/twitter";
import { FREE_TRIAL_TWEETS, FreeTrialTweetVariant } from "@/lib/free-trial-campaign";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "true";
    const variant = (searchParams.get("variant") || "launch") as FreeTrialTweetVariant;
    const tweet = FREE_TRIAL_TWEETS[variant];

    if (!tweet) {
      return NextResponse.json({ error: "Variant inválida" }, { status: 400 });
    }

    if (preview) {
      return NextResponse.json({ success: true, preview: tweet });
    }

    await sendTweet(tweet);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Free trial campaign tweet error:", error);
    return NextResponse.json({ error: error.message || "Failed to post free trial tweet" }, { status: 500 });
  }
}
