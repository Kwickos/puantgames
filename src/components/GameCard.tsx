import { motion } from 'motion/react'
import { Users } from 'lucide-react'
import type { GameDefinition } from '@/types/game'

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  'neon-green': { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/20' },
  'neon-pink': { bg: 'bg-neon-pink/10', text: 'text-neon-pink', border: 'border-neon-pink/20' },
  'neon-blue': { bg: 'bg-neon-blue/10', text: 'text-neon-blue', border: 'border-neon-blue/20' },
  'neon-yellow': { bg: 'bg-neon-yellow/10', text: 'text-neon-yellow', border: 'border-neon-yellow/20' },
  'neon-purple': { bg: 'bg-neon-purple/10', text: 'text-neon-purple', border: 'border-neon-purple/20' },
  'neon-orange': { bg: 'bg-neon-orange/10', text: 'text-neon-orange', border: 'border-neon-orange/20' },
}

export default function GameCard({ game, index }: { game: GameDefinition; index: number }) {
  const colors = colorMap[game.color] ?? colorMap['neon-green']

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="gradient-border group transition-all duration-300 hover:scale-[1.02] hover:border-border-light">
        <div className="p-6">
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
            {game.emoji}
          </div>

          <h3 className="font-display text-lg text-text-primary mb-1 tracking-wide">
            {game.name}
          </h3>

          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            {game.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>{game.config.minPlayers}-{game.config.maxPlayers} joueurs</span>
            </div>
          </div>

          {game.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/30">
              {game.tags.map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider text-text-muted bg-surface-light px-2 py-0.5 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
