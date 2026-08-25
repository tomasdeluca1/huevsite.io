import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LocaleToggle from "@/components/LocaleToggle";
import { getLocale } from "@/lib/locale";
import { canonical, keywordsFor } from "@/lib/seo";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Sparkles,
  Users,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("referrals");
  const locale = await getLocale();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: keywordsFor("referrals", locale),
    alternates: { canonical: canonical("/referrals") },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical("/referrals"),
      type: "website",
      siteName: "huevsite.io",
    },
  };
}

const dashboardReferralsHref = "/dashboard?scrollTo=referrals";

export default async function ReferralsPage() {
  const t = await getTranslations("referrals");

  const steps = [
    {
      number: "01",
      title: t("step1Title"),
      description: t("step1Desc"),
      icon: Copy,
    },
    {
      number: "02",
      title: t("step2Title"),
      description: t("step2Desc"),
      icon: Users,
    },
    {
      number: "03",
      title: t("step3Title"),
      description: t("step3Desc"),
      icon: Gift,
    },
  ];

  const faqs = [
    {
      question: t("faq1Q"),
      answer: t("faq1A"),
    },
    {
      question: t("faq2Q"),
      answer: t("faq2A"),
    },
    {
      question: t("faq3Q"),
      answer: t("faq3A"),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,255,0,0.16),transparent_62%)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(8,8,8,0.72)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="logo">
            huev<span style={{ color: "var(--accent)" }}>site</span>.io
          </Link>
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <Link href="/blog" className="btn btn-ghost">
              {t("navBlog")}
            </Link>
            <Link href={dashboardReferralsHref} className="btn btn-accent">
              {t("navSeeMyLink")}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            {t("heroBadge")}
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white md:text-7xl">
            {t("heroTitleLine1")}
            <br />
            <span className="text-[var(--accent)]">{t("heroTitleLine2")}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-dim)] md:text-xl">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={dashboardReferralsHref} className="btn btn-accent !px-7 !py-4 text-base">
              {t("heroCtaPrimary")}
            </Link>
            <Link href="/onboarding" className="btn btn-ghost !px-7 !py-4 text-base">
              {t("heroCtaSecondary")}
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {t("statGoalLabel")}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                {t("statGoalValue")}
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(200,255,0,0.22)] bg-[linear-gradient(180deg,rgba(200,255,0,0.14),rgba(200,255,0,0.07))] p-5 shadow-[0_18px_60px_rgba(200,255,0,0.08)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.72)]">
                {t("statRewardLabel")}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                {t("statRewardValue")}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {t("statTrackingLabel")}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                {t("statTrackingValue")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article
              key={number}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6"
            >
              <div className="absolute right-0 top-0 h-28 w-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-[rgba(200,255,0,0.08)] blur-2xl transition duration-500 group-hover:bg-[rgba(200,255,0,0.14)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {number}
                  </span>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                </div>
                <h2 className="mt-8 text-2xl font-black tracking-[-0.04em] text-white">
                  {title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--text-dim)]">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 lg:p-10">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {t("communicateLabel")}
            </div>
            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              {t("communicateTitleLine1")}
              <br />
              {t("communicateTitleLine2")}
            </h2>
            <div className="mt-8 space-y-4 text-[15px] leading-8 text-[var(--text-dim)]">
              <p>
                {t("communicateBody1")}
              </p>
              <p>
                {t("communicateBody2")}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
                  <span className="font-bold">{t("channelsTitle")}</span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  {t("channelsBody")}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex items-center gap-3 text-white">
                  <ArrowRight className="h-5 w-5 text-[var(--accent)]" />
                  <span className="font-bold">{t("afterTitle")}</span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  {t("afterBody")}
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[rgba(200,255,0,0.2)] bg-[linear-gradient(180deg,rgba(200,255,0,0.16),rgba(200,255,0,0.06))] p-7 text-white lg:p-10">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.72)]">
              {t("summaryLabel")}
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">{t("summaryActionLabel")}</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  {t("summaryActionValue")}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">{t("summaryGoalLabel")}</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  {t("summaryGoalValue")}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">{t("summaryPrizeLabel")}</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  {t("summaryPrizeValue")}
                </div>
              </div>
            </div>

            <Link
              href={dashboardReferralsHref}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:translate-y-[-1px]"
            >
              {t("summaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-16">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {t("faqLabel")}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white">
                {t("faqTitle")}
              </h2>
            </div>

            <div className="w-full max-w-2xl space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-white">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-6 py-8 text-center lg:px-10 lg:py-12">
          <div className="mx-auto max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {t("finalCtaLabel")}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-dim)] md:text-lg">
              {t("finalCtaBody")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={dashboardReferralsHref} className="btn btn-accent !px-7 !py-4 text-base">
                {t("finalCtaPrimary")}
              </Link>
              <Link href="/login" className="btn btn-ghost !px-7 !py-4 text-base">
                {t("finalCtaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
