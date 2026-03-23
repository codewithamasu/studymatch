import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { buildStudyProfileFromRecord, fetchProfileRecord } from '@/lib/profile'

function normalizeProfileRecord(record) {
  if (!record) return null

  const studyProfile = buildStudyProfileFromRecord(record)

  return {
    id: record.id,
    full_name: record.full_name,
    university: record.university_name || 'Mahasiswa',
    avatar_url: record.avatar_url || null,
    bio: record.bio || '',
    study_profile: studyProfile,
  }
}

function sortBySentAt(messages = []) {
  return [...messages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
}

function pickLastMessage(messages = []) {
  return messages[messages.length - 1] || null
}

function getUnreadCount(messages = [], lastReadAt, currentUserId) {
  if (!messages.length) return 0

  const lastReadMs = lastReadAt ? new Date(lastReadAt).getTime() : 0

  return messages.filter((message) => {
    const sentAt = new Date(message.sent_at).getTime()
    return message.sender_profile_id !== currentUserId && sentAt > lastReadMs
  }).length
}

export async function fetchDiscoverCandidates(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) return []

  const [
    { data: profileRows, error: profileError },
    { data: swipeRows, error: swipeError },
    { data: matchRows, error: matchError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        university_name,
        bio,
        avatar_url,
        onboarding_completed_at,
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
      `),
    supabase.from('swipes').select('target_profile_id').eq('actor_profile_id', currentUserId),
    supabase
      .from('matches')
      .select('profile_a_id, profile_b_id')
      .or(`profile_a_id.eq.${currentUserId},profile_b_id.eq.${currentUserId}`),
  ])

  if (profileError) throw profileError
  if (swipeError) throw swipeError
  if (matchError) throw matchError

  const swipedIds = new Set((swipeRows || []).map((row) => row.target_profile_id))
  const matchedIds = new Set()

  for (const row of matchRows || []) {
    if (row.profile_a_id !== currentUserId) matchedIds.add(row.profile_a_id)
    if (row.profile_b_id !== currentUserId) matchedIds.add(row.profile_b_id)
  }

  return (profileRows || [])
    .filter((record) => record.id !== currentUserId)
    .map(normalizeProfileRecord)
    .filter((candidate) => candidate?.study_profile)
    .filter((candidate) => !swipedIds.has(candidate.id))
    .filter((candidate) => !matchedIds.has(candidate.id))
}

export async function saveSwipe(actorProfileId, targetProfileId, action) {
  if (!isSupabaseConfigured) return { error: null, swipe: null, match: null, conversation: null }

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      actor_profile_id: actorProfileId,
      target_profile_id: targetProfileId,
      action,
    },
    { onConflict: 'actor_profile_id,target_profile_id' }
  )

  if (swipeError) throw swipeError

  if (action === 'pass') {
    return { error: null, swipe: true, match: null, conversation: null }
  }

  const lowProfileId = [actorProfileId, targetProfileId].sort()[0]
  const highProfileId = [actorProfileId, targetProfileId].sort()[1]

  const { data: matchRow, error: matchError } = await supabase
    .from('matches')
    .select('id, profile_a_id, profile_b_id, compatibility_score, compatibility_breakdown, matched_at')
    .eq('profile_a_id', lowProfileId)
    .eq('profile_b_id', highProfileId)
    .maybeSingle()

  if (matchError) throw matchError

  if (!matchRow) {
    return { error: null, swipe: true, match: null, conversation: null }
  }

  const { data: conversationRow, error: conversationError } = await supabase
    .from('conversations')
    .select('id, conversation_type, match_id, last_message_at, created_at')
    .eq('match_id', matchRow.id)
    .maybeSingle()

  if (conversationError) throw conversationError

  return {
    error: null,
    swipe: true,
    match: matchRow,
    conversation: conversationRow,
  }
}

export async function fetchConversationSummaries(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) return []

  const { data: membershipRows, error: membershipError } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      profile_id,
      member_role,
      last_read_at,
      conversations!inner(
        id,
        conversation_type,
        match_id,
        study_group_id,
        last_message_at,
        created_at
      )
    `)
    .eq('profile_id', currentUserId)

  if (membershipError) throw membershipError

  const conversationIds = (membershipRows || []).map((row) => row.conversation_id)
  if (!conversationIds.length) return []

  const { data: memberRows, error: memberError } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      profile_id,
      member_role,
      last_read_at
    `)
    .in('conversation_id', conversationIds)

  if (memberError) throw memberError

  const { data: messageRows, error: messageError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_profile_id, body, sent_at, metadata')
    .in('conversation_id', conversationIds)
    .order('sent_at', { ascending: true })

  if (messageError) throw messageError

  const peerIds = new Set()
  const currentUserMembershipByConversation = new Map(
    membershipRows.map((row) => [row.conversation_id, row])
  )

  for (const conversationId of conversationIds) {
    const memberRowsForConversation = memberRows.filter((row) => row.conversation_id === conversationId)
    const peerRow = memberRowsForConversation.find((row) => row.profile_id !== currentUserId)
    if (peerRow) peerIds.add(peerRow.profile_id)
  }

  const peerProfiles = await Promise.all(
    Array.from(peerIds).map(async (peerId) => {
      const profileRecord = await fetchProfileRecord(peerId)
      return normalizeProfileRecord(profileRecord)
    })
  )

  const peerProfileById = new Map(peerProfiles.filter(Boolean).map((profile) => [profile.id, profile]))
  const messagesByConversation = conversationIds.reduce((acc, conversationId) => {
    acc[conversationId] = sortBySentAt(
      messageRows.filter((message) => message.conversation_id === conversationId)
    )
    return acc
  }, {})

  return conversationIds
    .map((conversationId) => {
      const memberRowsForConversation = memberRows.filter((row) => row.conversation_id === conversationId)
      const peerRow = memberRowsForConversation.find((row) => row.profile_id !== currentUserId)
      if (!peerRow) return null

      const peerProfile = peerProfileById.get(peerRow.profile_id)
      if (!peerProfile) return null

      const messages = messagesByConversation[conversationId] || []
      const lastMessage = pickLastMessage(messages)
      const currentUserMembership = currentUserMembershipByConversation.get(conversationId)

      return {
        conversationId,
        userId: peerProfile.id,
        user: peerProfile,
        lastMessage: lastMessage?.body || 'No messages yet',
        lastTime: lastMessage?.sent_at
          ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastMessage.sent_at))
          : 'New',
        unread: getUnreadCount(messages, currentUserMembership?.last_read_at, currentUserId),
        online: false,
        subject: peerProfile.study_profile?.subjects?.[0] || 'Study Partner',
        conversationType: memberRowsForConversation.length > 2 ? 'group' : 'direct',
      }
    })
    .filter(Boolean)
}

export async function fetchConversationThread(currentUserId, peerProfileId) {
  if (!isSupabaseConfigured || !currentUserId || !peerProfileId) {
    return { conversation: null, peerProfile: null, messages: [] }
  }

  const { data: memberRows, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id, profile_id, last_read_at, conversations!inner(id, conversation_type, match_id, last_message_at, created_at)')
    .eq('profile_id', currentUserId)

  if (memberError) throw memberError

  const conversationIds = memberRows.map((row) => row.conversation_id)
  if (!conversationIds.length) {
    const peerProfileRecord = await fetchProfileRecord(peerProfileId)
    return {
      conversation: null,
      peerProfile: normalizeProfileRecord(peerProfileRecord),
      messages: [],
    }
  }

  const { data: allMembers, error: allMembersError } = await supabase
    .from('conversation_members')
    .select('conversation_id, profile_id, last_read_at')
    .in('conversation_id', conversationIds)

  if (allMembersError) throw allMembersError

  const matchingConversationId = memberRows
    .map((row) => row.conversation_id)
    .find((candidateConversationId) => {
      const members = allMembers.filter((row) => row.conversation_id === candidateConversationId)
      return members.some((row) => row.profile_id === peerProfileId)
    })

  const peerProfileRecord = await fetchProfileRecord(peerProfileId)
  const peerProfile = normalizeProfileRecord(peerProfileRecord)

  if (!matchingConversationId) {
    return { conversation: null, peerProfile, messages: [] }
  }

  const { data: conversationRow, error: conversationError } = await supabase
    .from('conversations')
    .select('id, conversation_type, match_id, study_group_id, last_message_at, created_at')
    .eq('id', matchingConversationId)
    .maybeSingle()

  if (conversationError) throw conversationError

  const { data: messageRows, error: messageError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_profile_id, body, sent_at, edited_at, deleted_at, metadata')
    .eq('conversation_id', matchingConversationId)
    .order('sent_at', { ascending: true })

  if (messageError) throw messageError

  return {
    conversation: conversationRow,
    peerProfile,
    messages: messageRows || [],
  }
}

export async function sendConversationMessage(conversationId, senderProfileId, body, metadata = {}) {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_profile_id: senderProfileId,
      body,
      metadata
    })
    .select('id, conversation_id, sender_profile_id, body, sent_at, edited_at, deleted_at, metadata')
    .single()

  if (error) throw error
  return data
}

export async function markConversationRead(conversationId, profileId) {
  if (!isSupabaseConfigured || !conversationId || !profileId) return null

  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)

  if (error) throw error
  return true
}

// ─── SESSION FUNCTIONS ──────────────────────────────────────────────────────

export async function createSession(organizerProfileId, { matchId, subjectName, scheduledStart, durationMinutes, mode, meetingUrl, locationText, inviteeProfileId }) {
  if (!isSupabaseConfigured) return null

  // Find or create subject
  let subjectId = null
  if (subjectName) {
    const slug = subjectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: existingSub } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectName)
      .single()

    if (existingSub) {
      subjectId = existingSub.id
    } else {
      const { data: newSub } = await supabase
        .from('subjects')
        .insert({ slug: `${slug}-${Date.now()}`, name: subjectName, category: 'Custom' })
        .select('id')
        .single()
      if (newSub) subjectId = newSub.id
    }
  }

  const payload = {
    organizer_profile_id: organizerProfileId,
    match_id: matchId || null,
    subject_id: subjectId,
    title: subjectName || 'Study Session',
    study_mode: mode === 'offline' ? 'in_person' : 'online',
    scheduled_start: scheduledStart,
    duration_minutes: durationMinutes,
    meeting_url: mode !== 'offline' ? (meetingUrl || `https://meet.studymatch.app/${Date.now()}`) : null,
    location_text: mode === 'offline' ? locationText : null,
    status: 'scheduled',
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert(payload)
    .select('id')
    .single()

  if (sessionError) throw sessionError

  // Add organizer as host
  await supabase.from('session_participants').insert({
    session_id: session.id,
    profile_id: organizerProfileId,
    participant_role: 'host',
    attendance_status: 'accepted',
  })

  // Add invitee as invited (pending approval)
  if (inviteeProfileId) {
    await supabase.from('session_participants').insert({
      session_id: session.id,
      profile_id: inviteeProfileId,
      participant_role: 'participant',
      attendance_status: 'invited',
    })
  }

  return session
}

export async function fetchMySessions(profileId) {
  if (!isSupabaseConfigured || !profileId) return []

  const { data: participations, error: partError } = await supabase
    .from('session_participants')
    .select('session_id, participant_role, attendance_status')
    .eq('profile_id', profileId)

  if (partError) throw partError
  if (!participations?.length) return []

  const sessionIds = participations.map(p => p.session_id)

  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select(`
      id, title, study_mode, scheduled_start, duration_minutes,
      meeting_url, location_text, status, organizer_profile_id, notes,
      subjects ( name )
    `)
    .in('id', sessionIds)
    .order('scheduled_start', { ascending: true })

  if (sessError) throw sessError

  // For each session fetch participants + their profiles
  const enriched = await Promise.all((sessions || []).map(async (s) => {
    const { data: parts } = await supabase
      .from('session_participants')
      .select('profile_id, participant_role, attendance_status')
      .eq('session_id', s.id)

    const partnerParticipant = parts?.find(p => p.profile_id !== profileId)
    let partnerProfile = null

    if (partnerParticipant) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', partnerParticipant.profile_id)
        .single()
      partnerProfile = prof
    }

    const myParticipation = participations.find(p => p.session_id === s.id)

    return {
      id: s.id,
      title: s.title,
      subject: s.subjects?.name || s.title,
      mode: s.study_mode === 'in_person' ? 'offline' : 'online',
      scheduled_at: s.scheduled_start,
      duration_minutes: s.duration_minutes,
      meeting_url: s.meeting_url,
      location_text: s.location_text,
      status: s.status,
      isOrganizer: s.organizer_profile_id === profileId,
      myAttendanceStatus: myParticipation?.attendance_status || 'accepted',
      partner: partnerProfile,
      declineReason: s.status === 'cancelled' ? (s.notes || null) : null,
    }
  }))

  return enriched
}

export async function respondToSessionInvite(sessionId, profileId, accept, reason = '') {
  if (!isSupabaseConfigured) return null

  const { error } = await supabase
    .from('session_participants')
    .update({ attendance_status: accept ? 'accepted' : 'declined' })
    .eq('session_id', sessionId)
    .eq('profile_id', profileId)

  if (error) throw error

  // If declined, cancel the session and save the reason in notes
  if (!accept) {
    const updates = { status: 'cancelled' }
    if (reason) updates.notes = reason
    await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
  }

  return true
}

export async function markSessionComplete(sessionId, profileId) {
  if (!isSupabaseConfigured) return null

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  if (error) throw error

  await supabase
    .from('session_participants')
    .update({ attendance_status: 'attended' })
    .eq('session_id', sessionId)
    .eq('profile_id', profileId)

  return true
}
