import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTestimonial } from "@/lib/testimonial-service";
import TestimonioForm from "@/components/TestimonioForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("testimonio");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TestimonioPage() {
  const t = await getTranslations("testimonio");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = user ? await getUserTestimonial(user.id) : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 bg-[var(--bg)]">
      <div className="w-full max-w-lg">
        <Link href="/" className="text-lg font-extrabold tracking-tight inline-block mb-8">
          huev<span style={{ color: "var(--accent)" }}>site</span>.io
        </Link>

        <div className="section-label mb-2">{t("sectionLabel")}</div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          {t("subtitle")}
        </p>

        {user ? (
          <TestimonioForm initial={initial} />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-dim)] mb-4">
              {t("loginPrompt")}
            </p>
            <Link
              href="/login?next=/testimonio"
              className="btn btn-accent inline-flex !px-6 !py-3"
            >
              {t("loginCta")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
