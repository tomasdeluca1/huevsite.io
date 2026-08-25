import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { getLocale } from "@/lib/locale";
import { SITE_URL } from "@/lib/site-url";
import { GOOGLE_SITE_VERIFICATION, PUBLIC_ROBOTS, siteKeywords } from "@/lib/seo";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = await getLocale();
  return {
    title: t("rootTitle"),
    description: t("rootDescription"),
    metadataBase: new URL(SITE_URL),
    // Site-wide fallback keywords. Pages that target a distinct intent
    // (/explore, /recruiter, /precios…) override this with their own set.
    keywords: siteKeywords(locale),
    applicationName: "huevsite.io",
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    authors: [{ name: "huevsite.io", url: SITE_URL }],
    creator: "huevsite.io",
    publisher: "huevsite.io",
    category: "technology",
    // Stops iOS Safari from auto-linking numbers in profile taglines/metrics
    // (it injects <a href="tel:"> into the DOM, which pollutes the markup
    // crawlers read).
    formatDetection: { telephone: false, email: false, address: false },
    // Google Search Console property. Rendered as
    // <meta name="google-site-verification" content="..." />.
    verification: { google: GOOGLE_SITE_VERIFICATION },
    robots: PUBLIC_ROBOTS,
    // No `images` here on purpose: a config-level openGraph.images OVERRIDES
    // the file-based app/opengraph-image.tsx for every route that inherits it,
    // which would silently kill all dynamic OG cards.
    openGraph: {
      type: "website",
      siteName: "huevsite.io",
      locale: locale === "en" ? "en_US" : "es_AR",
      alternateLocale: locale === "en" ? ["es_AR"] : ["en_US"],
      title: t("rootTitle"),
      description: t("rootDescription"),
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      site: "@huevsite",
      creator: "@huevsite",
    },
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
}


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
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-7RXLHZ5RFM"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-7RXLHZ5RFM');
        `}
      </Script>
    </html>
  );
}
