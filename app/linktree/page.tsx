import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site-url";
import { getLocale } from "@/lib/locale";
import { canonical, keywordsFor } from "@/lib/seo";
import LinktreeLanding from "@/components/landing/LinktreeLanding";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("linktree");
  const locale = await getLocale();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // "linktree alternative" is the single highest-intent commercial query
    // this site can win — this page is the one that should rank for it.
    keywords: keywordsFor("linktree", locale),
    alternates: { canonical: canonical("/linktree") },
    openGraph: {
      siteName: "huevsite.io",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}/linktree`,
      type: "website",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default function LinktreeLandingPage() {
  return <LinktreeLanding />;
}
