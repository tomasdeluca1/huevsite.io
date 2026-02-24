const FEATURE_FLAGS = {
  socialNetwork: process.env.NEXT_PUBLIC_FF_SOCIAL === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
