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
  MessageCircle,
  Star,
  Award,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
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

// ─── Constants ────────────────────────────────────────────────────────────────
const displayFont =
  '"Fraunces", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'

const XP_PER_HOUR = 40
const XP_PER_SESSION = 60
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 4500, 6500, 9000, 12000, 16000]
const TIER_NAMES = [
  'Curious Mind', 'Deep Diver', 'Study Spark', 'Knowledge Seeker',
  'Focus Champion', 'Code Wizard', 'Algorithm Ace', 'Data Master',
  'Research Guru', 'Academic Legend', 'Study God',
]
const TIER_ICONS = ['🌱', '🔍', '⚡', '📚', '🏆', '🧙', '⚙️', '📊', '🔬', '🎓', '👑']

// ─── XP Helpers ───────────────────────────────────────────────────────────────
function computeXp(stats) {
  return (stats.total_study_hours || 0) * XP_PER_HOUR +
    (stats.completed_sessions || 0) * XP_PER_SESSION
}
function getLevel(xp) {
  let level = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i
    else break
  }
  return Math.min(level, LEVEL_THRESHOLDS.length - 1)
}
function getXpForNextLevel(level) {
  return LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)]
}

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const avatar = (seed, size = '32') =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4&radius=50&size=${size}`

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [diff, setDiff] = [
    new Date(targetDate) - Date.now(),
    () => {},
  ]
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
      aria-label={`Sesi ${session.subject} bersama ${session.partner?.full_name}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200/70 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300"
    >
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200/60 flex flex-col items-center justify-center"
      >
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest leading-none">
          {date.toLocaleDateString('id-ID', { month: 'short' })}
        </span>
        <time
          dateTime={date.toISOString()}
          className="text-lg font-bold text-neutral-900 leading-tight"
          style={{ fontFamily: displayFont }}
        >
          {date.getDate()}
        </time>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-900 text-sm truncate">{session.subject}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-neutral-500">
            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
      aria-label={`Buka chat dengan ${alert.partner?.full_name}`}
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
            aria-label="Match baru"
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
        <p className="text-sm text-center">Selesaikan onboarding untuk melihat subjekmu.</p>
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

