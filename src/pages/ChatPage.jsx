import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import {
  Calendar,
  FolderOpen,
  BarChart2,
  Video,
  Search,
  Paperclip,
  Smile,
  Send,
  Check,
  CheckCheck,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Star,
  BookOpen,
  Zap,
  Plus,
} from 'lucide-react'
import { mockUsers, mockCurrentUser } from '@/data/mockData'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchConversationThread, sendConversationMessage, markConversationRead, fetchProfileGoals, subscribeToMessages } from '@/lib/studymatchRealtime'

const QUICK_REPLIES = [
  { icon: '📅', label: 'Suggest 4 PM tomorrow' },
  { icon: '📚', label: 'Send study guide link' },
  { icon: '🏫', label: 'Library 2nd Floor?' },
]

const INITIAL_MESSAGES = [
  { id: 1, from: 'partner', text: "Hey! Thanks for the match. I saw you're also working on the Data Structures assignment. How's it going so far?", time: '2:50 PM', read: true, reactions: [] },
  { id: 2, from: 'me', text: "Hey Alex! It's going okay, but I'm definitely struggling with the AVL tree rotations. Did you finish that part yet?", time: '2:52 PM', read: true, reactions: ['👍'] },
  { id: 3, from: 'partner', text: "I just finished it! I'd be happy to show you how I approached it. Are you free to meet up at the library tomorrow afternoon?", time: '2:55 PM', read: true, reactions: [] },
]

const INITIAL_GOALS = [
  { id: 'g1', text: 'Set up study session', done: false },
  { id: 'g2', text: 'Discuss course materials', done: false },
]

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥']
const displayFont = '"Fraunces", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
const EMPTY_MESSAGES = []

