-- Self-service builder testimonials.
-- Logged-in users submit ONE testimonial (their quote). Admin moderates
-- (approve/reject) and marks which are "featured". Only approved + featured
-- testimonials render on the landing page.
--
-- All writes go through service-role API routes (which set status/featured),
-- so the `authenticated` role gets NO insert/update grant — a user can't
-- self-approve or self-feature by hitting PostgREST directly. RLS SELECT
-- policies are defense-in-depth; the landing read also uses service-role.

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  -- References profiles(id) (= auth user id) so PostgREST can embed the
  -- builder's fresh name/username/avatar; cascade still propagates from
  -- auth.users → profiles → testimonials.
  user_id uuid not null references public.profiles(id) on delete cascade,
  quote text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  featured boolean not null default false,
  featured_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Supports the landing query (approved + featured, ordered).
create index if not exists idx_testimonials_landing
  on public.testimonials (featured_order, created_at desc)
  where status = 'approved' and featured = true;

alter table public.testimonials enable row level security;

-- Anyone may read the public set (what the landing shows).
drop policy if exists "testimonials_select_public" on public.testimonials;
create policy "testimonials_select_public" on public.testimonials
  for select using (status = 'approved' and featured = true);

-- A user may read their own testimonial (any status) to see it on /testimonio.
drop policy if exists "testimonials_select_own" on public.testimonials;
create policy "testimonials_select_own" on public.testimonials
  for select using (auth.uid() = user_id);

-- Reads only for clients; all writes happen via service-role API routes.
grant select on public.testimonials to anon, authenticated;