// ─── Social Pulse Feed ───────────────────────────────────────────────────────
function SocialPulseItem({ item }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors duration-150">
      <img
        src={avatar(item.avatarSeed || item.senderName, '28')}
        alt=""
        aria-hidden="true"
        className="w-8 h-8 rounded-xl flex-shrink-0 border border-neutral-200"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-700 leading-snug">
          <span className="font-semibold text-neutral-900">{item.senderName}</span>{' '}
          {item.action}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{item.time}</p>
      </div>
      <span className="text-base flex-shrink-0" aria-hidden="true">{item.badge}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const {
    stats,
    studyPartnerCount,
    upcomingSessions,
    matchAlerts,
    socialPulse,
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
    }, pageRef)
    return () => ctx.revert()
  }, [loading, error])

  // ── Derived XP / Level ───────────────────────────────────────────────────
  const xp = computeXp(stats)
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
          <p className="font-semibold text-neutral-900 mb-1">Dashboard gagal dimuat</p>
          <p className="text-sm text-neutral-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard(user?.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1a56db] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Coba Lagi
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
              style={{ fontFamily: displayFont }}
            >
              Selamat datang,{' '}
              <span className="text-[#1a56db]">{user?.full_name?.split(' ')[0] || 'Sobat'}</span> 👋
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>
          <Link
            to="/discover"
            aria-label="Cari partner belajar baru"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#1a56db] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200/60 transition-colors duration-200"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Cari Partner
          </Link>
        </div>

        {/* ── Match Alerts (real data: matches + profiles) ──────────────────── */}
        {matchAlerts.length > 0 && (
          <section aria-labelledby="match-alerts-heading" className="dash-section">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="match-alerts-heading"
                className="text-sm font-semibold text-neutral-900 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
                Match Alerts
                <span className="text-xs font-normal text-neutral-400">
                  ({matchAlerts.length} partner tersedia)
                </span>
              </h2>
              <Link
                to="/chat"
                className="text-xs text-neutral-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                Buka Chat <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
            <div
              role="list"
              aria-label="Daftar partner yang sudah match"
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            >
              {matchAlerts.map((alert, i) => (
                <div role="listitem" key={alert.matchId}>
                  <MatchAlertChip alert={alert} isNew={i < 3} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Main Grid ─────────────────────────────────────────────────────── */}
        <div className="dash-section grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT — Rank / XP (derived from sessions + study hours) */}
          <div className="space-y-4">
            <div
              className="bg-white border border-neutral-200/70 rounded-2xl p-5"
              aria-label={`Rank kamu: ${TIER_NAMES[level]}, Level ${level}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    Rank / Tier
                  </p>
                  <h2
                    className="text-2xl font-bold text-neutral-900 tracking-tight"
                    style={{ fontFamily: displayFont }}
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
                {Math.max(0, nextLevelXp - xp)} XP lagi untuk{' '}
                <span className="text-neutral-700 font-medium">
                  {TIER_NAMES[Math.min(level + 1, TIER_NAMES.length - 1)]}
                </span>
              </p>
            </div>

            {/* Quick Stats (real data: sessions + matches from Supabase) */}
            <div className="grid grid-cols-2 gap-3" role="region" aria-label="Statistik Belajar">
              {[
                { label: 'Sesi Selesai', value: stats.completed_sessions, icon: Calendar, suffix: '' },
                { label: 'Jam Belajar', value: stats.total_study_hours, icon: Clock, suffix: 'h' },
                { label: 'Study Streak', value: stats.study_streak, icon: Flame, suffix: '🔥' },
                { label: 'Partners', value: studyPartnerCount, icon: Users, suffix: '' },
              ].map(({ label, value, icon: Icon, suffix }) => (
                <div
                  key={label}
                  className="bg-white border border-neutral-200/70 rounded-xl p-3.5 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200"
                >
                  <Icon className="w-4 h-4 text-neutral-400 mb-1.5" aria-hidden="true" />
                  <p className="text-xl font-bold text-neutral-900 leading-none">
                    <AnimatedNumber value={value} suffix={suffix} />
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Completion Rate (real data: completed_sessions / total_sessions) */}
            <div
              className="bg-white border border-neutral-200/70 rounded-xl p-4"
              aria-label={`Completion rate: ${completionRate}%`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
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
                {stats.completed_sessions}/{stats.total_sessions} sesi selesai
              </p>
            </div>
          </div>

          {/* CENTER — Subject Mastery Orbit (real data: profile_subjects from user.study_profile) */}
          <section
            aria-labelledby="mastery-heading"
            className="bg-white border border-neutral-200/70 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2
                  id="mastery-heading"
                  className="text-lg font-bold text-neutral-900 tracking-tight"
                  style={{ fontFamily: displayFont }}
                >
                  Subject Mastery
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">Skor kemampuan per subjek</p>
              </div>
              {stats.favorite_subject !== 'Belum ada' && (
                <div
                  aria-label={`Subjek favorit: ${stats.favorite_subject}`}
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

          {/* RIGHT — Social Pulse (real data: messages from partner conversations, live via Realtime) */}
          <section
            aria-labelledby="pulse-heading"
            aria-live="polite"
            aria-atomic="false"
            className="bg-white border border-neutral-200/70 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                id="pulse-heading"
                className="text-lg font-bold text-neutral-900"
                style={{ fontFamily: displayFont }}
              >
                Social Pulse
              </h2>
              <TrendingUp className="w-4 h-4 text-neutral-400" aria-hidden="true" />
            </div>

            {socialPulse.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
                <MessageCircle className="w-8 h-8 text-neutral-300" aria-hidden="true" />
                <p className="text-sm text-neutral-500">
                  Belum ada aktivitas. Partner kamu akan muncul di sini saat mereka mengirim pesan.
                </p>
              </div>
            ) : (
              <div className="space-y-1 flex-1">
                {socialPulse.map((item) => (
                  <SocialPulseItem key={item.id} item={item} />
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-neutral-100">
              <Link
                to="/chat"
                aria-label="Buka semua percakapan"
                className="flex items-center justify-center gap-2 w-full text-sm font-medium text-[#1a56db] hover:bg-blue-50 py-2.5 rounded-xl border border-blue-100 transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                Buka Chat
              </Link>
            </div>
          </section>
        </div>

        {/* ── Upcoming Sessions (real data: sessions + session_participants from Supabase) ── */}
        <section aria-labelledby="sessions-heading" className="dash-section">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="sessions-heading"
              className="text-lg font-bold text-neutral-900 flex items-center gap-2"
              style={{ fontFamily: displayFont }}
            >
              <Calendar className="w-4 h-4 text-neutral-400" aria-hidden="true" />
              Upcoming Sessions
            </h2>
            <Link
              to="/sessions"
              className="text-xs text-neutral-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              Lihat semua <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="bg-white border border-neutral-200/70 rounded-2xl p-8 text-center">
              <Award className="w-8 h-8 text-neutral-300 mx-auto mb-3" aria-hidden="true" />
              <p className="font-medium text-neutral-700 mb-1">Belum ada sesi terjadwal</p>
              <p className="text-sm text-neutral-400 mb-4">
                Match dengan partner dan jadwalkan sesi pertamamu!
              </p>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1a56db] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors duration-200"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Mulai Discover
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {upcomingSessions.slice(0, 4).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
