import { motion } from 'motion/react'
import type { Player } from '@/types/game'

const colorAccentMap: Record<string, string> = {
  'neon-green': 'bg-accent',
  'neon-pink': 'bg-accent-pink',
  'neon-blue': 'bg-accent-blue',
  'neon-yellow': 'bg-accent-orange',
  'neon-purple': 'bg-accent-purple',
  'neon-orange': 'bg-accent-orange',
}

const colorTextMap: Record<string, string> = {
  'neon-green': 'text-accent',
  'neon-pink': 'text-accent-pink',
  'neon-blue': 'text-accent-blue',
  'neon-yellow': 'text-accent-orange',
  'neon-purple': 'text-accent-purple',
  'neon-orange': 'text-accent-orange',
}

const colorHighlightBg: Record<string, string> = {
  'neon-green': 'bg-accent/10',
  'neon-pink': 'bg-accent-pink/10',
  'neon-blue': 'bg-accent-blue/10',
  'neon-yellow': 'bg-accent-orange/10',
  'neon-purple': 'bg-accent-purple/10',
  'neon-orange': 'bg-accent-orange/10',
}

interface ScoreboardProps {
  players: Player[]
  scores: Record<string, number>
  compact?: boolean
}

export default function Scoreboard({ players, scores, compact }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const maxScore = Math.max(...Object.values(scores), 1)

  if (compact) {
    return (
      <div className="flex flex-col gap-[14px]">
        {sorted.map((player, i) => {
          const score = scores[player.id] ?? 0
          const pct = (score / maxScore) * 100
          const isFirst = i === 0 && score > 0

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col gap-[6px] rounded-[8px] px-[14px] py-[12px] ${
                isFirst ? (colorHighlightBg[player.color] ?? 'bg-accent/10') : 'bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-body text-[13px] font-semibold text-text-primary">
                  {player.name}
                </span>
                <span className={`font-mono text-[13px] font-bold ${
                  isFirst ? (colorTextMap[player.color] ?? 'text-accent') : 'text-text-secondary'
                }`}>
                  {score} pts
                </span>
              </div>
              <div className="w-full h-[6px] bg-elevated rounded-[3px] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                  className={`h-full rounded-[3px] ${colorAccentMap[player.color] ?? 'bg-accent'}`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {sorted.map((player, i) => {
        const score = scores[player.id] ?? 0
        const isFirst = i === 0 && score > 0

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-[12px] h-[48px] rounded-[8px] px-[12px] ${
              isFirst ? (colorHighlightBg[player.color] ?? 'bg-accent/10') : 'bg-elevated'
            }`}
          >
            <span className={`font-mono text-[16px] font-bold w-[20px] text-center ${
              isFirst ? (colorTextMap[player.color] ?? 'text-accent') : 'text-text-secondary'
            }`}>
              {i + 1}
            </span>
            <img
              src={player.avatar}
              alt=""
              className="w-[28px] h-[28px] rounded-full shrink-0"
            />
            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
              <span className="font-body text-[13px] font-semibold text-text-primary truncate">
                {player.name}
              </span>
              <span className={`font-mono text-[11px] ${
                isFirst ? (colorTextMap[player.color] ?? 'text-accent') : 'text-text-secondary'
              }`}>
                {score.toLocaleString()} pts
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
