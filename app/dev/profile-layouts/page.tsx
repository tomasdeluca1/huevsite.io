import type { Metadata } from "next";
import { LayoutPreview } from "./preview";

export const metadata: Metadata = {
  title: "Preview de layouts",
  robots: { index: false, follow: false },
};

export default function ProfileLayoutsPreview({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  return <LayoutPreview view={searchParams?.view || "links"} />;
}
