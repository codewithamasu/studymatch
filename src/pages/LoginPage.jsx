import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import navbarLogo from '../assets/navbar-logo.svg';
import gsap from 'gsap'
import { useAuthStore } from '@/store/useAuthStore'
import { formatAuthError } from '@/lib/auth'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'



export default function LoginPage() {
  const signIn = useAuthStore(state => state.signIn)
  const signInAnonymously = useAuthStore(state => state.signInAnonymously)
  const signInWithGoogle = useAuthStore(state => state.signInWithGoogle)
  const navigate = useNavigate()

  const pageRef = useRef(null)
  const leftContentRef = useRef(null)
  const rightContentRef = useRef(null)

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [anonLoading, setAnonLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [leftContentRef.current, rightContentRef.current],
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.82, stagger: 0.14, ease: 'power3.out' }
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (message) setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    const { user, error } = await signIn(form)
    setSubmitting(false)

    if (error) {
      setMessage(formatAuthError(error))
      return
    }

    navigate(user?.has_profile ? '/dashboard' : '/onboarding')
  }

  const handleAnonSignIn = async () => {
    setAnonLoading(true)
    setMessage('')

    const { error } = await signInAnonymously()

    if (error) {
       setAnonLoading(false)
       setMessage(formatAuthError(error))
       return
    }

    navigate('/onboarding')
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setMessage('')

    const { error } = await signInWithGoogle()

    if (error) {
      setGoogleLoading(false)
      setMessage(formatAuthError(error))
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign In - StudyMatch</title>
        <meta name="description" content="Sign in to your StudyMatch account." />
      </Helmet>
      <div
        ref={pageRef}
        className="min-h-screen bg-[#F7F6F3] px-4 py-20 sm:px-6 sm:py-14 lg:px-8"
      >

      <div className="absolute top-6 left-6 lg:hidden">
        <Link to="/" className="flex items-center group outline-none rounded">
          <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
        </Link>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,440px)] lg:gap-16 xl:gap-24">

        <section ref={leftContentRef} className="hidden lg:flex flex-col justify-center opacity-0">
          <Link to="/" className="mb-14 inline-flex w-fit items-center rounded outline-none group">
            <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
          </Link>

          <div className="max-w-[32rem] space-y-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B7B8D]">
              Return to your study rhythm
            </p>
            <h1
              className="text-[clamp(3rem,5vw,4.8rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#171717]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Step back into the work that matters.
            </h1>
            <p className="max-w-[29rem] text-[1.02rem] leading-8 text-[#667085]">
              Review your next session, catch up on conversations, and keep momentum with the partners who match your pace.
            </p>
          </div>

          <div className="mt-14 grid max-w-[33rem] gap-8 border-t border-[#E7E1D6] pt-12">
            <div className="flex gap-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EDF2F7] text-[#68809A] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <span className="material-symbols-outlined text-[20px]">person_check</span>
              </div>
              <div>
                <p
                  className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] text-[#171717]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Focused study partners
                </p>
                <p className="mt-2 text-[0.96rem] leading-7 text-[#6C7280]">
                  Reopen conversations with people matched to your subject, schedule, and learning style.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EEF5F1] text-[#6A8A7A] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <div>
                <p
                  className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] text-[#171717]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  A calmer way back in
                </p>
                <p className="mt-2 text-[0.96rem] leading-7 text-[#6C7280]">
                  Sign in quickly, pick up your schedule, and move straight into the next session without friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={rightContentRef}
          className="mx-auto mt-8 w-full max-w-[440px] opacity-0 lg:mt-0"
        >
          <div className="rounded-[30px] bg-[#FBFAF7]/96 px-6 py-7 shadow-[0_24px_80px_rgba(18,26,38,0.04)] ring-1 ring-[#ECE6DB] sm:px-8 sm:py-9">

          <div className="mb-10 space-y-3 text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A8594]">
              Sign in
            </p>
            <h2
              className="text-[2.55rem] font-semibold leading-[0.95] tracking-[-0.045em] text-[#171717] sm:text-[2.85rem]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Welcome back
            </h2>
            <p className="text-[0.98rem] leading-7 text-[#6C7280]">
              Sign in to review your sessions, messages, and study flow.
            </p>
          </div>

          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-[20px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
              <span className="material-symbols-outlined text-[18px] shrink-0 translate-y-[1px]">error</span>
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || submitting || anonLoading}
              className={`flex h-12 w-full items-center justify-center gap-3 rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-sm font-semibold text-[#4D5968] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all ${TRANSITION_TIMING} hover:-translate-y-px hover:border-[#D9D1C2] hover:bg-[#FEFDFC] hover:shadow-[0_12px_24px_rgba(15,23,42,0.04)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-[#E8E1D6]"></div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9AA1AA]">or use email</span>
              <div className="h-px flex-1 bg-[#E8E1D6]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-semibold text-[#4C5663]">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@university.edu"
                  value={form.email}
                  onChange={event => handleChange('email', event.target.value)}
                  required
                  className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${TRANSITION_TIMING} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-semibold text-[#4C5663]">
                    Password
                  </label>
                  <a
                    href="#"
                    className={`text-xs font-medium text-[#8A919A] transition-colors ${TRANSITION_TIMING} hover:text-[#5E8FE8]`}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={event => handleChange('password', event.target.value)}
                    required
                    className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 pr-12 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${TRANSITION_TIMING} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-[18px] text-[#9AA1AA] outline-none transition-colors ${TRANSITION_TIMING} hover:text-[#647182] focus-visible:ring-2 focus-visible:ring-[#5E8FE8]`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || anonLoading || googleLoading}
                className={`group relative mt-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#145FCB] px-4 text-base font-semibold text-white shadow-[0_18px_34px_rgba(20,95,203,0.18)] transition-all ${TRANSITION_TIMING} hover:-translate-y-px hover:shadow-[0_22px_44px_rgba(20,95,203,0.22)] active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0`}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#8A919A]">
              Don't have an account?{' '}
              <Link to="/register" className={`font-medium text-[#677588] transition-colors ${TRANSITION_TIMING} hover:text-[#1a56db]`}>
                Sign up for free
              </Link>
            </p>

            <button
              type="button"
              onClick={handleAnonSignIn}
              disabled={submitting || anonLoading || googleLoading}
              className={`mt-6 flex h-10 w-full items-center justify-center rounded-[18px] border border-dashed border-[#D8D0C4] bg-transparent px-4 text-xs font-medium text-[#8A919A] transition-all ${TRANSITION_TIMING} hover:-translate-y-px hover:border-[#C9BFAF] hover:text-[#677588] active:scale-[0.98] disabled:opacity-50`}
            >
              {anonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Try Demo (No Account)'}
            </button>
          </div>
          </div>
        </section>
        </div>
      </div>
      </div>
    </>
  )
}
