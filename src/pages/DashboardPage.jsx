import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Flame,
  Users,
  Video,
  MapPin,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  BookOpen,
  Star,
  Award,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  calculateXp,
  getLevel,
  TIER_NAMES,
  TIER_ICONS,
  LEVEL_THRESHOLDS,
} from '@/lib/studymatchRealtime'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import gsap from 'gsap'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'

// ─── Constants ────────────────────────────────────────────────────────────────
// Shared with DESIGN SYSTEM constants

// ─── XP Helpers ───────────────────────────────────────────────────────────────
function getXpForNextLevel(level) {
  return LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)]
}

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const avatar = (seed, size = '32') =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4&radius=50&size=${size}`

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const difMs = new Date(targetDate) - Date.now()
  const totalMins = Math.max(0, Math.floor(difMs / 60000))
  if (totalMins <= 0) return null
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Skeleton Components ──────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-neutral-200/70 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome skeleton */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Match alerts skeleton */}
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left */}
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-20 rounded-xl" />
          </div>
          {/* Center */}
          <Skeleton className="h-80 rounded-2xl" />
          {/* Right */}
          <Skeleton className="h-80 rounded-2xl" />
        </div>

        {/* Sessions skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session }) {
  const countdown = useCountdown(session.scheduled_at)
  const date = new Date(session.scheduled_at)
  const isOnline = session.mode === 'online'

  return (
    <div
      role="article"
      aria-label={`Session ${session.subject} with ${session.partner?.full_name}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200/70 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300"
    >
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200/60 flex flex-col items-center justify-center"
      >
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest leading-none">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <time
          dateTime={date.toISOString()}
          className="text-lg font-bold text-neutral-900 leading-tight"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          {date.getDate()}
        </time>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-900 text-sm truncate">{session.subject}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-neutral-500">
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="text-xs text-neutral-500">{session.duration_minutes}min</span>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="text-xs text-neutral-500">{session.partner?.full_name || 'Partner'}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isOnline
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}
        >
          {isOnline
            ? <Video className="w-2.5 h-2.5" aria-hidden="true" />
            : <MapPin className="w-2.5 h-2.5" aria-hidden="true" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {countdown && (
          <span className="text-[10px] text-neutral-400">in {countdown}</span>
        )}
      </div>
    </div>
  )
}

// ─── Match Alert Chip ─────────────────────────────────────────────────────────
function MatchAlertChip({ alert, isNew }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(`/chat/${alert.partner?.id}`)}
      aria-label={`Open chat with ${alert.partner?.full_name}`}
      className="group flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-2xl"
    >
      <div className="relative">
        <img
          src={avatar(alert.partner?.full_name || 'user')}
          alt=""
          aria-hidden="true"
          className="w-14 h-14 rounded-2xl border-2 border-white ring-2 ring-blue-200/60 group-hover:ring-blue-400 transition-all duration-300 object-cover"
        />
        {isNew && (
          <span
            aria-label="New match"
            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white"
          />
        )}
      </div>
      <span className="text-[11px] font-medium text-neutral-600 group-hover:text-blue-600 transition-colors duration-200 max-w-[60px] truncate">
        {alert.partner?.full_name?.split(' ')[0] || 'Partner'}
      </span>
    </button>
  )
}

