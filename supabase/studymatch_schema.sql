begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  university_name text not null,
  major text,
  bio text,
  avatar_url text,
  language_code text not null default 'id' check (char_length(language_code) between 2 and 10),
  learning_style text check (learning_style in ('visual', 'auditory', 'kinesthetic')),
  preferred_study_mode text not null default 'online' check (preferred_study_mode in ('online', 'in_person', 'hybrid')),
  global_skill_level text check (global_skill_level in ('beginner', 'intermediate', 'advanced')),
  onboarding_completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profile_subjects (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  mastery_score smallint not null default 50 check (mastery_score between 0 and 100),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, subject_id)
);

create table if not exists public.profile_goals (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid not null references public.study_goals (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, goal_id)
);

create table if not exists public.profile_time_preferences (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  time_bucket text not null check (time_bucket in ('morning', 'afternoon', 'evening', 'late_night')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, time_bucket)
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint availability_slots_valid_range check (end_time > start_time),
  constraint availability_slots_unique_window unique (profile_id, day_of_week, start_time, end_time)
);

create table if not exists public.study_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  university_name text,
  address text,
  place_type text not null default 'general' check (place_type in ('library', 'cafe', 'coworking', 'classroom', 'general')),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  name text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('public', 'campus', 'private')),
  study_mode text not null default 'hybrid' check (study_mode in ('online', 'in_person', 'hybrid')),
  university_name text,
  capacity integer check (capacity is null or capacity >= 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, profile_id)
);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('pass', 'like', 'super_like')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint swipes_no_self check (actor_profile_id <> target_profile_id),
  constraint swipes_actor_target_unique unique (actor_profile_id, target_profile_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.profiles (id) on delete cascade,
  profile_b_id uuid not null references public.profiles (id) on delete cascade,
  compatibility_score integer check (compatibility_score between 0 and 100),
  compatibility_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'archived', 'blocked')),
  matched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matches_no_self check (profile_a_id <> profile_b_id),
  constraint matches_sorted_pair check (profile_a_id::text < profile_b_id::text),
  constraint matches_unique_pair unique (profile_a_id, profile_b_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null check (conversation_type in ('direct', 'group')),
  match_id uuid unique references public.matches (id) on delete cascade,
  study_group_id uuid unique references public.study_groups (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversations_reference_shape check (
    (conversation_type = 'direct' and match_id is not null and study_group_id is null)
    or
    (conversation_type = 'group' and study_group_id is not null and match_id is null)
  )
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'admin', 'member')),
  last_read_at timestamptz,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default timezone('utc', now()),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_body_or_metadata check (body is not null or metadata <> '{}'::jsonb)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  study_group_id uuid references public.study_groups (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  title text,
  notes text,
  study_mode text not null check (study_mode in ('online', 'in_person')),
  scheduled_start timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 360 and duration_minutes % 15 = 0),
  meeting_url text,
  location_text text,
  study_location_id uuid references public.study_locations (id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sessions_mode_location_check check (
    (study_mode = 'online' and meeting_url is not null and location_text is null and study_location_id is null)
    or
    (study_mode = 'in_person' and meeting_url is null and (location_text is not null or study_location_id is not null))
  )
);

create table if not exists public.session_participants (
  session_id uuid not null references public.sessions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  participant_role text not null default 'participant' check (participant_role in ('host', 'participant')),
  attendance_status text not null default 'accepted' check (attendance_status in ('invited', 'accepted', 'declined', 'attended', 'no_show')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, profile_id)
);

create or replace function public.is_group_member(p_group_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.profile_id = p_profile_id
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.profile_id = p_profile_id
      and gm.member_role in ('owner', 'admin')
  );
$$;

create or replace function public.can_access_group(p_group_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
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
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.profile_id = p_profile_id
  );
$$;

