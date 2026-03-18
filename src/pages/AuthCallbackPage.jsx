import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthCallbackPage() {
  const user = useAuthStore(state => state.user)
  const loading = useAuthStore(state => state.loading)
  const hasProfile = useAuthStore(state => state.hasProfile)
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    navigate(hasProfile() ? '/dashboard' : '/onboarding', { replace: true })
  }, [hasProfile, loading, navigate, user])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 text-slate-700">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#136DEC]/10 text-[#136DEC]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">Finishing your sign in</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            We&apos;re securing your session and preparing your StudyMatch account.
          </p>
        </div>
      </div>
    </div>
  )
}
