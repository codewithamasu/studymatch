-- ============================================================
-- COMPREHENSIVE FIX: Stack depth limit exceeded in RLS
-- ============================================================
-- Any helper function used in RLS that queries a table with RLS
-- MUST be 'language plpgsql' and 'security definer' to break
-- the query planner's inlining recursion.
-- ============================================================

-- 1. is_conversation_member
create or replace function public.is_conversation_member(p_conversation_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.profile_id = p_profile_id
  );
end;
$$;

-- 2. is_group_member
create or replace function public.is_group_member(p_group_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.profile_id = p_profile_id
  );
end;
$$;

-- 3. is_group_admin
create or replace function public.is_group_admin(p_group_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.profile_id = p_profile_id
      and gm.member_role in ('owner', 'admin')
  );
end;
$$;

-- 4. can_access_group
create or replace function public.can_access_group(p_group_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.study_groups g
    left join public.profiles p
      on p.id = p_profile_id
    where g.id = p_group_id
      and (
        g.visibility = 'public'
        or g.owner_profile_id = p_profile_id
        or public.is_group_member(g.id, p_profile_id)
        or (g.visibility = 'campus' and p.university_name = g.university_name)
      )
  );
end;
$$;

-- 5. is_session_organizer
create or replace function public.is_session_organizer(p_session_id uuid, p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.sessions s
    where s.id = p_session_id
      and s.organizer_profile_id = p_profile_id
  );
end;
$$;
