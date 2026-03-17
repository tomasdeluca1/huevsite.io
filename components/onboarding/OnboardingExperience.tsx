"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  STEPS,
  type AccentColor,
  type GitHubData,
  type LayoutOption,
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
import { StepGitHub } from "@/components/onboarding/StepGitHub";
import { StepLayout } from "@/components/onboarding/StepLayout";
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
    })
  );

  const update = (patch: Partial<OnboardingState>) =>
    setState((prev) => ({ ...prev, ...patch }));

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
        const response = await fetch("/api/profile/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: completion.username,
            accentColor: completion.accentColor,
            layout: completion.layout,
            roles: completion.roles,
            githubHandle: completion.githubHandle,
            githubData: completion.githubData,
            referredBy: referredBy || undefined,
            blocks: blocks.map((block) => ({
              type: block.type,
              order: block.order,
              colSpan: block.col_span,
              rowSpan: block.row_span,
              visible: block.visible,
              data:
                block.type === "hero"
                  ? {
                      name: block.name,
                      tagline: block.tagline,
                      avatarUrl: block.avatarUrl,
                      status: block.status,
                      location: block.location,
                      description: block.description,
                      roles: block.roles,
                    }
                  : block.type === "github"
                  ? {
                      username: block.username,
                      stats: block.stats,
                      showAdvanced: block.showAdvanced,
                    }
                  : block.type === "social"
                  ? { links: block.links }
                  : block.type === "metric"
                  ? { label: block.label, value: block.value, icon: block.icon }
                  : block.type === "stack"
                  ? { items: block.items }
                  : {},
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al crear perfil");
        }

        setDone(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        return;
      }

      await onComplete?.({ ...completion, blocks });
      setDone(true);

      if (onSkip) {
        setTimeout(() => {
          onSkip();
        }, 1200);
      }
    } catch (err) {
      console.error("Error finishing onboarding:", err);
      setError(err instanceof Error ? err.message : "Algo falló. Reintentá.");
      setCreating(false);
    }
  };

  if (done) {
    return <OnboardingDone state={state} />;
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
        <StepGitHub
          state={state}
          onConnect={(data: GitHubData) =>
            update({ githubConnected: true, githubData: data })
          }
          onSkip={next}
          onNext={next}
        />
      )}

      {step === 2 && (
        <StepLayout
          state={state}
          onChange={(layout: LayoutOption) => update({ layout })}
          onNext={next}
        />
      )}

      {step === 3 && (
        <StepAccent
          state={state}
          onChange={(accentColor: AccentColor) => update({ accentColor })}
          onNext={next}
        />
      )}

      {step === 4 && (
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
