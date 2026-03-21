-- StudyMatch demo seed for Discover, Chat, and basic Dashboard data.
-- 1. Replace the UUID below with your real profile UUID from public.profiles.id
-- 2. Run this in Supabase SQL Editor
-- 3. This creates 4 lightweight demo users:
--    - 1 matched chat partner with messages
--    - 3 discover candidates
--    - 2 sessions so Dashboard has real data

do $$
declare
  v_current_user_id uuid := 'a53e338a-4593-4f1f-8b7a-8c946c7b7274';
  v_alex_user_id uuid := '20000000-0000-0000-0000-000000000001';
  v_naya_user_id uuid := '20000000-0000-0000-0000-000000000002';
  v_kevin_user_id uuid := '20000000-0000-0000-0000-000000000003';
  v_mira_user_id uuid := '20000000-0000-0000-0000-000000000004';
  v_exam_goal_id uuid;
  v_project_goal_id uuid;
  v_ds_subject_id uuid;
  v_algo_subject_id uuid;
  v_calc_subject_id uuid;
  v_db_subject_id uuid;
  v_matched_pair_id uuid;
  v_conversation_id uuid;
  v_session_online_id uuid := '30000000-0000-0000-0000-000000000001';
  v_session_offline_id uuid := '30000000-0000-0000-0000-000000000002';
