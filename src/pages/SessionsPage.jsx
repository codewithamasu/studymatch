import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Calendar,
  Clock,
  BookOpen,
  Video,
  MapPin,
  ArrowLeft,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { mockMatches, mockSessions } from '@/data/mockData'

const SUBJECTS = [
  'Calculus', 'Linear Algebra', 'Data Structures', 'Algorithms',
  'Statistics', 'Physics', 'Web Development', 'Machine Learning',
]

export default function SessionsPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    date: '',
    time: '19:00',
    duration: 60,
    mode: 'online',
    location: '',
    partner: mockMatches[0]?.id || '',
  })

  const sessions = mockSessions

  const handleSubmit = (e) => {
    e.preventDefault()
    // Mock create session
    setShowForm(false)
    // In production, save to Supabase
  }

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <div className="min-h-screen px-4 pt-20 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold">Study Sessions</h1>
            <p className="text-sm text-text-muted">{upcomingSessions.length} session mendatang</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Calendar className="w-4 h-4" />
            {showForm ? 'Tutup' : 'Buat Session'}
          </Button>
        </div>

        {/* Create Session Form */}
        {showForm && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-light" />
                Buat Study Session Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Partner Selection */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Study Partner</label>
                  <div className="flex gap-2 flex-wrap">
                    {mockMatches.map(match => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => setForm({ ...form, partner: match.id })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                          form.partner === match.id
                            ? 'bg-primary/15 border-primary'
                            : 'bg-bg-surface border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                          {match.partner.full_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{match.partner.full_name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Mata Kuliah</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setForm({ ...form, subject: sub })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
                          form.subject === sub
                            ? 'bg-primary/20 border-primary text-primary-light'
                            : 'bg-bg-surface border-border text-text-secondary hover:border-primary/50'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full h-11 rounded-lg bg-bg-surface border border-border px-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Waktu
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full h-11 rounded-lg bg-bg-surface border border-border px-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Durasi (menit)</label>
                    <Input
                      type="number"
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
                      min={15}
                      max={180}
                      step={15}
                    />
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Mode Session</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mode: 'online' })}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        form.mode === 'online'
                          ? 'bg-primary/15 border-primary'
                          : 'bg-bg-surface border-border hover:border-primary/50'
                      }`}
                    >
                      <Video className={`w-6 h-6 mx-auto mb-2 ${form.mode === 'online' ? 'text-primary-light' : 'text-text-muted'}`} />
                      <span className="text-sm font-medium block">Online</span>
                      <span className="text-xs text-text-muted">Video Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mode: 'offline' })}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        form.mode === 'offline'
                          ? 'bg-primary/15 border-primary'
                          : 'bg-bg-surface border-border hover:border-primary/50'
                      }`}
                    >
                      <MapPin className={`w-6 h-6 mx-auto mb-2 ${form.mode === 'offline' ? 'text-primary-light' : 'text-text-muted'}`} />
                      <span className="text-sm font-medium block">Offline</span>
                      <span className="text-xs text-text-muted">Bertemu Langsung</span>
                    </button>
                  </div>
                </div>

                {/* Location for offline */}
                {form.mode === 'offline' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Lokasi
                    </label>
                    <Input
                      placeholder="Contoh: Perpustakaan Pusat UI"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <CheckCircle className="w-4 h-4" />
                  Buat Study Session
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-light" />
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {upcomingSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Completed Sessions
            </h2>
            <div className="space-y-3">
              {completedSessions.map(session => (
                <SessionCard key={session.id} session={session} completed />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionCard({ session, completed }) {
  const sessionDate = new Date(session.scheduled_at)

  return (
    <Card className={`transition-all duration-300 hover:-translate-y-0.5 ${completed ? 'opacity-70' : 'hover:border-primary/20'}`}>
      <CardContent className="p-4 flex items-center gap-4">
        {/* Date block */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs text-text-muted leading-none">
            {sessionDate.toLocaleDateString('id-ID', { month: 'short' })}
          </span>
          <span className="text-lg font-bold font-heading leading-none mt-0.5">
            {sessionDate.getDate()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{session.subject}</h3>
            <Badge variant={session.mode === 'online' ? 'default' : 'secondary'} className="text-[10px]">
              {session.mode === 'online' ? <><Video className="w-3 h-3 mr-0.5" /> Online</> : <><MapPin className="w-3 h-3 mr-0.5" /> Offline</>}
            </Badge>
          </div>
          <p className="text-sm text-text-muted flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {sessionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>{session.duration_minutes} menit</span>
            <span className="flex items-center gap-1">
              with <strong className="text-text-secondary">{session.partner.full_name}</strong>
            </span>
          </p>
          {session.mode === 'offline' && session.location && (
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {session.location}
            </p>
          )}
        </div>

        {/* Action */}
        {!completed && (
          <div>
            {session.mode === 'online' ? (
              <Button size="sm" variant="success">
                <Video className="w-3.5 h-3.5" />
                Join
              </Button>
            ) : (
              <Badge variant="success">Upcoming</Badge>
            )}
          </div>
        )}
        {completed && (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Done
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
