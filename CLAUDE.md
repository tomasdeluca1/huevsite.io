# CLAUDE.md

## Commands
```bash
npm run dev     # localhost:3000
npm run build   # production build
npx tsc --noEmit  # type check (the lint substitute)
npm run verify    # chains the 4 repo check scripts: i18n keys, social labels, mobile order, og meta
```
`npm run lint` does NOT work: there is no ESLint config, `eslint` is not installed, and `next lint` opens an interactive wizard that hangs forever. Don't run it. No test runner configured. Verify changes manually in the browser.

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

**URLs que escribe el usuario** (`lib/safe-url.ts`): React 18 no bloquea `javascript:` en `href`, y cualquier script en el origen puede crear un token del MCP con la sesión del usuario. Por eso: todo link que salga de datos de un bloque pasa por `safeHref()` (o `withHuevsiteUtm` / `safeHttpUrl`), todo redirect o "volver a" que venga de la URL pasa por `safeInternalPath()`, y el JSON de un bloque pasa por `sanitizeBlockData()` al guardar y al leer para el perfil público. `scripts/verify-safe-url.ts` lo cubre.

**Panel de actividad** (`/admin/actividad`): línea de tiempo de todo lo que pasa (altas, ediciones, pagos, visitas, MCP). Las fuentes son la lista `SOURCES` de `lib/admin-activity.ts`; una tabla nueva se suma ahí con su columna de fecha, su columna de usuario y un `toDraft`. Lee con service-role, así que la página llama a `requireAdmin()` antes de consultar.

**OG Images**: `app/api/og/[username]/route.tsx` generates dynamic OG images per user.

## Referencia (leer a demanda)
`docs/contexto-agente.md`: API routes, CSS de bloques (`.huevsite-block` tiene `overflow: hidden`), clientes Supabase, env vars (nombres), columnas de `profiles` (migraciones a mano en el SQL Editor, sin CLI).

## Notion Task Management
- **Always** update Notion task status when it changes during a session
- Database: Productivity Hub — `collection://482b62cc-b905-4462-9f75-659a74f9dd41`
- Status values: `"New" | "Today" | "In Progress" | "Blocked" | "Deferred" | "Done"`
- Filter tasks for this project with `"Project": "huevsite.io"`
