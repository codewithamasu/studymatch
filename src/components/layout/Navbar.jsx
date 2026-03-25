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
  User,
  X,
} from 'lucide-react'
import { INTERACTION_TIMING } from '@/lib/constants'

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



function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || 'S'
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar({ mode = 'app' }) {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const isMarketing = mode === 'marketing'
  const isAuthenticated = !isMarketing && Boolean(user)
  const navItems = isAuthenticated ? appNavItems : marketingNavItems

  const closeMenus = () => {
    setMobileOpen(false)
    setProfileOpen(false)
  }

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
      `motion-safe:transition-[color,background-color,border-color,transform,box-shadow] ${INTERACTION_TIMING}`,
      active
        ? 'border border-[#136DEC]/12 bg-[#136DEC]/10 text-[#136DEC]'
        : 'text-[#5F6470] hover:bg-white/88 hover:text-[#136DEC]'
    )

  const mobileLinkClass = ({ active = false } = {}) =>
    cn(
      'flex min-h-12 items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight outline-none',
      'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
      `motion-safe:transition-[color,background-color,border-color,transform,box-shadow] ${INTERACTION_TIMING}`,
      active
        ? 'bg-[#136DEC]/10 text-[#136DEC]'
        : 'text-[#4E5561] hover:bg-white hover:text-[#136DEC]'
    )

  return (
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
              className={`h-8 w-auto motion-safe:transition-transform ${INTERACTION_TIMING} group-hover:scale-[1.02] sm:h-9`}
            />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated
              ? navItems.map((item) => {
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
              : navItems.map((item) => (
                  <a key={item.href} href={item.href} onClick={closeMenus} className={desktopLinkClass()}>
                    {item.label}
                  </a>
                ))}
          </div>

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
                      `motion-safe:transition-[transform,box-shadow,border-color,background-color] ${INTERACTION_TIMING}`,
                      'hover:-translate-y-[1px] hover:border-[#D4DBE3] hover:shadow-[0_16px_36px_rgba(18,31,53,0.08)]'
                    )}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={`${user.full_name} avatar`}
                        className="h-10 w-10 rounded-full border border-[#E7EAEE] object-cover "
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
                        {user?.university || 'Student'}
                      </p>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-[#6B7280] motion-safe:transition-transform',
                        INTERACTION_TIMING,
                        profileOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'absolute right-0 top-[calc(100%+0.75rem)] w-72 origin-top-right rounded-[24px] border border-[#E7EAEE] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl',
                      `motion-safe:transition-[opacity,transform,visibility] ${INTERACTION_TIMING}`,
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
                        {user?.university || 'Student'}
                      </p>
                    </div>

                    <div className="h-px bg-[#E7EAEE] my-1 w-full" />

                    <Link
                      to="/profile"
                      onClick={closeMenus}
                      className={cn(
                        'flex min-h-11 w-full items-center justify-between rounded-[18px] px-4 py-2 text-sm font-semibold tracking-tight text-[#4E5561]',
                        'hover:bg-[#F4F7FB] hover:text-[#1A1A1A] transition-colors duration-200'
                      )}
                      role="menuitem"
                    >
                      <span>Profile Settings</span>
                      <User className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className={cn(
                        'flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight text-[#A63C57]',
                        `motion-safe:transition-[color,background-color] ${INTERACTION_TIMING}`,
                        'hover:bg-[#FFF1F4] hover:text-[#922E49]'
                      )}
                      role="menuitem"
                    >
                      <span>Sign Out</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E7EAEE] bg-white/88 text-[#4E5561] shadow-[0_8px_24px_rgba(18,31,53,0.05)] outline-none md:hidden',
                    'focus-visible:ring-2 focus-visible:ring-[#136DEC]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F8]',
                    `motion-safe:transition-[color,background-color,border-color,transform] ${INTERACTION_TIMING}`,
                    'hover:border-[#D4DBE3] hover:bg-white hover:text-[#136DEC]'
                  )}
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-panel"
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                    `motion-safe:transition-[color,background-color] ${INTERACTION_TIMING}`,
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
                    `motion-safe:transition-[transform,background-color,box-shadow] ${INTERACTION_TIMING}`,
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
                    `motion-safe:transition-[color,background-color,border-color] ${INTERACTION_TIMING}`,
                    'hover:border-[#D4DBE3] hover:bg-white hover:text-[#136DEC]'
                  )}
                  onClick={() => setMobileOpen((open) => !open)}
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

      <div
        id="mobile-nav-panel"
        className={cn(
          'border-t border-[#E7EAEE] bg-[rgba(249,249,248,0.94)] px-4 pb-4 pt-3 backdrop-blur-xl md:hidden',
          `motion-safe:transition-[opacity,transform,max-height,visibility] ${INTERACTION_TIMING}`,
          mobileOpen ? 'visible max-h-[32rem] translate-y-0 opacity-100' : 'invisible max-h-0 -translate-y-2 overflow-hidden opacity-0'
        )}
      >
        <div className="space-y-2">
          {isAuthenticated && user ? (
            navItems.map((item) => {
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
                    {user.university || 'Student'}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={closeMenus}
                className={cn(
                  'mt-3 flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight text-[#4E5561]',
                  'hover:bg-[#F4F7FB] hover:text-[#1A1A1A] transition-colors duration-200'
                )}
              >
                <span>Profile Settings</span>
                <User className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  'mt-3 flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight text-[#A63C57]',
                  `motion-safe:transition-[color,background-color] ${INTERACTION_TIMING}`,
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
