import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import navbarLogo from '../assets/navbar-logo.svg';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import { useAuthStore } from '@/store/useAuthStore'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'

// ─── Data ─────────────────────────────────────────────────────────────────────

const POPULAR_SUBJECTS = [
  { label: 'Mathematics',      icon: 'functions',       count: '1.2k study partners' },
  { label: 'Computer Science', icon: 'code',             count: '2.5k study partners' },
  { label: 'Psychology',       icon: 'psychology',       count: '850 study partners'  },
  { label: 'Biology',          icon: 'science',          count: '1.1k study partners' },
  { label: 'Art & Design',     icon: 'brush',            count: '600 study partners'  },
  { label: 'Economics',        icon: 'account_balance',  count: '920 study partners'  },
  { label: 'Modern Languages', icon: 'language',         count: '1.4k study partners' },
  { label: 'History',          icon: 'history_edu',      count: '450 study partners'  },
]

const ALL_SUBJECTS = [
  'Calculus', 'Linear Algebra', 'Statistics', 'Data Structures',
  'Algorithms', 'Web Development', 'Machine Learning', 'Database Systems',
  'Python Programming', 'Physics', 'Biology', 'Data Analysis',
  'Economics', 'Econometrics', 'Psychology', 'History',
  'Modern Languages', 'Art & Design', 'Mathematics', 'Computer Science',
]

const SKILL_LEVELS = [
  { value: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'Just starting to learn' },
  { value: 'intermediate', label: 'Intermediate', emoji: '📚', desc: 'Understands the basics' },
  { value: 'advanced',     label: 'Advanced',     emoji: '🚀', desc: 'Mastered the material' },
]

const STUDY_GOALS_DETAIL = [
  { value: 'exam_prep',      label: 'Exam Prep',          desc: 'Focus on intensive study for final exams or certifications.' },
  { value: 'homework_help',  label: 'Homework Help',      desc: 'Help solve homework and daily concept questions.' },
  { value: 'skill_mastery',  label: 'Master New Skill',   desc: 'Long-term deep dive to grow and develop.' },
  { value: 'project',        label: 'Collaboration',      desc: 'Collaborate on academic projects or portfolios.' },
]

const MASTERY_LABELS = [
  { max: 25,  label: 'Beginner',     desc: 'Just starting, still learning the basics.' },
  { max: 50,  label: 'Intermediate', desc: 'Understands basics, but still needs practice.' },
  { max: 75,  label: 'Advanced',     desc: 'Comfortable with material, just needs polish.' },
  { max: 100, label: 'Expert',       desc: 'Ready to tutor and master this topic.' },
]

const LEARNING_STYLES = [
  { value: 'visual',      label: 'Visual',      emoji: '👁️', desc: 'Images & diagrams' },
  { value: 'auditory',    label: 'Auditory',    emoji: '👂', desc: 'Discussion & listening' },
  { value: 'kinesthetic', label: 'Kinesthetic', emoji: '✋', desc: 'Hands-on practice' },
]

const DAYS = [
  { value: 'mon', label: 'MON', full: 'Monday' },
  { value: 'tue', label: 'TUE', full: 'Tuesday' },
  { value: 'wed', label: 'WED', full: 'Wednesday' },
  { value: 'thu', label: 'THU', full: 'Thursday' },
  { value: 'fri', label: 'FRI', full: 'Friday' },
  { value: 'sat', label: 'SAT', full: 'Saturday' },
  { value: 'sun', label: 'SUN', full: 'Sunday' },
]

const LANGUAGES = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English (US)' },
  { value: 'jv', label: 'Jawa / Sunda' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'ar', label: 'Arabic' },
]

const TIME_SLOTS = [
  { value: 'morning',    label: 'Morning',   sub: '06.00 – 12.00' },
  { value: 'afternoon',  label: 'Afternoon', sub: '12.00 – 17.00' },
  { value: 'evening',    label: 'Evening',   sub: '17.00 – 21.00' },
  { value: 'late_night', label: 'Late Night', sub: '21.00+' },
]

