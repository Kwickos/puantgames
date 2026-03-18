import { useState, useEffect, useRef, useCallback } from 'react'
import { registry } from '@/lib/registry'
import type { GameComponentProps } from '@/types/game'

const PADDING = 10 // % from edges

function randomPosition() {
  return {
    x: PADDING + Math.random() * (100 - 2 * PADDING),
    y: PADDING + Math.random() * (100 - 2 * PADDING),
  }
}

function AimTrainerGame({ players, myPlayerId, gameState, updateScore, endGame }: GameComponentProps) {
  const mode = (gameState.data.mode as number) ?? 0
  const duration = (gameState.data.duration as number) ?? 30
  const targetCount = (gameState.data.targetCount as number) ?? 20

  const [targetPos, setTargetPos] = useState(() => randomPosition())
  const [timeLeft, setTimeLeft] = useState(duration)
  const [gameOver, setGameOver] = useState(false)
  const timerRef = useRef<number | null>(null)

  const myScore = gameState.scores[myPlayerId] ?? 0

  // Timer countdown (mode 0 only)
  useEffect(() => {
    if (gameState.status !== 'playing' || mode !== 0) return

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
  }, [gameState.status, mode])

  // Timer end → game over (mode 0)
  useEffect(() => {
    if (mode !== 0 || gameOver) return
    if (timeLeft === 0) {
      setGameOver(true)
      if (players[0]?.id === myPlayerId) {
        endGame()
      }
    }
  }, [timeLeft, gameOver, mode, players, myPlayerId, endGame])

  // Target count reached → game over (mode 1)
  useEffect(() => {
    if (mode !== 1 || gameOver) return
    const reached = players.some(p => (gameState.scores[p.id] ?? 0) >= targetCount)
    if (reached) {
      setGameOver(true)
      endGame()
    }
  }, [gameState.scores, mode, gameOver, players, targetCount, endGame])

  const handleTargetClick = useCallback(() => {
    if (gameOver) return
    setTargetPos(randomPosition())
    updateScore(myPlayerId, 1)
  }, [gameOver, myPlayerId, updateScore])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-display text-2xl text-accent-orange">
          {myScore}{mode === 1 ? ` / ${targetCount}` : ''}
        </div>
        {mode === 0 && (
          <div className={`font-display text-2xl ${timeLeft <= 5 ? 'text-accent-pink' : 'text-accent-orange'}`}>
            {timeLeft}s
          </div>
        )}
        {mode === 1 && (
          <div className="text-text-muted text-sm">
            Premier a {targetCount} cibles
          </div>
        )}
      </div>

      {/* Game area */}
      <div
        className="relative w-full bg-void border border-border rounded-xl overflow-hidden cursor-crosshair select-none"
        style={{ aspectRatio: '16 / 9' }}
      >
        {!gameOver ? (
          <button
            onClick={handleTargetClick}
            className="absolute w-12 h-12 rounded-full bg-accent-orange border-2 border-accent-orange/50 hover:brightness-110 transition-[filter] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${targetPos.x}%`,
              top: `${targetPos.y}%`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-muted font-display text-xl">Termine !</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!gameOver ? (
        <p className="text-text-muted text-sm text-center">
          Clique sur les cibles le plus vite possible !
        </p>
      ) : (
        <p className="text-accent text-sm text-center font-medium">
          Score final : {myScore} cibles
        </p>
      )}
    </div>
  )
}

registry.register({
  id: 'aim-trainer',
  name: 'AIM TRAINER',
  description: 'Clique sur les cibles le plus vite possible ! Tous les joueurs jouent en meme temps.',
  emoji: '🎯',
  color: 'neon-orange',
  config: {
    minPlayers: 2,
    maxPlayers: 8,
  },
  tags: ['rapidite', 'simultane'],
  settings: [
    {
      id: 'mode',
      label: 'Mode',
      options: [
        { label: 'Timer', value: 0 },
        { label: 'Cibles', value: 1 },
      ],
      default: 0,
    },
    {
      id: 'duration',
      label: 'Duree',
      options: [
        { label: '15s', value: 15 },
        { label: '30s', value: 30 },
        { label: '45s', value: 45 },
      ],
      default: 30,
      visibleWhen: { settingId: 'mode', value: 0 },
    },
    {
      id: 'targetCount',
      label: 'Cibles a atteindre',
      options: [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '30', value: 30 },
      ],
      default: 20,
      visibleWhen: { settingId: 'mode', value: 1 },
    },
  ],
  component: AimTrainerGame,
})
