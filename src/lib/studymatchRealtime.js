import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { buildStudyProfileFromRecord, fetchProfileRecord } from '@/lib/profile'

function normalizeProfileRecord(record) {
  if (!record) return null

  const studyProfile = buildStudyProfileFromRecord(record)

  return {
    id: record.id,
    full_name: record.full_name,
    university: record.university_name || 'Student',
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

function toDayLabel(dateString) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(dateString))
}

function toDateKey(dateString) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildWeeklyData(sessions = []) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = toDateKey(date.toISOString())
    return {
      key,
      day: toDayLabel(date.toISOString()),
      hours: 0,
    }
  })

  const hourMap = new Map(days.map((entry) => [entry.key, entry]))

  sessions.forEach((session) => {
    if (session.status === 'cancelled') return
    if (!session.scheduled_start) return
    const key = toDateKey(session.scheduled_start)
    const entry = hourMap.get(key)
    if (!entry) return
    entry.hours += Number(session.duration_minutes || 0) / 60
  })

  return days.map((entry) => ({
    day: entry.day,
    hours: Number(entry.hours.toFixed(1)),
  }))
}

function computeStudyStreak(sessions = []) {
  const activeDays = new Set(
    sessions
      .filter((session) => session.status !== 'cancelled')
      .filter((session) => new Date(session.scheduled_start) <= new Date())
      .map((session) => toDateKey(session.scheduled_start))
  )

  let streak = 0
  const cursor = new Date()

  while (activeDays.has(toDateKey(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getFavoriteSubject(sessions = [], fallbackSubject) {
  const subjectCounts = sessions.reduce((acc, session) => {
    const subjectName = session.subject_name
    if (!subjectName) return acc
    acc.set(subjectName, (acc.get(subjectName) || 0) + 1)
    return acc
  }, new Map())

  const sortedSubjects = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])
  return sortedSubjects[0]?.[0] || fallbackSubject || 'None yet'
}

function formatDashboardSession(session, partnerId, partnerName) {
  return {
    id: session.id,
    subject: session.subject_name || session.title || 'Study Session',
    scheduled_at: session.scheduled_start,
    duration_minutes: session.duration_minutes,
    mode: session.study_mode === 'in_person' ? 'offline' : 'online',
    meeting_url: session.meeting_url || `study-session-${session.id}`,
    location: session.location || 'Kampus',
    status: session.status === 'scheduled' ? 'upcoming' : session.status,
    partner: {
      id: partnerId,
      full_name: partnerName || 'Study Partner',
    },
  }
}

export async function fetchSubjects() {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, slug, name, category')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching subjects:', err)
    return []
  }
}

export async function fetchMatchStats(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) {
    return { availableNow: 0, newToday: 0 }
  }

  try {
    const { count: availableCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('onboarding_completed_at', 'is', null)

    const { count: newCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      availableNow: Math.max(0, (availableCount || 0) - 1), // Exclude self
      newToday: newCount || 0,
    }
  } catch (err) {
    console.error('Error fetching match stats:', err)
    return { availableNow: 0, newToday: 0 }
  }
}

export async function fetchProfileGoals(profileId) {
  if (!isSupabaseConfigured || !profileId) return []
  try {
    const { data, error } = await supabase
      .from('profile_goals')
      .select(`
        study_goals (
          code,
          label,
          description
        )
      `)
      .eq('profile_id', profileId)

    if (error) throw error
    return (data || []).map(row => row.study_goals).filter(Boolean)
  } catch (err) {
    console.error('Error fetching profile goals:', err)
    return []
  }
}

