# huevsite.io

**The link-in-bio builder for builders & founders.** Compose a public profile at
`huevsite.io/[username]` from drag-and-drop blocks — projects, GitHub stats, stack,
metrics, and more — and get discovered in a network of builders.

🔗 Live: [huevsite.io](https://huevsite.io)

This is the open-source codebase that powers the live product. Contributions welcome.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Supabase** (Postgres + Auth + Storage)
- **Tailwind CSS** + **Framer Motion**
- **dnd-kit** (dashboard drag & drop)
- **Resend** (email), **Vercel** (deploy target)

## Features

- GitHub OAuth + email magic-link auth
- 5-step onboarding, drag-and-drop dashboard with autosave
- Public SSR profiles with per-user theming and dynamic OG images
- Block types: hero, building, github, project, stack, metric, social, community, writing
- Builder network: profiles get a score, rank on a leaderboard, and appear in discovery

## Self-hosting / local setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) and note its URL and anon
(publishable) key.

### 3. Apply the database schema

There is **no Supabase CLI** configured — apply SQL manually in the Supabase
**SQL Editor**, in this order:

1. `supabase/schema.sql` (base tables)
2. `supabase/storage.sql` (storage buckets)
3. Every file in `supabase/migrations/` **in chronological (filename) order**

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in at least the Supabase + site vars. Every variable is documented inline in
`.env.example`; most integrations (payments, AI, Twitter, etc.) are optional and the
app degrades gracefully without them.

### 5. Enable GitHub OAuth in Supabase

Under **Authentication → Providers**, enable GitHub. Create a GitHub OAuth App with
callback `https://<your-project>.supabase.co/auth/v1/callback`, and paste the Client
ID/Secret into Supabase.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

A deeper architecture guide lives in [`CLAUDE.md`](./CLAUDE.md): request flow for public
profiles, the builder/editor, sub-sites, the block save flow, scoring, and OG images.

> **Note on the builder score:** the `recompute_builder_score` SQL function in
> `supabase/migrations/` is a working reference formula. The production instance tunes
> its weights privately; this does not affect running or contributing to the project.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Security issues: see [`SECURITY.md`](./SECURITY.md).

## License

[AGPL-3.0](./LICENSE) — if you run a modified version as a network service, you must
make your source available under the same license.
