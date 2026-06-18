import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site-url";
import LinktreeLanding from "@/components/landing/LinktreeLanding";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("linktree");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
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
