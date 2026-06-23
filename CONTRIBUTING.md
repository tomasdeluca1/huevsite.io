# Contributing to huevsite.io

Thanks for your interest! This is the codebase behind the live product, so a few notes.

## Getting set up

Follow the **Self-hosting / local setup** section in the [README](./README.md). You need
your own Supabase project; there is no shared dev database.

## Workflow

1. Fork and create a branch off `main` (e.g. `feat/...`, `fix/...`).
2. Make focused changes that follow the existing code style. Match the conventions of the
   files you touch (naming, structure, comment density).
3. Run `npm run lint` and `npm run build` — both must pass. There is no test runner
   configured; verify changes manually in the browser.
4. Open a pull request describing **what** changed and **why**. Link any related issue.

## Database changes

Schema changes go in `supabase/migrations/` as a new timestamped SQL file
(`YYYYMMDDHHMMSS_description.sql`). Do not edit or reorder existing migrations — they have
already been applied to production. New columns must also be threaded through the queries
in `lib/profile-service.ts` (see the checklist in `CLAUDE.md`).

## What we're unlikely to merge

- Changes that rewrite or break existing migrations.
- Large unrelated refactors bundled with a feature.
- Removing attribution or relicensing.

## Code of conduct

Be respectful and constructive. Harassment of any kind is not tolerated.
