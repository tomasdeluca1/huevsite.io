"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type LinktreeImportData } from "@/lib/linktree-import";
import {
  STEPS,
  type AccentColor,
  type OnboardingCompletionData,
  type OnboardingState,
  type Role,
} from "@/lib/onboarding-types";
import {
  buildInitialOnboardingState,
  buildOnboardingBlocks,
  buildOnboardingCompletionData,
} from "@/lib/onboarding-utils";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepRole } from "@/components/onboarding/StepRole";
import { StepLinktree } from "@/components/onboarding/StepLinktree";
import { StepAccent } from "@/components/onboarding/StepAccent";
import { StepUsername } from "@/components/onboarding/StepUsername";
import { OnboardingDone } from "@/components/onboarding/OnboardingDone";

interface OnboardingExperienceProps {
  mode: "create" | "configure";
  initialState?: Partial<OnboardingState>;
  displayName?: string;
  avatarUrl?: string;
  tagline?: string;
  referredBy?: string;
  skipHref?: string;
  onSkip?: () => void;
  onComplete?: (data: OnboardingCompletionData & { blocks: ReturnType<typeof buildOnboardingBlocks> }) => Promise<void> | void;
}

export function OnboardingExperience({
  mode,
  initialState,
  displayName,
  avatarUrl,
  tagline,
  referredBy,
  skipHref,
  onSkip,
  onComplete,
}: OnboardingExperienceProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState>(() =>
    buildInitialOnboardingState({
      username: initialState?.username,
      accentColor: initialState?.accentColor,
      layout: initialState?.layout,
      roles: initialState?.roles,
      githubData: initialState?.githubData,
      linktreeData: initialState?.linktreeData,
    })
  );

  const update = (patch: Partial<OnboardingState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (!initialState?.username) return;

    const normalizedUsername = initialState.username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    setState((prev) => {
      if (prev.username === normalizedUsername) return prev;

      return {
        ...prev,
        username: normalizedUsername,
        usernameAvailable: normalizedUsername ? true : prev.usernameAvailable,
      };
    });
  }, [initialState?.username]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleFinish = async () => {
    setCreating(true);
    setError(null);

    try {
      const completion = buildOnboardingCompletionData(state);
      const blocks = buildOnboardingBlocks({
        state: completion,
        displayName,
        avatarUrl,
        tagline,
      });

      if (mode === "create") {
        const profileName =
          completion.linktreeData?.displayName || completion.githubData?.name || displayName;
        const profileTagline =
          completion.linktreeData?.bio || completion.githubData?.bio || tagline;
        const profileImage =
          completion.linktreeData?.avatarUrl || completion.githubData?.avatarUrl || avatarUrl;

        const response = await fetch("/api/profile/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: completion.username,
            name: profileName,
            tagline: profileTagline,
            image: profileImage,
            accentColor: completion.accentColor,
            roles: completion.roles,
            githubHandle: completion.githubHandle,
            githubData: completion.githubData,
            linktreeData: completion.linktreeData,
            referredBy: referredBy || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear perfil");
        }

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("huevsite_pending_claim");
        }

        // No auto-redirect: the Done screen has the share CTAs — let the user
        // celebrate and share before moving on at their own pace.
        setDone(true);
        return;
      }

      await onComplete?.({ ...completion, blocks });
      setDone(true);
    } catch (err) {
      console.error("Error finishing onboarding:", err);
      setError(err instanceof Error ? err.message : "Algo falló. Reintentá.");
      setCreating(false);
    }
  };

  if (done) {
    return (
      <OnboardingDone
        state={state}
        onContinue={() => {
          if (mode === "create") {
            router.push("/dashboard");
          } else {
            onSkip?.();
          }
        }}
      />
    );
  }

  return (
    <OnboardingShell
      currentStep={step}
      stepKey={STEPS[step].id}
      skipHref={skipHref}
      onSkip={onSkip}
    >
      {step === 0 && (
        <StepRole
          state={state}
          onChange={(roles: Role[]) => update({ roles })}
          onNext={next}
        />
      )}

      {step === 1 && (
        <StepLinktree
          state={state}
          onImport={(data: LinktreeImportData) => update({ linktreeData: data })}
          onNext={next}
        />
      )}

      {step === 2 && (
        <StepAccent
          state={state}
          onChange={(accentColor: AccentColor) => update({ accentColor })}
          onNext={next}
        />
      )}

      {step === 3 && (
        <StepUsername
          state={state}
          onChange={(username: string, usernameAvailable: boolean | null) =>
            update({ username, usernameAvailable })
          }
          onFinish={handleFinish}
          creating={creating}
          error={error}
        />
      )}
    </OnboardingShell>
  );
}

export function OnboardingExperienceFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
    </div>
  );
}

export function OnboardingExperienceSuspended(props: OnboardingExperienceProps) {
  return (
    <Suspense fallback={<OnboardingExperienceFallback />}>
      <OnboardingExperience {...props} />
    </Suspense>
  );
}
