import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
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
  Heart,
  Laugh,
  ThumbsUp,
  Link as LinkIcon,
  ExternalLink,
  X,
  Globe,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Trophy,
} from 'lucide-react'
import { mockUsers, mockCurrentUser, calculateCompatibility, mockSessions } from '@/data/mockData'
import { useChatStore } from '@/store/useChatStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { fetchConversationThread, sendConversationMessage, markConversationRead } from '@/lib/studymatchRealtime'

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

const MOCK_JOURNEY = [
  { id: 1, type: 'match', title: 'It\'s a Match!', date: 'Mar 10', time: '14:20', desc: 'You and Alex decided to conquer Data Structures together! ✨', icon: 'zap', color: 'bg-[#f59e0b]', border: 'border-[#fcd34d]', text: 'text-[#f59e0b]' },
  { id: 2, type: 'chat', title: 'First Conversation', date: 'Mar 10', time: '14:50', desc: 'Started planning for the upcoming Data Structures midterm.', icon: 'message', color: 'bg-[#3b82f6]', border: 'border-[#93c5fd]', text: 'text-[#3b82f6]' },
  { id: 3, type: 'session', title: 'Library Session', date: 'Mar 11', time: '2 hours', desc: 'Completed 2 hours of intense studying. Finished Lab Report 4.', icon: 'calendar', color: 'bg-[#8b5cf6]', border: 'border-[#c4b5fd]', text: 'text-[#8b5cf6]' },
  { id: 4, type: 'milestone', title: 'First Goal Achieved', date: 'Mar 12', time: '10:00', desc: 'Mastered AVL Trees successfully! 1 of 3 goals checked off. 🏆', icon: 'trophy', color: 'bg-[#10b981]', border: 'border-[#6ee7b7]', text: 'text-[#10b981]' },
]

const INITIAL_RESOURCES = [
  { id: 1, title: 'Data Structures Midterm Study Guide', url: 'https://notion.so/study-guide', provider: 'Notion', type: 'doc', date: 'Today' },
  { id: 2, title: 'AVL Trees Visualizer', url: 'https://cs.usfca.edu/', provider: 'Web', type: 'link', date: 'Yesterday' },
  { id: 3, title: 'Group Project Slides', url: 'https://canva.com/', provider: 'Canva', type: 'presentation', date: 'Mar 15' },
]

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥']

