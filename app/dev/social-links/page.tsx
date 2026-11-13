import type { Metadata } from "next";
import { SocialLinksPreview } from "./preview";

export const metadata: Metadata = {
  title: "Links sociales",
  robots: { index: false, follow: false },
};

export default function SocialLinksDevPage() {
  return <SocialLinksPreview />;
}
