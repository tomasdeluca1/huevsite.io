"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

// ~30s de polling antes de mostrar el estado "delayed" (el webhook a veces tarda
// o falla — sin esto la pantalla queda en spinner infinito).
const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

export default function SuccessContent() {
    const t = useTranslations("checkout");
    const [status, setStatus] = useState<"processing" | "success" | "delayed">("processing");
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;
        let interval: ReturnType<typeof setInterval> | null = null;

        const checkStatus = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/login");
                return;
            }
            if (cancelled) return;
            setUser(authUser);

            let attempts = 0;
            interval = setInterval(async () => {
                attempts += 1;
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("subscription_tier")
                    .eq("id", authUser.id)
                    .single();

                if (cancelled) return;

                if (profile?.subscription_tier === "pro") {
                    setStatus("success");
                    if (interval) clearInterval(interval);
                    triggerConfetti();
                } else if (attempts >= MAX_POLL_ATTEMPTS) {
                    setStatus("delayed");
                    if (interval) clearInterval(interval);
                }
            }, POLL_INTERVAL_MS);
        };

        checkStatus();

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [supabase, router]);

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    return (
        <div className="max-w-md w-full text-center space-y-8">
            <AnimatePresence mode="wait">
                {status === "processing" ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin relative" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">{t("processingTitle")}</h1>
                            <p className="text-zinc-400">
                                {t("processingBody")}
                            </p>
                        </div>
                    </motion.div>
                ) : status === "delayed" ? (
                    <motion.div
                        key="delayed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full" />
                            <Loader2 className="w-12 h-12 text-zinc-500 animate-spin relative" />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold tracking-tight">{t("delayedTitle")}</h1>
                            <p className="text-zinc-400">
                                {t("delayedBody")}
                            </p>
                            <p className="text-zinc-500 text-sm">
                                {t("delayedSupportBefore")}{" "}
                                <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>{" "}
                                {t("delayedSupportAfter")}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/dashboard")}
                            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-medium text-black transition-all hover:bg-zinc-200"
                        >
                            <span>{t("goToDashboard")}</span>
                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                            >
                                <CheckCircle2 className="w-20 h-20 text-green-500 relative" />
                            </motion.div>
                            <motion.div
                                className="absolute -top-2 -right-2"
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400" />
                            </motion.div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                                {t("successTitle")}
                            </h1>
                            <p className="text-zinc-400 text-lg">
                                {t("successBody")}
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/dashboard")}
                            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-medium text-black transition-all hover:bg-zinc-200"
                        >
                            <span>{t("goToDashboard")}</span>
                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-12 border-t border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                    huevsite.io • studio
                </p>
            </div>
        </div>
    );
}
