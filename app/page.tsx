import { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getShowcaseData, getActiveBuildersThisWeek, getNetworkPulse } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { SITE_URL } from "@/lib/site-url";
import { fetchCurrentWinner } from "@/lib/og/shared";
import { getFeaturedTestimonials } from "@/lib/testimonial-service";
import { getPublishedFaqs } from "@/lib/faq-service";
import { getSiteSettings } from "@/lib/site-settings-service";
import { safeJsonLd } from "@/lib/json-ld";
import { canonical, keywordsFor } from "@/lib/seo";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/structured-data";
import { getLocale } from "@/lib/locale";
import { getFounderSeats } from "@/lib/founder-seats";

export const dynamic = "force-dynamic";

// The home OG image renders the current Builder de la Semana, which changes
// weekly. Next stamps the image route with a 1-year immutable Cache-Control and
// a file-content-hash URL that does NOT change when the winner changes — so the
// CDN and social platforms (Twitter/LinkedIn) keep serving last week's image.
// Fix: version the og:image URL by the current winner's username, so a new
// winner ⇒ a new URL ⇒ every cache fetches the fresh image. The immutable cache
// now works FOR us — each winner's image stays frozen at its own stable URL.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const OG_TITLE = t("metaTitle");
  const OG_DESCRIPTION = t("metaDescription");
  const winner = await fetchCurrentWinner().catch(() => null);
  const v = encodeURIComponent(winner?.username || "huevsite");
  return {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    keywords: keywordsFor("home", locale),
    alternates: { canonical: canonical("/") },
    openGraph: {
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      url: SITE_URL,
      type: "website",
      siteName: "huevsite.io",
      locale: locale === "en" ? "en_US" : "es_AR",
      alternateLocale: locale === "en" ? ["es_AR"] : ["en_US"],
      images: [
        { url: `${SITE_URL}/opengraph-image?v=${v}`, width: 1200, height: 630, alt: OG_TITLE },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      site: "@huevsite",
      creator: "@huevsite",
      images: [`${SITE_URL}/twitter-image?v=${v}`],
    },
  };
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Huevsite.io",
  alternateName: "huevsite",
  url: "https://huevsite.io",
  logo: {
    "@type": "ImageObject",
    url: "https://huevsite.io/icons/icon-512.png",
    width: 512,
    height: 512,
  },
  image: "https://huevsite.io/opengraph-image.png",
  description:
    "Red social y plataforma de portfolios para builders, desarrolladores, diseñadores y founders de todo el mundo.",
  slogan: "Mostrá lo que buildeás.",
  knowsAbout: [
    "portfolio para developers",
    "link in bio",
    "indie hacking",
    "side projects",
    "comunidad de builders",
  ],
  sameAs: [
    "https://x.com/huevsite",
    "https://instagram.com/huevsite",
    "https://www.linkedin.com/company/huevsite",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hi@huevsite.studio",
    contactType: "customer support",
    availableLanguage: ["Spanish", "English"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Huevsite.io",
  alternateName: "huevsite.io",
  url: "https://huevsite.io",
  publisher: { "@id": ORGANIZATION_ID },
  description:
    "El portfolio que se arma solo y se ve como si lo hubiera hecho un diseñador caro. Red social y portfolio para builders de todo el mundo.",
  inLanguage: "es",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://huevsite.io/explore?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Huevsite.io es una red social y plataforma de portfolios para builders, desarrolladores, diseñadores y founders de todo el mundo. Permite crear un portfolio profesional de forma automática integrando GitHub, proyectos activos, métricas reales y redes sociales en un solo lugar.",
      },
    },
    {
      "@type": "Question",
      name: "¿Para quién es Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Huevsite está diseñado para builders de todo el mundo: desarrolladores indie, founders de startups, diseñadores y creadores de contenido tech que quieren mostrar su trabajo de forma profesional y conectar con otros builders.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué tipo de portfolios se pueden crear en Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En Huevsite podés crear portfolios con 9 tipos de bloques: bio personal, GitHub stats automáticos, builds activos con métricas (MRR, usuarios), showcase de proyectos lanzados, stack tecnológico, comunidades, redes sociales, texto libre y links. El editor es visual, drag & drop.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Huevsite.io tiene un plan gratuito sin necesidad de tarjeta de crédito. El plan Pro cuesta $9 por mes e incluye dominio personalizado, insights, más visibilidad y badge verificado; también hay un plan Founder de pago único de por vida.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo se conecta GitHub en Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La integración con GitHub es via OAuth oficial. Una vez conectado, Huevsite importa automáticamente tus estadísticas: lenguajes más usados, gráfica de commits anual y repositorios más populares. Los datos se actualizan periódicamente.",
      },
    },
  ],
};

