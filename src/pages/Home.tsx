import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, ArrowRight, Gamepad2 } from 'lucide-react'
import { useRoomStore, getSavedRoomCode } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoom } from '@/hooks/useRoom'

export default function Home() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const connected = useRoomStore(s => s.connected)
  const { createRoom, joinRoom } = useRoom()

  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect to saved room if session exists
  useEffect(() => {
    const savedCode = getSavedRoomCode()
    if (savedCode) {
      navigate(`/room/${savedCode}`, { replace: true })
    }
  }, [navigate])

  const handleCreate = async () => {
    if (!user || !connected) return
    setLoading(true)
    setError('')
    const res = await createRoom()
    setLoading(false)
    if (res.ok && res.code) {
      navigate(`/room/${res.code}`)
    } else {
      setError(res.error ?? 'Erreur lors de la creation')
    }
  }

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code || !user || !connected) return
    setLoading(true)
    setError('')
    const res = await joinRoom(code)
    setLoading(false)
    if (res.ok && res.code) {
      navigate(`/room/${res.code}`)
    } else {
      setError(res.error ?? 'Room introuvable')
    }
  }

  if (authLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="font-display text-3xl md:text-4xl tracking-wide">
            <span className="text-text-primary">PUANT</span>
            <span className="text-neon-green text-glow-green">GAMES</span>
          </h1>
          <p className="text-text-secondary text-base">
            Connecte-toi avec Discord pour jouer avec tes potes.
          </p>
          <a
            href="/api/auth/discord"
            className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl px-8 py-4 font-display text-lg tracking-wide transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            CONNEXION AVEC DISCORD
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-3">
          <span className="text-text-primary">PUANT</span>
          <span className="text-neon-green text-glow-green">GAMES</span>
        </h1>
        <p className="text-text-secondary text-base">
          Cree une room ou rejoins tes potes.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
          <span className="text-neon-green font-medium text-sm">{user.globalName ?? user.username}</span>
          {connected ? (
            <span className="inline-block w-2 h-2 bg-neon-green rounded-full" />
          ) : (
            <span className="text-neon-pink text-sm ml-1">Connexion...</span>
          )}
        </div>
      </motion.div>

      {/* Create room */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={handleCreate}
          disabled={!connected || loading}
          className="w-full gradient-border group transition-all hover:scale-[1.01] disabled:opacity-50"
        >
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
              <Plus className="w-6 h-6 text-neon-green" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display text-lg tracking-wide">CREER UNE ROOM</p>
              <p className="text-text-muted text-sm">Lance une partie et invite tes potes</p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-neon-green transition-colors" />
          </div>
        </button>
      </motion.div>

      {/* Join room */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="gradient-border"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <p className="font-display text-lg tracking-wide">REJOINDRE</p>
              <p className="text-text-muted text-sm">Entre le code de la room</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="CODE"
              maxLength={4}
              className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-center text-text-primary font-display text-xl tracking-[0.2em] uppercase placeholder:text-text-muted placeholder:text-base placeholder:font-body placeholder:tracking-normal focus:outline-none focus:border-neon-blue/40 transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.trim().length < 4 || !connected || loading}
              className="bg-neon-blue/10 border border-neon-blue/20 text-neon-blue rounded-xl px-6 py-3 font-medium hover:bg-neon-blue/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-neon-pink text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
