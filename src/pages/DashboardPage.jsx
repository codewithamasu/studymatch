import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  Calendar,
  Clock,
  Flame,
  BookOpen,
  TrendingUp,
  Users,
  Video,
  MapPin,
  Star,
  ChevronRight,
  Sparkles,
  CheckCircle,
  Target,
  BarChart3,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { mockStats, mockSessions, mockMatches } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const stats = mockStats
  const upcomingSessions = mockSessions.filter(s => s.status === 'upcoming')

  const statCards = [
    {
      label: 'Total Sessions',
      value: stats.total_sessions,
      icon: Calendar,
      color: 'from-primary to-primary-light',
      change: '+2 minggu ini',
    },
    {
      label: 'Study Hours',
      value: `${stats.total_study_hours}h`,
      icon: Clock,
      color: 'from-secondary to-[#33DDFF]',
      change: '+3h minggu ini',
    },
    {
      label: 'Study Streak',
      value: stats.study_streak,
      icon: Flame,
      color: 'from-accent to-accent-light',
      change: '🔥 Keep going!',
      suffix: ' days',
    },
    {
      label: 'Matches',
      value: mockMatches.length,
      icon: Users,
      color: 'from-success to-[#69F0AE]',
      change: 'Study partners',
    },
  ]

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
            Welcome back, <span className="gradient-text">{user?.full_name || 'Student'}</span> 👋
          </h1>
          <p className="text-text-muted">Siap untuk sesi belajar hari ini?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <Card key={i} className="group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-heading">
                  {stat.value}{stat.suffix || ''}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                <div className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Study Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary-light" />
                Aktivitas Belajar Minggu Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekly_data}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#A0A0C0', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: '#232340',
                        border: '1px solid #2E2E4F',
                        borderRadius: '8px',
                        color: '#FFFFFE',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#A0A0C0' }}
                      cursor={{ fill: 'rgba(108, 92, 231, 0.1)' }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C5CE7" />
                        <stop offset="100%" stopColor="#00D2FF" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary-light" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">Completed</span>
                  <span className="text-sm font-bold">{stats.completed_sessions}/{stats.total_sessions}</span>
                </div>
                <Progress value={(stats.completed_sessions / stats.total_sessions) * 100} />
              </div>

              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-warning" />
                  <span className="text-sm text-text-secondary">Favorite Subject</span>
                </div>
                <span className="text-sm font-bold">{stats.favorite_subject}</span>
              </div>

              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-sm text-text-secondary">Current Streak</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] ${
                        i < stats.study_streak
                          ? 'bg-gradient-to-br from-accent to-accent-light text-white'
                          : 'bg-bg-surface text-text-muted'
                      }`}
                    >
                      {i < stats.study_streak ? '🔥' : i + 1}
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/discover">
                <Button variant="outline" className="w-full" size="sm">
                  <Sparkles className="w-4 h-4" />
                  Find More Partners
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-light" />
                Upcoming Sessions
              </h2>
              <Link to="/sessions" className="text-sm text-primary-light hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {upcomingSessions.slice(0, 2).map(session => {
                const sessionDate = new Date(session.scheduled_at)
                return (
                  <Card key={session.id} className="hover:border-primary/20 transition-all hover:-translate-y-0.5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-text-muted">
                          {sessionDate.toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold font-heading">
                          {sessionDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{session.subject}</h3>
                        <p className="text-sm text-text-muted flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {sessionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          <span>• {session.duration_minutes} min</span>
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          with {session.partner.full_name}
                        </p>
                      </div>
                      <Badge variant={session.mode === 'online' ? 'default' : 'secondary'}>
                        {session.mode === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
