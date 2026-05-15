import { Metadata } from "next";
import Script from "next/script";
import { getShowcaseData } from "@/lib/showcase-service";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const OG_TITLE = "huevsite.io | El portfolio que no da vergüenza ajena";
const OG_DESCRIPTION =
  "Armá tu portfolio bento-box, mostrá tus proyectos, métricas y stack. La red de builders, devs y founders de Argentina y LATAM.";

export const metadata: Metadata = {
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    siteName: "huevsite.io",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    site: "@huevsite",
    creator: "@huevsite",
  },
};

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
        text: "Huevsite.io tiene un período de prueba gratuito sin necesidad de tarjeta de crédito. El plan Pro cuesta $5 por mes e incluye dominio personalizado, prioridad en el feed y soporte prioritario.",
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
  const data = await getShowcaseData();

  const jsonLd = [
    organizationSchema,
    websiteSchema,
    faqSchema,
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
      <LandingPageClient showcaseData={data} />
    </>
  );
}
