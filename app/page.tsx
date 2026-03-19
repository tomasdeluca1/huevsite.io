import { Metadata } from "next";
import { getShowcaseData } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "huevsite.io | Mostrá lo que buildeás",
  description: "Red social y portfolio para builders de Argentina y LATAM.",
  openGraph: {
    title: "huevsite.io | Mostrá lo que buildeás",
    description: "Red social y portfolio para builders de Argentina y LATAM.",
    images: [
      {
        url: "/opengraph-image.png",
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
    images: ["/opengraph-image.png"],
  },
};

export default async function LandingPage() {
  const data = await getShowcaseData();

  return <LandingPageClient showcaseData={data} />;
}