// ─── Subject Mastery Radar ────────────────────────────────────────────────────
function SubjectOrbit({ subjectMastery }) {
  const entries = Object.entries(subjectMastery || {}).slice(0, 6)

  if (entries.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
        <BookOpen className="w-8 h-8 opacity-40" aria-hidden="true" />
        <p className="text-sm text-center">Complete onboarding to see your subjects.</p>
      </div>
    )
  }

  const radarData = entries.map(([name, score]) => ({
    subject: name.length > 12 ? name.slice(0, 10) + '…' : name,
    A: score,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={radarData} outerRadius="75%">
        <PolarGrid stroke="#e5e7eb" strokeDasharray="4 4" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
        />
        <Radar
          name="Mastery"
          dataKey="A"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─── Campus Leaders (Gamification) ────────────────────────────────────────────
function CampusLeaders({ leaders }) {
  if (!leaders || leaders.length === 0) return null

  return (
    <section
      aria-labelledby="leaders-heading"
      className="bg-white border border-neutral-200/70 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="leaders-heading"
            className="text-[17px] font-bold text-neutral-900 tracking-tight"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Campus Leaders
          </h2>
          <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-widest font-medium">Top Match of the Week</p>
        </div>
        <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
      </div>

      <div className="space-y-[2px]">
        {leaders.map((leader, i) => {
          const { tier, badge } = leader
          return (
            <div key={leader.id} className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-neutral-50/80 transition-all duration-300">
              <div className="flex flex-col items-center justify-center w-5 shrink-0">
                <span className="text-[13px] font-bold text-neutral-400 group-hover:text-blue-500 transition-colors">{i + 1}</span>
              </div>
              <img
                src={avatar(leader.name, '36')}
                alt=""
                className="w-9 h-9 rounded-full border border-neutral-100 object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-neutral-900 truncate leading-tight mb-0.5">
                  {leader.name}
                </p>
                <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1 font-medium">
                  {badge} {tier}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[14px] font-bold text-[#1a56db] tracking-tight">{leader.xp.toLocaleString()}</span>
                <span className="text-[9px] text-neutral-400 block -mt-[3px] font-bold tracking-wider uppercase">XP</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }) {
  const ref = useRef(null)
  const prev = useRef(0)
  useEffect(() => {
    if (!ref.current) return
    const obj = { val: prev.current }
    const tween = gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate() {
        if (ref.current) ref.current.textContent = Math.round(obj.val) + suffix
      },
    })
    prev.current = value
    return () => tween.kill()
  }, [value, suffix])
  return <span ref={ref} aria-live="polite">{value}{suffix}</span>
}

// ─── Refactored Social Pulse (Unified Module) ─────────────────────────────────
function UnifiedSocialPulse({ upcomingSessions, socialPulse, matchAlerts, navigate }) {
  const topSession = upcomingSessions?.[0]
  const topMessages = socialPulse?.slice(0, 3) || []
  const newMatches = matchAlerts?.slice(0, 3) || []

  return (
    <section
      aria-labelledby="pulse-heading"
      className="bg-white rounded-2xl p-6 flex flex-col gap-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-neutral-100/60"
    >
      <div className="flex items-center justify-between">
        <h2
          id="pulse-heading"
          className="text-[22px] font-bold text-neutral-900 tracking-[-0.03em]"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          Social Pulse
        </h2>
        <TrendingUp className="w-5 h-5 text-neutral-300" aria-hidden="true" />
      </div>

      {/* Primary: Upcoming Session (Only 1) */}
      {topSession && (
        <div className="flex flex-col gap-3 relative">
          <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">Up Next</p>
          <button
            onClick={() => navigate('/sessions')}
            className="group relative flex items-start gap-4 p-4 rounded-xl bg-neutral-50/70 hover:bg-[#F4F7FB] transition-colors duration-300 w-full text-left"
            style={{ transitionTimingFunction: TRANSITION_TIMING }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-5 left-4" />
            <div className="flex-1 min-w-0 pl-4">
              <p className="font-semibold text-neutral-900 text-[15px] truncate">
                {topSession.subject}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-500 font-medium tracking-tight">
                  with {topSession.partner?.full_name?.split(' ')[0] || 'Partner'}
                </span>
                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                <span className="text-xs text-neutral-400">
                  {new Date(topSession.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-500 transition-colors self-center shrink-0" />
          </button>
        </div>
      )}

      {/* Secondary: Unread Messages (Max 3) */}
      {topMessages.length > 0 && (
        <div className="flex flex-col gap-3">
           <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">Recent</p>
           <div className="flex flex-col gap-1" aria-live="polite">
             {topMessages.map(msg => (
               <button
                 key={msg.id}
                 onClick={() => navigate('/chat')}
                 className="group flex items-center gap-3 py-2 -mx-2 px-2 rounded-lg hover:bg-neutral-50/80 transition-all duration-300 text-left"
                 style={{ transitionTimingFunction: TRANSITION_TIMING }}
               >
                 <img
                   src={avatar(msg.avatarSeed || msg.senderName, '40')}
                   alt=""
                   className="w-10 h-10 rounded-full border border-neutral-100 object-cover shrink-0"
                 />
                 <div className="flex-1 min-w-0 pr-2">
                   <p className="text-[14px] font-semibold text-neutral-900 tracking-tight leading-none mb-1 flex items-center gap-1.5">
                     {msg.senderName}
                     {msg.badge && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-label="Unread" />}
                   </p>
                   <p className="text-[13px] text-neutral-500 leading-snug truncate">
                     {msg.action}
                   </p>
                 </div>
               </button>
             ))}
           </div>
        </div>
      )}

      {/* Tertiary: New Matches */}
      {newMatches.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
           <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">New Connections</p>
           <div className="flex items-center gap-3" aria-live="polite">
             {newMatches.map(match => (
               <button
                 key={match.matchId}
                 onClick={() => navigate(`/chat/${match.partner?.id}`)}
                 className="group flex flex-col items-center gap-1.5 hover:-translate-y-0.5 transition-transform duration-300"
                 style={{ transitionTimingFunction: TRANSITION_TIMING }}
               >
                  <div className="relative">
                    <img
                      src={avatar(match.partner?.full_name || 'user', '48')}
                      alt=""
                      className="w-12 h-12 rounded-full border border-neutral-100 object-cover relative z-10"
                    />
                    <div className="match-pulse absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-sm -z-0" />
                  </div>
                 <span className="text-[11px] font-medium text-neutral-600 tracking-tight group-hover:text-blue-600 transition-colors">
                   {match.partner?.full_name?.split(' ')[0] || 'Partner'}
                 </span>
               </button>
             ))}
             {matchAlerts.length > 3 && (
               <button
                 onClick={() => navigate('/discover')}
                 className="w-12 h-12 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-blue-500 hover:border-blue-300 transition-colors mb-4"
               >
                 <TrendingUp className="w-4 h-4" />
               </button>
             )}
           </div>
        </div>
      )}

      {(!topSession && topMessages.length === 0 && newMatches.length === 0) && (
        <div className="py-8 text-center text-sm text-neutral-400">
          No recent activity to show.
        </div>
      )}
    </section>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const {
    stats,
    studyPartnerCount,
    upcomingSessions,
    matchAlerts,
    socialPulse,
    campusLeaders,
    loading,
    error,
    loadDashboard,
    subscribeRealtime,
    unsubscribeRealtime,
  } = useDashboardStore()

  const pageRef = useRef(null)

  // ── Data Fetch + Realtime Subscribe ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    loadDashboard(user.id)
    subscribeRealtime(user.id)
    return () => unsubscribeRealtime()
  }, [user?.id, loadDashboard, subscribeRealtime, unsubscribeRealtime])

  // ── GSAP Entrance ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || error) return
    const ctx = gsap.context(() => {
      gsap.from('.dash-section', {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'all',
      })

      // Wave emoji animation
      gsap.to('.welcome-hand', {
        rotation: 20,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: '70% 70%'
      })

      // Pulsar for match alerts
      gsap.to('.match-pulse', {
        scale: 1.05,
        opacity: 0.6,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      })
    }, pageRef)
    return () => ctx.revert()
  }, [loading, error])

  // ── Derived XP / Level ───────────────────────────────────────────────────
  const xp = calculateXp(stats)
  const level = getLevel(xp)
  const nextLevelXp = getXpForNextLevel(level)
  const prevLevelXp = LEVEL_THRESHOLDS[level]
  const xpProgress = nextLevelXp > prevLevelXp
    ? ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100
    : 100

  const subjectMastery = user?.study_profile?.subject_mastery || {}
  const completionRate = stats.total_sessions
    ? Math.round((stats.completed_sessions / stats.total_sessions) * 100)
    : 0

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center pt-16 px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-neutral-900 mb-1">Failed to load dashboard</p>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard(user?.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1a56db] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main
      ref={pageRef}
      className="min-h-screen bg-[#F9F9F8] pt-20 pb-12 px-4 sm:px-6"
      aria-label="Dashboard"
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Welcome Row ──────────────────────────────────────────────────── */}
        <div className="dash-section flex items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.045em] text-neutral-900"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Welcome,{' '}
              <span className="text-[#1a56db]">{user?.full_name?.split(' ')[0] || 'Buddy'}</span>{' '}
              <span className="welcome-hand inline-block">👋</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>
          <Link
            to="/discover"
            aria-label="Find a new study partner"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#1a56db] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200/60 transition-colors duration-200"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Find Partner
          </Link>
        </div>

        {/* Removed redundant Match Alerts section - now unified in Social Pulse */}

        {/* ── Main Grid ─────────────────────────────────────────────────────── */}
        <div className="dash-section grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT — Rank / XP (derived from sessions + study hours) */}
          <div className="space-y-4">
            <section
              className="bg-white border border-neutral-200/70 rounded-2xl p-5"
              role="region"
              aria-labelledby="rank-xp-heading"
            >
              <div className="flex items-start justify-between mb-3">
                <div id="rank-xp-heading">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    Rank / Tier
                  </p>
                  <h2
                    className="text-2xl font-bold text-neutral-900 tracking-tight"
                    style={{ fontFamily: DISPLAY_FONT }}
                  >
                    {TIER_ICONS[level]} {TIER_NAMES[level]}
                  </h2>
                </div>
                <div
                  aria-label="XP Badge"
                  className="flex items-center gap-1 bg-[#EFF6FF] text-[#1a56db] text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200"
                >
                  <Zap className="w-3 h-3" aria-hidden="true" />
                  XP
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold text-[#1a56db]">
                  <AnimatedNumber value={xp} /> XP
                </span>
                <span className="text-neutral-400 text-xs">Level {level} → {level + 1}</span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={Math.round(xpProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress XP: ${Math.round(xpProgress)}%`}
                className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-3"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#1a56db] to-[#60a5fa] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, xpProgress)}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-400">
                {Math.max(0, nextLevelXp - xp)} XP more for{' '}
                <span className="text-neutral-700 font-medium">
                  {TIER_NAMES[Math.min(level + 1, TIER_NAMES.length - 1)]}
                </span>
              </p>
            </section>

            {/* Quick Stats (real data: sessions + matches from Supabase) */}
            <section
              role="region"
              aria-labelledby="quick-stats-heading"
            >
              <h2 id="quick-stats-heading" className="sr-only">Study Statistics</h2>
              <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sessions Done', value: stats.completed_sessions, icon: Calendar, suffix: '' },
                { label: 'Study Hours', value: stats.total_study_hours, icon: Clock, suffix: 'h' },
                { label: 'Study Streak', value: stats.study_streak, icon: Flame, suffix: '🔥' },
                { label: 'Partners', value: studyPartnerCount, icon: Users, suffix: '' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="bg-white border border-neutral-200/70 rounded-xl p-3.5 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4 text-neutral-400 mb-1.5" aria-hidden="true" />
                    <p className="text-xl font-bold text-neutral-900 leading-none">
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{stat.label}</p>
                  </div>
                )
              })}
              </div>
            </section>

            {/* Completion Rate (real data: completed_sessions / total_sessions) */}
            <section
              className="bg-white border border-neutral-200/70 rounded-xl p-4"
              role="region"
              aria-labelledby="completion-rate-heading"
            >
              <div className="flex items-center justify-between mb-2">
                <span id="completion-rate-heading" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                  Completion Rate
                </span>
                <span className="text-sm font-bold text-neutral-900">{completionRate}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-1.5 bg-neutral-100 rounded-full"
              >
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                {stats.completed_sessions}/{stats.total_sessions} sessions completed
              </p>
            </section>
          </div>

          {/* CENTER — Subject Mastery Orbit & Campus Leaders */}
          <div className="space-y-4 dash-section">
            <section
              aria-labelledby="mastery-heading"
              className="bg-white border border-neutral-200/70 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2
                    id="mastery-heading"
                    className="text-lg font-bold text-neutral-900 tracking-tight"
                    style={{ fontFamily: DISPLAY_FONT }}
                  >
                    Subject Mastery
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Ability score per subject</p>
                </div>
                {stats.favorite_subject !== 'None yet' && (
                  <div
                    aria-label={`Favorite subject: ${stats.favorite_subject}`}
                    className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                  >
                    <Star className="w-3 h-3" aria-hidden="true" />
                    {stats.favorite_subject}
                  </div>
                )}
              </div>
              <div className="h-[260px] sm:h-[300px]">
                <SubjectOrbit subjectMastery={subjectMastery} />
              </div>
            </section>

            {/* Gamification Module */}
            <CampusLeaders leaders={campusLeaders} />
          </div>

          {/* RIGHT — Refactored Social Pulse Module */}
          <div className="dash-section">
            <UnifiedSocialPulse
              upcomingSessions={upcomingSessions}
              socialPulse={socialPulse}
              matchAlerts={matchAlerts}
              navigate={navigate}
            />
          </div>
        </div>

        {/* Removed redundant Upcoming Sessions section - now integrated as Primary in Social Pulse */}

      </div>
    </main>
  )
}
