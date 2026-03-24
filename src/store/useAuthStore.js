import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { hydrateAppUser, saveStudyProfile } from '@/lib/profile'

let authSubscription = null

function getConfigError() {
  return {
    message: 'Supabase is not configured. Please fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.',
  }
}

export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        loading: isSupabaseConfigured,
        isSupabaseConfigured,
        initialized: false,

        setUser: (user) => set({ user, loading: false }),
        setLoading: (loading) => set({ loading }),

        refreshUser: async (authUser) => {
          if (!authUser) {
            set({ user: null, loading: false })
            return null
          }

          try {
            const hydratedUser = await hydrateAppUser(authUser)
            set({ user: hydratedUser, loading: false })
            return hydratedUser
          } catch {
            set({ user: null, loading: false })
            return null
          }
        },

        init: async () => {
          if (get().initialized) return

          if (!isSupabaseConfigured) {
            set({ loading: false, initialized: true })
            return
          }

          set({ loading: true })

          try {
            const { data, error } = await supabase.auth.getSession()

            if (error) {
              set({ user: null, loading: false, initialized: true })
            } else {
              const hydratedUser = await hydrateAppUser(data.session?.user ?? null)
              set({ user: hydratedUser, loading: false, initialized: true })
            }
          } catch {
            set({ user: null, loading: false, initialized: true })
          }

          if (!authSubscription) {
            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, session) => {
              get().refreshUser(session?.user ?? null)
            })

            authSubscription = subscription
          }
        },

        signUp: async ({ fullName, email, password, university }) => {
          if (!isSupabaseConfigured) {
            return { user: null, error: getConfigError(), needsEmailConfirmation: false }
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
              data: {
                full_name: fullName.trim(),
                university: university?.trim() || 'Student',
              },
            },
          })

          if (error) {
            return { user: null, error, needsEmailConfirmation: false }
          }

          if (data.session?.user) {
            const hydratedUser = await get().refreshUser(data.session.user)

            return {
              user: hydratedUser,
              error: null,
              needsEmailConfirmation: false,
            }
          }

          return {
            user: null,
            error: null,
            needsEmailConfirmation: !data.session,
          }
        },

        signIn: async ({ email, password }) => {
          if (!isSupabaseConfigured) {
            return { user: null, error: getConfigError() }
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            return { user: null, error }
          }

          const hydratedUser = await get().refreshUser(data.user)
          return { user: hydratedUser, error: null }
        },

        signInWithGoogle: async () => {
          if (!isSupabaseConfigured) {
            return { error: getConfigError() }
          }

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
              },
            },
          })

          return { error: error ?? null }
        },

        signInAnonymously: async () => {
          if (!isSupabaseConfigured) {
            return { user: null, error: getConfigError() }
          }

          const { data, error } = await supabase.auth.signInAnonymously()

          if (error) {
            return { user: null, error }
          }

          const hydratedUser = await get().refreshUser(data.user)
          return { user: hydratedUser, error: null }
        },

        signOut: async () => {
          if (!isSupabaseConfigured) {
            set({ user: null })
            return { error: null }
          }

          const { error } = await supabase.auth.signOut()
          if (!error) {
            set({ user: null })
          }
          return { error }
        },

        updateProfile: async (profileData) => {
          if (!isSupabaseConfigured || !supabase.auth.getUser) {
            set((state) => ({
              user: state.user
                ? { ...state.user, study_profile: profileData, has_profile: true }
                : null,
            }))
            return { error: null }
          }

          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()

          if (!authUser) {
            return { error: { message: 'Session not found. Please log in again.' } }
          }

          try {
            const currentStudyProfile = get().user?.study_profile || {}

            const fullProfileData = {
              ...currentStudyProfile,
              ...profileData,
              full_name: profileData.full_name || get().user?.full_name,
              university_name: profileData.university || profileData.university_name || get().user?.university,
              bio: profileData.bio || get().user?.bio,
            }

            await saveStudyProfile(authUser.id, fullProfileData)
            const hydratedUser = await get().refreshUser(authUser)
            return { error: null, user: hydratedUser }
          } catch (error) {
            return { error }
          }
        },

        hasProfile: () => {
          const user = get().user
          return Boolean(user?.has_profile || user?.study_profile)
        },
      }),
      {
        name: 'studymatch-auth',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
)
