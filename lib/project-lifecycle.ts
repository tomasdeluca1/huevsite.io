import type { ProjectStatus } from "@/lib/profile-types";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["idea", "building", "launched"];

/** Days until launchDate. Negative = past, 0 = today, null = no/invalid date. */
export function getLaunchCountdownDays(launchDate?: string): number | null {
  if (!launchDate) return null;
  const target = new Date(launchDate + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / 86_400_000);
}

/** A project is past-due to launch when building + date already passed. */
export function isLaunchOverdue(status: ProjectStatus | undefined, launchDate?: string): boolean {
  if (status !== "building") return false;
  const days = getLaunchCountdownDays(launchDate);
  return days !== null && days < 0;
}