// SoftwareApplication + offers: the machine-readable answer to "what is
// huevsite and what does it cost". This is what AI Overviews / ChatGPT quote,
// and it makes the free tier explicit so the product isn't assumed paid.
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://huevsite.io/#software",
  name: "huevsite.io",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Portfolio & link-in-bio builder",
  operatingSystem: "Web",
  url: "https://huevsite.io",
  inLanguage: ["es", "en"],
  publisher: { "@id": ORGANIZATION_ID },
  description:
    "Constructor de portfolios y link in bio para builders: proyectos, stack, stats de GitHub, métricas reales y endorsements en un solo perfil público.",
  featureList: [
    "Editor visual drag & drop de bloques",
    "Stats de GitHub automáticas (lenguajes, commits, repos)",
    "Métricas reales de tus proyectos (MRR, usuarios)",
    "Importación desde Linktree en un click",
    "Dominio personalizado",
    "Endorsements de otros builders",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "Perfil público con bloques, sin tarjeta de crédito.",
      availability: "https://schema.org/InStock",
      url: "https://huevsite.io/precios",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "9",
      priceCurrency: "USD",
      description: "Dominio propio, insights, badge verificado y más visibilidad.",
      availability: "https://schema.org/InStock",
      url: "https://huevsite.io/precios",
    },
  ],
};

const speakableSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "huevsite.io | Mostrá lo que buildeás",
  url: "https://huevsite.io",
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "h2", "[data-speakable]"],
  },
};

export default async function LandingPage() {
  // A/B T1 (hero H1): sticky 50/50 assignment. Returning visitors keep their
  // cookie'd variant (no flash — the H1 is decided server-side); first visits
  // get a random one that the client then persists (cookie + localStorage).
  // The page is already force-dynamic, so reading cookies() costs nothing new.
  const abCookie = cookies().get("hv_hero_variant")?.value;
  const heroAbVariant: "identity" | "outcome" =
    abCookie === "identity" || abCookie === "outcome"
      ? abCookie
      : Math.random() < 0.5
      ? "identity"
      : "outcome";

  const [data, testimonials, faqs, settings, activeThisWeek, networkPulse, founderSeats] = await Promise.all([
    getShowcaseData(),
    getFeaturedTestimonials(),
    getPublishedFaqs(),
    getSiteSettings(),
    getActiveBuildersThisWeek(),
    getNetworkPulse(),
    getFounderSeats(),
  ]);

  // FAQPage schema from the admin-managed FAQs; falls back to the static one
  // before the migration is applied (so SEO never loses the FAQ markup).
  const dynamicFaqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : faqSchema;

  const jsonLd = [
    organizationSchema,
    websiteSchema,
    softwareSchema,
    dynamicFaqSchema,
    speakableSchema,
  ];

  return (
    <>
      {/* Plain <script>, NOT next/script: with strategy="beforeInteractive"
          next/script only ships the tag inside the RSC flight payload and
          injects it client-side, so the JSON-LD was absent from the server
          HTML entirely — invisible to every crawler that doesn't run JS
          (Bing, LinkedIn, and the AI bots robots.txt explicitly invites). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <LandingPageClient
        showcaseData={data}
        testimonials={testimonials}
        faqs={faqs}
        founderVideoUrl={settings.founder_video_url || ""}
        founderQuote={settings.founder_quote || ""}
        activeThisWeek={activeThisWeek}
        networkPulse={networkPulse}
        heroAbVariant={heroAbVariant}
        founderRemaining={founderSeats.remaining}
      />
    </>
  );
}
