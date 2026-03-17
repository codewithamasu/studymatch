import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  Heart,
  X,
  Target,
  Calendar,
  BookOpen,
  Zap,
  RotateCcw,
  Users,
  MapPin,
  BrainCircuit,
  Sparkles,
  ChevronDown,
  Star,
  CheckCircle2
} from 'lucide-react'
import { mockUsers, mockCurrentUser, calculateCompatibility } from '@/data/mockData'
import gsap from 'gsap'

export default function DiscoverPage() {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatch, setShowMatch] = useState(false)
  const [matchPartner, setMatchPartner] = useState(null)
  const [swiped, setSwiped] = useState([])
  
  // Filter states
  const [skillLevel, setSkillLevel] = useState('Beginner')
  const [studyMode, setStudyMode] = useState('Online')
  
  const cardRef = useRef(null)
  const matchRef = useRef(null)

  useEffect(() => {
    // Calculate compatibility for all mock users
    const withScores = mockUsers.map(u => {
      const compat = calculateCompatibility(user || mockCurrentUser, u)
      return { ...u, compatibility: compat }
    })
    // Sort by compatibility
    withScores.sort((a, b) => b.compatibility.total - a.compatibility.total)
    setCandidates(withScores)
  }, [user])

  const currentCard = candidates[currentIndex]

  const animateSwipe = (direction) => {
    if (!cardRef.current) return

    const xTarget = direction === 'right' ? 500 : direction === 'left' ? -500 : 0
    const yTarget = direction === 'up' ? -500 : 0
    const rotation = direction === 'right' ? 15 : direction === 'left' ? -15 : 0

    gsap.to(cardRef.current, {
      x: xTarget,
      y: yTarget,
      rotation,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        handleSwipeComplete(direction)
        // Reset card position
        gsap.set(cardRef.current, { x: 0, y: 0, rotation: 0, opacity: 1 })
        // Animate in new card
        gsap.from(cardRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      },
    })
  }

  const handleSwipeComplete = (direction) => {
    setSwiped(prev => [...prev, { userId: currentCard.id, action: direction }])

    // Simulate match on "right" or "up" swipe (50% chance for demo)
    if ((direction === 'right' || direction === 'up') && Math.random() > 0.4) {
      setMatchPartner(currentCard)
      setTimeout(() => {
        setShowMatch(true)
      }, 500)
    }

    if (currentIndex < candidates.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleLike = () => animateSwipe('right')
  const handleSkip = () => animateSwipe('left')
  const handleSuperLike = () => animateSwipe('up')

  useEffect(() => {
    if (showMatch && matchRef.current) {
      gsap.from(matchRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.7)',
      })
    }
  }, [showMatch])

  if (currentIndex >= candidates.length) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2 text-gray-900">Semua Profil Dilihat!</h2>
          <p className="text-gray-500 mb-6">Kamu sudah melihat semua kandidat partner belajar.</p>
          <Button onClick={() => { setCurrentIndex(0); setSwiped([]) }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Mulai Ulang
          </Button>
        </div>
      </div>
    )
  }

  // Temporary function to generate deterministic avatar
  const getAvatarUrl = (name) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=2a4365&clothing=shirtCrewNeck`
  }



  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-[80px]">
      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatUpSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
        .float-badge { animation: floatUp 3s ease-in-out infinite; }
        .float-badge-slow { animation: floatUpSlow 4s ease-in-out infinite; }
        .live-dot { animation: pulseGreen 2s ease-in-out infinite; }
      `}</style>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-100 rounded-full blur-[100px] opacity-30" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-100 rounded-full blur-[80px] opacity-30" />
      </div>

      <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 xl:gap-10 px-4 pb-12 relative z-10 pt-4">
        
        {/* ── LEFT: Filters Sidebar ── */}
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0">
          <div className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sticky top-[100px] border border-gray-100">
            <h3 className="text-[16px] font-bold text-[#1e293b] mb-1">Study Filters</h3>
            <p className="text-[13px] text-[#64748b] mb-6">Refine your study matches</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2">Subject</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <BookOpen className="w-4 h-4 text-[#94a3b8]" />
                  </div>
                  <select className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border-none rounded-[12px] text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#1e293b] shadow-sm">
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2">Skill Level</label>
                <div className="flex flex-wrap gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <button key={level} onClick={() => setSkillLevel(level)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                        skillLevel === level ? 'bg-[#1a56db] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-gray-200'
                      }`}>{level}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2">Study Mode</label>
                <div className="flex bg-[#f1f5f9] p-[3px] rounded-full">
                  {['Online', 'Offline'].map(mode => (
                    <button key={mode} onClick={() => setStudyMode(mode)}
                      className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                        studyMode === mode ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#1a56db]' : 'text-[#64748b]'
                      }`}>{mode}</button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-[#1a56db] hover:bg-blue-700 text-white font-semibold rounded-[16px] py-[14px] text-[14px] shadow-sm">
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
              {[
                { label: 'Available Now', value: '148', icon: '🟢' },
                { label: 'New Today', value: '24', icon: '✨' },
                { label: 'Your Matches', value: swiped.filter(s => s.action === 'right' || s.action === 'up').length.toString(), icon: '💙' },
                { label: 'Remaining', value: Math.max(0, candidates.length - currentIndex).toString(), icon: '📋' },
              ].map(s => (
                <div key={s.label} className="bg-[#f8fafc] rounded-[14px] p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-[18px] font-extrabold text-[#1a56db] leading-tight">{s.value}</div>
                  <div className="text-[10px] font-medium text-[#94a3b8] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Swipe Area ── */}
        <div className="flex-1 flex justify-center items-start">
          {currentCard && (
            <div className="w-full h-full touch-none pt-2 relative flex flex-col justify-center">

              <div ref={cardRef} className="relative z-10 w-full h-full flex flex-col justify-center max-w-4xl mx-auto">
                <div className="bg-white rounded-[24px] shadow-[0px_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="h-[calc(100vh-400px)] min-h-[300px] w-full relative bg-[#2a4365] flex items-center justify-center pt-8">
                    <img src={getAvatarUrl(currentCard.full_name)} alt={currentCard.full_name}
                      className="h-full w-auto max-w-full object-contain drop-shadow-2xl" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md">
                      <Zap className="w-4 h-4 fill-white" />
                      {currentCard.compatibility.total}% Match
                    </div>
                    {/* Card number indicator */}
                    <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[12px] font-semibold">
                      {currentIndex + 1} / {candidates.length}
                    </div>
                  </div>

                  <div className="p-6 relative bg-white pb-14">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {currentCard.full_name.split(' ')[0]}, 21
                      </h2>
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <BookOpen className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="text-[15px]">{currentCard.study_profile.subjects[0]} • Exam Prep</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="text-[15px]">Availability: Weeknights, Weekends</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="text-[15px]">Remote / Virtual</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 right-0 -bottom-10 flex justify-center items-center gap-5 z-10">
                  <button onClick={handleSkip}
                    className="w-14 h-14 bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center text-red-500 hover:scale-110 transition-transform cursor-pointer border border-gray-50">
                    <X className="w-6 h-6 stroke-[3]" />
                  </button>
                  <button onClick={handleLike}
                    className="w-20 h-20 bg-blue-600 rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_8px_30px_rgba(37,99,235,0.6)] transition-all cursor-pointer">
                    <Heart className="w-10 h-10 fill-white" />
                  </button>
                  <button onClick={handleSuperLike}
                    className="w-14 h-14 bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center text-blue-500 hover:scale-110 transition-transform cursor-pointer border border-gray-50">
                    <Star className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <p className="text-center text-gray-400 text-sm mt-16">
                Swipe left to skip, right to express interest!
              </p>
            </div>
          )}
        </div>



      </div>

      {/* Match Overlay */}
      {showMatch && matchPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm px-4">
          <div ref={matchRef} className="w-full max-w-sm text-center bg-white rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-8">
              <div className="text-6xl mb-4 animate-bounce shrink-0">🎉</div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                 It's a Study Match!
              </h2>
              <p className="text-gray-500 mb-6">
                Kamu dan <strong>{matchPartner.full_name}</strong> saling tertarik untuk belajar bersama!
              </p>

              <div className="flex items-center justify-center gap-4 mb-8">
                <img 
                   src={getAvatarUrl((user || mockCurrentUser).full_name)} 
                   className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-blue-50" 
                   alt="You" 
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center -mx-4 z-10 shrink-0">
                  <Heart className="w-5 h-5 text-blue-600 fill-blue-600" />
                </div>
                <img 
                   src={getAvatarUrl(matchPartner.full_name)} 
                   className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-indigo-50" 
                   alt={matchPartner.full_name} 
                />
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => { setShowMatch(false); window.location.href = '/sessions/new' }}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Buat Study Session
                </Button>
                <Button variant="outline" className="w-full rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setShowMatch(false)}>
                  Lanjut Swiping
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
