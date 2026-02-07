import { motion } from 'motion/react'
import { Users, Check } from 'lucide-react'
import type { GameDefinition } from '@/types/game'

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  'neon-green': { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/30' },
  'neon-pink': { bg: 'bg-neon-pink/10', text: 'text-neon-pink', border: 'border-neon-pink/30' },
  'neon-blue': { bg: 'bg-neon-blue/10', text: 'text-neon-blue', border: 'border-neon-blue/30' },
  'neon-yellow': { bg: 'bg-neon-yellow/10', text: 'text-neon-yellow', border: 'border-neon-yellow/30' },
  'neon-purple': { bg: 'bg-neon-purple/10', text: 'text-neon-purple', border: 'border-neon-purple/30' },
  'neon-orange': { bg: 'bg-neon-orange/10', text: 'text-neon-orange', border: 'border-neon-orange/30' },
}

export default function GameCard({ game, index, selected }: { game: GameDefinition; index: number; selected?: boolean }) {
  const colors = colorMap[game.color] ?? colorMap['neon-green']

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <div className={`gradient-border group transition-colors duration-200 ${
        selected
          ? `!border-2 ${colors.border}`
          : 'hover:border-border-light'
      }`}>
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-xl shrink-0`}>
              {game.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm text-text-primary tracking-wide truncate">
                  {game.name}
                </h3>
                {selected && (
                  <div className={`w-5 h-5 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                    <Check className={`w-3 h-3 ${colors.text}`} />
                  </div>
                )}
              </div>
              <p className="text-text-secondary text-xs leading-relaxed mt-0.5 line-clamp-2">
                {game.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
              <Users className="w-3 h-3" />
              <span>{game.config.minPlayers}-{game.config.maxPlayers} joueurs</span>
            </div>

            {game.tags.length > 0 && (
              <div className="flex gap-1.5">
                {game.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider text-text-muted bg-surface-light px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
