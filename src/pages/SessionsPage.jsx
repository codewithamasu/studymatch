import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Link as LinkIcon,
  MapPin,
  PlusCircle,
  Sparkles,
  Video,
} from 'lucide-react'
import { mockMatches, mockSessions, mockUsers } from '@/data/mockData'

let localSessions = [...mockSessions]

const SUBJECTS = [
  'Calculus',
  'Linear Algebra',
  'Data Structures',
  'Algorithms',
  'Statistics',
  'Physics',
  'Web Development',
  'Machine Learning',
]

const DURATIONS = [
  { label: '45 min', value: 45, note: 'Quick check-in' },
  { label: '90 min', value: 90, note: 'Deep focus' },
  { label: '2 hours', value: 120, note: 'Problem solving' },
  { label: '3 hours', value: 180, note: 'Long review' },
]

const LOCATION_PRESETS = ['Campus Library', 'Quiet Study Hall', 'Student Cafe']

const transitionTiming = 'duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'
const displayFont = '"Fraunces", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'

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
  const appOrigin = typeof window === 'undefined' ? '' : window.location.origin

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

  const handleCreateSession = (event) => {
    event.preventDefault()

    const selectedPartner =
      mockMatches.find((match) => match.partner.id === sessionForm.partnerId)?.partner || mockUsers[0]

    const resolvedRoomId =
      sessionForm.mode === 'online'
        ? (generatedLink.replace('/meet/', '') || createRoomId())
        : null

    const newSession = {
      id: `s_${Date.now()}`,
      partner: selectedPartner,
      subject: sessionForm.subject || 'Study Session',
      scheduled_at: `${sessionForm.date || new Date().toISOString().split('T')[0]}T${sessionForm.time || '12:00'}:00Z`,
      duration_minutes: sessionForm.duration,
      mode: sessionForm.mode,
      meeting_room_id: resolvedRoomId,
      location: sessionForm.mode === 'offline' ? sessionForm.location : '',
      status: 'upcoming',
    }

    localSessions = [newSession, ...localSessions]
    setSessions(localSessions)
    navigate('/sessions')
  }

  const handleMarkAsDone = (id) => {
    const updated = localSessions.map((session) =>
      session.id === id ? { ...session, status: 'pending_confirmation' } : session
    )
    localSessions = updated
    setSessions(updated)

    setTimeout(() => {
      const confirmed = localSessions.map((session) =>
        session.id === id ? { ...session, status: 'completed' } : session
      )
      localSessions = confirmed
      setSessions(confirmed)
    }, 3000)
  }

  const upcomingSessions = sessions.filter(
    (session) => session.status === 'upcoming' || session.status === 'pending_confirmation'
  )
  const completedSessions = sessions.filter((session) => session.status === 'completed')

  const selectedPartner = mockMatches.find((match) => match.partner.id === sessionForm.partnerId)?.partner

  return (
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
                `motion-safe:transition-[transform,background-color,box-shadow] ${transitionTiming}`,
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
                `motion-safe:transition-[transform,background-color,color,box-shadow] ${transitionTiming}`,
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
                style={{ fontFamily: displayFont }}
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
                  `motion-safe:transition-[transform,background-color,box-shadow,color] ${transitionTiming}`,
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
                  `motion-safe:transition-[transform,background-color,box-shadow,color] ${transitionTiming}`,
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
                  style={{ fontFamily: displayFont }}
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
                          className="h-[52px] w-full appearance-none rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10"
                        >
                          <option value="" disabled>
                            Select a study partner
                          </option>
                          {mockMatches.map((match) => (
                            <option key={match.partner.id} value={match.partner.id}>
                              {match.partner.full_name}
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
                          className="h-[52px] w-full appearance-none rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10"
                        >
                          <option value="" disabled>
                            Choose the subject you want to focus on
                          </option>
                          {SUBJECTS.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
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
                            onChange={(event) => updateFormField('time', event.target.value)}
                            className="h-[52px] w-full rounded-[22px] border border-[#E9ECEF] bg-[#FCFCFB] px-5 pr-12 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10"
                          />
                          <Clock className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A0]" />
                        </div>
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
                            `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${transitionTiming} active:scale-[0.98]`,
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
                          `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${transitionTiming} active:scale-[0.98]`,
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
                          `motion-safe:transition-[transform,background-color,color,box-shadow,border-color] ${transitionTiming} active:scale-[0.98]`,
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
                                `motion-safe:transition-[transform,background-color,box-shadow] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_22px_36px_rgba(19,109,236,0.22)] active:scale-[0.98]`
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
                                    `motion-safe:transition-[transform,background-color,box-shadow] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#0F60D0] active:scale-[0.98]`
                                  )}
                                >
                                  Copy link
                                </button>
                                <button
                                  type="button"
                                  onClick={handleGenerateLink}
                                  className={cn(
                                    'inline-flex min-h-11 items-center justify-center rounded-[18px] bg-[#EEF4FF] px-4 py-2 text-sm font-semibold tracking-tight text-[#136DEC]',
                                    `motion-safe:transition-[transform,background-color] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#E4EEFF] active:scale-[0.98]`
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
                            Start with a preset, then customize it if the group already has a better spot in mind.
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
                                `motion-safe:transition-[transform,background-color,color,box-shadow] ${transitionTiming} active:scale-[0.98]`,
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
                      `motion-safe:transition-[transform,background-color,box-shadow] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_22px_40px_rgba(19,109,236,0.22)] active:scale-[0.98]`
                    )}
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/sessions')}
                    className={cn(
                      'inline-flex min-h-[54px] items-center justify-center rounded-[23px] bg-white/80 px-6 py-3 text-sm font-semibold tracking-tight text-[#4D5561] shadow-[0_14px_28px_rgba(29,42,58,0.04)] ring-1 ring-[#ECEEEA]',
                      `motion-safe:transition-[transform,background-color,color] ${transitionTiming} hover:-translate-y-[1px] hover:bg-white hover:text-[#1A1A1A] active:scale-[0.98]`
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
                  style={{ fontFamily: displayFont }}
                >
                  Your next focused sessions, all in one calm place.
                </h1>
                <p className="mt-4 max-w-[35rem] text-[15px] leading-7 text-[#626B76] sm:text-base">
                  Keep upcoming sessions visible, mark them done when the work is finished, and jump back into a
                  room when it is time to start.
                </p>
              </header>

              <section data-session-reveal className="space-y-10">
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8A93A0]">Upcoming</h2>
                    <span className="inline-flex min-h-7 items-center rounded-full bg-[#EEF4FF] px-3 text-[11px] font-semibold text-[#136DEC]">
                      {upcomingSessions.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <ScheduleCard key={session.id} session={session} isUpcoming onMarkAsDone={handleMarkAsDone} />
                    ))}
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
                    {completedSessions.map((session) => (
                      <ScheduleCard key={session.id} session={session} isUpcoming={false} />
                    ))}
                  </div>
                </div>
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
  )
}

function ScheduleCard({ session, isUpcoming, onMarkAsDone }) {
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
            <span className="truncate">With {session.partner.full_name}</span>
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
                  onClick={() => navigate(`/meet/${session.meeting_room_id || `study-session-${session.id}`}`)}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#1F2A37] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,42,55,0.16)]',
                    `motion-safe:transition-[transform,background-color,box-shadow] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#111827] active:scale-[0.98]`
                  )}
                >
                  <Video className="h-4 w-4" />
                  Join Meet
                </button>
              ) : (
                <button
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#F4F1EA] px-4 py-2 text-sm font-semibold text-[#7A5C3A]',
                    `motion-safe:transition-[transform,background-color] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#EFE7DB] active:scale-[0.98]`
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
                  `motion-safe:transition-[transform,background-color] ${transitionTiming} hover:-translate-y-[1px] hover:bg-[#E5F3EA] active:scale-[0.98]`
                )}
              >
                <CheckCircle className="h-4 w-4" />
                Mark Done
              </button>
            </>
          )}

          {session.status === 'completed' && (
            <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#F3F4F5] px-4 py-2 text-sm font-semibold text-[#7A828D]">
              <CheckCircle className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
