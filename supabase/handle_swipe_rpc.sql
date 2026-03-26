-- ============================================================
-- THE ULTIMATE FIX: RPC Swipe Handler (Atomic Transaction)
-- ============================================================
-- This function handles everything in one go:
-- 1. Saves the swipe
-- 2. Checks for mutual like
-- 3. Creates the match if mutual
-- 4. Creates the conversation if newly matched
-- 5. Returns the result
-- ============================================================

create or replace function public.handle_swipe(
  p_target_id uuid,
  p_action text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_match_id uuid;
  v_conversation_id uuid;
  v_reciprocal_exists boolean;
  v_low_id uuid;
  v_high_id uuid;
  v_result json;
begin
  if v_actor_id is null then
    raise exception 'Not authorized';
  end if;

  -- 1. Save / Update the swipe
  insert into public.swipes (actor_profile_id, target_profile_id, action)
  values (v_actor_id, p_target_id, p_action)
  on conflict (actor_profile_id, target_profile_id)
  do update set action = p_action, swiped_at = now();

  -- If it's a 'pass', we're done
  if p_action = 'pass' then
    return json_build_object('swipe', true, 'match', null, 'conversation', null);
  end if;

  -- 2. Check for reciprocal like
  select exists (
    select 1 from public.swipes
    where actor_profile_id = p_target_id
      and target_profile_id = v_actor_id
      and action in ('like', 'super_like')
  ) into v_reciprocal_exists;

  -- 3. Handle Match
  if v_reciprocal_exists then
    -- Get sorted IDs
    if v_actor_id < p_target_id then
      v_low_id := v_actor_id; v_high_id := p_target_id;
    else
      v_low_id := p_target_id; v_high_id := v_actor_id;
    end if;

    -- Ensure match exists
    insert into public.matches (profile_a_id, profile_b_id, status, compatibility_score)
    values (v_low_id, v_high_id, 'active', floor(random() * (95 - 75 + 1) + 75))
    on conflict (profile_a_id, profile_b_id) do update set updated_at = now()
    returning id into v_match_id;

    -- 4. Ensure conversation exists
    insert into public.conversations (match_id, conversation_type)
    values (v_match_id, 'direct')
    on conflict (match_id) do nothing
    returning id into v_conversation_id;

    -- If no id returned (conflict), fetch it
    if v_conversation_id is null then
      select id into v_conversation_id from public.conversations where match_id = v_match_id;
    end if;

    -- Return full match info
    return json_build_object(
      'swipe', true, 
      'match', (select row_to_json(m) from public.matches m where m.id = v_match_id),
      'conversation', (select row_to_json(c) from public.conversations c where c.id = v_conversation_id)
    );
  end if;

  -- No match yet
  return json_build_object('swipe', true, 'match', null, 'conversation', null);
end;
$$;
