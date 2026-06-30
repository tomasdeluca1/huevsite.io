// Usernames that must never be claimed. A public profile lives at
// huevsite.io/[username], so any first-segment route name (huevsite.io/<route>)
// would collide with — and be shadowed by — a same-named username. We also
// reserve platform-owned names, framework/asset paths, and a defensive set of
// common/abuse-prone names that could become routes later.
//
// Only names that are VALID username shapes (^[a-z0-9_]{3,20}$) can actually
// collide, so multi-word route segments with hyphens (e.g. builder-de-la-semana)
// are not registrable usernames anyway and need not be listed.
//
// Enforced server-side in /api/username/check and /api/profile/create. Existing
// profiles are unaffected (this only gates NEW registrations); a pre-existing
// profile whose name equals a route is already shadowed by that route.

// Top-level app routes (app/<segment>) that are valid username shapes.
const ROUTE_RESERVED = [
  'admin', 'api', 'auth', 'blog', 'builders-de-la-semana', 'checkout', 'dashboard',
  'explore', 'feed', 'leaderboard', 'linktree', 'login', 'onboarding', 'precios',
  'privacy', 'recruiter', 'referrals', 'showcase', 'terms', 'testimonio', 'welcome',
];

// Framework / file-based routes and static assets at the app root.
const SYSTEM_RESERVED = [
  'sitemap', 'robots', 'manifest', 'favicon', 'icon', 'opengraph', 'twitter',
  'og', 'assets', 'static', 'public',
];

// Platform-owned, common, or abuse-prone names — reserved defensively so they
// stay available for future routes and can't be used to impersonate the brand.
const SAFETY_RESERVED = [
  'huevsite', 'www', 'mail', 'email', 'root', 'support', 'help', 'about',
  'contact', 'settings', 'account', 'accounts', 'billing', 'pricing', 'plans',
  'plan', 'signin', 'signup', 'signout', 'logout', 'register', 'oauth',
  'callback', 'status', 'docs', 'doc', 'dev', 'app', 'home', 'index', 'user',
  'users', 'profile', 'profiles', 'new', 'edit', 'search', 'notifications',
  'messages', 'feedback', 'jobs', 'careers', 'press', 'legal', 'cookies',
  'security', 'team', 'teams', 'community', 'discord', 'github', 'google',
  'official', 'verified', 'staff', 'moderator', 'null', 'undefined', 'true',
  'false',
];

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  ...ROUTE_RESERVED,
  ...SYSTEM_RESERVED,
  ...SAFETY_RESERVED,
]);

/** True when `username` is reserved and must not be claimed. Case-insensitive. */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.trim().toLowerCase());
}
