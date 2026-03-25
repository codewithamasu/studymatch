import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { DISPLAY_FONT } from '@/lib/constants'



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
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] px-6 text-slate-700">
      <div className="w-full max-w-[29rem] rounded-[32px] bg-[#FBFAF7]/96 px-8 py-10 text-center shadow-[0_24px_80px_rgba(18,26,38,0.04)] ring-1 ring-[#ECE6DB] sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#EDF3FF] text-[#145FCB] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div className="mt-7 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A8594]">
            Almost there
          </p>
          <h1
            className="text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.045em] text-[#171717] sm:text-[2.65rem]"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Finishing your sign in
          </h1>
          <p className="mx-auto max-w-[24rem] text-[0.98rem] leading-7 text-[#6C7280]">
            We&apos;re securing your session, restoring your profile, and preparing the next step in StudyMatch.
          </p>
        </div>
      </div>
    </div>
  )
}
