import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { Gamepad2, LogOut, ChevronDown, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useRef, useEffect } from 'react'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'

export default function Layout() {
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const room = useRoomStore(s => s.room)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setUserMenuOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-body text-[14px] transition-colors no-underline ${
      isActive
        ? 'text-accent font-semibold'
        : 'text-text-secondary font-medium hover:text-text-primary'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-page">
      {/* Header */}
      <header className="flex items-center justify-between h-[56px] px-[24px] bg-card border-b border-border shrink-0">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-[10px] no-underline">
            <Gamepad2 className="w-[24px] h-[24px] text-accent" />
            <span className="font-display text-[18px] font-bold tracking-[2px] text-accent">
              PUANT GAMES
            </span>
          </Link>

          {/* Center: Navigation */}
          <nav className="flex items-center gap-[32px]">
            <NavLink to="/" end className={navLinkClass}>
              Accueil
            </NavLink>
            <NavLink to="/rooms" className={navLinkClass}>
              Salons
            </NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>
              Classement
            </NavLink>
            <span className="font-body text-[14px] font-medium text-text-muted cursor-not-allowed select-none">
              Jeux
            </span>
          </nav>

          {/* Right: User area */}
          <div className="flex items-center">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-[10px]"
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-[32px] h-[32px] rounded-full ring-2 ring-accent bg-elevated"
                  />
                  <span className="font-body text-[14px] font-medium text-text-primary hidden sm:block">
                    {user.globalName ?? user.username}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-text-muted transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-[14px] border border-border bg-card shadow-2xl shadow-black/60 z-50"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-text-primary">
                          {user.globalName ?? user.username}
                        </p>
                      </div>
                      <div className="p-1.5 flex flex-col">
                        {user.isAdmin && (
                          <Link
                            to="/admin"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors no-underline"
                          >
                            <Shield className="w-4 h-4" />
                            Administration
                          </Link>
                        )}
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-accent-pink hover:bg-accent-pink/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        </header>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
