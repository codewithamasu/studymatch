import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchDashboardSnapshot,
  fetchMatchAlerts,
  fetchSocialPulse,
  fetchCampusLeaders,
} from '@/lib/studymatchRealtime'

let realtimeChannel = null

export const useDashboardStore = create(
  devtools((set, get) => ({
    stats: {
      total_sessions: 0,
      completed_sessions: 0,
      total_study_hours: 0,
      study_streak: 0,
      favorite_subject: 'None yet',
      weekly_data: [],
    },
    studyPartnerCount: 0,
    upcomingSessions: [],
    matchAlerts: [],
    socialPulse: [],
    campusLeaders: [],
    loading: true,
    error: null,
    lastFetchedUserId: null,


    loadDashboard: async (userId) => {
      if (!userId) {
        set({ loading: false })
        return
      }

      if (get().lastFetchedUserId === userId && !get().loading) return

      set({ loading: true, error: null })

      try {
        const [snapshot, alerts, pulse, leaders] = await Promise.all([
          fetchDashboardSnapshot(userId),
          fetchMatchAlerts(userId),
          fetchSocialPulse(userId),
          fetchCampusLeaders(userId),
        ])

        set({
          stats: snapshot.stats,
          studyPartnerCount: snapshot.studyPartnerCount,
          upcomingSessions: snapshot.upcomingSessions,
          matchAlerts: alerts,
          socialPulse: pulse,
          campusLeaders: leaders,
          loading: false,
          error: null,
          lastFetchedUserId: userId,
        })
      } catch (err) {
        set({
          loading: false,
          error: err?.message || 'Failed to load dashboard. Please refresh the page.',
        })
      }
    },

    refreshSessions: async (userId) => {
      if (!userId || !isSupabaseConfigured) return
      try {
        const snapshot = await fetchDashboardSnapshot(userId)
        set({
          stats: snapshot.stats,
          studyPartnerCount: snapshot.studyPartnerCount,
          upcomingSessions: snapshot.upcomingSessions,
        })
      } catch {
      }
    },

    refreshMatchAlerts: async (userId) => {
      if (!userId || !isSupabaseConfigured) return
      try {
        const alerts = await fetchMatchAlerts(userId)
        set({ matchAlerts: alerts })
      } catch {
      }
    },

    prependPulseItem: (item) =>
      set((state) => ({
        socialPulse: [item, ...state.socialPulse].slice(0, 6),
      })),

    subscribeRealtime: (userId) => {
      if (!isSupabaseConfigured || !userId) return

      if (realtimeChannel) return

      realtimeChannel = supabase
        .channel(`dashboard:${userId}`)

        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `profile_a_id=eq.${userId}`,
          },
          () => get().refreshMatchAlerts(userId)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `profile_b_id=eq.${userId}`,
          },
          () => get().refreshMatchAlerts(userId)
        )

        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `profile_id=eq.${userId}`,
          },
          () => get().refreshSessions(userId)
        )

        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const msg = payload.new
            if (!msg || msg.sender_profile_id === userId) return
            const { data: membership } = await supabase
              .from('conversation_members')
              .select('conversation_id')
              .eq('conversation_id', msg.conversation_id)
              .eq('profile_id', userId)
              .single()

            if (!membership) return

            get().prependPulseItem({
              id: msg.id,
              senderId: msg.sender_profile_id,
              senderName: 'Partner',
              avatarSeed: msg.sender_profile_id,
              action: `sent a message: "${(msg.body || '').slice(0, 50)}${msg.body?.length > 50 ? '…' : ''}"`,
              time: 'Just now',
              badge: '💬',
            })
          }
        )

        .subscribe()
    },

    unsubscribeRealtime: () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
      }
    },

    reset: () => {
      get().unsubscribeRealtime()
      set({
        stats: {
          total_sessions: 0, completed_sessions: 0,
          total_study_hours: 0, study_streak: 0,
          favorite_subject: 'None yet', weekly_data: [],
        },
        studyPartnerCount: 0,
        upcomingSessions: [],
        matchAlerts: [],
        socialPulse: [],
        campusLeaders: [],
        loading: true,
        error: null,
        lastFetchedUserId: null,
      })
    },
  }))
)