function formatMessageTime(value) {
  if (!value) return 'Now'

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function normalizeConversationMessages(messages = [], currentUserId) {
  return messages.map((message, index) => ({
    id: message.id ?? `msg-${index}`,
    from:
      message.from ||
      (message.sender_profile_id && message.sender_profile_id === currentUserId ? 'me' : 'partner'),
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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sendError, setSendError] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEnd = useRef(null)
  const inputRef = useRef(null)
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

  const avatar = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`
  const myAvatar = avatar((user || mockCurrentUser)?.full_name || 'User')
  const partnerAvatar = avatar(partner?.full_name || 'Study Partner')

  useEffect(() => {
    let mounted = true

    async function loadThread() {
      setLoading(true)
      setLoadError('')

      try {
        if (!isSupabaseConfigured) {
          const demoPartner = mockUsers.find(c => c.id === userId) || mockUsers[0]
          setThread({
            conversation: { id: userId, conversation_type: 'direct' },
            peerProfile: demoPartner,
            messages: normalizeConversationMessages(INITIAL_MESSAGES, user?.id)
          })
          setGoals(INITIAL_GOALS)
          return
        }

        if (!user?.id) return

        const [threadData, partnerGoals] = await Promise.all([
          fetchConversationThread(user.id, userId),
          fetchProfileGoals(userId)
        ])

        if (!mounted) return

        const normalizedMessages = normalizeConversationMessages(threadData.messages, user.id)
        setThread({
          ...threadData,
          messages: normalizedMessages
        })

        if (threadData.conversation?.id) {
          hydrateConversation(threadData.conversation.id, normalizedMessages)
        }

        if (partnerGoals.length > 0) {
          setGoals(partnerGoals.map((g, idx) => ({ id: `pg-${idx}`, text: g.label, done: false })))
        } else {
          setGoals(INITIAL_GOALS)
        }

      } catch (error) {
        if (!mounted) return
        setLoadError(error?.message || 'Gagal memuat percakapan.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadThread()

    return () => {
      mounted = false
    }
  }, [hydrateConversation, user?.id, userId])

  // Real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !thread?.conversation?.id) return

    const sub = subscribeToMessages(thread.conversation.id, (newMessage) => {
      addRealtimeMessage(thread.conversation.id, newMessage, user?.id)
    })

    return () => {
      sub.unsubscribe()
    }
  }, [thread?.conversation?.id, addRealtimeMessage, user?.id])

  // GSAP mount animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Left sidebar: slides in from left
      tl.fromTo(leftSidebarRef.current,
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55 }, 0)

      // Right sidebar: slides in from right
      tl.fromTo(rightSidebarRef.current,
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55 }, 0)

      // Chat header: fades down
      tl.fromTo(chatHeaderRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 }, 0.15)

      // Chat body + input: fade up
      tl.fromTo(chatBodyRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 }, 0.25)

      // Sidebar cards: stagger in
      tl.fromTo('.sidebar-card',
        { y: 20, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.07 }, 0.3)
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!thread?.conversation?.id || !user?.id || !isSupabaseConfigured) return
    markConversationRead(thread.conversation.id, user.id).catch(() => {})
  }, [thread?.conversation?.id, user?.id])

  const sendMsg = async (e, override) => {
    e?.preventDefault()
    const txt = override ?? draft
    if (!txt.trim()) return
    if (!threadId) return
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
      setSendError(error?.message || 'Gagal mengirim pesan.')
    }
  }

  const addReaction = (msgId, emoji) => {
    addReactionToConversation(threadId, msgId, emoji)
  }

  const completedGoals = goals.filter(g => g.done).length
  const progressPct = Math.round((completedGoals / goals.length) * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#dbeafe] border-t-[#1a56db]" />
          <p className="text-sm font-medium text-[#64748b]">Syncing conversation...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-[0px_12px_40px_rgba(0,0,0,0.08)]">
          <h1
            className="text-2xl font-semibold tracking-[-0.04em] text-[#0f172a]"
            style={{ fontFamily: displayFont }}
          >
            Gagal memuat chat
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{loadError}</p>
        </div>
      </div>
    )
  }

  if (isSupabaseConfigured && !thread?.peerProfile) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-[0px_12px_40px_rgba(0,0,0,0.08)]">
          <h1
            className="text-2xl font-semibold tracking-[-0.04em] text-[#0f172a]"
            style={{ fontFamily: displayFont }}
          >
            Profil tidak ditemukan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">Partner yang kamu cari tidak tersedia.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(10px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes typeDot { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes popIn { 0% { transform:scale(0); opacity:0; } 70% { transform:scale(1.15); } 100% { transform:scale(1); opacity:1; } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.5); } 70% { box-shadow:0 0 0 7px rgba(34,197,94,0); } }
        @keyframes shimmer { 0%,100% { opacity:.8; } 50% { opacity:1; } }
        .fresh { animation: msgIn .3s cubic-bezier(.22,1,.36,1) both; }
        .td1 { animation: typeDot 1.3s infinite; }
        .td2 { animation: typeDot 1.3s .15s infinite; }
        .td3 { animation: typeDot 1.3s .3s infinite; }
        .reaction-pop { animation: popIn .25s cubic-bezier(.34,1.56,.64,1) both; }
        .online-dot { animation: pulse 2.5s ease-in-out infinite; }
        .goal-check { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
        .msg-hover:hover .reaction-trigger { opacity:1 !important; }
        .goal-bar { transition: width .5s cubic-bezier(.4,0,.2,1); }
        .action-btn { transition: background .15s, transform .12s, color .15s; }
        .action-btn:hover { transform: scale(1.08); }
        .send-glow:not(:disabled):hover { box-shadow: 0 4px 18px rgba(26,86,219,.35); transform:scale(1.08); }
        .send-glow:not(:disabled):active { transform: scale(.94); }
        .pill-btn { transition: all .15s ease; }
        .pill-btn:hover { background:#eff6ff; transform:translateY(-1px); box-shadow:0 4px 14px rgba(26,86,219,.12); }
        .card-hover { transition: box-shadow .2s, transform .2s; }
        .card-hover:hover { box-shadow:0 4px 20px rgba(0,0,0,.06); transform:translateY(-1px); }
      `}</style>

      {sendError && (
        <div className="fixed top-[76px] left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg">
          {sendError}
        </div>
      )}

      {/* Outer container locked to viewport */}
      <div className="-mt-16 flex bg-[#f0f4f8] overflow-hidden" style={{ height: '100vh' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══════ LEFT SIDEBAR ══════ */}
        {/* Desktop: static; Mobile: slide-in drawer */}
        <aside ref={leftSidebarRef} className={`
          w-[270px] shrink-0 flex flex-col bg-[#f5f6f8] overflow-y-auto
          transition-transform duration-300 ease-in-out
          fixed lg:static z-40 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `} style={{ height: '100vh', paddingTop: 64 }}>
          <div className="p-4 flex flex-col gap-4">

          {/* Profile Card */}
          <div className="sidebar-card bg-white rounded-[20px] px-6 pt-8 pb-7 text-center" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe]">
                <img src={partnerAvatar} alt={partner.full_name}
                  className="w-full h-full rounded-full object-cover bg-[#eff6ff]" />
              </div>
              <span className="online-dot absolute bottom-1.5 right-1.5 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-white block" />
            </div>
            <h2
              className="mb-0.5 text-[1.05rem] font-semibold tracking-[-0.04em] text-[#0f172a]"
              style={{ fontFamily: displayFont }}
            >
              {partner?.full_name}
            </h2>
            <p className="text-[12px] text-[#64748b] font-medium mb-4">{partner?.university || 'Mahasiswa'}</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {(partner?.study_profile?.subjects || []).slice(0, 3).map(t => (
                <span key={t} className="px-3 py-1 bg-[#eff6ff] text-[#1a56db] text-[11px] font-bold rounded-full border border-[#bfdbfe]/60">{t}</span>
              ))}
            </div>
            <div className="mt-5 px-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Compatibility</span>
                <span className="text-[12px] font-extrabold text-[#1a56db]">92%</span>
              </div>
              <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1a56db] to-[#60a5fa] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="sidebar-card bg-white rounded-[20px] px-5 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/sessions/new?partnerId=${partner.id}`)}
                className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] bg-[#1a56db] text-white shadow-md shadow-blue-200/60 hover:bg-blue-700 text-left">
                <div className="w-9 h-9 rounded-[9px] bg-white/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[13px] leading-tight">Schedule Session</p>
                  <p className="text-[11px] text-blue-200 font-medium mt-0.5">Pick a time to study</p>
                </div>
              </button>
              <button className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] border border-[#e2e8f0] bg-[#fafafa] text-[#334155] hover:bg-[#f1f5f9] text-left">
                <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center shrink-0 text-[#1a56db]">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[13px] leading-tight">Shared Resources</p>
                  <p className="text-[11px] text-[#94a3b8] font-medium mt-0.5">Files & notes</p>
                </div>
              </button>
              <button className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] border border-[#e2e8f0] bg-[#fafafa] text-[#334155] hover:bg-[#f1f5f9] text-left">
                <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center shrink-0 text-[#1a56db]">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[13px] leading-tight">Study Log</p>
                  <p className="text-[11px] text-[#94a3b8] font-medium mt-0.5">Track your progress</p>
                </div>
              </button>
            </div>
          </div>

          {/* Mutual Courses Card */}
          <div className="sidebar-card bg-white rounded-[20px] px-5 py-7 flex-1" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">Mutual Courses</p>
            <div className="space-y-2">
              {(partner?.study_profile?.subjects || []).map((subj, idx) => (
                <button key={subj}
                  className="action-btn w-full flex items-center gap-3 px-3 py-3.5 rounded-[14px] hover:bg-[#f8fafc] group text-left border border-[#f1f5f9]">
                  <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center text-[#1a56db] text-sm font-bold shrink-0 group-hover:bg-[#dbeafe] transition-colors">
                    {idx === 0 ? '🗂️' : 'Σ'}
                  </div>
                  <span className="text-[13px] font-semibold text-[#334155] flex-1">{subj}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Report */}
          <div className="px-4 py-3">
            <button className="flex items-center gap-2 text-[12px] text-[#94a3b8] hover:text-[#ef4444] transition-colors font-medium mx-auto">
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-black">!</span>
              Report Interaction
            </button>
          </div>
          </div>
        </aside>

        {/* ══════ MAIN CHAT ══════ */}
        <main className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '100vh', paddingTop: 64 }}>

          {/* Chat Header */}
          <header ref={chatHeaderRef} className="h-[68px] flex items-center justify-between px-4 md:px-8 bg-white border-b border-[#f1f5f9] shrink-0 sticky z-20" style={{ top: 64 }}>
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors shrink-0"
                aria-label="Toggle sidebar">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#eff6ff]">
                  <img src={partnerAvatar} alt={partner.full_name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-white" />
              </div>
              <div>
                <h1
                  className="text-[1.05rem] font-semibold tracking-[-0.04em] text-[#0f172a] leading-tight"
                  style={{ fontFamily: displayFont }}
                >
                  {partnerName}
                </h1>
                <p className="text-[12px] text-[#22c55e] font-semibold">Online now</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[
                { icon: <Video className="w-5 h-5" />, label: 'Video call' },
                { icon: <Search className="w-[18px] h-[18px]" />, label: 'Search' },
                { icon: <MoreHorizontal className="w-5 h-5" />, label: 'More' },
              ].map(a => (
                <button key={a.label} title={a.label}
                  className="action-btn w-9 h-9 rounded-full text-[#94a3b8] flex items-center justify-center hover:text-[#1a56db] hover:bg-[#eff6ff]">
                  {a.icon}
                </button>
              ))}
            </div>
          </header>

          {/* Messages */}
          <section ref={chatBodyRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-1 bg-[#fafbfc]" style={{ minHeight: 0 }}>

            {/* Match Intro Card */}
            <div className="flex justify-center mb-10">
              <div className="relative bg-white rounded-[28px] px-8 py-8 text-center max-w-[460px] w-full overflow-hidden"
                style={{ boxShadow: '0 2px 24px rgba(26,86,219,.08)', border: '1px solid rgba(219,234,254,.8)' }}>
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(#93c5fd 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="relative z-10">
                  <div className="flex justify-center mb-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#ffedd5] border-[3px] border-white shadow-md z-10 relative">
                        <img src={myAvatar} alt="You" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#e0f2fe] border-[3px] border-white shadow-md absolute top-0 -right-8">
                        <img src={partnerAvatar} alt={partner.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#1a56db] rounded-full flex items-center justify-center z-20 shadow-lg shadow-blue-200">
                        <Zap className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <p
                    className="mb-3 mt-4 text-[1.7rem] font-semibold tracking-[-0.05em] text-[#1a56db]"
                    style={{ fontFamily: displayFont }}
                  >
                    It's a Study Match! 🎉
                  </p>
                  <p className="text-[13px] text-[#475569] leading-relaxed mb-5">
                    You and <strong className="text-[#0f172a]">{partnerName}</strong> both want to study Computer Science this week. Start the conversation to ace your exams together!
                  </p>
                  <div className="inline-flex items-center gap-2 bg-[#f0f9ff] text-[#0284c7] text-[11px] font-bold px-4 py-2 rounded-full border border-[#bae6fd]">
                    <Clock className="w-3.5 h-3.5" />
                    Matched Today at 2:45 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Date divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#f1f5f9]" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] bg-[#fafbfc] px-2">Today</span>
              <div className="flex-1 h-px bg-[#f1f5f9]" />
            </div>

            {/* Messages */}
            {messages.map(msg => {
              const isMe = msg.from === 'me'
              const showReactor = reactionPickerId === msg.id
              return (
                <div key={msg.id}
                  className={`msg-hover flex gap-3 group relative ${isMe ? 'justify-end' : 'justify-start'} ${msg.fresh ? 'fresh' : ''} mb-2`}
                  onMouseLeave={() => reactionPickerId === msg.id && setReactionPickerId(null)}>

                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 self-end mb-5 bg-[#e0f2fe]">
                      <img src={partnerAvatar} alt="P" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className={`relative flex flex-col max-w-[400px] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Reaction picker trigger */}
                    <button
                      className="reaction-trigger absolute top-0 z-10 opacity-0 transition-opacity duration-150"
                      style={{ [isMe ? 'left' : 'right']: '-28px' }}
                      onClick={() => setReactionPickerId(showReactor ? null : msg.id)}>
                      <span className="text-[16px]">😊</span>
                    </button>

                    {/* Reaction picker */}
                    {showReactor && (
                      <div className={`reaction-pop absolute z-30 bottom-full mb-2 flex gap-1 bg-white rounded-full shadow-xl border border-[#f1f5f9] px-2 py-1.5 ${isMe ? 'right-0' : 'left-0'}`}>
                        {EMOJI_REACTIONS.map(e => (
                          <button key={e} onClick={() => addReaction(msg.id, e)}
                            className="text-[18px] hover:scale-125 transition-transform leading-none">
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`px-5 py-3.5 rounded-[22px] text-[14px] leading-relaxed shadow-sm ${isMe
                        ? 'bg-[#1a56db] text-white rounded-br-[4px] shadow-blue-100'
                        : 'bg-white text-[#1e293b] rounded-bl-[4px] border border-[#f1f5f9]'
                      }`}>
                      {msg.text}
                    </div>

                    {/* Reactions display */}
                    {msg.reactions.length > 0 && (
                      <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        {msg.reactions.map(r => (
                          <button key={r} onClick={() => addReaction(msg.id, r)}
                            className="text-[13px] bg-white border border-[#f1f5f9] rounded-full px-1.5 py-0.5 shadow-sm hover:scale-110 transition-transform">
                            {r}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Time + status */}
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] text-[#94a3b8] font-medium">{msg.time}</span>
                      {isMe && (msg.read
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#1a56db]" />
                        : <Check className="w-3.5 h-3.5 text-[#94a3b8]" />
                      )}
                    </div>
                  </div>

                  {isMe && <div className="w-8 shrink-0" />}
                </div>
              )
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 mb-2 fresh">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e0f2fe] shrink-0">
                  <img src={partnerAvatar} alt="typing" className="w-full h-full object-cover" />
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
          <div className={`px-8 pt-4 pb-6 bg-white border-t transition-colors ${inputFocused ? 'border-[#1a56db]/20' : 'border-[#f1f5f9]'}`}>
            <form onSubmit={sendMsg}
              className={`flex items-center gap-3 rounded-[24px] px-5 py-3 border bg-[#f8fafc] transition-all duration-200 ${inputFocused ? 'border-[#1a56db] ring-4 ring-[#1a56db]/10 bg-white' : 'border-[#e2e8f0]'
                }`}>
              <button type="button" className="action-btn text-[#94a3b8] hover:text-[#1a56db] shrink-0">
                <Paperclip className="w-[21px] h-[21px]" />
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => {
                  setSendError('')
                  if (threadId) {
                    setDraft(threadId, e.target.value)
                  }
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] outline-none min-w-0"
              />
              {draft && (
                <span className="text-[11px] text-[#94a3b8] shrink-0">{draft.length}</span>
              )}
              <button type="button" className="action-btn text-[#94a3b8] hover:text-[#1a56db] shrink-0">
                <Smile className="w-[21px] h-[21px]" />
              </button>
              <button
                type="submit"
                disabled={!draft.trim()}
                className={`send-glow w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-15 ${draft.trim() ? 'bg-[#1a56db] text-white' : 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
                  }`}>
                <Send className="w-[17px] h-[17px] ml-[2px]" />
              </button>
            </form>

            {/* Quick Replies */}
            <div className="flex items-center gap-2 mt-3.5 overflow-x-auto">
              {QUICK_REPLIES.map(q => (
                <button key={q.label}
                  onClick={() => sendMsg(null, q.label)}
                  className="pill-btn flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#dbeafe] text-[#1a56db] text-[12px] font-semibold whitespace-nowrap bg-white">
                  <span role="img">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* ══════ RIGHT SIDEBAR — hidden on mobile ══════ */}
        <aside ref={rightSidebarRef} className="hidden lg:flex w-[290px] shrink-0 bg-[#f5f6f8] flex-col overflow-y-auto" style={{ height: '100vh', paddingTop: 64 }}>
          <div className="p-4 flex flex-col gap-4">

            {/* Upcoming Session Card */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div
                onClick={() => navigate(`/sessions/new?partnerId=${partner.id}`)}
                className="card-hover rounded-[16px] border border-dashed border-[#cbd5e1] px-4 py-7 text-center cursor-pointer bg-[#fafafa] hover:border-[#93c5fd] hover:bg-[#f0f9ff] transition-colors">
                <div className="w-12 h-12 mx-auto rounded-[14px] bg-white border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] mb-4 shadow-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-[13px] text-[#64748b] font-medium mb-4 leading-relaxed">No sessions scheduled yet.</p>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1a56db] hover:underline">
                  <Plus className="w-4 h-4" /> Pick a time
                </span>
              </div>
            </div>

            {/* Study Goals Card */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8]">Study Goals</p>
                <span className="text-[11px] font-extrabold text-[#1a56db]">{completedGoals}/{goals.length}</span>
              </div>
              <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-4">
                <div className="goal-bar h-full bg-gradient-to-r from-[#1a56db] to-[#60a5fa] rounded-full"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <div className="space-y-2">
                {goals.map(g => (
                  <button key={g.id}
                    onClick={() => setGoals(p => p.map(x => x.id === g.id ? { ...x, done: !x.done } : x))}
                    className="goal-check w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left hover:bg-[#f8fafc] group border border-[#f1f5f9]">
                    <div className={`goal-check w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      g.done ? 'bg-[#1a56db] border-[#1a56db]' : 'border-[#cbd5e1] group-hover:border-[#93c5fd]'
                    }`}>
                      {g.done && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                    <span className={`text-[13px] font-medium transition-all ${g.done ? 'line-through text-[#94a3b8]' : 'text-[#1e293b]'}`}>
                      {g.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="sidebar-card bg-white rounded-[20px] px-6 py-7" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-4">This Week</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, value: '3', label: 'Sessions' },
                  { icon: <Star className="w-5 h-5" />, value: '5.0', label: 'Rating' },
                  { icon: <Clock className="w-5 h-5" />, value: '6h', label: 'Studied' },
                  { icon: <Zap className="w-5 h-5 fill-current" />, value: '4', label: 'Streak' },
                ].map(s => (
                  <div key={s.label}
                    className="bg-[#f8fafc] rounded-[14px] p-4 flex flex-col gap-1.5 border border-[#f1f5f9]">
                    <span className="text-[#1a56db]">{s.icon}</span>
                    <span className="text-[20px] font-extrabold text-[#0f172a] leading-tight">{s.value}</span>
                    <span className="text-[11px] font-medium text-[#64748b]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Tip Card */}
            <div className="sidebar-card relative bg-gradient-to-br from-[#1a56db] to-[#1d4ed8] rounded-[20px] overflow-hidden px-6 py-7 text-white"
              style={{ boxShadow: '0 6px 24px rgba(26,86,219,.25)' }}>
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute right-3 bottom-3 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#bfdbfe]" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#bfdbfe]">Weekly Tip</span>
                </div>
                <p className="text-[13px] font-medium leading-[1.7] text-blue-50">
                  Taking 5-minute breaks every 25 minutes helps maintain focus during long study sessions!
                </p>
                <p className="mt-3 text-[11px] font-bold text-[#93c5fd]">→ Pomodoro Technique</p>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </>
  )
}
