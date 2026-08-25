import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PricingTiers } from "@/components/landing/PricingTiers";
import { getFounderSeats } from "@/lib/founder-seats";
import LocaleToggle from "@/components/LocaleToggle";
import { getLocale } from "@/lib/locale";
import { canonical, keywordsFor } from "@/lib/seo";
import { safeJsonLd } from "@/lib/json-ld";
import { breadcrumbLd, pricingLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("pricing");
  const locale = await getLocale();
  const title = t("pageMetaTitle");
  const description = t("pageMetaDescription");
  return {
    title,
    description,
    keywords: keywordsFor("pricing", locale),
    // The page carries utm_* through to checkout — canonical keeps every
    // campaign variant collapsed into one indexed URL.
    alternates: { canonical: canonical("/precios") },
    openGraph: { title, description, url: canonical("/precios"), type: "website", siteName: "huevsite.io" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Reconstruye SOLO los utm_* entrantes como query string saneado (evita arrastrar
// params arbitrarios al checkout / login).
function buildUtmQuery(sp?: { [key: string]: string | string[] | undefined }): string {
  if (!sp) return "";
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const parts: string[] = [];
  for (const k of keys) {
    const raw = sp[k];
    const val = Array.isArray(raw) ? raw[0] : raw;
    if (val) parts.push(`${k}=${encodeURIComponent(val)}`);
  }
  return parts.join("&");
}

export default async function PreciosPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");
  const tPricing = await getTranslations("pricing");

  const pricingUser = user ? { id: user.id, email: user.email } : null;
  const utm = buildUtmQuery(searchParams);
  const founderSeats = await getFounderSeats();

  // SoftwareApplication + Offers. Makes the plan lineup machine-readable so
  // price-annotated results and AI answers quote the real numbers (including
  // that there IS a free tier) instead of guessing.
  const jsonLd = [
    pricingLd({
      name: "huevsite.io",
      description: tPricing("pageMetaDescription"),
      url: canonical("/precios"),
      offers: [
        { name: "Free", price: "0", description: tPricing("schemaFreeDescription") },
        { name: "Pro", price: "9", recurring: true, description: tPricing("schemaProDescription") },
        { name: "Founder", price: "79", description: tPricing("schemaFounderDescription") },
      ],
    }),
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: tPricing("breadcrumb"), path: "/precios" },
    ]),
  ];

  return (
    <main className="landing min-h-screen bg-[var(--bg)] font-display">
      {/* Plain <script>, NOT next/script: with strategy="beforeInteractive"
          next/script only ships the tag inside the RSC flight payload and
          injects it client-side, so the JSON-LD was absent from the server
          HTML entirely — invisible to every crawler that doesn't run JS
          (Bing, LinkedIn, and the AI bots robots.txt explicitly invites). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="logo">
            huev<span style={{ color: "var(--accent)" }}>site</span>.io
          </Link>
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <Link href={user ? "/dashboard" : "/login"} className="btn btn-ghost">
              {user ? tNav("myHuevsite") : tNav("login")}
            </Link>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="section-label" style={{ color: "var(--accent)", justifyContent: "center" }}>
            {t("proSectionLabel")}
          </div>
          <h1 className="section-title">
            {t("proTitlePrefix")} <span style={{ color: "var(--accent)" }}>{t("proTitleAccent")}</span>
          </h1>
          <p className="section-sub">
            {t("proSub")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          <PricingTiers user={pricingUser} loginNext="/precios" utm={utm} founderRemaining={founderSeats.remaining} />
        </div>

        <p className="text-center text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-12 opacity-50">
          {tPricing("securePaymentNote")}
        </p>
      </div>
    </main>
  );
}
