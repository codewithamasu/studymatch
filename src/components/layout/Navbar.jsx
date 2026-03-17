import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  BookOpen,
  Users,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  Settings,
  User,
} from 'lucide-react'

const navItems = [
  { path: '/discover', label: 'Discover', icon: Sparkles },
  { path: '/matches', label: 'Matches', icon: Users },
  { path: '/sessions', label: 'Sessions', icon: Calendar },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDiscover = location.pathname === '/discover'
  const isChat = location.pathname === '/chat'

  // Use 'light' theme logic for both Discover and Chat pages based on mockups
  const isLightNav = isDiscover || isChat

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isLightNav ? 'bg-white border-b border-gray-100' : 'glass border-b border-border/50'}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isLightNav ? 'w-full max-w-[1600px]' : 'max-w-7xl'}`}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            {isLightNav ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1 transition-transform group-hover:scale-110">
                <path d="M12 22L2 6H22L12 22Z" fill="#2563EB" />
                <path d="M2 6H22" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            )}
            <span className={`font-heading font-bold text-xl tracking-tight ${isLightNav ? 'text-[#0f172a]' : 'gradient-text'}`}>
              StudyMatch
            </span>
          </Link>

          {/* Center Nav for Discover and Chat */}
          {user && isLightNav && (
            <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="/dashboard" className="text-[13px] font-semibold text-[#475569] hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/matches" className="text-[13px] font-semibold text-[#475569] hover:text-blue-600 transition-colors">
                Matches
              </Link>
              <Link to="/chat" className={`text-[13px] font-semibold transition-colors ${isChat ? 'text-[#1a56db]' : 'text-[#475569] hover:text-blue-600'}`}>
                Chat
              </Link>
              <Link to="/resources" className="text-[13px] font-semibold text-[#475569] hover:text-blue-600 transition-colors">
                Resources
              </Link>
            </div>
          )}

          {/* Desktop Nav */}
          {user && !isLightNav && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/15 text-primary-light'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              isLightNav ? (
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-[#f0f9ff] flex items-center justify-center text-[#0284c7] hover:bg-blue-100 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#fed7aa] overflow-hidden flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                    <div className="w-full h-full bg-[#ffedd5] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#f97316] fill-[#f97316] opacity-80" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
                      <p className="text-xs text-text-muted">{user.university}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                      {user.full_name?.charAt(0)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Mobile menu button */}
                  <button
                    className="md:hidden p-2 text-text-secondary hover:text-text-primary"
                    onClick={() => setMobileOpen(!mobileOpen)}
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              )
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {user && !isLightNav && mobileOpen && (
        <div className="md:hidden glass border-b border-border/50 animate-in slide-in-from-top">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary-light'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-accent w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
