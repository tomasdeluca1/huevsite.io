import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | huevsite.io",
  description: "Red social y portfolio para builders de Argentina y LATAM.",
  openGraph: {
    title: "huevsite.io | Mostrá lo que buildeás",
    description: "Red social y portfolio para builders de Argentina y LATAM.",
    type: "website",
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

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
