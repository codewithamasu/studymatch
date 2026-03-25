import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, MessageCircle, CheckCheck, Sparkles, Users, RefreshCw, AlertCircle } from 'lucide-react'
import gsap from 'gsap'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchConversationSummaries, subscribeToConversations } from '@/lib/studymatchRealtime'
import { DISPLAY_FONT } from '@/lib/constants'



const getAvatar = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=b6e3f4`

function formatLastTime(rawValue) {
  if (!rawValue) return ''
  // If the value is already a human-readable string (e.g. "03:45 AM"), return as-is
  const asDate = new Date(rawValue)
  if (isNaN(asDate.getTime())) return rawValue
  const diffMs = Date.now() - asDate.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return asDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return asDate.toLocaleDateString('en-US', { weekday: 'short' })
  return asDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-neutral-200/70 rounded-lg animate-pulse ${className}`} aria-hidden="true" />
}

function InboxSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f6f8] pt-[88px] pb-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="bg-white rounded-[20px] overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-neutral-100">
              <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatInboxPage() {
  const user = useAuthStore((state) => state.user)
  const conversations = useChatStore((state) => state.conversations)
  const setConversations = useChatStore((state) => state.setConversations)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const headerRef = useRef(null)

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchConversationSummaries(user.id)
      setConversations(data)
    } catch (error) {
      setLoadError(error?.message || 'Failed to load conversations.')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, setConversations])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Realtime: refresh conversation list whenever a new message arrives in any of our conversations
  const conversationIds = useMemo(
    () => conversations.map((c) => c.conversationId).filter(Boolean),
    [conversations]
  )

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !conversationIds.length) return

    const sub = subscribeToConversations(user.id, conversationIds, () => {
      // Re-fetch summaries so unread counts and lastMessage stay fresh
      fetchConversationSummaries(user.id)
        .then((data) => setConversations(data))
        .catch(() => {})
    })

    return () => sub.unsubscribe()
  }, [user?.id, conversationIds, setConversations])

  // GSAP entrance once data is ready
  useEffect(() => {
    if (loading || !conversations.length) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -24, opacity: 0, duration: 0.45, ease: 'power3.out' })
      gsap.from('.conv-item', {
        y: 20, opacity: 0, stagger: 0.07, duration: 0.4, ease: 'power3.out', delay: 0.15,
      })
    })
    return () => ctx.revert()
  }, [loading, conversations.length])

  const filtered = conversations.filter((c) => {
    const name = c.user?.full_name?.toLowerCase() || ''
    const subj = (c.subject || '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || subj.includes(q)
  })

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0)

  if (loading) return <InboxSkeleton />

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
          <h2 
            className="text-xl font-bold text-neutral-900 mb-1"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Failed to load chat
          </h2>
          <p className="text-sm text-neutral-500 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={loadConversations}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#1a56db] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Messages - StudyMatch</title>
        <meta name="description" content="View your active study partner conversations and messages." />
      </Helmet>
      <div className="min-h-screen bg-[#f5f6f8]">
      <style>{`
        .conv-item:hover { background: #f8fafc; }
        .conv-item { transition: background .15s; }
        .online-ring { animation: onlinePulse 2.5s ease-in-out infinite; }
        @keyframes onlinePulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>

      <div className="max-w-2xl mx-auto pt-[88px] pb-12 px-4">

        {/* Header */}
        <div ref={headerRef} className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 
              className="text-[32px] font-bold text-[#0f172a] tracking-tight"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Messages
            </h1>
            {totalUnread > 0 && (
              <span className="bg-[#1a56db] text-white text-[12px] font-bold px-2.5 py-1 rounded-full" aria-live="polite">
                {totalUnread} new
              </span>
            )}
          </div>
          <p className="text-[14px] text-[#64748b]">Your active study partner conversations</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for partners or subjects..."
            aria-label="Search conversations"
            className="w-full pl-11 pr-4 py-3 bg-white rounded-[16px] text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#1a56db]/20"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6" role="region" aria-label="Chat Statistics">
          {[
            { label: 'Active Chats', value: conversations.length, icon: <MessageCircle className="w-4 h-4" aria-hidden="true" /> },
            { label: 'Online', value: conversations.filter((c) => c.online).length, icon: <span className="w-2 h-2 rounded-full bg-green-500 inline-block" aria-hidden="true" /> },
            { label: 'Unread', value: totalUnread, icon: <Sparkles className="w-4 h-4" aria-hidden="true" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-[20px] px-4 py-4 text-center border border-neutral-100/50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
              <div className="flex items-center justify-center gap-1.5 text-[#1a56db] mb-1">{s.icon}</div>
              <div 
                className="text-[24px] font-bold text-[#0f172a] leading-tight" 
                style={{ fontFamily: DISPLAY_FONT }}
                aria-live="polite"
              >
                {s.value}
              </div>
              <div className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Label */}
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">
          Study Partners
        </p>

        {/* Conversation List */}
        <div
          className="bg-white rounded-[20px] overflow-hidden"
          role="list"
          aria-label="Conversation list"
          aria-live="polite"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,.07)' }}
        >
          {conversations.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" aria-hidden="true" />
              <p className="text-[14px] font-semibold text-[#94a3b8]">No conversations yet</p>
              <p className="text-[12px] text-[#94a3b8] mt-1">Match with someone to start chatting!</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" aria-hidden="true" />
              <p className="text-[14px] font-semibold text-[#94a3b8]">Not found</p>
            </div>
          ) : (
            filtered.map((c, i) => {
              const lastTimeFmt = formatLastTime(c.lastTimeIso || c.lastTime)
              return (
                <button
                  key={c.conversationId || c.userId}
                  role="listitem"
                  type="button"
                  onClick={() => navigate(`/chat/${c.userId}`)}
                  aria-label={`Open chat with ${c.user?.full_name}`}
                  className={`conv-item w-full flex items-center gap-4 px-5 py-4 text-left ${
                    i < filtered.length - 1 ? 'border-b border-[#f1f5f9]' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#eff6ff] border-2 border-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                      <img src={getAvatar(c.user?.full_name)} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                    </div>
                    {c.online && (
                      <span className="online-ring absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#22c55e] rounded-full border-2 border-white" aria-label="Online" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span 
                        className="text-[16px] font-bold text-[#0f172a] truncate"
                        style={{ fontFamily: DISPLAY_FONT }}
                      >
                        {c.user?.full_name}
                      </span>
                      <span className={`text-[11px] shrink-0 ml-2 ${c.unread > 0 ? 'text-[#1a56db] font-bold' : 'text-[#94a3b8]'}`}>
                        {lastTimeFmt || c.lastTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {c.subject && (
                        <span className="text-[11px] font-semibold text-[#1a56db] bg-[#eff6ff] px-2 py-0.5 rounded-full shrink-0">
                          {c.subject}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-[#64748b] truncate flex-1">{c.lastMessage}</p>
                      {c.unread > 0 ? (
                        <span aria-label={`${c.unread} unread messages`} className="ml-2 shrink-0 w-5 h-5 bg-[#1a56db] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      ) : (
                        <CheckCheck className="ml-2 shrink-0 w-3.5 h-3.5 text-[#94a3b8]" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Discover tip */}
        <div
          className="mt-6 bg-gradient-to-br from-[#1a56db] to-[#2563eb] rounded-[20px] p-5 text-white flex items-start gap-4"
          style={{ boxShadow: '0 6px 24px rgba(26,86,219,.2)' }}
        >
          <div className="w-10 h-10 rounded-[12px] bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p 
              className="text-[16px] font-bold text-white mb-0.5"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Keep finding study partners
            </p>
            <p className="text-[12px] text-blue-200 leading-relaxed">
              Go to <strong className="text-white">Discover</strong> to swipe new partners, then continue the conversation here.
            </p>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}
