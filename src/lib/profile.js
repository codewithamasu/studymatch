import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const DAY_VALUE_TO_INDEX = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const DAY_INDEX_TO_VALUE = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getDisplayName(authUser) {
  const metadata = authUser?.user_metadata ?? {}
  return metadata.full_name || metadata.name || authUser?.email?.split('@')[0] || 'Student'
}

function normalizeStudyModeForDb(mode) {
  return mode === 'in-person' ? 'in_person' : mode || 'online'
}

function normalizeStudyModeForApp(mode) {
  return mode === 'in_person' ? 'in-person' : mode || 'online'
}

function normalizeSubjectName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

function slugifySubjectName(name) {
  const asciiName = normalizeSubjectName(name)
    .normalize('NFKD')
    .replace(/[^\u0020-\u007E]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return asciiName || `subject-${crypto.randomUUID().slice(0, 8)}`
}

function sortAvailabilitySlots(slots = []) {
  return [...slots].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return a.start_time.localeCompare(b.start_time)
  })
}

export function buildStudyProfileFromRecord(profileRecord) {
  if (!profileRecord?.onboarding_completed_at) return null

  const subjectRows = profileRecord.profile_subjects ?? []
  const goalRows = profileRecord.profile_goals ?? []
  const timeRows = profileRecord.profile_time_preferences ?? []
  const availabilityRows = sortAvailabilitySlots(profileRecord.availability_slots ?? [])

  const subjects = subjectRows
    .map((row) => row.subjects?.name)
    .filter(Boolean)

  const subjectMastery = Object.fromEntries(
    subjectRows
      .filter((row) => row.subjects?.name)
      .map((row) => [row.subjects.name, row.mastery_score ?? 50])
  )

  const studyGoals = goalRows
    .map((row) => row.study_goals?.code)
    .filter(Boolean)

  const availability = {
    days: availabilityRows
      .map((row) => DAY_INDEX_TO_VALUE[row.day_of_week])
      .filter(Boolean),
    start: availabilityRows[0]?.start_time?.slice(0, 5) || '19:00',
    end: availabilityRows[0]?.end_time?.slice(0, 5) || '21:00',
  }

  return {
    subjects,
    subject_mastery: subjectMastery,
    skill_level: profileRecord.global_skill_level || '',
    study_goal: studyGoals[0] || '',
    study_goals: studyGoals,
    study_mode: normalizeStudyModeForApp(profileRecord.preferred_study_mode),
    language: profileRecord.language_code || 'id',
    preferred_times: timeRows.map((row) => row.time_bucket),
    availability,
    learning_style: profileRecord.learning_style || '',
  }
}

async function ensureProfileRecord(authUser) {
  if (!isSupabaseConfigured || !authUser) return null

  const metadata = authUser.user_metadata ?? {}
  const payload = {
    id: authUser.id,
    full_name: getDisplayName(authUser),
    university_name: metadata.university || 'Mahasiswa',
    avatar_url: metadata.avatar_url || metadata.picture || null,
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })

  if (error) throw error
  return payload
}

