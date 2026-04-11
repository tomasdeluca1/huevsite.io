-- Follow-up to 20260411000000_security_hardening.sql
--
-- The security hardening migration dropped the public SELECT policy on
-- showcase_nominations to address M3 from the pentest report. In practice
-- that broke nomination counts on /[username] profile pages: those count
-- queries silently returned 0 because RLS denied the row visibility, but
-- the surrounding try/catch swallowed the error.
--
-- The privacy benefit of restricting these reads is marginal: the count
-- of "who got nominated this week" is already public on /showcase, and
-- the actual nominator identity (nominated_by) is the only sensitive
-- piece — but it's not what the public profile page consumes.
--
-- Restore the public SELECT policy. The INSERT/DELETE policies (which
-- check `nominated_by = auth.uid()`) remain in place so users can still
-- only nominate / un-nominate as themselves.
--
-- If we ever want to hide the nominator identity from anon/authenticated
-- clients, the right fix is a column-level GRANT that excludes
-- `nominated_by`, NOT a row-level lockdown.

CREATE POLICY "Nominaciones visibles para todos"
  ON public.showcase_nominations
  FOR SELECT
  USING (true);
