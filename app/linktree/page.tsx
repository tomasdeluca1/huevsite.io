import { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";
import LinktreeLanding from "@/components/landing/LinktreeLanding";

export const metadata: Metadata = {
  title: "Migrá desde Linktree — huevsite.io",
  description:
    "Tu Linktree se quedó chico. Pegás tu URL, importamos todo, y en 3 minutos tenés un perfil que muestra quién sos de verdad.",
  openGraph: {
    title: "Migrá desde Linktree — huevsite.io",
    description:
      "Tu Linktree se quedó chico. Pegás tu URL, importamos todo, y en 3 minutos tenés un perfil que muestra quién sos de verdad.",
    url: `${SITE_URL}/linktree`,
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Migrá desde Linktree — huevsite.io",
    description:
      "Tu Linktree se quedó chico. Pegás tu URL, importamos todo, y en 3 minutos tenés un perfil que muestra quién sos de verdad.",
  },
};

export default function LinktreeLandingPage() {
  return <LinktreeLanding />;
}
