import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import OnboardingPage from '@/pages/OnboardingPage'
import DiscoverPage from '@/pages/DiscoverPage'
import MatchesPage from '@/pages/MatchesPage'
import SessionsPage from '@/pages/SessionsPage'
import DashboardPage from '@/pages/DashboardPage'
import ChatPage from '@/pages/ChatPage'
import ChatInboxPage from '@/pages/ChatInboxPage'
import JitsiMeetPage from '@/pages/JitsiMeetPage'

function ProtectedRoute({ children }) {
  const { user, loading, hasProfile } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!hasProfile() && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { user, loading, hasProfile } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={hasProfile() ? '/dashboard' : '/onboarding'} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with standalone layout */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected Routes without global Layout */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      <Route element={<Layout />}>
        {/* Protected */}
        <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/sessions/new" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatInboxPage /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/meet/:roomId" element={<ProtectedRoute><JitsiMeetPage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