create or replace function public.is_session_organizer(p_session_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sessions s
    where s.id = p_session_id
      and s.organizer_profile_id = p_profile_id
  );
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    university_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'university', 'Mahasiswa'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_profile();

create or replace function public.handle_mutual_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reciprocal_exists boolean;
  low_profile_id uuid;
  high_profile_id uuid;
begin
  if new.action not in ('like', 'super_like') then
    return new;
  end if;

  select exists (
    select 1
    from public.swipes s
    where s.actor_profile_id = new.target_profile_id
      and s.target_profile_id = new.actor_profile_id
      and s.action in ('like', 'super_like')
  )
  into reciprocal_exists;

  if not reciprocal_exists then
    return new;
  end if;

  low_profile_id := least(new.actor_profile_id::text, new.target_profile_id::text)::uuid;
  high_profile_id := greatest(new.actor_profile_id::text, new.target_profile_id::text)::uuid;

  insert into public.matches (profile_a_id, profile_b_id)
  values (low_profile_id, high_profile_id)
  on conflict (profile_a_id, profile_b_id) do nothing;

  return new;
end;
$$;

drop trigger if exists swipes_create_match on public.swipes;
create trigger swipes_create_match
after insert or update of action on public.swipes
for each row
execute function public.handle_mutual_swipe();

