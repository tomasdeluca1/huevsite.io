import type { Metadata } from "next";
import FeedPageClient from "./FeedPageClient";
import { fetchLaunchOg, truncate } from "@/lib/og/shared";
import { parseLaunchShareParams } from "@/lib/launch-share";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";

// Shared-launch deep links (/feed?launch=<id>) get their own OG: the launched
// product's info with an upvote CTA, rendered by /api/og/launch/[id]. Without
// the param we return {} so the file-based opengraph-image.tsx (the generic
// Builders Hunt card) keeps applying — remember: config `openGraph.images`
// OVERRIDES file-based, so only set it when we really have a launch.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { launch?: string; week?: string };
}): Promise<Metadata> {
  // Lenient parse: shared links arrive with the `&` percent-encoded often
  // enough (launch=<uuid>%26week=...) that we extract the UUID instead of
  // trusting the param split — otherwise crawlers get the generic OG.
  const { launchId } = parseLaunchShareParams(searchParams.launch, searchParams.week);
  if (!launchId) return {};
  const og = await fetchLaunchOg(launchId);
  if (!og) return {};

  const title = `${og.title} — Builders Hunt`;
  const description = `▲ Votalo en Builders Hunt · ${
    og.description ? truncate(og.description, 120) : `lanzado por @${og.username} esta semana en huevsite.`
  }`;
  // ?v=<upvotes> busts social caches as the count moves, so shares stay fresh.
  const image = `${SITE}/api/og/launch/${launchId}?v=${og.upvotes}`;
  // Canonical clean deep link: tells crawlers that mangled variants resolve
  // here (og.week is the launch's true week, not whatever the URL carried).
  const canonicalUrl = `${SITE}/feed?launch=${launchId}&week=${og.week}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function FeedPage() {
  return <FeedPageClient />;
}
