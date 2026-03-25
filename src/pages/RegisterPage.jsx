import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import navbarLogo from '../assets/navbar-logo.svg'
import { useAuthStore } from '@/store/useAuthStore'
import { formatAuthError } from '@/lib/auth'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'



export default function RegisterPage() {
  const signUp = useAuthStore(state => state.signUp)
  const signInWithGoogle = useAuthStore(state => state.signInWithGoogle)
  const navigate = useNavigate()

  const pageRef = useRef(null)
  const leftContentRef = useRef(null)
  const rightContentRef = useRef(null)

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
      setMessage('Password must be at least 6 characters.')
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
      setSuccess(`Account for ${form.email} was created successfully. Please check your email for verification before logging in.`)
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
    <>
      <Helmet>
        <title>Create Account - StudyMatch</title>
        <meta name="description" content="Join StudyMatch and find your perfect study partner." />
      </Helmet>
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
                style={{ fontFamily: DISPLAY_FONT }}
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
                    style={{ fontFamily: DISPLAY_FONT }}
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
                    style={{ fontFamily: DISPLAY_FONT }}
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
                  style={{ fontFamily: DISPLAY_FONT }}
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
                  disabled={googleLoading || submitting}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E7E1D6] bg-white px-5 text-[13px] font-bold text-[#4D5968] shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50`}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    'Sign up with Google'
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
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={event => handleChange('fullName', event.target.value)}
                      required
                      className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${TRANSITION_TIMING} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="register-email" className="block text-sm font-semibold text-[#4C5663]">
                        Email Address
                      </label>
                      <input
                        id="register-email"
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
                      <label htmlFor="register-university" className="block text-sm font-semibold text-[#4C5663]">
                        University
                      </label>
                      <input
                        id="register-university"
                        type="text"
                        autoComplete="organization"
                        placeholder="Your campus name"
                        value={form.university}
                        onChange={event => handleChange('university', event.target.value)}
                        className={`h-12 w-full rounded-[18px] border border-[#E7E1D6] bg-[#FCFBF8] px-4 text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-[#9AA1AA] transition-all ${TRANSITION_TIMING} focus:border-[#5E8FE8] focus:outline-none focus:ring-4 focus:ring-[#5E8FE8]/12`}
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
                        placeholder="Min. 6 characters"
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
                    disabled={submitting || googleLoading}
                    className={`group relative mt-4 flex h-12 w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#1a56db] px-4 text-base font-semibold text-white shadow-[0_18px_34px_rgba(26,86,219,0.18)] transition-all ${TRANSITION_TIMING} hover:-translate-y-px hover:shadow-[0_22px_44px_rgba(26,86,219,0.22)] active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0`}
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register Now'}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>
                </form>

                <div className="mt-8 text-center text-[0.92rem] leading-6 text-[#71717A]">
                  One step closer to matching!
                </div>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </>
  )
}