create or replace function public.create_direct_conversation_for_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_conversation_id uuid;
begin
  insert into public.conversations (
    conversation_type,
    match_id,
    created_by
  )
  values (
    'direct',
    new.id,
    new.profile_a_id
  )
  on conflict (match_id) do update
    set updated_at = timezone('utc', now())
  returning id into new_conversation_id;

  if new_conversation_id is null then
    select c.id
    into new_conversation_id
    from public.conversations c
    where c.match_id = new.id;
  end if;

  insert into public.conversation_members (conversation_id, profile_id, member_role)
  values
    (new_conversation_id, new.profile_a_id, 'member'),
    (new_conversation_id, new.profile_b_id, 'member')
  on conflict (conversation_id, profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists matches_create_direct_conversation on public.matches;
create trigger matches_create_direct_conversation
after insert on public.matches
for each row
execute function public.create_direct_conversation_for_match();

create or replace function public.create_group_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversations (
    conversation_type,
    study_group_id,
    created_by
  )
  values (
    'group',
    new.id,
    new.owner_profile_id
  )
  on conflict (study_group_id) do nothing;

  insert into public.group_members (group_id, profile_id, member_role)
  values (new.id, new.owner_profile_id, 'owner')
  on conflict (group_id, profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists study_groups_create_defaults on public.study_groups;
create trigger study_groups_create_defaults
after insert on public.study_groups
for each row
execute function public.create_group_defaults();

create or replace function public.sync_group_member_to_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  group_conversation_id uuid;
begin
  select c.id
  into group_conversation_id
  from public.conversations c
  where c.study_group_id = new.group_id
    and c.conversation_type = 'group';

  if group_conversation_id is not null then
    insert into public.conversation_members (conversation_id, profile_id, member_role)
    values (group_conversation_id, new.profile_id, new.member_role)
    on conflict (conversation_id, profile_id) do update
      set member_role = excluded.member_role;
  end if;

  return new;
end;
$$;

drop trigger if exists group_members_sync_conversation_member on public.group_members;
create trigger group_members_sync_conversation_member
after insert or update of member_role on public.group_members
for each row
execute function public.sync_group_member_to_conversation();

create or replace function public.remove_group_member_from_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.conversation_members cm
  using public.conversations c
  where c.study_group_id = old.group_id
    and c.conversation_type = 'group'
    and cm.conversation_id = c.id
    and cm.profile_id = old.profile_id;

  return old;
end;
$$;

drop trigger if exists group_members_remove_conversation_member on public.group_members;
create trigger group_members_remove_conversation_member
after delete on public.group_members
for each row
execute function public.remove_group_member_from_conversation();

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.sent_at,
      updated_at = timezone('utc', now())
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row
execute function public.touch_conversation_on_message();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at
before update on public.subjects
for each row
execute function public.set_updated_at();

drop trigger if exists availability_slots_set_updated_at on public.availability_slots;
create trigger availability_slots_set_updated_at
before update on public.availability_slots
for each row
execute function public.set_updated_at();

drop trigger if exists study_locations_set_updated_at on public.study_locations;
create trigger study_locations_set_updated_at
before update on public.study_locations
for each row
execute function public.set_updated_at();

drop trigger if exists study_groups_set_updated_at on public.study_groups;
create trigger study_groups_set_updated_at
before update on public.study_groups
for each row
execute function public.set_updated_at();

drop trigger if exists swipes_set_updated_at on public.swipes;
create trigger swipes_set_updated_at
before update on public.swipes
for each row
execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

insert into public.study_goals (code, label, description)
values
  ('exam_prep', 'Persiapan Ujian', 'Belajar intensif untuk ujian akhir atau sertifikasi.'),
  ('homework_help', 'Bantuan Tugas', 'Menyelesaikan PR dan pertanyaan konsep harian.'),
  ('skill_mastery', 'Kuasai Skill Baru', 'Pendalaman jangka panjang untuk naik level.'),
  ('project', 'Project Bareng', 'Kolaborasi untuk tugas akademik atau portofolio.')
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      is_active = true;

insert into public.subjects (slug, name, category)
values
  ('mathematics', 'Mathematics', 'STEM'),
  ('computer-science', 'Computer Science', 'STEM'),
  ('psychology', 'Psychology', 'Social Science'),
  ('biology', 'Biology', 'STEM'),
  ('art-design', 'Art & Design', 'Creative'),
  ('economics', 'Economics', 'Business'),
  ('modern-languages', 'Modern Languages', 'Humanities'),
  ('history', 'History', 'Humanities'),
  ('calculus', 'Calculus', 'STEM'),
  ('linear-algebra', 'Linear Algebra', 'STEM'),
  ('data-structures', 'Data Structures', 'Computer Science'),
  ('algorithms', 'Algorithms', 'Computer Science'),
  ('statistics', 'Statistics', 'STEM'),
  ('physics', 'Physics', 'STEM'),
  ('web-development', 'Web Development', 'Computer Science'),
  ('machine-learning', 'Machine Learning', 'Computer Science'),
  ('database-systems', 'Database Systems', 'Computer Science'),
  ('python-programming', 'Python Programming', 'Computer Science'),
  ('econometrics', 'Econometrics', 'Business'),
  ('data-analysis', 'Data Analysis', 'STEM')
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category,
      is_active = true;

create index if not exists idx_profiles_university_name on public.profiles (university_name);
create index if not exists idx_profiles_learning_style on public.profiles (learning_style);
create index if not exists idx_profiles_onboarding_completed_at on public.profiles (onboarding_completed_at);

create index if not exists idx_profile_subjects_subject_id on public.profile_subjects (subject_id);
create index if not exists idx_profile_subjects_profile_id_mastery on public.profile_subjects (profile_id, mastery_score desc);
create index if not exists idx_profile_goals_goal_id on public.profile_goals (goal_id);
create index if not exists idx_profile_time_preferences_bucket on public.profile_time_preferences (time_bucket);
create index if not exists idx_availability_slots_profile_day on public.availability_slots (profile_id, day_of_week);

create index if not exists idx_study_locations_university_name on public.study_locations (university_name);
create index if not exists idx_study_groups_subject_id on public.study_groups (subject_id);
create index if not exists idx_study_groups_owner_profile_id on public.study_groups (owner_profile_id);
create index if not exists idx_study_groups_visibility on public.study_groups (visibility);
create index if not exists idx_group_members_profile_id on public.group_members (profile_id);

create index if not exists idx_swipes_actor_created_at on public.swipes (actor_profile_id, created_at desc);
create index if not exists idx_swipes_target_action on public.swipes (target_profile_id, action);
create index if not exists idx_matches_profile_a_matched_at on public.matches (profile_a_id, matched_at desc);
create index if not exists idx_matches_profile_b_matched_at on public.matches (profile_b_id, matched_at desc);
create index if not exists idx_matches_status on public.matches (status);

create index if not exists idx_conversations_last_message_at on public.conversations (last_message_at desc nulls last);
create index if not exists idx_conversation_members_profile_id on public.conversation_members (profile_id, conversation_id);
create index if not exists idx_messages_conversation_sent_at on public.messages (conversation_id, sent_at desc);
create index if not exists idx_messages_sender_profile_id on public.messages (sender_profile_id, sent_at desc);

create index if not exists idx_sessions_scheduled_start on public.sessions (scheduled_start);
create index if not exists idx_sessions_status_start on public.sessions (status, scheduled_start);
create index if not exists idx_sessions_match_id on public.sessions (match_id);
create index if not exists idx_sessions_study_group_id on public.sessions (study_group_id);
create index if not exists idx_sessions_subject_id on public.sessions (subject_id);
create index if not exists idx_session_participants_profile_id on public.session_participants (profile_id, attendance_status);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.study_goals enable row level security;
alter table public.profile_subjects enable row level security;
alter table public.profile_goals enable row level security;
alter table public.profile_time_preferences enable row level security;
alter table public.availability_slots enable row level security;
alter table public.study_locations enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;

create policy "profiles are viewable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "subjects are readable by authenticated users"
on public.subjects
for select
to authenticated
using (is_active = true);

create policy "authenticated users can create subjects"
on public.subjects
for insert
to authenticated
with check (
  is_active = true
  and char_length(trim(name)) >= 2
  and char_length(trim(slug)) >= 2
);

create policy "study goals are readable by authenticated users"
on public.study_goals
for select
to authenticated
using (is_active = true);

create policy "profile subjects are readable by authenticated users"
on public.profile_subjects
for select
to authenticated
using (true);

create policy "users can manage their own profile subjects"
on public.profile_subjects
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "profile goals are readable by authenticated users"
on public.profile_goals
for select
to authenticated
using (true);

create policy "users can manage their own profile goals"
on public.profile_goals
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "time preferences are readable by authenticated users"
on public.profile_time_preferences
for select
to authenticated
using (true);

create policy "users can manage their own time preferences"
on public.profile_time_preferences
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "availability is readable by authenticated users"
on public.availability_slots
for select
to authenticated
using (true);

create policy "users can manage their own availability"
on public.availability_slots
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "study locations are readable by authenticated users"
on public.study_locations
for select
to authenticated
using (is_active = true);

create policy "study groups are viewable to eligible users"
on public.study_groups
for select
to authenticated
using (
  public.can_access_group(id, auth.uid())
);

create policy "users can create their own study groups"
on public.study_groups
for insert
to authenticated
with check (owner_profile_id = auth.uid());

create policy "owners and admins can update study groups"
on public.study_groups
for update
to authenticated
using (
  owner_profile_id = auth.uid()
  or public.is_group_admin(id, auth.uid())
)
with check (
  owner_profile_id = auth.uid()
  or public.is_group_admin(id, auth.uid())
);

create policy "owners can delete study groups"
on public.study_groups
for delete
to authenticated
using (owner_profile_id = auth.uid());

create policy "group members are viewable to eligible users"
on public.group_members
for select
to authenticated
using (
  public.can_access_group(group_id, auth.uid())
);

create policy "users can join visible groups or admins can invite"
on public.group_members
for insert
to authenticated
with check (
  (profile_id = auth.uid() and public.can_access_group(group_id, auth.uid()))
  or exists (
    select 1
    from public.study_groups g
    where g.id = group_members.group_id
      and g.owner_profile_id = auth.uid()
  )
  or public.is_group_admin(group_id, auth.uid())
);

create policy "owners and admins can update group members"
on public.group_members
for update
to authenticated
using (
  public.is_group_admin(group_id, auth.uid())
)
with check (
  public.is_group_admin(group_id, auth.uid())
);

create policy "users can leave groups and admins can remove members"
on public.group_members
for delete
to authenticated
using (
  profile_id = auth.uid()
  or public.is_group_admin(group_id, auth.uid())
);

create policy "users can read their own swipes"
on public.swipes
for select
to authenticated
using (actor_profile_id = auth.uid());

create policy "users can create their own swipes"
on public.swipes
for insert
to authenticated
with check (actor_profile_id = auth.uid());

create policy "users can update their own swipes"
on public.swipes
for update
to authenticated
using (actor_profile_id = auth.uid())
with check (actor_profile_id = auth.uid());

create policy "users can delete their own swipes"
on public.swipes
for delete
to authenticated
using (actor_profile_id = auth.uid());

create policy "participants can read their matches"
on public.matches
for select
to authenticated
using (profile_a_id = auth.uid() or profile_b_id = auth.uid());

create policy "participants can update match status"
on public.matches
for update
to authenticated
using (profile_a_id = auth.uid() or profile_b_id = auth.uid())
with check (profile_a_id = auth.uid() or profile_b_id = auth.uid());

create policy "conversation members can read conversations"
on public.conversations
for select
to authenticated
using (
  public.is_conversation_member(id, auth.uid())
);

create policy "conversation members can read membership"
on public.conversation_members
for select
to authenticated
using (
  public.is_conversation_member(conversation_id, auth.uid())
);

create policy "conversation members can update their membership"
on public.conversation_members
for update
to authenticated
using (
  profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
)
with check (
  profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
);

create policy "conversation members can read messages"
on public.messages
for select
to authenticated
using (
  public.is_conversation_member(conversation_id, auth.uid())
);

create policy "conversation members can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
);

create policy "senders can edit their own messages"
on public.messages
for update
to authenticated
using (
  sender_profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
)
with check (sender_profile_id = auth.uid());

create policy "senders can delete their own messages"
on public.messages
for delete
to authenticated
using (sender_profile_id = auth.uid());

create policy "participants can read sessions"
on public.sessions
for select
to authenticated
using (
  organizer_profile_id = auth.uid()
  or exists (
    select 1
    from public.session_participants sp
    where sp.session_id = sessions.id
      and sp.profile_id = auth.uid()
  )
  or (
    study_group_id is not null
    and public.is_group_member(study_group_id, auth.uid())
  )
);

create policy "users can create their own sessions"
on public.sessions
for insert
to authenticated
with check (organizer_profile_id = auth.uid());

create policy "organizers can update their own sessions"
on public.sessions
for update
to authenticated
using (organizer_profile_id = auth.uid())
with check (organizer_profile_id = auth.uid());

create policy "organizers can delete their own sessions"
on public.sessions
for delete
to authenticated
using (organizer_profile_id = auth.uid());

create policy "session participants can read participant rows"
on public.session_participants
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_session_organizer(session_id, auth.uid())
);

create policy "organizers can invite participants and users can join themselves"
on public.session_participants
for insert
to authenticated
with check (
  profile_id = auth.uid()
  or public.is_session_organizer(session_id, auth.uid())
);

create policy "organizers and participants can update attendance"
on public.session_participants
for update
to authenticated
using (
  profile_id = auth.uid()
  or public.is_session_organizer(session_id, auth.uid())
)
with check (
  profile_id = auth.uid()
  or public.is_session_organizer(session_id, auth.uid())
);

create policy "organizers and users can remove session participation"
on public.session_participants
for delete
to authenticated
using (
  profile_id = auth.uid()
  or public.is_session_organizer(session_id, auth.uid())
);

commit;
