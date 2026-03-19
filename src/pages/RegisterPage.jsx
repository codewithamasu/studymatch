import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import navbarLogo from '../assets/navbar-logo.svg'
import { useAuthStore } from '@/store/useAuthStore'
import { formatAuthError } from '@/lib/auth'

const displayFont = '"Fraunces", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
const transitionTiming = 'duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'

export default function RegisterPage() {
  const signUp = useAuthStore(state => state.signUp)
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
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    university: '',
    password: '',
  })

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
    if (success) setSuccess('')
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (form.password.length < 6) {
      setMessage('Password minimal 6 karakter.')
      return
    }

    setSubmitting(true)
    setMessage('')
    setSuccess('')

    const { error, needsEmailConfirmation } = await signUp(form)
    setSubmitting(false)

    if (error) {
      setMessage(formatAuthError(error))
      return
    }

    if (needsEmailConfirmation) {
      setSuccess(`Akun untuk ${form.email} berhasil dibuat. Cek email kamu untuk verifikasi sebelum login.`)
      return
    }

    navigate('/onboarding')
  }

  const handleAnonSignIn = async () => {
    setAnonLoading(true)
    setMessage('')
    setSuccess('')

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
    setSuccess('')

    const { error } = await signInWithGoogle()

    if (error) {
      setGoogleLoading(false)
      setMessage(formatAuthError(error))
    }
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#F7F6F3] px-4 py-20 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="absolute left-6 top-6 lg:hidden">
        <Link to="/" className="group flex items-center rounded outline-none">
          <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
        </Link>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,460px)] lg:gap-16 xl:gap-24">
          <section ref={leftContentRef} className="hidden lg:flex flex-col justify-center opacity-0">
            <Link to="/" className="group mb-14 inline-flex w-fit items-center rounded outline-none">
              <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
            </Link>

            <div className="max-w-[32rem] space-y-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B7B8D]">
                Begin with intention
              </p>
              <h1
                className="text-[clamp(3rem,5vw,4.8rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#171717]"
                style={{ fontFamily: displayFont }}
              >
                Build a better study routine from day one.
              </h1>
              <p className="max-w-[29rem] text-[1.02rem] leading-8 text-[#667085]">
                Create your account, shape your preferences, and step into a matching flow designed around real academic momentum.
              </p>
            </div>

            <div className="mt-14 grid max-w-[33rem] gap-8 border-t border-[#E7E1D6] pt-12">
              <div className="flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EDF2F7] text-[#68809A] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                </div>
                <div>
                  <p
                    className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] text-[#171717]"
                    style={{ fontFamily: displayFont }}
                  >
                    Fast, thoughtful setup
                  </p>
                  <p className="mt-2 text-[0.96rem] leading-7 text-[#6C7280]">
                    Start with email or Google, then move directly into a clean onboarding flow with no wasted steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EEF5F1] text-[#6A8A7A] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                </div>
                <div>
                  <p
                    className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] text-[#171717]"
                    style={{ fontFamily: displayFont }}
                  >
                    Matching with context
                  </p>
                  <p className="mt-2 text-[0.96rem] leading-7 text-[#6C7280]">
                    Tell StudyMatch what you study, how you learn, and when you are available so every next step feels relevant.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            ref={rightContentRef}
            className="mx-auto mt-8 w-full max-w-[460px] opacity-0 lg:mt-0"
          >
            <div className="rounded-[30px] bg-[#FBFAF7]/96 px-6 py-7 shadow-[0_24px_80px_rgba(18,26,38,0.04)] ring-1 ring-[#ECE6DB] sm:px-8 sm:py-9">
              <div className="mb-10 space-y-3 text-center lg:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A8594]">
                  Create account
                </p>
                <h2
                  className="text-[2.45rem] font-semibold leading-[0.95] tracking-[-0.045em] text-[#171717] sm:text-[2.8rem]"
                  style={{ fontFamily: displayFont }}
                >
                  Create an account
                </h2>
                <p className="text-[0.98rem] leading-7 text-[#6C7280]">
                  Start your profile and get ready for a more intentional way to study together.
                </p>
              </div>

              {message && (
                <div className="mb-6 flex items-start gap-3 rounded-[20px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
                  <span className="material-symbols-outlined shrink-0 translate-y-[1px] text-[18px]">error</span>
                  <p>{message}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
                  <span className="material-symbols-outlined shrink-0 translate-y-[1px] text-[18px]">check_circle</span>
                  <p>{success}</p>
                </div>
              )}

              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || submitting || anonLoading}
                  className={`flex h-12 w-full items-center justify-center gap-3 rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-sm font-semibold text-[#4D5968] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all ${transitionTiming} hover:-translate-y-px hover:border-[#D9D1C2] hover:bg-[#FEFDFC] hover:shadow-[0_12px_24px_rgba(15,23,42,0.04)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                      </svg>
                      Sign up with Google
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
                    <label htmlFor="register-name" className="block text-sm font-semibold text-[#4C5663]">
                      Full Name
                    </label>
                    <input
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Nama lengkap kamu"
                      value={form.fullName}
                      onChange={event => handleChange('fullName', event.target.value)}
                      required
                      className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${transitionTiming} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="register-email" className="block text-sm font-semibold text-[#4C5663]">
                        Email
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        placeholder="nama@kampus.ac.id"
                        value={form.email}
                        onChange={event => handleChange('email', event.target.value)}
                        required
                        className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${transitionTiming} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-university" className="block text-sm font-semibold text-[#4C5663]">
                        University
                      </label>
                      <input
                        id="register-university"
                        type="text"
                        autoComplete="organization"
                        placeholder="Opsional"
                        value={form.university}
                        onChange={event => handleChange('university', event.target.value)}
                        className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${transitionTiming} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="register-password" className="block text-sm font-semibold text-[#4C5663]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimal 6 karakter"
                        value={form.password}
                        onChange={event => handleChange('password', event.target.value)}
                        required
                        className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 pr-12 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${transitionTiming} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-[18px] text-[#9AA1AA] outline-none transition-colors ${transitionTiming} hover:text-[#647182] focus-visible:ring-2 focus-visible:ring-[#5E8FE8] hover:cursor-pointer`}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || anonLoading || googleLoading}
                    className={`group relative mt-4 flex h-12 w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#145FCB] px-4 text-base font-semibold text-white shadow-[0_18px_34px_rgba(20,95,203,0.18)] transition-all ${transitionTiming} hover:-translate-y-px hover:shadow-[0_22px_44px_rgba(20,95,203,0.22)] active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 hover:cursor-pointer`}
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-[#8A919A]">
                  Sudah punya akun?{' '}
                  <Link to="/login" className={`font-medium text-[#677588] transition-colors ${transitionTiming} hover:text-[#145FCB]`}>
                    Login di sini
                  </Link>
                </p>

                <button
                  type="button"
                  onClick={handleAnonSignIn}
                  disabled={submitting || anonLoading || googleLoading}
                  className={`mt-6 flex h-10 w-full items-center justify-center rounded-[18px] border border-dashed border-[#D8D0C4] bg-transparent px-4 text-xs font-medium text-[#8A919A] transition-all ${transitionTiming} hover:-translate-y-px hover:border-[#C9BFAF] hover:text-[#677588] active:scale-[0.98] disabled:opacity-50`}
                >
                  {anonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Lanjut sebagai Tamu (Dev Mode)'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
