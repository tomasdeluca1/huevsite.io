import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SuccessContent from "./SuccessContent";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("checkout");
    return {
        title: t("metaTitle"),
    };
}

export default async function SuccessPage() {
    const t = await getTranslations("checkout");
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div className="animate-pulse text-zinc-500">{t("loading")}</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
