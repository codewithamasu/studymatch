import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import {
  BookOpen,
  Clock,
  Target,
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import gsap from 'gsap'

const SUBJECTS = [
  'Calculus', 'Linear Algebra', 'Statistics', 'Data Structures',
  'Algorithms', 'Web Development', 'Machine Learning', 'Database Systems',
  'Physics', 'Chemistry', 'Biology', 'Economics',
  'Differential Equations', 'Python Programming', 'Data Analysis',
  'Computer Networks', 'Operating Systems', 'Discrete Math',
]

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱', desc: 'Baru mulai belajar' },
  { value: 'intermediate', label: 'Intermediate', emoji: '📚', desc: 'Sudah paham dasar' },
  { value: 'advanced', label: 'Advanced', emoji: '🚀', desc: 'Menguasai dengan baik' },
]

const STUDY_GOALS = [
  { value: 'exam_prep', label: 'Persiapan Ujian', icon: Target, color: 'from-accent to-accent-light' },
  { value: 'project', label: 'Tugas / Project', icon: BookOpen, color: 'from-primary to-primary-light' },
  { value: 'skill_building', label: 'Meningkatkan Skill', icon: BrainCircuit, color: 'from-success to-[#69F0AE]' },
]

const DAYS = [
  { value: 'mon', label: 'Sen' },
  { value: 'tue', label: 'Sel' },
  { value: 'wed', label: 'Rab' },
  { value: 'thu', label: 'Kam' },
  { value: 'fri', label: 'Jum' },
  { value: 'sat', label: 'Sab' },
  { value: 'sun', label: 'Min' },
]

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual', emoji: '👁️', desc: 'Belajar dengan gambar & diagram' },
  { value: 'auditory', label: 'Auditory', emoji: '👂', desc: 'Belajar dengan mendengar & diskusi' },
  { value: 'kinesthetic', label: 'Kinesthetic', emoji: '✋', desc: 'Belajar dengan praktik langsung' },
]

export default function OnboardingPage() {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const containerRef = useRef(null)

  const [profile, setProfile] = useState({
    subjects: [],
    skill_level: '',
    study_goal: '',
    availability: { days: [], start: '19:00', end: '21:00' },
    learning_style: '',
  })

  const totalSteps = 3

  useEffect(() => {
    gsap.from(containerRef.current, {
      opacity: 0,
      x: 30,
      duration: 0.4,
      ease: 'power2.out',
    })
  }, [step])

  const toggleSubject = (subject) => {
    setProfile(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const toggleDay = (day) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter(d => d !== day)
          : [...prev.availability.days, day],
      },
    }))
  }

  const canProceed = () => {
    if (step === 0) return profile.subjects.length >= 1 && profile.skill_level
    if (step === 1) return profile.study_goal && profile.learning_style
    if (step === 2) return profile.availability.days.length >= 1
    return false
  }

  const handleComplete = async () => {
    setSaving(true)
    setErrorMessage('')

    const { error } = await updateProfile(profile)

    setSaving(false)

    if (error) {
      setErrorMessage(error.message || 'Profil belum berhasil disimpan. Coba lagi.')
      return
    }

    navigate('/discover')
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
      setErrorMessage('')
    } else {
      handleComplete()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-secondary/8 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl font-bold">Buat Study Profile</h2>
            <span className="text-sm text-text-muted">Step {step + 1} / {totalSteps}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step
                    ? 'bg-gradient-to-r from-primary to-secondary'
                    : 'bg-bg-surface'
                }`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8" ref={containerRef}>
            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            )}

            {/* Step 0: Subjects & Skill */}
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">Pilih Mata Kuliah</h3>
                  <p className="text-sm text-text-muted mb-4">Pilih mata kuliah yang ingin kamu pelajari bersama</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border cursor-pointer ${
                          profile.subjects.includes(subject)
                            ? 'bg-primary/20 border-primary text-primary-light scale-105'
                            : 'bg-bg-surface border-border text-text-secondary hover:border-primary/50'
                        }`}
                      >
                        {profile.subjects.includes(subject) && '✓ '}{subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">Skill Level</h3>
                  <p className="text-sm text-text-muted mb-4">Bagaimana kamu menilai kemampuanmu secara umum?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {SKILL_LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => setProfile({ ...profile, skill_level: level.value })}
                        className={`p-4 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                          profile.skill_level === level.value
                            ? 'bg-primary/15 border-primary'
                            : 'bg-bg-surface border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{level.emoji}</span>
                        <span className="text-sm font-medium block">{level.label}</span>
                        <span className="text-xs text-text-muted">{level.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Goals & Learning Style */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">Tujuan Belajar</h3>
                  <p className="text-sm text-text-muted mb-4">Apa tujuan utama kamu mencari study partner?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {STUDY_GOALS.map(goal => (
                      <button
                        key={goal.value}
                        onClick={() => setProfile({ ...profile, study_goal: goal.value })}
                        className={`p-4 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                          profile.study_goal === goal.value
                            ? 'bg-primary/15 border-primary'
                            : 'bg-bg-surface border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center mx-auto mb-2`}>
                          <goal.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium">{goal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">Gaya Belajar</h3>
                  <p className="text-sm text-text-muted mb-4">Bagaimana cara belajar yang paling efektif untukmu?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {LEARNING_STYLES.map(style => (
                      <button
                        key={style.value}
                        onClick={() => setProfile({ ...profile, learning_style: style.value })}
                        className={`p-4 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                          profile.learning_style === style.value
                            ? 'bg-primary/15 border-primary'
                            : 'bg-bg-surface border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{style.emoji}</span>
                        <span className="text-sm font-medium block">{style.label}</span>
                        <span className="text-xs text-text-muted">{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Availability */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">Jadwal Tersedia</h3>
                  <p className="text-sm text-text-muted mb-4">Pilih hari dan waktu yang cocok untuk belajar bersama</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {DAYS.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`w-12 h-12 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer ${
                          profile.availability.days.includes(day.value)
                            ? 'bg-primary/20 border-primary text-primary-light'
                            : 'bg-bg-surface border-border text-text-secondary hover:border-primary/50'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Mulai
                      </label>
                      <input
                        type="time"
                        value={profile.availability.start}
                        onChange={e => setProfile({
                          ...profile,
                          availability: { ...profile.availability, start: e.target.value }
                        })}
                        className="w-full h-11 rounded-lg bg-bg-surface border border-border px-4 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Selesai
                      </label>
                      <input
                        type="time"
                        value={profile.availability.end}
                        onChange={e => setProfile({
                          ...profile,
                          availability: { ...profile.availability, end: e.target.value }
                        })}
                        className="w-full h-11 rounded-lg bg-bg-surface border border-border px-4 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="glass-card p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Ringkasan Profil
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Subjects</span>
                      <span className="text-right">{profile.subjects.join(', ') || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Level</span>
                      <span className="capitalize">{profile.skill_level || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Goal</span>
                      <span>{STUDY_GOALS.find(g => g.value === profile.study_goal)?.label || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Style</span>
                      <span className="capitalize">{profile.learning_style || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 0 || saving}
                className={step === 0 ? 'invisible' : ''}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <Button onClick={handleNext} disabled={!canProceed() || saving}>
                {step === totalSteps - 1 ? (
                  <>
                    {saving ? 'Menyimpan...' : 'Mulai Matching'}
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Lanjut
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Sparkles(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  )
}
