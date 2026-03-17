import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import navbarLogo from '../assets/navbar-logo.svg';
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import { formatAuthError } from '@/lib/auth'

export default function RegisterPage() {
  const { signUp, signInAnonymously, signInWithGoogle } = useAuth()
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

  // GSAP Polish: Smooth, non-bouncy layout entrance matching LoginPage
  useEffect(() => {
    const tl = gsap.timeline()
    
    tl.fromTo(
      [leftContentRef.current, rightContentRef.current],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
    )
  }, [])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (message) setMessage('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (event) => {
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
    // Distilled background: Solid Alice Blue, no messy gradients
    <div ref={pageRef} className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-4 py-20 sm:px-6 sm:py-12 lg:px-8">
      
      {/* Mobile Top Navigation (only visible block on small screens) */}
      <div className="absolute top-6 left-6 lg:hidden">
        <Link to="/" className="flex items-center group outline-none rounded">
          <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
        </Link>
      </div>

      <div className="mx-auto w-full max-w-6xl grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
        
        {/* Left Column: Distilled Copy & Proof */}
        <section ref={leftContentRef} className="hidden lg:flex flex-col opacity-0">
          <Link to="/" className="flex items-center group outline-none rounded inline-flex w-fit mb-16">
            <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
          </Link>
          
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] text-slate-900 tracking-tight">
              Join StudyMatch today.
            </h1>
            <p className="text-lg leading-relaxed text-slate-600 font-medium">
              Create your account once, then jump straight into our tailored onboarding. Fast, secure, and zero clutter.
            </p>
          </div>

          <div className="mt-12 pt-12 border-t border-slate-200/80 max-w-sm space-y-8">
            <div className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#136DEC]/10 text-[#136DEC]">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Sign Up Quickly</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 font-medium">Use your Email or Google OAuth for fast access.</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Custom Onboarding</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 font-medium">Set your study preferences right after registering.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Distilled Form (No Wrapper Card) */}
        <section ref={rightContentRef} className="w-full max-w-[420px] mx-auto lg:mx-0 opacity-0 mt-8 lg:mt-0">
          
          <div className="mb-10 text-center lg:text-left space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Create an account
            </h2>
            <p className="text-base font-medium text-slate-500">
              Mulai langkah awalmu untuk kolaborasi lebih baik.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-start gap-3" role="alert">
               <span className="material-symbols-outlined text-[18px] shrink-0 translate-y-[1px]">error</span>
               <p>{message}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-start gap-3" role="status">
               <span className="material-symbols-outlined text-[18px] shrink-0 translate-y-[1px]">check_circle</span>
               <p>{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Native Clean Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || submitting || anonLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                  Sign up with Google
                </>
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">or use email</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-name" className="block text-sm font-bold text-slate-700">
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-[#136DEC] focus:outline-none focus:ring-4 focus:ring-[#136DEC]/15"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="register-email" className="block text-sm font-bold text-slate-700">
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-[#136DEC] focus:outline-none focus:ring-4 focus:ring-[#136DEC]/15"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-university" className="block text-sm font-bold text-slate-700">
                    University
                  </label>
                  <input
                    id="register-university"
                    type="text"
                    autoComplete="organization"
                    placeholder="Opsional"
                    value={form.university}
                    onChange={event => handleChange('university', event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-[#136DEC] focus:outline-none focus:ring-4 focus:ring-[#136DEC]/15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="block text-sm font-bold text-slate-700">
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-[#136DEC] focus:outline-none focus:ring-4 focus:ring-[#136DEC]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || anonLoading || googleLoading}
                className="group relative flex h-12 w-full mt-4 items-center justify-center overflow-hidden rounded-xl bg-[#136DEC] px-4 text-base font-bold text-white shadow-lg shadow-[#136DEC]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#136DEC]/35 active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-slate-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-bold text-[#136DEC] transition-colors hover:text-[#0f60d0]">
                Login di sini
              </Link>
            </p>

            <button
              type="button"
              onClick={handleAnonSignIn}
              disabled={submitting || anonLoading || googleLoading}
              className="mt-6 flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-transparent px-4 text-xs font-semibold text-slate-500 transition-all hover:border-slate-400 hover:text-slate-600 active:bg-slate-50 disabled:opacity-50"
            >
              {anonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Lanjut sebagai Tamu (Dev Mode)'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