begin
  if v_current_user_id = '11111111-1111-1111-1111-111111111111'::uuid then
    raise exception 'Replace current_user_id in supabase/seed_discover_chat_demo.sql with your real profiles.id first.';
  end if;

  if not exists (select 1 from public.profiles where id = v_current_user_id) then
    raise exception 'Profile % not found in public.profiles. Finish signup + onboarding first.', v_current_user_id;
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      v_alex_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'alex.demo@studymatch.app',
      crypt('studymatch-demo', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Hartono"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      v_naya_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'naya.demo@studymatch.app',
      crypt('studymatch-demo', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Naya Putri"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      v_kevin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'kevin.demo@studymatch.app',
      crypt('studymatch-demo', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Kevin Mahendra"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      v_mira_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mira.demo@studymatch.app',
      crypt('studymatch-demo', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mira Anindya"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    )
  on conflict (id) do nothing;

  insert into public.subjects (slug, name, category)
  values
    ('data-structures', 'Data Structures', 'Computer Science'),
    ('algorithms', 'Algorithms', 'Computer Science'),
    ('calculus', 'Calculus', 'Mathematics'),
    ('database-systems', 'Database Systems', 'Computer Science')
  on conflict (name) do update set category = excluded.category;

  select id into v_exam_goal_id from public.study_goals where code = 'exam_prep';
  select id into v_project_goal_id from public.study_goals where code = 'project';
  select id into v_ds_subject_id from public.subjects where name = 'Data Structures';
  select id into v_algo_subject_id from public.subjects where name = 'Algorithms';
  select id into v_calc_subject_id from public.subjects where name = 'Calculus';
  select id into v_db_subject_id from public.subjects where name = 'Database Systems';

  insert into public.profiles (
    id,
    full_name,
    university_name,
    bio,
    language_code,
    learning_style,
    preferred_study_mode,
    global_skill_level,
    onboarding_completed_at
  )
  values
    (
      v_alex_user_id,
      'Alex Hartono',
      'Universitas Indonesia',
      'Focused on data structures and loves late-afternoon review sessions.',
      'id',
      'visual',
      'online',
      'intermediate',
      timezone('utc', now())
    ),
    (
      v_naya_user_id,
      'Naya Putri',
      'Institut Teknologi Bandung',
      'Prepping for calculus finals and prefers calm evening study blocks.',
      'id',
      'auditory',
      'online',
      'beginner',
      timezone('utc', now())
    ),
    (
      v_kevin_user_id,
      'Kevin Mahendra',
      'Universitas Gadjah Mada',
      'Enjoys solving algorithm drills together and working through tricky proofs.',
      'id',
      'kinesthetic',
      'hybrid',
      'advanced',
      timezone('utc', now())
    ),
    (
      v_mira_user_id,
      'Mira Anindya',
      'Universitas Airlangga',
      'Database systems student looking for focused partners for weekly sessions.',
      'id',
      'visual',
      'in_person',
      'intermediate',
      timezone('utc', now())
    )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    university_name = excluded.university_name,
    bio = excluded.bio,
    learning_style = excluded.learning_style,
    preferred_study_mode = excluded.preferred_study_mode,
    global_skill_level = excluded.global_skill_level,
    onboarding_completed_at = excluded.onboarding_completed_at;

  insert into public.profile_subjects (profile_id, subject_id, mastery_score, is_primary)
  values
    (v_alex_user_id, v_ds_subject_id, 78, true),
    (v_alex_user_id, v_algo_subject_id, 72, false),
    (v_naya_user_id, v_calc_subject_id, 64, true),
    (v_kevin_user_id, v_algo_subject_id, 85, true),
    (v_kevin_user_id, v_ds_subject_id, 75, false),
    (v_mira_user_id, v_db_subject_id, 81, true)
  on conflict (profile_id, subject_id) do update
  set mastery_score = excluded.mastery_score, is_primary = excluded.is_primary;

  insert into public.profile_goals (profile_id, goal_id)
  values
    (v_alex_user_id, v_exam_goal_id),
    (v_naya_user_id, v_exam_goal_id),
    (v_kevin_user_id, v_project_goal_id),
    (v_mira_user_id, v_project_goal_id)
  on conflict (profile_id, goal_id) do nothing;

  insert into public.profile_time_preferences (profile_id, time_bucket)
  values
    (v_alex_user_id, 'afternoon'),
    (v_naya_user_id, 'evening'),
    (v_kevin_user_id, 'late_night'),
    (v_mira_user_id, 'afternoon')
  on conflict (profile_id, time_bucket) do nothing;

  insert into public.availability_slots (profile_id, day_of_week, start_time, end_time, timezone)
  values
    (v_alex_user_id, 1, '16:00', '18:00', 'Asia/Jakarta'),
    (v_alex_user_id, 3, '16:00', '18:00', 'Asia/Jakarta'),
    (v_naya_user_id, 2, '19:00', '21:00', 'Asia/Jakarta'),
    (v_kevin_user_id, 4, '20:00', '22:00', 'Asia/Jakarta'),
    (v_mira_user_id, 5, '15:00', '17:00', 'Asia/Jakarta')
  on conflict (profile_id, day_of_week, start_time, end_time) do nothing;

  insert into public.matches (
    profile_a_id,
    profile_b_id,
    compatibility_score,
    compatibility_breakdown,
    status
  )
  values (
    least(v_current_user_id, v_alex_user_id),
    greatest(v_current_user_id, v_alex_user_id),
    92,
    '{"subjects": 95, "schedule": 88, "goals": 90, "skills": 85}'::jsonb,
    'active'
  )
  on conflict (profile_a_id, profile_b_id) do update
  set compatibility_score = excluded.compatibility_score,
      compatibility_breakdown = excluded.compatibility_breakdown,
      status = 'active'
  returning id into v_matched_pair_id;

  if v_matched_pair_id is null then
    select id
    into v_matched_pair_id
    from public.matches
    where profile_a_id = least(v_current_user_id, v_alex_user_id)
      and profile_b_id = greatest(v_current_user_id, v_alex_user_id);
  end if;

  insert into public.conversations (conversation_type, match_id, created_by, last_message_at)
  values ('direct', v_matched_pair_id, v_current_user_id, timezone('utc', now()))
  on conflict (match_id) do update
  set updated_at = timezone('utc', now())
  returning id into v_conversation_id;

  if v_conversation_id is null then
    select id into v_conversation_id
    from public.conversations c
    where c.match_id = v_matched_pair_id
    limit 1;
  end if;

  insert into public.conversation_members (conversation_id, profile_id, member_role, last_read_at)
  values
    (v_conversation_id, v_current_user_id, 'member', timezone('utc', now())),
    (v_conversation_id, v_alex_user_id, 'member', timezone('utc', now()))
  on conflict (conversation_id, profile_id) do update
  set last_read_at = excluded.last_read_at;

  insert into public.messages (conversation_id, sender_profile_id, body, sent_at)
  values
    (v_conversation_id, v_alex_user_id, 'Hey! I saw we both focus on Data Structures. Mau review AVL tree bareng besok?', timezone('utc', now()) - interval '22 hours'),
    (v_conversation_id, v_current_user_id, 'Boleh banget. Aku juga lagi stuck di bagian rotation dan balancing.', timezone('utc', now()) - interval '21 hours'),
    (v_conversation_id, v_alex_user_id, 'Sip, aku bisa share approach yang kupakai. Kita online jam 4 sore?', timezone('utc', now()) - interval '20 hours')
  on conflict do nothing;

  insert into public.sessions (
    id,
    organizer_profile_id,
    match_id,
    subject_id,
    title,
    study_mode,
    scheduled_start,
    duration_minutes,
    meeting_url,
    status
  )
  values (
    v_session_online_id,
    v_current_user_id,
    v_matched_pair_id,
    v_ds_subject_id,
    'AVL Trees Review',
    'online',
    timezone('utc', now()) + interval '1 day',
    90,
    'https://meet.jit.si/studymatch-demo-avl-review',
    'scheduled'
  )
  on conflict (id) do update
  set scheduled_start = excluded.scheduled_start,
      duration_minutes = excluded.duration_minutes,
      meeting_url = excluded.meeting_url,
      status = excluded.status;

  insert into public.sessions (
    id,
    organizer_profile_id,
    match_id,
    subject_id,
    title,
    study_mode,
    scheduled_start,
    duration_minutes,
    location_text,
    status
  )
  values (
    v_session_offline_id,
    v_current_user_id,
    v_matched_pair_id,
    v_algo_subject_id,
    'Greedy Algorithms Drill',
    'in_person',
    timezone('utc', now()) - interval '2 days',
    75,
    'Perpustakaan Kampus Lt. 2',
    'completed'
  )
  on conflict (id) do update
  set scheduled_start = excluded.scheduled_start,
      duration_minutes = excluded.duration_minutes,
      location_text = excluded.location_text,
      status = excluded.status;

  insert into public.session_participants (session_id, profile_id, participant_role, attendance_status)
  values
    (v_session_online_id, v_current_user_id, 'host', 'accepted'),
    (v_session_online_id, v_alex_user_id, 'participant', 'accepted'),
    (v_session_offline_id, v_current_user_id, 'host', 'attended'),
    (v_session_offline_id, v_alex_user_id, 'participant', 'attended')
  on conflict (session_id, profile_id) do update
  set attendance_status = excluded.attendance_status;
end $$;
