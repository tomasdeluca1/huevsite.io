"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  OnboardingExperienceFallback,
  OnboardingExperienceSuspended,
} from "@/components/onboarding/OnboardingExperience";

function OnboardingPageContent() {
  const searchParams = useSearchParams();

  return (
    <OnboardingExperienceSuspended
      mode="create"
      referredBy={searchParams.get("ref") || undefined}
      skipHref="/dashboard"
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
