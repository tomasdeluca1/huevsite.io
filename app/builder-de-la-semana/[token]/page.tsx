"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { InterviewForm } from "@/components/builder-interview/InterviewForm";
import { ThankYouScreen } from "@/components/builder-interview/ThankYouScreen";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import LocaleToggle from "@/components/LocaleToggle";

type PageState =
  | { type: "loading" }
  | { type: "form"; builderName: string; builderUsername: string }
  | { type: "done"; builderName: string; builderUsername: string }
  | { type: "expired" }
  | { type: "already_submitted" }
  | { type: "error"; message: string };

export default function BuilderInterviewPage() {
  const t = useTranslations("bdls");
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ type: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/builder-interview/${token}`);
        if (res.ok) {
          const data = await res.json();
          setState({
            type: "form",
            builderName: data.builderName,
            builderUsername: data.builderUsername,
          });
        } else if (res.status === 410) {
          setState({ type: "expired" });
        } else if (res.status === 409) {
          setState({ type: "already_submitted" });
        } else {
          const data = await res.json();
          setState({ type: "error", message: data.error || t("page.genericError") });
        }
      } catch {
        setState({ type: "error", message: t("page.connectionError") });
      }
    }
    load();
  }, [token, t]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-display flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-tighter">
          HUEV<span className="text-[#C8FF00]">SITE</span>.IO
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            {t("page.headerLabel")}
          </span>
          <LocaleToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {state.type === "loading" && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">{t("page.loading")}</p>
          </div>
        )}

        {state.type === "form" && (
          <InterviewForm
            token={token}
            builderName={state.builderName}
            builderUsername={state.builderUsername}
            onComplete={() =>
              setState({
                type: "done",
                builderName: state.builderName,
                builderUsername: state.builderUsername,
              })
            }
          />
        )}

        {state.type === "done" && (
          <ThankYouScreen
            builderName={state.builderName}
            builderUsername={state.builderUsername}
          />
        )}

        {state.type === "expired" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⏰</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">{t("page.expiredTitle")}</h1>
            <p className="text-zinc-500">
              {t("page.expiredBody")}
            </p>
          </div>
        )}

        {state.type === "already_submitted" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">{t("page.alreadySubmittedTitle")}</h1>
            <p className="text-zinc-500">
              {t("page.alreadySubmittedBody")}
            </p>
          </div>
        )}

        {state.type === "error" && (
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-2xl font-extrabold text-white mb-3">{t("page.errorTitle")}</h1>
            <p className="text-zinc-500">{state.message}</p>
          </div>
        )}
      </main>
    </div>
  );
}
