-- ============================================================
-- FIX: Stack depth limit exceeded on conversation_members RLS
-- ============================================================
-- Root cause: is_conversation_member() is a `language sql` function.
-- SQL functions can be INLINED by the query planner, which means the
-- RLS policy on conversation_members reads from conversation_members
-- (via is_conversation_member), which triggers the RLS policy again,
-- causing infinite recursion → "stack depth limit exceeded".
--
-- Fix: Rewrite is_conversation_member as `language plpgsql` which
-- is NEVER inlined by the query planner, breaking the recursion.
-- The security definer + set search_path ensures RLS is bypassed
-- inside the function body itself.
-- ============================================================

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
