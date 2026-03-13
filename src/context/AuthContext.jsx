import { createContext, useContext, useState, useEffect } from 'react'
import { mockCurrentUser } from '@/data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth state
    const stored = localStorage.getItem('studymatch_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const signUp = async ({ fullName, email, university, password }) => {
    // Mock sign up — will be replaced with Supabase
    const newUser = {
      ...mockCurrentUser,
      id: crypto.randomUUID(),
      full_name: fullName,
      email,
      university,
    }
    setUser(newUser)
    localStorage.setItem('studymatch_user', JSON.stringify(newUser))
    return { user: newUser, error: null }
  }

  const signIn = async ({ email, password }) => {
    // Mock sign in
    const mockUser = {
      ...mockCurrentUser,
      email,
    }
    setUser(mockUser)
    localStorage.setItem('studymatch_user', JSON.stringify(mockUser))
    return { user: mockUser, error: null }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('studymatch_user')
    localStorage.removeItem('studymatch_profile')
  }

  const updateProfile = (profileData) => {
    const updatedUser = { ...user, study_profile: profileData }
    setUser(updatedUser)
    localStorage.setItem('studymatch_user', JSON.stringify(updatedUser))
    localStorage.setItem('studymatch_profile', 'true')
  }

  const hasProfile = () => {
    return localStorage.getItem('studymatch_profile') === 'true'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile, hasProfile }}>
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
