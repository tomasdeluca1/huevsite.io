-- Community vote between the two huevsite.io jingle options.
-- One vote per user (changeable). Reads/writes go through service-role API
-- routes, but RLS + self policies are enabled as a safety net.

create table if not exists public.jingle_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  choice text not null check (choice in ('monumental', 'del_otro_lado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.jingle_votes enable row level security;

drop policy if exists "jingle_votes_select_own" on public.jingle_votes;
create policy "jingle_votes_select_own" on public.jingle_votes
  for select using (auth.uid() = user_id);

drop policy if exists "jingle_votes_insert_own" on public.jingle_votes;
create policy "jingle_votes_insert_own" on public.jingle_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "jingle_votes_update_own" on public.jingle_votes;
create policy "jingle_votes_update_own" on public.jingle_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.jingle_votes to authenticated;
