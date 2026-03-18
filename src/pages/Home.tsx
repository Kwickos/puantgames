import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, ArrowRight } from 'lucide-react'
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-body">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="font-display text-[64px] font-extrabold tracking-[-1px] text-text-primary">
            Joue. Ris. Domine.
          </h1>
          <p className="font-body text-[18px] font-medium text-text-secondary">
            Connecte-toi avec Discord pour jouer avec tes potes.
          </p>
          <a
            href="/api/auth/discord"
            className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-[14px] px-[32px] py-[16px] font-display text-[15px] font-bold tracking-wide transition-colors no-underline"
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
    <div className="flex-1 flex flex-col items-center justify-center gap-[48px]">
      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-[16px]"
      >
        {/* Tagline pill */}
        <div className="rounded-full bg-[#C4F82A15] border border-[#C4F82A40] px-[16px] py-[6px]">
          <span className="font-mono text-[12px] font-medium text-accent">
            ⚡ Plateforme de mini-jeux multijoueur
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-[64px] font-extrabold tracking-[-1px] text-text-primary">
          Joue. Ris. Domine.
        </h1>

        {/* Subtitle */}
        <p className="font-body text-[18px] font-medium text-text-secondary text-center w-[560px] max-w-full">
          Rejoins tes potes pour des parties endiablées de Codenames,
          Click Race, Undercover et plus encore.
        </p>
      </motion.div>

      {/* Actions row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-[16px]"
      >
        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!connected || loading}
          className="flex items-center gap-[10px] bg-accent rounded-[14px] px-[32px] py-[16px] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-[20px] h-[20px] text-text-inverted" />
          <span className="font-display text-[15px] font-bold text-text-inverted">
            CRÉER UNE ROOM
          </span>
        </button>

        {/* "ou" separator */}
        <span className="font-body text-[14px] font-medium text-text-muted">
          ou
        </span>

        {/* Join group */}
        <div className="flex">
          {/* Code input */}
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="CODE"
            maxLength={4}
            className="h-[52px] bg-card border border-elevated rounded-l-[14px] rounded-r-none px-[20px] py-[16px] font-mono text-[15px] font-medium tracking-[4px] text-text-primary placeholder:text-text-muted placeholder:tracking-[4px] focus:outline-none focus:border-border transition-colors w-[120px]"
          />
          {/* Join arrow button */}
          <button
            onClick={handleJoin}
            disabled={joinCode.trim().length < 4 || !connected || loading}
            className="flex items-center bg-elevated rounded-r-[14px] rounded-l-none px-[24px] py-[16px] transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-[20px] h-[20px] text-accent" />
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-accent-pink font-body text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
