"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type GitHubData,
  type LayoutOption,
  type OnboardingCompletionData,
  type Role,
} from "@/lib/onboarding-types";
import { buildInitialOnboardingState } from "@/lib/onboarding-utils";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { BlockData } from "@/lib/profile-types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  tagline?: string;
  avatarUrl?: string;
  githubData?: GitHubData | null;
  initialColor?: string;
  initialLayout?: LayoutOption | null;
  initialRoles?: Role[] | null;
  onComplete?: (data: OnboardingCompletionData & { blocks: BlockData[] }) => Promise<void> | void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  username,
  displayName,
  tagline,
  avatarUrl,
  githubData,
  initialColor = "#C8FF00",
  initialLayout = null,
  initialRoles = [],
  onComplete,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-black"
        >
          <OnboardingExperience
            mode="configure"
            initialState={buildInitialOnboardingState({
              username,
              accentColor: initialColor,
              layout: initialLayout,
              roles: initialRoles,
              githubData,
            })}
            displayName={displayName}
            tagline={tagline}
            avatarUrl={avatarUrl}
            onSkip={onClose}
            onComplete={onComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
