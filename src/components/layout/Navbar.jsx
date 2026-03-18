import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import navbarLogo from '../../assets/navbar-logo.svg'
import { useAuthStore } from '@/store/useAuthStore'
import {
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Sparkles,
<<<<<<< HEAD
  X,
=======
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da
} from 'lucide-react'

const appNavItems = [
  { path: '/discover', label: 'Discover', icon: Sparkles },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/sessions', label: 'Sessions', icon: Calendar },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

const marketingNavItems = [
  { href: '/#how-it-works', label: 'How it Works' },
  { href: '/#features', label: 'Features' },
]

const interactionTiming = 'duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || 'S'
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar({ mode = 'app' }) {
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
<<<<<<< HEAD
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const isMarketing = mode === 'marketing'
  const isAuthenticated = !isMarketing && Boolean(user)
  const navItems = isAuthenticated ? appNavItems : marketingNavItems
  const closeMenus = () => {
    setMobileOpen(false)
    setProfileOpen(false)
  }
=======
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da

  const handleSignOut = async () => {
    closeMenus()
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const desktopLinkClass = ({ active = false } = {}) =>
    cn(
      'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-tight outline-none ring-0',
      'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
      `motion-safe:transition-[color,background-color,border-color,transform,box-shadow] ${interactionTiming}`,
      active
        ? 'border border-[#136DEC]/12 bg-[#136DEC]/10 text-[#136DEC]'
        : 'text-[#5F6470] hover:bg-white/88 hover:text-[#136DEC]'
    )

  const mobileLinkClass = ({ active = false } = {}) =>
    cn(
      'flex min-h-12 items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight outline-none',
      'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
      `motion-safe:transition-[color,background-color,border-color,transform,box-shadow] ${interactionTiming}`,
      active
        ? 'bg-[#136DEC]/10 text-[#136DEC]'
        : 'text-[#4E5561] hover:bg-white hover:text-[#136DEC]'
    )

  return (
<<<<<<< HEAD
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#E7EAEE] bg-[rgba(249,249,248,0.86)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(249,249,248,0.78)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-3 sm:gap-6">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="group inline-flex min-h-11 items-center rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]"
            aria-label="StudyMatch Home"
          >
            <img
              src={navbarLogo}
              alt="StudyMatch Logo"
              className={`h-8 w-auto motion-safe:transition-transform ${interactionTiming} group-hover:scale-[1.02] sm:h-9`}
            />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              navItems.map((item) => {
=======
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center group">
            <img src={navbarLogo} alt="StudyMatch Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
          </Link>

          {/* Desktop Nav */}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className={desktopLinkClass({ active: isActive })}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })
            ) : (
              navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenus} className={desktopLinkClass()}>
                  {item.label}
                </a>
              ))
            )}
          </div>

