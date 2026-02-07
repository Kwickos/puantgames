import { Outlet, Link, useLocation } from 'react-router-dom'
import { Gamepad2, Home, LogOut, Shield, Trophy, Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'

export default function Layout() {
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const connected = useRoomStore(s => s.connected)
  const room = useRoomStore(s => s.room)

  return (
    <div className="noise-bg min-h-screen flex flex-col relative">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-neon-blue/5 blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-neon-green/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-md bg-midnight/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group no-underline">
            <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
              <Gamepad2 className="w-5 h-5 text-neon-green" />
            </div>
            <span className="font-display text-xl tracking-wide text-text-primary">
              PUANT<span className="text-neon-green">GAMES</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {room && (
              <span className="text-text-muted text-xs font-display tracking-wider bg-surface-light px-3 py-1 rounded-lg">
                ROOM {room.code}
              </span>
            )}

            {user && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                {connected ? (
                  <Wifi className="w-3.5 h-3.5 text-neon-green" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-neon-pink" />
                )}
                <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                <span>{user.globalName ?? user.username}</span>
                <button
                  onClick={logout}
                  className="ml-1 text-text-muted hover:text-neon-pink transition-colors"
                  title="Deconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!room && (
              <>
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                    location.pathname === '/'
                      ? 'bg-surface-light text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Link
                  to="/leaderboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                    location.pathname === '/leaderboard'
                      ? 'bg-surface-light text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Classement
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                      location.pathname === '/admin'
                        ? 'bg-neon-pink/10 text-neon-pink border border-neon-pink/20'
                        : 'text-text-secondary hover:text-neon-pink hover:bg-neon-pink/5'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-w-7xl mx-auto px-6 py-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-4 text-center text-text-muted text-sm">
        PuantGames &mdash; La plateforme de jeu entre potes
      </footer>
    </div>
  )
}
