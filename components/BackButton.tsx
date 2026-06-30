"use client";

import { useRouter } from "next/navigation";

/**
 * Back button that returns the user to wherever they came from
 * (router.back()), falling back to a given href on a direct visit.
 */
export function BackButton({
  label,
  fallbackHref = "/",
  className = "",
}: {
  label: string;
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      ← {label}
    </button>
  );
}
