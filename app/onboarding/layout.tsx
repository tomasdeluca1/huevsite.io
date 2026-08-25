import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";

// Authenticated surface: keep it out of the index. robots.txt already asks
// crawlers not to fetch it, but a disallowed URL can still be indexed
// URL-only from an inbound link ("No information is available for this
// page") — the meta tag is what actually removes it.
export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
