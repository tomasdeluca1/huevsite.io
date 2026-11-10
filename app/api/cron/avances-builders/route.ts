import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAvancesStore } from "@/lib/avances-builders-store";
import { bufferChannelConfigured, createBufferPost, publicImageReachable } from "@/lib/buffer-post";
import { getFounderSeats } from "@/lib/founder-seats";
import { sendTweet } from "@/lib/twitter";
import { resolveXHandles } from "@/lib/twitter-utils";
import {
  disabledAvancesResult,
  isAvancesAuthorized,
  isAvancesDryRun,
  isAvancesEnabled,
  redactForLog,
  runAvancesBuilders,
  type AvancesPublishers,
  type ChannelAttempt,
} from "@/lib/avances-builders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lun/mié/vie 14:00 UTC = 11:00 ART. Una pieza por corrida.
// X sale por sendTweet. LinkedIn e Instagram salen por Buffer (shareNow).
// AVANCES_CRON_ENABLED tiene que ser "true" para publicar. preview=1, dry_run=1
// o AVANCES_CRON_DRY_RUN=true arman la pieza y no publican.

function publishers(): AvancesPublishers {
  return {
    xConfigured: !!process.env.TWITTER_API_KEY,
    linkedinConfigured: bufferChannelConfigured(process.env.BUFFER_LINKEDIN_CHANNEL_ID),
    instagramConfigured: bufferChannelConfigured(process.env.BUFFER_IG_CHANNEL_ID),
    async resolveXMention(username) {
      try {
        const mentions = await resolveXHandles([username]);
        return mentions[username] ?? null;
      } catch (error) {
        console.error("[avances-builders] resolveXHandles", redactForLog(error));
        return null;
      }
    },
    async sendTweet(text): Promise<ChannelAttempt> {
      try {
        const tweet = await sendTweet(text);
        const id = tweet?.data?.id;
        if (!id) return { status: "skipped_no_config" };
        return { status: "posted", id: String(id) };
      } catch (error) {
        return { status: "error", message: redactForLog(error) };
      }
    },
    postLinkedIn(text) {
      return createBufferPost({
        channelId: process.env.BUFFER_LINKEDIN_CHANNEL_ID,
        text,
      });
    },
    postInstagram({ text, imageUrl, alt }) {
      return createBufferPost({
        channelId: process.env.BUFFER_IG_CHANNEL_ID,
        text,
        image: { url: imageUrl, alt },
        instagram: true,
      });
    },
    imageReachable: publicImageReachable,
    async founderRemaining() {
      const seats = await getFounderSeats();
      return seats.remaining;
    },
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!isAvancesAuthorized(authHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = isAvancesDryRun({
    preview: searchParams.get("preview"),
    dryRun: searchParams.get("dry_run"),
    env: process.env.AVANCES_CRON_DRY_RUN,
  });
  const force = searchParams.get("force") === "1";
  const enabled = isAvancesEnabled(process.env.AVANCES_CRON_ENABLED);
  if (!enabled && !dryRun) {
    return NextResponse.json(disabledAvancesResult());
  }

  try {
    const result = await runAvancesBuilders({
      dryRun,
      force,
      enabled,
      store: createSupabaseAvancesStore(),
      publishers: publishers(),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[avances-builders]", redactForLog(error));
    return NextResponse.json({ ok: false, error: "run_failed" }, { status: 500 });
  }
}
