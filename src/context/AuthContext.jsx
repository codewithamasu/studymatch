/* eslint-disable react-refresh/only-export-components */
import { useAuthStore } from '@/store/useAuthStore'

export function AuthProvider({ children }) {
  return children
}

export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    loading: state.loading,
    signUp: state.signUp,
    signIn: state.signIn,
    signOut: state.signOut,
    updateProfile: state.updateProfile,
    hasProfile: state.hasProfile,
    signInWithGoogle: state.signInWithGoogle,
    signInAnonymously: state.signInAnonymously,
    init: state.init,
  }))
}
