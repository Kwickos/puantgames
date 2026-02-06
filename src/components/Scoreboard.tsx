import { motion } from 'motion/react'
import type { Player } from '@/types/game'

const colorBgMap: Record<string, string> = {
  'neon-green': 'bg-neon-green/10',
  'neon-pink': 'bg-neon-pink/10',
  'neon-blue': 'bg-neon-blue/10',
  'neon-yellow': 'bg-neon-yellow/10',
  'neon-purple': 'bg-neon-purple/10',
  'neon-orange': 'bg-neon-orange/10',
}

const colorTextMap: Record<string, string> = {
  'neon-green': 'text-neon-green',
  'neon-pink': 'text-neon-pink',
  'neon-blue': 'text-neon-blue',
  'neon-yellow': 'text-neon-yellow',
  'neon-purple': 'text-neon-purple',
  'neon-orange': 'text-neon-orange',
}

interface ScoreboardProps {
  players: Player[]
  scores: Record<string, number>
  compact?: boolean
}

export default function Scoreboard({ players, scores, compact }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {sorted.map((player, i) => (
          <motion.div
            key={player.id}
            layout
            className={`flex items-center gap-2 ${colorBgMap[player.color] ?? 'bg-surface-light'} rounded-lg px-3 py-1.5`}
          >
            <img src={player.avatar} alt="" className="w-5 h-5 rounded-full" />
            <span className="text-text-secondary text-sm font-medium">{player.name}</span>
            <span className={`text-sm font-bold ${colorTextMap[player.color] ?? 'text-text-primary'}`}>
              {scores[player.id] ?? 0}
            </span>
            {i === 0 && scores[player.id] > 0 && (
              <span className="text-xs">👑</span>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((player, i) => {
        const score = scores[player.id] ?? 0
        const maxScore = Math.max(...Object.values(scores), 1)
        const pct = (score / maxScore) * 100

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="text-text-muted text-sm w-5 text-right font-bold">
              {i === 0 ? '👑' : `#${i + 1}`}
            </span>
            <img src={player.avatar} alt="" className="w-7 h-7 rounded-full" />
            <span className="text-text-primary font-medium w-24 truncate">{player.name}</span>
            <div className="flex-1 h-6 bg-surface-light rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                className={`h-full rounded-lg ${colorBgMap[player.color]?.replace('/10', '/30') ?? 'bg-neon-green/30'}`}
              />
            </div>
            <span className={`font-display text-lg ${colorTextMap[player.color] ?? 'text-text-primary'}`}>
              {score}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