export async function fetchProfileRecord(userId) {
  if (!isSupabaseConfigured || !userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      university_name,
      major,
      bio,
      avatar_url,
      language_code,
      learning_style,
      preferred_study_mode,
      global_skill_level,
      onboarding_completed_at,
      metadata,
      profile_subjects (
        mastery_score,
        is_primary,
        subjects (
          id,
          slug,
          name
        )
      ),
      profile_goals (
        study_goals (
          code,
          label,
          description
        )
      ),
      profile_time_preferences (
        time_bucket
      ),
      availability_slots (
        day_of_week,
        start_time,
        end_time,
        timezone
      )
    `)
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function hydrateAppUser(authUser) {
  if (!authUser) return null

  const metadata = authUser.user_metadata ?? {}

  if (!isSupabaseConfigured) {
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: getDisplayName(authUser),
      university: metadata.university || 'Mahasiswa',
      avatar_url: metadata.avatar_url || metadata.picture || null,
      study_profile: metadata.study_profile || null,
      has_profile: Boolean(metadata.has_profile || metadata.study_profile),
    }
  }

  await ensureProfileRecord(authUser)
  const profileRecord = await fetchProfileRecord(authUser.id)
  const studyProfile = buildStudyProfileFromRecord(profileRecord) || metadata.study_profile || null

  return {
    id: authUser.id,
    email: authUser.email,
    full_name: profileRecord?.full_name || getDisplayName(authUser),
    university: profileRecord?.university_name || metadata.university || 'Mahasiswa',
    avatar_url: profileRecord?.avatar_url || metadata.avatar_url || metadata.picture || null,
    bio: profileRecord?.bio || metadata.bio || '',
    study_profile: studyProfile,
    has_profile: Boolean(profileRecord?.onboarding_completed_at || metadata.has_profile || studyProfile),
  }
}

export async function saveStudyProfile(userId, profileData) {
  if (!isSupabaseConfigured) return null

  const subjectNames = [...new Set((profileData.subjects || []).map(normalizeSubjectName).filter(Boolean))]
  const goalCodes = [...new Set(profileData.study_goals || [])]
  const preferredTimes = [...new Set(profileData.preferred_times || [])]

  const { data: subjectRows, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name')
    .in('name', subjectNames)

  if (subjectError) throw subjectError

  const missingSubjects = subjectNames.filter(
    (name) => !subjectRows?.some((row) => row.name === name)
  )

  let allSubjectRows = subjectRows || []

  if (missingSubjects.length > 0) {
    const subjectsToInsert = missingSubjects.map((name) => ({
      slug: slugifySubjectName(name),
      name,
      category: 'Custom',
    }))

    const { data: insertedSubjectRows, error: insertSubjectError } = await supabase
      .from('subjects')
      .insert(subjectsToInsert)
      .select('id, name')

    if (insertSubjectError) {
      if (insertSubjectError.code !== '23505') {
        throw insertSubjectError
      }

      const { data: refetchedSubjectRows, error: refetchSubjectError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', missingSubjects)

      if (refetchSubjectError) throw refetchSubjectError
      allSubjectRows = [...allSubjectRows, ...(refetchedSubjectRows || [])]
    } else {
      allSubjectRows = [...allSubjectRows, ...(insertedSubjectRows || [])]
    }
  }

  const { data: goalRows, error: goalError } = await supabase
    .from('study_goals')
    .select('id, code')
    .in('code', goalCodes)

  if (goalError) throw goalError

  const missingGoals = goalCodes.filter(
    (code) => !goalRows?.some((row) => row.code === code)
  )

  if (missingGoals.length > 0 && goalCodes.length > 0) {
    throw new Error(`Study goal belum tersedia di database: ${missingGoals.join(', ')}`)
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
  const preferredStudyMode = normalizeStudyModeForDb(profileData.study_mode)

  const profileUpdatePayload = {
    language_code: profileData.language || 'id',
    learning_style: profileData.learning_style || null,
    preferred_study_mode: preferredStudyMode,
    global_skill_level: profileData.skill_level || null,
    onboarding_completed_at: new Date().toISOString(),
  }

  if (profileData.full_name) profileUpdatePayload.full_name = profileData.full_name
  if (profileData.university_name) profileUpdatePayload.university_name = profileData.university_name
  if (profileData.bio !== undefined) profileUpdatePayload.bio = profileData.bio

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdatePayload)
    .eq('id', userId)

  if (profileError) throw profileError

  const profileSubjects = allSubjectRows.map((row) => ({
    profile_id: userId,
    subject_id: row.id,
    mastery_score: profileData.subject_mastery[row.name] ?? 50,
    is_primary: row.name === profileData.subjects[0],
  }))

  const profileGoals = goalRows.map((row) => ({
    profile_id: userId,
    goal_id: row.id,
  }))

  const timePreferences = preferredTimes.map((timeBucket) => ({
    profile_id: userId,
    time_bucket: timeBucket,
  }))

  const availabilitySlots = (profileData.availability.days || []).map((day) => ({
    profile_id: userId,
    day_of_week: DAY_VALUE_TO_INDEX[day],
    start_time: profileData.availability.start,
    end_time: profileData.availability.end,
    timezone,
  }))

  const { error: deleteSubjectsError } = await supabase
    .from('profile_subjects')
    .delete()
    .eq('profile_id', userId)

  if (deleteSubjectsError) throw deleteSubjectsError

  const { error: deleteGoalsError } = await supabase
    .from('profile_goals')
    .delete()
    .eq('profile_id', userId)

  if (deleteGoalsError) throw deleteGoalsError

  const { error: deleteTimeError } = await supabase
    .from('profile_time_preferences')
    .delete()
    .eq('profile_id', userId)

  if (deleteTimeError) throw deleteTimeError

  const { error: deleteAvailabilityError } = await supabase
    .from('availability_slots')
    .delete()
    .eq('profile_id', userId)

  if (deleteAvailabilityError) throw deleteAvailabilityError

  if (profileSubjects.length > 0) {
    const { error } = await supabase.from('profile_subjects').insert(profileSubjects)
    if (error) throw error
  }

  if (profileGoals.length > 0) {
    const { error } = await supabase.from('profile_goals').insert(profileGoals)
    if (error) throw error
  }

  if (timePreferences.length > 0) {
    const { error } = await supabase.from('profile_time_preferences').insert(timePreferences)
    if (error) throw error
  }

  if (availabilitySlots.length > 0) {
    const { error } = await supabase.from('availability_slots').insert(availabilitySlots)
    if (error) throw error
  }

  // Keep auth metadata in sync while the rest of the app still transitions off legacy flags.
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      has_profile: true,
    },
  })

  if (authError) throw authError

  return fetchProfileRecord(userId)
}
