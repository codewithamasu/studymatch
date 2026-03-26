import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/Button'
import {
  Heart,
  X,
  Calendar,
  BookOpen,
  Zap,
  MapPin,
  Sparkles,
  ChevronDown,
  Star,
  CheckCircle2,
  MessageCircle,
  RefreshCcw,
  Loader2
} from 'lucide-react'
import { mockUsers, mockCurrentUser, calculateCompatibility } from '@/data/mockData'
import gsap from 'gsap'
import { useAuthStore } from '@/store/useAuthStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchDiscoverCandidates, saveSwipe, fetchSubjects, fetchMatchStats, clearSwipes } from '@/lib/studymatchRealtime'
import { DISPLAY_FONT } from '@/lib/constants'



export default function DiscoverPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [swipeError, setSwipeError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatch, setShowMatch] = useState(false)
  const [matchPartner, setMatchPartner] = useState(null)
  const [swiped, setSwiped] = useState([])

  const [skillLevel, setSkillLevel] = useState('Intermediate')
  const [studyMode, setStudyMode] = useState('online')
  const [targetSubject, setTargetSubject] = useState('')
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [stats, setStats] = useState({ availableNow: 0, newToday: 0 })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const cardRef = useRef(null)
  const matchRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function loadInitialData() {
      try {
        const [subs, st] = await Promise.all([
          fetchSubjects(),
          fetchMatchStats(user?.id)
        ])
        if (mounted) {
          setAvailableSubjects(subs)
          setStats(st)
          if (subs.length > 0 && !targetSubject) {
            setTargetSubject(subs[0].name)
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
      }
    }

    loadInitialData()

    return () => {
      mounted = false
    }
  }, [user?.id, targetSubject]) // Run once or when user changes

  useEffect(() => {
    let mounted = true

    async function loadCandidates() {
      setLoading(true)
      setLoadError('')

      try {
        if (!user?.id) {
          if (mounted) setCandidates([])
          return
        }

        if (!isSupabaseConfigured) {
          const demoCandidates = mockUsers
            .filter((candidate) => candidate.id !== 'current')
            .map((candidate) => ({
              ...candidate,
              compatibility: calculateCompatibility(mockCurrentUser, candidate),
            }))
            .sort((a, b) => b.compatibility.total - a.compatibility.total)

          if (mounted) setCandidates(demoCandidates)
          return
        }

        const realCandidates = await fetchDiscoverCandidates(user.id, {
          targetSubject,
          studyMode
        })
        if (!mounted) return

        setCandidates(
          realCandidates
            .map((candidate) => ({
              ...candidate,
              compatibility: calculateCompatibility(user, candidate),
            }))
            .sort((a, b) => b.compatibility.total - a.compatibility.total)
        )
      } catch (error) {
        if (!mounted) return
        setLoadError(error?.message || 'Failed to load candidates.')
        setCandidates([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (targetSubject !== undefined) {
      setCurrentIndex(0)
      setSwiped([])
      setShowMatch(false)
      setMatchPartner(null)
      loadCandidates()
    }

    return () => {
      mounted = false
    }
  }, [user, targetSubject, skillLevel, studyMode])

  const handleRefreshStack = async () => {
    if (user?.id && isSupabaseConfigured) {
      setIsRefreshing(true)
      try {
        await clearSwipes(user.id)
        setCurrentIndex(0)
        setSwiped([])
        
        // Reload candidates directly
        const realCandidates = await fetchDiscoverCandidates(user.id, {
          targetSubject,
          studyMode
        })
        setCandidates(
          realCandidates
            .map((candidate) => ({
              ...candidate,
              compatibility: calculateCompatibility(user, candidate),
            }))
            .sort((a, b) => b.compatibility.total - a.compatibility.total)
        )
      } catch (err) {
        console.error('Failed to reset swipes:', err)
        setLoadError('Failed to clear swipes.')
      } finally {
        setIsRefreshing(false)
      }
    } else {
      // Mock mode
      setIsRefreshing(true)
      setTimeout(() => {
        setCurrentIndex(0)
        setSwiped([])
        setIsRefreshing(false)
      }, 600)
    }
  }


  const currentCard = candidates[currentIndex]

  const animateSwipe = (direction) => {
    if (!cardRef.current) return
    const targetCard = currentCard
    if (!targetCard) return
    setSwipeError('')

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
      onComplete: async () => {
        const didSave = await handleSwipeComplete(direction, targetCard)
        gsap.set(cardRef.current, { x: 0, y: 0, rotation: 0, opacity: 1 })
        if (!didSave) return
        gsap.from(cardRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      },
    })
  }

  const handleSwipeComplete = async (direction, targetCard) => {
    if (user?.id && isSupabaseConfigured) {
      try {
        const action = direction === 'left' ? 'pass' : direction === 'up' ? 'super_like' : 'like'
        const result = await saveSwipe(user.id, targetCard.id, action)

        setSwiped((prev) => [...prev, { userId: targetCard.id, action: direction }])

        if (result?.match) {
          setMatchPartner(targetCard)
          setTimeout(() => {
            setShowMatch(true)
          }, 300)
        }
      } catch (error) {
        setSwipeError(error?.message || 'Failed to save swipe.')
        return false
      }
    } else if (direction === 'right' || direction === 'up') {
      setSwiped((prev) => [...prev, { userId: targetCard.id, action: direction }])
      setMatchPartner(targetCard)
      setTimeout(() => {
        setShowMatch(true)
      }, 300)
    } else {
      setSwiped((prev) => [...prev, { userId: targetCard.id, action: direction }])
    }

    setCurrentIndex((prev) => prev + 1)
    return true
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 pt-[100px] lg:pt-[120px]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#dbeafe] border-t-[#1a56db]" />
          <h2
            className="text-xl font-semibold tracking-[-0.04em] text-gray-900"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Loading candidates
          </h2>
          <p className="mt-2 text-sm text-gray-500">Fetching study partners from Database.</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 pt-[100px] lg:pt-[120px]">
        <div className="text-center max-w-sm">
          <h2
            className="text-xl font-semibold tracking-[-0.04em] text-gray-900"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Failed to load Discover
          </h2>
          <p className="mt-2 text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    )
  }

  if (currentIndex >= candidates.length) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 pt-[100px] lg:pt-[120px]">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="w-20 h-20 bg-[#f0f9ff] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: DISPLAY_FONT }}>You've reached the end of the stack!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">Want to take another look at potential study partners?</p>
          <div className="space-y-3">
            <Button
              onClick={handleRefreshStack}
              disabled={isRefreshing}
              className="w-full bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl py-6 font-semibold shadow-lg shadow-blue-200 flex items-center justify-center"
            >
              {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCcw className="w-5 h-5 mr-2" />}
              Refresh Discovery
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getAvatarUrl = (name) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=2a4365&clothing=shirtCrewNeck`
  }

  const FiltersContent = () => (
    <>
      <h3 className="text-[16px] font-bold text-[#1e293b] mb-1">Study Filters</h3>
      <p className="text-[13px] text-[#64748b] mb-6">Refine your study matches</p>

      <div className="space-y-6">
        <div>
          <label className="block text-[13px] font-semibold text-[#475569] mb-2">Subject</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <BookOpen className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <select
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border-none rounded-[12px] text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#1e293b] shadow-sm">
              {availableSubjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
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
                aria-pressed={skillLevel === level}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  skillLevel === level ? 'bg-[#1a56db] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-gray-200'
                }`}>{level}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#475569] mb-2">Study Mode</label>
          <div className="flex bg-[#f1f5f9] p-[3px] rounded-full">
            {[
              { label: 'Online', value: 'online' },
              { label: 'Offline', value: 'in_person' }
            ].map(m => (
              <button key={m.value} onClick={() => setStudyMode(m.value)}
                aria-pressed={studyMode === m.value}
                className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  studyMode === m.value ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#1a56db]' : 'text-[#64748b]'
                }`}>{m.label}</button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => {
              setCurrentIndex(0)
              setSwiped([])
              setTargetSubject(targetSubject)
              setStudyMode(studyMode)
              setMobileFiltersOpen(false) // Close modal on submit
            }}
            className="w-full bg-[#1a56db] hover:bg-blue-700 text-white font-semibold rounded-[16px] py-[14px] text-[14px] shadow-sm">
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
        {[
          { label: 'Available Now', value: stats.availableNow.toString(), icon: '🟢' },
          { label: 'New Today', value: stats.newToday.toString(), icon: '✨' },
          { label: 'Connections', value: swiped.filter(s => s.action === 'right' || s.action === 'up').length.toString(), icon: '💙' },
          { label: 'Remaining', value: Math.max(0, candidates.length - currentIndex).toString(), icon: '📋' },
        ].map(s => (
          <div key={s.label} className="bg-[#f8fafc] rounded-[14px] p-3 text-center">
            <div className="text-lg mb-0.5">{s.icon}</div>
            <div className="text-[18px] font-extrabold text-[#1a56db] leading-tight">{s.value}</div>
            <div className="text-[10px] font-medium text-[#94a3b8] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </>
  )



  return (
    <>
      <Helmet>
        <title>Discover - StudyMatch</title>
        <meta name="description" content="Find the perfect study partner tailored to your academic goals and subjects." />
      </Helmet>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes floatUpSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
        .float-badge { animation: floatUp 3s ease-in-out infinite; }
        .float-badge-slow { animation: floatUpSlow 4s ease-in-out infinite; }
        .live-dot { animation: pulseGreen 2s ease-in-out infinite; }
      `}</style>

      {swipeError && (
        <div className="fixed top-[92px] left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg">
          {swipeError}
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#F9F9F8]">
      </div>

      <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-10 px-4 pb-4 lg:pb-12 relative z-10 pt-2 lg:pt-4">

        <div className="lg:hidden w-full flex justify-end mb-[-10px] z-20 relative">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-[#1e293b] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Filters {targetSubject || studyMode !== 'online' ? '(Active)' : ''}
          </button>
        </div>

        <div className="hidden lg:block w-[280px] xl:w-[300px] shrink-0">
          <div className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto border border-gray-100">
            <FiltersContent />
          </div>
        </div>

        <div className="flex-1 flex justify-center items-start">
          {currentCard && (
            <div className="w-full h-full touch-none pt-2 relative flex flex-col justify-center">

              <div ref={cardRef} className="relative z-10 w-full h-full flex flex-col justify-center max-w-4xl mx-auto">
                <div className="bg-white rounded-[24px] shadow-[0px_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="h-[calc(100dvh-510px)] min-h-[180px] lg:h-[calc(100vh-480px)] lg:min-h-[220px] w-full relative bg-[#2a4365] flex items-center justify-center pt-4 lg:pt-8 overflow-hidden rounded-b-[18px]">
                    <img src={getAvatarUrl(currentCard.full_name)} alt={currentCard.full_name}
                      className="h-full w-auto max-w-full object-cover lg:object-contain drop-shadow-2xl" />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md">
                      <Zap className="w-4 h-4 fill-white" />
                      {currentCard.compatibility.total}% Match
                    </div>
                    <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[12px] font-semibold">
                      {currentIndex + 1} / {candidates.length}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 relative bg-white pb-6 sm:pb-8">
                    <div className="flex items-center justify-between mb-1.5">
                      <h2
                        className="text-[26px] font-semibold tracking-[-0.04em] text-[#1e293b]"
                        style={{ fontFamily: DISPLAY_FONT }}
                      >
                        {currentCard.full_name.split(' ')[0]}
                      </h2>
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    </div>
                    {currentCard.bio && (
                      <p className="text-[14px] leading-relaxed text-[#64748b] mb-4 line-clamp-2 italic">
                        "{currentCard.bio}"
                      </p>
                    )}

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-3 text-[#475569]">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8] shrink-0" />
                        <span className="text-[14px] sm:text-[15px]">{currentCard.study_profile?.subjects?.[0] || 'Study Partner'} • Exam Prep</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#475569]">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8] shrink-0" />
                        <span className="text-[14px] sm:text-[15px]">Availability: {currentCard.study_profile?.availability?.days?.length > 0 ? currentCard.study_profile.availability.days.join(', ') : 'Flexible'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#475569]">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8] shrink-0" />
                        <span className="text-[14px] sm:text-[15px] capitalize">{currentCard.study_profile?.study_mode?.replace('_', ' ') || 'Any Mode'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-8 flex justify-center items-center gap-4 sm:gap-5 z-10">
                  <button onClick={handleSkip}
                    aria-label="Skip"
                    className="w-14 h-14 bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center text-red-500 hover:scale-110 transition-transform border border-gray-50">
                    <X className="w-6 h-6 stroke-[3]" />
                  </button>
                  <button onClick={handleSuperLike}
                    aria-label="Super Like"
                    className="w-14 h-14 bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center text-blue-500 hover:scale-110 transition-transform border border-gray-50">
                    <Star className="w-6 h-6 stroke-[2.5]" />
                  </button>
                  <button onClick={handleLike}
                    aria-label="Like"
                    className="w-20 h-20 bg-blue-600 rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_8px_30px_rgba(37,99,235,0.6)] transition-all">
                    <Heart className="w-10 h-10 fill-white" />
                  </button>
                </div>
              </div>

              <p className="hidden sm:block text-center text-[#94a3b8] font-medium tracking-wide text-[13px] mt-6 uppercase pb-8">
                Swipe left to pass, right to connect
              </p>
            </div>
          )}
        </div>

      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-white h-full overflow-y-auto transform transition-transform animate-in slide-in-from-right shadow-2xl safe-p-bottom">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: DISPLAY_FONT }}>Refine Match</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltersContent />
            </div>
          </div>
        </div>
      )}

      {showMatch && matchPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm px-4">
          <div ref={matchRef} className="w-full max-w-sm text-center bg-white rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-8">
              <div className="text-6xl mb-4 animate-bounce shrink-0">🎉</div>
              <h2
                className="mb-2 text-3xl font-semibold tracking-[-0.05em] text-gray-900"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                 It's a Study Match!
              </h2>
              <p className="text-gray-500 mb-6">
                You and <strong>{matchPartner.full_name}</strong> are both interested in studying together!
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

              <div className="space-y-3 mt-8">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] rounded-2xl h-14" onClick={() => { setShowMatch(false); navigate(`/chat/${matchPartner.id}`) }}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat Now
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50 h-12" onClick={() => { setShowMatch(false); navigate(`/sessions/new?partnerId=${matchPartner.id}`) }}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="ghost" className="w-full rounded-2xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-12" onClick={() => setShowMatch(false)}>
                    Keep Swiping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
