import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
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

    const xTarget = direction === 'right' ? 500 : -500
    const rotation = direction === 'right' ? 15 : -15

    gsap.to(cardRef.current, {
      x: xTarget,
      rotation,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        handleSwipeComplete(direction)
        // Reset card position
        gsap.set(cardRef.current, { x: 0, rotation: 0, opacity: 1 })
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

    // Simulate match on "right" swipe (50% chance for demo)
    if (direction === 'right' && Math.random() > 0.4) {
      setMatchPartner(currentCard)
      setTimeout(() => {
        setShowMatch(true)
      }, 500)
    }

    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleLike = () => animateSwipe('right')
  const handleSkip = () => animateSwipe('left')

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

  const skillLevelLabel = (level) => {
    const map = { beginner: '🌱 Beginner', intermediate: '📚 Intermediate', advanced: '🚀 Advanced' }
    return map[level] || level
  }

  const goalLabel = (goal) => {
    const map = { exam_prep: 'Persiapan Ujian', project: 'Tugas / Project', skill_building: 'Skill Building' }
    return map[goal] || goal
  }

  if (currentIndex >= candidates.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Semua Profil Dilihat!</h2>
          <p className="text-text-secondary mb-6">Kamu sudah melihat semua kandidat partner belajar.</p>
          <Button onClick={() => { setCurrentIndex(0); setSwiped([]) }}>
            <RotateCcw className="w-4 h-4" />
            Mulai Ulang
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-20 pb-8 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-secondary/8 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Discover</h1>
            <p className="text-sm text-text-muted">{candidates.length - currentIndex} partner tersisa</p>
          </div>
          <Badge variant="secondary">
            <Zap className="w-3 h-3 mr-1" />
            {swiped.filter(s => s.action === 'right').length} Likes
          </Badge>
        </div>

        {/* Swipe Card */}
        {currentCard && (
          <div ref={cardRef} className="touch-none">
            <Card className="overflow-hidden">
              {/* Profile Header */}
              <div className="relative p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold flex-shrink-0">
                    {currentCard.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-xl font-bold truncate">{currentCard.full_name}</h2>
                    <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentCard.university}
                    </p>
                    <p className="text-sm text-text-secondary mt-2 line-clamp-2">{currentCard.bio}</p>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-5">
                {/* Subjects */}
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Mata Kuliah
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCard.study_profile.subjects.map(sub => (
                      <Badge key={sub} variant="default">{sub}</Badge>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card p-3">
                    <p className="text-xs text-text-muted mb-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Skill Level
                    </p>
                    <p className="text-sm font-medium">{skillLevelLabel(currentCard.study_profile.skill_level)}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-xs text-text-muted mb-0.5 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Tujuan
                    </p>
                    <p className="text-sm font-medium">{goalLabel(currentCard.study_profile.study_goal)}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-xs text-text-muted mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Jadwal
                    </p>
                    <p className="text-sm font-medium">
                      {currentCard.study_profile.availability.start} – {currentCard.study_profile.availability.end}
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-xs text-text-muted mb-0.5 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" />
                      Gaya Belajar
                    </p>
                    <p className="text-sm font-medium capitalize">{currentCard.study_profile.learning_style}</p>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary-light" />
                      Compatibility Score
                    </h4>
                    <span className={`text-2xl font-bold font-heading ${
                      currentCard.compatibility.total >= 80 ? 'text-success' :
                      currentCard.compatibility.total >= 60 ? 'text-warning' : 'text-accent'
                    }`}>
                      {currentCard.compatibility.total}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Subjects', value: currentCard.compatibility.breakdown.subjects, color: 'from-primary to-primary-light' },
                      { label: 'Schedule', value: currentCard.compatibility.breakdown.schedule, color: 'from-secondary to-[#33DDFF]' },
                      { label: 'Goals', value: currentCard.compatibility.breakdown.goals, color: 'from-success to-[#69F0AE]' },
                      { label: 'Skills', value: currentCard.compatibility.breakdown.skills, color: 'from-warning to-[#FFD54F]' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-16">{item.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-bg-surface overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={handleSkip}
                    className="w-14 h-14 rounded-full bg-bg-surface border border-border flex items-center justify-center text-accent hover:bg-accent/10 hover:border-accent transition-all duration-300 hover:scale-110 cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white shadow-[0_4px_20px_rgba(108,92,231,0.4)] hover:shadow-[0_6px_30px_rgba(108,92,231,0.6)] hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <Heart className="w-7 h-7" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Match Overlay */}
      {showMatch && matchPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/80 backdrop-blur-sm px-4">
          <div ref={matchRef} className="w-full max-w-sm text-center">
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-heading text-3xl font-bold mb-2">
                  <span className="gradient-text">It's a Study Match!</span>
                </h2>
                <p className="text-text-secondary mb-6">
                  Kamu dan <strong>{matchPartner.full_name}</strong> saling tertarik untuk belajar bersama!
                </p>

                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold">
                    {(user || mockCurrentUser).full_name.charAt(0)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent to-accent-light flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-[#00A3CC] flex items-center justify-center text-xl font-bold">
                    {matchPartner.full_name.charAt(0)}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" onClick={() => { setShowMatch(false); window.location.href = '/sessions/new' }}>
                    <Calendar className="w-4 h-4" />
                    Buat Study Session
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setShowMatch(false)}>
                    Lanjut Swiping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