export async function fetchMatchAlerts(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) return []

  try {
    const { data: matchRows, error } = await supabase
      .from('matches')
      .select(`
        id,
        matched_at,
        profile_a_id,
        profile_b_id
      `)
      .or(`profile_a_id.eq.${currentUserId},profile_b_id.eq.${currentUserId}`)
      .eq('status', 'active')
      .order('matched_at', { ascending: false })
      .limit(8)

    if (error) throw error

    const partnerIds = (matchRows || []).map((row) =>
      row.profile_a_id === currentUserId ? row.profile_b_id : row.profile_a_id
    )

    const profiles = await Promise.all(
      partnerIds.map(async (id) => {
        const record = await fetchProfileRecord(id)
        return record ? normalizeProfileRecord(record) : null
      })
    )

    return (matchRows || []).map((row, i) => ({
      matchId: row.id,
      matchedAt: row.matched_at,
      partner: profiles[i],
    })).filter((item) => item.partner !== null)
  } catch (err) {
    console.error('Error fetching match alerts:', err)
    return []
  }
}

export async function fetchSocialPulse(currentUserId, limit = 6) {
  if (!isSupabaseConfigured || !currentUserId) return []

  try {
    const { data: matchRows, error: matchErr } = await supabase
      .from('matches')
      .select('id, profile_a_id, profile_b_id')
      .or(`profile_a_id.eq.${currentUserId},profile_b_id.eq.${currentUserId}`)
      .eq('status', 'active')

    if (matchErr || !matchRows?.length) return []

    const conversationIds = []
    for (const match of matchRows) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', match.id)
        .single()
      if (convError) {
        console.warn(`Error fetching conversation for match ${match.id}:`, convError)
        continue // Skip this match but continue with others
      }
      if (conv?.id) conversationIds.push(conv.id)
    }

    if (!conversationIds.length) return []

    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id, body, sent_at, sender_profile_id, conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_profile_id', currentUserId)
      .is('deleted_at', null)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (msgErr || !messages?.length) return []

    const senderIds = [...new Set(messages.map((m) => m.sender_profile_id))]
    const senderProfiles = await Promise.all(
      senderIds.map(async (id) => {
        const rec = await fetchProfileRecord(id)
        return rec ? normalizeProfileRecord(rec) : null
      })
    )
    const profileMap = new Map(
      senderProfiles.filter(Boolean).map((p) => [p.id, p])
    )

    return messages.map((msg) => {
      const sender = profileMap.get(msg.sender_profile_id)
      const bodyPreview = (msg.body || '').slice(0, 50)
      const ago = formatRelativeTime(msg.sent_at)
      return {
        id: msg.id,
        senderId: msg.sender_profile_id,
        senderName: sender?.full_name || 'Partner',
        avatarSeed: sender?.full_name || 'user',
        action: `sent a message: "${bodyPreview}${msg.body?.length > 50 ? '…' : ''}"`,
        time: ago,
        badge: '💬',
      }
    })
  } catch (err) {
    console.error('Error fetching social pulse:', err)
    return []
  }
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const XP_PER_HOUR = 40
export const XP_PER_SESSION = 60

export const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 4500, 6500, 9000, 12000, 16000]
export const TIER_NAMES = [
  'Curious Mind', 'Deep Diver', 'Study Spark', 'Knowledge Seeker',
  'Focus Champion', 'Code Wizard', 'Algorithm Ace', 'Data Master',
  'Research Guru', 'Academic Legend', 'Study God',
]
export const TIER_ICONS = ['🌱', '🔍', '⚡', '📚', '🏆', '🧙', '⚙️', '📊', '🔬', '🎓', '👑']

export function calculateXp(stats) {
  return (stats.total_study_hours || 0) * XP_PER_HOUR +
    (stats.completed_sessions || 0) * XP_PER_SESSION
}

export function getLevel(xp) {
  let level = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i
    else break
  }
  return Math.min(level, LEVEL_THRESHOLDS.length - 1)
}

