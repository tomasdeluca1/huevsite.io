-- Small key/value store for admin-editable landing settings (founder video,
-- founder quote, and whatever else we want to manage without a deploy).
-- Public read (these are public landing values); writes via service-role admin API.

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select using (true);

grant select on public.site_settings to anon, authenticated;
