import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import gsap from 'gsap'
import {
  Calendar,
  Video,
  Search,
  Paperclip,
  Send,
  Clock,
  ChevronLeft,
  X,
  Sparkles,
  BookOpen,
  Zap,
  AlertCircle,
  RefreshCw,
  FileText,
  Check,
  CheckCheck,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  fetchConversationThread,
  sendConversationMessage,
  markConversationRead,
  fetchProfileGoals,
  subscribeToMessages,
  fetchPartnerStats,
  fetchMatchInfo,
} from '@/lib/studymatchRealtime'
import { DISPLAY_FONT, TRANSITION_TIMING, INTERACTION_TIMING } from '@/lib/constants'

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥']
const EMPTY_MESSAGES = []

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMessageTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatMatchedAt(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Upload a file to Supabase Storage and return its public URL */
async function uploadChatMedia(conversationId, file) {
  const ext = file.name.split('.').pop()
  const path = `${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path)
  return { url: data.publicUrl, type: file.type, name: file.name }
}

function normalizeConversationMessages(messages = [], currentUserId) {
  return messages.map((message, index) => ({
    id: message.id ?? `msg-${index}`,
    from: message.from || (message.sender_profile_id === currentUserId ? 'me' : 'partner'),
    text: message.text ?? message.body ?? '',
    time: message.time ?? formatMessageTime(message.sent_at),
    read: message.read ?? true,
    fresh: false,
    reactions: Array.isArray(message.reactions)
      ? message.reactions
      : Array.isArray(message.metadata?.reactions)
        ? message.metadata.reactions
        : [],
  }))
}

const getAvatar = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=b6e3f4`

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-neutral-200/70 rounded-lg animate-pulse ${className}`} aria-hidden="true" />
}

function ChatSkeleton() {
  return (
    <div className="flex h-screen bg-[#f0f4f8] pt-16">
      <div className="w-[270px] shrink-0 p-4 hidden lg:flex flex-col gap-4">
        <Skeleton className="h-52 rounded-[20px]" />
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-32 rounded-[20px]" />
      </div>
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-[68px] rounded-none" />
        <div className="flex-1 p-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
              {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
              <Skeleton className={`h-12 rounded-[22px] ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 rounded-none" />
      </div>
      <div className="w-[290px] shrink-0 p-4 hidden lg:flex flex-col gap-4">
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-52 rounded-[20px]" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { userId = '' } = useParams()
  const user = useAuthStore((state) => state.user)
  const hydrateConversation = useChatStore((state) => state.hydrateConversation)
  const addRealtimeMessage = useChatStore((state) => state.addRealtimeMessage)
  const setTyping = useChatStore((state) => state.setTyping)
  const setReactionPickerId = useChatStore((state) => state.setReactionPickerId)
  const setDraft = useChatStore((state) => state.setDraft)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const addReactionToConversation = useChatStore((state) => state.addReaction)
  const reactionPickerId = useChatStore((state) => state.reactionPickerId)
  const messagesByConversation = useChatStore((state) => state.messagesByConversation)
  const drafts = useChatStore((state) => state.drafts)
  const isTypingByConversation = useChatStore((state) => state.isTypingByConversation)
  const navigate = useNavigate()

  const [thread, setThread] = useState(null)
  const [goals, setGoals] = useState([])
  const [partnerStats, setPartnerStats] = useState({ sessions: 0, studiedHours: 0 })
  const [matchInfo, setMatchInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sendError, setSendError] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const messagesEnd = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const leftSidebarRef = useRef(null)
  const rightSidebarRef = useRef(null)
  const chatHeaderRef = useRef(null)
  const chatBodyRef = useRef(null)

  const threadId = thread?.conversation?.id || userId
  const messages = threadId ? messagesByConversation[threadId] || EMPTY_MESSAGES : EMPTY_MESSAGES
  const draft = threadId ? drafts[threadId] || '' : ''
  const isTyping = threadId ? Boolean(isTypingByConversation[threadId]) : false
  const partner = thread?.peerProfile || null
  const partnerName = partner?.full_name?.split(' ')[0] || 'Partner'

  const myAvatar = getAvatar(user?.full_name || 'User')
  const partnerAvatar = getAvatar(partner?.full_name || 'Study Partner')

  // ── Load Thread ───────────────────────────────────────────────────────────
  const loadThread = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setLoadError('')
    try {
      const [threadData, partnerGoals, stats, match] = await Promise.all([
        fetchConversationThread(user.id, userId),
        fetchProfileGoals(userId),
        fetchPartnerStats(user.id, userId),
        fetchMatchInfo(user.id, userId),
      ])

      const normalizedMessages = normalizeConversationMessages(threadData.messages, user.id)
      setThread({ ...threadData, messages: normalizedMessages })

      if (threadData.conversation?.id) {
        hydrateConversation(threadData.conversation.id, normalizedMessages)
      }

      // Goals from partner's study objectives
      const storageKey = `study_goals_${user.id}_${userId}`
      const savedGoals = localStorage.getItem(storageKey)

      if (savedGoals) {
        setGoals(JSON.parse(savedGoals))
      } else if (partnerGoals.length > 0) {
        const initialGoals = partnerGoals.map((g, idx) => ({ id: `pg-${idx}`, text: g.label, done: false }))
        setGoals(initialGoals)
        localStorage.setItem(storageKey, JSON.stringify(initialGoals))
      } else {
        const defaultGoals = [
          { id: 'g1', text: 'Schedule first study session', done: false },
          { id: 'g2', text: 'Discuss course material', done: false },
        ]
        setGoals(defaultGoals)
        localStorage.setItem(storageKey, JSON.stringify(defaultGoals))
      }

      setPartnerStats(stats)
      setMatchInfo(match)
    } catch (error) {
      setLoadError(error?.message || 'Failed to load conversation.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, userId, hydrateConversation])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  // ── Realtime Messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !thread?.conversation?.id) return
    const sub = subscribeToMessages(thread.conversation.id, (newMessage) => {
      addRealtimeMessage(thread.conversation.id, newMessage, user?.id)
    })
    return () => sub.unsubscribe()
  }, [thread?.conversation?.id, addRealtimeMessage, user?.id])

  // ── GSAP Entrance ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (leftSidebarRef.current && isDesktop) tl.fromTo(leftSidebarRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 }, 0)
      if (rightSidebarRef.current && isDesktop) tl.fromTo(rightSidebarRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 }, 0)
      if (chatHeaderRef.current) tl.fromTo(chatHeaderRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.15)
      if (chatBodyRef.current) tl.fromTo(chatBodyRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.25)
      tl.fromTo('.sidebar-card', { y: 20, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.07 }, 0.3)
    })
    return () => ctx.revert()
  }, [loading])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Mark Read ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!thread?.conversation?.id || !user?.id || !isSupabaseConfigured) return
    markConversationRead(thread.conversation.id, user.id).catch(() => {})
  }, [thread?.conversation?.id, user?.id])

  // ── Send Msg ──────────────────────────────────────────────────────────────
  const sendMsg = async (e, override) => {
    e?.preventDefault()
    const txt = override ?? draft
    if (!txt.trim() || !threadId) return
    if (isSupabaseConfigured && !user?.id) return

    setSendError('')
    sendMessage(threadId, txt)
    inputRef.current?.focus()
    setTyping(threadId, false)

    try {
      if (isSupabaseConfigured && thread?.conversation?.id) {
        await sendConversationMessage(thread.conversation.id, user.id, txt)
      }
    } catch (error) {
      setSendError(error?.message || 'Failed to send message.')
    }
  }

  // ── File Upload Handler ───────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !threadId || !thread?.conversation?.id) return
    fileInputRef.current.value = ''
    setUploadError('')
    setIsUploading(true)
    try {
      const media = await uploadChatMedia(thread.conversation.id, file)
      const isImage = media.type.startsWith('image/')
      // Send as a structured message body containing the URL
      const body = isImage
        ? `[image]${media.url}[/image]`
        : `[file name="${media.name}"]${media.url}[/file]`
      sendMessage(threadId, body)
      if (isSupabaseConfigured) {
        await sendConversationMessage(thread.conversation.id, user.id, body)
      }
    } catch (err) {
      setUploadError(err?.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const addReaction = (msgId, emoji) => {
    addReactionToConversation(threadId, msgId, emoji)
  }

  const completedGoals = goals.filter((g) => g.done).length
  const progressPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

  // Client-side message search filter
  const visibleMessages = searchActive && searchQuery.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return <ChatSkeleton />

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-neutral-900 mb-1" style={{ fontFamily: DISPLAY_FONT }}>Failed to load chat</h1>
          <p className="text-sm text-[#64748b] mb-4">{loadError}</p>
          <button
            type="button"
            onClick={loadThread}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1a56db] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors
"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isSupabaseConfigured && !partner) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-[#0f172a] mb-2" style={{ fontFamily: DISPLAY_FONT }}>
            Profile not found
          </h1>
          <p className="text-sm text-[#64748b] mb-4">This partner doesn't exist or you haven't matched with them yet.</p>
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1a56db] border border-[#1a56db]/30 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors
"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Inbox
          </button>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>{partnerName} - Chat | StudyMatch</title>
        <meta name="description" content={`Chat with ${partnerName} on StudyMatch.`} />
      </Helmet>
      <style>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(10px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes typeDot { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes popIn { 0% { transform:scale(0); opacity:0; } 70% { transform:scale(1.15); } 100% { transform:scale(1); opacity:1; } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.5); } 70% { box-shadow:0 0 0 7px rgba(34,197,94,0); } }
        .fresh { animation: msgIn .3s cubic-bezier(.22,1,.36,1) both; }
        .td1 { animation: typeDot 1.3s infinite; }
        .td2 { animation: typeDot 1.3s .15s infinite; }
        .td3 { animation: typeDot 1.3s .3s infinite; }
        .reaction-pop { animation: popIn .25s ${INTERACTION_TIMING} both; }
        .online-dot { animation: pulse 2.5s ease-in-out infinite; }
        .goal-check { transition: all .22s ${INTERACTION_TIMING}; }
        .msg-hover:hover .reaction-trigger { opacity:1 !important; }
        .goal-bar { transition: width .5s ${TRANSITION_TIMING}; }
        .action-btn { transition: background .15s, transform .12s, color .15s; }
        .action-btn:hover { transform: scale(1.08); }
        .send-glow:not(:disabled):hover { box-shadow: 0 4px 18px rgba(26,86,219,.35); transform:scale(1.08); }
        .send-glow:not(:disabled):active { transform: scale(.94); }
        .pill-btn { transition: all .15s ease; }
        .pill-btn:hover { background:#eff6ff; transform:translateY(-1px); box-shadow:0 4px 14px rgba(26,86,219,.12); }
        .card-hover { transition: box-shadow .2s, transform .2s; }
        .card-hover:hover { box-shadow:0 4px 20px rgba(0,0,0,.06); transform:translateY(-1px); }
        .msg-bubble { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
      `}</style>

      {sendError && (
        <div role="alert" className="fixed top-[76px] left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg">
          {sendError}
        </div>
      )}

      <div className="flex bg-[#f0f4f8] overflow-hidden" style={{ height: 'calc(100dvh - 4.5rem)' }}>

        {/* Mobile backdrop */}
        {(sidebarOpen || rightSidebarOpen) && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => {
              setSidebarOpen(false)
              setRightSidebarOpen(false)
            }}
            aria-hidden="true"
          />
        )}

        {/* ══ LEFT SIDEBAR ══ */}
        <aside
          ref={leftSidebarRef}
          aria-label="Info partner"
          className={`w-[270px] shrink-0 flex flex-col bg-[#f5f6f8] overflow-y-auto transition-transform duration-300 ease-in-out z-40
            fixed top-[4.5rem] bottom-0 left-0 lg:static lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ height: 'calc(100dvh - 4.5rem)' }}
        >
          <div className="p-4 flex flex-col gap-4">

            {/* Profile Card */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 pt-8 pb-7 text-center" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe]">
                  <img src={partnerAvatar} alt={partner?.full_name} className="w-full h-full rounded-full object-cover bg-[#eff6ff]" />
                </div>
              </div>
              <h2 className="mb-0.5 text-[1.05rem] font-semibold tracking-[-0.04em] text-[#0f172a]" style={{ fontFamily: DISPLAY_FONT }}>
                {partner?.full_name}
              </h2>
              <p className="text-[12px] text-[#64748b] font-medium mb-4">{partner?.university || 'Student'}</p>

              {/* Subjects tags */}
              <div className="flex justify-center gap-2 flex-wrap">
                {(partner?.study_profile?.subjects || []).slice(0, 3).map((t) => (
                  <span key={t} className="px-3 py-1 bg-[#eff6ff] text-[#1a56db] text-[11px] font-bold rounded-full border border-[#bfdbfe]/60">
                    {t}
                  </span>
                ))}
              </div>

              {/* Shared sessions badge */}
              {partnerStats.sessions > 0 && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <BookOpen className="w-3 h-3" aria-hidden="true" />
                  {partnerStats.sessions} sesi bersama · {partnerStats.studiedHours}h belajar
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="sidebar-card bg-white rounded-[20px] px-5 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">Quick Actions</p>
              <div className="space-y-2">
                {/* Schedule Session — functional: navigates to sessions/new */}
                <button
                  type="button"
                  onClick={() => navigate(`/sessions/new?partnerId=${partner?.id}`)}
                  aria-label="Schedule a study session"
                  className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] bg-[#1a56db] text-white shadow-md shadow-blue-200/60 hover:bg-blue-700 text-left
"
                >
                  <div className="w-9 h-9 rounded-[9px] bg-white/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold text-[13px] leading-tight">Schedule Session</p>
                    <p className="text-[11px] text-blue-200 font-medium mt-0.5">Pick a study time</p>
                  </div>
                </button>

                {/* Video Call — real Jitsi integration */}
                {thread?.conversation?.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/meet/${thread.conversation.id}`)}
                    aria-label="Start video call"
                    className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] border border-[#e2e8f0] bg-[#fafafa] text-[#334155] hover:bg-[#f1f5f9] text-left
"
                  >
                    <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center shrink-0 text-[#1a56db]">
                      <Video className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-[13px] leading-tight">Video Call</p>
                      <p className="text-[11px] text-[#94a3b8] font-medium mt-0.5">Study together live</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Mutual Subjects — real from profile */}
            {(partner?.study_profile?.subjects || []).length > 0 && (
              <div className="sidebar-card bg-white rounded-[20px] px-5 py-7 flex-1" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">Shared Subjects</p>
                <div className="space-y-2">
                  {(partner.study_profile.subjects).map((subj, idx) => (
                    <div
                      key={subj}
                      className="w-full flex items-center gap-3 px-3 py-3.5 rounded-[14px] bg-[#f8fafc] border border-[#f1f5f9]"
                    >
                      <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center text-[#1a56db] text-sm font-bold shrink-0">
                        {idx === 0 ? '🗂️' : 'Σ'}
                      </div>
                      <span className="text-[13px] font-semibold text-[#334155] flex-1">{subj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ══ MAIN CHAT ══ */}
        <main className="flex-1 min-w-0 flex flex-col relative" aria-label="Chat room">

          {/* Chat Header */}
          <header
            ref={chatHeaderRef}
            className="h-[68px] flex items-center justify-between px-4 md:px-8 bg-white border-b border-[#f1f5f9] shrink-0 sticky top-0 z-20"
          >
            <div className="flex items-center gap-3">
              {/* Mobile back / hamburger */}
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors shrink-0
"
                aria-label="Toggle sidebar"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#eff6ff]">
                  <img src={partnerAvatar} alt={partner?.full_name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h1 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-[#0f172a] leading-tight" style={{ fontFamily: DISPLAY_FONT }}>
                  {partnerName}
                </h1>
                <p className="text-[12px] text-[#94a3b8]">
                  {partner?.university || 'Student'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {thread?.conversation?.id && (
                <button
                  type="button"
                  title="Video call"
                  aria-label="Start video call"
                  onClick={() => navigate(`/meet/${thread.conversation.id}`)}
                  className="action-btn w-9 h-9 rounded-full text-[#94a3b8] flex items-center justify-center hover:text-[#1a56db] hover:bg-[#eff6ff]
"
                >
                  <Video className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
              {/* Search toggle — functional: filters visible messages */}
              <button
                type="button"
                title={searchActive ? 'Close search' : 'Search messages'}
                aria-label={searchActive ? 'Close search' : 'Search messages'}
                aria-pressed={searchActive}
                onClick={() => { setSearchActive((v) => !v); setSearchQuery('') }}
                className={`action-btn w-9 h-9 rounded-full flex items-center justify-center transition-colors
 ${
                  searchActive ? 'text-[#1a56db] bg-[#eff6ff]' : 'text-[#94a3b8] hover:text-[#1a56db] hover:bg-[#eff6ff]'
                }`}
              >
                {searchActive ? <X className="w-[18px] h-[18px]" aria-hidden="true" /> : <Search className="w-[18px] h-[18px]" aria-hidden="true" />}
              </button>
              {/* Info toggle — mobile only */}
              <button
                type="button"
                title="Conversation info"
                aria-label="Conversation info"
                onClick={() => setRightSidebarOpen((v) => !v)}
                className={`lg:hidden action-btn w-9 h-9 rounded-full flex items-center justify-center transition-colors
 ${
                  rightSidebarOpen ? 'text-[#1a56db] bg-[#eff6ff]' : 'text-[#94a3b8] hover:text-[#1a56db] hover:bg-[#eff6ff]'
                }`}
              >
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Collapsible Search Bar */}
          {searchActive && (
            <div className="px-4 md:px-8 py-2.5 bg-white border-b border-[#f1f5f9] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#94a3b8] shrink-0" aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                aria-label="Search messages in this conversation"
                className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] outline-none"
              />
              {searchQuery && (
                <span className="text-[11px] text-[#94a3b8] shrink-0">
                  {visibleMessages.length} result{visibleMessages.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Messages Area */}
          <section
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto px-4 md:px-10 py-8 space-y-1 bg-[#fafbfc]"
            style={{ minHeight: 0 }}
            aria-label="Messages"
            aria-live="polite"
            aria-atomic="false"
          >
            {/* Match Intro Card — real match timestamp */}
            <div className="flex justify-center mb-10">
              <div
                className="relative bg-white rounded-[28px] px-8 py-8 text-center max-w-[460px] w-full overflow-hidden"
                style={{ boxShadow: '0 2px 24px rgba(26,86,219,.08)', border: '1px solid rgba(219,234,254,.8)' }}
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#93c5fd 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="relative z-10">
                  <div className="flex justify-center mb-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#ffedd5] border-[3px] border-white shadow-md z-10 relative">
                        <img src={myAvatar} alt="You" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#e0f2fe] border-[3px] border-white shadow-md absolute top-0 -right-8">
                        <img src={partnerAvatar} alt={partner?.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#1a56db] rounded-full flex items-center justify-center z-20 shadow-lg shadow-blue-200">
                        <Zap className="w-3.5 h-3.5 text-white fill-white" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <p className="mb-3 mt-4 text-[1.7rem] font-semibold tracking-[-0.05em] text-[#1a56db]" style={{ fontFamily: DISPLAY_FONT }}>
                    Study Match! 🎉
                  </p>
                  <p className="text-[13px] text-[#475569] leading-relaxed mb-5">
                    You and <strong className="text-[#0f172a]">{partnerName}</strong> are now matched!{' '}
                    {(partner?.study_profile?.subjects || []).length > 0 && (
                      <>Let&apos;s start discussing <strong className="text-[#0f172a]">{partner.study_profile.subjects[0]}</strong> together!</>
                    )}
                  </p>
                  {matchInfo?.matched_at && (
                    <div className="inline-flex items-center gap-2 bg-[#f0f9ff] text-[#0284c7] text-[11px] font-bold px-4 py-2 rounded-full border border-[#bae6fd]">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      Match {formatMatchedAt(matchInfo.matched_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date Divider */}
            <div className="flex items-center gap-3 mb-5" aria-hidden="true">
              <div className="flex-1 h-px bg-[#f1f5f9]" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] bg-[#fafbfc] px-2">Today</span>
              <div className="flex-1 h-px bg-[#f1f5f9]" />
            </div>

            {/* Messages */}
            {visibleMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-6">
                {!searchActive && (
                  <div className="max-w-[400px] w-full bg-white/60 backdrop-blur-sm rounded-[32px] p-8 border border-white shadow-sm text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2" style={{ fontFamily: DISPLAY_FONT }}>
                      Break the ice!
                    </h3>
                    <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                      Don't be shy! {partnerName} is also looking for a study partner. Start with one of these:
                    </p>
                    <div className="grid gap-3">
                      {[
                        `Hey! Ready to crush some ${(partner?.study_profile?.subjects?.[0] || 'studying')}?`,
                        `Hi ${partnerName}! I saw you're interested in ${partner?.study_profile?.subjects?.[0] || 'our shared subjects'}. Want to plan a session?`,
                        `Hello! What's the biggest challenge you're facing with your studies right now?`
                      ].map((text, i) => (
                        <button
                          key={i}
                          onClick={(e) => sendMsg(e, text)}
                          className="w-full text-left px-5 py-4 bg-white hover:bg-blue-50 border border-neutral-100 hover:border-blue-200 rounded-2xl text-[13.5px] font-medium text-neutral-700 transition-all duration-200 active:scale-[0.98] group flex items-center gap-3
"
                        >
                          <span className="flex-1">{text}</span>
                          <Send className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchActive && searchQuery && (
                  <div className="text-center py-8 text-[#94a3b8] text-sm">
                    No messages match your search.
                  </div>
                )}
              </div>
            )}

            {visibleMessages.map((msg) => {
              const isMe = msg.from === 'me'
              const showReactor = reactionPickerId === msg.id
              return (
                <div
                  key={msg.id}
                  className={`msg-hover flex gap-3 group relative ${isMe ? 'justify-end' : 'justify-start'} ${msg.fresh ? 'fresh' : ''} mb-2`}
                  onMouseLeave={() => reactionPickerId === msg.id && setReactionPickerId(null)}
                >
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 self-end mb-5 bg-[#e0f2fe]">
                      <img src={partnerAvatar} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className={`relative flex flex-col max-w-[400px] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Reaction trigger */}
                    <button
                      type="button"
                      aria-label="Tambah reaksi"
                      className="reaction-trigger absolute top-0 z-10 opacity-0 transition-opacity duration-150"
                      style={{ [isMe ? 'left' : 'right']: '-28px' }}
                      onClick={() => setReactionPickerId(showReactor ? null : msg.id)}
                    >
                      <span aria-hidden="true">😊</span>
                    </button>

                    {/* Reaction picker */}
                    {showReactor && (
                      <div className={`reaction-pop absolute z-30 bottom-full mb-2 flex gap-1 bg-white rounded-full shadow-xl border border-[#f1f5f9] px-2 py-1.5 ${isMe ? 'right-0' : 'left-0'}`}>
                        {EMOJI_REACTIONS.map((e) => (
                          <button
                            type="button"
                            key={e}
                            onClick={() => addReaction(msg.id, e)}
                            aria-label={`Reaksi ${e}`}
                            className="text-[18px] hover:scale-125 transition-transform leading-none"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bubble — renders plain text or media (image/file) */}
                    {(() => {
                      const imageMatch = msg.text?.match(/^\[image\](.+?)\[\/image\]$/)
                      const fileMatch = msg.text?.match(/^\[file name="([^"]+)"\](.+?)\[\/file\]$/)
                      if (imageMatch) {
                        return (
                          <div className={`rounded-[18px] overflow-hidden shadow-sm max-w-[280px] ${
                            isMe ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'
                          }`}>
                            <img
                              src={imageMatch[1]}
                              alt="Shared image"
                              className="w-full object-cover block"
                              style={{ maxHeight: 260 }}
                            />
                          </div>
                        )
                      }
                      if (fileMatch) {
                        return (
                          <a
                            href={fileMatch[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Download file: ${fileMatch[1]}`}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-[22px] text-[14px] shadow-sm no-underline
 ${
                              isMe
                                ? 'bg-[#1a56db] text-white rounded-br-[4px]'
                                : 'bg-white text-[#1e293b] rounded-bl-[4px] border border-[#f1f5f9]'
                            }`}
                          >
                            <FileText className="w-5 h-5 shrink-0 opacity-80" aria-hidden="true" />
                            <span className="truncate max-w-[180px] font-medium">{fileMatch[1]}</span>
                          </a>
                        )
                      }
                      return (
                        <div className={`msg-bubble px-5 py-3.5 rounded-[22px] text-[14px] leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-[#1a56db] text-white rounded-br-[4px] shadow-blue-100'
                            : 'bg-white text-[#1e293b] rounded-bl-[4px] border border-[#f1f5f9]'
                        }`}>
                          {msg.text}
                        </div>
                      )
                    })()}

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        {msg.reactions.map((r) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => addReaction(msg.id, r)}
                            className="cursor-pointer text-[13px] bg-white border border-[#f1f5f9] rounded-full px-1.5 py-0.5 shadow-sm hover:scale-110 transition-transform"
                            aria-label={`React with ${r}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Time + read status */}
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <time className="text-[11px] text-[#94a3b8] font-medium">{msg.time}</time>
                      {isMe && (
                        msg.read
                          ? <CheckCheck className="w-3.5 h-3.5 text-[#1a56db]" aria-label="Read" />
                          : <Check className="w-3.5 h-3.5 text-[#94a3b8]" aria-label="Sent" />
                      )}
                    </div>
                  </div>

                  {isMe && <div className="w-8 shrink-0" />}
                </div>
              )
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 mb-2 fresh" aria-live="polite">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e0f2fe] shrink-0">
                  <img src={partnerAvatar} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1.5 px-5 py-3.5 bg-white rounded-[22px] rounded-bl-[4px] border border-[#f1f5f9] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#cbd5e1] td1" />
                  <span className="w-2 h-2 rounded-full bg-[#cbd5e1] td2" />
                  <span className="w-2 h-2 rounded-full bg-[#cbd5e1] td3" />
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </section>

          {/* Input Bar */}
          <div className={`px-4 md:px-8 pt-3 pb-5 bg-white border-t transition-colors ${inputFocused ? 'border-[#1a56db]/20' : 'border-[#f1f5f9]'}`}>
            {/* Upload error toast */}
            {uploadError && (
              <div role="alert" className="mb-2 text-[12px] text-rose-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />{uploadError}
              </div>
            )}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt,.pptx,.xlsx"
              className="hidden"
              aria-hidden="true"
              onChange={handleFileUpload}
            />
            <form
              onSubmit={sendMsg}
              className={`flex items-center gap-3 rounded-[24px] px-5 py-3 border bg-[#f8fafc] transition-all duration-200 ${
                inputFocused ? 'border-[#1a56db] ring-4 ring-[#1a56db]/10 bg-white' : 'border-[#e2e8f0]'
              }`}
            >
              {/* Paperclip — triggers file picker */}
              <button
                type="button"
                aria-label="Attach file"
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`action-btn shrink-0 transition-colors ${
                  isUploading
                    ? 'text-[#1a56db] animate-pulse cursor-not-allowed'
                    : 'cursor-pointer text-[#94a3b8] hover:text-[#1a56db]'
                }`}
              >
                {isUploading
                  ? <RefreshCw className="w-[21px] h-[21px] animate-spin" aria-hidden="true" />
                  : <Paperclip className="w-[21px] h-[21px]" aria-hidden="true" />}
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  setSendError('')
                  if (threadId) setDraft(threadId, e.target.value)
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Type a message..."
                aria-label="Write a message"
                className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] outline-none min-w-0"
              />
              {draft && (
                <span className="text-[11px] text-[#94a3b8] shrink-0 tabular-nums" aria-hidden="true">{draft.length}</span>
              )}
              <button
                type="submit"
                disabled={!draft.trim() || isUploading}
                aria-label="Send message"
                className={`send-glow w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                  draft.trim() && !isUploading
                    ? 'cursor-pointer bg-[#1a56db] text-white'
                    : 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                }`}
              >
                <Send className="w-[17px] h-[17px] ml-[2px]" aria-hidden="true" />
              </button>
            </form>
          </div>
        </main>

        {/* ══ RIGHT SIDEBAR ══ */}
        <aside
          ref={rightSidebarRef}
          aria-label="Informasi sesi dan tujuan"
          className={`w-[290px] shrink-0 flex flex-col bg-[#f5f6f8] overflow-y-auto transition-transform duration-300 ease-in-out z-40
            fixed top-[4.5rem] bottom-0 right-0 lg:static lg:translate-x-0
            ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={{ height: 'calc(100dvh - 4.5rem)' }}
        >
          <div className="p-4 flex flex-col gap-4">

            {/* Schedule Session CTA */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/sessions/new?partnerId=${partner?.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/sessions/new?partnerId=${partner?.id}`)}
                aria-label="Schedule a new study session"
                className="card-hover rounded-[16px] border border-dashed border-[#cbd5e1] px-4 py-7 text-center cursor-pointer bg-[#fafafa] hover:border-[#93c5fd] hover:bg-[#f0f9ff] transition-colors"
              >
                <div className="w-12 h-12 mx-auto rounded-[14px] bg-white border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] mb-4 shadow-sm">
                  <Calendar className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-[13px] text-[#64748b] font-medium mb-4 leading-relaxed">No sessions scheduled yet.</p>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1a56db] hover:underline">
                  <Plus className="w-4 h-4" aria-hidden="true" /> Pick a time
                </span>
              </div>
            </div>

            {/* Study Goals — state from partner's real goals */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8]">Study Goals</p>
                <span className="text-[11px] font-extrabold text-[#1a56db]" aria-live="polite">
                  {completedGoals}/{goals.length}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress goals: ${progressPct}%`}
                className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-4"
              >
                <div className="goal-bar h-full bg-gradient-to-r from-[#1a56db] to-[#60a5fa] rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="space-y-2">
                {goals.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => {
                      setGoals((p) => {
                        const updated = p.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x))
                        localStorage.setItem(`study_goals_${user.id}_${userId}`, JSON.stringify(updated))
                        return updated
                      })
                    }}
                    aria-pressed={g.done}
                    className="goal-check w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left hover:bg-[#f8fafc] group border border-[#f1f5f9] hover:cursor-pointer"
                  >
                    <div className={`goal-check w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      g.done ? 'bg-[#1a56db] border-[#1a56db]' : 'border-[#cbd5e1] group-hover:border-[#93c5fd]'
                    }`}>
                      {g.done && <Check className="w-3 h-3 text-white stroke-[3]" aria-hidden="true" />}
                    </div>
                    <span className={`text-[13px] font-medium transition-all ${g.done ? 'line-through text-[#94a3b8]' : 'text-[#1e293b]'}`}>
                      {g.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Stats — real from Supabase */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-4">Shared Sessions</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <BookOpen className="w-5 h-5" aria-hidden="true" />, value: String(partnerStats.sessions), label: 'Completed' },
                  { icon: <Zap className="w-5 h-5 fill-current" aria-hidden="true" />, value: `${partnerStats.studiedHours}h`, label: 'Studied' },
                ].map((s) => (
                  <div key={s.label} className="bg-[#f8fafc] rounded-[14px] p-4 flex flex-col gap-1.5 border border-[#f1f5f9]">
                    <span className="text-[#1a56db]">{s.icon}</span>
                    <span className="text-[20px] font-extrabold text-[#0f172a] leading-tight">{s.value}</span>
                    <span className="text-[11px] font-medium text-[#64748b]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Tip */}
            <div
              className="sidebar-card relative bg-gradient-to-br from-[#1a56db] to-[#1d4ed8] rounded-[20px] overflow-hidden px-6 py-7 text-white"
              style={{ boxShadow: '0 6px 24px rgba(26,86,219,.25)' }}
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute right-3 bottom-3 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#bfdbfe]" aria-hidden="true" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#bfdbfe]">Study Tip</span>
                </div>
                <p className="text-[13px] font-medium leading-[1.7] text-blue-50">
                  Start with the hardest topic when your energy is highest — the &ldquo;Eat the Frog&rdquo; technique!
                </p>
                <p className="mt-3 text-[11px] font-bold text-[#93c5fd]">&rarr; Maximum Productivity</p>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </>
  )
}