export async function fetchCampusLeaders(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) return []

  try {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', currentUserId)
      .not('onboarding_completed_at', 'is', null)
      .limit(10)

    if (profileErr) return []

    const profileIds = profiles.map(p => p.id)
    const { data: sessRows, error: sessErr } = await supabase
      .from('session_participants')
      .select(`
        profile_id,
        sessions!inner(status, duration_minutes)
      `)
      .in('profile_id', profileIds)
      .eq('sessions.status', 'completed')

    if (sessErr) return []

    const statsByProfile = {}
    profileIds.forEach(id => {
      statsByProfile[id] = { completed_sessions: 0, total_study_hours: 0 }
    })

    sessRows.forEach(row => {
      const s = row.sessions
      const pid = row.profile_id
      if (statsByProfile[pid]) {
        statsByProfile[pid].completed_sessions += 1
        statsByProfile[pid].total_study_hours += (s.duration_minutes || 0) / 60
      }
    })

    return profiles.map((p) => {
      const stats = statsByProfile[p.id]
      const xp = calculateXp(stats)
      const level = getLevel(xp)
      return {
        id: p.id,
        name: p.full_name,
        xp: xp,
        badge: TIER_ICONS[level] || '🏃',
        tier: TIER_NAMES[level],
      }
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 3)
  } catch (err) {
    console.error('Error fetching campus leaders:', err)
    return []
  }
}

export async function fetchDiscoverCandidates(currentUserId, filters = {}) {
  if (!isSupabaseConfigured || !currentUserId) return []

  const { targetSubject, studyMode } = filters

  const [
    { data: swipeRows, error: swipeError },
    { data: matchRows, error: matchError }
  ] = await Promise.all([
    supabase.from('swipes').select('target_profile_id').eq('actor_profile_id', currentUserId),
    supabase.from('matches').select('profile_a_id, profile_b_id').or(`profile_a_id.eq.${currentUserId},profile_b_id.eq.${currentUserId}`)
  ])

  if (swipeError) throw swipeError
  if (matchError) throw matchError

  const excludedIds = new Set((swipeRows || []).map((row) => row.target_profile_id))
  for (const row of matchRows || []) {
    if (row.profile_a_id !== currentUserId) excludedIds.add(row.profile_a_id)
    if (row.profile_b_id !== currentUserId) excludedIds.add(row.profile_b_id)
  }
  excludedIds.add(currentUserId)

  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      university_name,
      bio,
      avatar_url,
      onboarding_completed_at,
      preferred_study_mode,
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
    .not('onboarding_completed_at', 'is', null)
    .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
    .limit(50)

  if (targetSubject) {
    query = query.eq('profile_subjects.subjects.name', targetSubject)
  }

  if (studyMode && studyMode !== 'hybrid') {
    const dbMode = studyMode === 'in-person' ? 'in_person' : studyMode
    query = query.or(`preferred_study_mode.eq.${dbMode},preferred_study_mode.eq.hybrid`)
  }

  const { data: profileRows, error: profileError } = await query

  if (profileError) {
    console.error('Error in fetchDiscoverCandidates query:', profileError)
    throw profileError
  }

  return (profileRows || [])
    .map(normalizeProfileRecord)
    .filter((candidate) => candidate?.study_profile)
}

export async function clearSwipes(actorProfileId) {
  if (!isSupabaseConfigured || !actorProfileId) return null
  const { error } = await supabase
    .from('swipes')
    .delete()
    .eq('actor_profile_id', actorProfileId)

  if (error) throw error
  return true
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

export async function sendConversationMessage(conversationId, senderProfileId, body) {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_profile_id: senderProfileId,
      body,
    })
    .select('id, conversation_id, sender_profile_id, body, sent_at, edited_at, deleted_at, metadata')
    .single()

  if (error) throw error
  return data
}

export async function fetchPartnerStats(currentUserId, partnerProfileId) {
  if (!isSupabaseConfigured || !currentUserId || !partnerProfileId) {
    return { sessions: 0, studiedHours: 0 }
  }

  const { data: myParticipations } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('profile_id', currentUserId)

  const mySessionIds = (myParticipations || []).map((r) => r.session_id)
  if (!mySessionIds.length) return { sessions: 0, studiedHours: 0 }

  const { data: partnerParticipations } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('profile_id', partnerProfileId)
    .in('session_id', mySessionIds)

  const sharedSessionIds = (partnerParticipations || []).map((r) => r.session_id)
  if (!sharedSessionIds.length) return { sessions: 0, studiedHours: 0 }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, status, duration_minutes, scheduled_start')
    .in('id', sharedSessionIds)
    .neq('status', 'cancelled')

  const completed = (sessions || []).filter((s) => s.status === 'completed')
  const studiedMinutes = completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  return {
    sessions: completed.length,
    studiedHours: Number((studiedMinutes / 60).toFixed(2)),
  }
}

