-- ============================================================
-- COMPREHENSIVE FIX: RLS Recursion & Stack Depth Fix
-- ============================================================

-- 1. Helper Functions (Security Definer to break recursion)
create or replace function public.is_conversation_member(p_conversation_id uuid, p_profile_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.conversation_members where conversation_id = p_conversation_id and profile_id = p_profile_id);
end; $$;

create or replace function public.is_match_member(p_match_id uuid, p_profile_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.matches where id = p_match_id and (profile_a_id = p_profile_id or profile_b_id = p_profile_id));
end; $$;

-- 2. REBUILD POLICIES FOR SWIPES
drop policy if exists "Users can manage their own swipes" on public.swipes;
create policy "Users can manage their own swipes" on public.swipes
  for all using (auth.uid() = actor_profile_id)
  with check (auth.uid() = actor_profile_id);

-- 3. REBUILD POLICIES FOR MATCHES
drop policy if exists "Users can view their own matches" on public.matches;
create policy "Users can view their own matches" on public.matches
  for select using (auth.uid() = profile_a_id or auth.uid() = profile_b_id);

-- 4. REBUILD POLICIES FOR CONVERSATIONS
drop policy if exists "Users can view their conversations" on public.conversations;
create policy "Users can view their conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members cm 
      where cm.conversation_id = id and cm.profile_id = auth.uid()
    )
    or (match_id is not null and public.is_match_member(match_id, auth.uid()))
  );

-- 5. REBUILD POLICIES FOR MESSAGES
drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations" on public.messages
  for select using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "Users can send messages to their conversations" on public.messages;
create policy "Users can send messages to their conversations" on public.messages
  for insert with check (public.is_conversation_member(conversation_id, auth.uid()));

-- 6. REBUILD POLICIES FOR CONVERSATION_MEMBERS
drop policy if exists "Users can view conversation participants" on public.conversation_members;
create policy "Users can view conversation participants" on public.conversation_members
  for select using (
    public.is_conversation_member(conversation_id, auth.uid())
    or profile_id = auth.uid()
  );

-- ============================================================
-- DONE: RLS Rekursi telah diperbaiki.
-- ============================================================
