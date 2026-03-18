import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockUsers } from '@/data/mockData'
import { Search, MessageCircle, CheckCheck, Clock, Sparkles, Users } from 'lucide-react'
import gsap from 'gsap'
import { useChatStore } from '@/store/useChatStore'

// Mock conversations — in real app this'd come from Supabase
const MOCK_CONVERSATIONS = [
  {
    userId: '1',
    lastMessage: "I just finished it! I'd be happy to show you how I approached it.",
    lastTime: '2:55 PM',
    unread: 2,
    online: true,
    subject: 'Data Structures',
  },
  {
    userId: '2',
    lastMessage: 'Sure! Let\'s do Saturday evening at 7 PM. I\'ll share my notes.',
    lastTime: 'Yesterday',
    unread: 0,
    online: true,
    subject: 'Calculus',
  },
  {
    userId: '3',
    lastMessage: 'Hey, have you started on the database ER diagram yet?',
    lastTime: 'Mon',
    unread: 0,
    online: false,
    subject: 'Database Systems',
  },
  {
    userId: '4',
    lastMessage: 'Physics problem set is harder than I thought 😅',
    lastTime: 'Sun',
    unread: 1,
    online: false,
    subject: 'Physics',
  },
]

const getAvatar = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`

export default function ChatInboxPage() {
  const conversations = useChatStore((state) => state.conversations)
  const setConversations = useChatStore((state) => state.setConversations)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const headerRef = useRef(null)

  useEffect(() => {
    // Attach user info to conversations
    const enriched = MOCK_CONVERSATIONS.map(c => ({
      ...c,
      user: mockUsers.find(u => u.id === c.userId),
    })).filter(c => c.user)
    setConversations(enriched)
  }, [setConversations])

  // GSAP entrance
  useEffect(() => {
    if (!conversations.length) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -24, opacity: 0, duration: 0.45, ease: 'power3.out' })
      gsap.from('.conv-item', {
        y: 20, opacity: 0, stagger: 0.07, duration: 0.4, ease: 'power3.out', delay: 0.15,
      })
    })
    return () => ctx.revert()
  }, [conversations])

  const filtered = conversations.filter(c =>
    c.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  return (
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

      {/* Page content — padded below navbar */}
      <div className="max-w-2xl mx-auto pt-[88px] pb-12 px-4">

        {/* Header */}
        <div ref={headerRef} className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-[#1a56db] text-white text-[12px] font-bold px-2.5 py-1 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          <p className="text-[14px] text-[#64748b]">Your active study partner conversations</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners or subjects..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-[16px] text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#1a56db]/20"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active Chats', value: conversations.length, icon: <MessageCircle className="w-4 h-4" /> },
            { label: 'Online Now', value: conversations.filter(c => c.online).length, icon: <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> },
            { label: 'Unread', value: totalUnread, icon: <Sparkles className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[16px] px-4 py-3 text-center" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center justify-center gap-1.5 text-[#1a56db] mb-1">{s.icon}</div>
              <div className="text-[20px] font-extrabold text-[#0f172a] leading-tight">{s.value}</div>
              <div className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#94a3b8] mb-3 px-1">
          Study Partners
        </p>

        {/* Conversation list */}
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,.07)' }}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#94a3b8]">No conversations found</p>
            </div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.userId}
                onClick={() => navigate(`/chat/${c.userId}`)}
                className={`conv-item w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer ${
                  i < filtered.length - 1 ? 'border-b border-[#f1f5f9]' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#eff6ff] border-2 border-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                    <img src={getAvatar(c.user.full_name)} alt={c.user.full_name} className="w-full h-full object-cover" />
                  </div>
                  {c.online && (
                    <span className="online-ring absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#22c55e] rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[15px] font-bold text-[#0f172a] truncate">{c.user.full_name}</span>
                    <span className={`text-[11px] shrink-0 ml-2 ${c.unread > 0 ? 'text-[#1a56db] font-bold' : 'text-[#94a3b8]'}`}>
                      {c.lastTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-[#1a56db] bg-[#eff6ff] px-2 py-0.5 rounded-full shrink-0">
                      {c.subject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-[#64748b] truncate flex-1">{c.lastMessage}</p>
                    {c.unread > 0 ? (
                      <span className="ml-2 shrink-0 w-5 h-5 bg-[#1a56db] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    ) : (
                      <CheckCheck className="ml-2 shrink-0 w-3.5 h-3.5 text-[#94a3b8]" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Empty state tip */}
        <div className="mt-6 bg-gradient-to-br from-[#1a56db] to-[#2563eb] rounded-[20px] p-5 text-white flex items-start gap-4"
          style={{ boxShadow: '0 6px 24px rgba(26,86,219,.2)' }}>
          <div className="w-10 h-10 rounded-[12px] bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-white mb-0.5">Keep discovering study partners</p>
            <p className="text-[12px] text-blue-200 leading-relaxed">
              Go to <strong className="text-white">Discover</strong> to swipe on new partners, then continue the conversation here.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
