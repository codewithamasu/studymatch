-- ============================================================
-- ENABLE REALTIME FOR MATCHES
-- ============================================================
-- By default, Supabase does not broadcast table changes over
-- WebSockets. To make the "It's a Match!" popup appear instantly
-- for the partner, we must add the `matches` table to the
-- `supabase_realtime` publication.
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
