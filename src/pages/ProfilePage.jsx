import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/useAuthStore'
import { Sparkles, Save, User, MapPin, AlignLeft, BookOpen, Star, ChevronRight, Zap, Trash2, Plus, Search } from 'lucide-react'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'

const ALL_SUBJECTS = [
  'Calculus', 'Linear Algebra', 'Statistics', 'Data Structures',
  'Algorithms', 'Web Development', 'Machine Learning', 'Database Systems',
  'Python Programming', 'Physics', 'Biology', 'Data Analysis',
  'Economics', 'Econometrics', 'Psychology', 'History',
  'Modern Languages', 'Art & Design', 'Mathematics', 'Computer Science',
]

const MASTERY_LABELS = [
  { max: 25,  label: 'Beginner',     desc: 'Just starting, still learning the basics.' },
  { max: 50,  label: 'Intermediate', desc: 'Understands basics, but still needs practice.' },
  { max: 75,  label: 'Advanced',     desc: 'Comfortable with material, just needs polish.' },
  { max: 100, label: 'Expert',       desc: 'Ready to tutor and master this topic.' },
]

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  const [form, setForm] = useState({
    full_name: '',
    university: '',
    bio: '',
    subject_mastery: {}
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [newSubject, setNewSubject] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        university: user.university || user.study_profile?.university_name || '',
        bio: user.bio || user.study_profile?.bio || '',
        subject_mastery: user.study_profile?.subject_mastery || {}
      })
    }
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      if (!updateProfile) throw new Error('Update profile function not available')
      
      const { error } = await updateProfile({
        full_name: form.full_name,
        university: form.university,
        bio: form.bio,
        subjects: Object.keys(form.subject_mastery),
        subject_mastery: form.subject_mastery
      })

      if (error) throw error
      setMessage({ text: 'Profile updated successfully!', type: 'success' })
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err) {
      console.error(err)
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleMasteryChange = (subject, value) => {
    setForm(prev => ({
      ...prev,
      subject_mastery: {
        ...prev.subject_mastery,
        [subject]: parseInt(value)
      }
    }))
  }

  const handleAddSubject = (subjectName) => {
    const trimmed = (subjectName || newSubject).trim()
    if (!trimmed) return
    if (form.subject_mastery[trimmed]) {
      setMessage({ text: `"${trimmed}" is already in your profile.`, type: 'error' })
      setShowSuggestions(false)
      return
    }

    setForm(prev => ({
      ...prev,
      subject_mastery: {
        ...prev.subject_mastery,
        [trimmed]: 25
      }
    }))
    setNewSubject('')
    setShowSuggestions(false)
  }

  const handleRemoveSubject = (subject) => {
    const nextMastery = { ...form.subject_mastery }
    delete nextMastery[subject]
    setForm(prev => ({
      ...prev,
      subject_mastery: nextMastery
    }))
  }

  const getMasteryInfo = (score) => {
    return MASTERY_LABELS.find(m => score <= m.max) || MASTERY_LABELS[MASTERY_LABELS.length - 1]
  }

  const filteredSuggestions = ALL_SUBJECTS.filter(s => 
    s.toLowerCase().includes(newSubject.toLowerCase()) && 
    !form.subject_mastery[s]
  )

  const isNewSubjectCustom = newSubject.trim() && !ALL_SUBJECTS.some(s => s.toLowerCase() === newSubject.trim().toLowerCase())

  const subjectEntries = Object.entries(form.subject_mastery)

  return (
    <>
      <Helmet>
        <title>Profile - StudyMatch</title>
        <meta name="description" content="Manage your StudyMatch profile and academic information." />
      </Helmet>
      
      <div className="min-h-[100dvh] border-t border-[#ECEDE8] bg-[#F9F9F8] text-[#1A1A1A] pt-[100px] pb-24 px-4 sm:px-6">
        <div className="max-w-[720px] mx-auto">
          <header className="mb-10 lg:mb-12">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A93A0]">
              Account Management
            </p>
            <h1
              className="text-[clamp(2.35rem,5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[#1A1A1A]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Your Profile.
            </h1>
            <p className="mt-4 max-w-[32rem] text-[15px] leading-7 text-[#626B76] sm:text-base">
              Keep your information updated to ensure the best matches for your academic journey.
            </p>
          </header>

          <form onSubmit={handleUpdate} className="space-y-6">
            {message.text && (
              <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' ? 'bg-[#EEFDF3] text-[#14804A] border border-[#D1F7DB]' : 'bg-[#FFF1F4] text-[#A63C57] border border-[#FEE2E2]'
              }`}>
                {message.type === 'success' ? <Sparkles className="h-4 w-4 shrink-0" /> : <Zap className="h-4 w-4 shrink-0 text-red-400" />}
                {message.text}
              </div>
            )}

            <section className="rounded-[32px] bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]" style={{ fontFamily: DISPLAY_FONT }}>
                  Basic Info
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">Full Name</span>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="E.g. Sarah Jenkins"
                      className="h-[52px] w-full rounded-[20px] border border-[#E9ECEF] bg-[#FCFCFB] pl-12 pr-5 text-[15px] font-medium text-[#1A1A1A] outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8A93A0]" />
                  </div>
                </div>

                <div>
                  <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">University / Campus</span>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                      placeholder="Stanford University"
                      className="h-[52px] w-full rounded-[20px] border border-[#E9ECEF] bg-[#FCFCFB] pl-12 pr-5 text-[15px] font-medium text-[#1A1A1A] outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8A93A0]" />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight text-[#374151]">Bio</span>
                    <span className={`text-[11px] font-bold ${form.bio.length > 300 ? 'text-red-500' : 'text-[#8A93A0]'}`}>
                      {form.bio.length}/300
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      required
                      maxLength={300}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell your study partners about yourself..."
                      className="min-h-[120px] w-full rounded-[24px] border border-[#E9ECEF] bg-[#FCFCFB] p-5 pl-12 text-[15px] font-medium text-[#1A1A1A] leading-relaxed outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                    />
                    <AlignLeft className="absolute left-5 top-5 h-[18px] w-[18px] text-[#8A93A0]" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]" style={{ fontFamily: DISPLAY_FONT }}>
                    Subject Mastery
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                  <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Expertise Radar</span>
                </div>
              </div>

              {subjectEntries.length === 0 ? (
                <div className="py-12 text-center rounded-3xl bg-[#FCFCFB] border border-dashed border-[#E9ECEF] mb-8">
                  <p className="text-[#8A93A0] text-sm font-medium">No subjects found. Add them below!</p>
                </div>
              ) : (
                <div className="space-y-12 mb-10">
                  {subjectEntries.map(([subject, score]) => {
                    const info = getMasteryInfo(score)
                    return (
                      <div key={subject} className="group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E9ECEF] flex items-center justify-center text-sm group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                              📚
                            </div>
                            <span className="text-[15px] font-bold text-[#1A1A1A]">{subject}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                                 score >= 75 ? 'bg-blue-50 text-blue-600' : score >= 40 ? 'bg-green-50 text-green-600' : 'bg-neutral-50 text-neutral-500'
                              }`}>
                                {info.label}
                              </span>
                              <span className="text-[15px] font-bold text-neutral-400 tabular-nums">{score}%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(subject)}
                              className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title={`Remove ${subject}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="relative pt-1 px-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => handleMasteryChange(subject, e.target.value)}
                            className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none transition-all"
                            aria-label={`Adjust mastery for ${subject}`}
                          />
                          <div className="mt-4 flex flex-col gap-1">
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <span className="font-bold text-slate-600">{info.label}:</span> {info.desc}
                            </p>
                            <div className="flex justify-between mt-1 px-0.5">
                              <span className="text-[9px] uppercase tracking-widest font-black text-neutral-200">Newbie</span>
                              <ChevronRight className="w-3 h-3 text-neutral-200" />
                              <span className="text-[9px] uppercase tracking-widest font-black text-neutral-200">Master</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="pt-6 border-t border-dashed border-[#E9ECEF] relative">
                <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-[#8A93A0]">Add New Subject</span>
                <div className="flex gap-3 relative">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => {
                        setNewSubject(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (filteredSuggestions.length === 1) {
                            handleAddSubject(filteredSuggestions[0])
                          } else {
                            handleAddSubject()
                          }
                        }
                      }}
                      placeholder="Search or type a subject..."
                      className="h-[52px] w-full rounded-[20px] border border-[#E9ECEF] bg-[#FCFCFB] pl-11 pr-5 text-[15px] font-medium text-[#1A1A1A] outline-none focus:border-amber-400/40 focus:ring-4 focus:ring-amber-500/5 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A93A0]" />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && (newSubject.trim() || filteredSuggestions.length > 0) && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-[#E9ECEF] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="max-h-[240px] overflow-y-auto py-2">
                          {isNewSubjectCustom && (
                            <button
                              type="button"
                              onClick={() => handleAddSubject()}
                              className="w-full px-4 py-2.5 text-left text-sm font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-b border-dashed border-amber-100 mb-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add custom: "{newSubject}"
                            </button>
                          )}
                          
                          {filteredSuggestions.length > 0 ? (
                            filteredSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleAddSubject(suggestion)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                              >
                                <span>{suggestion}</span>
                                <Plus className="w-3 h-3 text-slate-300" />
                              </button>
                            ))
                          ) : !isNewSubjectCustom && (
                            <div className="px-4 py-3 text-center text-xs text-slate-400 font-medium">
                              Try searching for something else...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSubject()}
                    className="flex h-[52px] items-center gap-2 rounded-[20px] bg-amber-50 px-6 text-[14px] font-bold text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                
                {/* Overlay to close suggestions */}
                {showSuggestions && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowSuggestions(false)}
                  />
                )}
                
                <p className="mt-3 text-[11px] text-[#AAB4C0] font-medium">Choose from our list or type your own special subject! 🎓</p>
              </div>
            </section>

            <div className="flex justify-end pt-4 pb-12">
              <button
                type="submit"
                disabled={loading}
                className={`group relative flex h-[60px] w-full sm:w-auto min-w-[220px] items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-[#1A1A1A] px-8 text-[16px] font-bold tracking-tight text-white shadow-[0_20px_40px_rgba(26,26,26,0.2)] transition-all ${TRANSITION_TIMING} hover:-translate-y-1 hover:bg-[#2A2A2A] hover:shadow-[0_25px_50px_rgba(26,26,26,0.25)] active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Apply & Save Profile
                  </>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
