// Admin identity is configured via environment variables so the codebase
// carries no personal data. Set these in your deployment environment.
// ADMIN_EMAILS is a comma-separated list of emails allowed into /admin.
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ADMIN_USERNAME is the protected owner username (cannot be deleted via admin).
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";
