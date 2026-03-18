import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  MoreVertical
} from 'lucide-react'
import { mockSessions, mockUsers, mockMatches } from '@/data/mockData'

let localSessions = [...mockSessions]

// --- Mock Data & Constants ---
const SUBJECTS = [
  'Calculus', 'Linear Algebra', 'Data Structures', 'Algorithms',
  'Statistics', 'Physics', 'Web Development', 'Machine Learning',
]

const DURATIONS = [
  { label: '45 min', value: 45 },
  { label: '90 min', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
]

export default function SessionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
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

  const [sessions, setSessions] = useState(localSessions)

  const handleGenerateLink = (e) => {
    e.preventDefault()
    const roomId = 'study-session-' + Math.random().toString(36).substring(7)
    setGeneratedLink(`/meet/${roomId}`)
  }

  const handleCreateSession = (e) => {
    e.preventDefault()
    
    // Create new session mock
    const selectedPartner = mockMatches.find(m => m.partner.id === sessionForm.partnerId)?.partner || mockUsers[0]
    
    const newSession = {
      id: 's_' + Date.now(),
      partner: selectedPartner,
      subject: sessionForm.subject || 'Study Session',
      scheduled_at: `${sessionForm.date || new Date().toISOString().split('T')[0]}T${sessionForm.time || '12:00'}:00Z`,
      duration_minutes: sessionForm.duration,
      mode: sessionForm.mode,
      meeting_room_id: generatedLink ? generatedLink.replace('/meet/', '') : null,
      location: sessionForm.location,
      status: 'upcoming'
    }
    
    localSessions = [newSession, ...localSessions]
    setSessions(localSessions)
    navigate('/sessions')
  }

  const handleMarkAsDone = (id) => {
    // Stage 1: Mark as pending confirmation from partner
    const updated = localSessions.map(s => s.id === id ? { ...s, status: 'pending_confirmation' } : s)
    localSessions = updated
    setSessions(updated)

    // Stage 2: Simulate partner accepting after 3 seconds
    setTimeout(() => {
      const confirmed = localSessions.map(s => s.id === id ? { ...s, status: 'completed' } : s)
      localSessions = confirmed
      setSessions(confirmed)
    }, 3000)
  }

  // Derived arrays for "My Schedule" view
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming' || s.status === 'pending_confirmation')
  const completedSessions = sessions.filter(s => s.status === 'completed')

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
                <p className="text-sm text-slate-500 font-medium">Find your study squad and stay focused.</p>
              </div>

              <form className="space-y-7" onSubmit={handleCreateSession}>
                {/* Partner Selection */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Study Partner</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                      value={sessionForm.partnerId}
                      onChange={(e) => setSessionForm({ ...sessionForm, partnerId: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select a partner...</option>
                      {mockMatches.map((match) => (
                        <option key={match.partner.id} value={match.partner.id}>{match.partner.full_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Subject</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                      value={sessionForm.subject}
                      onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
                    >
                      <option value="" disabled>Select a subject...</option>
                      {SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Date</label>
                    <div className="relative">
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none bg-slate-50" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Start Time</label>
                    <div className="relative">
                      <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none" value={sessionForm.time} onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })} />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none bg-slate-50" />
                    </div>
                  </div>
                </div>

                {/* Session Duration */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Session Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((dur) => (
                      <button key={dur.value} type="button" onClick={() => setSessionForm({ ...sessionForm, duration: dur.value })} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all ${sessionForm.duration === dur.value ? 'bg-blue-50 text-blue-600 border border-blue-600 ring-2 ring-blue-600/10' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50' }`}>
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Study Mode */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-slate-700">Study Mode</label>
                  <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <button type="button" onClick={() => setSessionForm({ ...sessionForm, mode: 'online' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${sessionForm.mode === 'online' ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-slate-500 hover:text-slate-700' }`}>
                      <Video className="w-4 h-4" /> Online
                    </button>
                    <button type="button" onClick={() => setSessionForm({ ...sessionForm, mode: 'offline' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${sessionForm.mode === 'offline' ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'text-slate-500 hover:text-slate-700' }`}>
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
                        <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">Generate a unique link for your study group.</p>
                      </div>
                    </div>
                    {generatedLink ? (
                      <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm break-all font-mono font-medium text-slate-600">
                        jitsi.meet{generatedLink}
                        <button type="button" onClick={() => { navigator.clipboard.writeText(generatedLink); }} className="text-blue-600 font-bold shrink-0 ml-4 hover:underline">Copy</button>
                      </div>
                    ) : (
                      <button onClick={handleGenerateLink} type="button" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-xl text-sm shadow-sm">
                        <LinkIcon className="w-4 h-4" /> Generate Meeting Link
                      </button>
                    )}
                  </div>
                )}
                {sessionForm.mode === 'offline' && (
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-slate-700">Preferred Location</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Campus Library', 'Student Cafe'].map(loc => (
                        <button key={loc} type="button" onClick={() => setSessionForm({ ...sessionForm, location: loc })} className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all ${sessionForm.location === loc ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300' }`}>
                          {loc.includes('Cafe') ? <Clock className="w-4 h-4 shrink-0" /> : <MapPin className="w-4 h-4 shrink-0" />} {loc}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Or type a custom location..." className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={sessionForm.location} onChange={(e) => setSessionForm({...sessionForm, location: e.target.value})} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]">
                    Create Session
                  </button>
                  <button type="button" onClick={() => navigate('/sessions')} className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98]">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ── SESSIONS LIST (MY SCHEDULE) ── */
            <div className="space-y-8">
              <div className="mb-4">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Schedule</h1>
                <p className="text-sm text-slate-500 font-medium tracking-wide">Stay on top of your upcoming group sessions.</p>
              </div>

              {/* UPCOMING SESSIONS */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                   Upcoming <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-[10px]">{upcomingSessions.length}</span>
                </h2>
                <div className="space-y-4">
                  {upcomingSessions.map((session, i) => (
                    <ScheduleCard key={session.id} session={session} isUpcoming={true} onMarkAsDone={handleMarkAsDone} />
                  ))}
                </div>
              </div>

              {/* COMPLETED SESSIONS */}
              <div className="pt-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                   Completed <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-[10px]">{completedSessions.length}</span>
                </h2>
                <div className="space-y-4">
                  {completedSessions.map((session, i) => (
                    <ScheduleCard key={session.id} session={session} isUpcoming={false} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT CALENDAR & TIP (ONLY ON NEW SESSION FOR NOW, OR BOTH) ── */}
        <aside className="hidden lg:flex flex-col w-[300px] xl:w-[320px] shrink-0 gap-6">
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-sm text-slate-900">October 2023</h3>
              <div className="flex gap-2 text-slate-400">
                <button className="hover:text-slate-700 transition-colors p-1"><ChevronLeft className="w-4 h-4" /></button>
                <button className="hover:text-slate-700 transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-slate-400">{d}</div>)}
              {Array.from({ length: 5 }).map((_, i) => <div key={`p-${i}`} className="text-xs font-semibold text-slate-300 py-1">{26 + i}</div>)}
              {Array.from({ length: 14 }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === 5;
                return (
                  <button key={day} className={`text-xs font-bold w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="bg-[#F0F5FF] rounded-[24px] p-6 border border-[#E0EAFF]">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Info className="w-5 h-5" />
              <h4 className="font-bold text-sm">Pro Tip</h4>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">Sessions scheduled between 4:00 PM and 7:00 PM tend to get 40% more attendees on StudyMatch!</p>
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

function ScheduleCard({ session, isUpcoming, onMarkAsDone }) {
  const navigate = useNavigate()
  const dateObj = new Date(session.scheduled_at)
  
  return (
    <div className={`p-5 rounded-[24px] bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all ${!isUpcoming && 'opacity-60 grayscale-[0.2]'}`}>
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        
        {/* Date block */}
        <div className="w-14 h-14 rounded-[18px] bg-blue-50 flex flex-col items-center justify-center shrink-0 border border-blue-100/50">
          <span className="text-[10px] uppercase font-bold text-blue-600">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span className="text-lg font-black text-blue-700 leading-tight">{dateObj.getDate()}</span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-[15px]">{session.subject}</h3>
            {session.mode === 'online' ? (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Video className="w-3 h-3" /> Online</span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> Offline</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
              With <span className="font-bold text-slate-700">{session.partner.full_name}</span>
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          {session.status === 'pending_confirmation' && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-600 text-[12px] font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse w-full sm:w-auto">
              <Clock className="w-4 h-4" /> Menunggu Partner
            </div>
          )}
          {session.status === 'upcoming' && (
            <>
              {session.mode === 'online' ? (
                <button 
                  onClick={() => navigate(`/meet/${session.meeting_room_id || 'study-session-' + session.id}`)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1e293b] hover:bg-slate-900 active:scale-95 transition-all text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-slate-900/20"
                >
                  <Video className="w-4 h-4" /> Join Meet
                </button>
              ) : (
                <button className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-[13px] font-bold rounded-xl flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> View Map
                </button>
              )}
              <button 
                onClick={() => onMarkAsDone(session.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-95 transition-all text-emerald-700 text-[13px] font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Selesai
              </button>
            </>
          )}
          {session.status === 'completed' && (
             <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Done
             </div>
          )}
        </div>

      </div>
    </div>
  )
}
