import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { registry } from '@/lib/registry'
import type { GameComponentProps } from '@/types/game'

function ClickRaceGame({ players, myPlayerId, gameState, updateScore, endGame }: GameComponentProps) {
  const duration = (gameState.data.duration as number) ?? 10
  const [clicks, setClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<number | null>(null)

  const me = players.find(p => p.id === myPlayerId)

  // Start timer when game begins
  useEffect(() => {
    if (gameState.status !== 'playing') return

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState.status])

  // Submit score when time is up
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true)
      updateScore(myPlayerId, clicks)
    }
  }, [timeLeft, submitted, clicks, myPlayerId, updateScore])

  // Auto-end game when all players have a score > 0
  // (host-side check via gameState updates)
  useEffect(() => {
    if (!submitted) return
    const allScored = players.every(p => (gameState.scores[p.id] ?? 0) > 0)
    if (allScored) {
      endGame()
    }
  }, [gameState.scores, submitted, players, endGame])

  const handleClick = () => {
    if (timeLeft <= 0) return
    setClicks(prev => prev + 1)
  }

  return (
    <div className="text-center space-y-6">
      {me && (
        <div>
          <p className="text-text-muted text-sm mb-1">Tu joues en tant que</p>
          <p className="text-xl font-display">
            <img src={me.avatar} alt="" className="w-7 h-7 rounded-full inline align-middle" /> {me.name}
          </p>
        </div>
      )}

      <div className="text-6xl font-display text-neon-yellow">
        {timeLeft}s
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={timeLeft <= 0}
        className="w-48 h-48 rounded-full bg-neon-green/10 border-2 border-neon-green/30 text-neon-green text-6xl font-display mx-auto flex items-center justify-center hover:bg-neon-green/20 transition-colors disabled:opacity-30 cursor-pointer"
      >
        {clicks}
      </motion.button>

      {timeLeft > 0 ? (
        <p className="text-text-muted text-sm">
          Clique le plus vite possible !
        </p>
      ) : (
        <p className="text-neon-green font-medium text-sm">
          Score envoye : {clicks} clics !
          {!submitted && ' Envoi en cours...'}
        </p>
      )}

      {/* Other players status */}
      <div className="flex justify-center gap-2 flex-wrap">
        {players.map(p => {
          const scored = (gameState.scores[p.id] ?? 0) > 0
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                scored
                  ? 'bg-neon-green/10 text-neon-green'
                  : 'bg-surface-light text-text-muted'
              }`}
            >
              <img src={p.avatar} alt="" className="w-5 h-5 rounded-full" />
              <span>{p.id === myPlayerId ? 'Toi' : p.name}</span>
              {scored && <span>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

registry.register({
  id: 'click-race',
  name: 'CLICK RACE',
  description: 'Clique le plus vite possible ! Tous les joueurs jouent en meme temps.',
  emoji: '🖱️',
  color: 'neon-green',
  config: {
    minPlayers: 2,
    maxPlayers: 8,
  },
  tags: ['rapidite', 'simultane'],
  settings: [
    {
      id: 'duration',
      label: 'Durée',
      options: [
        { label: '5s', value: 5 },
        { label: '10s', value: 10 },
        { label: '15s', value: 15 },
        { label: '20s', value: 20 },
      ],
      default: 10,
    },
  ],
  component: ClickRaceGame,
})
