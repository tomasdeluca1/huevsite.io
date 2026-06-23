# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Email **hi@huevsite.studio** with:

- A description of the issue and its impact.
- Steps to reproduce (proof-of-concept if possible).
- Affected routes/components, if known.

We aim to acknowledge reports within 72 hours and will keep you updated on remediation.

## Scope

In scope: authentication/authorization flaws, data exposure (RLS bypass, IDOR), injection,
SSRF, and similar in this codebase. Out of scope: issues in third-party services
(Supabase, Vercel, Lemon Squeezy, Resend) — report those to the respective vendor.

## Notes for self-hosters

All secrets are configured via environment variables (see `.env.example`); never commit a
real `.env`. The `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to
the client. Admin access is gated by the `ADMIN_EMAILS` allowlist and admin/cron secrets.
