"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OnboardingExperienceFallback,
  OnboardingExperienceSuspended,
} from "@/components/onboarding/OnboardingExperience";

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resolvedClaim, setResolvedClaim] = useState<string | undefined>(
    searchParams.get("claim") || undefined
  );
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const claimFromUrl = searchParams.get("claim") || undefined;
    const claimFromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem("huevsite_pending_claim") || undefined
        : undefined;

    setResolvedClaim(claimFromUrl || claimFromStorage);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      try {
        const response = await fetch("/api/profile", { credentials: "include" });

        if (response.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding access:", error);
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingAccess) {
    return <OnboardingExperienceFallback />;
  }

  return (
    <OnboardingExperienceSuspended
      mode="create"
      initialState={resolvedClaim ? { username: resolvedClaim } : undefined}
      referredBy={searchParams.get("ref") || undefined}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingExperienceFallback />}>
      <OnboardingPageContent />
    </Suspense>
  );
}