export async function fetchMatchInfo(currentUserId, partnerProfileId) {
  if (!isSupabaseConfigured || !currentUserId || !partnerProfileId) return null

  const { data } = await supabase
    .from('matches')
    .select('id, matched_at, status')
    .or(
      `and(profile_a_id.eq.${currentUserId},profile_b_id.eq.${partnerProfileId}),` +
      `and(profile_a_id.eq.${partnerProfileId},profile_b_id.eq.${currentUserId})`
    )
    .eq('status', 'active')
    .maybeSingle()

  return data || null
}

export function subscribeToConversations(userId, conversationIds, onNewMessage) {
  if (!isSupabaseConfigured || !userId || !conversationIds.length) {
    return { unsubscribe: () => {} }
  }

  const channel = supabase
    .channel(`inbox:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const msg = payload.new
        if (msg && conversationIds.includes(msg.conversation_id)) {
          onNewMessage(msg)
        }
      }
    )
    .subscribe()

  return { unsubscribe: () => supabase.removeChannel(channel) }
}

export function subscribeToMessages(conversationId, onMessage) {
  if (!isSupabaseConfigured || !conversationId) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (onMessage) onMessage(payload.new)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
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

export async function fetchUserSessions(currentUserId) {
  if (!isSupabaseConfigured || !currentUserId) return []

  const { data: participantRows, error: participantError } = await supabase
    .from('session_participants')
    .select(`
      session_id,
      attendance_status,
      sessions!inner(
        id,
        organizer_profile_id,
        status,
        study_mode,
        scheduled_start,
        duration_minutes,
        title,
        match_id,
        subject_id,
        subjects(name),
        location
      )
    `)
    .eq('profile_id', currentUserId)
    .neq('attendance_status', 'declined')

  if (participantError) throw participantError

  const sessions = (participantRows || [])
    .map((row) => ({
      ...row.sessions,
      subject_name: row.sessions?.subjects?.name || null,
    }))
    .filter(Boolean)

  const sessionIds = sessions.map((session) => session.id)

  let participantDetails = []
  if (sessionIds.length) {
    const { data, error } = await supabase
      .from('session_participants')
      .select('session_id, profile_id, participant_role')
      .in('session_id', sessionIds)

    if (error) throw error
    participantDetails = data || []
  }

  const partnerIdsSet = new Set()

  participantDetails.forEach((row) => {
    if (row.profile_id !== currentUserId) {
      partnerIdsSet.add(row.profile_id)
    }
  })

  sessions.forEach((session) => {
    if (session.organizer_profile_id && session.organizer_profile_id !== currentUserId) {
      partnerIdsSet.add(session.organizer_profile_id)
    }
  })

  const partnerIds = [...partnerIdsSet]

  const partnerProfiles = await Promise.all(
    partnerIds.map(async (profileId) => {
      const record = await fetchProfileRecord(profileId)
      return record ? normalizeProfileRecord(record) : null
    })
  )

  const partnerById = new Map(
    partnerProfiles.filter(Boolean).map((profile) => [profile.id, profile])
  )

  const partnerBySessionId = new Map()
  
  sessions.forEach((session) => {
    let pid = null
    if (session.organizer_profile_id && session.organizer_profile_id !== currentUserId) {
      pid = session.organizer_profile_id
    } else {
      const row = participantDetails.find((r) => r.session_id === session.id && r.profile_id !== currentUserId)
      if (row) pid = row.profile_id
    }

    if (pid && partnerById.has(pid)) {
      partnerBySessionId.set(session.id, partnerById.get(pid))
    }
  })

  return sessions.map((session) => {
    const partner = partnerBySessionId.get(session.id)
    const baseFormatted = formatDashboardSession(session, partner?.id, partner?.full_name)
    return {
      ...baseFormatted,
      partner: partner || baseFormatted.partner, // Use full partner if exists, else fallback from format
    }
  })
}

export async function createNewSession(currentUserId, sessionData) {
  if (!isSupabaseConfigured) return null

  let subjectId = null
  let matchId = null

  const [subjectResult, matchResult] = await Promise.all([
    sessionData.subject ? supabase
      .from('subjects')
      .select('id')
      .eq('name', sessionData.subject)
      .maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from('matches')
      .select('id')
      .eq('status', 'active')
      .or(`and(profile_a_id.eq.${currentUserId},profile_b_id.eq.${sessionData.partnerId}),and(profile_a_id.eq.${sessionData.partnerId},profile_b_id.eq.${currentUserId})`)
      .maybeSingle()
  ])

  if (subjectResult.data) subjectId = subjectResult.data.id
  if (matchResult.data) matchId = matchResult.data.id

  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({
      organizer_profile_id: currentUserId,
      title: sessionData.subject || 'Study Session',
      match_id: matchId,
      subject_id: subjectId,
      scheduled_start: sessionData.scheduled_at,
      duration_minutes: sessionData.duration_minutes,
      study_mode: sessionData.mode === 'online' ? 'online' : 'in_person',
      meeting_url: sessionData.meeting_url,
      location: sessionData.mode === 'offline' ? sessionData.location : null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (sessErr) throw sessErr

  const participants = [
    {
      session_id: session.id,
      profile_id: currentUserId,
      participant_role: 'host',
      attendance_status: 'accepted',
    },
    {
      session_id: session.id,
      profile_id: sessionData.partnerId,
      participant_role: 'participant',
      attendance_status: 'invited',
    },
  ]

  const { error: partErr } = await supabase
    .from('session_participants')
    .insert(participants)

  if (partErr) throw partErr

  return session
}

export async function updateSessionStatus(sessionId, status) {
  if (!isSupabaseConfigured) return null

  if (!sessionId) throw new Error('ID Sesi tidak valid')

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: status === 'completed' ? 'completed' : status })
    .eq('id', sessionId)
    .select()

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Tertolak oleh Supabase. Hal ini bisa terjadi jika sesi tersebut dihapus, ID tidak valid, atau akunmu bukanlah pembuat/organizer dari sesi ini.')
  }
  return data[0]
}

export async function fetchDashboardSnapshot(currentUserId) {
  const emptySnapshot = {
    stats: {
      total_sessions: 0,
      completed_sessions: 0,
      total_study_hours: 0,
      study_streak: 0,
      favorite_subject: 'None yet',
      weekly_data: buildWeeklyData([]),
    },
    studyPartnerCount: 0,
    upcomingSessions: [],
  }

  if (!isSupabaseConfigured || !currentUserId) return emptySnapshot

  const [
    { data: matchRows, error: matchError },
    sessions,
    profileRecord,
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('id')
      .eq('status', 'active')
      .or(`profile_a_id.eq.${currentUserId},profile_b_id.eq.${currentUserId}`),
    fetchUserSessions(currentUserId),
    fetchProfileRecord(currentUserId),
  ])

  if (matchError) throw matchError

  const upcomingSessions = sessions
    .filter((session) => session.status === 'upcoming')
    .filter((session) => new Date(session.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 2)

  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const totalStudyHours = completedSessions.reduce(
    (sum, session) => sum + Number(session.duration_minutes || 0) / 60,
    0
  )
  const fallbackSubject = profileRecord?.profile_subjects?.[0]?.subjects?.name || null

  return {
    stats: {
      total_sessions: sessions.length,
      completed_sessions: completedSessions.length,
      total_study_hours: Number(totalStudyHours.toFixed(2)),
      study_streak: computeStudyStreak(sessions.map(s => ({ ...s, scheduled_start: s.scheduled_at }))),
      favorite_subject: getFavoriteSubject(sessions.map(s => ({ ...s, subject_name: s.subject })), fallbackSubject),
      weekly_data: buildWeeklyData(sessions.map(s => ({ ...s, scheduled_start: s.scheduled_at }))),
    },
    studyPartnerCount: matchRows?.length || 0,
    upcomingSessions,
  }
}
