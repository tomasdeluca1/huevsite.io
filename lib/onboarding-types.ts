export type Role = "developer" | "designer" | "founder" | "indie_hacker";

export type AccentColor =
  | "#C8FF00"
  | "#4D9FFF"
  | "#A855F7"
  | "#FF7A00"
  | "#FF3B3B"
  | "#00C853";

export type LayoutOption = "dev_heavy" | "founder_heavy" | "minimal" | "creative";

export interface GitHubData {
  username: string;
  avatarUrl: string;
  name: string;
  bio: string;
  publicRepos: number;
  followers: number;
  topLanguages: string[];
  topRepos: Array<{ name: string; stars: number; description: string }>;
}

export interface OnboardingState {
  // Step 1
  roles: Role[];
  // Step 2
  githubConnected: boolean;
  githubData: GitHubData | null;
  // Step 3
  layout: LayoutOption | null;
  // Step 4
  accentColor: AccentColor;
  // Step 5
  username: string;
  usernameAvailable: boolean | null;
}

export const INITIAL_STATE: OnboardingState = {
  roles: [],
  githubConnected: false,
  githubData: null,
  layout: null,
  accentColor: "#C8FF00",
  username: "",
  usernameAvailable: null,
};

export const STEPS = [
  { id: "role", label: "Quién sos" },
  { id: "github", label: "GitHub" },
  { id: "layout", label: "Layout" },
  { id: "accent", label: "Estilo" },
  { id: "username", label: "Username" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
