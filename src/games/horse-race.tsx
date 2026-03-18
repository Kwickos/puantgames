import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { registry } from '@/lib/registry'
import type { GameComponentProps } from '@/types/game'

function HorseRaceGame({ players, myPlayerId, gameState, updateScore, endGame }: GameComponentProps) {
  const finishLine = (gameState.data.distance as number) ?? 40
  const [finished, setFinished] = useState(false)
  const lastScoreRef = useRef(0)

  const myScore = gameState.scores[myPlayerId] ?? 0
  const isRaceOver = players.some(p => (gameState.scores[p.id] ?? 0) >= finishLine)

  // Listen for spacebar
  useEffect(() => {
    if (gameState.status !== 'playing' || isRaceOver) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      updateScore(myPlayerId, 1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [gameState.status, isRaceOver, myPlayerId, updateScore])

  // End game when someone crosses the finish line
  useEffect(() => {
    if (isRaceOver && !finished) {
      setFinished(true)
      // Small delay so everyone sees the winner cross
      setTimeout(() => endGame(), 800)
    }
  }, [isRaceOver, finished, endGame])

  // Track if my score changed for tap feedback
  const justPressed = myScore !== lastScoreRef.current
  useEffect(() => {
    lastScoreRef.current = myScore
  }, [myScore])

  // Keep original player order (no reordering during race)

  // Find winner
  const winner = players.find(p => (gameState.scores[p.id] ?? 0) >= finishLine)

  return (
    <div className="space-y-6">
      {/* Winner banner */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3"
        >
          <p className="font-display text-2xl text-accent-orange">
            <img src={winner.avatar} alt="" className="w-8 h-8 rounded-full inline align-middle" /> {winner.id === myPlayerId ? 'Tu as gagné !' : `${winner.name} a gagné !`}
          </p>
        </motion.div>
      )}

      {/* Race tracks */}
      <div className="space-y-3">
        {players.map((player) => {
          const score = gameState.scores[player.id] ?? 0
          const progress = Math.min(score / finishLine, 1)
          const isMe = player.id === myPlayerId
          const isWinner = score >= finishLine

          return (
            <div key={player.id} className="relative">
              {/* Player label */}
              <div className="flex items-center gap-2 mb-1">
                <img src={player.avatar} alt="" className="w-5 h-5 rounded-full" />
                <span className={`text-sm font-medium ${isMe ? 'text-accent' : 'text-text-secondary'}`}>
                  {isMe ? 'Toi' : player.name}
                </span>
                <span className="text-xs text-text-muted ml-auto">{score}/{finishLine}</span>
              </div>

              {/* Track */}
              <div className="relative h-10 bg-elevated rounded-lg border border-border/30 overflow-hidden">
                {/* Finish line */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent-orange/40 z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-accent-orange/10 to-transparent z-10" />

                {/* Progress bar */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 rounded-lg"
                  style={{
                    backgroundColor: `var(--color-${isWinner ? 'neon-yellow' : player.color})`,
                    opacity: isWinner ? 0.35 : 0.2,
                  }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />

                {/* Horse emoji */}
                <motion.div
                  className="absolute top-0 bottom-0 flex items-center text-2xl"
                  animate={{ left: `calc(${progress * 100}% - ${progress * 2}rem)` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  🏇
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Spacebar prompt */}
      {!isRaceOver && (
        <div className="text-center space-y-4 pt-2">
          <motion.div
            animate={justPressed ? { scale: [1, 0.92, 1] } : {}}
            transition={{ duration: 0.1 }}
          >
            <div className="inline-flex items-center gap-3 bg-elevated border border-border/50 rounded-2xl px-8 py-4">
              <kbd className="bg-card border border-border-light rounded-lg px-5 py-2 font-display text-lg text-text-primary shadow-[0_2px_0_0_var(--color-border)]">
                ESPACE
              </kbd>
              <span className="text-text-muted text-sm">pour avancer</span>
            </div>
          </motion.div>
          <p className="text-text-muted text-xs">Spam aussi vite que possible !</p>
        </div>
      )}
    </div>
  )
}

registry.register({
  id: 'horse-race',
  name: 'COURSE DE CHEVAUX',
  description: 'Spam la barre espace pour faire avancer ton cheval. Le premier a la ligne d\'arrivee gagne !',
  emoji: '🏇',
  color: 'neon-yellow',
  config: {
    minPlayers: 2,
    maxPlayers: 8,
  },
  tags: ['rapidite', 'simultane'],
  settings: [
    {
      id: 'distance',
      label: 'Distance',
      options: [
        { label: 'Court (20)', value: 20 },
        { label: 'Normal (40)', value: 40 },
        { label: 'Long (60)', value: 60 },
        { label: 'Marathon (100)', value: 100 },
      ],
      default: 40,
    },
  ],
  component: HorseRaceGame,
})
