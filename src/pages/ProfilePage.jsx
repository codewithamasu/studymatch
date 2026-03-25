import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/useAuthStore'
import { Sparkles, Save, User, MapPin, AlignLeft } from 'lucide-react'
import { DISPLAY_FONT, TRANSITION_TIMING } from '@/lib/constants'



export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  const [form, setForm] = useState({
    full_name: '',
    university: '',
    bio: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        university: user.university || '',
        bio: user.bio || ''
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
        bio: form.bio
      })

      if (error) throw error
      setMessage({ text: 'Profile updated successfully!', type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Profile - StudyMatch</title>
        <meta name="description" content="Manage your StudyMatch profile and academic information." />
      </Helmet>
      <div className="min-h-[100dvh] border-t border-[#ECEDE8] bg-[#F9F9F8] text-[#1A1A1A] pt-[100px] pb-24 px-4 sm:px-6">
      <div className="max-w-[640px] mx-auto">
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
          <p className="mt-4 max-w-[28rem] text-[15px] leading-7 text-[#626B76] sm:text-base">
            Keep your basic information up to date so your study partners know who they're matching with.
          </p>
        </header>

        <form 
          onSubmit={handleUpdate}
          className="rounded-[32px] bg-[rgba(255,255,255,0.85)] p-6 sm:p-10 shadow-[0_24px_60px_rgba(28,38,52,0.03)] ring-1 ring-white/60 backdrop-blur-md"
        >
          {message.text && (
            <div className={`mb-8 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold ${
              message.type === 'success' ? 'bg-[#EEFDF3] text-[#14804A]' : 'bg-[#FFF1F4] text-[#A63C57]'
            }`}>
              <Sparkles className="h-4 w-4 shrink-0" />
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            <label className="block">
              <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">Full Name</span>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="E.g. Sarah Jenkins"
                  className="h-[52px] w-full rounded-[20px] border border-[#E9ECEF] bg-[#FCFCFB] pl-12 pr-5 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10 transition-all"
                />
                <User className="pointer-events-none absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A93A0]" />
              </div>
            </label>

            <label className="block">
              <span className="mb-3 block text-sm font-semibold tracking-tight text-[#374151]">University / Campus</span>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  placeholder="Stanford University"
                  className="h-[52px] w-full rounded-[20px] border border-[#E9ECEF] bg-[#FCFCFB] pl-12 pr-5 text-[15px] font-medium text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10 transition-all"
                />
                <MapPin className="pointer-events-none absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A93A0]" />
              </div>
            </label>

            <label className="block relative">
              <span className="mb-3 flex items-center justify-between">
                <span className="block text-sm font-semibold tracking-tight text-[#374151]">About Me</span>
                <span className={`text-[12px] font-medium ${form.bio.length > 300 ? 'text-red-500' : 'text-[#8A93A0]'}`}>
                  {form.bio.length}/300
                </span>
              </span>
              <div className="relative">
                <textarea
                  required
                  maxLength={300}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="I love connecting with structured study sessions..."
                  className="min-h-[140px] w-full rounded-[24px] border border-[#E9ECEF] bg-[#FCFCFB] p-5 pl-12 text-[15px] font-medium text-[#1A1A1A] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none focus:border-[#136DEC]/35 focus:ring-4 focus:ring-[#136DEC]/10 transition-all resize-y"
                />
                <AlignLeft className="pointer-events-none absolute left-5 top-5 h-[18px] w-[18px] text-[#8A93A0]" />
              </div>
            </label>
            
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`group relative flex h-[56px] w-full sm:w-auto min-w-[180px] items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-[#1A1A1A] px-8 text-[15px] font-semibold tracking-tight text-white shadow-[0_16px_32px_rgba(26,26,26,0.18)] transition-all ${TRANSITION_TIMING} hover:-translate-y-px hover:bg-[#2A2A2A] hover:shadow-[0_20px_40px_rgba(26,26,26,0.22)] active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#626B76] border-t-white" />
                ) : (
                  <>
                    <Save className="h-[18px] w-[18px]" />
                    Save Changes
                  </>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            </div>
          </div>
        </form>
      </div>
      </div>
    </>
  )
}
