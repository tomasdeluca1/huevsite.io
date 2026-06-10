import { Metadata } from "next";
import Script from "next/script";
import { getShowcaseData } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { SITE_URL } from "@/lib/site-url";
import { fetchCurrentWinner } from "@/lib/og/shared";
import { getFeaturedTestimonials } from "@/lib/testimonial-service";
import { getPublishedFaqs } from "@/lib/faq-service";
import { getSiteSettings } from "@/lib/site-settings-service";

export const dynamic = "force-dynamic";

const OG_TITLE = "huevsite.io | Construí tu reputación como builder";
const OG_DESCRIPTION =
  "Proyectos, métricas reales y endorsements de otros builders. Que te vean shippeando, no diciendo. Acá vive la red de LATAM.";

// The home OG image renders the current Builder de la Semana, which changes
// weekly. Next stamps the image route with a 1-year immutable Cache-Control and
// a file-content-hash URL that does NOT change when the winner changes — so the
// CDN and social platforms (Twitter/LinkedIn) keep serving last week's image.
// Fix: version the og:image URL by the current winner's username, so a new
// winner ⇒ a new URL ⇒ every cache fetches the fresh image. The immutable cache
// now works FOR us — each winner's image stays frozen at its own stable URL.
export async function generateMetadata(): Promise<Metadata> {
  const winner = await fetchCurrentWinner().catch(() => null);
  const v = encodeURIComponent(winner?.username || "huevsite");
  return {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    openGraph: {
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      url: SITE_URL,
      type: "website",
      siteName: "huevsite.io",
      locale: "es_AR",
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
  name: "Huevsite.io",
  url: "https://huevsite.io",
  logo: "https://huevsite.io/icons/icon-512.png",
  description:
    "Red social y plataforma de portfolios para builders, desarrolladores, diseñadores y founders de Argentina y Latinoamérica.",
  sameAs: [
    "https://x.com/huevsite",
    "https://instagram.com/huevsite",
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
  name: "Huevsite.io",
  url: "https://huevsite.io",
  description:
    "El portfolio que se arma solo y se ve como si lo hubiera hecho un diseñador caro. Red social y portfolio para builders de Argentina y LATAM.",
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
        text: "Huevsite.io es una red social y plataforma de portfolios para builders, desarrolladores, diseñadores y founders de Argentina y Latinoamérica. Permite crear un portfolio profesional de forma automática integrando GitHub, proyectos activos, métricas reales y redes sociales en un solo lugar.",
      },
    },
    {
      "@type": "Question",
      name: "¿Para quién es Huevsite.io?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Huevsite está diseñado para builders de LATAM: desarrolladores indie, founders de startups, diseñadores y creadores de contenido tech que quieren mostrar su trabajo de forma profesional y conectar con otros builders de la región.",
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
  const [data, testimonials, faqs, settings] = await Promise.all([
    getShowcaseData(),
    getFeaturedTestimonials(),
    getPublishedFaqs(),
    getSiteSettings(),
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
    dynamicFaqSchema,
    speakableSchema,
  ];

  return (
    <>
      <Script
        id="jsonld-landing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="beforeInteractive"
      />
      <LandingPageClient
        showcaseData={data}
        testimonials={testimonials}
        faqs={faqs}
        founderVideoUrl={settings.founder_video_url || ""}
        founderQuote={settings.founder_quote || ""}
      />
    </>
  );
}
