import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchDashboardSnapshot,
  fetchMatchAlerts,
  fetchSocialPulse,
} from '@/lib/studymatchRealtime'

let realtimeChannel = null

export const useDashboardStore = create(
  devtools((set, get) => ({
    // ── State ─────────────────────────────────────────────────────────────────
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
    loading: true,
    error: null,
    lastFetchedUserId: null,

    // ── Actions ───────────────────────────────────────────────────────────────

    /** Load all dashboard data in parallel */
    loadDashboard: async (userId) => {
      if (!userId) {
        set({ loading: false })
        return
      }

      // Avoid re-fetching if already loaded for this user
      if (get().lastFetchedUserId === userId && !get().loading) return

      set({ loading: true, error: null })

      try {
        const [snapshot, alerts, pulse] = await Promise.all([
          fetchDashboardSnapshot(userId),
          fetchMatchAlerts(userId),
          fetchSocialPulse(userId),
        ])

        set({
          stats: snapshot.stats,
          studyPartnerCount: snapshot.studyPartnerCount,
          upcomingSessions: snapshot.upcomingSessions,
          matchAlerts: alerts,
          socialPulse: pulse,
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

    /** Refresh only the sessions list (called when real-time triggers) */
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
        // Silently fail on background refresh
      }
    },

    /** Refresh only match alerts (called when real-time triggers) */
    refreshMatchAlerts: async (userId) => {
      if (!userId || !isSupabaseConfigured) return
      try {
        const alerts = await fetchMatchAlerts(userId)
        set({ matchAlerts: alerts })
      } catch {
        // Silently fail on background refresh
      }
    },

    /** Prepend a new message to Social Pulse feed */
    prependPulseItem: (item) =>
      set((state) => ({
        socialPulse: [item, ...state.socialPulse].slice(0, 6),
      })),

    /** Subscribe to Supabase Realtime for sessions and messages */
    subscribeRealtime: (userId) => {
      if (!isSupabaseConfigured || !userId) return

      // Only one channel at a time
      if (realtimeChannel) return

      realtimeChannel = supabase
        .channel(`dashboard:${userId}`)

        // New match → refresh match alerts
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

        // New or updated session → refresh sessions + stats
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

        // New message from a partner → append to Social Pulse
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
            // Only track messages in conversations the user belongs to
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

    /** Unsubscribe from Realtime and reset channel ref */
    unsubscribeRealtime: () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
      }
    },

    /** Full reset — called on logout */
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
        loading: true,
        error: null,
        lastFetchedUserId: null,
      })
    },
  }))
)
