import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  Calendar,
  MessageCircle,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { mockMatches } from '@/data/mockData'

export default function MatchesPage() {
  const matches = mockMatches

  return (
    <div className="min-h-screen px-4 pt-20 pb-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold">My Matches</h1>
            <p className="text-sm text-text-muted">{matches.length} study partner ditemukan</p>
          </div>
          <Link to="/discover">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4" />
              Discover More
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">Belum ada match</h2>
            <p className="text-text-secondary mb-6">Mulai swipe di halaman Discover untuk menemukan study partner!</p>
            <Link to="/discover">
              <Button>
                <Sparkles className="w-4 h-4" />
                Mulai Discover
              </Button>
            </Link>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {matches.map(match => (
            <Card key={match.id} className="group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {match.partner.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold truncate">{match.partner.full_name}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {match.partner.university}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="success" className="text-[10px]">
                        {match.compatibility_score}% Match
                      </Badge>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(match.matched_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {match.partner.study_profile.subjects.slice(0, 3).map(sub => (
                    <Badge key={sub} variant="secondary" className="text-[10px]">{sub}</Badge>
                  ))}
                </div>

                {/* Compatibility breakdown mini */}
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {Object.entries(match.breakdown).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs font-bold text-text-primary">{val}%</div>
                      <div className="text-[10px] text-text-muted capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to="/sessions/new" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Calendar className="w-3.5 h-3.5" />
                      Buat Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
