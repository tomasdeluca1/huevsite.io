import { Metadata } from "next";
import { getShowcaseData } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const dynamic = "force-dynamic";
const OG_IMAGE_VERSION = "20260318a";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://huevsite.io";
const HOME_OG_IMAGE_URL = `${SITE_URL}/api/og?username=huevsite&title=${encodeURIComponent("huevsite.io")}&tagline=${encodeURIComponent("Mostra lo que buildeas")}&color=${encodeURIComponent("#C8FF00")}&v=${OG_IMAGE_VERSION}`;

export const metadata: Metadata = {
  title: "huevsite.io | Mostrá lo que buildeás",
  description: "Red social y portfolio para builders de Argentina y LATAM.",
  openGraph: {
    title: "huevsite.io | Mostrá lo que buildeás",
    description: "Red social y portfolio para builders de Argentina y LATAM.",
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: HOME_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "huevsite.io",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "huevsite.io | Mostrá lo que buildeás",
    description: "Red social y portfolio para builders de Argentina y LATAM.",
    images: [HOME_OG_IMAGE_URL],
  },
};

export default async function LandingPage() {
  const data = await getShowcaseData();

  return <LandingPageClient showcaseData={data} />;
}
