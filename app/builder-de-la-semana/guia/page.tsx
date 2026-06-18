import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site-url";
import LocaleToggle from "@/components/LocaleToggle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("bdls");
  return {
    title: t("guia.metaTitle"),
    description: t("guia.metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/builder-de-la-semana/guia`,
    },
    openGraph: {
      title: t("guia.ogTitle"),
      description: t("guia.ogDescription"),
      url: `${SITE_URL}/builder-de-la-semana/guia`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: t("guia.twitterTitle"),
      description: t("guia.twitterDescription"),
    },
  };
}

export default async function BuilderGuiaPage() {
  const t = await getTranslations("bdls");

  const QUESTIONS = [
    t("guia.questions.0"),
    t("guia.questions.1"),
    t("guia.questions.2"),
    t("guia.questions.3"),
    t("guia.questions.4"),
    t("guia.questions.5"),
    t("guia.questions.6"),
    t("guia.questions.7"),
    t("guia.questions.8"),
    t("guia.questions.9"),
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">
            {t("guia.headerLabel")}
          </span>
          <LocaleToggle />
        </div>
      </header>

      <main className="flex-1 px-6 py-20 md:py-28 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95] mb-4">
          {t("guia.title")}
        </h1>
        <p className="text-zinc-500 text-sm md:text-base mb-20">
          {t("guia.subtitle")}
        </p>

        <ol className="space-y-8">
          {QUESTIONS.map((q, i) => (
            <li key={i} className="flex items-baseline gap-4">
              <span className="shrink-0 text-xs font-mono text-zinc-700 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-base md:text-lg text-white leading-snug">
                {q}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-24 text-xs font-mono text-zinc-700 leading-relaxed">
          {t("guia.footer")}
        </p>
      </main>
    </div>
  );
}
