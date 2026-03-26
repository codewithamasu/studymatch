-- ============================================================
-- SOFT DEMO RESET (PRESERVES CHATS)
-- ============================================================
-- This version ONLY deletes swipes, allowing the "Discover"
-- stack to be re-played, but it keeps existing matches
-- and conversations intact.
-- ============================================================

create or replace function public.reset_demo_swipes()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  -- ONLY delete swipes (incoming and outgoing)
  -- This makes everyone appear as "not swiped yet" again
  -- but keeps matches and conversations safe.
  delete from public.swipes
  where actor_profile_id = v_user_id or target_profile_id = v_user_id;

end;
$$;
