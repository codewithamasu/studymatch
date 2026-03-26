-- ============================================================
-- DEMO MODE RESET FUNCTION
-- ============================================================
-- The UI "Refresh Discovery" needs to wipe all match history 
-- for the current user to simulate a fresh start. 
-- Regular Supabase API calls fail to do this fully because
-- Row Level Security (RLS) prevents a user from deleting 
-- swipes aimed AT them from other users, and matches don't 
-- have a DELETE policy.
--
-- This function runs with SECURITY DEFINER to bypass RLS
-- and forcefully clean up both incoming and outgoing data.
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
  -- Get the ID of the authenticated user calling this function
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Delete all matches where this user is involved.
  -- (Conversations and messages tied to these matches will cascade delete automatically)
  delete from public.matches
  where profile_a_id = v_user_id or profile_b_id = v_user_id;

  -- 2. Delete all swipes FROM this user OR TO this user
  delete from public.swipes
  where actor_profile_id = v_user_id or target_profile_id = v_user_id;

end;
$$;
