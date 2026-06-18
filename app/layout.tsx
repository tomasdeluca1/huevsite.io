import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getLocale } from "@/lib/locale";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-next",
  display: "swap",
  adjustFontFallback: false
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-next",
  display: "swap",
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: "huevsite.io | Construí tu reputación como builder",
  description:
    "Proyectos, métricas reales y endorsements de otros builders. Que te vean shippeando, no diciendo. Acá vive la red de LATAM.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    types: {
      'application/rss+xml': '/blog/feed.xml',
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.jpeg", sizes: "32x32", type: "image/jpeg" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body className="antialiased selection:bg-[var(--accent)] selection:text-black font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="d3a90850-920a-4f6f-82ba-3f993ef66818"
      />
    </html>
  );
}
