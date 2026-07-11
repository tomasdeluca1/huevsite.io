# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
```bash
npm run dev     # localhost:3000
npm run build   # production build
npm run lint    # ESLint
```
No test runner configured. Verify changes manually in the browser.

## Architecture

huevsite.io is a link-in-bio builder for builders/founders. Users build a public profile at `huevsite.io/[username]` by composing blocks (projects, stack, metrics, etc.) in a drag-and-drop editor.

### Request Flow

**Public profile** (`/[username]`):
`app/[username]/page.tsx` (server) → `profileService.getProfile()` → `ProfileGrid` + `ProfileHeader` components. Per-user CSS vars (`--accent`, `--radius-xl`) are injected via a `<style>` tag on the server, making all `.huevsite-block` elements respond to user customization without JS.

**Builder/Editor** (`/dashboard`):
`app/dashboard/page.tsx` (single large client component ~1100 lines) holds all state. `DashboardSidebar` handles design controls and block management. `BlockEditorModal` handles per-block editing. Changes persist via `PATCH /api/profile` and `PUT/PATCH /api/blocks/[id]`.

**Sub-sites** (`/[username]/[slug]`):
Same architecture as profile pages but fetches via `profileService.getSubSiteProfile()`. Each sub-site has its own set of blocks scoped by `sub_site_id`.

### Key Patterns

**Adding a new per-user profile property** (e.g. `border_radius`):
1. Migration in `supabase/migrations/YYYYMMDD_name.sql`
2. Add to SELECT in both queries in `lib/profile-service.ts`
3. Map in `_transformProfile` with a fallback default
4. Add to `allowedFields` array in `app/api/profile/route.ts`
5. Inject as CSS var in `<style>` tag in `app/[username]/page.tsx` AND `app/[username]/[slug]/page.tsx`
6. Add UI control in `components/dashboard/Sidebar.tsx` + handler in `app/dashboard/page.tsx`
> ⚠️ If a column is in the SELECT but doesn't exist in the DB yet, Supabase returns an error and `getProfile` returns `null` → 404 on all profile pages. Apply migration before deploying.

**Feature flags**: `lib/feature-flags.ts` reads `NEXT_PUBLIC_FF_*` env vars. Currently only `socialNetwork` (`NEXT_PUBLIC_FF_SOCIAL`). Check with `isEnabled("socialNetwork")`.

**Block save flow**: Blocks are stored in a `blocks` table with `user_id`, `sub_site_id` (null for main profile), `type`, `order`, `col_span`, `row_span`, `visible`, and a `data` JSONB column holding all block-specific content. When a hero block is saved, `syncOwnerAvatarFromHero` in `app/api/blocks/route.ts` syncs the avatar to the profile or sub_site row.

**Score system**: `lib/score-service.ts` — builder score is recomputed after profile/block changes. Score affects showcase visibility (requires `builder_score >= 300` to appear in random showcase).

**OG Images**: `app/api/og/[username]/route.tsx` generates dynamic OG images per user.

### API Routes of Note
| Route | Purpose |
|-------|---------|
| `PATCH /api/profile` | Update profile fields (guarded by `allowedFields`) |
| `POST/PUT /api/blocks` | Create/update blocks |
| `POST /api/blocks/reorder` | Reorder blocks |
| `GET /api/social/showcase` | Showcase data for landing page |
| `POST /api/ai/*` | AI-assisted block generation |
| `POST /api/linktree` | Import from Linktree URL |
| `GET /api/og/[username]` | Dynamic OG image |
| `POST /api/webhooks` | Lemon Squeezy payment webhooks |
| `POST /api/cron/monthly-digest` | Monthly digest email (Vercel cron) |

### CSS Architecture
`.huevsite-block` in `app/globals.css` is the base block style — it has `overflow: hidden` which clips any absolutely-positioned children (tooltips, dropdowns). Use `!overflow-visible` on the element when needed. CSS variables defined in globals: `--radius-sm: 8px`, `--radius: 14px`, `--radius-lg: 20px`, `--radius-xl: 28px` (overridden per-user via style tag).

### Supabase Clients
- Server components / API routes: `lib/supabase/server.ts` or `lib/profile-service.ts` (uses SSR client with cookies)
- Client components: `lib/supabase.ts` (browser client)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
LEMON_SQUEEZY_API_KEY / WEBHOOK_SECRET / CHECKOUT_URL
NEXT_PUBLIC_FF_SOCIAL          # "true" to enable social features
ADMIN_SECRET
TWITTER_API_KEY / SECRET / ACCESS_TOKEN / ACCESS_SECRET
GITHUB_TOKEN                   # app-level GitHub PAT (classic, no scopes needed for public data) used by lib/github-service.ts. Raises the API limit to 5000/h and unlocks GraphQL (real contribution heatmap + per-month commits). Without it, the GitHub block falls back to unauthenticated REST (rate-limited, no heatmap/commits).
LAUNCHY_WEBHOOK_SECRET         # shared secret for the inbound Launchy webhook (app/api/webhooks/launchy). Must match HUEVSITE_WEBHOOK_SECRET in the launchy repo. Generate with: openssl rand -base64 32
LEMON_BOOST_VARIANT_ID         # Lemon variant id of the one-time $12 "Launch boost" product — order_created with this variant flips project_launches.featured (webhook validates ownership via custom_data)
NEXT_PUBLIC_LEMON_BOOST_CHECKOUT_URL  # checkout URL of the boost product; the "Destacar mi lanzamiento" button in DiscoveryRail stays hidden until this is set
FOUNDER_SEATS_CAP              # Founder batch: total $79 lifetime seats (default 20). "Quedan N" is computed live as cap - count(profiles.is_lifetime)
FOUNDER_NEXT_PRICE             # price communicated after the batch sells out (default "$129") — shown in the founder-batch email
NEXT_PUBLIC_LAUNCHY_URL        # base URL of Launchy (default https://launchy.huevsite.com) — used to build the "Lanzar en Launchy" deep link
TYPEFULLY_API_KEY              # Typefully API key (Settings → API). Used by lib/linkedin.ts (v2 API) for LinkedIn auto-announcements and by lib/typefully.ts (legacy v1) for BDLS drafts
TYPEFULLY_SOCIAL_SET_ID        # Typefully social set with the huevsite.io LinkedIn page connected. Without both vars, LinkedIn posts are skipped with a warning (announcements still tweet)
```

## Database: `profiles` table (key columns)
```sql
accent_color TEXT DEFAULT '#C8FF00'
border_radius TEXT DEFAULT '1.5rem'   -- migration 20260326000000
layout TEXT DEFAULT 'dev_heavy'       -- 'dev_heavy' | 'founder_heavy' | 'minimal' | 'creative'
subscription_tier TEXT                -- 'free' | 'pro'
builder_score INT
custom_domain TEXT
```
Migrations live in `supabase/migrations/` and must be applied manually via the Supabase SQL Editor — there is no CLI configured.

## Notion Task Management
- **Always** update Notion task status when it changes during a session
- Database: Productivity Hub — `collection://482b62cc-b905-4462-9f75-659a74f9dd41`
- Status values: `"New" | "Today" | "In Progress" | "Blocked" | "Deferred" | "Done"`
- Filter tasks for this project with `"Project": "huevsite.io"`
