/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

function getDisplayName(authUser) {
  const metadata = authUser?.user_metadata ?? {}
  return metadata.full_name || metadata.name || authUser?.email?.split('@')[0] || 'Student'
}

function normalizeUser(authUser) {
  if (!authUser) return null

  const metadata = authUser.user_metadata ?? {}

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

function getConfigError() {
  return {
    message: 'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY terlebih dahulu.',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let mounted = true

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setUser(null)
      } else {
        setUser(normalizeUser(data.session?.user ?? null))
      }

      setLoading(false)
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(normalizeUser(session?.user ?? null))
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ fullName, email, password, university }) => {
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
          university: university?.trim() || 'Mahasiswa',
        },
      },
    })

    if (error) {
      return { user: null, error, needsEmailConfirmation: false }
    }

    const normalizedUser = normalizeUser(data.user)
    if (data.session?.user) {
      setUser(normalizeUser(data.session.user))
    }

    return {
      user: normalizedUser,
      error: null,
      needsEmailConfirmation: !data.session,
    }
  }

  const signIn = async ({ email, password }) => {
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

    const normalizedUser = normalizeUser(data.user)
    setUser(normalizedUser)

    return { user: normalizedUser, error: null }
  }

  const signInWithGoogle = async () => {
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
  }

  const signInAnonymously = async () => {
    if (!isSupabaseConfigured) {
      return { user: null, error: getConfigError() }
    }

    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
      return { user: null, error }
    }

    const normalizedUser = normalizeUser(data.user)
    setUser(normalizedUser)

    return { user: normalizedUser, error: null }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
    }

    return { error }
  }

  const updateProfile = async (profileData) => {
    if (!isSupabaseConfigured || !supabase.auth.getUser) {
      setUser(prev => (
        prev
          ? { ...prev, study_profile: profileData, has_profile: true }
          : prev
      ))
      return { error: null }
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return { error: { message: 'Sesi tidak ditemukan. Silakan login ulang.' } }
    }

    const metadata = authUser.user_metadata ?? {}
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        study_profile: profileData,
        has_profile: true,
      },
    })

    if (error) {
      return { error }
    }

    const normalizedUser = normalizeUser(data.user)
    setUser(normalizedUser)
    return { error: null, user: normalizedUser }
  }

  const hasProfile = useMemo(
    () => () => Boolean(user?.has_profile || user?.study_profile),
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signInAnonymously,
        signOut,
        updateProfile,
        hasProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
