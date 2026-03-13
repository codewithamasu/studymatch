import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Sparkles,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  CheckCircle,
  Video,
  MapPin,
} from 'lucide-react'
import gsap from 'gsap'

export default function LandingPage() {
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const stepsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.from('.hero-title', {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      })
      gsap.from('.hero-subtitle', {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
      })
      gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.4,
        ease: 'power3.out',
      })
      gsap.from('.hero-visual', {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power3.out',
      })

      // Features
      gsap.from('.feature-card', {
        scrollTrigger: '.feature-card',
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
      })

      // Steps
      gsap.from('.step-item', {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.8,
        ease: 'power2.out',
      })
    })

    return () => ctx.revert()
  }, [])

  const features = [
    {
      icon: Sparkles,
      title: 'Smart Matching',
      description: 'Temukan partner belajar yang kompatibel berdasarkan mata kuliah, jadwal, dan gaya belajar.',
      color: 'from-primary to-primary-light',
    },
    {
      icon: Calendar,
      title: 'Study Session Scheduler',
      description: 'Jadwalkan sesi belajar online via video call atau offline di lokasi yang disepakati.',
      color: 'from-secondary to-[#00A3CC]',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Pantau progress belajar, total jam, dan pertahankan study streak harianmu.',
      color: 'from-success to-[#00C853]',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Bangun jaringan partner belajar dan tingkatkan kolaborasi akademik.',
      color: 'from-accent to-accent-light',
    },
  ]

  const steps = [
    { num: '01', title: 'Buat Profil', desc: 'Isi profil belajar — mata kuliah, skill level, dan jadwal' },
    { num: '02', title: 'Temukan Partner', desc: 'Swipe partner yang cocok berdasarkan compatibility score' },
    { num: '03', title: 'Match!', desc: 'Saling tertarik? It\'s a Study Match!' },
    { num: '04', title: 'Belajar Bersama', desc: 'Jadwalkan sesi belajar online atau offline' },
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center px-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <Badge className="mb-6 hero-title">
              <Zap className="w-3 h-3 mr-1" />
              Subtema: Pendidikan — INNOVATE 2026
            </Badge>
            <h1 className="hero-title font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Temukan Partner
              <br />
              <span className="gradient-text">Belajar Idealmu</span>
            </h1>
            <p className="hero-subtitle text-lg text-text-secondary mb-8 max-w-lg">
              StudyMatch menghubungkan mahasiswa dengan partner belajar yang kompatibel melalui smart matching.
              Belajar lebih efektif, bersama.
            </p>
            <div className="hero-cta flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="xl">
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl">
                  Sudah Punya Akun
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="hero-cta mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {['A', 'S', 'B', 'M'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-bg-dark flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${
                        ['#6C5CE7', '#00D2FF', '#FF6B6B', '#00E676'][i]
                      }, ${['#8B7CF7', '#33DDFF', '#FF8A8A', '#69F0AE'][i]})`,
                    }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">1,200+ Mahasiswa</p>
                <p className="text-xs text-text-muted">sudah menemukan study partner</p>
              </div>
            </div>
          </div>

          {/* Hero Visual - Mock Swipe Card */}
          <div className="hero-visual hidden lg:flex justify-center items-center">
            <div className="relative">
              {/* Background cards */}
              <div className="absolute -top-4 -left-4 w-72 h-96 glass-card rotate-[-6deg] opacity-40" />
              <div className="absolute -top-2 -left-2 w-72 h-96 glass-card rotate-[-3deg] opacity-60" />

              {/* Main card */}
              <div className="relative w-72 h-96 glass-card p-6 flex flex-col items-center justify-between animate-float">
                <div className="w-full">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                    A
                  </div>
                  <h3 className="text-center font-heading font-bold text-lg">Andi Pratama</h3>
                  <p className="text-center text-sm text-text-muted mb-3">Universitas Indonesia</p>

                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    <Badge variant="default">Data Structures</Badge>
                    <Badge variant="default">Algorithms</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Target className="w-3.5 h-3.5 text-primary-light" />
                      <span>Persiapan Ujian</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-secondary" />
                      <span>19:00 – 21:00</span>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">Compatibility</span>
                    <span className="text-sm font-bold text-success">92%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-surface overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -right-12 top-8 glass-card px-3 py-2 animate-float" style={{ animationDelay: '0.5s' }}>
                <span className="text-lg">🎯</span>
                <span className="text-xs font-medium ml-1">Match!</span>
              </div>
              <div className="absolute -left-16 bottom-16 glass-card px-3 py-2 animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-lg">📚</span>
                <span className="text-xs font-medium ml-1">Study</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">Fitur Unggulan</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Semua yang Kamu Butuhkan untuk
              <br />
              <span className="gradient-text">Belajar Lebih Efektif</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              StudyMatch mengoptimalkan pengalaman belajarmu dengan fitur-fitur inovatif
              yang dirancang khusus untuk mahasiswa.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="feature-card group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              >
                <CardContent className="p-6 flex flex-col items-start">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section ref={stepsRef} className="py-24 px-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">Cara Kerja</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              4 Langkah Menuju
              <br />
              <span className="gradient-text">Study Partner Ideal</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="step-item text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                    <span className="font-heading font-bold text-xl gradient-text">{step.num}</span>
                  </div>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INNOVATE Theme Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center mb-10">
                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
                  Tema <span className="gradient-text">INNOVATE</span>
                </h2>
                <p className="text-text-secondary">Bagaimana StudyMatch mengimplementasikan setiap elemen</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { letter: 'I', word: 'Impel', desc: 'Mendorong mahasiswa berkolaborasi & belajar bersama' },
                  { letter: 'N', word: 'Navigate', desc: 'Menavigasi pencarian partner belajar yang ideal' },
                  { letter: 'N', word: 'Novelty', desc: 'Konsep matching dating-style yang baru di edtech' },
                  { letter: 'O', word: 'Optimize', desc: 'Mengoptimalkan waktu belajar dengan partner yang tepat' },
                  { letter: 'V', word: 'Validate', desc: 'Validasi progress dengan tracking & study streak' },
                  { letter: 'A', word: 'Advance', desc: 'Meningkatkan hasil akademik melalui kolaborasi' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-bg-surface/50 border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <span className="font-heading font-bold text-white">{item.letter}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">{item.word}</h4>
                      <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Siap Menemukan Study Partner?
          </h2>
          <p className="text-text-secondary mb-8 text-lg">
            Bergabung dan mulai belajar lebih efektif bersama partner yang cocok.
          </p>
          <Link to="/register">
            <Button size="xl" className="animate-pulse-glow">
              Mulai Gratis Sekarang
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold gradient-text">StudyMatch</span>
          </div>
          <p className="text-sm text-text-muted">
            © 2026 StudyMatch — INNOVATE Web Design Competition
          </p>
        </div>
      </footer>
    </div>
  )
}
