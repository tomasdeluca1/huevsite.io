import { getShowcaseData } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const data = await getShowcaseData();
  
  return <LandingPageClient showcaseData={data} />;
}