const AutoScrollPill = ({ text }) => {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      setShouldAnimate(textRef.current.scrollWidth > containerRef.current.clientWidth)
    }
  }, [text])

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden w-[86px] h-[26px] bg-[#eff6ff] text-[#1a56db] text-[11px] font-bold rounded-full border border-[#bfdbfe]/60 cursor-default"
      title={text}
    >
      <div 
        ref={textRef}
        className={`h-full flex items-center ${shouldAnimate ? 'w-max hover-marquee' : 'justify-center w-full px-2'}`}
      >
        <span className={`whitespace-nowrap ${shouldAnimate ? 'pr-4 pl-2' : 'truncate'}`}>{text}</span>
        {shouldAnimate && <span className="whitespace-nowrap pr-4">{text}</span>}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const { userId } = useParams()
  const navigate = useNavigate()

  const {
    messagesByConversation,
    isTypingByConversation,
    reactionPickerId,
    drafts,
    hydrateConversation,
    setTyping,
    setReactionPickerId,
    setDraft,
    sendMessage,
    addReaction: addReactionToConversation,
  } = useChatStore()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sendError, setSendError] = useState('')
  const [thread, setThread] = useState(null)
  
  const partner = thread?.peerProfile || mockUsers.find(u => String(u.id) === String(userId)) || mockUsers.find(u => u.full_name === 'Alex Johnson') || mockUsers[0]
  
  const threadId = thread?.conversation?.id || userId
  const messages = messagesByConversation[threadId] || INITIAL_MESSAGES
  const draft = drafts[threadId] || ''
  const isTyping = isTypingByConversation[threadId] || false

  const [goals, setGoals] = useState([])
  
  useEffect(() => {
    if (partner?.study_profile) {
      const subject = partner.study_profile.subjects?.[0] || 'Materi Utama'
      const subject2 = partner.study_profile.subjects?.[1] || 'Latihan Soal'
      const goalStr = partner.study_profile.study_goal ? partner.study_profile.study_goal.replace('_', ' ') : 'Target Belajar'
      setGoals([
        { id: 1, text: `Review ${subject}`, done: true },
        { id: 2, text: `Bahas ${subject2}`, done: false },
        { id: 3, text: `Persiapan ${goalStr}`, done: false }
      ])
    } else {
      setGoals([
        { id: 1, text: 'Review Materi', done: true },
        { id: 2, text: 'Bahas Tugas', done: false },
        { id: 3, text: 'Persiapan Kuis', done: false }
      ])
    }
  }, [partner?.id])
  const [inputFocused, setInputFocused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [resourceHubOpen, setResourceHubOpen] = useState(false)
  const [newLink, setNewLink] = useState('')
  const [studyLogOpen, setStudyLogOpen] = useState(false)

  const dynamicResources = useMemo(() => {
    return messages
      .filter((m) => m.type === 'resource' && m.resource)
      .map((m) => m.resource)
      .reverse()
  }, [messages])

  const dynamicJourney = useMemo(() => {
    const journey = []
    
    // Match event
    journey.push({
      id: 'match', type: 'match', title: "It's a Match!", 
      date: 'Today', time: '', 
      desc: `Kamu dan ${partner.full_name.split(' ')[0]} memutuskan untuk belajar bareng! ✨`, 
      icon: 'zap', color: 'bg-[#f59e0b]', border: 'border-[#fcd34d]', text: 'text-[#f59e0b]'
    })

    // First Chat
    if (messages.length > 0) {
      journey.push({
        id: 'chat', type: 'chat', title: 'Percakapan Pertama', 
        date: 'Today', time: messages[0].time, 
        desc: `Mulai merencanakan sesi belajar bersama.`, 
        icon: 'message', color: 'bg-[#3b82f6]', border: 'border-[#93c5fd]', text: 'text-[#3b82f6]'
      })
    }

    // Resources Shared
    if (dynamicResources.length > 0) {
      journey.push({
        id: 'resource', type: 'session', title: 'Berbagi Ilmu', 
        date: 'Today', time: '', 
        desc: `Telah berbagi ${dynamicResources.length} link / referensi belajar.`, 
        icon: 'link', color: 'bg-[#8b5cf6]', border: 'border-[#c4b5fd]', text: 'text-[#8b5cf6]'
      })
    }

    // Goals Achieved
    const completedGoals = goals.filter(g => g.done).length
    if (completedGoals > 0) {
      journey.push({
        id: 'milestone', type: 'milestone', title: 'Tugas Terselesaikan', 
        date: 'Today', time: '', 
        desc: `Berhasil menyelesaikan ${completedGoals} target belajar! 🏆`, 
        icon: 'trophy', color: 'bg-[#10b981]', border: 'border-[#6ee7b7]', text: 'text-[#10b981]'
      })
    }

    return journey
  }, [messages, partner, dynamicResources, goals])
  
  const messagesEnd = useRef(null)
  const inputRef = useRef(null)
  const leftSidebarRef = useRef(null)
  const rightSidebarRef = useRef(null)
  const chatHeaderRef = useRef(null)
  const chatBodyRef = useRef(null)
  const modalOverlayRef = useRef(null)
  const modalRef = useRef(null)
  const studyLogOverlayRef = useRef(null)
  const studyLogRef = useRef(null)

  const avatar = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`
  const myAvatar = avatar((user || mockCurrentUser)?.full_name || 'User')
  const partnerAvatar = avatar(partner.full_name)

  useEffect(() => {
    let mounted = true

    async function loadThread() {
      setLoading(true)
      setLoadError('')

      try {
        if (!isSupabaseConfigured) {
          const demoPartner =
            mockUsers.find((candidate) => candidate.id === userId) ||
            mockUsers.find((candidate) => candidate.full_name === 'Alex Johnson') ||
            mockUsers[0]

          const demoThread = {
            conversation: { id: userId, conversation_type: 'direct' },
            peerProfile: {
              id: demoPartner.id,
              full_name: demoPartner.full_name,
              university: demoPartner.university,
              avatar_url: demoPartner.avatar_url,
              bio: demoPartner.bio,
              study_profile: demoPartner.study_profile,
            },
            messages: INITIAL_MESSAGES,
          }

          if (!mounted) return
          setThread(demoThread)
          hydrateConversation(userId, INITIAL_MESSAGES)
          return
        }

        if (!user?.id) {
          if (!mounted) return
          setThread(null)
          return
        }

        const data = await fetchConversationThread(user.id, userId)
        if (!mounted) return
        setThread(data)

        if (data.conversation?.id) {
          const transformedMessages = data.messages.map(m => ({
            id: m.id,
            text: m.body,
            from: m.sender_profile_id === user.id ? 'me' : 'partner',
            time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: true,
            type: m.metadata?.type || 'text',
            resource: m.metadata?.resource || null,
            reactions: m.metadata?.reactions || []
          }))
          if (transformedMessages.length === 0) {
            hydrateConversation(data.conversation.id, INITIAL_MESSAGES)
          } else {
            hydrateConversation(data.conversation.id, transformedMessages)
          }
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

  // Real-time message listener
  useEffect(() => {
    if (!threadId || !isSupabaseConfigured || !user?.id) return

    const channel = supabase
      .channel(`room:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new
          // Check if message is from partner
          if (newMsg.sender_profile_id !== user.id) {
            useChatStore.getState().receiveMessage(threadId, newMsg.body, newMsg.metadata)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, user?.id])

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
    if (!thread?.conversation?.id || !user?.id) return

    setSendError('')
    sendMessage(thread.conversation.id, txt)
    inputRef.current?.focus()
    setTyping(thread.conversation.id, false)

    try {
      await sendConversationMessage(thread.conversation.id, user.id, txt)
    } catch (error) {
      setSendError(error?.message || 'Gagal mengirim pesan.')
    }
  }

  const addReaction = (msgId, emoji) => {
    addReactionToConversation(threadId, msgId, emoji)
  }

  const openResourceHub = () => {
    setResourceHubOpen(true)
    setTimeout(() => {
      gsap.fromTo(modalOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo(modalRef.current, { y: 60, scale: 0.9, opacity: 0, rotateX: 10 }, { y: 0, scale: 1, opacity: 1, rotateX: 0, duration: 0.6, ease: 'expo.out' })
      gsap.fromTo('.resource-item', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 })
    }, 10)
  }

  const closeResourceHub = () => {
    gsap.to(modalOverlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' })
    gsap.to(modalRef.current, { y: 40, scale: 0.95, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => setResourceHubOpen(false) })
  }

  const openStudyLog = () => {
    setStudyLogOpen(true)
    setTimeout(() => {
      gsap.fromTo(studyLogOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo(studyLogRef.current, { x: 40, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.1)' })
      gsap.fromTo('.log-item', { x: -25, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.15 })
      gsap.fromTo('.log-line', { height: 0 }, { height: '100%', duration: 1.2, ease: 'power3.inOut', delay: 0.3 })
    }, 10)
  }

  const closeStudyLog = () => {
    gsap.to(studyLogOverlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' })
    gsap.to(studyLogRef.current, { x: 30, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: () => setStudyLogOpen(false) })
  }

  const addResource = (e) => {
    e.preventDefault()
    if (!newLink.trim()) return
    const id = Date.now()
    const isNotion = newLink.toLowerCase().includes('notion')
    const isDrive = newLink.toLowerCase().includes('drive.google')
    const isCanva = newLink.toLowerCase().includes('canva')
    const provider = isNotion ? 'Notion' : isDrive ? 'Google Drive' : isCanva ? 'Canva' : 'Web Link'
    
    // Auto-generate title from URL domain for demo
    let domain = new URL(newLink.startsWith('http') ? newLink : `https://${newLink}`).hostname
    let titleParts = domain.split('.')
    let title = titleParts.length > 1 ? titleParts[titleParts.length - 2] : domain
    title = title.charAt(0).toUpperCase() + title.slice(1) + ' Resource'
    
    const newItem = { id, title: title, url: newLink.startsWith('http') ? newLink : `https://${newLink}`, provider, type: 'link', date: 'Barusan', fresh: true }
    setNewLink('')
    
    setTimeout(() => {
      gsap.fromTo(`.resource-item-${id}`, 
        { height: 0, opacity: 0, scale: 0.9, marginBottom: 0 }, 
        { height: 'auto', opacity: 1, scale: 1, marginBottom: 12, duration: 0.5, ease: 'back.out(1.2)' })
    }, 10)
    
    // Add message to chat as well
    useChatStore.setState(s => ({
      ...s,
      messagesByConversation: {
        ...s.messagesByConversation,
        [threadId]: [
          ...(s.messagesByConversation[threadId] || INITIAL_MESSAGES),
          { id: Date.now() + 1, from: 'me', text: '', type: 'resource', resource: newItem, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), read: false, fresh: true, reactions: [] }
        ]
      }
    }))
    setTimeout(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    
    // Save to Database
    if (isSupabaseConfigured && threadId && user?.id) {
      sendConversationMessage(threadId, user.id, '[Membagikan Resource Belajar]', { type: 'resource', resource: newItem }).catch(() => {})
    }
  }

  const completedGoals = goals.filter(g => g.done).length
  const progressPct = Math.round((completedGoals / goals.length) * 100)

  // Dynamic Total Log Calculation
  const totalStudyMinutes = mockSessions
    .filter(s => String(s.partner.id) === String(partner.id) && s.status === 'completed')
    .reduce((total, s) => total + s.duration_minutes, 0)
  const logHrs = Math.floor(totalStudyMinutes / 60)
  const logMins = totalStudyMinutes % 60
  const totalLogStr = totalStudyMinutes > 0 ? `${logHrs}h ${logMins > 0 ? logMins + 'm' : ''}` : '0h 0m'

  if (loadError && !loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-[0px_12px_40px_rgba(0,0,0,0.08)]">
          <h1 className="text-2xl font-bold text-[#0f172a]">Gagal memuat chat</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!loading && isSupabaseConfigured && !thread?.conversation) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 pt-20">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-[0px_12px_40px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#1a56db]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Belum ada conversation</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
            Kamu belum punya match aktif dengan partner ini. Coba swipe di Discover dulu, lalu balik ke chat.
          </p>
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1a56db] px-4 py-3 text-sm font-semibold text-white"
          >
            Go to Discover
          </button>
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
        @keyframes marquee-pill { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .hover-marquee:hover { animation: marquee-pill 2.5s linear infinite; }
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
            <h2 className="text-[16px] font-extrabold text-[#0f172a] tracking-tight mb-0.5">{partner.full_name}</h2>
            <p className="text-[12px] text-[#64748b] font-medium mb-4">{partner.university || 'Mahasiswa'}</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {(partner.study_profile?.subjects || []).map(t => (
                <AutoScrollPill key={t} text={t} />
              ))}
            </div>
            <div className="mt-5 px-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Compatibility</span>
                <span className="text-[12px] font-extrabold text-[#1a56db]">
                  {(user && partner && partner.study_profile) ? calculateCompatibility(user, partner).total : 85}%
                </span>
              </div>
              <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1a56db] to-[#60a5fa] rounded-full" 
                     style={{ width: `${(user && partner && partner.study_profile) ? calculateCompatibility(user, partner).total : 85}%` }} />
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
              <button onClick={openResourceHub} className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] border border-[#e2e8f0] bg-[#fafafa] text-[#334155] hover:bg-[#f1f5f9] text-left">
                <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center shrink-0 text-[#1a56db]">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[13px] leading-tight">Resource Hub</p>
                  <p className="text-[11px] text-[#94a3b8] font-medium mt-0.5">Berbagi link materi</p>
                </div>
              </button>
              <button onClick={openStudyLog} className="action-btn w-full flex items-center gap-3.5 px-4 py-4 rounded-[14px] border border-[#e2e8f0] bg-[#fafafa] text-[#334155] hover:bg-[#f1f5f9] text-left">
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
              {[{ icon: '🗂️', label: 'Data Structures', badge: 'Active' }, { icon: 'Σ', label: 'Discrete Math', badge: '' }].map(c => (
                <button key={c.label}
                  className="action-btn w-full flex items-center gap-3 px-3 py-3.5 rounded-[14px] hover:bg-[#f8fafc] group text-left border border-[#f1f5f9]">
                  <div className="w-9 h-9 rounded-[9px] bg-[#eff6ff] flex items-center justify-center text-[#1a56db] text-sm font-bold shrink-0 group-hover:bg-[#dbeafe] transition-colors">
                    {c.icon}
                  </div>
                  <span className="text-[13px] font-semibold text-[#334155] flex-1">{c.label}</span>
                  {c.badge && <span className="text-[10px] font-bold text-[#22c55e] bg-[#dcfce7] px-2 py-0.5 rounded-full">{c.badge}</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] group-hover:text-[#94a3b8] transition-colors" />
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
                <h1 className="text-[16px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
                  {partner.full_name.split(' ')[0]}
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
                  <p className="text-[22px] font-black text-[#1a56db] tracking-tight mb-3 mt-4">It's a Study Match! 🎉</p>
                  <p className="text-[13px] text-[#475569] leading-relaxed mb-5">
                    You and <strong className="text-[#0f172a]">{partner.full_name.split(' ')[0]}</strong> both want to study Computer Science this week. Start the conversation to ace your exams together!
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
                    {msg.type === 'resource' && msg.resource ? (
                      <div className={`p-4 rounded-[22px] shadow-sm w-[260px] ${isMe ? 'bg-gradient-to-br from-[#1a56db] to-[#3b82f6] text-white rounded-br-[4px] shadow-blue-200' : 'bg-white text-[#1e293b] rounded-bl-[4px] border border-[#e2e8f0]'}`}>
                        <div className="flex gap-3 items-center mb-3">
                          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-[#eff6ff] text-[#1a56db]'}`}>
                            <LinkIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{msg.resource.provider}</p>
                            <p className={`text-[14px] font-bold truncate leading-tight ${isMe ? 'text-white' : 'text-[#0f172a]'}`}>{msg.resource.title}</p>
                          </div>
                        </div>
                        <a href={msg.resource.url} target="_blank" rel="noreferrer" className={`flex justify-center items-center gap-2 py-2.5 w-full rounded-[14px] text-[13px] font-bold transition-transform hover:scale-[1.03] active:scale-95 ${isMe ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#f1f5f9] text-[#1a56db] hover:bg-[#e2e8f0]'}`}>
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className={`px-5 py-3.5 rounded-[22px] text-[14px] leading-relaxed shadow-sm ${isMe
                          ? 'bg-[#1a56db] text-white rounded-br-[4px] shadow-blue-100'
                          : 'bg-white text-[#1e293b] rounded-bl-[4px] border border-[#f1f5f9]'
                        }`}>
                        {msg.text}
                      </div>
                    )}

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
              <button type="button" onClick={openResourceHub} title="Share Link" className="action-btn text-[#94a3b8] hover:text-[#1a56db] shrink-0">
                <LinkIcon className="w-[21px] h-[21px]" />
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => {
                  setSendError('')
                  setDraft(threadId, e.target.value)
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
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#94a3b8] mb-4">Minggu Ini</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, value: mockSessions.filter(s => String(s.partner.id) === String(partner.id)).length, label: 'Sessions' },
                  { icon: <Star className="w-5 h-5" />, value: ((user && partner && partner.study_profile ? calculateCompatibility(user, partner).total : 90) / 20).toFixed(1), label: 'Rating' },
                  { icon: <Clock className="w-5 h-5" />, value: totalLogStr, label: 'Studied' },
                  { icon: <Zap className="w-5 h-5 fill-current" />, value: mockSessions.filter(s => String(s.partner.id) === String(partner.id) && s.status === 'completed').length + 1, label: 'Streak' },
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

      {/* ══════ RESOURCE HUB MODAL ══════ */}
      {resourceHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ perspective: '1000px' }}>
          <div ref={modalOverlayRef} className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={closeResourceHub} />
          
          <div ref={modalRef} className="relative w-full max-w-xl bg-white backdrop-blur-xl rounded-[28px] overflow-hidden shadow-2xl border border-white/50 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 md:px-8 pt-8 pb-6 bg-gradient-to-b from-[#f8fafc] to-white relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a56db] to-[#60a5fa]" />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-[24px] font-black text-[#0f172a] tracking-tight">Resource Hub</h2>
                  <p className="text-[14px] text-[#64748b] font-medium mt-1">Shared links, docs, & materials without taking up server space.</p>
                </div>
                <button onClick={closeResourceHub} className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:bg-[#e2e8f0] hover:scale-110 transition-all shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Input Form */}
            <div className="px-6 md:px-8 pb-6 relative z-20 shadow-sm">
              <form onSubmit={addResource} className="flex gap-2 relative">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <LinkIcon className="w-5 h-5 text-[#94a3b8]" />
                  </div>
                  <input value={newLink} onChange={e => setNewLink(e.target.value)} type="url" placeholder="Paste G-Drive, Notion, or Canvas link..." required
                     className="w-full h-14 pl-12 pr-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[16px] text-[14px] font-semibold text-[#0f172a] placeholder:text-[#94a3b8] placeholder:font-medium focus:bg-white focus:border-[#1a56db] focus:ring-4 focus:ring-[#1a56db]/10 transition-all outline-none" />
                </div>
                <button type="submit" className="h-14 px-6 bg-[#1a56db] text-white font-bold text-[14px] rounded-[16px] shadow-lg shadow-blue-200 hover:bg-[#1e40af] hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Share
                </button>
              </form>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 pt-2" style={{ scrollbarWidth: 'none' }}>
               <style>{`
                 .resource-list::-webkit-scrollbar { display: none; }
               `}</style>
               <div className="space-y-3 resource-list">
                <div className="bg-[#eff6ff] text-[#1a56db] px-3 py-1.5 rounded-xl font-bold text-[13px]">
                  {dynamicResources.length} Items
                </div>
              </div>

              {dynamicResources.length === 0 ? (
                <div className="text-center py-12 px-4 bg-[#f8fafc] rounded-[24px] border-2 border-dashed border-[#e2e8f0]">
                  <div className="w-16 h-16 bg-white border border-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4 text-[#cbd5e1] shadow-sm">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                  <p className="text-[16px] font-extrabold text-[#334155] mb-1">Belum ada resource diskusi</p>
                  <p className="text-[13px] text-[#64748b] font-medium max-w-[250px] mx-auto">Bagikan materi atau link penting ke partnermu untuk diakses sewaktu-waktu.</p>
                </div>
              ) : (
                dynamicResources.map(res => (
                  <div key={res.id} className={`resource-item resource-item-${res.id} mb-3`}>
                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white rounded-[20px] border border-[#e2e8f0] shadow-sm hover:border-[#bae6fd] hover:shadow-md hover:-translate-y-1 hover:bg-[#f0f9ff] transition-all group relative overflow-hidden">
                      <div className="relative w-[50px] h-[50px] rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden bg-white border border-[#f1f5f9] shadow-sm">
                        <div className={`absolute inset-0 opacity-10 ${res.provider === 'Notion' ? 'bg-slate-800' : res.provider === 'Google Drive' ? 'bg-green-500' : res.provider === 'Canva' ? 'bg-purple-500' : 'bg-[#1a56db]'}`} />
                        {res.provider === 'Notion' ? <FileText className="w-5 h-5 text-slate-700 relative z-10" /> : 
                         res.provider === 'Google Drive' ? <FolderOpen className="w-5 h-5 text-emerald-600 relative z-10" /> : 
                         res.provider === 'Canva' ? <ImageIcon className="w-5 h-5 text-purple-600 relative z-10" /> : 
                         <Globe className="w-5 h-5 text-[#1a56db] relative z-10" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded-full group-hover:bg-white group-hover:text-[#1a56db] group-hover:border-[#bfdbfe] transition-colors">{res.provider}</span>
                          <span className="text-[11px] text-[#94a3b8] font-semibold">{res.date}</span>
                        </div>
                        <p className="text-[15px] font-extrabold text-[#0f172a] truncate group-hover:text-[#1a56db] transition-colors">{res.title}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#94a3b8] border border-[#f1f5f9] group-hover:bg-[#1a56db] group-hover:border-[#1a56db] group-hover:text-white group-hover:shadow-md transition-all shrink-0 mr-1">
                        <ExternalLink className="w-4 h-4 ml-0.5" />
                      </div>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════ STUDY LOG (JOURNEY) MODAL ══════ */}
      {studyLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:justify-end px-4 lg:px-6 py-6" style={{ perspective: '1000px' }}>
          <div ref={studyLogOverlayRef} className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-sm" onClick={closeStudyLog} />
          
          <div ref={studyLogRef} className="relative w-full max-w-[420px] h-[90vh] lg:h-[calc(100vh-120px)] bg-[#f8fafc] backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/80 flex flex-col z-10" style={{ transformOrigin: 'right center' }}>
            
            {/* Header */}
            <div className="px-8 pt-10 pb-6 bg-white shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-20">
               <button onClick={closeStudyLog} className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:bg-[#e2e8f0] hover:scale-110 hover:text-[#0f172a] transition-all">
                  <X className="w-4 h-4" />
               </button>
               <div className="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] mb-4">
                  <BarChart2 className="w-6 h-6" />
               </div>
               <h2 className="text-[26px] font-black text-[#0f172a] tracking-tight leading-none mb-1">Study Journey</h2>
               <p className="text-[14px] text-[#64748b] font-medium mt-2">See how far you and <span className="text-[#0f172a] font-bold">{partner.full_name.split(' ')[0]}</span> have come!</p>
            </div>
            
            {/* Stats row over timeline */}
            <div className="flex bg-white px-8 pb-6 border-b border-[#f1f5f9] shrink-0 gap-3 relative z-20">
               <div className="flex-1 bg-gradient-to-br from-[#1a56db] to-[#3b82f6] rounded-[16px] p-3 text-white shadow-md shadow-blue-200 hover:-translate-y-1 transition-transform cursor-default">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90"><Clock className="w-3 h-3" /> Total Log</span>
                  <p className="text-[20px] font-black leading-none">{totalLogStr}</p>
               </div>
               <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[16px] p-3 text-[#0f172a] shadow-sm hover:border-[#6ee7b7] transition-colors cursor-default">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 text-[#64748b]"><Trophy className="w-3 h-3 text-[#f59e0b]" /> Milestone</span>
                  <p className="text-[20px] font-black leading-none text-[#10b981]">{completedGoals} / {goals.length}</p>
               </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-8 py-8 relative" style={{ scrollbarWidth: 'none' }}>
               <style>{`
                 .timeline-scroll::-webkit-scrollbar { display: none; }
               `}</style>
               
               {/* Vertical line connecting nodes */}
               <div className="absolute top-[40px] left-[48px] bottom-[40px] w-[3px] bg-[#e2e8f0]/60 z-0 overflow-hidden rounded-full">
                  <div className="log-line w-full bg-gradient-to-b from-[#1a56db] via-[#8b5cf6] to-[#10b981] rounded-full" style={{ transformOrigin: 'top' }} />
               </div>

               <div className="space-y-8 relative z-10 timeline-scroll">
                  {dynamicJourney.map((item) => (
                     <div key={item.id} className="log-item flex gap-5 group">
                        {/* Timeline node */}
                        <div className={`w-[34px] h-[34px] rounded-full flex justify-center items-center shrink-0 border-[3px] shadow-sm transition-transform duration-300 group-hover:scale-110 ${item.color} ${item.border} text-white relative z-10 bg-white`}>
                           {item.icon === 'zap' && <Zap className="w-4 h-4 fill-white" />}
                           {item.icon === 'message' && <MessageCircle className="w-4 h-4 fill-white" />}
                           {item.icon === 'calendar' && <Calendar className="w-4 h-4" />}
                           {item.icon === 'trophy' && <Trophy className="w-4 h-4 fill-white" />}
                           {item.icon === 'link' && <LinkIcon className="w-4 h-4" />}
                        </div>
                        
                        {/* Timeline content */}
                        <div className="flex-1 pt-0.5 pb-2">
                           <div className="flex justify-between items-baseline mb-1">
                              <h3 className={`text-[15px] font-black ${item.text}`}>{item.title}</h3>
                              <span className="text-[11px] font-bold text-[#94a3b8]">{item.date}</span>
                           </div>
                           <p className="text-[13px] text-[#475569] font-medium leading-[1.6]">{item.desc}</p>
                           
                           {item.type === 'session' && (
                              <div className="mt-3 bg-white p-3 rounded-[12px] border border-[#e2e8f0] shadow-sm flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-[12px] bg-[#f0fdf4] flex items-center justify-center shrink-0">
                                    <CheckCheck className="w-4 h-4 text-[#16a34a]" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[12px] font-extrabold text-[#0f172a] leading-tight mb-0.5">Productive Session!</p>
                                    <p className="text-[11px] font-semibold text-[#64748b]">Logged {item.time}</p>
                                 </div>
                              </div>
                           )}
                           
                           {item.type === 'milestone' && (
                              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[11px] font-bold rounded-full">
                                 <Zap className="w-3.5 h-3.5 fill-[#d97706]" /> +50 XP Earned
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
                  
                  {/* Future node placeholder */}
                  <div className="log-item flex gap-5 opacity-40">
                     <div className="w-[34px] h-[34px] rounded-full flex justify-center items-center shrink-0 bg-[#f1f5f9] border-[3px] border-[#e2e8f0] text-[#94a3b8] relative z-10">
                        <Clock className="w-4 h-4" />
                     </div>
                     <div className="flex-1 pt-1">
                        <h3 className="text-[14px] font-bold text-[#64748b]">Next Session</h3>
                        <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5">Keep the streak going!</p>
                     </div>
                  </div>
               </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}