const STEP_TITLES = [
  { heading: 'What are you studying?',       sub: 'Choose subjects you want to study with your partner.' },
  { heading: 'Define your mastery & goals.', sub: 'Tell us where you are now and what you want to achieve.' },
  { heading: 'Preferences & Availability.',  sub: 'Tell us your preferred study methods and times.' },
]

function normalizeSubjectInput(value) {
  return value.trim().replace(/\s+/g, ' ')
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const step = useOnboardingStore((state) => state.step)
  const profile = useOnboardingStore((state) => state.profile)
  const saving = useOnboardingStore((state) => state.saving)
  const errorMessage = useOnboardingStore((state) => state.errorMessage)
  const setStep = useOnboardingStore((state) => state.setStep)
  const setProfile = useOnboardingStore((state) => state.setProfile)
  const hydrateProfile = useOnboardingStore((state) => state.hydrateProfile)
  const toggleSubject = useOnboardingStore((state) => state.toggleSubject)
  const toggleDay = useOnboardingStore((state) => state.toggleDay)
  const setMastery = useOnboardingStore((state) => state.setMastery)
  const toggleStudyGoal = useOnboardingStore((state) => state.toggleStudyGoal)
  const togglePreferredTime = useOnboardingStore((state) => state.togglePreferredTime)
  const setSaving = useOnboardingStore((state) => state.setSaving)
  const setErrorMessage = useOnboardingStore((state) => state.setErrorMessage)
  const canProceed = useOnboardingStore((state) => state.canProceed)
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const headerRef  = useRef(null)
  const contentRef = useRef(null)
  const footerRef  = useRef(null)
  const hydratedUserIdRef = useRef(null)

  // ── GSAP: Page entrance ──────────────────────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(
      headerRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
    )
    tl.fromTo(
      contentRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
      '-=0.3',
    )
    tl.fromTo(
      footerRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      '-=0.4',
    )
  }, [])

  // ── GSAP: Step transition ────────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(
      contentRef.current,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
    )
  }, [step])

  useEffect(() => {
    if (!user?.id) return

    if (hydratedUserIdRef.current !== user.id) {
      resetOnboarding()
      hydratedUserIdRef.current = user.id
    }

    if (!user.study_profile) return

    hydrateProfile(user.study_profile)
  }, [hydrateProfile, resetOnboarding, user])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSubjectToggle = (subject) => {
    const normalizedSubject = normalizeSubjectInput(subject)
    if (!normalizedSubject) return
    toggleSubject(normalizedSubject)
  }

  const addCustomSubject = () => {
    const normalizedSubject = normalizeSubjectInput(searchQuery)
    if (!normalizedSubject) return
    handleSubjectToggle(normalizedSubject)
    setSearchQuery('')
  }

  // helpers
  const getMasteryLabel = (val) => MASTERY_LABELS.find(m => val <= m.max) ?? MASTERY_LABELS[MASTERY_LABELS.length - 1]

  const handleComplete = async () => {
    setSaving(true)
    setErrorMessage('')
    const { error } = await updateProfile(profile)
    setSaving(false)
    if (error) {
      setErrorMessage(error.message || 'Failed to save profile. Please try again.')
      return
    }
    resetOnboarding()
    navigate('/discover')
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
      setErrorMessage('')
    } else {
      handleComplete()
    }
  }

  // ── Filtered subjects for search ─────────────────────────────────────────────
  const filteredPopular = POPULAR_SUBJECTS.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const normalizedSearchQuery = normalizeSubjectInput(searchQuery)
  const searchResults = searchQuery.trim()
    ? ALL_SUBJECTS.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : []
  const hasExactSuggestedSubject = ALL_SUBJECTS.some(
    (subject) => subject.toLowerCase() === normalizedSearchQuery.toLowerCase()
  )
  const hasExactSelectedSubject = profile.subjects.some(
    (subject) => subject.toLowerCase() === normalizedSearchQuery.toLowerCase()
  )
  const canCreateCustomSubject = normalizedSearchQuery.length >= 2 && !hasExactSuggestedSubject && !hasExactSelectedSubject

  const progressPct = Math.round(((step + 1) / 3) * 100)

  return (
    <>
      <Helmet>
        <title>Onboarding - StudyMatch</title>
        <meta name="description" content="Set up your learning profile to find the best study partners." />
      </Helmet>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 opacity-0"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <a href="/" className="flex items-center group">
          <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
        </a>
        <div className="flex items-center gap-6">
          <a href="#" className="hidden md:block text-sm font-medium text-slate-500 hover:text-[#136DEC] transition-colors">Help</a>
          <a href="#" className="hidden md:block text-sm font-medium text-slate-500 hover:text-[#136DEC] transition-colors">About</a>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-[900px]">

          {/* Progress */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#136DEC]">
                Step {step + 1} of 3
              </span>
              <span className="text-xs font-medium text-slate-400">{progressPct}% Complete</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#136DEC] rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ── Step Content ─────────────────────────────────────────────────── */}
          <div ref={contentRef} className="opacity-0">

            {/* Hero Title */}
            <div className="mb-10">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] text-slate-900 tracking-tight mb-3"
                style={{ fontFamily: DISPLAY_FONT, letterSpacing: '-0.03em' }}
              >
                {STEP_TITLES[step].heading}
              </h1>
              <p className="text-base text-slate-500 font-medium leading-relaxed">
                {STEP_TITLES[step].sub}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-start gap-3" role="alert">
                <span className="material-symbols-outlined text-[18px] shrink-0 translate-y-[1px]">error</span>
                <p>{errorMessage}</p>
              </div>
            )}

            {/* ── Step 0: Subjects ──────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-10">

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 transition-colors duration-200 group-focus-within:text-[#136DEC]">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && canCreateCustomSubject) {
                        event.preventDefault()
                        addCustomSubject()
                      }
                    }}
                    placeholder="Search subjects (e.g. Calculus, Data Structures, Psychology...)"
                    className="block w-full h-14 pl-12 pr-4 text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#136DEC] focus:ring-4 focus:ring-[#136DEC]/15 placeholder:text-slate-400 transition-all duration-300 text-sm font-medium shadow-sm"
                  />
                  {/* Search results dropdown */}
                  {(searchResults.length > 0 || canCreateCustomSubject) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {canCreateCustomSubject && (
                        <button
                          onClick={addCustomSubject}
                          className="w-full px-4 py-3 text-sm font-semibold text-[#136DEC] text-left hover:bg-[#136DEC]/5 transition-colors flex items-center gap-3 border-b border-slate-100"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_circle</span>
                          Add "{normalizedSearchQuery}"
                        </button>
                      )}
                      {searchResults.slice(0, 6).map(subject => (
                        <button
                          key={subject}
                          onClick={() => { handleSubjectToggle(subject); setSearchQuery('') }}
                          className="w-full px-4 py-3 text-sm font-medium text-slate-700 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${profile.subjects.includes(subject) ? 'text-[#136DEC]' : 'text-slate-400'}`}>
                            {profile.subjects.includes(subject) ? 'check_circle' : 'add_circle'}
                          </span>
                          {subject}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Your Selection */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-4">Your Selection</h3>
                  <div className={`flex flex-wrap gap-2 min-h-[52px] px-4 py-3 rounded-xl transition-all duration-300 ${
                    profile.subjects.length > 0
                      ? 'bg-[#136DEC]/[0.04]'
                      : 'bg-slate-50'
                  }`}>
                    {profile.subjects.length === 0 && (
                      <span className="text-sm text-slate-400 italic flex items-center">Pick at least 1 subject...</span>
                    )}
                    {profile.subjects.map(subject => (
                      <span
                        key={subject}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#136DEC] text-white text-sm font-medium"
                      >
                        {subject}
                        <button
                          onClick={() => handleSubjectToggle(subject)}
                          className="hover:text-slate-200 transition-colors"
                          aria-label={`Remove ${subject}`}
                        >
                          <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Popular Subjects Grid */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#136DEC] text-[20px]">trending_up</span>
                    Popular Subjects
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredPopular.map(subject => {
                      const isSelected = profile.subjects.includes(subject.label)
                      return (
                        <button
                          key={subject.label}
                          onClick={() => handleSubjectToggle(subject.label)}
                          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 group ${
                            isSelected
                              ? 'border-[#136DEC] bg-[#136DEC]/[0.06]'
                              : 'border-black/[0.08] bg-white hover:border-black/20 hover:bg-slate-50/80'
                          }`}
                          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                        >
                          <span className={`material-symbols-outlined text-[22px] mb-3 p-2 rounded-lg transition-colors duration-200 ${
                            isSelected
                              ? 'text-[#136DEC] bg-[#136DEC]/10'
                              : 'text-slate-500 bg-slate-100/80 group-hover:text-[#136DEC] group-hover:bg-[#136DEC]/10'
                          }`}>
                            {subject.icon}
                          </span>
                          <span className={`text-sm font-bold block mb-0.5 transition-colors duration-200 ${
                            isSelected ? 'text-[#136DEC]' : 'text-slate-800 group-hover:text-slate-900'
                          }`}>
                            {subject.label}
                          </span>
                          <span className="text-xs text-slate-400">{subject.count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Mastery Sliders + Study Goals ────────────────────── */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* ── Left: Per-subject mastery sliders ── */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#136DEC] text-[20px]">bar_chart</span>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Current Mastery</h2>
                  </div>

                  <div className="rounded-xl border border-black/[0.08] bg-white p-6 space-y-7">
                    {profile.subjects.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">You haven't selected any subjects in the previous step.</p>
                    ) : (
                      profile.subjects.map(subject => {
                        const val = profile.subject_mastery[subject] ?? 50
                        const masteryInfo = getMasteryLabel(val)
                        return (
                          <div key={subject} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-800">{subject}</span>
                              <span className="text-sm font-bold text-[#136DEC]">{val}%</span>
                            </div>
                            {/* Slider */}
                            <div className="relative">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={val}
                                onChange={e => setMastery(subject, e.target.value)}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #136DEC ${val}%, #e2e8f0 ${val}%)`,
                                  accentColor: '#136DEC',
                                }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">
                              <span className="font-semibold text-slate-500">{masteryInfo.label}:</span> {masteryInfo.desc}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* ── Right: Study Goals checkboxes ── */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#136DEC] text-[20px]">target</span>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Study Goals</h2>
                  </div>

                  <div className="space-y-3">
                    {STUDY_GOALS_DETAIL.map(goal => {
                      const isChecked = profile.study_goals.includes(goal.value)
                      return (
                        <label
                          key={goal.value}
                          onClick={() => toggleStudyGoal(goal.value)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isChecked
                              ? 'border-[#136DEC] bg-[#136DEC]/[0.05]'
                              : 'border-black/[0.08] bg-white hover:border-[#136DEC]/40 hover:bg-slate-50/80'
                          }`}
                          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                        >
                          {/* Custom checkbox */}
                          <div
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked
                                ? 'border-[#136DEC] bg-[#136DEC]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && (
                              <span className="material-symbols-outlined text-white text-[14px] leading-none font-bold">check</span>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-bold mb-0.5 ${ isChecked ? 'text-[#136DEC]' : 'text-slate-900' }`}>
                              {goal.label}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">{goal.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ── Step 2: Preferences & Availability ────────────────────────── */}
            {step === 2 && (
              <div className="space-y-8">

                {/* Row 1: Study Mode + Language */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Study Mode Toggle */}
                  <div className="p-6 bg-white rounded-xl border border-black/[0.08] flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#136DEC] text-[20px]">distance</span>
                      <h3 className="text-base font-bold text-slate-900">Study Mode</h3>
                    </div>
                    {/* Segmented control */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-black/[0.06] gap-1 ">
                      {[{ value: 'online', label: 'Online' }, { value: 'in-person', label: 'In-Person' }].map(mode => (
                        <button
                          key={mode.value}
                          onClick={() => setProfile({ ...profile, study_mode: mode.value })}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
                            profile.study_mode === mode.value
                              ? 'bg-white text-[#136DEC] shadow-sm border border-black/[0.06]'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="p-6 bg-white rounded-xl border border-black/[0.08] flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#136DEC] text-[20px]">translate</span>
                      <h3 className="text-base font-bold text-slate-900">Language</h3>
                    </div>
                    <select
                      value={profile.language}
                      onChange={e => setProfile({ ...profile, language: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-black/[0.08] rounded-xl text-slate-900 text-sm font-medium px-3 focus:outline-none focus:border-[#136DEC] focus:ring-4 focus:ring-[#136DEC]/15 transition-all duration-300 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weekly Availability */}
                <div className="p-6 bg-white rounded-xl border border-black/[0.08]">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-[#136DEC] text-[20px]">calendar_month</span>
                    <h3 className="text-base font-bold text-slate-900">Weekly Availability</h3>
                  </div>

                  {/* Day cards */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                    {DAYS.map(day => {
                      const isActive = profile.availability.days.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          onClick={() => toggleDay(day.value)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                            isActive
                              ? 'border-[#136DEC] bg-[#136DEC]/[0.05]'
                              : 'border-black/[0.06] bg-slate-50 hover:border-black/15 hover:bg-white'
                          }`}
                          title={day.full}
                        >
                          <span className={`text-[10px] font-black tracking-wider ${ isActive ? 'text-[#136DEC]' : 'text-slate-500'}`}>
                            {day.label}
                          </span>
                          <span className={`material-symbols-outlined text-[20px] transition-colors ${ isActive ? 'text-[#136DEC]' : 'text-slate-300'}`}>
                            {isActive ? 'check_circle' : 'circle'}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Preferred Times */}
                  <div className="mt-8">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-[0.14em] mb-4">Preferred Study Times</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {TIME_SLOTS.map(slot => {
                        const isActive = profile.preferred_times.includes(slot.value)
                        return (
                          <button
                            key={slot.value}
                            onClick={() => togglePreferredTime(slot.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200
                             ${
                               isActive
                                 ? 'border-[#136DEC] bg-[#136DEC] text-white'
                                 : 'border-black/[0.08] bg-white text-slate-600 hover:border-[#136DEC]/40 hover:text-[#136DEC]'
                             }`}
                          >
                            <span>{slot.label}</span>
                            <span className="text-[11px] opacity-75 font-medium">{slot.sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Profile Summary Card */}
                <div className="rounded-xl border border-black/[0.07] bg-white p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Your Profile Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {[
                      { label: 'Subjects', value: profile.subjects.join(', ') || '—' },
                      { label: 'Goals',    value: profile.study_goals.map(g => STUDY_GOALS_DETAIL.find(x => x.value === g)?.label).join(', ') || '—' },
                      { label: 'Mode',     value: profile.study_mode === 'online' ? 'Online' : 'In-Person' },
                      { label: 'Days',     value: profile.availability.days.map(d => DAYS.find(x => x.value === d)?.full).join(', ') || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-[0.1em]">{label}</span>
                        <p className="text-slate-700 font-medium mt-0.5 truncate capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div
            ref={footerRef}
            className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between opacity-0"
          >
            <button
              onClick={() => { setStep(step - 1); setErrorMessage('') }}
              disabled={step === 0 || saving}
              className={`px-5 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700
              transition-all duration-200 flex items-center gap-2 ${
                step === 0 ? 'invisible' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || saving}
              className="group relative flex h-12 items-center gap-2 px-8 rounded-xl bg-[#136DEC] text-sm font-bold text-white shadow-lg shadow-[#136DEC]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#136DEC]/35 active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 overflow-hidden"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {step === 2 ? 'Start Matching ✨' : 'Next Step'}
                  {!saving && <ArrowRight className="w-4 h-4" />}
                </>
              )}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          </div>

        </div>
      </main>

      </div>
    </>
  )
}