<<<<<<< HEAD
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <div ref={profileRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    className={cn(
                      'inline-flex min-h-11 items-center gap-3 rounded-full border border-[#E7EAEE] bg-white/88 px-3 py-2 text-left shadow-[0_10px_30px_rgba(18,31,53,0.06)] outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                      `motion-safe:transition-[transform,box-shadow,border-color,background-color] ${interactionTiming}`,
                      'hover:-translate-y-[1px] hover:border-[#D4DBE3] hover:shadow-[0_16px_36px_rgba(18,31,53,0.08)]'
                    )}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={`${user.full_name} avatar`}
                        className="h-10 w-10 rounded-full border border-[#E7EAEE] object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#136DEC] text-sm font-bold text-white">
                        {getInitial(user?.full_name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight text-[#1A1A1A]">
                        {user?.full_name}
                      </p>
                      <p className="truncate text-xs font-medium text-[#6B7280]">
                        {user?.university || 'Study partner'}
                      </p>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-[#6B7280] motion-safe:transition-transform',
                        interactionTiming,
                        profileOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'absolute right-0 top-[calc(100%+0.75rem)] w-72 origin-top-right rounded-[24px] border border-[#E7EAEE] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl',
                      `motion-safe:transition-[opacity,transform,visibility] ${interactionTiming}`,
                      profileOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
                    )}
                    role="menu"
                  >
                    <div className="rounded-[18px] bg-[#F4F7FB] px-4 py-3">
                      <p className="text-sm font-semibold tracking-tight text-[#1A1A1A]">{user?.full_name}</p>
                      <p className="mt-1 text-xs font-medium text-[#6B7280]">{user?.email}</p>
                    </div>

                    <div className="px-1 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#95A0AD]">
                        Campus
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#4E5561]">
                        {user?.university || 'Mahasiswa'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className={cn(
                        'flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight text-[#A63C57]',
                        `motion-safe:transition-[color,background-color] ${interactionTiming}`,
                        'hover:bg-[#FFF1F4] hover:text-[#922E49]'
                      )}
                      role="menuitem"
                    >
                      <span>Sign Out</span>
                      <LogOut className="h-4 w-4" />
                    </button>
=======
          {/* Right Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
                    <p className="text-xs text-text-muted">{user.university}</p>
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {user.full_name?.charAt(0)}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
<<<<<<< HEAD

                <button
                  type="button"
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E7EAEE] bg-white/88 text-[#4E5561] shadow-[0_8px_24px_rgba(18,31,53,0.05)] outline-none md:hidden',
                    'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                    `motion-safe:transition-[color,background-color,border-color,transform] ${interactionTiming}`,
                    'hover:border-[#D4DBE3] hover:bg-white hover:text-[#136DEC]'
                  )}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-panel"
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
=======
                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 text-text-secondary hover:text-text-primary"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className={cn(
                    'hidden min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold tracking-tight text-[#5F6470] outline-none sm:inline-flex',
                    'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                    `motion-safe:transition-[color,background-color] ${interactionTiming}`,
                    'hover:bg-white/88 hover:text-[#136DEC]'
                  )}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full bg-[#136DEC] px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[0_12px_32px_rgba(19,109,236,0.24)] outline-none',
                    'focus-visible:ring-2 focus-visible:ring-[#136DEC]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                    `motion-safe:transition-[transform,background-color,box-shadow] ${interactionTiming}`,
                    'hover:-translate-y-[1px] hover:bg-[#0F60D0] hover:shadow-[0_18px_36px_rgba(19,109,236,0.28)]'
                  )}
                >
                  Join Now
                </Link>
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E7EAEE] bg-white/88 text-[#4E5561] outline-none sm:hidden',
                    'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                    `motion-safe:transition-[color,background-color,border-color] ${interactionTiming}`,
                    'hover:border-[#D4DBE3] hover:bg-white hover:text-[#136DEC]'
                  )}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-panel"
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <div
        id="mobile-nav-panel"
        className={cn(
          'border-t border-[#E7EAEE] bg-[rgba(249,249,248,0.94)] px-4 pb-4 pt-3 backdrop-blur-xl md:hidden',
          `motion-safe:transition-[opacity,transform,max-height,visibility] ${interactionTiming}`,
          mobileOpen ? 'visible max-h-[32rem] translate-y-0 opacity-100' : 'invisible max-h-0 -translate-y-2 overflow-hidden opacity-0'
        )}
      >
        <div className="space-y-2">
          {isAuthenticated && user ? (
            navItems.map((item) => {
=======
      {/* Mobile Menu */}
      {user && mobileOpen && (
        <div className="md:hidden glass border-t border-border/50 animate-in slide-in-from-top">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => {
>>>>>>> 236c93b5e605204f03a7e668d9e79d667d56d0da
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenus}
                  className={mobileLinkClass({ active: isActive })}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })
          ) : (
            <>
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenus} className={mobileLinkClass()}>
                  {item.label}
                </a>
              ))}
              <Link to="/login" onClick={closeMenus} className={mobileLinkClass()}>
                Log in
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <div className="mt-3 rounded-[24px] border border-[#E7EAEE] bg-white/90 p-3 shadow-[0_10px_30px_rgba(18,31,53,0.06)]">
              <div className="flex items-center gap-3 rounded-[18px] bg-[#F4F7FB] px-3 py-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.full_name} avatar`}
                    className="h-11 w-11 rounded-full border border-[#E7EAEE] object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#136DEC] text-sm font-bold text-white">
                    {getInitial(user.full_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-[#1A1A1A]">
                    {user.full_name}
                  </p>
                  <p className="truncate text-xs font-medium text-[#6B7280]">
                    {user.university || 'Mahasiswa'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  'mt-3 flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight text-[#A63C57]',
                  `motion-safe:transition-[color,background-color] ${interactionTiming}`,
                  'hover:bg-[#FFF1F4] hover:text-[#922E49]'
                )}
              >
                <span>Sign Out</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
