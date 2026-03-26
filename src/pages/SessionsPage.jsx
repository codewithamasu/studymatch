import { useState, useEffect, useRef, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  Calendar,
  ChevronDown,
  Clock,
  Link as LinkIcon,
  MapPin,
  PlusCircle,
  Sparkles,
  Video,
  CircleCheck
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { fetchMatchAlerts, fetchUserSessions, createNewSession, updateSessionStatus } from '@/lib/studymatchRealtime'
import { isSupabaseConfigured } from '@/lib/supabase'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'

let localSessions = []

const FALLBACK_SUBJECTS = [
  'Calculus',
  'Linear Algebra',
  'Data Structures',
  'Algorithms',
  'Statistics',
  'Physics',
  'Web Development',
  'Machine Learning',
]

function getTodayStr() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

function getNowTimeStr() {
  const now = new Date()
  return now.toTimeString().slice(0, 5) // "HH:MM"
}

const DURATIONS = [
  { label: '45 min', value: 45, note: 'Quick check-in' },
  { label: '90 min', value: 90, note: 'Deep focus' },
  { label: '2 hours', value: 120, note: 'Problem solving' },
  { label: '3 hours', value: 180, note: 'Long review' },
]

const LOCATION_PRESETS = ['Campus Library', 'Quiet Study Hall', 'Student Cafe']



function createRoomId() {
  return `study-session-${Math.random().toString(36).slice(2, 9)}`
}

function formatScheduleDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatScheduleTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pageRef = useRef(null)
  const conditionalBlockRef = useRef(null)
  const currentUser = useAuthStore((state) => state.user)

  const searchParams = new URLSearchParams(location.search)
  const initialPartnerId = searchParams.get('partnerId') || ''
  const isNewSession = location.pathname === '/sessions/new'

  const [sessionForm, setSessionForm] = useState({
    partnerId: initialPartnerId,
    subject: '',
    date: '',
    time: '',
    duration: 90,
    mode: 'online',
    location: '',
  })
  const [generatedLink, setGeneratedLink] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [sessions, setSessions] = useState(localSessions)
  const [matchedPartners, setMatchedPartners] = useState([])
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [selectedLocationSession, setSelectedLocationSession] = useState(null)
  const appOrigin = typeof window === 'undefined' ? '' : window.location.origin

  useEffect(() => {
    async function loadPartners() {
      if (!currentUser?.id) return
      setPartnersLoading(true)
      try {
        if (isSupabaseConfigured) {
          const alerts = await fetchMatchAlerts(currentUser.id)
          setMatchedPartners(alerts.map((a) => a.partner).filter(Boolean))
        } else {
          setMatchedPartners([])
        }
      } catch (error) {
        console.error('Failed to load partners:', error)
        setMatchedPartners([])
      } finally {
        setPartnersLoading(false)
      }
    }
    loadPartners()
  }, [currentUser?.id])

  const combinedSubjects = useMemo(() => {
    const selectedPartnerData = matchedPartners.find(
      (p) => p.id === sessionForm.partnerId
    )

    const mySubjects = currentUser?.study_profile?.subjects ?? []
    const partnerSubjects = selectedPartnerData?.study_profile?.subjects ?? []

    const merged = [...new Set([...mySubjects, ...partnerSubjects])]
    return merged.length > 0 ? merged : FALLBACK_SUBJECTS
  }, [sessionForm.partnerId, currentUser, matchedPartners])

  useEffect(() => {
    async function loadSessions() {
      if (!currentUser?.id) return
      setSessionsLoading(true)
      try {
        if (isSupabaseConfigured) {
          const realSessions = await fetchUserSessions(currentUser.id)
          setSessions(realSessions)
          localSessions = realSessions
        } else {
          setSessions([])
          localSessions = []
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
        setSessions([])
      } finally {
        setSessionsLoading(false)
      }
    }
    loadSessions()
  }, [currentUser?.id])

  useEffect(() => {
    if (sessionForm.subject && !combinedSubjects.includes(sessionForm.subject)) {
      setSessionForm((prev) => ({ ...prev, subject: '' }))
    }
  }, [combinedSubjects, sessionForm.subject])

  const todayStr = getTodayStr()
  const nowTimeStr = getNowTimeStr()
  const minTime = sessionForm.date === todayStr ? nowTimeStr : undefined

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!pageRef.current) return

    const elements = pageRef.current.querySelectorAll('[data-session-reveal]')
    gsap.fromTo(
      elements,
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.72,
        stagger: 0.08,
        ease: 'power3.out',
      }
    )
  }, [isNewSession])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!conditionalBlockRef.current) return

    gsap.fromTo(
      conditionalBlockRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' }
    )
  }, [sessionForm.mode, generatedLink])

  const updateFormField = (field, value) => {
    setSessionForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'mode' && value === 'online' ? { location: '' } : {}),
    }))

    if (field !== 'mode') return

    setCopyFeedback('')
    if (value === 'offline') {
      setGeneratedLink('')
    }
  }

  const handleGenerateLink = () => {
    const roomId = createRoomId()
    setGeneratedLink(`/meet/${roomId}`)
    setCopyFeedback('')
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return

    const fullLink = `${appOrigin}${generatedLink}`
    try {
      await navigator.clipboard.writeText(fullLink)
      setCopyFeedback('Meeting link copied')
    } catch {
      setCopyFeedback('Unable to copy link')
    }
  }

  const handleCreateSession = async (event) => {
    event.preventDefault()

    const selectedPartner = matchedPartners.find((p) => p.id === sessionForm.partnerId)
    if (!selectedPartner) return

    const resolvedRoomId =
      sessionForm.mode === 'online'
        ? (generatedLink.replace('/meet/', '') || createRoomId())
        : null

    const baseDate = sessionForm.date || new Date().toISOString().split('T')[0]
    const baseTime = sessionForm.time || '12:00'
    const localDateTime = new Date(`${baseDate}T${baseTime}:00`)

    const sessionData = {
      partnerId: sessionForm.partnerId,
      subject: sessionForm.subject,
      scheduled_at: localDateTime.toISOString(),
      duration_minutes: sessionForm.duration,
      mode: sessionForm.mode,
      location: sessionForm.mode === 'offline' ? sessionForm.location : '',
      meeting_url: resolvedRoomId,
    }

    if (isSupabaseConfigured && currentUser?.id) {
      try {
        const savedSession = await createNewSession(currentUser.id, sessionData)
        if (savedSession) {
          const newSession = {
            ...savedSession,
            partner: selectedPartner,
            subject: sessionData.subject || 'Study Session',
            scheduled_at: sessionData.scheduled_at,
            duration_minutes: sessionData.duration_minutes,
            mode: sessionData.mode,
            meeting_url: resolvedRoomId,
            location: sessionData.location,
            status: 'upcoming'
          }
          localSessions = [newSession, ...localSessions]
          setSessions(localSessions)
        }
      } catch (err) {
        console.error('Failed to save session to Supabase:', err)
      }
    } else {
      const newSession = {
        id: `s_${Date.now()}`,
        partner: selectedPartner,
        subject: sessionData.subject || 'Study Session',
        scheduled_at: sessionData.scheduled_at,
        duration_minutes: sessionData.duration_minutes,
        mode: sessionData.mode,
        meeting_url: resolvedRoomId,
        location: sessionData.location,
        status: 'upcoming',
      }
      localSessions = [newSession, ...localSessions]
      setSessions(localSessions)
    }

    navigate('/sessions')
  }

  const handleMarkAsDone = async (id) => {
    const updated = localSessions.map((session) =>
      session.id === id ? { ...session, status: 'pending_confirmation' } : session
    )
    localSessions = updated
    setSessions(updated)

    if (isSupabaseConfigured) {
      try {
        await updateSessionStatus(id, 'completed')
      } catch (err) {
        console.error('Failed to update session status in Supabase:', err)
        // Rollback optimistic update — revert to 'upcoming'
        const reverted = localSessions.map((session) =>
          session.id === id ? { ...session, status: 'upcoming' } : session
        )
        localSessions = reverted
        setSessions(reverted)
        return
      }
    }

    setTimeout(() => {
      const confirmed = localSessions.map((session) =>
        session.id === id ? { ...session, status: 'completed' } : session
      )
      localSessions = confirmed
      setSessions(confirmed)
    }, 1500)
  }

  const upcomingSessions = (sessions || [])
    .filter((session) => session && (session.status === 'upcoming' || session.status === 'scheduled' || session.status === 'pending_confirmation'))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  const completedSessions = (sessions || []).filter((session) => session && session.status === 'completed')

  const selectedPartner = matchedPartners.find((p) => p.id === sessionForm.partnerId)

  return (
    <>
      <Helmet>
        <title>Sessions - StudyMatch</title>
        <meta name="description" content="Manage your upcoming study sessions and view recent activity." />
      </Helmet>
      <div className="min-h-screen border-t border-[#ECEDE8] bg-[#F9F9F8] text-[#1A1A1A]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
        <div className="absolute left-[8%] top-16 h-56 w-56 rounded-full bg-[#DDEBFF] blur-[86px] opacity-70" />
        <div className="absolute right-[12%] top-20 h-48 w-48 rounded-full bg-[#F5E8D8] blur-[90px] opacity-80" />
      </div>

      <div
        ref={pageRef}
        className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:flex-row lg:gap-12 lg:px-8"
      >
        <nav data-session-reveal className="lg:hidden">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <Link
              to="/sessions/new"
              className={cn(
                'inline-flex min-h-12 items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold tracking-tight shadow-[0_16px_32px_rgba(19,109,236,0.16)]',
                `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING}`,
                isNewSession
                  ? 'bg-[#136DEC] text-white hover:-translate-y-[1px] hover:bg-[#0F60D0]'
                  : 'bg-[#EEF4FF] text-[#136DEC] hover:-translate-y-[1px] hover:bg-[#E4EEFF]'
              )}
            >
              <PlusCircle className="h-4 w-4" />
              New Session
            </Link>
            <Link
              to="/sessions"
              className={cn(
                'inline-flex min-h-12 items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold tracking-tight',
                `motion-safe:transition-[transform,background-color,color,box-shadow] ${TRANSITION_TIMING}`,
                !isNewSession
                  ? 'bg-white text-[#1A1A1A] shadow-[0_14px_28px_rgba(33,43,54,0.05)] hover:-translate-y-[1px]'
                  : 'bg-[rgba(255,255,255,0.8)] text-[#626B76] hover:-translate-y-[1px] hover:bg-white'
              )}
            >
              <Calendar className="h-4 w-4" />
              My Schedule
            </Link>
          </div>
        </nav>

        <aside data-session-reveal className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-28">
            <div className="mb-8 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A93A0]">
                Session Flow
              </p>
              <h2
                className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#1A1A1A]"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Keep it focused.
              </h2>
              <p className="max-w-[16rem] text-sm leading-6 text-[#626B76]">
                Two clear routes only: start a new study block or review what is already on your calendar.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/sessions/new"
                className={cn(
                  'flex min-h-[58px] items-center gap-3 rounded-[24px] px-5 py-4 text-sm font-semibold tracking-tight',
                  `motion-safe:transition-[transform,background-color,box-shadow,color] ${TRANSITION_TIMING}`,
                  isNewSession
                    ? 'bg-[#136DEC] text-white shadow-[0_18px_34px_rgba(19,109,236,0.22)] hover:-translate-y-[1px] hover:bg-[#0F60D0]'
                    : 'bg-white text-[#1A1A1A] shadow-[0_16px_30px_rgba(33,43,54,0.04)] hover:-translate-y-[1px]'
                )}
              >
                <PlusCircle className="h-4 w-4" />
                New Session
              </Link>

              <Link
                to="/sessions"
                className={cn(
                  'flex min-h-[56px] items-center gap-3 rounded-[24px] px-5 py-4 text-sm font-semibold tracking-tight',
                  `motion-safe:transition-[transform,background-color,box-shadow,color] ${TRANSITION_TIMING}`,
                  !isNewSession
                    ? 'bg-white text-[#1A1A1A] shadow-[0_16px_30px_rgba(33,43,54,0.04)] hover:-translate-y-[1px]'
                    : 'text-[#626B76] hover:-translate-y-[1px] hover:bg-white/72'
                )}
              >
                <Calendar className="h-4 w-4" />
                My Schedule
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {isNewSession ? (
            <div className="mx-auto w-full max-w-[840px]">
              <header data-session-reveal className="max-w-[42rem]">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A93A0]">
                  Focused Planning
                </p>
                <h1
                  className="max-w-[12ch] text-[clamp(2.35rem,5vw,4.35rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-[#1A1A1A]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Schedule a session that actually feels intentional.
                </h1>
                <p className="mt-5 max-w-[34rem] text-[15px] leading-7 text-[#626B76] sm:text-base">
                  Strip it down to the essentials. Choose the topic, lock the timing, then decide whether this
                  should happen in a room or through a call.
                </p>
              </header>

              <form
                data-session-reveal
                className="mt-10 rounded-[34px] bg-[rgba(255,255,255,0.82)] px-6 py-7 shadow-[0_30px_80px_rgba(28,38,52,0.04)] ring-1 ring-white/70 backdrop-blur-sm sm:px-8 sm:py-9 lg:px-10 lg:py-10"
                onSubmit={handleCreateSession}
              >
                <section className="pb-10">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                          Session Context
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">
                          Who are you setting this up with?
                        </h2>
                      </div>
                      {selectedPartner && (
                        <div className="inline-flex min-h-11 items-center rounded-full bg-[#EEF4FF] px-4 py-2 text-sm font-medium text-[#136DEC]">
                          With {selectedPartner.full_name}
                        </div>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">
                        Study Partner
                      </span>
                      <div className="relative">
                        <select
                          value={sessionForm.partnerId}
                          onChange={(event) => updateFormField('partnerId', event.target.value)}
                          required
                          disabled={partnersLoading}
                          className="h-[52px] w-full appearance-none rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>
                            {partnersLoading ? 'Loading matches…' : matchedPartners.length === 0 ? 'No matches yet — go swipe!' : 'Select a study partner'}
                          </option>
                          {matchedPartners.map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.full_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A0]" />
                      </div>
                    </label>
                  </div>
                </section>

                <div className="h-px bg-[#ECEEEA]" />

                <section className="py-10">
                  <div className="space-y-9">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                        Step 1
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">Start with the topic.</h2>
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">Subject</span>
                      <div className="relative">
                        <select
                          value={sessionForm.subject}
                          onChange={(event) => updateFormField('subject', event.target.value)}
                          disabled={!sessionForm.partnerId}
                          className="h-[52px] w-full appearance-none rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="" disabled>
                            {sessionForm.partnerId
                              ? 'Choose a shared subject'
                              : 'Select a partner first'}
                          </option>
                          {combinedSubjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A0]" />
                      </div>
                      {sessionForm.partnerId && (
                        <p className="mt-2 text-[12px] text-[#8A93A0]">
                          Showing subjects from you and your partner.
                        </p>
                      )}
                    </label>
                  </div>
                </section>

                <div className="h-px bg-[#ECEEEA]" />

                <section className="py-10">
                  <div className="space-y-9">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                        Step 2
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">Pair the date with a clean start time.</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">Date</span>
                        <div className="relative">
                          <input
                            type="date"
                            value={sessionForm.date}
                            min={todayStr}
                            onChange={(event) => updateFormField('date', event.target.value)}
                            className="h-[52px] w-full rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10"
                          />
                          <Calendar className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A0]" />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">Start Time</span>
                        <div className="relative">
                          <input
                            type="time"
                            value={sessionForm.time}
                            min={minTime}
                            onChange={(event) => updateFormField('time', event.target.value)}
                            className="h-[52px] w-full rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10"
                          />
                          <Clock className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A0]" />
                        </div>
                        {minTime && (
                          <p className="mt-2 text-[12px] text-[#8A93A0]">
                            Must be later than the current time.
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#ECEEEA]" />

                <section className="py-10">
                  <div className="space-y-9">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                        Step 3
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">Pick the study tempo.</h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {DURATIONS.map((duration) => (
                        <button
                          key={duration.value}
                          type="button"
                          onClick={() => updateFormField('duration', duration.value)}
                          className={cn(
                            'min-h-[58px] min-w-[132px] rounded-[22px] px-4 py-3 text-left shadow-[0_10px_24px_rgba(29,42,58,0.03)]',
                            `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${TRANSITION_TIMING} active:scale-[0.98]`,
                            sessionForm.duration === duration.value
                              ? 'bg-[#136DEC] text-white hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_18px_30px_rgba(19,109,236,0.2)]'
                              : 'bg-[#FCFCFB] text-[#374151] ring-1 ring-[#E9ECEF] hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_16px_30px_rgba(29,42,58,0.05)]'
                          )}
                        >
                          <span className="block text-sm font-semibold tracking-tight">{duration.label}</span>
                          <span
                            className={cn(
                              'mt-1 block text-[12px]',
                              sessionForm.duration === duration.value ? 'text-white/78' : 'text-[#8A93A0]'
                            )}
                          >
                            {duration.note}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#ECEEEA]" />

                <section className="py-10">
                  <div className="space-y-9">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                        Step 4
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">Choose where this energy should happen.</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => updateFormField('mode', 'online')}
                        className={cn(
                          'rounded-[26px] px-5 py-5 text-left shadow-[0_14px_28px_rgba(29,42,58,0.03)]',
                          `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${TRANSITION_TIMING} active:scale-[0.98]`,
                          sessionForm.mode === 'online'
                            ? 'bg-[#EEF4FF] text-[#1A1A1A] ring-1 ring-[#136DEC]/14 hover:-translate-y-[1px]'
                            : 'bg-[#FCFCFB] text-[#626B76] ring-1 ring-[#E9ECEF] hover:-translate-y-[1px] hover:bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold tracking-tight">Online session</p>
                            <p className="mt-2 max-w-[22ch] text-sm leading-6 text-[#626B76]">
                              Generate a room and move straight into a video study block.
                            </p>
                          </div>
                          <span
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-[18px]',
                              sessionForm.mode === 'online' ? 'bg-white text-[#136DEC]' : 'bg-[#F4F6F8] text-[#8A93A0]'
                            )}
                          >
                            <Video className="h-4 w-4" />
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateFormField('mode', 'offline')}
                        className={cn(
                          'rounded-[26px] px-5 py-5 text-left shadow-[0_14px_28px_rgba(29,42,58,0.03)]',
                          `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${TRANSITION_TIMING} active:scale-[0.98]`,
                          sessionForm.mode === 'offline'
                            ? 'bg-[#F4F1EA] text-[#1A1A1A] ring-1 ring-[#D8C6AD] hover:-translate-y-[1px]'
                            : 'bg-[#FCFCFB] text-[#626B76] ring-1 ring-[#E9ECEF] hover:-translate-y-[1px] hover:bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold tracking-tight">Offline session</p>
                            <p className="mt-2 max-w-[22ch] text-sm leading-6 text-[#626B76]">
                              Pick a calm location and keep the meetup grounded in the real world.
                            </p>
                          </div>
                          <span
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-[18px]',
                              sessionForm.mode === 'offline' ? 'bg-white text-[#7A5C3A]' : 'bg-[#F4F6F8] text-[#8A93A0]'
                            )}
                          >
                            <MapPin className="h-4 w-4" />
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#ECEEEA]" />

                <section className="pb-2 pt-10">
                  <div className="space-y-9">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">
                        Step 5
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">Add the final detail that makes it real.</h2>
                    </div>

                    {sessionForm.mode === 'online' ? (
                      <div
                        ref={conditionalBlockRef}
                        className="rounded-[28px] bg-[#F4F8FF] px-5 py-5 shadow-[0_16px_34px_rgba(19,109,236,0.05)] ring-1 ring-[#E1EBFB] sm:px-6 sm:py-6"
                      >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                          <div className="max-w-[30rem]">
                            <div className="flex items-center gap-3 text-[#136DEC]">
                              <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white">
                                <LinkIcon className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Meeting room</p>
                                <p className="mt-1 text-sm leading-6 text-[#5F6470]">
                                  Create one clean link for this session. It keeps the room memorable and easy to re-open later.
                                </p>
                              </div>
                            </div>
                          </div>

                          {!generatedLink ? (
                            <button
                              type="button"
                              onClick={handleGenerateLink}
                              className={cn(
                                'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[21px] bg-[#136DEC] px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-[0_16px_32px_rgba(19,109,236,0.18)]',
                                `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_22px_36px_rgba(19,109,236,0.22)] active:scale-[0.98]`
                              )}
                            >
                              <Sparkles className="h-4 w-4" />
                              Generate link
                            </button>
                          ) : (
                            <div className="w-full max-w-[23rem] rounded-[22px] bg-white/88 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                              <p className="truncate text-sm font-semibold tracking-tight text-[#1A1A1A]">
                                {appOrigin}
                                {generatedLink}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={handleCopyLink}
                                  className={cn(
                                    'inline-flex min-h-11 items-center justify-center rounded-[18px] bg-[#136DEC] px-4 py-2 text-sm font-semibold tracking-tight text-white shadow-[0_12px_24px_rgba(19,109,236,0.14)]',
                                    `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#0F60D0] active:scale-[0.98]`
                                  )}
                                >
                                  Copy link
                                </button>
                                <button
                                  type="button"
                                  onClick={handleGenerateLink}
                                  className={cn(
                                    'inline-flex min-h-11 items-center justify-center rounded-[18px] bg-[#EEF4FF] px-4 py-2 text-sm font-semibold tracking-tight text-[#136DEC]',
                                    `motion-safe:transition-[transform,background-color] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#E4EEFF] active:scale-[0.98]`
                                  )}
                                >
                                  Refresh room
                                </button>
                              </div>
                              {copyFeedback && <p className="mt-3 text-xs font-medium text-[#5F6470]">{copyFeedback}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        ref={conditionalBlockRef}
                        className="space-y-5 rounded-[28px] bg-[#F6F3EE] px-5 py-5 shadow-[0_16px_34px_rgba(120,95,58,0.04)] ring-1 ring-[#EEE3D5] sm:px-6 sm:py-6"
                      >
                        <div>
                          <p className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Preferred location</p>
                          <p className="mt-1 text-sm leading-6 text-[#6C655C]">
                            Start with a preset, then customize it if your partner already has a better spot in mind.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {LOCATION_PRESETS.map((locationName) => (
                            <button
                              key={locationName}
                              type="button"
                              onClick={() => updateFormField('location', locationName)}
                              className={cn(
                                'min-h-11 rounded-[18px] px-4 py-2 text-sm font-semibold tracking-tight',
                                `motion-safe:transition-[transform,background-color,color,box-shadow] ${TRANSITION_TIMING} active:scale-[0.98]`,
                                sessionForm.location === locationName
                                  ? 'bg-[#7A5C3A] text-white shadow-[0_14px_24px_rgba(122,92,58,0.18)] hover:-translate-y-[1px]'
                                  : 'bg-white/86 text-[#5C554C] hover:-translate-y-[1px] hover:bg-white'
                              )}
                            >
                              {locationName}
                            </button>
                          ))}
                        </div>

                        <label className="block">
                          <span className="mb-3 block text-sm font-semibold tracking-tight text-[#4E473F]">Custom location</span>
                          <input
                            type="text"
                            value={sessionForm.location}
                            onChange={(event) => updateFormField('location', event.target.value)}
                            placeholder="Add a room, cafe corner, or library floor"
                            className="h-[52px] w-full rounded-[22px] border border-[#E4D9CB] bg-[rgba(255,255,255,0.8)] px-5 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none placeholder:text-[#9A938A] focus:border-[#7A5C3A]/28 focus:ring-4 focus:ring-[#7A5C3A]/10"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </section>

                <div className="mt-12 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className={cn(
                      'inline-flex min-h-[54px] flex-1 items-center justify-center rounded-[23px] bg-[#136DEC] px-6 py-3 text-sm font-semibold tracking-tight text-white shadow-[0_18px_34px_rgba(19,109,236,0.18)]',
                      `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_22px_40px_rgba(19,109,236,0.22)] active:scale-[0.98]`
                    )}
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/sessions')}
                    className={cn(
                      'inline-flex min-h-[54px] items-center justify-center rounded-[23px] bg-white/80 px-6 py-3 text-sm font-semibold tracking-tight text-[#4D5561] shadow-[0_14px_28px_rgba(29,42,58,0.04)] ring-1 ring-[#ECEEEA]',
                      `motion-safe:transition-[transform,background-color,color] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-white hover:text-[#1A1A1A] active:scale-[0.98]`
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[880px] space-y-10">
              <header data-session-reveal className="max-w-[38rem]">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A93A0]">
                  My Schedule
                </p>
                <h1
                  className="text-[clamp(2.1rem,4vw,3.35rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-[#1A1A1A]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Your next focused sessions, all in one calm place.
                </h1>
                <p className="mt-4 max-w-[35rem] text-[15px] leading-7 text-[#626B76] sm:text-base">
                  Keep upcoming sessions visible, mark them done when the work is finished, and jump back into a
                  room when it is time to start.
                </p>
              </header>

              <section data-session-reveal className="space-y-10">
                {sessionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#8A93A0]">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#136DEC]/20 border-t-[#136DEC]" />
                    <p className="mt-4 text-sm font-medium tracking-tight">Loading your schedule…</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="mb-5 flex items-center gap-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">Upcoming</h2>
                        <span className="inline-flex min-h-7 items-center rounded-full bg-[#EEF4FF] px-3 text-[11px] font-semibold text-[#136DEC]">
                          {upcomingSessions.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {upcomingSessions.length > 0 ? (
                          upcomingSessions.map((session) => (
                            <ScheduleCard key={session.id} session={session} isUpcoming onMarkAsDone={handleMarkAsDone} onViewSpot={setSelectedLocationSession} />
                          ))
                        ) : (
                          <div className="rounded-[28px] border border-dashed border-[#E9ECEF] bg-white/40 px-6 py-10 text-center">
                            <p className="text-sm font-medium text-[#8A93A0]">No upcoming sessions scheduled.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-5 flex items-center gap-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">Completed</h2>
                        <span className="inline-flex min-h-7 items-center rounded-full bg-[#EFEFEA] px-3 text-[11px] font-semibold text-[#626B76]">
                          {completedSessions.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {completedSessions.length > 0 ? (
                          completedSessions.map((session) => (
                            <ScheduleCard key={session.id} session={session} isUpcoming={false} onViewSpot={setSelectedLocationSession} />
                          ))
                        ) : (
                          <div className="rounded-[28px] opacity-60 border border-dashed border-[#E9ECEF] bg-white/20 px-6 py-8 text-center">
                            <p className="text-sm font-medium text-[#8A93A0]">No completed sessions yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
      </div>
      <LocationDetailModal
        session={selectedLocationSession}
        onClose={() => setSelectedLocationSession(null)}
      />
    </>
  )
}

function LocationDetailModal({ session, onClose }) {
  if (!session) return null

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location || session.subject)}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[32px] bg-white shadow-[0_32px_64px_rgba(15,23,42,0.18)] ring-1 ring-black/5 animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F1EA] text-[#7A5C3A]">
            <MapPin className="h-6 w-6" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A]" style={{ fontFamily: DISPLAY_FONT }}>
            Study Spot Details
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#626B76]">
            Showing the planned location for your session with <strong>{session.partner?.full_name || 'Study Partner'}</strong>.
          </p>

          <div className="mt-8 space-y-6">
            <div className="rounded-[22px] bg-[#F9F9F8] p-5 ring-1 ring-[#ECEEEA]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A93A0]">Location Name</p>
              <p className="mt-1.5 text-lg font-semibold text-[#1A1A1A]">{session.location || 'Not specified'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[22px] bg-[#F9F9F8] p-5 ring-1 ring-[#ECEEEA]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A93A0]">Date</p>
                <p className="mt-1 text-[15px] font-semibold text-[#1A1A1A]">{formatScheduleDate(session.scheduled_at)}</p>
              </div>
              <div className="rounded-[22px] bg-[#F9F9F8] p-5 ring-1 ring-[#ECEEEA]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A93A0]">Time</p>
                <p className="mt-1 text-[15px] font-semibold text-[#1A1A1A]">{formatScheduleTime(session.scheduled_at)}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[22px] bg-[#1F2A37] px-6 text-sm font-bold tracking-tight text-white shadow-[0_12px_24px_rgba(31,42,55,0.12)]',
                `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#111827] active:scale-[0.98]`
              )}
            >
              <MapPin className="h-4 w-4" />
              Open in Google Maps
            </a>
            <button
              onClick={onClose}
              className={cn(
                'inline-flex min-h-[54px] items-center justify-center rounded-[22px] bg-white px-6 text-sm font-bold tracking-tight text-[#626B76] border border-[#ECEEEA]',
                `motion-safe:transition-[transform,background-color] ${TRANSITION_TIMING} hover:bg-[#F9F9F8] active:scale-[0.98]`
              )}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleCard({ session, isUpcoming, onMarkAsDone, onViewSpot }) {
  const navigate = useNavigate()
  const dateObj = new Date(session.scheduled_at)

  return (
    <article
      className={cn(
        'rounded-[28px] bg-[rgba(255,255,255,0.84)] px-5 py-5 shadow-[0_20px_40px_rgba(29,42,58,0.04)] ring-1 ring-white/80 backdrop-blur-sm sm:px-6',
        !isUpcoming && 'opacity-70'
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-[#EEF4FF] text-[#136DEC]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-[1.45rem] font-bold leading-none">{dateObj.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-[#1A1A1A]">{session.subject}</h3>
            <span
              className={cn(
                'inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold',
                session.mode === 'online' ? 'bg-[#EEF4FF] text-[#136DEC]' : 'bg-[#F4F1EA] text-[#7A5C3A]'
              )}
            >
              {session.mode === 'online' ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {session.mode === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#626B76]">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#8A93A0]" />
              {formatScheduleDate(session.scheduled_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#8A93A0]" />
              {formatScheduleTime(session.scheduled_at)} · {session.duration_minutes}m
            </span>
            <span className="truncate">With {session.partner?.full_name || 'Study Partner'}</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[188px]">
          {session.status === 'pending_confirmation' && (
            <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#FFF5E8] px-4 py-2 text-sm font-semibold text-[#B26B21]">
              <Clock className="h-4 w-4" />
              Waiting for partner
            </div>
          )}

          {session.status === 'upcoming' && (
            <>
              {session.mode === 'online' ? (
                <button
                  onClick={() => navigate(`/meet/${session.meeting_url || `study-session-${session.id}`}`)}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#1F2A37] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,42,55,0.16)]',
                    `motion-safe:transition-[transform,background-color,box-shadow] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#111827] active:scale-[0.98]`
                  )}
                >
                  <Video className="h-4 w-4" />
                  Join Meet
                </button>
              ) : (
                <button
                  onClick={() => onViewSpot(session)}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#F4F1EA] px-4 py-2 text-sm font-semibold text-[#7A5C3A]',
                    `motion-safe:transition-[transform,background-color] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#EFE7DB] active:scale-[0.98]`
                  )}
                >
                  <MapPin className="h-4 w-4" />
                  View Spot
                </button>
              )}

              <button
                onClick={() => onMarkAsDone(session.id)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#EDF8F1] px-4 py-2 text-sm font-semibold text-[#2F7D4C]',
                  `motion-safe:transition-[transform,background-color] ${TRANSITION_TIMING} hover:-translate-y-[1px] hover:bg-[#E5F3EA] active:scale-[0.98]`
                )}
              >
                <CircleCheck className="h-4 w-4" />
                Mark Done
              </button>
            </>
          )}

          {session.status === 'completed' && (
            <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#F3F4F5] px-4 py-2 text-sm font-semibold text-[#7A828D]">
              <CircleCheck className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
