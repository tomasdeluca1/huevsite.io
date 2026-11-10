-- profiles.country was added after column-level SELECT grants were locked down.
-- The profiles_explore view runs as security_invoker and selects p.country, so
-- anon/authenticated get permission denied and /api/explore returns 500.
-- Country is public profile data shown on Explore. Do not grant table-level
-- SELECT: that would expose email, billing IDs, and other private columns.
GRANT SELECT (country) ON TABLE public.profiles TO anon, authenticated;
