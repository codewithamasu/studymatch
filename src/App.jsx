import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import OnboardingPage from '@/pages/OnboardingPage'
import DiscoverPage from '@/pages/DiscoverPage'
import SessionsPage from '@/pages/SessionsPage'
import DashboardPage from '@/pages/DashboardPage'
import ChatPage from '@/pages/ChatPage'
import ChatInboxPage from '@/pages/ChatInboxPage'
import JitsiMeetPage from '@/pages/JitsiMeetPage'
import ProfilePage from '@/pages/ProfilePage'

function ProtectedRoute({ children }) {
  const user = useAuthStore(state => state.user)
  const loading = useAuthStore(state => state.loading)
  const hasProfile = useAuthStore(state => state.hasProfile)
  const location = useLocation()
  
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!hasProfile() && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const user = useAuthStore(state => state.user)
  const loading = useAuthStore(state => state.loading)
  const hasProfile = useAuthStore(state => state.hasProfile)
  
  if (loading) return null
  if (user) return <Navigate to={hasProfile() ? '/dashboard' : '/onboarding'} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      <Route element={<Layout />}>
        <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
        <Route path="/matches" element={<Navigate to="/chat" replace />} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/sessions/new" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatInboxPage /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/meet/:roomId" element={<ProtectedRoute><JitsiMeetPage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const init = useAuthStore(state => state.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
