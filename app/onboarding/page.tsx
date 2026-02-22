"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INITIAL_STATE,
  STEPS,
  type OnboardingState,
  type Role,
  type AccentColor,
  type LayoutOption,
  type GitHubData,
} from "@/lib/onboarding-types";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepRole } from "@/components/onboarding/StepRole";
import { StepGitHub } from "@/components/onboarding/StepGitHub";
import { StepLayout } from "@/components/onboarding/StepLayout";
import { StepAccent } from "@/components/onboarding/StepAccent";
import { StepUsername } from "@/components/onboarding/StepUsername";
import { OnboardingDone } from "@/components/onboarding/OnboardingDone";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);

  const update = (patch: Partial<OnboardingState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleFinish = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: state.username,
          accentColor: state.accentColor,
          layout: state.layout,
          roles: state.roles,
          githubHandle: state.githubData?.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear perfil');
      }

      setDone(true);

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Algo falló. Nos pasa a todos. Reintentá.');
      setCreating(false);
    }
  };

  if (done) {
    return <OnboardingDone state={state} />;
  }

  return (
    <OnboardingShell currentStep={step} stepKey={STEPS[step].id}>
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
