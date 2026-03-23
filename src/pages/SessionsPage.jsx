import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  fetchConversationSummaries,
  createSession,
  fetchMySessions,
  respondToSessionInvite,
  markSessionComplete,
} from '@/lib/studymatchRealtime'
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  Clock,
  Video,
  MapPin,
  Info,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Bell,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const DURATIONS = [
  { label: '45 min', value: 45 },
  { label: '90 min', value: 90 },
  { label: '2 jam', value: 120 },
  { label: '3 jam', value: 180 },
]

const avatar = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4`

export default function SessionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const conversations = useChatStore((s) => s.conversations)
  const setConversations = useChatStore((s) => s.setConversations)

  const searchParams = new URLSearchParams(location.search)
  const initialPartnerId = searchParams.get('partnerId') || ''
  const isNewSession = location.pathname === '/sessions/new'

  // ─── Load real matches (conversations) ───────────────────────────────────
  useEffect(() => {
    let mounted = true
    if (isSupabaseConfigured && user?.id && conversations.length === 0) {
      fetchConversationSummaries(user.id).then((res) => {
        if (mounted) setConversations(res)
      }).catch(() => {})
    }
    return () => { mounted = false }
  }, [user?.id, conversations.length, setConversations])

  const selectablePartners = useMemo(() => {
    if (isSupabaseConfigured && conversations.length > 0) {
      return conversations.map((c) => c.user).filter(Boolean)
    }
    return []
  }, [conversations])

  // ─── Form state ───────────────────────────────────────────────────────────
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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (initialPartnerId) {
      setSessionForm((prev) => ({ ...prev, partnerId: String(initialPartnerId) }))
    }
  }, [initialPartnerId])

  // Subjects = union of current user + selected partner subjects
  const dynamicSubjects = useMemo(() => {
    const partnerObj = selectablePartners.find(
      (p) => String(p.id) === String(sessionForm.partnerId)
    )
    const uSubs = user?.study_profile?.subjects || []
    const pSubs = partnerObj?.study_profile?.subjects || []
    const combo = [...new Set([...uSubs, ...pSubs])]
    return combo.length > 0 ? combo : [
      'Calculus', 'Linear Algebra', 'Data Structures', 'Algorithms',
      'Statistics', 'Physics', 'Web Development', 'Machine Learning',
    ]
  }, [sessionForm.partnerId, selectablePartners, user])

  // ─── Sessions list ────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadSessions = useCallback(async () => {
    if (!user?.id) return
    setLoadingSessions(true)
    setLoadError('')
    try {
      if (isSupabaseConfigured) {
        const data = await fetchMySessions(user.id)
        setSessions(data)
      } else {
        setSessions([])
      }
    } catch (e) {
      setLoadError(e?.message || 'Gagal memuat sesi.')
    } finally {
      setLoadingSessions(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Real-time listener for session_participants changes
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return

    const channel = supabase
      .channel('sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `profile_id=eq.${user.id}`,
      }, () => { loadSessions() })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
      }, () => { loadSessions() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, loadSessions])

  // ─── Derived lists ────────────────────────────────────────────────────────
  const pendingInvites = sessions.filter(
    (s) => s.myAttendanceStatus === 'invited' && s.status === 'scheduled'
  )
  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' && s.myAttendanceStatus === 'accepted'
  )
  const completedSessions = sessions.filter(
    (s) => s.status === 'completed'
  )
  const cancelledSessions = sessions.filter(
    (s) => s.status === 'cancelled'
  )

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleGenerateLink = (e) => {
    e.preventDefault()
    const roomId = 'study-' + Math.random().toString(36).substring(2, 8)
    setGeneratedLink(`https://meet.studymatch.app/${roomId}`)
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const partnerObj = selectablePartners.find(
        (p) => String(p.id) === String(sessionForm.partnerId)
      )
      const scheduledStart = new Date(
        `${sessionForm.date}T${sessionForm.time || '12:00'}`
      ).toISOString()

      // Find matchId from conversations
      const conv = conversations.find(
        (c) => String(c.userId) === String(sessionForm.partnerId)
      )

      await createSession(user.id, {
        matchId: null,
        subjectName: sessionForm.subject || 'Study Session',
        scheduledStart,
        durationMinutes: sessionForm.duration,
        mode: sessionForm.mode,
        meetingUrl: generatedLink || null,
        locationText: sessionForm.location || null,
        inviteeProfileId: partnerObj?.id || null,
      })

      await loadSessions()
      navigate('/sessions')
    } catch (err) {
      setSubmitError(err?.message || 'Gagal membuat sesi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = async (sessionId, accept, reason = '') => {
    if (!user?.id) return
    try {
      await respondToSessionInvite(sessionId, user.id, accept, reason)
      await loadSessions()
    } catch (e) {
      alert(e?.message || 'Gagal merespons undangan.')
    }
  }

  const handleMarkDone = async (sessionId) => {
    try {
      await markSessionComplete(sessionId, user.id)
      await loadSessions()
    } catch (e) {
      alert(e?.message || 'Gagal menyelesaikan sesi.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex pt-8 pb-12 px-4 md:px-8 xl:px-12 font-sans text-slate-900 border-t border-slate-200/50">
      <div className="max-w-[1240px] mx-auto w-full flex flex-col lg:flex-row gap-8 xl:gap-14">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-[220px] shrink-0 pt-4">
          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/sessions/new" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isNewSession ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <PlusCircle className="w-5 h-5" />
              <span>New Session</span>
            </Link>
            <Link to="/sessions" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${!isNewSession ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Calendar className="w-5 h-5" />
              <span>My Schedule</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </Link>
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 max-w-[580px]">

          {isNewSession ? (
            /* ── NEW SESSION FORM ── */
            <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Schedule Session</h1>
                <p className="text-sm text-slate-500 font-medium">Ajak partner belajar bareng dan tunggu konfirmasi mereka.</p>
              </div>

              {submitError && (
                <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <form className="space-y-7" onSubmit={handleCreateSession}>
                {/* Partner Selection */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Study Partner</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                      value={sessionForm.partnerId}
                      onChange={(e) => setSessionForm({ ...sessionForm, partnerId: String(e.target.value), subject: '' })}
                      required
                    >
                      <option value="" disabled>
                        {selectablePartners.length === 0 ? 'Menunggu data match...' : 'Pilih partner...'}
                      </option>
                      {selectablePartners.map((ptr) => (
                        <option key={ptr.id} value={String(ptr.id)}>{ptr.full_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Mata Kuliah / Topik</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                      value={sessionForm.subject}
                      onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
                    >
                      <option value="" disabled>Pilih topik...</option>
                      {dynamicSubjects.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Tanggal</label>
                    <div className="relative">
                      <input type="date" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none bg-slate-50" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Jam Mulai</label>
                    <div className="relative">
                      <input type="time" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })} />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none bg-slate-50" />
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Durasi</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((dur) => (
                      <button key={dur.value} type="button"
                        onClick={() => setSessionForm({ ...sessionForm, duration: dur.value })}
                        className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all ${sessionForm.duration === dur.value ? 'bg-blue-50 text-blue-600 border border-blue-600 ring-2 ring-blue-600/10' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Study Mode */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Mode Belajar</label>
                  <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <button type="button" onClick={() => setSessionForm({ ...sessionForm, mode: 'online' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${sessionForm.mode === 'online' ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-slate-500 hover:text-slate-700'}`}>
                      <Video className="w-4 h-4" /> Online
                    </button>
                    <button type="button" onClick={() => setSessionForm({ ...sessionForm, mode: 'offline' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${sessionForm.mode === 'offline' ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-slate-500 hover:text-slate-700'}`}>
                      <MapPin className="w-4 h-4" /> Offline
                    </button>
                  </div>
                </div>

                {/* Conditional fields */}
                {sessionForm.mode === 'online' && (
                  <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-blue-100/50">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Meeting Link</h4>
                        <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">Generate link otomatis untuk sesi online.</p>
                      </div>
                    </div>
                    {generatedLink ? (
                      <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm break-all font-mono font-medium text-slate-600">
                        {generatedLink}
                        <button type="button" onClick={() => navigator.clipboard.writeText(generatedLink)}
                          className="text-blue-600 font-bold shrink-0 ml-4 hover:underline">Copy</button>
                      </div>
                    ) : (
                      <button onClick={handleGenerateLink} type="button"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-xl text-sm shadow-sm">
                        <LinkIcon className="w-4 h-4" /> Generate Meeting Link
                      </button>
                    )}
                  </div>
                )}
                {sessionForm.mode === 'offline' && (
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Lokasi</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Campus Library', 'Student Cafe'].map((loc) => (
                        <button key={loc} type="button"
                          onClick={() => setSessionForm({ ...sessionForm, location: loc })}
                          className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all ${sessionForm.location === loc ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {loc.includes('Cafe') ? <Clock className="w-4 h-4 shrink-0" /> : <MapPin className="w-4 h-4 shrink-0" />} {loc}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Atau ketik lokasi..."
                      className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      value={sessionForm.location}
                      onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" disabled={submitting}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Mengirim...' : 'Kirim Undangan'}
                  </button>
                  <button type="button" onClick={() => navigate('/sessions')}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl text-sm transition-all">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ── SESSIONS LIST ── */
            <div className="space-y-8">
              <div className="mb-4">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Schedule</h1>
                <p className="text-sm text-slate-500 font-medium tracking-wide">Jadwal dan undangan sesi belajarmu.</p>
              </div>

              {loadingSessions ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : loadError ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
                </div>
              ) : (
                <>
                  {/* PENDING INVITES */}
                  {pendingInvites.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-500" />
                        Undangan Masuk
                        <span className="bg-amber-100 text-amber-600 py-0.5 px-2 rounded-full text-[10px]">{pendingInvites.length}</span>
                      </h2>
                      <div className="space-y-4">
                        {pendingInvites.map((s) => (
                          <InviteCard key={s.id} session={s}
                            onAccept={() => handleRespond(s.id, true)}
                            onDecline={(reason) => handleRespond(s.id, false, reason)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UPCOMING */}
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      Upcoming <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-[10px]">{upcomingSessions.length}</span>
                    </h2>
                    <div className="space-y-4">
                      {upcomingSessions.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-[24px] border border-slate-100">
                          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm font-medium">Belum ada sesi terjadwal.</p>
                          <button onClick={() => navigate('/sessions/new')}
                            className="mt-4 text-blue-600 font-bold text-sm hover:underline">+ Buat Sesi Baru</button>
                        </div>
                      ) : upcomingSessions.map((s) => (
                        <ScheduleCard key={s.id} session={s} onMarkDone={() => handleMarkDone(s.id)} />
                      ))}
                    </div>
                  </div>

                  {/* COMPLETED */}
                  {completedSessions.length > 0 && (
                    <div className="pt-4">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        Selesai <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-[10px]">{completedSessions.length}</span>
                      </h2>
                      <div className="space-y-4">
                        {completedSessions.map((s) => (
                          <ScheduleCard key={s.id} session={s} completed />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CANCELLED */}
                  {cancelledSessions.length > 0 && (
                    <div className="pt-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Dibatalkan <span className="bg-red-100 text-red-500 py-0.5 px-2 rounded-full text-[10px]">{cancelledSessions.length}</span>
                      </h2>
                      <div className="space-y-4">
                        {cancelledSessions.map((s) => (
                          <ScheduleCard key={s.id} session={s} completed />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: mini calendar / tip ── */}
        <aside className="hidden lg:flex flex-col w-[300px] xl:w-[320px] shrink-0 gap-6">
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-sm text-slate-900">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2 text-slate-400">
                <button className="hover:text-slate-700 transition-colors p-1"><ChevronLeft className="w-4 h-4" /></button>
                <button className="hover:text-slate-700 transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-400">{d}</div>)}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`p-${i}`} />
              ))}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1
                const isToday = day === new Date().getDate()
                const hasSession = upcomingSessions.some(s => new Date(s.scheduled_at).getDate() === day && new Date(s.scheduled_at).getMonth() === new Date().getMonth())
                return (
                  <button key={day} className={`text-xs font-bold w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all relative ${isToday ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                    {day}
                    {hasSession && !isToday && <span className="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full" />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="bg-[#F0F5FF] rounded-[24px] p-6 border border-[#E0EAFF]">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Info className="w-5 h-5" />
              <h4 className="font-bold text-sm">Tips</h4>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Setelah kamu mengirim undangan sesi, partner perlu <strong>menyetujuinya</strong> terlebih dahulu sebelum muncul di jadwal kalian berdua.
            </p>
          </div>
        </aside>

      </div>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 100%; height: 100%;
        }
      `}</style>
    </div>
  )
}

function InviteCard({ session, onAccept, onDecline }) {
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const dateObj = new Date(session.scheduled_at)

  const handleDeclineSubmit = () => {
    if (!declineReason.trim()) return
    onDecline(declineReason)
    setShowDeclineModal(false)
  }

  return (
    <div className="p-5 rounded-[24px] bg-amber-50 border border-amber-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-[18px] bg-amber-100 flex flex-col items-center justify-center shrink-0 border border-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-600">{dateObj.toLocaleDateString('id-ID', { month: 'short' })}</span>
          <span className="text-lg font-black text-amber-700 leading-tight">{dateObj.getDate()}</span>
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Bell className="w-3 h-3" /> Undangan Baru</p>
          <h3 className="font-bold text-slate-900 text-[15px] mb-0.5">{session.subject}</h3>
          <p className="text-slate-500 text-[13px] font-medium">
            Dari <span className="font-bold text-slate-700">{session.partner?.full_name || 'Partner'}</span>
            {' · '}{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{session.duration_minutes}m
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm">
          <CheckCircle className="w-4 h-4" /> Terima
        </button>
        <button onClick={() => setShowDeclineModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold rounded-xl transition-all">
          <XCircle className="w-4 h-4" /> Tolak
        </button>
      </div>

      {/* Decline reason modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeclineModal(false)} />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Alasan Penolakan</h3>
            <p className="text-sm text-slate-500 mb-4">Kasih tau pengirim kenapa kamu nggak bisa join sesi ini.</p>
            <textarea
              autoFocus
              rows={3}
              placeholder="Contoh: Bentrok sama jadwal kuliah..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleDeclineSubmit}
                disabled={!declineReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-3 rounded-xl text-sm transition-all">
                Kirim Penolakan
              </button>
              <button onClick={() => setShowDeclineModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleCard({ session, completed, onMarkDone }) {
  const dateObj = new Date(session.scheduled_at)

  // Compute end time
  const sessionEndMs = dateObj.getTime() + session.duration_minutes * 60 * 1000
  const now = Date.now()
  const hasEnded = now >= sessionEndMs

  // Both parties can mark done — just need accepted + session ended
  const allAccepted = session.myAttendanceStatus === 'accepted'
  const canMarkDone = allAccepted && hasEnded

  // Short disabled hint
  const minutesLeft = Math.ceil((sessionEndMs - now) / 60000)
  const hoursLeft = Math.floor(minutesLeft / 60)
  const minsLeft = minutesLeft % 60
  const waitMsg = !allAccepted
    ? 'Belum dikonfirmasi'
    : hoursLeft > 0 ? `${hoursLeft}j ${minsLeft}m lagi` : `${minsLeft}m lagi`

  return (
    <div className={`p-5 rounded-[24px] bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all ${completed && 'opacity-60 grayscale-[0.2]'}`}>
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="w-14 h-14 rounded-[18px] bg-blue-50 flex flex-col items-center justify-center shrink-0 border border-blue-100/50">
          <span className="text-[10px] uppercase font-bold text-blue-600">{dateObj.toLocaleDateString('id-ID', { month: 'short' })}</span>
          <span className="text-lg font-black text-blue-700 leading-tight">{dateObj.getDate()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-[15px]">{session.subject}</h3>
            {session.mode === 'online'
              ? <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Video className="w-3 h-3" /> Online</span>
              : <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> Offline</span>}
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />
              {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
            </span>
            {session.partner && (
              <span className="flex items-center gap-1.5">
                <img src={avatar(session.partner?.full_name)} alt="" className="w-5 h-5 rounded-full" />
                <span className="font-bold text-slate-700">{session.partner.full_name}</span>
              </span>
            )}
          </div>
          {/* Decline reason info for organizer */}
          {session.declineReason && (
            <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 font-medium">
                <span className="font-bold">{session.partner?.full_name?.split(' ')[0]}</span> menolak: "{session.declineReason}"
              </p>
            </div>
          )}
        </div>
        <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          {session.status === 'scheduled' && !completed && (
            <>
              {session.mode === 'online' && session.meeting_url && (
                <a href={session.meeting_url} target="_blank" rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1e293b] hover:bg-slate-900 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-md">
                  <Video className="w-4 h-4" /> Join
                </a>
              )}
              {canMarkDone ? (
                <button onClick={onMarkDone}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                  <CheckCircle className="w-4 h-4" /> Selesai
                </button>
              ) : (
                <div title={waitMsg}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{waitMsg}</span>
                </div>
              )}
            </>
          )}
          {(completed || session.status === 'completed') && (
            <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Selesai
            </div>
          )}
          {session.status === 'cancelled' && (
            <div className="px-4 py-2 bg-red-50 border border-red-100 text-red-400 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5">
              <XCircle className="w-4 h-4" /> Ditolak
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
